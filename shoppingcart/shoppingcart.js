// ================== Service ==================
let backendService = null;
let chatService = null;
let isCheckingOut = false;

// ================== State ==================
const LS_KEY = 'cart_state_v1';
let cartItems = [];

// ================== DOM ==================
const cartList = document.getElementById('cart-items');

// ================== Utils ==================
function loadState() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveState() {
  localStorage.setItem(LS_KEY, JSON.stringify(cartItems));
}

// ================== Init ==================
document.addEventListener('DOMContentLoaded', async () => {
  backendService = new BackendService();
  chatService = new ChatBackendService();
  await initCartFromAPI();
});

// ================== API Init ==================
async function initCartFromAPI() {
  try {
    const res = await backendService.getMyCart();
    cartItems = normalizeCartResponse(res);
    saveState();
    renderCart();
    updateSummary();
    await enrichMissingProductFields(cartItems);
  } catch (err) {
    console.error('載入購物車失敗，改用 localStorage', err);
    cartItems = loadState();
    renderCart();
    updateSummary();
  }
}

// ================== Normalize ==================
function normalizeCartResponse(res) {
  const list =
    res?.data?.data?.cartItems ??
    res?.data?.cartItems ??
    [];

  return list.map(row => {
    const item = row.item || {};
    const owner = item.owner || {};

    return {
      id: String(row.id),
      productId: String(row.itemId || ''),
      name: item.name || row.name || '未命名商品',
      price: Number(item.price || row.price || 0),
      qty: Number(row.quantity || 1),
      img: item.mainImage || item.imageUrl || 'https://via.placeholder.com/120',
      description: item.description || '',
      owner_name: owner.name || '未知賣家',
      owner_photo: owner.photoURL || '../image/default-avatar.png',
      checked: false,
      _needEnrich: !item.description || !item.mainImage
    };
  });
}

// ================== Enrich ==================
async function getItemInfoAsync(id) {
  try {
    const res = await backendService.getItemsInfo(id);
    return res?.data || {};
  } catch (err) {
    throw err;
  }
}

async function enrichMissingProductFields(items) {
  const targets = items
    .map((it, idx) => ({ ...it, _idx: idx }))
    .filter(it => it._needEnrich && it.productId);

  if (targets.length === 0) return;

  await Promise.all(targets.map(async it => {
    const p = await getItemInfoAsync(it.productId);
    items[it._idx] = {
      ...items[it._idx],
      description: p.description || items[it._idx].description,
      img: p.mainImage || items[it._idx].img,
      owner_name: p.owner?.name || items[it._idx].owner_name,
      owner_photo: p.owner?.photoURL || items[it._idx].owner_photo,
      _needEnrich: false
    };
  }));

  saveState();
  renderCart();
  updateSummary();
}

// ================== Render ==================
function renderCart() {
  if (!cartList) return;

  cartList.innerHTML = '';

  if (cartItems.length === 0) {
    cartList.innerHTML = `<div class="alert alert-light text-center">目前沒有商品</div>`;
    return;
  }

  cartItems.forEach(item => {
    const el = document.createElement('div');
    el.className = 'list-group-item';
    el.dataset.id = item.id;

    el.innerHTML = `
      <div class="d-flex justify-content-between align-items-start mb-2">
          <div class="d-flex align-items-center mb-1">
            <img src="${item.owner_photo}" class="owner-avatar me-2">
            <small>${item.owner_name}</small>
          </div>
          <input type="checkbox" data-id="${item.id}" class="form-check-input me-3 cart-check" ${item.checked ? 'checked' : ''}>
      </div>
      <div class="d-flex align-items-start" style="margin-right: 2px;">
        <img src="${item.img}" class="item-thumb me-2">
        <div class="flex-grow-1" style="min-width: 80px; margin-right: 2px;">
          <h6>${item.name}</h6>
          <p class="text-muted ellipsis" style="font-size: 12px;">${item.description}</p>
        </div>
        <div class="text-end">
          <div style="font-size: 16px; font-weight: bold;">
            NT$ ${item.price.toLocaleString()}
          </div>
          <input type="number" class="form-control form-control-sm qty-input"
                min="1" value="${item.qty}">
        </div>
      </div>
      <div class="mt-1 d-flex justify-content-end gap-2">
        <button class="btn btn-sm btn-primary btn-look">查看商品</button>
        <button class="btn btn-sm btn-warning btn-talk">聯絡賣家</button>
        <button class="btn btn-sm btn-light btn-remove">移除</button>
      </div>
    `;
    cartList.appendChild(el);
  });
}

