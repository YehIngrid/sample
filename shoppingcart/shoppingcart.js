// ================== Service ==================
let backendService = null;
let chatService = null;
let chatRoom = null;
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
function getItemInfoAsync(id) {
  return new Promise((resolve, reject) => {
    backendService.getItemsInfo(
      id,
      json => resolve(json?.data || {}),
      err => reject(err)
    );
  });
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

  const checkAll = document.getElementById('checkAll');
  if (checkAll) {
    checkAll.checked = cartItems.every(i => i.checked);
  }

  cartItems.forEach(item => {
    const el = document.createElement('div');
    el.className = 'list-group-item';
    el.dataset.id = item.id;

    el.innerHTML = `
      <div class="d-flex align-items-start">
        <input type="checkbox" class="form-check-input me-3 cart-check" ${item.checked ? 'checked' : ''}>
        <img src="${item.img}" class="item-thumb me-3">
        <div class="flex-grow-1">
          <h6>${item.name}</h6>
          <div class="d-flex align-items-center mb-1">
            <img src="${item.owner_photo}" class="owner-avatar me-2">
            <small>${item.owner_name}</small>
          </div>
          <p class="text-muted">${item.description}</p>

          <div class="d-flex align-items-center gap-2">
            <input type="number" class="form-control form-control-sm qty-input"
              min="1" value="${item.qty}" style="width:100px">
            <button class="btn btn-dark btn-look">查看</button>
            <button class="btn btn-light btn-remove">刪除</button>
            <button class="btn btn-primary btn-talk">聯絡賣家</button>
          </div>
        </div>
        <div class="text-primary ms-3">
          NT$ ${item.price.toLocaleString()}
        </div>
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

  if (e.target.classList.contains('cart-check')) {
    item.checked = e.target.checked;
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
    const roomId = res?.data?.roomId;
    if (!roomId) throw new Error();
    openCloseChatInterface();
    chatRoom = new ChatRoom(chatService, roomId, talkInterface);
    chatRoom.init();
  } catch {
    Swal.fire({ icon: 'error', title: '無法建立聊天室' });
  }
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

      const cartItemIds = selected.map(i => i.id);

      await backendService.createOrder(cartItemIds);

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
