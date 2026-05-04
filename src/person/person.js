import BackendService from '../BackendService.js';
import ChatBackendService from '../chatroom/ChatBackendService.js';
import wpBackendService from '../wpBackendService.js';

let backendService;
let chatService;
let goodsOrder;
const MY_ITEMS_LIMIT = 10;
let myItemsPage = 1;

// 訂單篩選狀態（filter tab → API status）
let currentSellStatus = 'all';
let currentBuyStatus  = 'all';
const TAB_TO_API_STATUS = {
  all:       null,
  pending:   'pending',
  preparing: 'preparing',
  shipping:  'shipping',
  delivered: 'delivered',
  review:    'review_pending',
  completed: 'completed',
  cancelled: 'canceled',
};
const myUid = localStorage.getItem("uid");
window.currentOrder = null;
// 當整個頁面載入完成後，隱藏 loader 並顯示主要內容
window.onload = function() {
    // 當頁面載入完畢後隱藏載入動畫，顯示內容
  var loader = document.getElementById('loader');
  var content = document.getElementById('whatcontent');
  if (loader && content) {
    loader.style.setProperty('display', 'none', 'important');
    content.style.setProperty('display', 'block', 'important');
  }
}
function htmlEncode(str) {
  if(str == null) return '';
  return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
}
// ── DOM refs ──
const mProfileName   = document.getElementById('mProfileName');
const mProfileInfo   = document.getElementById('mProfileInfo');
const mProfileAvatar = document.getElementById('mProfileAvatar');
const uid            = document.getElementById('uid');
const muid           = document.getElementById('muid');
const userRate       = document.getElementById('rate');
const userRate1      = document.getElementById('rate1');
const userRate2      = document.getElementById('rate2');
const showName       = document.getElementById('showName');
const showIntro      = document.getElementById('showIntro');
const profileName    = document.getElementById('profileName');
const profileInfo    = document.getElementById('profileInfo');
const profileAvatar  = document.getElementById('profileAvatar');

// 驗證前先顯示灰色預設頭像，其餘欄位留空
const DEFAULT_AVATAR = '../webP/default-avatar.webp';
if (mProfileAvatar) mProfileAvatar.src = DEFAULT_AVATAR;
if (profileAvatar)  profileAvatar.src  = DEFAULT_AVATAR;

// ── 等 whoami 驗證完成後再決定顯示內容（不依賴 localStorage 判斷登入狀態）──
window._authReady.then(loggedIn => {
  if (loggedIn) {
    // ── 已登入：從 localStorage 填入資料 ──
    const name      = localStorage.getItem('username') || '使用者名稱';
    const intro     = localStorage.getItem('intro')    || '尚未新增使用者介紹';
    const avatarUrl = localStorage.getItem('avatar');
    const rate      = localStorage.getItem('rate')     || '無法顯示';
    const uidVal    = localStorage.getItem('uid')      || '';
    const createdAt = localStorage.getItem('userCreatedAt');

    if (uid)  uid.textContent  = uidVal;
    if (muid) muid.textContent = uidVal;
    if (mProfileName) mProfileName.textContent = name;
    if (mProfileInfo) mProfileInfo.textContent = intro;
    if (profileName)  profileName.textContent  = name;
    if (showName)     showName.textContent      = name;
    if (profileInfo)  profileInfo.textContent  = intro;
    if (showIntro)    showIntro.textContent     = intro;
    if (userRate)     userRate.textContent      = rate;
    if (userRate1)    userRate1.textContent     = rate;
    if (userRate2)    userRate2.textContent     = rate;

    const validAvatar = avatarUrl && avatarUrl !== 'null' && avatarUrl !== '';
    const avatarSrc   = validAvatar ? avatarUrl : DEFAULT_AVATAR;
    if (mProfileAvatar) mProfileAvatar.src = avatarSrc;
    if (profileAvatar)  profileAvatar.src  = avatarSrc;

    // 底部導覽列頭像
    if (validAvatar) {
      document.querySelectorAll('.bottom-nav-item .nav-icon[src*="default-avatar"]').forEach(img => {
        img.src = avatarUrl;
        img.style.borderRadius = '50%';
        img.style.border = '1px solid #004b97';
        img.style.objectFit = 'cover';
      });
    }

    // 我的評價統計
    loadMyReviewStats();

    // 加入時間
    const showTimeEl = document.getElementById('showTime');
    if (showTimeEl) {
      if (!createdAt) {
        showTimeEl.textContent = '無法顯示';
      } else {
        const dt = new Date(createdAt);
        showTimeEl.textContent = isNaN(dt.getTime()) ? '無法顯示' : dt.toLocaleDateString('zh-TW', {
          timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit'
        });
      }
    }

  } else {
    // ── 未登入：灰色頭像 + 登入/註冊 + 停用所有入口 ──
    if (uid)  uid.textContent  = '';
    if (muid) muid.textContent = '';
    document.querySelectorAll('.uid').forEach(el => el.style.display = 'none');

    const loginLink = '<a href="../account/account.html" style="color:#004b97;text-decoration:none;font-weight:600;">登入 / 註冊</a>';
    if (mProfileName) mProfileName.innerHTML = loginLink;
    if (profileName)  profileName.innerHTML  = loginLink;
    if (mProfileInfo) mProfileInfo.textContent = '';
    if (profileInfo)  profileInfo.textContent  = '';
    if (showName)     showName.textContent  = '';
    if (showIntro)    showIntro.textContent  = '';
    if (userRate)     userRate.textContent   = '';
    if (userRate1)    userRate1.textContent  = '';
    if (userRate2)    userRate2.textContent  = '';
    const showTimeEl = document.getElementById('showTime');
    if (showTimeEl) showTimeEl.textContent = '';

    // 隱藏手機版登出按鈕
    const logoutMobileEl = document.getElementById('logoutMobile');
    if (logoutMobileEl) logoutMobileEl.style.display = 'none';

    // 停用快速操作
    document.querySelectorAll('.fastContainer .fastIcon, .fastContainer button').forEach(el => {
      el.style.opacity = '0.35';
      el.style.pointerEvents = 'none';
      el.style.cursor = 'default';
    });
    // 停用手機版商品訂單管理按鈕
    document.querySelectorAll('.itemContainer button').forEach(el => {
      el.style.opacity = '0.35';
      el.style.pointerEvents = 'none';
      el.style.cursor = 'default';
    });
    // 停用桌機側欄選單（除帳戶管理中心本身）
    document.querySelectorAll('.list-group-item[data-target]').forEach(el => {
      if (el.dataset.target !== 'account') {
        el.style.opacity = '0.35';
        el.style.pointerEvents = 'none';
        el.style.cursor = 'default';
      }
    });
    // 桌機版登出按鈕改為「登入」
    const lgLogout = document.getElementById('logout');
    if (lgLogout) {
      lgLogout.innerHTML = '登入 / 註冊';
      lgLogout.href = '../account/account.html';
      lgLogout.onclick = null;
    }
  }
});
// TODO 使用者加入時間
//更新資料動作
document.getElementById('update-profile').addEventListener('click', async () => {
    const displayName = document.getElementById('display-name').value.trim();
    const photoInput = document.getElementById('photo');
    const bio = document.getElementById('bio').value.trim();
    const loader1 = document.getElementById('loader1');
    const formData = new FormData();
    if(!displayName && !bio && photoInput.files.length === 0){
      console.log("沒有任何資料");
      Swal.fire({
        icon: "warning",
        title: "請填寫完整資料",
        text: "請檢查是否有空白欄位"
      });
      return;
    }
    if (displayName) formData.append('name', displayName);
    if (bio) formData.append('introduction', bio);
    if (photoInput.files.length > 0) formData.append('photo', photoInput.files[0]);
    
    try {
      Swal.fire({
        title: "確定要進行更新嗎?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "是，我要更新",
        cancelButtonText: "取消"
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            // ✅ 顯示 loader
            loader1.style.display = 'block';

            backendService = new BackendService();
            const response = await backendService.updateProfile(formData);

            console.log("更新成功：", response);
            console.log(response.data.introduction);

            await Swal.fire({
              icon: "success",
              title: "更新成功",
              text: "個人資料已更新"
            });

            // 更新 DOM
            mProfileName.textContent = localStorage.getItem("username") || "使用者名稱";
            mProfileInfo.textContent = localStorage.getItem("intro") || "使用者介紹";
            mProfileAvatar.src = localStorage.getItem('avatar') || '../image/default-avatar.webp';
            profileName.textContent = localStorage.getItem("username") || "使用者名稱";
            profileInfo.textContent = localStorage.getItem("intro") || "使用者介紹";
            profileAvatar.src = localStorage.getItem('avatar') || '../image/default-avatar.webp';

            window.location.reload(); // 重新載入頁面以顯示最新資料
          } catch (errorMessage) {
            console.error("更新失敗：", errorMessage);
            Swal.fire({
              icon: "error",
              title: "更新失敗",
              text: errorMessage
            });
          } finally {
            loader1.style.display = 'none';
          }
        }
      });
    } catch (error) {
      console.error("更新失敗：", error);
      Swal.fire({
        icon: "error",
        title: "更新失敗",
        text: "請稍後再試"
      });
    }
  });
  
const logoutButton = document.getElementById('logout');
logoutButton?.addEventListener('click', function() {
  Swal.fire({
    title: '確定要登出嗎？',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: '登出',
    cancelButtonText: '取消'
  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.removeItem('uid');
      localStorage.removeItem('username');
      localStorage.removeItem('intro');
      localStorage.removeItem('avatar');
      Swal.fire({
        icon: 'success',
        title: '登出成功',
        text: '您已成功登出'
      }).then(() => {
        window.location.href = '../account/account.html'; // 登出後跳轉到首頁
      });
    }
  });
});
const logoutMobileButton = document.getElementById('logoutMobile');
logoutMobileButton?.addEventListener('click', function() {
  Swal.fire({
    title: '確定要登出嗎？',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: '登出',
    cancelButtonText: '取消'
  }).then(async(result) => {
    if (result.isConfirmed) {
    try {
      if (!backendService) backendService = new BackendService();

      await backendService.logout();
      Swal.fire({
        icon: 'success',
        title: '登出成功',
        text: '您已成功登出'
      }).then(() => {
        window.location.href = '../account/account.html'; // 登出後跳轉到首頁
      });
    } catch (error) {
      Swal.fire({
        icon: 'error', 
        title: '登出失敗請稍後重試'
      })
    }
    }
  });
});


// ===== 常用帳號（Gmail）設定 =====
// ===== Google 帳號綁定 =====
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID'; // 後端給 client ID 後填入

function initGoogleBind() {
  if (typeof google === 'undefined') return;
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleBindCredential,
    auto_select: false,
    cancel_on_tap_outside: true,
  });
}
window.addEventListener('load', initGoogleBind);

