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
let backendService = null;
document.addEventListener('DOMContentLoaded', () => {
  backendService = new BackendService();
  initCartFromAPI(); // 頁面載入就打 API
});

// ============ 2) 共用狀態 / 工具 ============
const LS_KEY = 'cart_state_v1';
const LS_STATUS_KEY = 'order_status_v1';
const LS_PICKUP_KEY = 'pickup_info_v1';

function loadState() { try { return JSON.parse(localStorage.getItem(LS_KEY)) || null; } catch { return null; } }
function saveState(items) { localStorage.setItem(LS_KEY, JSON.stringify(items)); }
function loadStatus() { return localStorage.getItem(LS_STATUS_KEY) || 'processing'; }
function saveStatus(v) { localStorage.setItem(LS_STATUS_KEY, v); }
function loadPickup() { try { return JSON.parse(localStorage.getItem(LS_PICKUP_KEY)) || {}; } catch { return {}; } }
function savePickup(info) { localStorage.setItem(LS_PICKUP_KEY, JSON.stringify(info)); }

let cartItems = [];                  // 由 API 載入
let orderStatus = loadStatus();

// 你的既有節點
const cartList        = document.getElementById('cart-items');
const statusSelect    = document.getElementById('order-status');
const pickupName      = document.getElementById('pickup-name');
const pickupPhone     = document.getElementById('pickup-phone');
const pickupPlace     = document.getElementById('pickup-place');
const pickupDatetime  = document.getElementById('pickup-datetime');
const pickupNote      = document.getElementById('pickup-note');

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

    const name  = row.name ?? embedded.name ?? '未命名商品';
    const price = Number(row.price ?? embedded.price ?? 0) || 0;
    const img   =
      embedded.mainImage ??
      embedded.imageUrl ??
      (Array.isArray(embedded.images) ? embedded.images[0] : undefined) ??
      'https://via.placeholder.com/120x120?text=No+Image';

    const qty  = Number(row.quantity) || 1;
    const desc = embedded.description || '';

    // 只要有任一我們關心的欄位缺少，就標記需要補打詳情
    const needEnrich =
      !productId ||
      !embedded ||
      !embedded.mainImage ||              // 沒主圖
      typeof embedded.description === 'undefined' || // 沒描述
      !embedded.owner;                    // 沒 owner（你 render 需要）

    return {
      id: String(cartItemId),
      productId: String(productId),
      name,
      price,
      img,
      qty,
      description: desc,
      owner: '',
      // 之後要加的四個欄位先留空位
      category: '',
      newOrOld: '',
      age: '',
      checked: false,
      _needEnrich: needEnrich
    };
  });
}