// ================== Events ==================
cartList.addEventListener('change', async e => {
  const row = e.target.closest('.list-group-item');
  if (!row) return;

  const item = cartItems.find(i => i.id === row.dataset.id);
  if (!item) return;

  // 處理勾選框
  if (e.target.classList.contains('cart-check')) {
    onItemCheckChange(e.target.dataset.id, e.target.checked);
    return; // 已經在 onItemCheckChange 裡 render 了，直接返回
  }
  
  if (e.target.classList.contains('qty-input')) {
    const v = Math.max(1, Number(e.target.value));
    e.target.value = v;
    item.qty = v;
    try {
      await backendService.updateCartItemQuantity(item.id, v);
    } catch {
      Swal.fire('數量更新失敗');
    }
  }

  saveState();
  renderCart();
  updateSummary();
});

cartList.addEventListener('click', async e => {
  const row = e.target.closest('.list-group-item');
  if (!row) return;

  const item = cartItems.find(i => i.id === row.dataset.id);
  if (!item) return;

  if (e.target.classList.contains('btn-look')) {
    location.href = `../product/product.html?id=${item.productId}`;
  }

  if (e.target.classList.contains('btn-remove')) {
    try {
      await backendService.removeItemsFromCart(item.id);
      cartItems = cartItems.filter(i => i.id !== item.id);
      saveState();
      renderCart();
      updateSummary();
    } catch {
      Swal.fire('刪除失敗');
    }
  }

  if (e.target.classList.contains('btn-talk')) {
    openChat(item.productId);
  }
});

// ================== Check All ==================
const checkAllEl = document.getElementById('checkAll');
if (checkAllEl) {
  checkAllEl.addEventListener('change', e => {
    // 如果是取消勾選，直接全部取消，不需要判斷賣家
    if (!e.target.checked) {
      cartItems.forEach(i => i.checked = false);
      saveState();
      renderCart();
      updateSummary();
      return;
    }

    // 如果是點擊「全選」
    if (cartItems.length > 0) {
      // 1. 取得第一個商品的賣家名稱作為基準
      const firstOwner = cartItems[0].owner_name;
      
      // 2. 檢查是否所有商品的賣家都跟第一個一樣
      const isSameOwner = cartItems.every(i => i.owner_name === firstOwner);

      if (!isSameOwner) {
        // 3. 如果有不同賣家，跳出警告並將勾選框還原成未選取
        e.target.checked = false; 
        Swal.fire({
          icon: 'warning',
          title: '無法全選',
          text: '購物車內含不同賣家的商品，請手動挑選同一位賣家的商品進行結帳。'
        });
        return;
      }
    }

    // 4. 通過檢查，執行全選
    cartItems = cartItems.map(i => ({ ...i, checked: e.target.checked }));
    saveState();
    renderCart();
    updateSummary();
  });
}
// ================== Summary ==================
function updateSummary() {
  const tbody = document.querySelector('#checkout-table tbody');
  if (!tbody) return;

  tbody.innerHTML = '';
  let total = 0;

  cartItems.filter(i => i.checked).forEach(i => {
    const sum = i.price * i.qty;
    total += sum;
    tbody.innerHTML += `
      <tr>
        <td>${i.name}</td>
        <td class="text-center">${i.qty}</td>
        <td class="text-end">NT$ ${sum.toLocaleString()}</td>
      </tr>
    `;
  });

  const totalEl = document.getElementById('grand-total');
  if (totalEl) totalEl.textContent = `NT$ ${total.toLocaleString()}`;
}
function showCheckoutLoading() {
  Swal.fire({
    title: '訂單處理中',
    text: '請稍候，請勿重新整理或重複點擊',
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
}

function closeCheckoutLoading() {
  Swal.close();
}

// ================== Chat ==================
async function openChat(productId) {
  try {
    const res = await chatService.createRoom(productId);
    const roomId = res?.data?.room?.id;
    if (!roomId) throw new Error("roomId not found");

    await openCloseChatInterface();

    if (!window.chatRoom) {
        window.chatRoom = new ChatRoom();
    }

    window.chatRoom.switchRoom(roomId);

  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: '無法建立聊天室',
      text: error.message || '請稍後再試'
    });
  }
}