async function handleGoogleBindCredential(response) {
  Swal.close();
  Swal.fire({ title: '綁定中...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
  try {
    // ⚠️ 後端 API 準備好後，取消下方註解並移除 fallback
    // const res = await axios.post('https://thpr.hlc23.dev/api/auth/google/bind',
    //   { token: response.credential }, { withCredentials: true });
    // const email = res.data?.email;

    // Fallback：後端好了之後移除
    const payload = JSON.parse(atob(response.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    const email = payload.email;

    const formData = new FormData();
    formData.append('email', email);
    await backendService.updateProfile(formData);
    document.getElementById('showEmail').textContent = email;
    Swal.fire({ icon: 'success', title: '綁定成功', text: email, timer: 2000, showConfirmButton: false });
  } catch {
    Swal.fire({ icon: 'error', title: '綁定失敗', text: '請稍後再試' });
  }
}

document.getElementById('setEmailBtn')?.addEventListener('click', async () => {
  const current = document.getElementById('showEmail')?.textContent?.trim();
  const currentVal = current === '尚未設定' ? '' : current;

  const { isConfirmed } = await Swal.fire({
    title: '設定常用帳號',
    html: `
      <input
        id="swal-email-input"
        type="email"
        autocomplete="email"
        class="swal2-input"
        placeholder="輸入 Email"
        value="${currentVal}"
      >
      <div style="display:flex;align-items:center;gap:8px;margin:14px 0 4px;">
        <div style="flex:1;height:1px;background:#e0e0e0;"></div>
        <span style="font-size:12px;color:#aaa;">或</span>
        <div style="flex:1;height:1px;background:#e0e0e0;"></div>
      </div>
      <div id="google-bind-btn" style="display:flex;justify-content:center;margin-top:10px;"></div>
    `,
    showCancelButton: true,
    confirmButtonText: '儲存',
    cancelButtonText: '取消',
    focusConfirm: false,
    didOpen: () => {
      if (typeof google !== 'undefined') {
        google.accounts.id.renderButton(
          document.getElementById('google-bind-btn'),
          { theme: 'outline', size: 'large', text: 'continue_with', locale: 'zh-TW' }
        );
      }
    },
    preConfirm: () => {
      const val = document.getElementById('swal-email-input').value.trim();
      if (!val) { Swal.showValidationMessage('請輸入 Email'); return false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { Swal.showValidationMessage('Email 格式不正確'); return false; }
      return val;
    }
  });

  if (!isConfirmed) return;
  const email = document.getElementById('swal-email-input')?.value?.trim();
  if (!email) return;

  try {
    const formData = new FormData();
    formData.append('email', email);
    await backendService.updateProfile(formData);
    document.getElementById('showEmail').textContent = email;
    Swal.fire({ icon: 'success', title: '儲存成功', timer: 1500, showConfirmButton: false });
  } catch {
    Swal.fire({ icon: 'error', title: '儲存失敗', text: '請稍後再試' });
  }
});

// 1. 修改原本的選單點擊監聽 (在 DOMContentLoaded 內)
document.querySelectorAll('[data-target]').forEach(item => {
  item.addEventListener('click', function (e) {
    e.preventDefault();
    const target = this.getAttribute('data-target');
    
    // 更新 URL 並執行路由
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('page', target);
    newUrl.searchParams.delete('orderId'); // 切換大分頁時移除訂單ID
    window.history.pushState({ page: target }, '', newUrl);
    
    handleRouting();
  });
});
// ==========================================
// 1. 全域事件監聽 (事件委派)
// ==========================================
document.addEventListener('click', function(e) {
  // 檢查點擊的是否為帶有 action-btn 類別的按鈕
  const btn = e.target.closest('.action-btn');
  if (!btn) return;

  const action = btn.getAttribute('data-action');
  const id = btn.getAttribute('data-id');
  
  // 執行原本的 handleAction，並傳入按鈕元素 btn 作為參考
  handleAction(action, id, btn);
});
function findTargetIdByOrderId(goodsOrders, orderId) {
  if (!goodsOrders) return null;

  const myUid = localStorage.getItem("uid");

  const order = goodsOrders.find(o => o.id == orderId);
  if (!order) return null;

  // 支援新欄位 id，向下相容 accountId
  const buyerId  = order.buyerUser?.id  ?? order.buyerUser?.accountId;
  const sellerId = order.sellerUser?.id ?? order.sellerUser?.accountId;

  // 如果我是買家 → 對方是賣家
  if (String(buyerId) == myUid) return sellerId;

  // 如果我是賣家 → 對方是買家
  if (String(sellerId) == myUid) return buyerId;

  return null;
}
// ==========================================
// 2. 修復後的 handleAction (不需 onclick)
// ==========================================
async function handleAction(action, id, el) {
  // 透過 el.closest 找到所在的 content-section
  const section = el.closest('.content-section');
  const sectionId = section ? section.id : '';

  if (action === 'checkInfo' || action === '查看') {
    const targetPage = (sectionId === 'sellProducts') ? 'sellOrderDetail' : 'buyerOrderDetail';
    
    // 更新 URL
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('page', targetPage);
    newUrl.searchParams.set('orderId', id);
    window.history.pushState({ page: targetPage, orderId: id }, '', newUrl);
    
    handleRouting(); // 觸發畫面切換
  } else if (action === '編輯商品') {
    console.log('編輯商品：', id);
    openEditDrawer(id, el);
  } else if (action === 'check') {
    const url = `../product/product.html?id=${encodeURIComponent(id)}`;
    window.location.href = url;
  } else if (action === '聯絡賣家' || action === 'contact') {
    let targetId = null;
    const myUid = localStorage.getItem("uid");

    // ✅ 1️⃣ 詳細頁優先
    if (window.currentOrder) {
      const order = window.currentOrder;

      targetId = order.buyerUser.accountId == myUid
        ? order.sellerUser.accountId
        : order.buyerUser.accountId;
    }

    // ✅ 2️⃣ fallback 列表
    if (!targetId) {
      targetId = findTargetIdByOrderId(goodsOrder, id);
    }

    if (!targetId) {
      console.error("找不到聊天對象", { id, goodsOrder, currentOrder: window.currentOrder });
      Swal.fire("錯誤", "找不到聊天對象", "error");
      return;
    }

    console.log("聊天對象 accountId:", targetId);
    openChatWithTarget(targetId);
  } else if (action === 'cancel') {
    if (confirm('確定要取消訂單嗎?')) {
      try {
        await backendService.cancelMyOrder(id);
        showOrderSwal('cancel').then(() => handleRouting()).then(() => window.location.reload());
      } catch (error) {
        Swal.fire({ title: '訂單取消失敗', icon: 'error', text: error });
      } 
    }
  } else if(action === '接受訂單') {
    try {
      await backendService.sellerAcceptOrders(id);
      showOrderSwal('accept').then(() => handleRouting()).then(() => window.location.reload());
    } catch (error) {
      Swal.fire({ title: '訂單同意失敗', icon: 'error', text: error });
    }
  } else if (action === '即將出貨') {
    try {
      await backendService.sellerDeliveredOrders(id);
      showOrderSwal('deliver').then(() => handleRouting()).then(() => window.location.reload());
    } catch (error) {
      Swal.fire({ title: '系統登記出貨失敗', icon: 'error', text: error });
    }
  } else if (action === '成功取貨') {
    try {
      await backendService.buyerCompletedOrders(id);
      await showOrderSwal('completed');
      await loadBuyerOrders(1);
    } catch (error) {
      Swal.fire({ title: '系統登記取貨失敗', icon: 'error', text: error });
    }
  } else if (action === '給對方評價') {
    openReviewModal(id, findTargetIdByOrderId(goodsOrder, id), sectionId === 'sellProducts' ? 'buyer' : 'seller');
  } else if (action === 'watchComment') {
    const isSell = el.closest('.content-section')?.id === 'sellProducts';
    openPartnerReviewModal(id, isSell);
  } else if (action === 'delete') {
    Swal.fire({
      title: "確定要下架並刪除此商品嗎？",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "是，我要下架",
      cancelButtonText: "取消"
    }).then(async (result) => {
      if (result.isConfirmed) {
        await backendService.deleteMyItems(id)
          .then(() => {
            Swal.fire({ icon: "success", title: "商品下架成功" });
            window.location.reload(); // 刪除後重新載入頁面以更新列表
          })
          .catch(err => Swal.fire({ icon: 'error', title: '刪除失敗', text: String(err) }));
      }
    });
  }
}

// ==========================================
// 3. 核心路由處理 (handleRouting)
// ==========================================
// 核心路由與資料載入
async function handleRouting() {
  const params = new URLSearchParams(window.location.search);
  const page = params.get('page') || 'account';
  const orderId = params.get('orderId');

  // 切換頁面時捲回頂部（桌機側欄點擊不會自動回頂）
  window.scrollTo({ top: 0, behavior: 'instant' });

  // 隱藏全部
  document.querySelectorAll('.content-section').forEach(sec => sec.classList.add('d-none'));

  // 預設表格顯示
  const sellTable = document.getElementById('sellTable');
  const sellTableTitle = document.getElementById('sellTableTitle');
  const buyTableTitle = document.getElementById('buyTableTitle');
  const buyTable = document.getElementById('buyTable');
  if (sellTableTitle) sellTableTitle.style.display = 'block';
  if (buyTableTitle) buyTableTitle.style.display = 'block';
  if (sellTable) sellTable.style.display = 'block';
  if (buyTable) buyTable.style.display = 'block';
  if (document.getElementById('sell-product')) document.getElementById('sell-product').classList.remove('d-none');
  if (document.getElementById('buy-product')) document.getElementById('buy-product').classList.remove('d-none');
  // 顯示目標頁
  const targetPane = document.getElementById(page);
  if (targetPane) targetPane.classList.remove('d-none');

  // 進入列表時恢復篩選 tabs 與分頁（進詳細頁才隱藏）
  document.getElementById('sellFilter')?.classList.remove('d-none');
  document.getElementById('buyFilter')?.classList.remove('d-none');
  document.getElementById('sellPagination')?.classList.remove('d-none');
  document.getElementById('buyPagination')?.classList.remove('d-none');

  // =========================
  // 詳細頁模式
  // =========================
  if (page === 'sellOrderDetail' && orderId) {
    document.getElementById('sellProducts')?.classList.remove('d-none');
    document.getElementById('sellOrderDetail')?.classList.remove('d-none');
    const sellCards = document.getElementById('sell-product');
    if (sellCards) sellCards.classList.add('d-none');
    sellTable.style.display = 'none';
    sellTableTitle.style.display = 'none';
    document.getElementById('sellFilter')?.classList.add('d-none');
    document.getElementById('sellPagination')?.classList.add('d-none');
    document.querySelector('#sellProducts .mobile-back-btn')?.classList.add('d-none');
    document.querySelector('#sellProducts .order-guide-wrap')?.classList.add('d-none');
    getDetail(orderId);
    return;
  }

  if (page === 'buyerOrderDetail' && orderId) {
    document.getElementById('buyProducts')?.classList.remove('d-none');
    document.getElementById('buyerOrderDetail')?.classList.remove('d-none');
    const buyCards = document.getElementById('buy-product');
    if (buyCards) buyCards.classList.add('d-none');
    buyTable.style.display = 'none';
    buyTableTitle.style.display = 'none';
    document.getElementById('buyFilter')?.classList.add('d-none');
    document.getElementById('buyPagination')?.classList.add('d-none');
    document.querySelector('#buyProducts .mobile-back-btn')?.classList.add('d-none');
    document.querySelector('#buyProducts .order-guide-wrap')?.classList.add('d-none');
    getDetail(orderId);
    return;
  }

  // =========================
  // 列表模式
  // =========================
  resetOrderView();

  // Active menu
  document.querySelectorAll('.list-group-item[data-target]').forEach(link => {
    link.classList.toggle('active', link.dataset.target === page);
  });

  // 載入資料
  if (!backendService) backendService = new BackendService();
  try {
    if (page === 'sellProducts') {
      window.currentOrder = null;
      currentSellStatus = 'all';
      document.querySelectorAll('#sellFilter .filter-tab').forEach(t => t.classList.toggle('active', t.dataset.status === 'all'));
      document.querySelector('#sellProducts tbody').innerHTML =
        `<tr><td colspan="4" class="text-center py-4"><div class="spinner-border spinner-border-sm text-secondary" role="status"></div></td></tr>`;
      document.getElementById('sell-product').innerHTML =
        `<div class="col-12 text-center py-4"><div class="spinner-border spinner-border-sm text-secondary" role="status"></div></div>`;
      await loadSellerOrders(1);
    } else if (page === 'buyProducts') {
      window.currentOrder = null;
      currentBuyStatus = 'all';
      document.querySelectorAll('#buyFilter .filter-tab').forEach(t => t.classList.toggle('active', t.dataset.status === 'all'));
      document.querySelector('#buyProducts tbody').innerHTML =
        `<tr><td colspan="5" class="text-center py-4"><div class="spinner-border spinner-border-sm text-secondary" role="status"></div></td></tr>`;
      document.getElementById('buy-product').innerHTML =
        `<div class="col-12 text-center py-4"><div class="spinner-border spinner-border-sm text-secondary" role="status"></div></div>`;
      await loadBuyerOrders(1);
    } else if (page === 'products') {
      myItemsPage = 1;
      await loadMyItems(1);
    }
  } catch (err) {
    console.error(err);
  }
}

// 賣家/買家 返回列表按鈕改為：
document.getElementById('backToSellTable')?.addEventListener('click', () => {
  const url = new URL(window.location.href);
  url.searchParams.set('page', 'sellProducts');
  url.searchParams.delete('orderId');
  history.pushState({}, '', url);
  handleRouting();
});
document.getElementById('backToBuyTable')?.addEventListener('click', () => {
  const url = new URL(window.location.href);
  url.searchParams.set('page', 'buyProducts');
  url.searchParams.delete('orderId');
  history.pushState({}, '', url);
  handleRouting();
});
// 5. 監聽瀏覽器返回並初始化

// 在 DOMContentLoaded 的最後一行加上 handleRouting();



// ── 訂單狀態自訂 SweetAlert ──────────────────────────────
const ORDER_SWAL_CONFIG = {
  accept:    { svg: '../svg/acceptOrder.svg',  anim: 'swal-anim-bounce',   title: '已同意訂單',          sub: '買家將收到通知' },
  deliver:   { svg: '../svg/readyDeliver.svg', anim: 'swal-anim-slide-up', title: '已登記出貨',          sub: '請買家留意收貨狀態' },
  completed: { svg: '../svg/completed.svg',    anim: 'swal-anim-pop-glow', title: '交易完成！',          sub: '感謝您使用拾貨寶庫' },
  cancel:    { svg: '../svg/cancelOrder.svg',  anim: 'swal-anim-shake',    title: '已取消訂單',          sub: '系統將自動通知對方', gray: true },
  review:    { svg: '../svg/giveStar.svg',     anim: 'swal-anim-spin-in',  title: '評價已送出',          sub: '感謝您留下評價' },
};

function showOrderSwal(type) {
  const cfg = ORDER_SWAL_CONFIG[type];
  if (!cfg) return Promise.resolve();
  return Swal.fire({
    html: `
      <div class="swal-order-icon ${cfg.anim}${cfg.gray ? ' swal-grayscale' : ''}">
        <img src="${cfg.svg}" alt="">
      </div>
      <div class="swal-order-title">${cfg.title}</div>
      <div class="swal-order-sub">${cfg.sub}</div>
    `,
    showConfirmButton: false,
    timer: 2200,
    timerProgressBar: true,
    customClass: { popup: 'swal-order-popup' },
  });
}
// ─────────────────────────────────────────────────────────

function resetOrderView() {
  document.getElementById('sellOrderDetail')?.classList.add('d-none');
  document.getElementById('buyerOrderDetail')?.classList.add('d-none');
  document.querySelector('#sellProducts .mobile-back-btn')?.classList.remove('d-none');
  document.querySelector('#buyProducts .mobile-back-btn')?.classList.remove('d-none');
  document.querySelector('#sellProducts .order-guide-wrap')?.classList.remove('d-none');
  document.querySelector('#buyProducts .order-guide-wrap')?.classList.remove('d-none');
}

async function loadSellerOrders(page) {
  try {
    const apiStatus = TAB_TO_API_STATUS[currentSellStatus] ?? null;
    const res = await backendService.getSellerOrders(page, apiStatus);
    const list = res?.data?.data?.orders ?? [];
    const pagination = res?.data?.data?.pagination ?? {};
    goodsOrder = list;
    renderSellerOrders(list);
    renderSellerCards(list);
    renderOrderPagination('sellPagination', pagination, loadSellerOrders);
    updateFilterTabCounts(list, 'sellFilter', pagination, currentSellStatus);
  } catch (err) {
    console.error('loadSellerOrders failed', err);
    const tbody = document.querySelector('#sellProducts tbody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">載入失敗，請重新整理</td></tr>`;
    const cards = document.getElementById('sell-product');
    if (cards) cards.innerHTML = `<div class="col-12 text-center text-muted py-4">載入失敗，請重新整理</div>`;
  }
}

async function loadBuyerOrders(page) {
  try {
    const apiStatus = TAB_TO_API_STATUS[currentBuyStatus] ?? null;
    const res = await backendService.getBuyerOrders(page, apiStatus);
    const list = res?.data?.data?.orders ?? [];
    const pagination = res?.data?.data?.pagination ?? {};
    goodsOrder = list;
    renderBuyerOrders(list);
    renderBuyerCards(list);
    renderOrderPagination('buyPagination', pagination, loadBuyerOrders);
    updateFilterTabCounts(list, 'buyFilter', pagination, currentBuyStatus);
  } catch (err) {
    console.error('loadBuyerOrders failed', err);
    const tbody = document.querySelector('#buyProducts tbody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">載入失敗，請重新整理</td></tr>`;
    const cards = document.getElementById('buy-product');
    if (cards) cards.innerHTML = `<div class="col-12 text-center text-muted py-4">載入失敗，請重新整理</div>`;
  }
}

// API status → filter tab data-status
const API_TO_TAB = { pending:'pending', preparing:'preparing', shipping:'delivered', delivered:'delivered', review_pending:'review', completed:'completed', canceled:'cancelled' };
// Filter tabs that show red dot when count > 0 (active/action-needed statuses)
const ACTIVE_TAB_STATUSES = new Set(['pending','preparing','delivered','review']);

function updateFilterTabCounts(list, filterId, pagination, activeStatus = 'all') {
  const container = document.getElementById(filterId);
  if (!container) return;
  const hasMore = (pagination.totalPages ?? 1) > 1;

  if (activeStatus === 'all') {
    // 「全部」tab：使用 pagination.totalItems（跨頁精確）
    // 各 status tab：從當頁 list 計算，hasMore 時加 + 表示「至少 X 筆」
    const total = pagination.totalItems ?? list.length;
    const counts = {};
    list.forEach(item => {
      const tabKey = API_TO_TAB[(item.status ?? '').toLowerCase()] ?? 'pending';
      counts[tabKey] = (counts[tabKey] || 0) + 1;
    });
    container.querySelectorAll('.filter-tab').forEach(btn => {
      const s = btn.dataset.status;
      let span = btn.querySelector('.tab-count');
      if (!span) { span = document.createElement('span'); span.className = 'tab-count'; btn.appendChild(span); }
      if (s === 'all') {
        span.textContent = hasMore ? `${total}+` : total;
      } else {
        const c = counts[s] || 0;
        span.textContent = (hasMore && c > 0) ? `${c}+` : c;
        btn.classList.toggle('tab-has-dot', c > 0 && ACTIVE_TAB_STATUSES.has(s));
      }
    });
  } else {
    // 特定 status tab：使用 pagination.totalItems（精確），紅點反映真實數量
    const total = pagination.totalItems ?? list.length;
    const tab = container.querySelector(`.filter-tab[data-status="${activeStatus}"]`);
    if (!tab) return;
    let span = tab.querySelector('.tab-count');
    if (!span) { span = document.createElement('span'); span.className = 'tab-count'; tab.appendChild(span); }
    span.textContent = hasMore ? `${total}+` : total;
    tab.classList.toggle('tab-has-dot', total > 0 && ACTIVE_TAB_STATUSES.has(activeStatus));
  }
}

async function loadOrderBadges() {
  try {
    const [sellRes, buyRes] = await Promise.all([
      backendService.getSellerOrders(1),
      backendService.getBuyerOrders(1)
    ]);
    const sellList = sellRes?.data?.data?.orders ?? [];
    const buyList  = buyRes?.data?.data?.orders  ?? [];
    const sellPag  = sellRes?.data?.data?.pagination ?? {};
    const buyPag   = buyRes?.data?.data?.pagination  ?? {};
    updateSidebarBadge('sellProducts', sellList, sellPag);
    updateSidebarBadge('buyProducts',  buyList,  buyPag);
  } catch { /* silent */ }
}

function updateSidebarBadge(target, list, pagination) {
  const total    = pagination.totalItems ?? list.length;
  const hasMore  = (pagination.totalPages ?? 1) > 1;
  const label    = hasMore ? `${total}+` : `${total}`;
  const hasActive = list.some(item => ACTIVE_TAB_STATUSES.has(API_TO_TAB[(item.status ?? '').toLowerCase()]));

  document.querySelectorAll(`[data-target="${target}"]`).forEach(el => {
    let badge = el.querySelector('.order-sidebar-count');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'order-sidebar-count';
      el.appendChild(badge);
    }
    badge.textContent = total > 0 ? label : '';

    let dot = el.querySelector('.order-red-dot');
    if (!dot) {
      dot = document.createElement('span');
      dot.className = 'order-red-dot';
      el.appendChild(dot);
    }
    dot.style.display = hasActive ? '' : 'none';
  });
}

function renderOrderPagination(containerId, pagination, loadFn) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const { currentPage = 1, totalPages = 1, hasPrevPage, hasNextPage } = pagination;
  if (totalPages < 1) { el.innerHTML = ''; return; }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  el.innerHTML = `
    <button class="order-page-btn" data-page="${currentPage - 1}" ${!hasPrevPage ? 'disabled' : ''}>&#8592; 上一頁</button>
    ${pages.map(p => `<button class="order-page-num ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`).join('')}
    <button class="order-page-btn" data-page="${currentPage + 1}" ${!hasNextPage ? 'disabled' : ''}>下一頁 &#8594;</button>
  `;
  el.querySelectorAll('button[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = parseInt(btn.dataset.page);
      if (!isNaN(p)) loadFn(p);
    });
  });
}

// TODO 更改大頭照預覽
document.getElementById('photo').addEventListener('change', function (e) {
  const preview = document.getElementById('myAvatarPreview');
  preview.innerHTML = ''; // 清除舊圖

  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    const img = document.createElement('img');
    img.src = event.target.result;
    img.style.width = '150px';
    img.style.height = '150px';
    img.style.margin = '10px';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '50%';
    img.style.border = '2px solid #ccc';
    img.style.boxShadow = '0 0 6px rgba(0,0,0,0.1)';
    preview.appendChild(img);
  };
  reader.readAsDataURL(file);
});
// 在 DOMContentLoaded 裡面加入
document.addEventListener('DOMContentLoaded', () => {
  backendService = new BackendService();

  // 初始化：根據當前 URL 決定顯示哪個頁面
  handleRouting();

  // 預載入側邊欄 / 手機按鈕的訂單計數紅點
  loadOrderBadges();

  // 監聽瀏覽器上一頁/下一頁
  window.onpopstate = function() {
    handleRouting();
  };

  // 訂單篩選 tabs
  document.getElementById('sellFilter')?.addEventListener('click', e => {
    const tab = e.target.closest('.filter-tab');
    if (!tab) return;
    currentSellStatus = tab.dataset.status;
    document.querySelectorAll('#sellFilter .filter-tab').forEach(t => t.classList.toggle('active', t === tab));
    loadSellerOrders(1);
  });
  document.getElementById('buyFilter')?.addEventListener('click', e => {
    const tab = e.target.closest('.filter-tab');
    if (!tab) return;
    currentBuyStatus = tab.dataset.status;
    document.querySelectorAll('#buyFilter .filter-tab').forEach(t => t.classList.toggle('active', t === tab));
    loadBuyerOrders(1);
  });
});

// ===== 工具 =====
const order_STATUS_MAP = {
  pending:        { text: '待確認', badge: 'order-badge-pending',    action: '接受訂單',         icon: '../svg/acceptOrder.svg'},
  preparing:      { text: '待出貨', badge: 'order-badge-preparing',  action: '即將出貨',         icon: '../svg/readyDeliver.svg'},
  shipping:       { text: '配送中', badge: 'order-badge-delivered',  action: '等待買家確認收貨',  icon: '../svg/waitBuyer.svg'},
  delivered:      { text: '待收貨', badge: 'order-badge-delivered',  action: '等待買家確認收貨',  icon: '../svg/waitBuyer.svg'},
  review_pending: { text: '待評價', badge: 'order-badge-completed',  action: '給對方評價',       icon: '../svg/giveStar.svg'},
  completed:      { text: '已完成', badge: 'order-badge-scored',     action: null,               icon: null},
  canceled:       { text: '已取消', badge: 'order-badge-canceled',   action: null,               icon: null}
}
const buyer_STATUS_MAP = {
  pending:        { text: '待確認', badge: 'order-badge-pending',    action: '聯絡賣家',   icon: '../svg/canChat.svg'},
  preparing:      { text: '待出貨', badge: 'order-badge-preparing',  action: '聯絡賣家',   icon: '../svg/canChat.svg'},
  shipping:       { text: '配送中', badge: 'order-badge-delivered',  action: '成功取貨',   icon: '../svg/acceptOrder.svg'},
  delivered:      { text: '待收貨', badge: 'order-badge-delivered',  action: '成功取貨',   icon: '../svg/acceptOrder.svg'},
  review_pending: { text: '待評價', badge: 'order-badge-completed',  action: '給對方評價', icon: '../svg/giveStar.svg'},
  completed:      { text: '已完成', badge: 'order-badge-scored',     action: null,         icon: null},
  canceled:       { text: '已取消', badge: 'order-badge-canceled',   action: null,         icon: null}
}
// 渲染評價操作區塊（review_pending 狀態）
// isSeller: true = 賣家視角，false = 買家視角
function renderReviewAction(item, isSeller, orderId) {
  const status = (item.status ?? '').toLowerCase();
  if (status !== 'review_pending') return null; // 非 review_pending，不處理

  const rp = item.reviewProgress ?? {};
  const hasReviewed = isSeller ? !!rp.sellerReviewed : !!rp.buyerReviewed;
  const deadlineHtml = rp.reviewDeadline
    ? `<div class="review-deadline-hint">評論截止：${fmtDate(rp.reviewDeadline)}</div>`
    : '';

  if (hasReviewed) {
    return `<div class="review-done-wrap">
      <span class="review-done-text">您已評論，等待對方評論</span>
      ${deadlineHtml}
    </div>`;
  }
  return `<div class="review-action-wrap">
    <button class="checkInfoBtn action-btn btn-row-action" data-action="給對方評價" data-id="${esc(orderId)}">
      <img src="../svg/giveStar.svg" alt="給對方評價icon"/>
      <div>給對方評價</div>
    </button>
    ${deadlineHtml}
  </div>`;
}

const nt = new Intl.NumberFormat('zh-TW', {
  style: 'currency', currency: 'TWD', maximumFractionDigits: 0
});

function fmtPrice(v) {
  if (v == null || isNaN(Number(v))) return '-';
  return nt.format(Number(v));
}

function fmtDate(v) {
  if (!v) return '-';
  const d = new Date(v);
  if (isNaN(d)) return '-';
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}/${m}/${day}`;
}

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, s =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s])
  );
}
function fmtOrderLabel(item) {
  const orderItems = item.orderItems;
  if (Array.isArray(orderItems) && orderItems.length > 0) {
    const first = orderItems[0];
    const productName = first?.item?.name || first?.name || item.name || '商品';
    const qty = first?.quantity ?? 1;
    const suffix = orderItems.length > 1 ? '…' : '';
    return `${esc(productName)} × ${qty}${suffix}`;
  }
  return esc(item.name || `訂單 ${item.id}`);
}
//TODO 剛剛調整按鈕樣式
function renderBuyerOrders(list) {
  const tbody = document.querySelector('#buyProducts tbody');
  if (!tbody) return;
  console.log('BuyerList:', list);
  if (!Array.isArray(list) || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-5">目前沒有訂單</td></tr>`;
    return;
  }
  const rows = list.map((item, i) => {
    const id       = item.id;
    const name     = esc(item.name);
    const label    = fmtOrderLabel(item);
    const price    = fmtPrice(item.totalAmount);
    const seller = item.sellerUser?.name ?? '';
    const type = item.type || '未知交易方式';
    const created  = fmtDate(item.createdAt);
    const key      = (item.status ?? 'listed').toLowerCase();
    const st       = buyer_STATUS_MAP[key] ?? buyer_STATUS_MAP.pending;
    const log = esc(item.log || '無詳細資訊');

  return `
      <tr data-id="${esc(id)}" style="animation-delay:${i * 0.05}s">
        <td>${label}</td>
        <td><span class="badge ${st.badge}">${st.text}</span></td>
        <td>${created}</td>
        <td>${price} 元</td>
        <td>
          <div class="d-flex gap-2 flex-wrap align-items-center">
            ${renderReviewAction(item, false, id) ?? (item.status !== 'canceled' && st.action ? `<button class="checkInfoBtn action-btn btn-row-action" data-action="${st.action}" data-id="${id}">
              <img src="${st.icon}" alt="${st.action}icon"/>
              <div>${st.action}</div>
            </button>` : '')}
            <button class="checkInfoBtn action-btn btn-row-action" data-action="checkInfo" data-id="${id}">
              <img src="../svg/orderInfo.svg" alt="訂單詳情icon"/>
              <div>訂單詳情</div>
            </button>
            ${item.status == 'pending' || item.status == 'preparing' ? `<button class="cancelOrderBtn action-btn btn-row-action" data-action="cancel" data-id="${id}"><img src="../svg/cancelOrder.svg" alt="取消訂單icon"/><div>取消訂單</div></button>` : ''}
            ${item.status !== 'canceled' ? `<button class="order-chat-btn action-btn" data-action="contact" data-id="${id}" title="聯絡對方"><img src="../svg/canChat.svg" alt="聯絡對方"/></button>` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
  tbody.innerHTML = rows;
}

function renderSellerOrders(list) {
  const tbody = document.querySelector('#sellProducts tbody');
  if (!tbody) return;
  console.log('List:' , list);
  if (!Array.isArray(list) || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-5">目前沒有訂單</td></tr>`;
    return;
  }
  const rows = list.map((item, i) => {
    const id       = item.id;
    const name     = esc(item.name);
    const label    = fmtOrderLabel(item);
    const price    = fmtPrice(item.totalAmount);
    const buyer = item.buyerUser?.name ?? '';
    const type = item.type || '未知交易方式';
    const created  = fmtDate(item.createdAt);
    const key = (item.status ?? 'listed').toLowerCase();
    const st  = order_STATUS_MAP[key] ?? order_STATUS_MAP.pending;
    const isDisabled = (st.action === '等待買家確認收貨') ? 'disabled' : '';
    return `
      <tr data-id="${esc(id)}" style="animation-delay:${i * 0.05}s">
        <td>${label}</td>
        <td><span class="badge ${st.badge}">${st.text}</span></td>
        <td>${created}</td>
        <td>
          <div class="d-flex gap-2 flex-wrap align-items-center">
            ${renderReviewAction(item, true, id) ?? (item.status !== 'canceled' && st.action ? `<button class="checkInfoBtn action-btn btn-row-action" data-action="${st.action}" data-id="${id}" ${isDisabled}>
              <img src="${st.icon}" alt="${st.action}icon"/>
              <div>${st.action}</div>
            </button>` : '')}
            <button class="checkInfoBtn action-btn btn-row-action" data-action="checkInfo" data-id="${id}">
              <img src="../svg/orderInfo.svg" alt="訂單詳情icon"/>
              <div>訂單詳情</div>
            </button>
            ${item.status == 'pending' || item.status == 'preparing' ? `<button class="cancelOrderBtn action-btn btn-row-action" data-action="cancel" data-id="${id}"><img src="../svg/cancelOrder.svg" alt="取消訂單icon"/><div>取消訂單</div></button>` : ''}
            ${item.status !== 'canceled' ? `<button class="order-chat-btn action-btn" data-action="contact" data-id="${id}" title="聯絡對方"><img src="../svg/canChat.svg" alt="聯絡對方"/></button>` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
  tbody.innerHTML = rows;
}

// ===== 渲染：桌機表格 =====
function renderTable(list = []) {
  const tbody = document.querySelector('#products tbody');
  if (!tbody) return;

  if (!Array.isArray(list) || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-5">目前沒有商品</td></tr>`;
    return;
  }

  const rows = list.map((item, i) => {
    const id       = item.id;
    const name     = esc(item.name);
    const price    = fmtPrice(item.price);
    const updated  = fmtDate(item.updatedAt);
    const created  = fmtDate(item.createdAt);
    const quantity = item.stock;
    const stockStyle = quantity === 0 ? 'color: #dc3545; font-weight: bold;' : '';

    return `
      <tr data-id="${esc(id)}" style="animation-delay:${i * 0.05}s">
        <td>${name}</td>
        <td><span style="${stockStyle}">${quantity}</span></td>
        <td>${price}</td>
        <td>${created}</td>
        <td>${updated}</td>
        <td>
          <div class="d-flex gap-3">
            <button class="btnSell d-flex justify-content-center align-items-center gap-1 action-btn btn-row-action" data-action="check" data-id="${id}">
              <img src="../svg/checkSell.svg" alt="查看商品按鈕"/>
              <div>查看商品</div>
            </button>
            <button class="btnSell d-flex justify-content-center align-items-center gap-1 action-btn btn-row-action" data-action="編輯商品" data-id="${id}">
              <img src="../svg/editSell.svg" alt="編輯此商品按鈕"/>
              <div>編輯商品</div>
            </button>
            <button class="btnSell d-flex justify-content-center align-items-center gap-1 action-btn btn-row-action" data-action="delete" data-id="${id}">
              <img src="../svg/deleteSell.svg" alt="永久下架此商品按鈕"/>
              <div>永久下架</div>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  tbody.innerHTML = rows;
}

// 表格事件處理
function onRowAction(e) {
  const btn = e.target.closest('.btn-row-action');
  if (!btn) return;

  const tr = btn.closest('tr');
  const id = tr?.dataset.id;
  const action = btn.dataset.action;
  if (!id) return;

  handleAction(action, id, tr);
}

// ===== 渲染：手機卡片 =====
function renderCards(list = []) {
  const wrap = document.getElementById('product-cards');
  if (!wrap) return;

  if (!Array.isArray(list) || list.length === 0) {
    wrap.innerHTML = `<div class="col-12 text-center text-muted py-5">目前沒有商品</div>`;
    return;
  }

  const html = list.map((item, i) => {
    const id       = item.id;
    const name     = esc(item.name);
    const price    = fmtPrice(item.price);
    const updated  = fmtDate(item.updatedAt);
    const created  = fmtDate(item.createdAt);
    const img      = esc(item.mainImage || item.imageUrl || '../image/placeholder.webp');
    const quantity = item.stock;
    const stockStyle = quantity === 0 ? 'color: #dc3545; font-weight: bold;' : '';

    return `
      <div class="col" data-id="${esc(id)}">
        <div class="cardContainer h-100" style="animation-delay:${i * 0.07}s">
          <div class="card-body d-flex flex-column">
            <div class="d-flex flex-row justify-content-between align-items-end">
              <div class="d-flex">
                <div class="bg-light">
                  <img src="${img}" alt="${name}" class="object-cover">
                </div>
                <div>
                  <h6 class="mb-0 text-truncate" title="${name}">${name}</h6>
                  <div class="small text-muted mb-2" style="font-size: 12px;">建立：${created}<br>更新：${updated}</div>
                  <div style="font-size: 12px; color: #004b97;">庫存：<span style="font-weight: bold; ${stockStyle}">${quantity}</span></div>
                </div>
              </div>
              <div class="fw-bold mb-2 text-end">${price}</div>
            </div>
            <div class="mt-auto d-flex justify-content-around gap-2">
              <button class="btnSell d-flex justify-content-center align-items-center gap-1 action-btn btn-row-action" data-action="check" data-id="${id}">
                <img src="../svg/checkSell.svg" alt="查看商品按鈕"/>
                <div>查看商品</div>
              </button>
              <button class="btnSell d-flex justify-content-center align-items-center gap-1 action-btn btn-row-action" data-action="編輯商品" data-id="${id}">
                <img src="../svg/editSell.svg" alt="編輯此商品按鈕"/>
                <div>編輯商品</div>
              </button>
              <button class="btnSell d-flex justify-content-center align-items-center gap-1 action-btn btn-row-action" data-action="delete" data-id="${id}">
                <img src="../svg/deleteSell.svg" alt="永久下架此商品按鈕"/>
                <div>永久下架</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  wrap.innerHTML = html;
}
function renderSellerCards(list = []) {
  const wrap = document.getElementById('sell-product');
  if (!wrap) return;

  if (!Array.isArray(list) || list.length === 0) {
    wrap.innerHTML = `<div class="col-12 text-center text-muted py-5">目前沒有商品</div>`;
    return;
  }

  const html = list.map((item, i) => {
    const id       = item.id;
    const name     = esc(item.name);
    const label    = fmtOrderLabel(item);
    const price    = fmtPrice(item.totalAmount);
    const updated  = fmtDate(item.updatedAt);
    const created  = fmtDate(item.createdAt);
    const key = (item.status ?? 'listed').toLowerCase();
    const st  = order_STATUS_MAP[key] ?? order_STATUS_MAP.pending;
    const isDisabled = (st.action === '等待買家確認收貨') ? 'disabled' : '';

    return `
      <div class="col" data-id="${esc(id)}">
        <div class="cardContainer h-100" style="animation-delay:${i * 0.07}s">
          <div class="card-body d-flex flex-column">
            <div class="d-flex flex-row justify-content-between align-items-start">
              <div style="flex:1;min-width:0;">
                <h6 class="mb-0 text-truncate" title="${name}" style="font-size:0.88rem;">${label}</h6>
                <div class="small text-muted mt-1 mb-2" style="font-size:12px;">建立日期：${created}</div>
              </div>
              <div class="d-flex flex-column align-items-end ms-2 flex-shrink-0">
                <span class="badge ${st.badge} mb-1">${st.text}</span>
                <div class="fw-bold">${price}</div>
              </div>
            </div>
            <div class="mt-auto d-flex gap-2 flex-wrap align-items-center">
              ${renderReviewAction(item, true, id) ?? (item.status !== 'canceled' && st.action ? `<button class="checkInfoBtn action-btn btn-card-action" data-id="${id}" data-action="${st.action}" ${isDisabled}>
                <img src="${st.icon}" alt="${st.action}icon"/>
                <div>${st.action}</div>
              </button>` : '')}
              <button class="checkInfoBtn action-btn btn-row-action" data-action="checkInfo" data-id="${id}">
                <img src="../svg/orderInfo.svg" alt="訂單詳情icon"/>
                <div>訂單詳情</div>
              </button>
              ${item.status == 'pending' || item.status == 'preparing' ? `<button class="cancelOrderBtn action-btn btn-row-action" data-action="cancel" data-id="${id}"><img src="../svg/cancelOrder.svg" alt="取消訂單icon"/><div>取消訂單</div></button>` : ''}
            </div>
            <div class="d-flex justify-content-between align-items-center mt-2">
              <div class="text-muted" style="font-size:11px;">訂單編號 ${id}</div>
              ${item.status !== 'canceled' ? `<button class="order-chat-btn action-btn" data-action="contact" data-id="${id}" title="聯絡對方"><img src="../svg/canChat.svg" alt="聯絡對方"/></button>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  wrap.innerHTML = html;
}
function renderBuyerCards(list = []) {
  const wrap = document.getElementById('buy-product');
  if (!wrap) return;

  if (!Array.isArray(list) || list.length === 0) {
    wrap.innerHTML = `<div class="col-12 text-center text-muted py-5">目前沒有商品</div>`;
    return;
  }

  const html = list.map((item, i) => {
    const id       = item.id;
    const name     = esc(item.name);
    const label    = fmtOrderLabel(item);
    const price    = fmtPrice(item.totalAmount);
    const created  = fmtDate(item.createdAt);
    const key      = (item.status ?? 'listed').toLowerCase();
    const st       = buyer_STATUS_MAP[key] ?? buyer_STATUS_MAP.pending;

    return `
      <div class="col" data-id="${esc(id)}">
        <div class="cardContainer h-100" style="animation-delay:${i * 0.07}s">
          <div class="card-body d-flex flex-column">
            <div class="d-flex flex-row justify-content-between align-items-start">
              <div style="flex:1;min-width:0;">
                <h6 class="mb-0 text-truncate" title="${name}" style="font-size:0.88rem;">${label}</h6>
                <div class="small text-muted mt-1 mb-2" style="font-size:12px;">建立日期：${created}</div>
              </div>
              <div class="d-flex flex-column align-items-end ms-2 flex-shrink-0">
                <span class="badge ${st.badge} mb-1">${st.text}</span>
                <div class="fw-bold">${price}</div>
              </div>
            </div>
            <div class="mt-auto d-flex gap-2 flex-wrap align-items-center">
              ${renderReviewAction(item, false, id) ?? (item.status !== 'canceled' && st.action ? `<button class="checkInfoBtn action-btn btn-card-action" data-id="${id}" data-action="${st.action}">
                <img src="${st.icon}" alt="${st.action}icon"/>
                <div>${st.action}</div>
              </button>` : '')}
              <button class="checkInfoBtn action-btn btn-row-action" data-action="checkInfo" data-id="${id}">
                <img src="../svg/orderInfo.svg" alt="訂單詳情icon"/>
                <div>訂單詳情</div>
              </button>
              ${item.status == 'pending' || item.status == 'preparing' ? `<button class="cancelOrderBtn action-btn btn-row-action" data-action="cancel" data-id="${id}"><img src="../svg/cancelOrder.svg" alt="取消訂單icon"/><div>取消訂單</div></button>` : ''}
            </div>
            <div class="d-flex justify-content-between align-items-center mt-2">
              <div class="text-muted" style="font-size:11px;">訂單編號 ${id}</div>
              ${item.status !== 'canceled' ? `<button class="order-chat-btn action-btn" data-action="contact" data-id="${id}" title="聯絡對方"><img src="../svg/canChat.svg" alt="聯絡對方"/></button>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  wrap.innerHTML = html;
}
// 卡片事件處理
function onCardAction(e) {
  const btn = e.target.closest('.btn-card-action');
  if (!btn) return;

  const card = btn.closest('[data-id]');
  const id = card?.dataset.id;
  const action = btn.dataset.action;
  if (!id) return;

  handleAction(action, id, card);
}
function renderOrderReviews(reviews, isSell) {
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return `<div class="review-empty" style="padding:12px 0;">尚無評論</div>`;
  }
  return reviews.map(r => {
    const isBuyerToSeller = r.role === 'BUYER_TO_SELLER';
    const roleLabel = isBuyerToSeller ? '買家 → 賣家' : '賣家 → 買家';
    const tags = Array.isArray(r?.tags) ? r.tags : [];
    const tagChips = tags.map(t => `<span class="review-display-chip ${(REVIEW_TAG_DELTA[t] ?? REVIEW_TAG_DELTA[t?.toLowerCase()] ?? 1) < 0 ? 'negative' : 'positive'}">${getTagLabel(t)}</span>`).join('');
    return `
      <div class="review-card mt-2">
        <div class="review-card__header">
          <img src="${r.reviewer?.photoURL ?? '../image/default-avatar.webp'}" alt="${r.reviewer?.name}" class="reviewer-avatar">
          <div class="review-card__meta">
            <span class="reviewerName">${r.reviewer?.name ?? '—'}</span>
            <span class="review-role-label">${roleLabel}</span>
          </div>
        </div>
        ${tagChips ? `<div class="review-card__chips">${tagChips}</div>` : ''}
        <div class="reviewText">${r.comment || '<span style="color:#aaa">（無文字評論）</span>'}</div>
      </div>`;
  }).join('');
}

// ===== 共用：按鈕動作（表格/卡片都走這裡） =====
async function getDetail(id) {
  try {
    const sellSection = document.getElementById('sellProducts');
    const buySection  = document.getElementById('buyProducts');

    const sellDetail = document.getElementById('sellOrderDetail');
    const buyDetail  = document.getElementById('buyerOrderDetail');

    const isSell = !sellSection.classList.contains('d-none');

    // 先顯示 loader
    const earlyInfoBox = isSell
      ? document.getElementById('sellOrderInfo')
      : document.getElementById('buyerOrderInfo');
    if (earlyInfoBox) earlyInfoBox.innerHTML =
      `<div class="d-flex justify-content-center py-5"><div class="spinner-border text-secondary" role="status"></div></div>`;

    const res = await backendService.getOrderDetails(id);
    const data = res.data.data;
    window.currentOrder = data;
    const orderStatusMap = {
      pending:        "訂單已建立，等待賣家接受",
      preparing:      "賣家已接受訂單，正在準備商品",
      delivered:      "賣家已出貨，等待買家確認收貨",
      review_pending: "買家已確認收貨，等待雙方評價",
      completed:      "訂單已完成",
      canceled:       "訂單已取消"
    };

    const orderTypeMap = {
      c2c: "面交取貨"
    };

    const infoBox = isSell
      ? document.getElementById('sellOrderInfo')
      : document.getElementById('buyerOrderInfo');

    const rp = data.reviewProgress ?? {};
    const deadlineSuffix = (data.status === 'review_pending' && rp.reviewDeadline)
      ? `<span style="font-size:0.8em;color:#e07b39;margin-left:4px;">（截止：${fmtDate(rp.reviewDeadline)}）</span>`
      : '';

    // 確保 tag meaning cache 有資料，供 renderOrderReviews 顯示中文
    if (Object.keys(_tagMeaningCache).length === 0) {
      try {
        const tagRes = await backendService.getReviewTags();
        (tagRes?.data?.data?.tags ?? []).forEach(t => { _tagMeaningCache[t.tag] = t.meaning; });
      } catch (e) { /* 靜默失敗，fallback 到本地 labels */ }
    }

    const reviewBoth = await backendService.getOrderBothReviews(id);
    const reviewBothData = reviewBoth.data?.data;

    infoBox.innerHTML = `
      <ul style="font-size: 1rem;">
        <li><span class="orderstyle">訂單編號</span>${id}</li>
        <li><span class="orderstyle">建立日期</span>${new Date(data.createdAt).toLocaleDateString()}</li>
        <li><span class="orderstyle">商品狀態</span>${orderStatusMap[data.status] ?? data.status}${deadlineSuffix}</li>
        <li><span class="orderstyle">交貨方式</span>${orderTypeMap[data.type]}</li>
        <li>
          <span class="orderstyle">${isSell ? '買家姓名' : '賣家姓名'}</span>
          ${isSell ? data.buyerUser.name : data.sellerUser.name}
        </li>
        <div class="d-flex gap-2">
          <button class="checkInfoBtn action-btn" data-action="contact" data-id="${id}" style="font-size: 1rem;">與對方聯絡<img src="../svg/canChat.svg" alt="與對方聯絡，開啟聊天室icon"/></button>
          <button class="checkInfoBtn action-btn" data-action="watchComment" data-id="${id}" style="font-size: 1rem;">查看對方評論<img src="../svg/reviewsIcon.svg" alt="查看對方評論icon" style="border-radius: 50%; width: 20px;"/></button>
        </div>
        <li style="text-align:end;">
          <span class="orderstyle">總計</span>
          <span style="font-weight:600;color:#004b97">
            ${data.totalAmount}
          </span> 元
        </li>
      </ul>
      <hr style="border:none;border-top:1px dashed #7bbfb9;margin:12px 0;">
      <span class="orderstyle">訂購商品</span>
      <table class="align-middle responsive-table mt-3 mb-3" style="border: none;">
        <thead>
          <tr>
            <th>商品編號</th>
            <th>商品照片</th>
            <th>名稱</th>
            <th>購買數量</th>
            <th>單價(元)</th>
          </tr>
        </thead>
        <tbody class="itemlist"></tbody>
      </table>
      <span class="orderstyle">此訂單評價</span>
      ${renderOrderReviews(reviewBothData?.reviews ?? [], isSell)}
    `;

    const itemlist = infoBox.querySelector('.itemlist');
    const items = data.orderItems;

    if (!Array.isArray(items) || items.length === 0) {
      itemlist.innerHTML = '<tr><td colspan="5">沒有商品資料</td></tr>';
    } else {
      itemlist.innerHTML = items.map(item => `
        <tr>
          <td data-label="商品編號">${item.itemId}</td>
          <td data-label="商品照片">
            <img src="${item.item.mainImage || '../image/placeholder.webp'}"
                 style="width:80px;height:80px;object-fit:cover;cursor:pointer;border-radius:6px;transition:opacity 0.2s;"
                 onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
          </td>
          <td data-label="名稱">${htmlEncode(item?.item.name)}</td>
          <td data-label="購買數量">${item.quantity}</td>
          <td data-label="單價(元)">${item.price}</td>
        </tr>
      `).join('');
      itemlist.querySelectorAll('td[data-label="商品照片"] img').forEach(img => {
        img.addEventListener('click', () => {
          Swal.fire({
            imageUrl: img.src,
            imageAlt: '商品照片',
            showConfirmButton: false,
            showCloseButton: true,
            background: '#fff',
            width: 'auto',
          });
        });
      });
    }

    updateStatusUI(data, isSell ? sellDetail : buyDetail);

    // 切換畫面（確認用戶還在詳細頁，避免 async 回來時已返回列表）
    if (!new URLSearchParams(window.location.search).get('orderId')) return;
    if (isSell) {
      document.getElementById('sellTable').style.display = 'none';
      sellDetail.classList.remove('d-none');
    } else {
      document.getElementById('buyTable').style.display = 'none';
      buyDetail.classList.remove('d-none');
    }

  } catch (error) {
    Swal.fire({
      title: 'Oops',
      icon: 'error',
      text: error.message || error
    });
  }
}
function openOrderDetail(id) {
  const url = new URL(window.location.href);
  // 保持目前的 page (sellProducts 或 buyProducts)，只設定 orderId
  url.searchParams.set('orderId', id);
  
  window.history.pushState({ orderId: id }, '', url);
  handleRouting(); // 觸發切換
}
window.addEventListener('popstate', (event) => {
  if (!event.state || event.state.page !== 'detail') {
    showOrderList();
  }
});
function showOrderList() {
  const url = new URL(window.location.href);
  url.searchParams.delete('orderId'); // 移除 ID

  window.history.pushState({}, '', url);
  handleRouting(); // 觸發切換，會自動回到列表
}

// 時間處理
const formatter = new Intl.DateTimeFormat('zh-TW', {
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hour12: false
});

// 輸出類似：2025/09/20 12:33
// const updateStatusUI = (data) => {
//   const logs = data.logs || [];
//   const statusItems = document.querySelectorAll('.status-item');
  
//   // 1. 取得取消紀錄（如果有）
//   const cancelLog = logs.find(log => log.status === 'canceled');
  
//   // 2. 第一步：徹底重置所有節點到「初始灰色 (yet)」狀態
//   statusItems.forEach(item => {
//     const img = item.querySelector('img');
//     const timeBox = item.querySelector('.timestamp');
//     const text = item.querySelector('.stateText');

//     // 還原圖片：將 .svg 或 cancel.svg 換回 yet.svg
//     // 假設你的原始圖名格式是 statusnameyet.svg
//     let currentSrc = img.src;
//     if (currentSrc.includes('cancel.svg')) {
//       // 如果原本變成了 cancel.svg，要根據 data-status 換回原本的 yet 圖
//       const statusName = item.getAttribute('data-status');
//       img.src = `../svg/${statusName}yet.svg`; 
//     } else if (!currentSrc.includes('yet.svg')) {
//       img.src = currentSrc.replace('.svg', 'yet.svg');
//     }
    
//     timeBox.innerText = '';
//     item.style.opacity = '1'; 
//     item.classList.remove('active');
    
//     // 如果你有手動改過 stateText，也要記得在這裡還原（例如：從「訂單已取消」改回原本文字）
//     // text.innerText = ... (視你的 HTML 結構而定)
//   });

//   // 3. 第二步：根據 logs 填入正確狀態
//   statusItems.forEach((item) => {
//     const statusName = item.getAttribute('data-status');
//     const logEntry = logs.find(log => log.status === statusName);
//     const img = item.querySelector('img');
//     const timeBox = item.querySelector('.timestamp');

//     // 情況 A：這是一個已取消的訂單
//     if (cancelLog) {
//       if (logEntry) {
//         // 取消前已完成的步驟：顯示彩色
//         img.src = img.src.replace('yet.svg', '.svg');
//         timeBox.innerText = formatter.format(new Date(logEntry.timestamp));
//       } else {
//         img.src = '../svg/cancel.svg';
//         timeBox.innerText = formatter.format(new Date(cancelLog.timestamp));
//       }
//     } 
//     // 情況 B：正常流程
//     else if (logEntry) {
//       img.src = img.src.replace('yet.svg', '.svg');
//       timeBox.innerText = formatter.format(new Date(logEntry.timestamp));
//       item.classList.add('active');
//     }
//   });
// };

const updateStatusUI = (data, container) => {
  const logs = data.logs || [];
  const statusItems = container.querySelectorAll('.status-item');

  const cancelLog = logs.find(log => log.status === 'canceled');
  const scoreLog  = logs.find(log => log.status === 'completed');

  const defaultTextMap = {
    pending:        "訂單已建立<br>等待賣家接受",
    preparing:      "賣家已接受訂單<br>正在準備商品",
    delivered:      "賣家已出貨<br>等待買家確認收貨",
    review_pending: "買家已確認收貨<br>等待雙方評價",
    completed:      "訂單已完成",
  };
  // statusName → SVG 檔名前綴（review_pending → completed.svg、completed → scored.svg）
  const svgNameMap = {
    review_pending: 'completed',
    completed:      'scored',
  };

  // 1️⃣ reset
  statusItems.forEach(item => {
    const img = item.querySelector('img');
    const timeBox = item.querySelector('.timestamp');
    const text = item.querySelector('.stateText');
    const statusName = item.dataset.status;

    // reset icon
    const svgPrefix = svgNameMap[statusName] ?? statusName;
    img.src = `../svg/${svgPrefix}yet.svg`;
    timeBox.innerText = '';
    item.classList.remove('active');
    item.style.display = '';

    if (text) text.innerHTML = defaultTextMap[statusName];
  });

  // 2️⃣ fill logs
  let cancelShown = false;
  statusItems.forEach(item => {
    const statusName = item.dataset.status;
    const logEntry = logs.find(l => l.status === statusName);
    const img = item.querySelector('img');
    const timeBox = item.querySelector('.timestamp');
    const text = item.querySelector('.stateText');

    // 🔥 有取消紀錄（且尚未評分完成）
    if (cancelLog && !scoreLog) {

      if (logEntry) {
        // cancel 前完成的流程 → 彩色
        img.src = img.src.replace('yet.svg', '.svg');
        timeBox.innerText = formatter.format(new Date(logEntry.timestamp));
        item.classList.add('active');
      } else if (window.innerWidth <= 991) {
        // 手機版：只顯示第一個 cancel icon，其餘隱藏
        if (!cancelShown) {
          img.src = '../svg/cancel.svg';
          timeBox.innerText = formatter.format(new Date(cancelLog.timestamp));
          if (text) text.innerHTML = '訂單已取消';
          cancelShown = true;
        } else {
          item.style.display = 'none';
        }
      } else {
        // 桌機版：所有未完成的步驟都補上 cancel icon + 時間
        img.src = '../svg/cancel.svg';
        timeBox.innerText = formatter.format(new Date(cancelLog.timestamp));
        if (text) text.innerHTML = '訂單已取消';
      }
    }
    // 🟢 正常流程
    else if (logEntry) {
      img.src = img.src.replace('yet.svg', '.svg');
      timeBox.innerText = formatter.format(new Date(logEntry.timestamp));
      item.classList.add('active');
    }
  });
};

(() => {
  'use strict';

  let currentEditId = null;

  // 主圖預覽的 ObjectURL
  let mainPreviewObjectUrl = null;

  // 次要圖：既有 URL 與「這次新選」的檔案
  let existingSecondaryUrls = [];     // 從後端帶入（如果有）
  let selectedSecondaryFiles = [];    // 使用者新選的檔案（有則覆蓋全部）
  let secondaryObjectUrls = [];       // 只為預覽用，render 後要記得 revoke

  const LIMIT_COUNT = 5;
  const LIMIT_MB = 5;

  let el = null;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    el = getEls();
    if (!el.modal || !el.form) {
      console.error('[edit-modal] 缺少 Modal 必要節點 (#editDrawer / #editItemForm)');
      return;
    }

    // 主圖預覽
    el.image?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) { hideMainPreview(); return; }
      if (mainPreviewObjectUrl) URL.revokeObjectURL(mainPreviewObjectUrl);
      mainPreviewObjectUrl = URL.createObjectURL(file);
      el.imagePreview.src = mainPreviewObjectUrl;
      el.imagePreview.classList.remove('d-none');
    });

    // 次要圖選擇（多檔）
    el.imagesInput?.addEventListener('change', (e) => {
      const files = Array.from(e.target.files || []);
      const okFiles = [];

      for (const f of files) {
        const sizeMB = f.size / (1024 * 1024);
        if (sizeMB > LIMIT_MB) {
          Swal.fire({ icon: 'warning', title: '檔案過大', text: `${f.name} 超過 ${LIMIT_MB}MB` });
          continue;
        }
        okFiles.push(f);
      }

      // 最多 5 張
      selectedSecondaryFiles = okFiles.slice(0, LIMIT_COUNT);

      // 只要有新檔就視為覆蓋 → 不顯示既有，改顯示新檔預覽
      renderSecondaryPreview();
      syncFileInputFromSelected();
      updateSecondaryHint();
    });

    // 分類 / 尺寸 / 新舊程度 卡片 → 同步隱藏欄位
    el.form.querySelectorAll('input[name="editCategoryRadio"]').forEach(r => {
      r.addEventListener('change', () => { el.category.value = r.value; });
    });
    el.form.querySelectorAll('input[name="editSizeRadio"]').forEach(r => {
      r.addEventListener('change', () => { if (el.size) el.size.value = r.value; });
    });
    el.form.querySelectorAll('input[name="editConditionRadio"]').forEach(r => {
      r.addEventListener('change', () => { if (el.condition) el.condition.value = r.value; });
    });

    // 開啟時讓 backdrop z-index 提高（避免被 navbar/bottom-nav 遮住）
    el.modal.addEventListener('show.bs.modal', () => document.body.classList.add('edit-modal-open'));
    // 關閉後清理
    el.modal.addEventListener('hidden.bs.modal', () => {
      document.body.classList.remove('edit-modal-open');
      hideMainPreview();
      resetSecondary();
    });

    // 送出儲存
    el.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentEditId) return;
      const submitBtn = el.form.querySelector('button[type="submit"]');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.dataset.orig = submitBtn.textContent; submitBtn.textContent = '儲存中...'; }

      const formData = new FormData();
      formData.append('name', el.name.value.trim());
      formData.append('price', el.price.value);
      formData.append('category', el.category.value);
      formData.append('description', el.description.value);
      formData.append('stock', el.stock.value);
      if (el.size?.value !== '') formData.append('size', el.size.value);
      if (el.condition?.value !== '') formData.append('new_or_old', el.condition.value);

      // 主圖（可選）
      const mainFile = el.image?.files?.[0];
      if (mainFile) formData.append('image', mainFile);

      // 次要圖（若有新選就覆蓋全部）
      if (selectedSecondaryFiles.length > 0) {
        selectedSecondaryFiles.forEach(file => formData.append('otherImages[]', file));
        // 若後端要旗標可打開：
        // formData.append('replaceAllOtherImages', 'true');
      } else {
        // 沒有新選 → 保留現有，不需傳 anything（依後端規則）
        // 如果後端要你帶既有 URL 以保留可這樣做：
        // existingSecondaryUrls.forEach(u => formData.append('existingOtherImages[]', u));
      }

      try {
        const config = { headers: { 'Content-Type': 'multipart/form-data' } };
        await backendService.updateMyItems(currentEditId, formData, config);

        await Swal.fire({ icon: 'success', title: '已更新' });

        // 若你有前端即時更新列表可在這裡補：
        if (typeof window.tryUpdateListDom === 'function') {
          window.tryUpdateListDom(currentEditId, {
            name: el.name.value.trim(),
            price: el.price.value
          });
        }

        closeEditDrawer();
        // 你之前提出「更新完要重新載入」
        location.reload();
      } catch (err) {
        console.error(err);
        Swal.fire({ icon: 'error', title: '更新失敗', text: String(err || '請稍後再試') });
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = submitBtn.dataset.orig || '儲存'; }
      }
    });

    // 將開關方法掛到全域
    window.openEditDrawer = openEditDrawer;
    window.closeEditDrawer = closeEditDrawer;
  }

  function getEls() {
    return {
      modal: document.getElementById('editDrawer'),
      closeBtn: document.getElementById('editDrawerCloseBtn'),
      cancelBtn: document.getElementById('editDrawerCancelBtn'),
      form: document.getElementById('editItemForm'),
      id: document.getElementById('edit-id'),
      name: document.getElementById('edit-name'),
      price: document.getElementById('edit-price'),
      category: document.getElementById('edit-category'),
      stock: document.getElementById('edit-stock'),
      description: document.getElementById('edit-description'),
      size: document.getElementById('edit-size'),
      condition: document.getElementById('edit-condition'),
      image: document.getElementById('edit-image'),
      imagePreview: document.getElementById('edit-image-preview'),
      imagesInput: document.getElementById('edit-images'),
      imagesPreview: document.getElementById('edit-images-preview'),
      imagesHint: document.getElementById('edit-images-hint'),
    };
  }

  async function openEditDrawer(id, rowOrCardEl = null) {
    currentEditId = id;
    el.id.value = id;

    // 重置表單 + 清預覽
    el.form.reset();
    hideMainPreview();
    resetSecondary();

    // 載入單筆資料填入表單
    try {
      const res = await backendService.getItemsInfo(id);
      const item = res?.data ?? res ?? {};
      fillForm(item);
    } catch (e) {
      console.warn('讀取商品失敗，將以空白表單開啟', e);
    }

    // 顯示 Modal
    bootstrap.Modal.getOrCreateInstance(el.modal).show();
    el.modal.addEventListener('shown.bs.modal', () => el.name?.focus(), { once: true });
  }

  function closeEditDrawer() {
    bootstrap.Modal.getInstance(el.modal)?.hide();
  }

  function fillForm(item) {
    el.name.value = item.name ?? '';
    el.price.value = item.price ?? '';
    el.description.value = item.description ?? '';
    el.stock.value = item.stock ?? item.quantity ?? '';

    // 分類：設定隱藏 select + 勾選對應卡片
    el.category.value = item.category ?? '';
    el.form.querySelectorAll('input[name="editCategoryRadio"]').forEach(r => {
      r.checked = r.value === item.category;
    });

    // 尺寸
    const sizeVal = String(item.size ?? '');
    if (el.size) el.size.value = sizeVal;
    el.form.querySelectorAll('input[name="editSizeRadio"]').forEach(r => {
      r.checked = r.value === sizeVal;
    });

    // 新舊程度
    const condVal = String(item.newOrOld ?? item.new_or_old ?? '');
    if (el.condition) el.condition.value = condVal;
    el.form.querySelectorAll('input[name="editConditionRadio"]').forEach(r => {
      r.checked = r.value === condVal;
    });

    // 主圖（欄位名稱相容 mainImage / imageUrl）
    const mainImg = item.mainImage || item.imageUrl || '';
    if (mainImg) {
      el.imagePreview.src = mainImg;
      el.imagePreview.classList.remove('d-none');
    } else {
      hideMainPreview();
    }

    // 次要圖（欄位名稱相容 otherImages / otherImageUrls / images[]）
    existingSecondaryUrls = Array.isArray(item.otherImages) ? item.otherImages
      : Array.isArray(item.otherImageUrls) ? item.otherImageUrls
      : (Array.isArray(item.images) ? item.images.slice(1) : []);
    selectedSecondaryFiles = [];
    renderSecondaryPreview();
    updateSecondaryHint();
  }

  /* ---------- 主圖工具 ---------- */
  function hideMainPreview() {
    el.imagePreview.classList.add('d-none');
    el.imagePreview.removeAttribute('src');
    if (mainPreviewObjectUrl) {
      URL.revokeObjectURL(mainPreviewObjectUrl);
      mainPreviewObjectUrl = null;
    }
  }

  /* ---------- 次要圖工具 ---------- */
  function resetSecondary() {
    // 釋放上次預覽用的 object URL
    secondaryObjectUrls.forEach(url => URL.revokeObjectURL(url));
    secondaryObjectUrls = [];

    existingSecondaryUrls = [];
    selectedSecondaryFiles = [];
    if (el.imagesInput) el.imagesInput.value = '';
    if (el.imagesPreview) el.imagesPreview.innerHTML = '';
    updateSecondaryHint();
  }

  function renderSecondaryPreview() {
    if (!el.imagesPreview) return;

    // 釋放前次建立的 object URLs
    secondaryObjectUrls.forEach(url => URL.revokeObjectURL(url));
    secondaryObjectUrls = [];

    el.imagesPreview.innerHTML = '';
    const usingNew = selectedSecondaryFiles.length > 0;

    if (usingNew) {
      selectedSecondaryFiles.forEach((file, idx) => {
        const url = URL.createObjectURL(file);
        secondaryObjectUrls.push(url);

        const col = document.createElement('div');
        col.className = 'col-4';
        col.innerHTML = `
          <div class="thumb-card1">
            <span class="badge rounded-pill text-bg-primary thumb-badge">新</span>
            <button type="button" class="btn btn-sm btn-outline-danger thumb-remove" data-index="${idx}">&times;</button>
            <img src="${url}" alt="${file.name}">
          </div>
        `;
        el.imagesPreview.appendChild(col);
      });

      // 綁刪除（只對新檔）
      el.imagesPreview.querySelectorAll('.thumb-remove').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.getAttribute('data-index'));
          if (!Number.isNaN(idx)) {
            selectedSecondaryFiles.splice(idx, 1);
            renderSecondaryPreview();
            syncFileInputFromSelected();
            updateSecondaryHint();
          }
        });
      });
    } else {
      // 顯示既有 URL（純預覽，不給個別刪除；若要改規則可再調）
      existingSecondaryUrls.forEach((href) => {
        const col = document.createElement('div');
        col.className = 'col-4';
        col.innerHTML = `
          <div class="thumb-card1">
            <span class="badge rounded-pill text-bg-secondary thumb-badge">既有</span>
            <img src="${href}" alt="existing">
          </div>
        `;
        el.imagesPreview.appendChild(col);
      });
    }
  }

  function updateSecondaryHint() {
    if (!el.imagesHint) return;
    const count = (selectedSecondaryFiles.length > 0)
      ? Math.min(selectedSecondaryFiles.length, LIMIT_COUNT)
      : existingSecondaryUrls.length;
    el.imagesHint.textContent = `已選 ${count} / ${LIMIT_COUNT}`;
  }

  // FileList 不可直接改，使用 DataTransfer 重建 input.files
  function syncFileInputFromSelected() {
    if (!el.imagesInput) return;
    const dt = new DataTransfer();
    selectedSecondaryFiles.slice(0, LIMIT_COUNT).forEach(f => dt.items.add(f));
    el.imagesInput.files = dt.files;
  }

})();
function goToPage(pageName) {
  const url = new URL(window.location.href);

  // 修改或新增 page 參數
  url.searchParams.set("page", pageName);

  // 導向新網址
  window.location.href = url.toString();
}
//TODO 停用帳號
const disableAccountBtn = document.getElementById('disableAccountBtn');
if (disableAccountBtn) {
  disableAccountBtn.addEventListener('click', async () => {
    const result = await Swal.fire({
      title: '確定要停用帳號嗎？',
      text: '停用後將無法登入，且資料將被刪除',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '是的，停用帳號',
      cancelButtonText: '取消'
    });
    if (result.isConfirmed) {
      try {
        await backendService.disableAccount();
        Swal.fire({
          title: '帳號已停用',
          text: '您的帳號已成功停用，將被登出',
          icon: 'success'
        }).then(() => {
          // 停用後登出並導向首頁
          backendService.logout().finally(() => {
            window.location.href = '/';
          });
        });
      } catch (error) {
        console.error('停用帳號失敗:', error);
        Swal.fire({ title: '錯誤', text: '停用帳號失敗，請稍後再試', icon: 'error' });
      }
    }
  });
}

