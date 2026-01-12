//TODO 當整個頁面載入完成後，隱藏 loader 並顯示主要內容
window.onload = function() {
    // 當頁面載入完畢後隱藏載入動畫，顯示內容
    var loader = document.getElementById('loader');
    var content = document.getElementById('whatcontent');
    if (loader && content) {
    loader.style.setProperty('display', 'none', 'important');
    content.style.setProperty('display', 'block', 'important');
    }
};
// ============ 0)（可選）JWT Header 設定 ============
/*
axios.defaults.headers.common.idtoken = getIdTokenSomehow();
*/

// ============ 1) 建立 service ============ 
// ============ 0) 初始化 ============
let backendService = null;
let chatService    = null;
document.addEventListener('DOMContentLoaded', () => {
  backendService = new BackendService();
  chatService = new ChatBackendService();
  initCartFromAPI(); // 頁面載入就打 API
});

// ============ 1) 共用狀態 / 工具 ============
const LS_KEY = 'cart_state_v1';
const LS_PICKUP_KEY = 'pickup_info_v1';

function loadState() { try { return JSON.parse(localStorage.getItem(LS_KEY)) || null; } catch { return null; } }
function saveState(items) { onAddToCart(items.id, items.qty); localStorage.setItem(LS_KEY, JSON.stringify(items)); }
function loadPickup() { try { return JSON.parse(localStorage.getItem(LS_PICKUP_KEY)) || {}; } catch { return {}; } }
function savePickup(info) { localStorage.setItem(LS_PICKUP_KEY, JSON.stringify(info)); }

// 若外部沒提供 updateSummary，避免报错
if (typeof window.updateSummary !== 'function') {
  window.updateSummary = function noop() {};
}

let cartItems = [];                  // 由 API 載入

// 你的既有節點
const cartList        = document.getElementById('cart-items');
const pickupPlace     = document.getElementById('pickup-place');
const pickupDatetime  = document.getElementById('pickup-datetime');
const pickupNote      = document.getElementById('pickup-note');

// ============ 2) 資料正規化 ============
function normalizeCartResponse(payload) {
  const candidates = [
    payload?.data?.data?.cartItems,
    payload?.data?.cartItems,
    Array.isArray(payload) ? payload : null,
    payload
  ].filter(Boolean);

  const rawList = candidates.find(arr => Array.isArray(arr)) || [];

  return rawList.map(row => {
    const cartItemId = row.id;
    const productId  = row.itemId ?? '';
    const embedded   = row.item || {};
    const ownerObj   = embedded.owner || {};
    console.log('商家名稱', ownerObj.name, ownerObj);
    const name  = row.name ?? embedded.name ?? '未命名商品';
    const price = Number(row.price ?? embedded.price ?? 0) || 0;
    const img   =
      embedded.mainImage ??
      embedded.imageUrl ??
      (Array.isArray(embedded.images) ? embedded.images[0] : undefined) ??
      'https://via.placeholder.com/120x120?text=No+Image';

    // API 已保證有 quantity，但保守起見仍做數字化
    const qty  = Number(row.quantity) || 1;
    const desc = embedded.description || '';

    // 只要有任一我們關心的欄位缺少，就標記需要補打詳情
    const needEnrich =
      !productId ||
      !embedded ||
      !embedded.mainImage ||              // 沒主圖
      typeof embedded.description === 'undefined';

    return {
      id: String(cartItemId),
      productId: String(productId),
      name,
      price,
      img,
      qty,
      description: desc,
      owner_name: ownerObj.name || '未知賣家',
      owner_photo: ownerObj.photoURL || '../image/default-avatar.png',
      checked: false,
      _needEnrich: needEnrich
    };
  });
}

async function onAddToCart(itemId, quantity) {
  try {
    const res = await backendService.updateCartItemQuantity(itemId, quantity);
    console.log('加入購物車成功：', res);
    await initCartFromAPI(); // 重新載入購物車
    Swal.fire({
      icon: 'success',
      title: '成功更新商品數量',
      showConfirmButton: false,
      timer: 1500
    });
  } catch (err) {
    console.error('加入購物車失敗：', err);
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: '更新商品數量失敗，請稍後再試'
    });
  }
}
// ============ 3) 取購物車 ============
async function initCartFromAPI() {
  try {
    const res  = await backendService.getMyCart();
    const list = normalizeCartResponse(res);
    cartItems  = Array.isArray(list) ? list : [];
    saveState(cartItems);


    (function restorePickup() {
      const info = loadPickup();
      if (pickupPlace && info.place)       pickupPlace.value    = info.place;
      if (pickupDatetime && info.datetime) pickupDatetime.value = info.datetime;
      if (pickupNote && info.note)         pickupNote.value     = info.note;
    })();

    // 先渲染，再補齊商品資訊
    renderCart();
    updateSummary();
    await enrichMissingProductFields(cartItems);
  } catch (err) {
    console.error('getMyCart 失敗：', err);
    const fallback = loadState();
    cartItems = Array.isArray(fallback) ? fallback : [];
    renderCart();
    updateSummary();
  }
}

