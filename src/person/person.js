import BackendService from '../BackendService.js';
import ChatBackendService from '../chatroom/ChatBackendService.js';
import wpBackendService from '../wpBackendService.js';

let backendService;
let chatService;
let goodsOrder;
const MY_ITEMS_LIMIT = 10;
let myItemsPage = 1;
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
        Swal.fire({
          title: '已取消訂單，系統將自動通知對方', 
          icon: 'success',
          confirmButtonText: "ok",
        }).then(async () => {
          // 重新載入當前頁面資料
          handleRouting();
        }).then(() => window.location.reload());
      } catch (error) {
        Swal.fire({ title: '訂單取消失敗', icon: 'error', text: error });
      } 
    }
  } else if(action === '接受訂單') {
    try {
      await backendService.sellerAcceptOrders(id);
      Swal.fire({ title: '已同意訂單', icon: 'success' }).then(() => handleRouting()).then(()=> window.location.reload());
    } catch (error) {
      Swal.fire({ title: '訂單同意失敗', icon: 'error', text: error });
    }
  } else if (action === '即將出貨') {
    try {
      await backendService.sellerDeliveredOrders(id);
      Swal.fire({ title: '已登記出貨', icon: 'success' }).then(() => handleRouting()).then(()=> window.location.reload());
    } catch (error) {
      Swal.fire({ title: '系統登記出貨失敗', icon: 'error', text: error });
    }
  } else if (action === '成功取貨') {
    try {
      await backendService.buyerCompletedOrders(id);
      Swal.fire({ title: "交易完成！", icon: "success" }).then(() => handleRouting()).then(() => window.location.reload());
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

  // 進入列表時恢復篩選 tabs（進詳細頁才隱藏）
  document.getElementById('sellFilter')?.classList.remove('d-none');
  document.getElementById('buyFilter')?.classList.remove('d-none');

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
      document.querySelector('#sellProducts tbody').innerHTML =
        `<tr><td colspan="4" class="text-center py-4"><div class="spinner-border spinner-border-sm text-secondary" role="status"></div></td></tr>`;
      document.getElementById('sell-product').innerHTML =
        `<div class="col-12 text-center py-4"><div class="spinner-border spinner-border-sm text-secondary" role="status"></div></div>`;
      await loadSellerOrders(1);
    } else if (page === 'buyProducts') {
      window.currentOrder = null;
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



function resetOrderView() {
  document.getElementById('sellOrderDetail')?.classList.add('d-none');
  document.getElementById('buyerOrderDetail')?.classList.add('d-none');
  document.querySelector('#sellProducts .mobile-back-btn')?.classList.remove('d-none');
  document.querySelector('#buyProducts .mobile-back-btn')?.classList.remove('d-none');
}

async function loadSellerOrders(page) {
  const res = await backendService.getSellerOrders(page);
  const list = res?.data?.data?.orders ?? [];
  const pagination = res?.data?.data?.pagination ?? {};
  goodsOrder = list;
  renderSellerOrders(list);
  renderSellerCards(list);
  renderOrderPagination('sellPagination', pagination, loadSellerOrders);
}

async function loadBuyerOrders(page) {
  const res = await backendService.getBuyerOrders(page);
  const list = res?.data?.data?.orders ?? [];
  const pagination = res?.data?.data?.pagination ?? {};
  goodsOrder = list;
  renderBuyerOrders(list);
  renderBuyerCards(list);
  renderOrderPagination('buyPagination', pagination, loadBuyerOrders);
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

  // 監聽瀏覽器上一頁/下一頁
  window.onpopstate = function() {
    handleRouting();
  };

});

// ===== 工具 =====
const order_STATUS_MAP = {
  pending: { text: '待確認', badge: 'order-badge-pending', action: '接受訂單', icon: '../svg/acceptOrder.svg'},
  preparing: { text: '待出貨', badge: 'order-badge-preparing', action: '即將出貨', icon: '../svg/readyDeliver.svg'},
  delivered: { text: '待收貨', badge: 'order-badge-delivered', action: '等待買家確認收貨', icon: '../svg/waitBuyer.svg'},
  completed: { text: '待評價', badge: 'order-badge-completed', action: '給對方評價', icon: '../svg/giveStar.svg'},
  canceled: { text: '已取消', badge: 'order-badge-canceled', action: '給對方評價', icon: '../svg/giveStar.svg'}
}
const buyer_STATUS_MAP = {
  pending: { text: '待確認', badge: 'order-badge-pending', action: '聯絡賣家', icon: '../svg/canChat.svg'},
  preparing: { text: '待出貨', badge: 'order-badge-preparing', action: '聯絡賣家', icon: '../svg/canChat.svg'},
  delivered: { text: '待收貨', badge: 'order-badge-delivered', action: '成功取貨', icon: '../svg/acceptOrder.svg'},
  completed: { text: '待評價', badge: 'order-badge-completed', action: '給對方評價', icon: '../svg/giveStar.svg'},
  canceled: { text: '已取消', badge: 'order-badge-canceled', action: '給對方評價', icon: '../svg/giveStar.svg'}
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
  const rows = list.map(item => {
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
      <tr data-id="${esc(id)}">
        <td>${label}</td>
        <td><span class="badge ${st.badge}">${st.text}</span></td>
        <td>${created}</td>
        <td>${price} 元</td>
        <td>
          <div class="d-flex gap-2">
            <button class="checkInfoBtn action-btn btn-row-action" data-action="${st.action}" data-id="${id}">
              <img src="${st.icon}" alt="${st.action}icon"/>
              <div>${st.action}</div>
            </button>
            ${item.status == 'pending' || item.status == 'preparing' ? `<button class="cancelOrderBtn action-btn btn-row-action" data-action="cancel" data-id="${id}"><img src="../svg/cancelOrder.svg" alt="取消訂單icon"/><div>取消訂單</div></button>` : ''}
            <button class="checkInfoBtn action-btn btn-row-action" data-action="checkInfo" data-id="${id}">
              <img src="../svg/orderInfo.svg" alt="訂單詳情icon"/>
              <div>訂單詳情</div>
            </button>
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
  const rows = list.map(item => {
    const id       = item.id;
    const name     = esc(item.name);
    const label    = fmtOrderLabel(item);
    const price    = fmtPrice(item.totalAmount);
    const buyer = item.buyerUser?.name ?? '';
    const type = item.type || '未知交易方式';
    const created  = fmtDate(item.createdAt);
    const key      = (item.status ?? 'listed').toLowerCase();
    const st       = order_STATUS_MAP[key] ?? order_STATUS_MAP.pending;
    const isDisabled = (st.action === '等待買家確認收貨') ? 'disabled' : '';
    return `
      <tr data-id="${esc(id)}">
        <td>${label}</td>
        <td><span class="badge ${st.badge}">${st.text}</span></td>
        <td>${created}</td>
        <td>
          <div class="d-flex gap-2">
            <button class="checkInfoBtn action-btn btn-row-action" data-action="${st.action}" data-id="${id}" ${isDisabled}>
              <img src="${st.icon}" alt="${st.action}icon"/>
              <div>${st.action}</div>
            </button>
            ${item.status == 'pending' || item.status == 'preparing' ? `<button class="cancelOrderBtn action-btn btn-row-action" data-action="cancel" data-id="${id}"><img src="../svg/cancelOrder.svg" alt="取消訂單icon"/><div>取消訂單</div></button>` : ''}
            <button class="checkInfoBtn action-btn btn-row-action" data-action="checkInfo" data-id="${id}">
              <img src="../svg/orderInfo.svg" alt="訂單詳情icon"/>
              <div>訂單詳情</div>
            </button>
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

  const rows = list.map(item => {
    const id       = item.id;
    const name     = esc(item.name);
    const price    = fmtPrice(item.price);
    const updated  = fmtDate(item.updatedAt);
    const created  = fmtDate(item.createdAt);
    const quantity = item.stock;
    const stockStyle = quantity === 0 ? 'color: #dc3545; font-weight: bold;' : '';

    return `
      <tr data-id="${esc(id)}">
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

  const html = list.map(item => {
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
        <div class="cardContainer h-100">
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

  const html = list.map(item => {
    const id       = item.id;
    const name     = esc(item.name);
    const label    = fmtOrderLabel(item);
    const price    = fmtPrice(item.totalAmount);
    const updated  = fmtDate(item.updatedAt);
    const created  = fmtDate(item.createdAt);
    const key      = (item.status ?? 'listed').toLowerCase();
    const st       = order_STATUS_MAP[key] ?? order_STATUS_MAP.pending;
    const isDisabled = (st.action === '等待買家確認收貨') ? 'disabled' : '';

    return `
      <div class="col" data-id="${esc(id)}">
        <div class="cardContainer h-100">
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
            <div class="mt-auto d-flex gap-2">
              <button class="checkInfoBtn action-btn btn-card-action" data-id="${id}" data-action="${st.action}" ${isDisabled}>
                <img src="${st.icon}" alt="${st.action}icon"/>
                <div>${st.action}</div>
              </button>
              ${item.status == 'pending' || item.status == 'preparing' ? `<button class="cancelOrderBtn action-btn btn-row-action" data-action="cancel" data-id="${id}"><img src="../svg/cancelOrder.svg" alt="取消訂單icon"/><div>取消訂單</div></button>` : ''}
              <button class="checkInfoBtn action-btn btn-row-action" data-action="checkInfo" data-id="${id}">
                <img src="../svg/orderInfo.svg" alt="訂單詳情icon"/>
                <div>訂單詳情</div>
              </button>
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

  const html = list.map(item => {
    const id       = item.id;
    const name     = esc(item.name);
    const label    = fmtOrderLabel(item);
    const price    = fmtPrice(item.totalAmount);
    const created  = fmtDate(item.createdAt);
    const key      = (item.status ?? 'listed').toLowerCase();
    const st       = buyer_STATUS_MAP[key] ?? buyer_STATUS_MAP.pending;

    return `
      <div class="col" data-id="${esc(id)}">
        <div class="cardContainer h-100">
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
            <div class="mt-auto d-flex gap-2">
              <button class="checkInfoBtn action-btn btn-card-action" data-id="${id}" data-action="${st.action}">
                <img src="${st.icon}" alt="${st.action}icon"/>
                <div>${st.action}</div>
              </button>
              ${item.status == 'pending' || item.status == 'preparing' ? `<button class="cancelOrderBtn action-btn btn-row-action" data-action="cancel" data-id="${id}"><img src="../svg/cancelOrder.svg" alt="取消訂單icon"/><div>取消訂單</div></button>` : ''}
              <button class="checkInfoBtn action-btn btn-row-action" data-action="checkInfo" data-id="${id}">
                <img src="../svg/orderInfo.svg" alt="訂單詳情icon"/>
                <div>訂單詳情</div>
              </button>
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
      pending: "訂單已建立，等待賣家接受",
      preparing: "賣家已接受訂單，正在準備商品",
      delivered: "賣家已出貨，等待買家確認收貨",
      completed: "買家已確認收貨，訂單完成",
      canceled: "訂單已取消"
    };

    const orderTypeMap = {
      c2c: "面交取貨"
    };

    const infoBox = isSell
      ? document.getElementById('sellOrderInfo')
      : document.getElementById('buyerOrderInfo');

    infoBox.innerHTML = `
      <ul style="font-size: 1rem;">
        <li><span class="orderstyle">訂單編號</span>${id}</li>
        <li><span class="orderstyle">建立日期</span>${new Date(data.createdAt).toLocaleDateString()}</li>
        <li><span class="orderstyle">商品狀態</span>${orderStatusMap[data.status]}</li>
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
      <hr>
      <span class="orderstyle">訂購商品</span>
      <table class="align-middle responsive-table mt-3" style="border: none;">
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
                 style="width:80px;height:80px;object-fit:cover;">
          </td>
          <td data-label="名稱">${htmlEncode(item?.item.name)}</td>
          <td data-label="購買數量">${item.quantity}</td>
          <td data-label="單價(元)">${item.price}</td>
        </tr>
      `).join('');
    }

    updateStatusUI(data);

    // 切換畫面
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

const updateStatusUI = (data) => {
  const logs = data.logs || [];
  const statusItems = document.querySelectorAll('.status-item');

  const cancelLog = logs.find(log => log.status === 'canceled');
  const scoreLog = logs.find(log => log.status === 'scored');

  // 1️⃣ reset
  statusItems.forEach(item => {
    const img = item.querySelector('img');
    const timeBox = item.querySelector('.timestamp');
    const text = item.querySelector('.stateText');
    const statusName = item.dataset.status;

    // reset icon
    img.src = `../svg/${statusName}yet.svg`;
    timeBox.innerText = '';
    item.classList.remove('active');

    // reset text（可依你的原本 HTML 定義）
    const defaultTextMap = {
      pending: "訂單已建立<br>等待賣家接受",
      preparing: "賣家已接受訂單<br>正在準備商品",
      delivered: "賣家已出貨<br>等待買家確認收貨",
      completed: "買家已確認收貨<br>訂單完成",
      scored: "雙方皆已<br>評分完成"
    };
    if (text) text.innerHTML = defaultTextMap[statusName];
  });

  // 2️⃣ fill logs
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
      } else if (statusName === 'scored') {
        // scored 保持灰色，等雙方評分完才亮（不改 icon、不改文字、不加時間）
      } else {
        // 中間未完成的步驟 → cancel icon + 取消時間（時間只放 timeBox，不重複放 text）
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

  const targetPhoto     = targetUser?.photoURL || '../image/default-avatar.webp';
  const targetName      = targetUser?.name || roleName;
  const targetCredit    = targetUser?.rate ?? '-';
  const resolvedTargetId = targetUser?.id ?? targetUser?.accountId ?? targetId;

  // ── 正評項目（依角色分開）──────────────────────────────
  const buyerPositiveItems = [
    { key: 'onTime',        label: '準時赴約' },
    { key: 'communication', label: '溝通禮貌' },
    { key: 'reliability',   label: '交易可靠' },
  ];
  const sellerPositiveItems = [
    { key: 'accurate',  label: '商品描述準確' },
    { key: 'fast',      label: '出貨速度快' },
    { key: 'polite',    label: '溝通禮貌' },
    { key: 'reliable',  label: '交易可靠' },
    { key: 'packaging', label: '包裝完整' },
  ];
  const positiveItems = isRatingBuyer ? buyerPositiveItems : sellerPositiveItems;
  const maxPositive   = positiveItems.length;

  // ── 負評項目（依角色分開）──────────────────────────────
  const buyerNegativeItems = [
    { key: 'noShow',   label: '無故爽約或失聯', credit: -15, desc: '買家確認後不出現，且無事先告知' },
    { key: 'late',     label: '遲到超過 10 分鐘', credit: -5,  desc: '面交時間超過約定 10 分鐘以上' },
  ];
  const sellerNegativeItems = [
    { key: 'mismatch', label: '商品與描述嚴重不符', credit: -10, desc: '商品狀況與頁面描述有明顯落差' },
    { key: 'late',     label: '遲到超過 10 分鐘',   credit: -5,  desc: '面交時間超過約定 10 分鐘以上' },
  ];
  const negativeItems = isRatingBuyer ? buyerNegativeItems : sellerNegativeItems;

  const positiveHtml = positiveItems.map(item => `
    <label class="review-chip">
      <input type="checkbox" class="score-check" data-key="${item.key}">
      <span>${item.label}</span>
    </label>`).join('');

  const negativeHtml = negativeItems.map(item => `
    <label class="review-neg-card">
      <div class="review-neg-card__top">
        <input type="checkbox" class="negative-check" data-key="${item.key}" data-credit="${item.credit}">
        <span class="review-neg-card__label">${item.label}</span>
        <span class="credit-badge negative">${item.credit}</span>
      </div>
      <small class="negative-desc">${item.desc}</small>
    </label>`).join('');

  Swal.fire({
    title: `為${roleName}評分`,
    html: `
      <div id="review-list">

        <!-- 被評者資訊 -->
        <div class="review-target-row">
          <img src="${targetPhoto}" alt="${roleName}頭像" class="review-target-avatar"/>
          <div>
            <div class="review-target-name">${targetName}</div>
            <div class="review-target-credit">
              <i class="ti ti-star-filled" style="color:#f5a623;"></i>
              信譽積分：<strong>${targetCredit}</strong>
            </div>
          </div>
        </div>

        <!-- 信用分說明 -->
        <div class="review-credit-hint">
          <span>完成交易雙方各得 <span class="credit-badge positive">+5</span></span>
          <span>評價良好對方額外獲得 <span class="credit-badge positive">+2</span></span>
        </div>

        <!-- 正評 -->
        <div class="review-section-label">正評項目 <span class="review-section-hint">（可複選）</span></div>
        <div class="review-chips-row">${positiveHtml}</div>

        <!-- 負評 -->
        <div class="review-section-label review-section-label-neg">
          ⚠️ 回報問題 <span class="review-section-hint">（核實後對方扣分）</span>
        </div>
        <div class="review-neg-list">${negativeHtml}</div>

        <!-- 文字評價 -->
        <textarea id="review-comment" class="review-comment-input" rows="3" placeholder="留下文字評價（選填）..."></textarea>

        <!-- 分數預覽 -->
        <div class="review-score-preview">
          已選正評：<span id="score-preview">0</span> / ${maxPositive}
          <span id="negative-preview"></span>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: '送出評價',
    cancelButtonText: '取消',
    width: 560,

    didOpen: () => {
      initScoreCheckbox();
    },

    preConfirm: async () => {
      const positiveScore = calcScore();
      const negativeKeys  = [];
      document.querySelectorAll('.negative-check:checked').forEach(cb => {
        negativeKeys.push(cb.dataset.key);
      });
      const comment = document.getElementById('review-comment').value.trim();

      if (positiveScore === 0 && negativeKeys.length === 0) {
        Swal.showValidationMessage('請至少勾選一項正評或回報問題');
        return false;
      }

      try {
        const scores = {};
        document.querySelectorAll('.score-check').forEach(cb => {
          scores[cb.dataset.key] = cb.checked ? 1 : 0;
        });

        const body = {
          orderId,
          targetId: resolvedTargetId,
          comment,
          // 正評欄位
          ...scores,
          // 負評回報
          reportedIssues: negativeKeys,
          // 總正評分（供後端計算 +2 是否達標）
          positiveScore,
          maxPositive,
        };

        const res = await fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || '送出失敗');
        return data;
      } catch (err) {
        Swal.showValidationMessage(err.message);
        return false;
      }
    }
  }).then(result => {
    if (result.isConfirmed) {
      Swal.fire({
        icon: 'success',
        title: '評價已送出',
        text: '完成交易，信用積分 +5 將自動更新。',
        timer: 2500,
        showConfirmButton: false,
      });
    }
  });
}

function initScoreCheckbox() {
  document.querySelectorAll('.score-check').forEach(cb => {
    cb.addEventListener('change', () => {
      document.getElementById('score-preview').innerText = calcScore();
    });
  });
  document.querySelectorAll('.negative-check').forEach(cb => {
    cb.addEventListener('change', () => {
      const total = [...document.querySelectorAll('.negative-check:checked')]
        .reduce((sum, el) => sum + Number(el.dataset.credit), 0);
      const el = document.getElementById('negative-preview');
      if (total < 0) {
        el.innerHTML = `申訴扣分：<span style="color:#dc3545;font-weight:700;">${total}</span>`;
      } else {
        el.innerHTML = '';
      }
    });
  });
}

function calcScore() {
  let score = 0;
  document.querySelectorAll('.score-check:checked').forEach(() => score++);
  return score;
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

  // Label maps (reviewer is buyer when isSell=true, seller when isSell=false)
  const buyerPositiveLabels = { onTime: '準時赴約', communication: '溝通禮貌', reliability: '交易可靠' };
  const sellerPositiveLabels = { accurate: '商品描述準確', fast: '出貨速度快', polite: '溝通禮貌', reliable: '交易可靠', packaging: '包裝完整' };
  const buyerNegativeLabels  = { noShow: '無故爽約或失聯', late: '遲到超過 10 分鐘' };
  const sellerNegativeLabels = { mismatch: '商品與描述嚴重不符', late: '遲到超過 10 分鐘' };

  const positiveLabels = isSell ? buyerPositiveLabels : sellerPositiveLabels;
  const negativeLabels = isSell ? buyerNegativeLabels : sellerNegativeLabels;

  let review = null;
  try {
    const res = await backendService.getOrderReview(orderId);
    review = res?.data?.data ?? res?.data ?? null;
  } catch (e) {
    // 尚無評論
  }

  let bodyHtml = '';
  if (review) {
    // New format: individual keys + reportedIssues
    const checkedPositive = Object.entries(positiveLabels)
      .filter(([key]) => review[key] === 1 || review[key] === true);
    const reportedIssues = Array.isArray(review.reportedIssues) ? review.reportedIssues : [];

    const positiveChips = checkedPositive.length
      ? checkedPositive.map(([, label]) =>
          `<span class="review-display-chip positive">${label}</span>`).join('')
      : '';
    const negativeChips = reportedIssues.length
      ? reportedIssues.map(key =>
          `<span class="review-display-chip negative">${negativeLabels[key] ?? key}</span>`).join('')
      : '';

    // Fallback: if no individual keys, show star score
    const hasNewFormat = checkedPositive.length > 0 || reportedIssues.length > 0;
    const legacyHtml = !hasNewFormat && review.score != null
      ? `<div class="review-display-stars">${renderStars(review.score, isSell ? 3 : 5)}</div>`
      : '';

    bodyHtml = `
      ${legacyHtml}
      ${positiveChips ? `
        <div class="review-display-section">
          <div class="review-display-label">正評項目</div>
          <div class="review-display-chips">${positiveChips}</div>
        </div>` : ''}
      ${negativeChips ? `
        <div class="review-display-section">
          <div class="review-display-label neg">回報問題</div>
          <div class="review-display-chips">${negativeChips}</div>
        </div>` : ''}
      <div class="review-display-comment">${review.comment || '<span style="color:#aaa">（無文字評論）</span>'}</div>
    `;
  } else {
    bodyHtml = '<div class="review-display-empty">對方尚未留下評論</div>';
  }

  Swal.fire({
    title: '對方評論',
    html: `
      <div class="review-target-row">
        <img src="${partnerPhoto}" class="review-target-avatar" alt="${partnerName}頭像">
        <div>
          <div class="review-target-name">${partnerName}</div>
          <div class="review-target-credit">
            <i class="ti ti-star-filled" style="color:#f5a623;"></i>
            信譽積分：<strong>${partnerCredit}</strong>
          </div>
          ${partnerIntro ? `<div style="font-size:12px;color:#888;margin-top:2px;">${partnerIntro}</div>` : ''}
        </div>
      </div>
      ${bodyHtml}
    `,
    confirmButtonText: '關閉',
    width: 500,
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

// Render received reviews into sidebar #reviewsContainer
function renderReviewsContainer(reviews) {
  const container = document.getElementById('reviewsContainer');
  if (!container) return;
  if (!reviews || reviews.length === 0) {
    container.innerHTML = `<div class="review-empty">尚無評價紀錄</div>`;
    return;
  }
  const POSITIVE_LABELS = { onTime: '準時赴約', communication: '溝通禮貌', reliability: '交易可靠', accurate: '商品描述準確', fast: '出貨速度快', polite: '溝通禮貌', reliable: '交易可靠', packaging: '包裝完整' };
  const NEGATIVE_LABELS = { noShow: '無故爽約或失聯', mismatch: '商品與描述嚴重不符', late: '遲到超過 10 分鐘' };
  container.innerHTML = reviews.map(review => {
    const name    = review?.reviewerUser?.name ?? review?.reviewerName ?? '評價者';
    const photo   = review?.reviewerUser?.photoURL ?? '../image/default-avatar.webp';
    const item    = review?.itemName ?? '';
    const time    = review?.createdAt ? new Date(review.createdAt).toLocaleDateString('zh-TW') : '';
    const comment = review?.comment ?? '';
    const positiveChips = Object.entries(POSITIVE_LABELS)
      .filter(([key]) => review?.[key] === 1 || review?.[key] === true)
      .map(([, label]) => `<span class="review-display-chip positive">${label}</span>`)
      .join('');
    const negativeChips = (Array.isArray(review?.reportedIssues) ? review.reportedIssues : [])
      .map(key => `<span class="review-display-chip negative">${NEGATIVE_LABELS[key] ?? key}</span>`)
      .join('');
    return `
      <div class="review-card">
        <div class="review-card__header">
          <img src="${photo}" alt="${name}" class="reviewer-avatar">
          <div class="review-card__meta">
            <span class="reviewerName">${name}</span>
            ${item ? `<div class="itemNames">${item}</div>` : ''}
          </div>
          ${time ? `<div class="reviewTime">${time}</div>` : ''}
        </div>
        ${positiveChips || negativeChips ? `<div class="review-card__chips">${positiveChips}${negativeChips}</div>` : ''}
        ${comment ? `<div class="reviewText">${comment}</div>` : ''}
      </div>`;
  }).join('');
}