async function openChatWithTarget(targetUserId) {
  if (!targetUserId) {
    return Swal.fire({ icon: 'warning', title: '缺少userid' });
  }
  sessionStorage.setItem('chatroomReturnUrl', window.location.href);
  window.location.href = `../chatroom/chatroom.html?openChat=${targetUserId}`;
}
async function openReviewModal(orderId, targetId, targetRole) {
  const isRatingBuyer = (targetRole === 'buyer');
  const roleName = isRatingBuyer ? '買家' : '賣家';

  // 先從列表快取取得使用者資訊
  let order = (goodsOrder || []).find(o => o.id == orderId);
  let targetUser = isRatingBuyer ? order?.buyerUser : order?.sellerUser;

  if (!targetUser?.name) {
    try {
      const res = await backendService.getOrderDetails(orderId);
      const detail = res?.data?.data;
      targetUser = isRatingBuyer ? detail?.buyerUser : detail?.sellerUser;
    } catch (e) {
      console.warn('取得訂單詳情失敗，將以預設值顯示', e);
    }
  }

  const targetPhoto      = targetUser?.photoURL || '../image/default-avatar.webp';
  const targetName       = targetUser?.name || roleName;
  const targetCredit     = targetUser?.rate ?? '-';

  // 從 API 取得 tags，並填入全域 cache 供顯示使用
  let tagItems = [];
  try {
    const tagRes = await backendService.getReviewTags();
    tagItems = tagRes?.data?.data?.tags ?? [];
    tagItems.forEach(t => { _tagMeaningCache[t.tag] = t.meaning; });
  } catch (e) {
    console.warn('取得評論標籤失敗', e);
  }

  const tagChipsHtml = tagItems.map(t => `
    <label class="review-chip">
      <input type="checkbox" class="review-tag-check" data-key="${esc(t.tag)}">
      <span>${esc(t.meaning)}</span>
    </label>`).join('');

  Swal.fire({
    title: `評價${roleName}`,
    customClass: { htmlContainer: 'swal-left-body' },
    html: `
      <div id="review-list">

        <!-- 被評者資訊 -->
        <div class="review-target-row">
          <img src="${targetPhoto}" alt="${roleName}頭像" class="review-target-avatar"/>
          <div>
            <div class="review-target-name">${targetName}</div>
            <div class="review-target-credit">
              <i class="ti ti-shield-check" style="color:#004b97;"></i>
              信譽積分：<strong>${targetCredit}</strong>
            </div>
          </div>
        </div>

        <!-- 評價標籤 -->
        <div class="review-section-label">評價標籤 <span class="review-section-hint">（可複選）</span></div>
        <div class="review-chips-row">${tagChipsHtml || '<span class="review-section-hint">無可用標籤</span>'}</div>

        <!-- 文字評價 -->
        <div class="review-section-label" style="margin-top:12px;">文字評價 <span class="review-section-hint">（選填）</span></div>
        <textarea id="review-comment" class="review-comment-input" rows="3" placeholder="留下文字評價..."></textarea>

        <!-- 匿名（僅買家評賣家才顯示） -->
        ${!isRatingBuyer ? `
        <label class="review-anon-row">
          <input type="checkbox" id="review-anonymous">
          <span>匿名評價</span>
        </label>` : ''}
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: '送出評價',
    cancelButtonText: '取消',
    width: 560,

    preConfirm: async () => {
      const comment     = document.getElementById('review-comment').value.trim();
      const isAnonymous = !isRatingBuyer && (document.getElementById('review-anonymous')?.checked ?? false);
      const tags        = [...document.querySelectorAll('.review-tag-check:checked')]
                           .map(el => el.dataset.key.toUpperCase());

      try {
        const res = await backendService.postReview(orderId, { comment, isAnonymous, tags });
        const data = res?.data;
        if (!data?.data) throw new Error(data?.message || '送出失敗');
        return { ok: true, data };
      } catch (err) {
        // 回傳錯誤物件讓 modal 關閉，再用獨立 Swal 顯示
        return { ok: false, message: err.message || '評價送出失敗，請稍後再試' };
      }
    }
  }).then(async result => {
    if (!result.isConfirmed) return;
    if (result.value?.ok) {
      await showOrderSwal('review');
      window.location.reload();
    } else {
      Swal.fire({
        icon: 'error',
        title: '送出失敗',
        text: result.value?.message || '評價送出失敗，請稍後再試',
        confirmButtonText: '確定',
      });
    }
  });
}
function renderStars(score, max = 5) {
  return '★'.repeat(score) + '☆'.repeat(Math.max(0, max - score));
}

async function openPartnerReviewModal(orderId, isSell) {
  const data = window.currentOrder;
  const partnerUser = isSell ? data?.buyerUser : data?.sellerUser;
  const partnerName = partnerUser?.name || '對方';
  const partnerPhoto = partnerUser?.photoURL || '../image/default-avatar.webp';
  const partnerCredit = partnerUser?.rate ?? '-';
  const partnerIntro = partnerUser?.intro ?? partnerUser?.description ?? '';
  const partnerId = partnerUser?.id ?? partnerUser?.accountId;

  let review = null;
  let partnerStats = null;

  try {
    const [orderRes, statsRes] = await Promise.all([
      backendService.getOrderBothReviews(orderId),
      partnerId ? backendService.getUserReviews(partnerId) : Promise.resolve(null),
    ]);
    const reviews = orderRes?.data?.data?.reviews ?? [];
    // 找對方給我的評論：賣家找 BUYER_TO_SELLER，買家找 SELLER_TO_BUYER
    const targetRole = isSell ? 'BUYER_TO_SELLER' : 'SELLER_TO_BUYER';
    review = reviews.find(r => r.role === targetRole) ?? null;
    partnerStats = statsRes?.data?.data?.stats ?? null;
  } catch (e) {
    // 尚無評論
  }

  const reviewCount = Number(partnerStats?.reviewCount ?? 0);
  const accountScore = partnerStats?.accountScore ?? '-';
  const statsHtml = reviewCount > 0
    ? `<div style="font-size:12px;color:#555;margin-top:2px;">${reviewCount} 則評價 · 信譽積分 ${accountScore}</div>`
    : `<div style="font-size:12px;color:#aaa;margin-top:2px;">尚無評價紀錄</div>`;

  let bodyHtml = '';
  if (review) {
    const tags = Array.isArray(review?.tags) ? review.tags : [];
    const tagChips = tags.map(t => `<span class="review-display-chip ${(REVIEW_TAG_DELTA[t] ?? REVIEW_TAG_DELTA[t?.toLowerCase()] ?? 1) < 0 ? 'negative' : 'positive'}">${getTagLabel(t)}</span>`).join('');
    bodyHtml = `
      ${tagChips ? `<div class="review-card__chips" style="margin:8px 0;">${tagChips}</div>` : ''}
      <div class="review-display-comment">${review.comment || '<span style="color:#aaa">（無文字評論）</span>'}</div>
    `;
  } else {
    bodyHtml = '<div class="review-display-empty">對方尚未留下評論</div>';
  }

  Swal.fire({
    title: '對方評論',
    customClass: { htmlContainer: 'swal-left-body' },
    html: `
      <div class="review-target-row">
        <img src="${partnerPhoto}" class="review-target-avatar reviewer-avatar--clickable" style="cursor:pointer;"
          data-reviewer-id="${partnerId ?? ''}" data-reviewer-name="${esc(partnerName)}" data-reviewer-photo="${esc(partnerPhoto)}"
          alt="${partnerName}頭像" title="查看 ${esc(partnerName)} 的評價">
        <div>
          <div class="review-target-name reviewer-avatar--clickable" style="cursor:pointer;text-decoration:underline dotted #abdad5;"
            data-reviewer-id="${partnerId ?? ''}" data-reviewer-name="${esc(partnerName)}" data-reviewer-photo="${esc(partnerPhoto)}">${partnerName}</div>
          <div class="review-target-credit">
            <i class="ti ti-star-filled" style="color:#f5a623;"></i>
            信譽積分：<strong>${partnerCredit}</strong>
          </div>
          ${statsHtml}
          ${partnerIntro ? `<div style="font-size:12px;color:#888;margin-top:2px;">${partnerIntro}</div>` : ''}
        </div>
      </div>
      ${bodyHtml}
    `,
    confirmButtonText: '關閉',
    width: 500,
    didOpen: (popup) => bindReviewerClicks(popup),
  });
}
// ===== 商品管理分頁 =====
async function loadMyItems(p = 1) {
  myItemsPage = p;
  if (!backendService) backendService = new BackendService();
  document.querySelector('#products tbody').innerHTML =
    `<tr><td colspan="6" class="text-center py-4"><div class="spinner-border spinner-border-sm text-secondary" role="status"></div></td></tr>`;
  document.getElementById('product-cards').innerHTML =
    `<div class="col-12 text-center py-4"><div class="spinner-border spinner-border-sm text-secondary" role="status"></div></div>`;
  try {
    const res = await backendService.getMyItems({ page: p, limit: MY_ITEMS_LIMIT });
    const raw = res?.data;

    // 解析 items 與 total（相容多種 API 回傳格式）
    let list = [];
    let total = 0;
    if (Array.isArray(raw)) {
      list  = raw;
      total = res?.total ?? res?.count ?? null;
    } else if (raw && typeof raw === 'object') {
      list  = raw?.commodities ?? raw?.data ?? raw?.items ?? [];
      if (!Array.isArray(list)) list = [];
      total = raw?.total ?? raw?.count ?? res?.total ?? res?.count ?? null;
    }

    // 若 API 無回傳 total，用「拿到的筆數 < limit」判斷是否最後一頁
    const isLastPage = list.length < MY_ITEMS_LIMIT;
    const totalCalc  = total !== null ? total : (p - 1) * MY_ITEMS_LIMIT + list.length + (isLastPage ? 0 : 1);
    const totalPages = Math.max(1, Math.ceil(totalCalc / MY_ITEMS_LIMIT));

    renderTable(list);
    renderCards(list);
    renderProductsPager({ totalPages, total: totalCalc, hasPrevPage: p > 1, hasNextPage: p < totalPages }, p);
    goodsOrder = list;
  } catch (err) {
    console.error(err);
  }
}

function renderProductsPager(pg, currentPage) {
  const el = document.getElementById('products-pager');
  if (!el) return;
  if (!pg || pg.total === 0) { el.innerHTML = ''; return; }

  const { totalPages, hasPrevPage, hasNextPage } = pg;

  // 只有 1 頁：顯示件數就好，不顯示按鈕
  if (totalPages <= 1) {
    el.innerHTML = `<span class="text-muted" style="font-size:0.82rem;">共 ${pg.total} 件</span>`;
    return;
  }

  let html = `<button class="pager-nav-btn" ${hasPrevPage ? '' : 'disabled'} data-p="${currentPage - 1}">‹ 上一頁</button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="pager-nav-btn${i === currentPage ? ' pager-nav-btn--active' : ''}" data-p="${i}">${i}</button>`;
  }
  html += `<button class="pager-nav-btn" ${hasNextPage ? '' : 'disabled'} data-p="${currentPage + 1}">下一頁 ›</button>`;
  el.innerHTML = html;

  el.querySelectorAll('button[data-p]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!btn.disabled) loadMyItems(Number(btn.dataset.p));
    });
  });
}

window.goToPage = goToPage;

const REVIEW_TAG_LABELS = {
  fast_shipping:          '出貨快速',
  great_packaging:        '包裝完整保護良好',
  accurate_description:   '描述與實物一致',
  quick_payment:          '付款迅速',
  slow_shipping:          '出貨延遲',
  poor_packaging:         '包裝保護不足',
  misleading_description: '描述與實際不符',
  late_payment:           '付款延遲',
  no_show:                '未到場或無故失聯',
};
const REVIEW_TAG_DELTA = {
  fast_shipping: 1, great_packaging: 1, accurate_description: 1, quick_payment: 1,
  slow_shipping: -1, poor_packaging: -1, misleading_description: -1, late_payment: -1, no_show: -5,
};
const SELLER_TAG_KEYS = new Set(['fast_shipping','great_packaging','accurate_description','slow_shipping','poor_packaging','misleading_description','no_show']);
const BUYER_TAG_KEYS  = new Set(['quick_payment','late_payment','no_show']);

// 快取從 getReviewTags 拿到的 tag→meaning 對應（含大寫 key）
const _tagMeaningCache = {};
function getTagLabel(tag) {
  if (!tag) return '';
  if (_tagMeaningCache[tag]) return _tagMeaningCache[tag];
  return REVIEW_TAG_LABELS[tag] ?? REVIEW_TAG_LABELS[tag.toLowerCase()] ?? tag;
}

function bindReviewerClicks(container) {
  container.addEventListener('click', e => {
    if (e.target.closest('[data-report-review-id]')) {
      const btn = e.target.closest('[data-report-review-id]');
      openReportReviewSwal(btn.dataset.reportReviewId, btn.dataset.reportReviewerName);
      return;
    }
    const el = e.target.closest('[data-reviewer-id]');
    if (!el) return;
    const rid    = el.dataset.reviewerId;
    const rname  = el.dataset.reviewerName;
    const rphoto = el.dataset.reviewerPhoto;
    if (rid) openReviewerProfileModal(rid, rname, rphoto);
  });
}

async function openReportReviewSwal(reviewId, reviewerName) {
  const { isConfirmed, value } = await Swal.fire({
    title: `檢舉評價`,
    customClass: { popup: 'report-form-popup' },
    html: `
      ${reviewerName ? `<p class="report-form-target">檢舉對象：<strong>${reviewerName}</strong></p>` : ''}
      <label class="report-form-label" for="report-category">檢舉類型</label>
      <select id="report-category" class="report-form-select">
        <option value="" disabled selected>請選擇檢舉類型</option>
        <option value="fake_review">虛假或惡意評價</option>
        <option value="harassment">人身攻擊或騷擾</option>
        <option value="spam">廣告或垃圾訊息</option>
        <option value="other">其他原因</option>
      </select>
      <label class="report-form-label" for="report-detail">補充說明（選填）</label>
      <textarea id="report-detail" class="report-form-textarea" placeholder="請描述詳細情況"></textarea>
    `,
    showCancelButton: true,
    confirmButtonText: '送出檢舉',
    cancelButtonText: '取消',
    focusConfirm: false,
    preConfirm: () => {
      const category = document.getElementById('report-category').value;
      const detail   = document.getElementById('report-detail').value.trim();
      if (!category) { Swal.showValidationMessage('請選擇檢舉類型'); return false; }
      return { category, detail };
    }
  });
  if (!isConfirmed || !value) return;
  try {
    await backendService.reportReview(reviewId, { reason: value.category, detail: value.detail });
    Swal.fire({ icon: 'success', title: '檢舉已送出', text: '我們會盡快處理，謝謝你的回報。', timer: 2000, showConfirmButton: false });
  } catch (e) {
    Swal.fire({ icon: 'error', title: '送出失敗', text: '請稍後再試' });
  }
}

function renderPersonReviewCard(review, role) {
  const name      = review?.reviewer?.name ?? '評價者';
  const photo     = review?.reviewer?.photoURL ?? '../image/default-avatar.webp';
  const rid       = review?.reviewer?.accountId ?? '';
  const reviewId  = review?.id ?? '';
  const time      = review?.createdAt ? fmtDate(review.createdAt) : '';
  const commodity = review?.commodityName ? esc(review.commodityName) : '';
  const roleBadge = role === 'seller' ? '賣' : role === 'buyer' ? '買' : '';
  const roleClass = role === 'seller' ? 'reviewer-role-badge--seller' : role === 'buyer' ? 'reviewer-role-badge--buyer' : '';
  const tags      = Array.isArray(review?.tags) ? review.tags : [];
  const tagChips  = tags.map(t => `<span class="review-display-chip ${(REVIEW_TAG_DELTA[t] ?? REVIEW_TAG_DELTA[t?.toLowerCase()] ?? 1) < 0 ? 'negative' : 'positive'}">${getTagLabel(t)}</span>`).join('');
  return `
    <div class="review-card">
      <div class="review-card__header">
        <div class="reviewer-avatar-wrap">
          <img src="${photo}" alt="${name}" class="reviewer-avatar reviewer-avatar--clickable" data-reviewer-id="${rid}" data-reviewer-name="${esc(name)}" data-reviewer-photo="${esc(photo)}" title="查看 ${esc(name)} 的評價">
          ${roleBadge ? `<span class="reviewer-role-badge ${roleClass}">${roleBadge}</span>` : ''}
        </div>
        <div class="review-card__meta">
          <span class="reviewerName reviewer-avatar--clickable" data-reviewer-id="${rid}" data-reviewer-name="${esc(name)}" data-reviewer-photo="${esc(photo)}">${name}</span>
          ${commodity ? `<span class="review-commodity-name">· ${commodity}</span>` : ''}
        </div>
        <div class="review-card__actions">
          ${time ? `<span class="reviewTime">${time}</span>` : ''}
          ${reviewId ? `<button class="review-report-btn" data-report-review-id="${reviewId}" data-report-reviewer-name="${esc(name)}" title="檢舉此評價"><i class="ti ti-flag"></i></button>` : ''}
        </div>
      </div>
      ${tagChips ? `<div class="review-card__chips">${tagChips}</div>` : ''}
      ${review?.comment ? `<div class="reviewText">${esc(review.comment)}</div>` : ''}
    </div>`;
}

async function openReviewerProfileModal(accountId, name, photo) {
  let stats = null;
  let sellerReviews = [];
  let buyerReviews  = [];
  let intro = '';
  try {
    const [reviewRes, profileRes] = await Promise.all([
      backendService.getUserReviews(accountId),
      backendService.getPublicUserProfile(accountId).catch(() => null),
    ]);
    const d = reviewRes?.data?.data;
    stats = d?.stats ?? null;
    sellerReviews = d?.sellerReviews ?? [];
    buyerReviews  = d?.buyerReviews  ?? [];
    intro = profileRes?.data?.data?.introduction ?? '';
  } catch (e) { /* silent */ }

  const reviewCount = Number(stats?.reviewCount ?? 0);
  const accountScore = stats?.accountScore ?? '-';
  const statsHtml = reviewCount > 0
    ? `<div style="font-size:12px;color:#555;margin-top:2px;">${reviewCount} 則評價 · 信譽積分 ${accountScore}</div>`
    : `<div style="font-size:12px;color:#aaa;margin-top:2px;">尚無評價紀錄</div>`;

  const allCards = [
    ...sellerReviews.map(r => renderPersonReviewCard(r, 'seller')),
    ...buyerReviews.map(r => renderPersonReviewCard(r, 'buyer')),
  ].join('');
  const reviewHtml = allCards
    ? `<div class="review-list">${allCards}</div>`
    : `<div class="review-empty" style="margin-top:12px;">目前尚無評價紀錄</div>`;

  Swal.fire({
    title: `${name} 的評價`,
    customClass: { htmlContainer: 'swal-left-body' },
    html: `
      <div class="review-target-row">
        <img src="${photo}" class="review-target-avatar" alt="${name}頭像">
        <div>
          <div class="review-target-name">${name}</div>
          ${statsHtml}
          ${intro ? `<div style="font-size:12px;color:#888;margin-top:4px;">${esc(intro)}</div>` : ''}
        </div>
      </div>
      <div style="max-height:340px;overflow-y:auto;margin-top:8px;">${reviewHtml}</div>
    `,
    confirmButtonText: '關閉',
    width: 520,
    didOpen: (popup) => bindReviewerClicks(popup),
  });
}

async function loadMyReviewStats() {
  const container = document.getElementById('reviewsContainer');
  if (!container) return;
  const uid = localStorage.getItem('uid');
  if (!uid) return;

  try {
    if (Object.keys(_tagMeaningCache).length === 0) {
      try {
        const tagRes = await backendService.getReviewTags();
        (tagRes?.data?.data?.tags ?? []).forEach(t => { _tagMeaningCache[t.tag] = t.meaning; });
      } catch (e) { /* silent */ }
    }

    const res = await backendService.getUserReviews(uid);
    const d = res?.data?.data;
    if (!d) return;

    const reviewCount = Number(d?.stats?.reviewCount ?? 0);
    const accountScore = d?.stats?.accountScore ?? '-';
    const sellerReviews = d?.sellerReviews ?? [];
    const buyerReviews  = d?.buyerReviews  ?? [];

    const totalReviews = sellerReviews.length + buyerReviews.length;

    if (reviewCount === 0 && totalReviews === 0) {
      container.innerHTML = `
        <div class="review-empty">
          <i class="ti ti-message-circle review-empty-icon"></i>
          <div class="review-empty-title">目前還沒有評價</div>
          <div class="review-empty-sub">完成交易後，買賣雙方可互相留下評價</div>
        </div>`;
      return;
    }

    const allCards = [
      ...sellerReviews.map(r => renderPersonReviewCard(r, 'seller')),
      ...buyerReviews.map(r => renderPersonReviewCard(r, 'buyer')),
    ].join('');

    container.innerHTML = `
      <div class="my-review-stats">
        <div class="my-review-stat-item">
          <i class="ti ti-message-check my-review-stat-icon"></i>
          <span class="my-review-stat-value">${reviewCount}</span>
          <span class="my-review-stat-label">累積評價</span>
        </div>
        <div class="my-review-stat-divider"></div>
        <div class="my-review-stat-item">
          <i class="ti ti-shield-star my-review-stat-icon"></i>
          <span class="my-review-stat-value">${accountScore}</span>
          <span class="my-review-stat-label">信譽積分</span>
        </div>
      </div>
      <div class="review-list">${allCards || '<div class="review-empty">目前還沒有評價</div>'}</div>`;

    bindReviewerClicks(container);
  } catch (e) {
    container.innerHTML = `<div class="review-empty">載入失敗，請稍後再試</div>`;
  }
}