// ============ 4) 取商品詳情補齊 ============
function getItemInfoAsync(id) {
  return new Promise((resolve, reject) => {
    backendService.getItemsInfo(
      id,
      (json) => resolve(json?.data || {}), // fnSuccess 會拿到 axios.response.data → 取 json.data
      (err)  => reject(err)
    );
  });
}

async function enrichMissingProductFields(items) {
  const need = items.map((it, idx) => ({ ...it, _idx: idx }))
                    .filter(it => it._needEnrich && it.productId);

  console.log('[enrich] 待補筆數 =', need.length, need.map(n => n.productId));
  if (need.length === 0) return;

  const jobs = need.map(async (it) => {
    const p = await getItemInfoAsync(it.productId);  // ← 直接拿到商品物件（json.data）
    console.log('[enrich] 詳情', it.productId, p);

    const name  = p.name ?? '未命名商品';
    const price = Number(p.price ?? 0) || 0;
    const img   = p.mainImage ?? p.imageUrl ??
                  (Array.isArray(p.imageUrl) ? p.imageUrl[0] : undefined) ??
                  'https://via.placeholder.com/120x120?text=No+Image';

    items[it._idx] = {
      ...items[it._idx],
      name:        items[it._idx].name || name,
      price:       items[it._idx].price || price,
      img:         items[it._idx].img || img,
      owner_name:  p.owner?.name || items[it._idx].owner_name,
      owner_photo: p.owner?.photoURL || items[it._idx].owner_photo,
      description: typeof p.description === 'string' ? p.description : (items[it._idx].description || ''),
      _needEnrich: false
    };
  });

  await Promise.all(jobs);
  saveState(items);
  renderCart();
  updateSummary();
}

