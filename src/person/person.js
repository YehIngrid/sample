import BackendService from '../BackendService.js';
import ChatBackendService from '../chatroom/ChatBackendService.js';
import wpBackendService from '../wpBackendService.js';
import { openReviewerProfileModal, bindReviewerClicks } from '../shared/reviewerModal.js';

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
    const name          = localStorage.getItem('username')     || '使用者名稱';
    const intro         = localStorage.getItem('intro')        || '尚未新增使用者介紹';
    const avatarUrl     = localStorage.getItem('avatar');
    const rate          = localStorage.getItem('rate')         || '無法顯示';
    const uidVal        = localStorage.getItem('uid')          || '';
    const contractEmail = localStorage.getItem('contractEmail') || '';

    if (uid)  uid.textContent  = uidVal;
    if (muid) muid.textContent = uidVal;
    if (mProfileName) mProfileName.textContent = name;
    if (mProfileInfo) mProfileInfo.textContent = intro;
    if (profileName)  profileName.textContent  = name;
    if (showName)     showName.textContent      = name;
    if (profileInfo)  profileInfo.textContent  = intro;
    if (showIntro)    showIntro.textContent     = intro;
    const phUsername = document.getElementById('phUsername');
    const phDate     = document.getElementById('phDate');
    if (phUsername) phUsername.textContent = name;
    if (phDate) phDate.textContent = new Date().toLocaleDateString('zh-TW', { year:'numeric', month:'long', day:'numeric', weekday:'long' });

    const showEmailEl = document.getElementById('showEmail');
    if (showEmailEl) showEmailEl.textContent = contractEmail || '尚未設定';
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

    // 隱藏登出按鈕（桌機卡片 + 手機按鈕）
    ['logoutMobile', 'logoutMobileBtn'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });

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
    document.querySelectorAll('.new-nav-link[data-target]').forEach(el => {
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
function doLogoutSwal() {
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
        Swal.fire({ icon: 'success', title: '登出成功', text: '您已成功登出' })
          .then(() => { window.location.href = '../account/account.html'; });
      } catch (error) {
        Swal.fire({ icon: 'error', title: '登出失敗請稍後重試' });
      }
    }
  });
}
['logoutMobile', 'logoutMobileBtn'].forEach(id => {
  document.getElementById(id)?.addEventListener('click', doLogoutSwal);
});