async function openCloseChatInterface(){
  const talkInterface = document.getElementById('talkInterface');
  const res = await backendService.whoami();
  if(!res){
    Swal.fire({
      title: '請先登入會員',
      icon: 'warning',
      confirmButtonText: '確定'
    });
    return;
  }
  if (talkInterface.style.display === 'none' || talkInterface.style.display === '') {
    talkInterface.style.display = 'block'; // 顯示
    // chatService = new ChatBackendService();
    // const itemName = document.getElementById('product-name').textContent || '商品';
    // const userId = res.data.uid;
    // console.log("userId:", userId);
    // console.log("sellerId:", sellerId);
    // chatService.createRoom(itemId)
    //   .then((data) => {
    //     const roomId = data?.roomId;
    //     if (roomId) {
    //       chatRoom = new ChatRoom(chatService, roomId, talkInterface);
    //       chatRoom.init();
    //     } else {
    //       Swal.fire({ icon: 'error', title: '無法建立聊天室', text: '請稍後再試' });
    //     }
    //   })
    //   .catch((err) => {
    //     console.error('建立聊天室失敗：', err);
    //     Swal.fire({ icon: 'error', title: '無法建立聊天室', text: '請稍後再試' });
    //   });
  } else {
    talkInterface.style.display = 'none'; // 隱藏
  }
  console.log('chat open');
}

const checkoutBtn = document.getElementById('checkout-btn');
if (checkoutBtn) {
  checkoutBtn.addEventListener('click', async () => {

    // ===== 防重複送單 =====
    if (isCheckingOut) return;

    const selected = cartItems.filter(i => i.checked);
    if (selected.length === 0) {
      Swal.fire('請先勾選要結帳的商品');
      return;
    }

    const checkOrderRules = document.getElementById('checkOrderRules');
    if (checkOrderRules && !checkOrderRules.checked) {
      Swal.fire({
        icon: 'warning',
        title: '請同意訂購規則後再結帳'
      });
      return;
    }

    try {
      isCheckingOut = true;
      checkoutBtn.disabled = true;
      showCheckoutLoading();

      await backendService.createOrder(
        selected.map(i => ({
          id: i.id,
          qty: i.qty
        }))
      );

      closeCheckoutLoading();
      Swal.fire({
        icon: 'success',
        title: '訂單建立成功！',
        text: '請至「我的購買清單」查看訂單',
        confirmButtonText: '確定'
      });

      // 可選：成功後刷新購物車
      await initCartFromAPI();

    } catch (err) {
      console.error('建立訂單失敗', err);
      closeCheckoutLoading();
      Swal.fire({
        icon: 'error',
        title: '訂單建立失敗',
        text: '請稍後再試'
      });
    } finally {
      isCheckingOut = false;
      checkoutBtn.disabled = false;
    }
  });
}
const clearCheckedBtn = document.getElementById('clear-checked');

if (clearCheckedBtn) {
  clearCheckedBtn.addEventListener('click', () => {
    const checkedItems = cartItems.filter(i => i.checked);

    if (checkedItems.length === 0) {
      Swal.fire('沒有勾選任何商品');
      return;
    }

    // 取消勾選
    cartItems.forEach(item => {
      item.checked = false;
    });

    saveState();
    renderCart();
    updateSummary();
  });
}

const clearAllBtn = document.getElementById('clear-all');
if (clearAllBtn) {
  clearAllBtn.addEventListener('click', async () => {
    if (cartItems.length === 0) {
      Swal.fire('購物車已經是空的');
      return;
    }

    const result = await Swal.fire({
      title: '確定清空購物車？',
      text: '此操作無法復原',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '清空',
      cancelButtonText: '取消'
    });

    if (!result.isConfirmed) return;

    try {
      await Promise.all(
        cartItems.map(i => backendService.removeItemsFromCart(i.id))
      );

      cartItems = [];
      saveState();
      renderCart();
      updateSummary();
    } catch (err) {
      console.error(err);
      Swal.fire('清空失敗');
    }
  });
}
function onItemCheckChange(itemId, checked) {
  const item = cartItems.find(i => i.id === String(itemId));
  if (!item) return;

  item.checked = checked;

  // 如果你的需求是「一次只能勾選同一個賣家的商品」
  if (checked) {
    const currentOwner = item.owner_name; // 使用現有的欄位
    cartItems.forEach(i => {
      if (i.owner_name !== currentOwner) {
        i.checked = false;
      }
    });
  }

  saveState();
  renderCart();
  updateSummary();
}