// ============ 5) 渲染商品清單 ============
function renderCart() {
  if (!cartList) return;

  cartList.innerHTML = '';
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    cartList.innerHTML = `<div class="alert alert-light text-center">目前沒有商品</div>`;
    const all = document.getElementById('checkAll');
    if (all) all.checked = false;
    updateSummary();
    return;
  }

  const allChecked = cartItems.every(i => i.checked);
  const all = document.getElementById('checkAll');
  if (all) all.checked = allChecked;

  cartItems.forEach(item => {
    const li = document.createElement('div');
    li.className = 'list-group-item';
    // item.owner.photoURL = item.owner.photoURL || '../image/default-avatar.png';
    li.dataset.id = item.id;
    li.innerHTML = `
      <div class="d-flex align-items-start">
        <input class="form-check-input me-3 cart-check mt-1" type="checkbox" ${item.checked ? 'checked':''}>
        <img src="${item.img}" alt="${item.name}" class="item-thumb me-3">
        <div class="flex-grow-1">
          <div class="d-flex flex-column">
            <div class="d-flex justify-content-between align-items-start">
              <h6 class="mb-1">${item.name}</h6>
              <div class="price text-primary">NT$ ${Number(item.price || 0).toLocaleString('zh-TW')}</div>
            </div>
            <div class="muted-sm d-flex align-items-center">
              <img src="${item.owner_photo}" alt="${item.owner_name}" class="owner-avatar me-2">
              <p class="mb-0">${item.owner_name}</p>
            </div>
            <p class="mb-2">${item.description || ''}</p>
          </div>

          <div class="d-flex align-items-center gap-2 mt-2" style="font-size: 0.9rem;">
            <label class="muted-sm">數量</label>
            <input type="number" min="1" value="${item.qty}" class="form-control form-control-sm qty-input" style="width:100px">
            <div>
              <button class="btn btn-dark btn-look" type="button">查看</button>
              <button class="btn btn-light btn-sm ms-auto btn-remove" type="button">刪除</button>
              <button class="btn btn-primary btn-talk" type="button">與賣家聯絡</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // 綁事件：查看
    const lookBtn = li.querySelector('.btn-look');
    if (lookBtn) {
      lookBtn.style.cursor = 'pointer';
      lookBtn.addEventListener('click', () => {
        if (item.productId) {
          window.location.href = `../product/product.html?id=${encodeURIComponent(item.productId)}`;
        } else {
          alert('此商品無法連結到詳情頁');
        }
      });
    }

    // 綁事件：勾選
    const check = li.querySelector('.cart-check');
    if (check) {
      check.addEventListener('change', (e) => {
        item.checked = !!e.target.checked;
        const all = document.getElementById('checkAll');
        if (all) all.checked = cartItems.every(x => x.checked);
        saveState(cartItems);
        updateSummary();
      });
    }

    // 綁事件：數量
    const qtyInput = li.querySelector('.qty-input');
    if (qtyInput) {
      qtyInput.addEventListener('input', (e) => {
        const v = Math.max(1, Number(e.target.value) || 1);
        e.target.value = v;
        item.qty = v;
        saveState(cartItems);
        updateSummary();
      });
    }

    // 綁事件：刪除
    const removeBtn = li.querySelector('.btn-remove');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        cartItems = cartItems.filter(x => x.id !== item.id);
        saveState(cartItems);
        renderCart();
        updateSummary();
      });
    }

    //TODO 綁事件：聯絡賣家
    const talkBtn = li.querySelector('.btn-talk');
    if (talkBtn) {
      talkBtn.style.cursor = 'pointer';
      talkBtn.addEventListener('click', () => {
        if (item.owner_name) {
          openChatWithSeller(item.productId);
        } else {
          Swal.fire({
            icon: 'error',
            title: '無法聯絡賣家',
            text: '此商品無法取得賣家資訊',
          });
        }
      });
    }
    cartList.appendChild(li);
  });
}

async function openChatWithSeller(itemId) {
  if (!itemId) {
    Swal.fire({ icon: 'warning', title: '無法與賣家聊天', text: '缺少商品編號' });
    return;
  } else {
    openCloseChatInterface();
    chatService = new ChatBackendService();
    const res = await chatService.createRoom(itemId)
    res.then((data) => {
      const roomId = data?.roomId;
      if (roomId) {
        chatRoom = new ChatRoom(chatService, roomId, talkInterface);
        chatRoom.init();
      } else {
        Swal.fire({ icon: 'error', title: '無法建立聊天室', text: '請稍後再試' });
      }
    })
    .catch((err) => {
      console.error('建立聊天室失敗：', err);
      Swal.fire({ icon: 'error', title: '無法建立聊天室', text: '請稍後再試' });
    });
  }
}
// ============ 6) 更新右側結帳表 & 總額 ============
function updateSummary() {
  const tbody = document.querySelector('#checkout-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  let subtotal = 0;

  cartItems.filter(i => i.checked).forEach(i => {
    const sub = i.price * i.qty;
    subtotal += sub;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i.name}</td>
      <td class="text-center">${i.qty}</td>
      <td class="text-end">NT$ ${sub.toLocaleString()}</td>
    `;
    tbody.appendChild(tr);
  });

  const shipping = 0; // 面交固定 0
  const discount = 0;

  const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
  set('subtotal',     'NT$ ' + subtotal.toLocaleString());
  set('shipping-fee', 'NT$ ' + shipping.toLocaleString());
  set('discount',     '- NT$ ' + discount.toLocaleString());
  set('grand-total',  'NT$ ' + (subtotal + shipping - discount).toLocaleString());
}

// ============ 7) 事件：勾選 / 數量 / 刪除 ============
cartList.addEventListener('change', (e) => {
  const row = e.target.closest('.list-group-item');
  if (!row) return;
  const id  = row.dataset.id;
  const idx = cartItems.findIndex(i => i.id === id);
  if (idx < 0) return;

  if (e.target.classList.contains('cart-check')) {
    cartItems[idx].checked = e.target.checked;
  }
  if (e.target.classList.contains('qty-input')) {
    const v = Math.max(1, parseInt(e.target.value || '1', 10));
    cartItems[idx].qty = v;
    e.target.value = v;
  }

  saveState(cartItems);
  renderCart();    // 讓「全選」勾勾同步
  updateSummary();
});

cartList.addEventListener('click', async (e) => {
  if (!e.target.classList.contains('btn-remove')) return;
  const row = e.target.closest('.list-group-item');
  const id  = row?.dataset?.id;
  if (!id) return;

  try {
    // 1) 先打後端
    const res = await backendService.removeItemsFromCart(id);

    // 2) 兼容 axios response / JSON body 兩種殼
    const httpStatus = (typeof res?.status === 'number' ? res.status : undefined);
    const bodyStatus = (typeof res?.data?.status === 'number' ? res.data.status :
                       typeof res?.status === 'number' ? res.status : // res 是 body 且有 status
                       undefined);

    const ok = (typeof httpStatus === 'number' && httpStatus >= 200 && httpStatus < 300)
            || (typeof bodyStatus === 'number' && bodyStatus >= 200 && bodyStatus < 300);

    if (!ok) throw new Error(`Unexpected status: http=${httpStatus ?? '-'} body=${bodyStatus ?? '-'}`);
    // 3) 本地狀態更新（記得把 id 轉字串以防型別不一致）
    const targetId = String(id);
    cartItems = cartItems.filter(i => String(i.id) !== targetId);
    saveState(cartItems);
    renderCart();
    updateSummary();
    Swal.fire({
      icon: 'success',
      title: '商品已從購物車移除',
      showConfirmButton: false,
      timer: 1500
    });
  } catch (err) {
    console.error('removeItemsFromCart 失敗：', err);
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: '刪除失敗，請稍後再試'
    });
  }
});