// ===== 常用帳號設定 =====
document.getElementById('setEmailBtn')?.addEventListener('click', async () => {
  const current = document.getElementById('showEmail')?.textContent?.trim();
  const currentVal = current === '尚未設定' ? '' : current;

  const { isConfirmed } = await Swal.fire({
    title: '設定常用帳號',
    html: `<input id="swal-email-input" type="email" autocomplete="email" class="swal2-input" placeholder="輸入 Email" value="${currentVal}">`,
    showCancelButton: true,
    confirmButtonText: '儲存',
    cancelButtonText: '取消',
    focusConfirm: false,
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
    formData.append('contactEmail', email);
    await backendService.updateProfile(formData);
    localStorage.setItem('contractEmail', email);
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
      const buyerId  = order.buyerUser?.id  ?? order.buyerUser?.accountId;
      const sellerId = order.sellerUser?.id ?? order.sellerUser?.accountId;
      targetId = String(buyerId) == myUid ? sellerId : buyerId;
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
    const _od = window.currentOrder;
    const _partner = isSell ? _od?.buyerUser : _od?.sellerUser;
    const _pid = _partner?.id ?? _partner?.accountId;
    const _pname = _partner?.name || '對方';
    openReviewerProfileModal(String(_pid), _pname, null);
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
    if (sellTableTitle) sellTableTitle.style.display = 'none';
    document.getElementById('sellFilter')?.classList.add('d-none');
    document.getElementById('sellPagination')?.classList.add('d-none');
    document.querySelector('#sellProducts .mobile-back-btn')?.classList.add('d-none');
    document.querySelector('#sellProducts .order-guide-wrap')?.classList.add('d-none');
    document.querySelector('#sellProducts .page-head')?.classList.add('d-none');
    document.querySelectorAll('.new-nav-link[data-target]').forEach(link => {
      link.classList.toggle('active', link.dataset.target === 'sellProducts');
    });
    getDetail(orderId);
    return;
  }

  if (page === 'buyerOrderDetail' && orderId) {
    document.getElementById('buyProducts')?.classList.remove('d-none');
    document.getElementById('buyerOrderDetail')?.classList.remove('d-none');
    const buyCards = document.getElementById('buy-product');
    if (buyCards) buyCards.classList.add('d-none');
    buyTable.style.display = 'none';
    if (buyTableTitle) buyTableTitle.style.display = 'none';
    document.getElementById('buyFilter')?.classList.add('d-none');
    document.getElementById('buyPagination')?.classList.add('d-none');
    document.querySelector('#buyProducts .mobile-back-btn')?.classList.add('d-none');
    document.querySelector('#buyProducts .order-guide-wrap')?.classList.add('d-none');
    document.querySelector('#buyProducts .page-head')?.classList.add('d-none');
    document.querySelectorAll('.new-nav-link[data-target]').forEach(link => {
      link.classList.toggle('active', link.dataset.target === 'buyProducts');
    });
    getDetail(orderId);
    return;
  }

  // =========================
  // 列表模式
  // =========================
  resetOrderView();

  // Active menu
  document.querySelectorAll('.new-nav-link[data-target]').forEach(link => {
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
        `<div class="text-center py-4"><div class="spinner-border spinner-border-sm text-secondary" role="status"></div></div>`;
      await loadSellerOrders(1);
    } else if (page === 'buyProducts') {
      window.currentOrder = null;
      currentBuyStatus = 'all';
      document.querySelectorAll('#buyFilter .filter-tab').forEach(t => t.classList.toggle('active', t.dataset.status === 'all'));
      document.querySelector('#buyProducts tbody').innerHTML =
        `<tr><td colspan="5" class="text-center py-4"><div class="spinner-border spinner-border-sm text-secondary" role="status"></div></td></tr>`;
      document.getElementById('buy-product').innerHTML =
        `<div class="text-center py-4"><div class="spinner-border spinner-border-sm text-secondary" role="status"></div></div>`;
      await loadBuyerOrders(1);
    } else if (page === 'products') {
      myItemsPage = 1;
      await loadMyItems(1);
    } else if (page === 'settings') {
      loadSettingsData();
      loadMyReports(1);
      loadReportHistory(1);
    }
  } catch (err) {
    console.error(err);
  }

  // 捲動到指定錨點
  const scrollTarget = params.get('scroll');
  if (scrollTarget) {
    const delay = page === 'settings' ? 400 : 100;
    setTimeout(() => {
      const el = document.getElementById(scrollTarget);
      if (!el) return;
      const navbarH = document.querySelector('.navbar')?.offsetHeight || 0;
      const top = el.getBoundingClientRect().top + window.scrollY - navbarH - 12;
      window.scrollTo({ top, behavior: 'smooth' });
    }, delay);
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
  document.querySelector('#sellProducts .page-head')?.classList.remove('d-none');
  document.querySelector('#buyProducts .page-head')?.classList.remove('d-none');
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
    if (tbody) tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4"><i class="ti ti-alert-circle" style="font-size:1.8rem;color:#abdad5;display:block;margin-bottom:6px;"></i><span class="text-muted" style="font-size:13px;">載入失敗，請重新整理</span></td></tr>`;
    const cards = document.getElementById('sell-product');
    if (cards) cards.innerHTML = `<div class="review-empty"><i class="ti ti-alert-circle review-empty-icon"></i><div class="review-empty-title">載入失敗</div><div class="review-empty-sub">請重新整理頁面</div></div>`;
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
    if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4"><i class="ti ti-alert-circle" style="font-size:1.8rem;color:#abdad5;display:block;margin-bottom:6px;"></i><span class="text-muted" style="font-size:13px;">載入失敗，請重新整理</span></td></tr>`;
    const cards = document.getElementById('buy-product');
    if (cards) cards.innerHTML = `<div class="review-empty"><i class="ti ti-alert-circle review-empty-icon"></i><div class="review-empty-title">載入失敗</div><div class="review-empty-sub">請重新整理頁面</div></div>`;
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
let _avatarCropper = null;

document.getElementById('photo').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    const cropImg = document.getElementById('avatarCropImg');
    cropImg.src = event.target.result;

    const modalEl = document.getElementById('avatarCropModal');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

    modalEl.addEventListener('shown.bs.modal', function handler() {
      modalEl.removeEventListener('shown.bs.modal', handler);
      if (_avatarCropper) { _avatarCropper.destroy(); _avatarCropper = null; }
      const init = () => {
        _avatarCropper = new Cropper(cropImg, {
          aspectRatio: 1,
          viewMode: 1,
          dragMode: 'move',
          autoCropArea: 0.8,
          restore: false,
          guides: false,
          center: true,
          highlight: false,
          cropBoxMovable: false,
          cropBoxResizable: false,
          toggleDragModeOnDblclick: false,
        });
      };
      if (cropImg.complete && cropImg.naturalWidth > 0) init();
      else cropImg.addEventListener('load', init, { once: true });
    });

    modal.show();
  };
  reader.readAsDataURL(file);
});

document.getElementById('avatarCropConfirm').addEventListener('click', function () {
  if (!_avatarCropper) return;
  _avatarCropper.getCroppedCanvas({ width: 400, height: 400 }).toBlob(blob => {
    // 回寫到 file input
    const dt = new DataTransfer();
    dt.items.add(new File([blob], 'avatar.webp', { type: 'image/webp' }));
    document.getElementById('photo').files = dt.files;

    // 更新預覽
    const preview = document.getElementById('myAvatarPreview');
    preview.innerHTML = '';
    const img = document.createElement('img');
    img.src = URL.createObjectURL(blob);
    img.style.cssText = 'width:150px;height:150px;margin:10px;object-fit:cover;border-radius:50%;border:2px solid #ccc;box-shadow:0 0 6px rgba(0,0,0,0.1);';
    preview.appendChild(img);

    bootstrap.Modal.getInstance(document.getElementById('avatarCropModal')).hide();
    if (_avatarCropper) { _avatarCropper.destroy(); _avatarCropper = null; }
  }, 'image/webp', 0.85);
});
// 在 DOMContentLoaded 裡面加入
async function loadSettingsData() {
  try {
    const res = await backendService.getMe();
    const d = res?.data?.data;
    if (!d) return;

    // 登入信箱
    const loginEmailEl = document.getElementById('showLoginEmail');
    if (loginEmailEl) loginEmailEl.textContent = d.account?.email || '—';

    // 驗證徽章
    const badgeEl = document.getElementById('emailVerifyBadge');
    if (badgeEl) {
      const verified = d.account?.emailVerify;
      if (verified) {
        badgeEl.innerHTML = `<span style="display:inline-flex;align-items:center;gap:4px;background:rgb(36,182,133);color:#fff;font-size:11px;padding:2px 8px;border-radius:20px;"><i class="ti ti-circle-check"></i>已驗證</span>`;
      } else {
        badgeEl.innerHTML = `<span style="display:inline-flex;align-items:center;gap:4px;background:#e67e22;color:#fff;font-size:11px;padding:2px 8px;border-radius:20px;"><i class="ti ti-alert-circle"></i>未驗證</span>`;
      }
    }

    // 常用帳號（contactEmail）
    const showEmailEl = document.getElementById('showEmail');
    if (showEmailEl) showEmailEl.textContent = d.contactEmail || '尚未設定';

    // 個人資料同步更新
    const nameEl = document.getElementById('showName');
    const introEl = document.getElementById('showIntro');
    if (nameEl && d.name) nameEl.textContent = d.name;
    if (introEl && d.introduction != null) introEl.textContent = d.introduction || '尚未新增使用者介紹';
  } catch (e) {
    // silent fail，保持 localStorage 的值
  }
}

async function loadStatCards() {
  const elProducts = document.getElementById('statProducts');
  const elOrders   = document.getElementById('statOrders');
  const elScore    = document.getElementById('statScore');
  if (!elProducts && !elOrders && !elScore) return;

  // 信譽積分直接從 localStorage 填入
  if (elScore) elScore.textContent = localStorage.getItem('rate') || '—';

  try {
    const [itemRes, sellRes, buyRes] = await Promise.all([
      backendService.getMyItems({ page: 1, limit: 1 }),
      backendService.getSellerOrders(1),
      backendService.getBuyerOrders(1),
    ]);

    if (elProducts) {
      const raw = itemRes?.data;
      const total = raw?.total ?? raw?.count ?? (Array.isArray(raw) ? raw.length : (raw?.commodities ?? raw?.data ?? []).length);
      elProducts.textContent = total ?? '—';
    }
    if (elOrders) {
      const ACTIVE = new Set(['pending','preparing','delivered','review_pending']);
      const sellList = sellRes?.data?.data?.orders ?? [];
      const buyList  = buyRes?.data?.data?.orders  ?? [];
      const count = [...sellList, ...buyList].filter(o => ACTIVE.has((o.status ?? '').toLowerCase())).length;
      const sellPag = sellRes?.data?.data?.pagination ?? {};
      const buyPag  = buyRes?.data?.data?.pagination  ?? {};
      const sellTotal = sellPag.totalItems ?? sellList.length;
      const buyTotal  = buyPag.totalItems  ?? buyList.length;
      elOrders.textContent = count > 0 ? count : (sellTotal + buyTotal > 0 ? '0' : '0');
    }
  } catch { /* silent */ }
}

const _NOTIF_LABELS = {
  wishpool_contact: '許願池聯絡',
  order_placed:     '訂單成立',
  order_completed:  '訂單完成',
  order_cancelled:  '訂單取消',
  review:           '收到評價',
  system:           '系統通知',
  new_message:      '新訊息',
  product_sold:     '商品已售出',
  product_liked:    '商品被收藏',
};
function _relTime(d) {
  if (!d) return '';
  const mins = Math.floor((Date.now() - new Date(d)) / 60000);
  if (mins < 1) return '剛剛';
  if (mins < 60) return `${mins} 分鐘前`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h} 小時前`;
  return `${Math.floor(h / 24)} 天前`;
}
function _notifItemHtml(text, meta, time, unread = true, href = '') {
  const tag = href ? 'a' : 'div';
  const attr = href ? ` href="${href}"` : '';
  return `<${tag} class="notif-item"${attr}>
    <span class="notif-dot${unread ? '' : ' read'}"></span>
    <div class="notif-body">
      <div class="notif-ttl">${htmlEncode(text)}</div>
      <div class="notif-meta">
        ${meta ? `<span>${htmlEncode(meta)}</span><span class="notif-sep"></span>` : ''}
        <span>${time}</span>
      </div>
    </div>
  </${tag}>`;
}

// localStorage key 存「上次看到的檢舉狀態」
const _RPT_CACHE_KEY = '_rptStatusCache';

function _detectReportChanges(reports) {
  const cache = JSON.parse(localStorage.getItem(_RPT_CACHE_KEY) || '{}');
  const synth = [];
  const next = {};
  reports.forEach(r => {
    const id = r.id;
    next[id] = { status: r.status, subject: r.subject ?? '', reviewedAt: r.reviewedAt ?? null };
    const prev = cache[id];
    if (prev && prev.status === 'pending' && r.status !== 'pending') {
      const label = r.status === 'approved' ? '檢舉已通過' : '檢舉已駁回';
      synth.push({
        text: `${label}：${r.subject ?? ''}`,
        meta: '檢舉結果',
        time: _relTime(r.reviewedAt || r.updatedAt),
        unread: true,
      });
    }
  });
  localStorage.setItem(_RPT_CACHE_KEY, JSON.stringify({ ...cache, ...next }));
  return synth;
}

// localStorage key 存「上次看到的被檢舉紀錄 id 集合」
const _RPT_HIST_KEY = '_rptHistCache';

function _detectReportHistoryChanges(records) {
  const cached = new Set(JSON.parse(localStorage.getItem(_RPT_HIST_KEY) || '[]'));
  const synth = [];
  const next = [];
  records.forEach(r => {
    const key = r.id ?? `${r.subject}|${r.updatedAt}`;
    next.push(key);
    if (!cached.has(key)) {
      const delta = Number(r.scoreDelta ?? 0);
      const deltaSign = delta >= 0 ? '+' : '';
      synth.push({
        text: `收到檢舉：${r.subject ?? ''}（${deltaSign}${delta} 分）`,
        meta: '被檢舉通知',
        time: _relTime(r.updatedAt),
        unread: true,
      });
    }
  });
  // 只有確實拿到資料才更新快取（避免 API 失敗時清掉舊快取）
  if (records.length > 0 || cached.size === 0) {
    localStorage.setItem(_RPT_HIST_KEY, JSON.stringify(next));
  }
  return synth;
}

async function loadRecentNotifications() {
  const container = document.getElementById('recentNotifList');
  if (!container) return;
  try {
    const isAdmin = ['admin', 'moderator'].includes((sessionStorage.getItem('role') ?? '').toLowerCase());
    const [notifRes, rptRes, rptHistRaw, sellPendingRes, buyDeliveredRes, sellReviewRes, buyReviewRes, adminRptRes] = await Promise.all([
      backendService.getNotifications(1, 20),
      backendService.getMyReports({ page: 1, limit: 20 }).catch(() => null),
      backendService.getReportHistory({ page: 1, limit: 10 }).catch(() => null),
      backendService.getSellerOrders(1, 'pending').catch(() => null),
      backendService.getBuyerOrders(1, 'delivered').catch(() => null),
      backendService.getSellerOrders(1, 'review_pending').catch(() => null),
      backendService.getBuyerOrders(1, 'review_pending').catch(() => null),
      isAdmin ? backendService.getAllReports({ status: 'pending', page: 1, limit: 1 }).catch(() => null) : Promise.resolve(null),
    ]);

    // API 通知：取最近 8 筆，不限已讀／未讀
    const apiItems = (notifRes?.data?.data?.notifications ?? []).slice(0, 8);
    const reports  = rptRes?.data?.reports ?? [];
    const rptHistRecords = Array.isArray(rptHistRaw) ? rptHistRaw : (rptHistRaw?.data ?? []);

    // ── 訂單合成通知 ───────────────────────────────────────
    const orderSynth = [];

    // 待確認訂單（賣家）
    const pendingOrders = sellPendingRes?.data?.data?.orders ?? [];
    const pendingTotal  = sellPendingRes?.data?.data?.pagination?.totalItems ?? pendingOrders.length;
    if (pendingTotal > 0) {
      orderSynth.push({
        text: `您有 ${pendingTotal} 筆待確認訂單，請盡快處理`,
        meta: '銷售訂單',
        time: '',
        unread: true,
        href: '?page=sellProducts',
      });
    }

    // 待收貨（買家確認收貨）
    const deliveredOrders = buyDeliveredRes?.data?.data?.orders ?? [];
    const deliveredTotal  = buyDeliveredRes?.data?.data?.pagination?.totalItems ?? deliveredOrders.length;
    if (deliveredTotal > 0) {
      orderSynth.push({
        text: `您有 ${deliveredTotal} 筆待收貨訂單，請確認收貨`,
        meta: '消費訂單',
        time: '',
        unread: true,
        href: '?page=buyProducts',
      });
    }

    // 待評價（賣家）
    const sellReviewOrders = sellReviewRes?.data?.data?.orders ?? [];
    const sellNeedReview   = sellReviewOrders.filter(o => !o.reviewProgress?.sellerReviewed);
    const sellReviewTotal  = sellReviewRes?.data?.data?.pagination?.totalItems ?? sellNeedReview.length;
    if (sellReviewTotal > 0) {
      orderSynth.push({
        text: `您有 ${sellReviewTotal} 筆待評價訂單（賣家），完成後雙方各 +5 分`,
        meta: '評價提醒',
        time: '',
        unread: true,
        href: '?page=sellProducts',
      });
    }

    // 待評價（買家）
    const buyReviewOrders = buyReviewRes?.data?.data?.orders ?? [];
    const buyNeedReview   = buyReviewOrders.filter(o => !o.reviewProgress?.buyerReviewed);
    const buyReviewTotal  = buyReviewRes?.data?.data?.pagination?.totalItems ?? buyNeedReview.length;
    if (buyReviewTotal > 0) {
      orderSynth.push({
        text: `您有 ${buyReviewTotal} 筆待評價訂單（買家），完成後雙方各 +5 分`,
        meta: '評價提醒',
        time: '',
        unread: true,
        href: '?page=buyProducts',
      });
    }

    // ── Admin：待審核檢舉 ──────────────────────────────────
    if (isAdmin) {
      const adminPendingTotal = adminRptRes?.data?.pagination?.totalItems
        ?? adminRptRes?.pagination?.totalItems
        ?? (Array.isArray(adminRptRes?.data) ? adminRptRes.data.length : (adminRptRes?.reports?.length ?? 0));
      if (adminPendingTotal > 0) {
        orderSynth.push({
          text: `有 ${adminPendingTotal} 件檢舉待審核`,
          meta: '管理員待處理',
          time: '',
          unread: true,
          href: '',
        });
      }
    }

    const synthNotifs = [
      ..._detectReportChanges(reports),
      ..._detectReportHistoryChanges(rptHistRecords),
    ];

    const apiHtml = apiItems.map(n => {
      const typeLabel   = _NOTIF_LABELS[n.type] ?? n.type ?? '';
      const displayText = n.title || typeLabel;
      const metaType    = typeLabel || n.title || '';
      return _notifItemHtml(displayText, metaType, _relTime(n.createdAt), !n.isRead);
    }).join('');

    const orderHtml = orderSynth.map(s =>
      _notifItemHtml(s.text, s.meta, s.time, s.unread, s.href)
    ).join('');

    const synthHtml = synthNotifs.map(s =>
      _notifItemHtml(s.text, s.meta, s.time, s.unread)
    ).join('');

    const combined = orderHtml + synthHtml + apiHtml;
    container.innerHTML = combined || '<div class="review-empty"><i class="ti ti-bell-off review-empty-icon"></i><div class="review-empty-title">目前沒有通知</div><div class="review-empty-sub">訂單更新、評價回覆等通知會顯示在這裡</div></div>';

    // 有需要處理的事項時亮紅點
    const hasPending = orderSynth.length > 0 || synthNotifs.length > 0;
    const dotEl = document.getElementById('notifPanelDot');
    if (dotEl) dotEl.style.display = hasPending ? 'inline-block' : 'none';
  } catch (e) {
    container.innerHTML = '<div class="text-center text-muted py-3" style="font-size:14px;"><i class="ti ti-alert-circle" style="font-size:1.4rem;display:block;margin-bottom:4px;opacity:0.4;"></i>無法載入通知</div>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  backendService = new BackendService();

  // 初始化：根據當前 URL 決定顯示哪個頁面
  handleRouting();

  // 評價／檢舉區塊展開縮合
  document.querySelectorAll('.profile-edit-header.collapsible').forEach(header => {
    header.addEventListener('click', () => {
      const targetId = header.dataset.collapseTarget;
      const body = document.getElementById(targetId);
      if (!body) return;
      const collapsed = body.classList.toggle('collapsed');
      header.classList.toggle('collapsed', collapsed);
    });
  });

  loadRecentNotifications();
  loadStatCards();

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
  if (!Array.isArray(list) || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-5"><i class="ti ti-shopping-cart-off" style="font-size:2rem;color:#abdad5;display:block;margin-bottom:8px;"></i><span class="text-muted" style="font-size:13px;">目前沒有訂單</span></td></tr>`;
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
  if (!Array.isArray(list) || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-5"><i class="ti ti-receipt-off" style="font-size:2rem;color:#abdad5;display:block;margin-bottom:8px;"></i><span class="text-muted" style="font-size:13px;">目前沒有訂單</span></td></tr>`;
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
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-5"><i class="ti ti-package-off" style="font-size:2rem;color:#abdad5;display:block;margin-bottom:8px;"></i><span class="text-muted" style="font-size:13px;">目前沒有商品</span></td></tr>`;
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

// ===== 輔助：狀態 → pill CSS 類別 =====
function statusPillClass(status) {
  const map = {
    pending: 's-pend', preparing: 's-pack',
    delivered: 's-ship', review_pending: 's-eval',
    completed: 's-done', scored: 's-done',
    canceled: 's-canc', cancelled: 's-canc',
  };
  return map[(status ?? '').toLowerCase()] ?? 's-canc';
}

// ===== 渲染：商品管理卡片 =====
function renderCards(list = []) {
  const wrap = document.getElementById('product-cards');
  if (!wrap) return;

  if (!Array.isArray(list) || list.length === 0) {
    wrap.innerHTML = `<div class="review-empty"><i class="ti ti-package-off review-empty-icon"></i><div class="review-empty-title">目前沒有商品</div><div class="review-empty-sub">上架第一件商品，開始交易吧</div></div>`;
    return;
  }

  const html = list.map((item, i) => {
    const id      = item.id;
    const name    = esc(item.name);
    const price   = fmtPrice(item.price);
    const updated = fmtDate(item.updatedAt);
    const created = fmtDate(item.createdAt);
    const img     = esc(item.mainImage || item.imageUrl || '../image/placeholder.webp');
    const stock   = item.stock ?? 0;
    const stockCls = stock === 0 ? ' pcard-stock-out' : '';

    return `
      <div class="ocard" data-id="${esc(id)}" style="animation:pageEnter 0.32s ease ${i * 0.06}s both;">
        <div class="ocard-head">
          <div class="ocard-meta">
            <span class="ocard-oid">${name}</span>
          </div>
          <span class="ocard-price-val">${price}</span>
        </div>
        <div class="ocard-body">
          <div class="ocard-product" style="flex:1;">
            <div class="ocard-thumb">
              <img src="${img}" alt="${name}">
            </div>
            <div class="ocard-info">
              <div class="ocard-sub">庫存：<span class="pcard-stock${stockCls}">${stock}</span></div>
              <div class="ocard-sub mt-1">建立：${created}</div>
              <div class="ocard-sub">更新：${updated}</div>
            </div>
          </div>
          <div class="ocard-actions flex-wrap">
            <button class="checkInfoBtn action-btn btn-row-action" data-action="check" data-id="${id}">
              <img src="../svg/checkSell.svg" alt="查看商品"><div>查看</div>
            </button>
            <button class="checkInfoBtn action-btn btn-row-action" data-action="編輯商品" data-id="${id}">
              <img src="../svg/editSell.svg" alt="編輯商品"><div>編輯</div>
            </button>
            <button class="btnSell action-btn btn-row-action ocard-del-btn" data-action="delete" data-id="${id}">
              <img src="../svg/deleteSell.svg" alt="永久下架"><div>下架</div>
            </button>
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
    wrap.innerHTML = `<div class="review-empty"><i class="ti ti-receipt-off review-empty-icon"></i><div class="review-empty-title">目前沒有訂單</div><div class="review-empty-sub">等待買家下單後訂單將顯示在這裡</div></div>`;
    return;
  }

  const html = list.map((item, i) => {
    const id      = item.id;
    const label   = fmtOrderLabel(item);
    const price   = fmtPrice(item.totalAmount);
    const created = fmtDate(item.createdAt);
    const key     = (item.status ?? 'listed').toLowerCase();
    const st      = order_STATUS_MAP[key] ?? order_STATUS_MAP.pending;
    const pillCls = statusPillClass(item.status);
    const isDisabled = st.action === '等待買家確認收貨' ? 'disabled' : '';
    const imgUrl  = item.orderItems?.[0]?.item?.mainImage || item.orderItems?.[0]?.item?.imageUrl || null;
    const thumb   = imgUrl
      ? `<img src="${esc(imgUrl)}" alt="${label}">`
      : '';

    const actionBtn = renderReviewAction(item, true, id) ?? (item.status !== 'canceled' && st.action ? `
      <button class="checkInfoBtn action-btn btn-card-action" data-id="${id}" data-action="${st.action}" ${isDisabled}>
        <img src="${st.icon}" alt="${st.action}"><div>${st.action}</div>
      </button>` : '');
    const cancelBtn = (item.status === 'pending' || item.status === 'preparing') ? `
      <button class="cancelOrderBtn action-btn btn-row-action" data-action="cancel" data-id="${id}">
        <img src="../svg/cancelOrder.svg" alt="取消訂單"><div>取消</div>
      </button>` : '';
    const chatBtn = item.status !== 'canceled' ? `
      <button class="order-chat-btn action-btn" data-action="contact" data-id="${id}" title="聯絡對方">
        <img src="../svg/canChat.svg" alt="聯絡對方">
      </button>` : '';

    return `
      <div class="ocard" data-id="${esc(id)}" style="animation:pageEnter 0.32s ease ${i * 0.06}s both;">
        <div class="ocard-head">
          <div class="ocard-meta">
            <span class="ocard-oid">#${id}</span>
            <span class="ocard-sep"></span>
            <span>${created}</span>
          </div>
          <span class="ocard-pill ${pillCls}">${st.text}</span>
        </div>
        <div class="ocard-body">
          <div class="ocard-product">
            <div class="ocard-thumb ocard-thumb${imgUrl ? '' : '-grad'}">${thumb}</div>
            <div class="ocard-info">
              <div class="ocard-name">${label}</div>
              <div class="ocard-sub">NT$ ${price}</div>
            </div>
          </div>
          <div class="ocard-actions">
            ${actionBtn}
            <button class="checkInfoBtn action-btn btn-row-action" data-action="checkInfo" data-id="${id}">
              <img src="../svg/orderInfo.svg" alt="訂單詳情"><div>詳情</div>
            </button>
            ${cancelBtn}
            ${chatBtn}
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
    wrap.innerHTML = `<div class="review-empty"><i class="ti ti-shopping-cart-off review-empty-icon"></i><div class="review-empty-title">目前沒有訂單</div><div class="review-empty-sub">購買商品後訂單將顯示在這裡</div></div>`;
    return;
  }

  const html = list.map((item, i) => {
    const id      = item.id;
    const label   = fmtOrderLabel(item);
    const price   = fmtPrice(item.totalAmount);
    const created = fmtDate(item.createdAt);
    const key     = (item.status ?? 'listed').toLowerCase();
    const st      = buyer_STATUS_MAP[key] ?? buyer_STATUS_MAP.pending;
    const pillCls = statusPillClass(item.status);
    const imgUrl  = item.orderItems?.[0]?.item?.mainImage || item.orderItems?.[0]?.item?.imageUrl || null;
    const thumb   = imgUrl
      ? `<img src="${esc(imgUrl)}" alt="${label}">`
      : '';

    const actionBtn = renderReviewAction(item, false, id) ?? (item.status !== 'canceled' && st.action ? `
      <button class="checkInfoBtn action-btn btn-card-action" data-id="${id}" data-action="${st.action}">
        <img src="${st.icon}" alt="${st.action}"><div>${st.action}</div>
      </button>` : '');
    const cancelBtn = (item.status === 'pending' || item.status === 'preparing') ? `
      <button class="cancelOrderBtn action-btn btn-row-action" data-action="cancel" data-id="${id}">
        <img src="../svg/cancelOrder.svg" alt="取消訂單"><div>取消</div>
      </button>` : '';
    const chatBtn = item.status !== 'canceled' ? `
      <button class="order-chat-btn action-btn" data-action="contact" data-id="${id}" title="聯絡對方">
        <img src="../svg/canChat.svg" alt="聯絡對方">
      </button>` : '';

    return `
      <div class="ocard" data-id="${esc(id)}" style="animation:pageEnter 0.32s ease ${i * 0.06}s both;">
        <div class="ocard-head">
          <div class="ocard-meta">
            <span class="ocard-oid">#${id}</span>
            <span class="ocard-sep"></span>
            <span>${created}</span>
          </div>
          <span class="ocard-pill ${pillCls}">${st.text}</span>
        </div>
        <div class="ocard-body">
          <div class="ocard-product">
            <div class="ocard-thumb ocard-thumb${imgUrl ? '' : '-grad'}">${thumb}</div>
            <div class="ocard-info">
              <div class="ocard-name">${label}</div>
              <div class="ocard-sub">NT$ ${price}</div>
            </div>
          </div>
          <div class="ocard-actions">
            ${actionBtn}
            <button class="checkInfoBtn action-btn btn-row-action" data-action="checkInfo" data-id="${id}">
              <img src="../svg/orderInfo.svg" alt="訂單詳情"><div>詳情</div>
            </button>
            ${cancelBtn}
            ${chatBtn}
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
    return `<div class="review-empty" style="padding:12px 0;"><i class="ti ti-message-circle" style="font-size:1.6rem;color:#abdad5;display:block;margin-bottom:6px;"></i><span>尚無評論</span></div>`;
  }
  return reviews.map(r => {
    const isBuyerToSeller = r.role === 'BUYER_TO_SELLER';
    const roleLabel = isBuyerToSeller ? '買家 → 賣家' : '賣家 → 買家';
    const tags = Array.isArray(r?.tags) ? r.tags : [];
    const tagChips = tags.map(t => `<span class="review-display-chip ${isTagPositive(t) ? 'positive' : 'negative'}">${getTagLabel(t)}</span>`).join('');
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
    const isSell = new URLSearchParams(window.location.search).get('page') === 'sellOrderDetail';
    const sellDetail = document.getElementById('sellOrderDetail');
    const buyDetail  = document.getElementById('buyerOrderDetail');
    const detailEl   = isSell ? sellDetail : buyDetail;

    const productBox    = document.getElementById(isSell ? 'sellOrderProducts' : 'buyOrderProducts');
    const infoBox       = document.getElementById(isSell ? 'sellOrderInfo'     : 'buyerOrderInfo');
    const reviewBox     = document.getElementById(isSell ? 'sellOrderReviews'  : 'buyOrderReviews');
    const actionsBox    = document.getElementById(isSell ? 'sellOrderActions'  : 'buyOrderActions');
    const orderIdEl     = document.getElementById(isSell ? 'sellOrderIdSpan'   : 'buyOrderIdSpan');
    const itemCountEl   = document.getElementById(isSell ? 'sellItemCount'     : 'buyItemCount');
    const reviewCountEl = document.getElementById(isSell ? 'sellReviewCount'   : 'buyReviewCount');
    const tlHintEl      = document.getElementById(isSell ? 'sellTlHint'        : 'buyTlHint');
    const bannerEl      = document.getElementById(isSell ? 'sellStatusBanner'  : 'buyStatusBanner');
    const sbIcEl        = document.getElementById(isSell ? 'sellSbIc'          : 'buySbIc');
    const sbTitleEl     = document.getElementById(isSell ? 'sellSbTitle'       : 'buySbTitle');
    const sbDescEl      = document.getElementById(isSell ? 'sellSbDesc'        : 'buySbDesc');

    if (productBox) productBox.innerHTML = `<div class="d-flex justify-content-center py-4"><div class="spinner-border text-secondary" role="status"></div></div>`;
    if (infoBox) infoBox.innerHTML = '';

    const res = await backendService.getOrderDetails(id);
    const data = res.data.data;
    window.currentOrder = data;

    const orderTypeMap = { c2c: '面交取貨' };

    // ── 狀態橫幅設定 ──
    const BANNER_CFG = {
      pending:        { bg: 'linear-gradient(135deg, #d4962e 0%, #b07820 100%)', icon: 'clock' },
      preparing:      { bg: 'linear-gradient(135deg, #3d7ed0 0%, #295fa8 100%)', icon: 'box'   },
      delivered:      { bg: 'linear-gradient(135deg, #30a884 0%, #1f8064 100%)', icon: 'truck' },
      review_pending: { bg: 'linear-gradient(135deg, #24b685 0%, #189665 100%)', icon: 'star'  },
      completed:      { bg: 'linear-gradient(135deg, #004b97 0%, #003a78 100%)', icon: 'check' },
      canceled:       { bg: 'linear-gradient(135deg, #c97f5a 0%, #a8624a 100%)', icon: 'x'     },
    };
    const BANNER_ICONS = {
      clock: `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg>`,
      box:   `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><path d="M20 7L12 3L4 7V17L12 21L20 17V7Z"/><polyline points="12 3 12 12"/><polyline points="20 7 12 12 4 7"/></svg>`,
      truck: `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
      star:  `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
      check: `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><path d="M20 6L9 17L4 12"/></svg>`,
      x:     `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><circle cx="12" cy="12" r="9"/><path d="M15 9L9 15M9 9L15 15"/></svg>`,
    };
    const STATUS_TITLE = {
      pending: '等待賣家接受', preparing: '備貨準備中', delivered: '等待確認收貨',
      review_pending: '等待評價', completed: '訂單已完成', canceled: '訂單已取消',
    };
    const SELL_DESC = {
      pending: '有新訂單等待您接受，請盡快確認', preparing: '您已接受訂單，請備妥商品',
      delivered: '商品已出貨，等待買家確認收貨', review_pending: '買家已確認收貨，請對買家留下評價',
      completed: '訂單已完成，感謝您的交易',
    };
    const BUY_DESC = {
      pending: '訂單已建立，等待賣家確認接受', preparing: '賣家正在為您備貨中',
      delivered: '賣家已出貨，請確認收貨', review_pending: '您已確認收貨，記得留下評價',
      completed: '感謝您使用拾貨寶庫',
    };

    const cancelLog = data.logs?.find(l => l.status === 'canceled');
    const statusKey = data.status || 'pending';
    const cfg = BANNER_CFG[statusKey] || BANNER_CFG.pending;

    if (bannerEl) bannerEl.style.background = cfg.bg;
    if (sbIcEl)    sbIcEl.innerHTML = BANNER_ICONS[cfg.icon] || '';
    if (sbTitleEl) sbTitleEl.textContent = STATUS_TITLE[statusKey] || statusKey;
    if (sbDescEl) {
      sbDescEl.innerHTML = statusKey === 'canceled' && cancelLog
        ? `本訂單已於 <strong>${formatter.format(new Date(cancelLog.timestamp))}</strong> 取消`
        : (isSell ? SELL_DESC[statusKey] : BUY_DESC[statusKey]) || '';
    }
    if (orderIdEl) orderIdEl.textContent = id;
    if (tlHintEl) {
      tlHintEl.textContent = cancelLog
        ? `取消時間：${formatter.format(new Date(cancelLog.timestamp))}` : '';
    }

    // ── tag cache ──
    if (Object.keys(_tagMeaningCache).length === 0) {
      try {
        const tagRes = await backendService.getReviewTags();
        (tagRes?.data?.data?.tags ?? []).forEach(t => { _tagMeaningCache[t.tag] = t.description ?? t.meaning; _tagPositiveCache[t.tag] = t.positive; });
      } catch (e) {}
    }

    const reviewBoth = await backendService.getOrderBothReviews(id);
    const reviews = reviewBoth.data?.data?.reviews ?? [];

    // ── 商品清單 ──
    const items = data.orderItems || [];
    if (itemCountEl) itemCountEl.textContent = `共 ${items.length} 件`;

    if (productBox) {
      if (!items.length) {
        productBox.innerHTML = '<div class="review-empty" style="padding:16px 0;"><i class="ti ti-package-off review-empty-icon"></i><div class="review-empty-title">沒有商品資料</div></div>';
      } else {
        productBox.innerHTML = items.map(item => `
          <div class="od-product">
            <img class="od-product-img" src="${item.item.mainImage || '../image/placeholder.webp'}" alt="商品照片">
            <div class="od-product-info">
              <div class="od-pid">#${item.itemId}</div>
              <div class="od-pname">${htmlEncode(item?.item?.name ?? '—')}</div>
              <div class="od-pmeta"><span class="od-qty">數量 ×${item.quantity}</span></div>
            </div>
            <div class="od-product-price">
              <div class="od-price-lbl">UNIT</div>
              <div class="od-price-val">NT$${item.price}<span class="od-price-unit">元</span></div>
            </div>
          </div>
        `).join('') + `
          <div class="od-summary">
            <div class="od-summary-row"><span>商品小計</span><span>NT$${data.totalAmount} 元</span></div>
            <div class="od-summary-row"><span>運費</span><span>${orderTypeMap[data.type] || data.type}（免運）</span></div>
            <div class="od-summary-row od-total">
              <span>實付金額</span>
              <span class="od-total-val">NT$${data.totalAmount}<span class="od-total-unit">元</span></span>
            </div>
          </div>`;
        productBox.querySelectorAll('.od-product-img').forEach(img => {
          img.addEventListener('click', () => {
            Swal.fire({ imageUrl: img.src, imageAlt: '商品照片', showConfirmButton: false, showCloseButton: true, width: 'auto' });
          });
        });
      }
    }

    // ── 訂單資訊 + 對方資訊卡 ──
    if (infoBox) {
      const STATUS_PILL = {
        pending:        { cls: 'sp-pend', text: '等待賣家接受' },
        preparing:      { cls: 'sp-pack', text: '備貨準備中' },
        delivered:      { cls: 'sp-ship', text: '等待確認收貨' },
        review_pending: { cls: 'sp-eval', text: '等待評價' },
        completed:      { cls: 'sp-done', text: '已完成' },
        canceled:       { cls: 'sp-canc', text: '已取消' },
      };
      const pillInfo = STATUS_PILL[data.status] || { cls: 'sp-pend', text: data.status };
      const rp = data.reviewProgress ?? {};
      const deadlineSuffix = (data.status === 'review_pending' && rp.reviewDeadline)
        ? ` <span style="font-size:0.78em;color:#e07b39;">（截止：${fmtDate(rp.reviewDeadline)}）</span>` : '';
      const createdDate = new Date(data.createdAt).toLocaleDateString('zh-TW', { year:'numeric', month:'long', day:'numeric' });
      const partnerUser = isSell ? data.buyerUser : data.sellerUser;
      const partnerRole = isSell ? 'BUYER · 買家' : 'SELLER · 賣家';
      let partnerAvatar = partnerUser?.photoURL || partnerUser?.avatar || null;

      if (!partnerAvatar && partnerUser) {
        const partnerId = partnerUser?.id ?? partnerUser?.accountId;
        if (partnerId) {
          try {
            const profileRes = await backendService.getPublicUserProfile(partnerId);
            const pd = profileRes?.data?.data;
            partnerAvatar = pd?.photoURL || pd?.avatar || null;
          } catch (_) {}
        }
      }

      infoBox.innerHTML = `
        <div class="od-info-list">
          <div class="od-info-row">
            <span class="od-info-lbl">建立日期</span>
            <span class="od-info-val">${createdDate}</span>
          </div>
          <div class="od-info-row">
            <span class="od-info-lbl">訂單狀態</span>
            <span class="od-info-val"><span class="od-spill ${pillInfo.cls}">${pillInfo.text}</span>${deadlineSuffix}</span>
          </div>
          <div class="od-info-row">
            <span class="od-info-lbl">交貨方式</span>
            <span class="od-info-val">${orderTypeMap[data.type] || data.type}</span>
          </div>
          <div class="od-info-row">
            <span class="od-info-lbl">訂單編號</span>
            <span class="od-info-val od-mono">${id}</span>
          </div>
        </div>
        <div class="od-person-section">
          <div class="od-person-card">
            <img class="od-person-av" src="${partnerAvatar || DEFAULT_AVATAR}" alt="對方大頭貼">
            <div class="od-person-info">
              <div class="od-person-role">${partnerRole}</div>
              <div class="od-person-name">${htmlEncode(partnerUser?.name ?? '—')}</div>
            </div>
          </div>
          <div class="od-person-actions">
            <button class="od-btn-person action-btn" data-action="contact" data-id="${id}">
              <img src="../svg/canChat.svg" alt="聯絡">與對方聯絡
            </button>
            <button class="od-btn-person action-btn" data-action="watchComment" data-id="${id}">
              <img src="../svg/reviewsIcon.svg" alt="評論" style="border-radius:50%;">查看對方評論
            </button>
          </div>
        </div>`;
    }

    // ── 評論 ──
    if (reviewBox) {
      if (reviewCountEl) reviewCountEl.textContent = `${reviews.length} 則`;
      if (!reviews.length) {
        const emptyMsg = data.status === 'canceled' ? '本訂單已取消，無法進行評論' : '完成訂單後可留下評價';
        reviewBox.innerHTML = `
          <div class="od-review-empty">
            <div class="od-review-empty-ic">
              <svg viewBox="0 0 24 24"><path d="M4 5 H20 V17 H13 L9 21 V17 H4 Z"/></svg>
            </div>
            <div class="od-review-empty-t">尚無評論</div>
            <div class="od-review-empty-s">${emptyMsg}</div>
          </div>`;
      } else {
        reviewBox.innerHTML = renderOrderReviews(reviews, isSell);
      }
    }

    // ── 更多操作 ──
    if (actionsBox) {
      const rp = data.reviewProgress ?? {};
      const actionRows = [];
      if (isSell) {
        if (data.status === 'pending') {
          actionRows.push({ action: '接受訂單', icon: '../svg/acceptOrder.svg',  title: '接受訂單', desc: '確認接受並開始備貨', danger: false });
          actionRows.push({ action: 'cancel',   icon: '../svg/cancelOrder.svg',  title: '取消訂單', desc: '拒絕並取消此筆訂單', danger: true  });
        } else if (data.status === 'preparing') {
          actionRows.push({ action: '即將出貨', icon: '../svg/readyDeliver.svg', title: '登記出貨', desc: '通知買家已備妥，準備交貨', danger: false });
          actionRows.push({ action: 'cancel',   icon: '../svg/cancelOrder.svg',  title: '取消訂單', desc: '取消此筆訂單', danger: true });
        } else if (data.status === 'review_pending' && !rp.sellerReviewed) {
          actionRows.push({ action: '給對方評價', icon: '../svg/giveStar.svg', title: '留下評價', desc: '對買家的交易留下評論', danger: false });
        }
      } else {
        if (data.status === 'pending' || data.status === 'preparing') {
          actionRows.push({ action: 'cancel', icon: '../svg/cancelOrder.svg', title: '取消訂單', desc: '取消此筆訂單', danger: true });
        } else if (data.status === 'delivered') {
          actionRows.push({ action: '成功取貨', icon: '../svg/acceptOrder.svg', title: '確認收貨', desc: '確認已取得商品', danger: false });
          actionRows.push({ action: 'cancel',   icon: '../svg/cancelOrder.svg', title: '取消訂單', desc: '取消此筆訂單', danger: true });
        } else if (data.status === 'review_pending' && !rp.buyerReviewed) {
          actionRows.push({ action: '給對方評價', icon: '../svg/giveStar.svg', title: '留下評價', desc: '對賣家的交易留下評論', danger: false });
        }
      }
      actionsBox.innerHTML = actionRows.length
        ? actionRows.map(a => `
          <button class="od-action-row action-btn ${a.danger ? 'od-danger' : ''}" data-action="${a.action}" data-id="${id}">
            <div class="od-ar-ic"><img src="${a.icon}" alt="${a.title}"></div>
            <div class="od-ar-copy">
              <div class="od-ar-title">${a.title}</div>
              <div class="od-ar-desc">${a.desc}</div>
            </div>
            <span class="od-ar-arr">›</span>
          </button>`).join('')
        : `<div class="review-empty" style="padding:16px 0;"><i class="ti ti-tool review-empty-icon"></i><div class="review-empty-title">目前沒有可執行的操作</div></div>`;
    }

    // ── 更新 Timeline ──
    updateStatusUI(data, detailEl);

    // 標記最新步驟（ping 動畫）
    const activeSteps = detailEl.querySelectorAll('.od-step.active');
    detailEl.querySelectorAll('.od-step').forEach(s => s.classList.remove('od-current'));
    if (activeSteps.length) activeSteps[activeSteps.length - 1].classList.add('od-current');

    // ── 切換畫面 ──
    if (!new URLSearchParams(window.location.search).get('orderId')) return;
    if (isSell) {
      document.getElementById('sellTable').style.display = 'none';
      sellDetail.classList.remove('d-none');
    } else {
      document.getElementById('buyTable').style.display = 'none';
      buyDetail.classList.remove('d-none');
    }

  } catch (error) {
    Swal.fire({ title: 'Oops', icon: 'error', text: error.message || error });
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
    pending:        '訂單已建立',
    preparing:      '準備商品',
    delivered:      '已出貨',
    review_pending: '待評價',
    completed:      '已完成',
  };
  const svgNameMap = {
    review_pending: 'completed',
    completed:      'scored',
  };

  // 1️⃣ reset
  statusItems.forEach(item => {
    const img      = item.querySelector('img');
    const timeBox  = item.querySelector('.timestamp');
    const text     = item.querySelector('.stateText');
    const statusName = item.dataset.status;

    const svgPrefix = svgNameMap[statusName] ?? statusName;
    img.src = `../svg/${svgPrefix}yet.svg`;
    timeBox.innerText = '';
    item.classList.remove('active', 'od-cancelled');
    item.style.display = '';

    if (text) text.innerHTML = defaultTextMap[statusName] ?? statusName;
  });

  // 2️⃣ fill logs
  statusItems.forEach(item => {
    const statusName = item.dataset.status;
    const logEntry   = logs.find(l => l.status === statusName);
    const img        = item.querySelector('img');
    const timeBox    = item.querySelector('.timestamp');
    const text       = item.querySelector('.stateText');

    if (cancelLog && !scoreLog) {
      if (logEntry) {
        img.src = img.src.replace('yet.svg', '.svg');
        timeBox.innerText = formatter.format(new Date(logEntry.timestamp));
        item.classList.add('active');
      } else {
        img.src = '../svg/cancel.svg';
        timeBox.innerText = formatter.format(new Date(cancelLog.timestamp));
        item.classList.add('od-cancelled');
        if (text) text.innerHTML = '已取消';
      }
    } else if (logEntry) {
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
function goToPage(pageName, scrollTarget) {
  const url = new URL(window.location.href);
  url.searchParams.set("page", pageName);
  if (scrollTarget) {
    url.searchParams.set("scroll", scrollTarget);
  } else {
    url.searchParams.delete("scroll");
  }
  window.location.href = url.toString();
}
// 修改密碼
const changePasswordBtn = document.getElementById('change-password-btn');
if (changePasswordBtn) {
  changePasswordBtn.addEventListener('click', async () => {
    const currentPwd = document.getElementById('current-password').value;
    const newPwd     = document.getElementById('new-password').value;
    const confirmPwd = document.getElementById('confirm-password').value;

    if (!currentPwd || !newPwd || !confirmPwd) {
      Swal.fire({ icon: 'warning', title: '請填寫完整', text: '請輸入目前密碼與新密碼' });
      return;
    }
    const isValid = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/.test(newPwd);
    if (!isValid) {
      Swal.fire({ icon: 'warning', title: '密碼格式不符', text: '新密碼需至少 8 位，包含大寫、小寫字母及數字' });
      return;
    }
    if (newPwd !== confirmPwd) {
      Swal.fire({ icon: 'warning', title: '密碼不一致', text: '兩次輸入的新密碼不相同' });
      return;
    }

    changePasswordBtn.disabled = true;
    try {
      backendService = new BackendService();
      await backendService.changePassword(currentPwd, newPwd);
      document.getElementById('current-password').value = '';
      document.getElementById('new-password').value = '';
      document.getElementById('confirm-password').value = '';
      await Swal.fire({ icon: 'success', title: '密碼已更新', text: '請使用新密碼重新登入', confirmButtonText: '確定' });
    } catch (e) {
      Swal.fire({ icon: 'error', title: '修改失敗', text: e.message });
    } finally {
      changePasswordBtn.disabled = false;
    }
  });
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
    tagItems.forEach(t => { _tagMeaningCache[t.tag] = t.description ?? t.meaning; _tagPositiveCache[t.tag] = t.positive; });
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

// ===== 商品管理分頁 =====
async function loadMyItems(p = 1) {
  myItemsPage = p;
  if (!backendService) backendService = new BackendService();
  document.querySelector('#products tbody').innerHTML =
    `<tr><td colspan="6" class="text-center py-4"><div class="spinner-border spinner-border-sm text-secondary" role="status"></div></td></tr>`;
  document.getElementById('product-cards').innerHTML =
    `<div class="text-center py-4"><div class="spinner-border spinner-border-sm text-secondary" role="status"></div></div>`;
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

    // 若 API 無回傳 total，以本頁實際筆數推算（不加 +1，避免恰好等於 limit 時出現空白第二頁）
    const totalCalc  = total !== null ? total : (p - 1) * MY_ITEMS_LIMIT + list.length;
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
const SELLER_TAG_KEYS = new Set(['fast_shipping','great_packaging','accurate_description','slow_shipping','poor_packaging','misleading_description','no_show']);
const BUYER_TAG_KEYS  = new Set(['quick_payment','late_payment','no_show']);

// 快取從 getReviewTags 拿到的 tag→meaning / tag→positive
const _tagMeaningCache  = {};
const _tagPositiveCache = {};
function getTagLabel(tag) {
  if (!tag) return '';
  if (_tagMeaningCache[tag]) return _tagMeaningCache[tag];
  return REVIEW_TAG_LABELS[tag] ?? REVIEW_TAG_LABELS[tag.toLowerCase()] ?? tag;
}
function isTagPositive(tag) {
  if (!tag) return true;
  const v = _tagPositiveCache[tag] ?? _tagPositiveCache[tag.toLowerCase()];
  return v !== undefined ? v : true;
}

// bindReviewerClicks 與 openReviewerProfileModal 已由 ../shared/reviewerModal.js 提供

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
  const tagChips  = tags.map(t => `<span class="review-display-chip ${isTagPositive(t) ? 'positive' : 'negative'}">${getTagLabel(t)}</span>`).join('');
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
          ${reviewId ? `<button class="review-report-btn" data-report-review-id="${reviewId}" data-report-reviewer-id="${rid}" data-report-reviewer-name="${esc(name)}" title="檢舉此評價"><i class="ti ti-flag"></i></button>` : ''}
        </div>
      </div>
      ${tagChips ? `<div class="review-card__chips">${tagChips}</div>` : ''}
      ${review?.comment ? `<div class="reviewText">${esc(review.comment)}</div>` : ''}
    </div>`;
}

// openReviewerProfileModal 已由 ../shared/reviewerModal.js 提供

async function loadMyReviewStats() {
  const container = document.getElementById('reviewsContainer');
  if (!container) return;
  const uid = localStorage.getItem('uid');
  if (!uid) return;

  try {
    if (Object.keys(_tagMeaningCache).length === 0) {
      try {
        const tagRes = await backendService.getReviewTags();
        (tagRes?.data?.data?.tags ?? []).forEach(t => { _tagMeaningCache[t.tag] = t.description ?? t.meaning; _tagPositiveCache[t.tag] = t.positive; });
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
      <div class="review-list">${allCards || '<div class="review-empty"><i class="ti ti-message-circle review-empty-icon"></i><div class="review-empty-title">目前還沒有評價</div></div>'}</div>`;

    bindReviewerClicks(container);
  } catch (e) {
    container.innerHTML = `<div class="review-empty"><i class="ti ti-alert-circle review-empty-icon"></i><div class="review-empty-title">載入失敗</div><div class="review-empty-sub">請稍後再試</div></div>`;
  }
}

// ── 我的檢舉 ──────────────────────────────────────────
const REPORT_STATUS_MAP = {
  pending:  { text: '審核中', cls: 'rpt-badge rpt-pending' },
  approved: { text: '已通過', cls: 'rpt-badge rpt-approved' },
  rejected: { text: '已駁回', cls: 'rpt-badge rpt-rejected' },
};

let _reportCatCache = null;
async function _getReportCatMap() {
  if (_reportCatCache) return _reportCatCache;
  try {
    const res = await backendService.getReportCategories();
    const arr = res?.data ?? res ?? [];
    const list = Array.isArray(arr) ? arr : (arr?.categories ?? arr?.data ?? []);
    _reportCatCache = Object.fromEntries(list.map(c => [c.category ?? c.key, c.meaning ?? c.description ?? c.category]));
  } catch (_) { _reportCatCache = {}; }
  return _reportCatCache;
}

async function loadMyReports(page = 1) {
  const list  = document.getElementById('myReportsList');
  const pager = document.getElementById('myReportsPager');
  if (!list) return;
  list.innerHTML = '<div class="text-center text-muted py-4" style="font-size:14px;">載入中...</div>';
  pager.innerHTML = '';
  try {
    const [res, catMap] = await Promise.all([
      backendService.getMyReports({ page, limit: 10 }),
      _getReportCatMap(),
    ]);
    const reports    = res?.data?.reports ?? [];
    const pagination = res?.data?.pagination ?? {};
    if (!reports.length) {
      list.innerHTML = `
        <div class="review-empty">
          <i class="ti ti-flag-off review-empty-icon"></i>
          <div class="review-empty-title">尚未送出任何檢舉</div>
          <div class="review-empty-sub">在商品頁或評價旁點擊檢舉按鈕即可送出</div>
        </div>`;
      return;
    }
    list.innerHTML = reports.map(r => {
      const st = REPORT_STATUS_MAP[r.status] ?? { text: r.status, cls: 'rpt-badge rpt-rejected' };
      const date = r.createdAt ? fmtDate(r.createdAt) : '';
      const meaning = catMap[r.category] ?? r.category ?? '';
      const noteHtml = r.reviewNote
        ? `<div class="rpt-note"><i class="ti ti-message-2"></i>${htmlEncode(r.reviewNote)}</div>` : '';
      const detailHtml = r.detail
        ? `<div class="rpt-detail">${htmlEncode(r.detail)}</div>` : '';
      return `
        <div class="rpt-card">
          <div class="rpt-card-top">
            <span class="rpt-subject">${htmlEncode(r.subject ?? '')}</span>
            <span class="${st.cls}">${st.text}</span>
          </div>
          <div class="rpt-card-meta">
            <span>${htmlEncode(meaning)}</span>
            <span class="rpt-dot"></span>
            <span>${date}</span>
          </div>
          ${detailHtml}
          ${noteHtml}
        </div>`;
    }).join('');

    const total = pagination.totalPages ?? 1;
    if (total > 1) {
      let html = '<div class="order-pagination">';
      for (let i = 1; i <= total; i++) {
        html += `<button class="order-page-num${i === page ? ' active' : ''}" onclick="loadMyReports(${i})">${i}</button>`;
      }
      html += '</div>';
      pager.innerHTML = html;
    }
  } catch (e) {
    list.innerHTML = '<div class="review-empty"><i class="ti ti-alert-circle review-empty-icon"></i><div class="review-empty-title">載入失敗</div><div class="review-empty-sub">請稍後再試</div></div>';
  }
}
window.loadMyReports = loadMyReports;

// ── 被其他用戶檢舉紀錄 ─────────────────────────────────
async function loadReportHistory(page = 1) {
  const LIMIT = 10;
  const list  = document.getElementById('receivedReportsList');
  const pager = document.getElementById('receivedReportsPager');
  if (!list) return;
  list.innerHTML = '<div class="text-center text-muted py-4" style="font-size:14px;">載入中...</div>';
  pager.innerHTML = '';
  try {
    const res = await backendService.getReportHistory({ page, limit: LIMIT });
    const records    = res?.data?.reports ?? [];
    const pagination = res?.data?.pagination ?? {};
    if (!records.length) {
      list.innerHTML = `
        <div class="review-empty">
          <i class="ti ti-shield-check review-empty-icon"></i>
          <div class="review-empty-title">目前沒有被檢舉紀錄</div>
          <div class="review-empty-sub">維持良好交易行為即可保持清白紀錄</div>
        </div>`;
      return;
    }
    list.innerHTML = records.map(r => {
      const delta = Number(r.scoreDelta ?? 0);
      const deltaSign = delta >= 0 ? '+' : '';
      const deltaCls  = delta < 0 ? 'rh-delta rh-delta-neg' : 'rh-delta rh-delta-pos';
      const date = r.updatedAt ? fmtDate(r.updatedAt) : '';
      return `
        <div class="rpt-card">
          <div class="rpt-card-top">
            <span class="rpt-subject">${htmlEncode(r.subject ?? '')}</span>
            <span class="${deltaCls}">${deltaSign}${delta} 分</span>
          </div>
          <div class="rpt-card-meta">
            <span>${date}</span>
          </div>
        </div>`;
    }).join('');

    const total = pagination.totalPages ?? 1;
    if (total > 1) {
      let html = '<div class="order-pagination">';
      for (let i = 1; i <= total; i++) {
        html += `<button class="order-page-num${i === page ? ' active' : ''}" onclick="loadReportHistory(${i})">${i}</button>`;
      }
      html += '</div>';
      pager.innerHTML = html;
    }
  } catch (e) {
    list.innerHTML = '<div class="review-empty"><i class="ti ti-alert-circle review-empty-icon"></i><div class="review-empty-title">載入失敗</div><div class="review-empty-sub">請稍後再試</div></div>';
  }
}
window.loadReportHistory = loadReportHistory;