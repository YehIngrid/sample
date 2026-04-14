import BackendService from '../BackendService.js';
import ChatBackendService from '../chatroom/ChatBackendService.js';
import { requireLogin } from '../default/default.js';

// ================== Service ==================
let backendService = null;
let chatService = null;
let isCheckingOut = false;
let chatInnerWin = null;

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, s =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s])
  );
}

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
  const loggedIn = await requireLogin();
  if (!loggedIn) return;

  backendService = new BackendService();
  chatService = new ChatBackendService();
  await initCartFromAPI();

  const iframe = document.getElementById('talkInterface');
  iframe.src = '../chatroom/chatroom.html';
// 必須等待 iframe 載入完成
  iframe.addEventListener('load', () => {
      try {
          // 取得 iframe 內部的 document
          const innerDoc = iframe.contentDocument;
          chatInnerWin = iframe.contentWindow;
          // 抓取裡面的元素，例如一個 ID 為 "message-input" 的輸入框
          const element = innerDoc.getElementById('chatList');
          console.log('抓到的元素：', element);
          //element.value = "從外部設定的文字";
      } catch (e) {
          console.error("無法存取：可能跨網域或尚未完全載入", e);
      }
  });
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

    applyPreselectedItem();
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
      ownerId: String(owner.accountId || owner.id || owner._id || row.sellerId || ''),
      owner_name: owner.name || '未知賣家',
      owner_photo: owner.photoURL || '../image/default-avatar.webp',
      checked: false,
      _needEnrich: !item.description || !item.mainImage || !owner.accountId
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
      ownerId: String(p.owner?.accountId || p.owner?.id || p.owner?._id || items[it._idx].ownerId || ''),
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
    cartList.innerHTML = `
    <div class="cart-empty">
      <i class="bi bi-bag-x"></i>
      <p>購物車是空的</p>
      <a href="../commodity/commodity.html" class="cart-empty-btn">去逛逛</a>
    </div>`;
    return;
  }

  cartItems.forEach(item => {
    const el = document.createElement('div');
    el.className = 'cart-card';
    el.dataset.id = item.id;
    el.dataset.itemId = item.productId;
    el.dataset.sellerId = item.ownerId;

    el.innerHTML = `
      <label class="cart-card-check">
        <input type="checkbox" data-id="${item.id}" class="form-check-input cart-check" ${item.checked ? 'checked' : ''}>
      </label>
      <div class="cart-card-body">
        <div class="cart-card-img-wrap">
          <img src="${item.img}" alt="${esc(item.name)}" class="cart-card-img">
        </div>
        <div class="cart-card-info">
          <div class="cart-card-seller">
            <img src="${item.owner_photo}" class="cart-card-seller-avatar">
            <span>${esc(item.owner_name)}</span>
          </div>
          <h6 class="cart-card-name">${esc(item.name)}</h6>
          <p class="cart-card-desc">${esc(item.description)}</p>
          <div class="cart-card-bottom">
            <div class="cart-card-price">NT$ ${item.price.toLocaleString()}</div>
            <div class="cart-card-qty">
              <label>數量</label>
              <input type="number" class="qty-input" min="1" value="${item.qty}">
            </div>
          </div>
          <div class="cart-card-actions">
            <button class="cart-action-btn btn-look"><i class="bi bi-eye"></i> 查看</button>
            <button class="cart-action-btn btn-talk"><i class="bi bi-chat-dots"></i> 聯絡賣家</button>
            <button class="cart-action-btn btn-remove"><i class="bi bi-trash3"></i></button>
          </div>
        </div>
      </div>
    `;
    cartList.appendChild(el);
  });
}