// ============ 8) 全選 / 批次刪除 / 清空 ============
const checkAllEl = document.getElementById('checkAll');
if (checkAllEl) {
  checkAllEl.addEventListener('change', (e) => {
    const checked = e.target.checked;
    cartItems = cartItems.map(i => ({ ...i, checked }));
    saveState(cartItems);
    renderCart();
    updateSummary();
  });
}

const clearCheckedBtn = document.getElementById('clear-checked');
if (clearCheckedBtn) {
  clearCheckedBtn.addEventListener('click', async () => {
    const selected = cartItems.filter(i => i.checked);
    if (selected.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: '請先勾選要移除的商品'
      });
      return;
    }
    try {
      for (const it of selected) {
        await backendService.removeItemsFromCart(it.id);
      }
      cartItems = cartItems.filter(i => !i.checked);
      saveState(cartItems);
      renderCart();
      updateSummary();
    } catch (err) {
      console.error('批次移除失敗：', err);
      Swal.fire({
        icon: 'error', 
        title: 'Oops...',
        text: '移除已勾選失敗，請稍後再試'
      });
    }
  });
}

const clearAllBtn = document.getElementById('clear-all');
if (clearAllBtn) {
  clearAllBtn.addEventListener('click', async () => {
    if (!Swal.fire) return;
    try {
      const res = await backendService.clearMyCart();
        // 2) 兼容 axios response / JSON body 兩種殼
      const httpStatus = (typeof res?.status === 'number' ? res.status : undefined);
      const bodyStatus = (typeof res?.data?.status === 'number' ? res.data.status :
                        typeof res?.status === 'number' ? res.status : // res 是 body 且有 status
                        undefined);

      const ok = (typeof httpStatus === 'number' && httpStatus >= 200 && httpStatus < 300)
              || (typeof bodyStatus === 'number' && bodyStatus >= 200 && bodyStatus < 300);

      if (!ok) throw new Error(`Unexpected status: http=${httpStatus ?? '-'} body=${bodyStatus ?? '-'}`);
      cartItems = [];
      saveState(cartItems);
      renderCart();
      updateSummary();
      Swal.fire({
        icon: 'success',
        title: '購物車已清空',
        showConfirmButton: false,
        timer: 1500
      });
    } catch (err) {
      console.error('clearMyCart 失敗：', err);
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: '清空失敗，請稍後再試'
      });
    }
  });
}


// ============ 10) 面交資訊（儲存/還原 & 驗證） ============
[pickupPlace, pickupDatetime, pickupNote].forEach(el => {
  if (!el) return;
  el.addEventListener('input', () => {
    savePickup({
      place:    pickupPlace?.value?.trim() ?? '',
      datetime: pickupDatetime?.value ?? '',
      note:     pickupNote?.value?.trim() ?? '',
    });
  });
});



const checkoutBtn = document.getElementById('checkout-btn');
if (checkoutBtn) {
  checkoutBtn.addEventListener('click', () => {
    const selected = cartItems.filter(i => i.checked);
    if (selected.length === 0) return alert('請先勾選要結帳的商品');

    if (!pickupPlace?.value?.trim() || !pickupDatetime?.value) {
      return alert('請完整填寫面交資訊：地點與時間。');
    }

    // 只取 cart item 的 id
    const cartItemsId = selected.map(i => i.id);

    handleCreateOrder(cartItemsId);
  });
}

async function handleCreateOrder(cartItemsId) {
    try {
        const response = await backendService.createOrder(cartItemsId);
        Swal.fire({
            icon: 'success',
            title: '訂單建立成功！',
            text: '感謝您的購買，請等待賣家聯絡您進行面交，在個人頁面 > 我的購買清單查看。',
            showConfirmButton: true,
            timer: 2000
        });
        console.log("訂單建立成功:", response.data);
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: '訂單建立失敗',
            text: '請稍後再試或聯絡客服',
        });
        console.error("建立訂單失敗:", error);
    }
}