async function initCartFromAPI() {
  try {
    const res  = await backendService.getMyCart();
    const list = normalizeCartResponse(res);
    cartItems  = Array.isArray(list) ? list : [];
    saveState(cartItems);

    if (statusSelect) statusSelect.value = orderStatus;

    (function restorePickup() {
      const info = loadPickup();
      if (pickupName && info.name)         pickupName.value     = info.name;
      if (pickupPhone && info.phone)       pickupPhone.value    = info.phone;
      if (pickupPlace && info.place)       pickupPlace.value    = info.place;
      if (pickupDatetime && info.datetime) pickupDatetime.value = info.datetime;
      if (pickupNote && info.note)         pickupNote.value     = info.note;
    })();

    // 🔽 先渲染一版（若 item 已內嵌就會完整），再補齊缺的
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
    const p = await getItemInfoAsync(it.productId);  // ← 這裡直接拿到商品物件（json.data）
    console.log('[enrich] 詳情', it.productId, p);

    const name  = p.name ?? '未命名商品';
    const price = Number(p.price ?? 0) || 0;
    const img   = p.mainImage ?? p.imageUrl ??
                  (Array.isArray(p.imageUrl) ? p.imageUrl[0] : undefined) ??
                  'https://via.placeholder.com/120x120?text=No+Image';
    const owner = p.owner?.name ?? '未知賣家';

    items[it._idx] = {
      ...items[it._idx],
      name:        items[it._idx].name || name,
      price:       items[it._idx].price || price,
      img:         items[it._idx].img || img,
      owner,
      category:    p.category ?? '',
      newOrOld:    p.newOrOld ?? p.new_or_old ?? '',
      age:         p.age ?? '',
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
  cartList.innerHTML = '';
  if (cartItems.length === 0) {
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
    item.owner.photoURL = item.owner.photoURL || '../image/default-avatar.png';
    li.dataset.id = item.id;
    li.innerHTML = `
      <div class="d-flex align-items-start" id="lookInfo">
        <input class="form-check-input me-3 cart-check mt-1" type="checkbox" ${item.checked ? 'checked':''}>
        <img src="${item.img}" alt="${item.name}" class="item-thumb me-3">
        <div class="flex-grow-1">
          <div class="d-flex flex-column">
            <div class="d-flex justify-content-between align-items-start">
              <h6 class="mb-1">${item.name}</h6>
              <div class="price text-primary">NT$ ${item.price.toLocaleString()}</div>
            </div>
            <div class="muted-sm d-flex">
              <img src="${item.owner.photoURL}" alt="../image/default-avatar.png" class="owner-avatar me-1">
              <p>${item.owner}</p>
            </div>
            <p class="mb-2">${item.description || ''}</p>
          </div>

          <div class="d-flex align-items-center gap-2 mt-2" style="font-size: 0.9rem;">
            <label class="muted-sm">數量</label>
            <input type="number" min="1" value="${item.qty}" class="form-control form-control-sm qty-input">
            <button class="btn btn-outline-danger btn-sm ms-auto btn-remove">刪除</button>
          </div>
        </div>
      </div>
    `;
    const lookInfo = li.querySelector('#lookInfo');
    if (lookInfo) {
      lookInfo.style.cursor = 'pointer';
      lookInfo.addEventListener('click', () => {
        if (item.productId) {
          window.location.href = `../product/product.html?id=${item.productId}`;
        } else {
          alert('此商品無法連結到詳情頁');
        }
      });
    }
    cartList.appendChild(li);
  });
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

// ============ 9) 訂單狀態 ============
if (statusSelect) {
  statusSelect.value = orderStatus;
  statusSelect.addEventListener('change', () => {
    orderStatus = statusSelect.value;
    saveStatus(orderStatus);
  });
}

// ============ 10) 面交資訊（儲存/還原 & 驗證） ============
[pickupName, pickupPhone, pickupPlace, pickupDatetime, pickupNote].forEach(el => {
  if (!el) return;
  el.addEventListener('input', () => {
    savePickup({
      name:     pickupName?.value?.trim() ?? '',
      phone:    pickupPhone?.value?.trim() ?? '',
      place:    pickupPlace?.value?.trim() ?? '',
      datetime: pickupDatetime?.value ?? '',
      note:     pickupNote?.value?.trim() ?? '',
    });
  });
});

function validPhone(tel) {
  return /^09\d{8}$/.test(String(tel || '').replace(/[-\s]/g,''));
}

const checkoutBtn = document.getElementById('checkout-btn');
if (checkoutBtn) {
  checkoutBtn.addEventListener('click', () => {
    const selected = cartItems.filter(i => i.checked);
    if (selected.length === 0) return alert('請先勾選要結帳的商品');

    if (!pickupName?.value?.trim() || !pickupPhone?.value?.trim() || !pickupPlace?.value?.trim() || !pickupDatetime?.value) {
      return alert('請完整填寫面交資訊：姓名、電話、地點與時間。');
    }
    if (!validPhone(pickupPhone.value)) {
      return alert('電話格式不正確，請填寫 09xxxxxxxx。');
    }

    const payload = {
      status: orderStatus,
      shipping: {
        method: 'face_to_face_cod',
        fee: 0,
        pickup: {
          name: pickupName.value.trim(),
          phone: pickupPhone.value.trim(),
          place: pickupPlace.value.trim(),
          datetime: pickupDatetime.value,
          note: pickupNote?.value?.trim() ?? '',
        }
      },
      items: selected.map(i => ({ id: i.id, qty: i.qty })),
    };

    // TODO: 串接你的下單 API（這裡先示範）
    console.log('模擬送出訂單（面交）：', payload);
    alert('已建立訂單（面交付款，模擬）。請查看 console。');
  });
}