// ================== Events ==================
cartList.addEventListener('change', async e => {
  const row = e.target.closest('.cart-card');
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
  const row = e.target.closest('.cart-card');
  if (!row) return;

  const item = cartItems.find(i => i.id === row.dataset.id);
  if (!item) return;

  if (e.target.closest('.btn-look')) {
    location.href = `../product/product.html?id=${item.productId}`;
    return;
  }

  if (e.target.closest('.btn-remove')) {
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

  if (e.target.closest('.btn-talk')) {
    e.stopPropagation();
    openChatWithSeller(item.ownerId || row.dataset.sellerId);
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

  const subtotalEl = document.getElementById('subtotal');
  if (subtotalEl) subtotalEl.textContent = `NT$ ${total.toLocaleString()}`;
  const totalEl = document.getElementById('grand-total');
  if (totalEl) totalEl.textContent = `NT$ ${total.toLocaleString()}`;
  const mobileTotalEl = document.getElementById('grand-total-mobile');
  if (mobileTotalEl) mobileTotalEl.textContent = `NT$ ${total.toLocaleString()}`;
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
// 聊天室介面顯示與隱藏
// 聊天室介面顯示與隱藏
const chatopen = document.getElementById('chaticon');
const chatclose = document.getElementById('closechat');
const talkInterface = document.getElementById('talkInterface');
chatopen.addEventListener('click', function(e){
    toggleChatInterface();
})

// product.js 修正後的 openCloseChatInterface 函式
async function openCloseChatInterface() {
  if(await canEnterChat()) {
    if (talkInterface.style.display === 'none' || talkInterface.style.display === '') {
        talkInterface.style.display = 'block'; 
    }
  } else {
    talkInterface.style.display = 'none';
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
        text: '請至帳戶管理頁面中「消費訂單」查看',
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
// 手機版結帳按鈕：觸發桌面版同一邏輯
const checkoutBtnMobile = document.getElementById('checkout-btn-mobile');
if (checkoutBtnMobile && checkoutBtn) {
  checkoutBtnMobile.addEventListener('click', () => checkoutBtn.click());
}
const clearCheckedBtn = document.getElementById('clear-checked');

if (clearCheckedBtn) {
  clearCheckedBtn.addEventListener('click', async () => {
    const checkedItems = cartItems.filter(i => i.checked);

    if (checkedItems.length === 0) {
      Swal.fire('沒有勾選任何商品');
      return;
    }

    const result = await Swal.fire({
      title: `確定移除 ${checkedItems.length} 件商品？`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '移除',
      cancelButtonText: '取消'
    });

    if (!result.isConfirmed) return;

    try {
      await Promise.all(
        checkedItems.map(i => backendService.removeItemsFromCart(i.id))
      );
      cartItems = cartItems.filter(i => !i.checked);
      saveState();
      renderCart();
      updateSummary();
    } catch (err) {
      console.error(err);
      Swal.fire('移除失敗');
    }
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
  // 優先用 cart row id 查，找不到再 fallback 到 productId（供 applyPreselectedItem 用）
  const item = cartItems.find(i => i.id === String(itemId))
            ?? cartItems.find(i => i.productId === String(itemId));
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
let _iframeChatReady = false;
let _pendingChatSellerId = null;

// 監聽 iframe 的 chatReady 訊號
window.addEventListener('message', (e) => {
  if (e.data?.type === 'chatReady') {
    _iframeChatReady = true;
    // 如果有 pending 的賣家 ID，立刻發送
    if (_pendingChatSellerId) {
      talkInterface.contentWindow.postMessage(
        { type: 'openChatWithSeller', sellerId: _pendingChatSellerId }, '*'
      );
      _pendingChatSellerId = null;
    }
  }
});

function openChatWithSeller(targetSellerId) {
  if (!targetSellerId) {
    return Swal.fire({ icon: 'warning', title: '缺少sellerId' });
  }

  // 直接顯示 iframe（不用 toggle，避免非同步時序問題）
  talkInterface.style.display = 'block';

  if (_iframeChatReady) {
    // iframe 已 ready，直接發送
    talkInterface.contentWindow.postMessage(
      { type: 'openChatWithSeller', sellerId: targetSellerId }, '*'
    );
  } else {
    // iframe 還沒 ready，存起來等 chatReady 事件觸發時再發
    _pendingChatSellerId = targetSellerId;
  }
}
function applyPreselectedItem() {
  const selectedId = localStorage.getItem("selectedCartItem");
  if (selectedId) {
    // 1. 更新資料狀態
    onItemCheckChange(selectedId, true);
    
    // 2. 移除紀錄
    localStorage.removeItem("selectedCartItem");
    console.log('deleted selectedCartItem from localStorage');
    // 註：因為 onItemCheckChange 裡面已經有 renderCart() 和 updateSummary()，
    // 所以不需要再手動操作 DOM。
  }
}