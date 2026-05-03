import BackendService from '../BackendService.js';

let backendService;

// ── 登入狀態快取 ──
// _authReady 在 whoami 完成後 resolve，之後所有 requireLogin() 直接查快取
let _authResolve;
window._authReady = new Promise(resolve => { _authResolve = resolve; });
window.isLoggedIn = false;

// 當整個頁面載入完成後，隱藏 loader 並顯示主要內容
window.onload = function() {
    // 當頁面載入完畢後隱藏載入動畫，顯示內容
  var loader = document.getElementById('loader');
  var content = document.getElementById('whatcontent');
  if (loader && content) {
    loader.classList.add('d-none');
    loader.classList.remove('d-flex');
    content.classList.remove('d-none');
    // loader.style.setProperty('display', 'none', 'important');
    // content.style.setProperty('display', 'block', 'important');
  }
};

  document.addEventListener('DOMContentLoaded', function() {
    const mobileSearchIcon = document.getElementById('mobileSearchIcon');
    const searchForm = document.getElementById('searchForm');
    if(mobileSearchIcon != null) {
      // 手機版：點擊黑色搜尋圖示時，隱藏該圖示並顯示搜尋表單（新行出現）
      mobileSearchIcon.addEventListener('click', function() {
        mobileSearchIcon.style.display = 'none';
        searchForm.style.display = 'flex';

        // 自動將游標焦點移至搜尋輸入框
        const input = searchForm.querySelector('input');
        if (input) {
          input.focus();
        }
      });
    }

    // 手機版底部導覽列：點擊時設定 sessionStorage 旗標，讓目標頁跳過載入動畫
    document.querySelectorAll('.bottom-nav-item').forEach(function(item) {
      item.addEventListener('click', function() {
        if (window.innerWidth <= 991) {
          sessionStorage.setItem('skipLoader', '1');
        }
      });
    });

  });
async function renderAuthUI() {
  try {
      backendService = new BackendService();
      const user = await backendService.whoami(); // 成功代表已登入
      window.isLoggedIn = true;
      sessionStorage.removeItem('_loginExpiredDeclined');
      _authResolve(true);
      document.querySelectorAll('.loginornot').forEach((el) => {
        if (el.classList.contains('nav-menu-item')) {
          el.innerHTML = '<i class="ti ti-logout me-2"></i>登出';
        } else {
          el.textContent = '登出';
        }
        el.href = '#';
        el.onclick = (e) => {
          e.preventDefault();
          doLogout();
        };
      });

      // 更新底部導覽列「我的帳戶」icon 為使用者頭像（已登入時）
      const userAvatar = localStorage.getItem('avatar');
      if (userAvatar && userAvatar !== 'null' && userAvatar !== '') {
        document.querySelectorAll('.bottom-nav-item .nav-icon[src*="default-avatar"]').forEach(img => {
          img.src = userAvatar;
          img.style.borderRadius = '50%';
          img.style.border = '1px solid #004b97';
          img.style.objectFit = 'cover';
        });
        document.querySelectorAll('.bottom-nav-item .nav-icon[src*="default-avatarnotactive"]').forEach(img => {
          img.src = userAvatar;
          img.style.borderRadius = '50%';
          img.style.border = '1px solid #ABDAD5';
          img.style.objectFit = 'cover';
        });
      }

      // 桌機版 navbar 下拉選單：已登入狀態
      const avatarSrc = (userAvatar && userAvatar !== 'null' && userAvatar !== '') ? userAvatar : '../image/default-avatar.webp';
      document.querySelectorAll('.username').forEach((el) => {
        el.innerHTML = `<img class="nav-username-avatar" src="${avatarSrc}" alt="頭像">`;
        el.style.display = '';
      });
      document.querySelectorAll('.nav-user-avatar, .nav-user-avatar-sm').forEach(img => { img.src = avatarSrc; });
      document.querySelectorAll('.nav-guest-label').forEach(el => el.classList.add('d-none'));
      document.querySelectorAll('.nav-loggedin-area').forEach(el => el.classList.remove('d-none'));
      document.querySelectorAll('.nav-user-menu-header').forEach(el => el.classList.remove('d-none'));

      // 下拉選單 header 顯示姓名
      const userName = localStorage.getItem('username') || '';
      document.querySelectorAll('.nav-menu-name').forEach(el => { el.textContent = userName; });

      // Session keep-alive：每 5 分鐘 ping 一次，避免 cookie session 過期
      setInterval(async () => {
        try { await backendService.whoami(); } catch (_) {}
      }, 5 * 60 * 1000);

      // 登入後立即更新購物車數量
      refreshCartBadge();

      // 通知系統
      _initNotifSystem();
      _loadNotifications();

    } catch (err) {
      window.isLoggedIn = false;
      _authResolve(false);
      document.querySelectorAll('.username').forEach((el) => {
        el.innerHTML = `<img class="nav-username-avatar" src="../image/default-avatar.webp" alt="頭像">`;
        el.style.display = '';
        const currentUrl = window.location.pathname + window.location.search;
        el.href = `../account/account.html?redirect=${encodeURIComponent(currentUrl)}`;
      });
      document.querySelectorAll('.nav-user-avatar, .nav-user-avatar-sm').forEach(img => { img.src = '../image/default-avatar.webp'; });

      document.querySelectorAll('.loginornot').forEach((el) => {
        if (el.classList.contains('nav-menu-item')) {
          el.innerHTML = '<i class="ti ti-login me-2"></i>登入';
        } else {
          el.textContent = '登入';
        }

        const currentUrl = window.location.pathname + window.location.search;
        el.href = `../account/account.html?redirect=${encodeURIComponent(currentUrl)}`;

        el.onclick = null;
      });

      // 桌機版 navbar 下拉選單：未登入狀態
      document.querySelectorAll('.nav-guest-label').forEach(el => el.classList.remove('d-none'));
      document.querySelectorAll('.nav-loggedin-area').forEach(el => el.classList.add('d-none'));
      document.querySelectorAll('.nav-user-menu-header').forEach(el => el.classList.add('d-none'));
    }
}

// 供 BackendService 401 攔截器呼叫：更新 navbar 為未登入狀態（不跳頁）
window._showLoggedOutUI = function() {
  window.isLoggedIn = false;
  localStorage.removeItem('uid');
  localStorage.removeItem('username');
  localStorage.removeItem('avatar');
  document.querySelectorAll('.username').forEach((el) => {
    el.innerHTML = `<img class="nav-username-avatar" src="../image/default-avatar.webp" alt="頭像">`;
    el.style.display = '';
    const currentUrl = window.location.pathname + window.location.search;
    el.href = `../account/account.html?redirect=${encodeURIComponent(currentUrl)}`;
  });
  document.querySelectorAll('.nav-user-avatar, .nav-user-avatar-sm').forEach(img => { img.src = '../image/default-avatar.webp'; });
  document.querySelectorAll('.loginornot').forEach((el) => {
    if (el.classList.contains('nav-menu-item')) {
      el.innerHTML = '<i class="ti ti-login me-2"></i>登入';
    } else {
      el.textContent = '登入';
    }
    const currentUrl = window.location.pathname + window.location.search;
    el.href = `../account/account.html?redirect=${encodeURIComponent(currentUrl)}`;
    el.onclick = null;
  });
  document.querySelectorAll('.nav-guest-label').forEach(el => el.classList.remove('d-none'));
  document.querySelectorAll('.nav-loggedin-area').forEach(el => el.classList.add('d-none'));
  document.querySelectorAll('.nav-user-menu-header').forEach(el => el.classList.add('d-none'));
};

async function doLogout() {
  await backendService.logout(); // 清除 token
  // 自動登出提示
  let timerInterval;
  Swal.fire({
    title: "登出成功",
    html: "將在 <b></b> 秒後回到登入頁",
    timer: 3000, // 2 秒後自動跳轉
    timerProgressBar: true,
    didOpen: () => {
      Swal.showLoading();
      const timer = Swal.getPopup().querySelector("b");
      timerInterval = setInterval(() => {
        timer.textContent = Math.ceil(Swal.getTimerLeft() / 1000);
      }, 100);
    },
    willClose: () => {
      clearInterval(timerInterval);
    }
  }).then(() => {
    location.href = '../account/account.html';
  });
}

// ── 購物車數量 badge ──────────────────────────────────────────────
async function refreshCartBadge() {
  try {
    const res = await backendService.getMyCart();
    const items =
      res?.data?.data?.cartItems ??
      res?.data?.cartItems ??
      [];
    const count = items.reduce((sum, row) => sum + (Number(row.quantity) || 1), 0);
    _setCartBadge(count);
  } catch (_) {
    // 未登入或失敗時不顯示 badge
    _setCartBadge(0);
  }
}

function _setCartBadge(count) {
  document.querySelectorAll('a[href*="shoppingcart"]').forEach(link => {
    let badge = link.querySelector('.cart-badge');
    if (count > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'cart-count cart-badge';
        link.style.position = 'relative';
        link.style.display = link.style.display || 'inline-flex';
        link.appendChild(badge);
      }
      badge.textContent = count > 99 ? '99+' : count;
      // 彈跳動畫
      badge.classList.remove('bump');
      void badge.offsetWidth; // reflow
      badge.classList.add('bump');
    } else if (badge) {
      badge.remove();
    }
  });
}

// 暴露給各頁面（加入購物車後呼叫更新）
window.refreshCartBadge = refreshCartBadge;

// ── Tooltip 初始化 ────────────────────────────────────────────────
function initTooltips() {
  if (typeof bootstrap === 'undefined') return;
  // 補上沒有描述文字的常見 icon 按鈕
  const chatBtn = document.getElementById('chaticon');
  if (chatBtn && !chatBtn.title && !chatBtn.getAttribute('aria-label')) {
    chatBtn.title = '開啟聊天室';
  }
  // 自動將 button/a 上的 aria-label 或 title 升級為 Bootstrap tooltip
  document.querySelectorAll('button[aria-label], a[aria-label], button[title], a[title]').forEach(el => {
    const bsToggle = el.getAttribute('data-bs-toggle');
    if (bsToggle === 'tooltip' || bsToggle === 'popover') return; // 已有 BS 元件，跳過
    const text = el.title || el.getAttribute('aria-label');
    if (!text) return;
    new bootstrap.Tooltip(el, {
      title: text,
      trigger: 'hover focus',
      placement: 'bottom',
    });
  });
}

window.initTooltips = initTooltips;

document.addEventListener('DOMContentLoaded', () => {
  renderAuthUI();
  initTooltips();
  _initMobileDrawer();

  // #whatcontent 的 pageEnter animation 會建立 stacking context，
  // 導致內部 z-index（searchbar dropdown、navbar）被後續 content 覆蓋。
  // 動畫結束後立即移除 animation，解除 stacking context。
  const wc = document.getElementById('whatcontent');
  if (wc) {
    wc.addEventListener('animationend', () => {
      wc.style.animation = 'none';
    }, { once: true });
  }
});

// ── Mobile Side Drawer ───────────────────────────────────────────────────────
function _initMobileDrawer() {
  if (!document.querySelector('.navbar-toggler')) return;
  // Create backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'mobile-nav-backdrop';
  backdrop.id = 'mobileNavBackdrop';
  backdrop.addEventListener('click', _closeDrawer);

  // Create drawer shell
  const drawer = document.createElement('div');
  drawer.className = 'mobile-nav-drawer';
  drawer.id = 'mobileNavDrawer';

  // Header
  const header = document.createElement('div');
  header.className = 'mobile-drawer-header';
  header.innerHTML = `
    <span class="mobile-drawer-logo">拾貨寶庫</span>
    <button class="mobile-drawer-close" aria-label="關閉選單"><i class="ti ti-x"></i></button>
  `;
  header.querySelector('.mobile-drawer-close').addEventListener('click', _closeDrawer);

  // Nav content — clone .nav-item entries from whichever navbar collapse exists
  const navWrap = document.createElement('ul');
  navWrap.className = 'mobile-drawer-nav list-unstyled mb-0';
  const sourceNav = document.querySelector('.mobileNav')
                 || document.querySelector('.navbar-collapse .navbar-nav');
  if (sourceNav) {
    sourceNav.querySelectorAll('.nav-item').forEach(item => {
      const clone = item.cloneNode(true);
      clone.className = 'drawer-nav-item';
      // Close drawer when any link inside is tapped
      clone.querySelectorAll('a').forEach(a => a.addEventListener('click', _closeDrawer));
      navWrap.appendChild(clone);
    });
  }

  drawer.appendChild(header);
  drawer.appendChild(navWrap);
  document.body.appendChild(backdrop);
  document.body.appendChild(drawer);

  // Intercept the hamburger toggler — mobile only, capture phase fires before Bootstrap
  const toggler = document.querySelector('.navbar-toggler');
  if (toggler) {
    toggler.addEventListener('click', (e) => {
      if (window.innerWidth > 991) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      _openDrawer();
    }, true);
  }

  // ESC key closes the drawer
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') _closeDrawer();
  });
}

function _openDrawer() {
  const drawer = document.getElementById('mobileNavDrawer');
  const toggler = document.querySelector('.navbar-toggler');
  drawer?.classList.add('open');
  document.getElementById('mobileNavBackdrop')?.classList.add('open');
  document.body.style.overflow = 'hidden';
  toggler?.setAttribute('aria-expanded', 'true');
  // Re-trigger stagger animation each open
  document.querySelectorAll('.mobile-drawer-nav .drawer-nav-item').forEach(el => {
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
  });
}

function _closeDrawer() {
  const toggler = document.querySelector('.navbar-toggler');
  document.getElementById('mobileNavDrawer')?.classList.remove('open');
  document.getElementById('mobileNavBackdrop')?.classList.remove('open');
  document.body.style.overflow = '';
  toggler?.setAttribute('aria-expanded', 'false');
}
export const formatTaipeiTime = (dateStr) => {
  if (!dateStr) return '-'; // 如果沒有資料，直接回傳 '-'
  
  const date = new Date(dateStr);
  
  // 檢查是否為無效日期 (Invalid Date)
  if (isNaN(date.getTime())) return '-';

  return date.toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};
export async function requireLogin() {
  // 等 whoami 完成後查快取，不重複發請求
  await window._authReady;
  if (window.isLoggedIn) return true;

  const currentUrl = window.location.pathname + window.location.search;
  const result = await Swal.fire({
    title: "尚未登入",
    text: "此功能需要登入，是否前往登入？",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "前往登入",
    cancelButtonText: "取消"
  });

  if (result.isConfirmed) {
    window.location.href =
      `../account/account.html?redirect=${encodeURIComponent(currentUrl)}`;
  }

  return false;
}

// ── Notification System ──────────────────────────────────────────────────
let _notifPage = 1;
let _notifHasMore = false;
let _notifLoading = false;

const _NOTIF_TYPE_LABELS = {
  wishpool_contact: '許願池聯絡',
  order_placed: '訂單成立',
  order_completed: '訂單完成',
  order_cancelled: '訂單取消',
  review: '收到評價',
  system: '系統通知',
};

function _notifRelativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '剛剛';
  if (mins < 60) return `${mins} 分鐘前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小時前`;
  return `${Math.floor(hours / 24)} 天前`;
}

function _renderNotifItem(n) {
  const avatar = n.actor?.photoURL ?? n.actor?.avatar ?? '../image/default-avatar.webp';
  const title = n.title ?? _NOTIF_TYPE_LABELS[n.type] ?? '';
  const body = n.body ?? n.content ?? n.message ?? '';
  const time = _notifRelativeTime(n.createdAt);
  const unread = !n.isRead;
  const id = n.id ?? '';

  const wishName = n.meta?.wish?.itemName ?? n.wish?.itemName ?? null;
  const productName = n.productName ?? n.meta?.product?.name ?? null;
  const productId = n.productId ?? n.meta?.product?.id ?? null;
  const wishId = n.wishId ?? n.meta?.wish?.id ?? null;
  const chatRoomActorId = n.meta?.actor?.accountId ?? null;

  const metaChips = [];
  if (wishName) metaChips.push(`<span class="notif-chip notif-chip--wish"><i class="ti ti-wand me-1"></i>${wishName}</span>`);
  if (productName) metaChips.push(`<span class="notif-chip notif-chip--product"><i class="ti ti-package me-1"></i>${productName}</span>`);

  const actionBtns = [];
  if (chatRoomActorId) actionBtns.push(`<button class="notif-action-btn notif-action-btn--chat" data-chat-actor="${chatRoomActorId}"><i class="ti ti-message me-1"></i>聯絡賣家</button>`);
  if (productId) actionBtns.push(`<button class="notif-action-btn notif-action-btn--product" data-product-id="${productId}"><i class="ti ti-eye me-1"></i>看商品</button>`);
  if (wishId && !productId) actionBtns.push(`<button class="notif-action-btn notif-action-btn--product" data-wish-id="${wishId}"><i class="ti ti-eye me-1"></i>看願望</button>`);

  return `<div class="notif-item${unread ? ' notif-unread' : ''}" data-notif-id="${id}">
    <img src="${avatar}" class="notif-avatar" alt="通知" onerror="this.src='../image/default-avatar.webp'">
    <div class="notif-body">
      ${title ? `<div class="notif-text"><strong>${title}</strong></div>` : ''}
      ${body ? `<div class="notif-text notif-content">${body}</div>` : ''}
      ${metaChips.length ? `<div class="notif-chips">${metaChips.join('')}</div>` : ''}
      <div class="notif-item-footer">
        <span class="notif-time">${time}</span>
        ${actionBtns.length ? `<div class="notif-actions">${actionBtns.join('')}</div>` : ''}
      </div>
    </div>
  </div>`;
}

function _initNotifSystem() {
  if (document.getElementById('notifBellWrap')) return;

  const loginEl = document.querySelector('nav .login');
  if (loginEl) {
    loginEl.insertAdjacentHTML('beforebegin', `
      <div id="notifBellWrap" class="notif-bell-wrap">
        <button id="notificationBtn" class="notif-bell-btn" aria-label="通知">
          <i class="ti ti-bell"></i>
        </button>
        <span id="notificationBadge" class="notif-badge d-none">0</span>
      </div>
    `);
  }

  document.body.insertAdjacentHTML('beforeend', `
    <div id="notifBackdrop" class="notif-backdrop"></div>
    <div id="notificationPanel" class="notif-panel">
      <div class="notif-header">
        <span class="notif-title"><i class="ti ti-bell me-2"></i>通知</span>
        <div class="notif-header-actions">
          <button class="notif-read-all-btn" id="notifReadAllBtn">全部已讀</button>
          <button class="notif-close" id="notifCloseBtn" aria-label="關閉通知"><i class="ti ti-x"></i></button>
        </div>
      </div>
      <div class="notif-list" id="notifList"></div>
      <div class="notif-footer" id="notifFooter" style="display:none;">
        <button class="notif-load-more" id="notifLoadMore">載入更多</button>
      </div>
    </div>
  `);

  document.getElementById('notificationBtn').addEventListener('click', _openNotifPanel);
  document.getElementById('notifCloseBtn').addEventListener('click', _closeNotifPanel);
  document.getElementById('notifBackdrop').addEventListener('click', _closeNotifPanel);
  document.getElementById('notifReadAllBtn').addEventListener('click', _markAllNotifRead);
  document.getElementById('notifLoadMore').addEventListener('click', () => {
    if (!_notifLoading && _notifHasMore) _loadNotifications(_notifPage + 1, true);
  });
  document.getElementById('notifList').addEventListener('click', async (e) => {
    const item = e.target.closest('.notif-item');
    if (!item?.dataset.notifId) return;

    // Mark as read
    if (item.classList.contains('notif-unread')) {
      try {
        await backendService.markNotificationRead(item.dataset.notifId);
        item.classList.remove('notif-unread');
        const badge = document.getElementById('notificationBadge');
        if (badge) {
          const next = Math.max(0, (parseInt(badge.textContent) || 0) - 1);
          if (next === 0) badge.classList.add('d-none');
          else badge.textContent = next > 99 ? '99+' : next;
        }
      } catch (_) {}
    }

    // 聯絡賣家 button
    const chatBtn = e.target.closest('[data-chat-actor]');
    if (chatBtn) {
      _closeNotifPanel();
      sessionStorage.setItem('chatroomReturnUrl', window.location.href);
      const notifItem = chatBtn.closest('.notif-item');
      const wishName = notifItem?.querySelector('.notif-chip--wish')?.textContent?.trim() ?? '';
      const defaultMsg = wishName ? `你好，關於「${wishName}」的許願，` : '';
      const msgParam = defaultMsg ? `&message=${encodeURIComponent(defaultMsg)}` : '';
      window.location.href = `../chatroom/chatroom.html?openChat=${chatBtn.dataset.chatActor}${msgParam}`;
      return;
    }

    // 看商品 button
    const productBtn = e.target.closest('[data-product-id]');
    if (productBtn) {
      _closeNotifPanel();
      window.location.href = `../product/product.html?id=${productBtn.dataset.productId}`;
      return;
    }

    // 看願望 button
    const wishBtn = e.target.closest('[data-wish-id]');
    if (wishBtn) {
      _closeNotifPanel();
      window.location.href = `../wishpool/wishpool.html?id=${wishBtn.dataset.wishId}#wishpool`;
      return;
    }
  });
}

async function _loadNotifications(page = 1, append = false) {
  if (_notifLoading) return;
  _notifLoading = true;
  const list = document.getElementById('notifList');
  const footer = document.getElementById('notifFooter');
  if (!list) { _notifLoading = false; return; }

  const panelOpen = document.getElementById('notificationPanel')?.classList.contains('open');
  if (panelOpen) {
    if (!append) {
      list.innerHTML = '<div class="notif-loading"><div class="spinner-border spinner-border-sm text-secondary" role="status"></div></div>';
    } else {
      document.getElementById('notifLoadMore')?.setAttribute('disabled', '');
    }
  }

  try {
    const res = await backendService.getNotifications(page, 20);
    const payload = res?.data?.data ?? {};
    const items = payload.notifications ?? [];
    const pagination = payload.pagination ?? {};
    _notifHasMore = page < (pagination.totalPages ?? 0);
    _notifPage = page;

    if (panelOpen) {
      if (!append) list.innerHTML = '';
      if (items.length === 0 && !append) {
        list.innerHTML = '<div class="notif-empty">目前沒有通知</div>';
      } else {
        items.forEach(n => {
          const div = document.createElement('div');
          div.innerHTML = _renderNotifItem(n);
          list.appendChild(div.firstElementChild);
        });
      }
      if (footer) footer.style.display = _notifHasMore ? '' : 'none';
    }

    const unreadCount = items.filter(n => !n.isRead).length;
    _updateNotifBadge(unreadCount);
  } catch (_) {
    if (panelOpen && !append) list.innerHTML = '<div class="notif-empty">載入失敗</div>';
  } finally {
    _notifLoading = false;
    document.getElementById('notifLoadMore')?.removeAttribute('disabled');
  }
}

function _updateNotifBadge(count) {
  const badge = document.getElementById('notificationBadge');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count > 99 ? '99+' : count;
    badge.classList.remove('d-none');
  } else {
    badge.classList.add('d-none');
  }
}

function _openNotifPanel() {
  document.getElementById('notificationPanel')?.classList.add('open');
  document.getElementById('notifBackdrop')?.classList.add('open');
  document.body.style.overflow = 'hidden';
  _loadNotifications(1, false);
}

function _closeNotifPanel() {
  document.getElementById('notificationPanel')?.classList.remove('open');
  document.getElementById('notifBackdrop')?.classList.remove('open');
  document.body.style.overflow = '';
}

async function _markAllNotifRead() {
  try {
    await backendService.markAllNotificationsRead();
    document.querySelectorAll('#notifList .notif-item.notif-unread').forEach(el => el.classList.remove('notif-unread'));
    _updateNotifBadge(0);
  } catch (_) {}
}

window.refreshNotifBadge = () => _loadNotifications(1, false);
// ─────────────────────────────────────────────────────────────────────────

// ── Konami Code Terminal Easter Egg ──────────────────────
(function () {
  const KONAMI = [
    'ArrowUp','ArrowUp','ArrowDown','ArrowDown',
    'ArrowLeft','ArrowRight','ArrowLeft','ArrowRight',
    'b','a'
  ];
  let idx = 0;

  const LINES = [
    { prompt: '$ ', cmd: 'whoami',                   delay: 600  },
    { out:  '> dev-mode activated 🔓',               delay: 400  },
    { prompt: '$ ', cmd: 'cat README.md',            delay: 700  },
    { out:  '> 拾貨寶庫 v1.0.0',                    delay: 300  },
    { out:  '> Built with ❤️  by 中興資工',          delay: 300  },
    { out:  '>',                                      delay: 200  },
    { warn: '> 警告：本站含有大量二手寶物',          delay: 300  },
    { warn: '>       可能導致錢包變薄、宿舍變小',    delay: 400  },
    { prompt: '$ ', cmd: 'git log --oneline',        delay: 700  },
    { out:  '> a1b2c3d  修了一個 bug，產生三個新 bug',  delay: 300  },
    { out:  '> d4e5f6g  深夜 2:47 的 commit',        delay: 300  },
    { out:  '> 9h8i7j0  final_final_真的是final版',  delay: 400  },
    { prompt: '$ ', cmd: './start_treasure_hunt.sh', delay: 700  },
    { success: '> 🎉 You found the easter egg.',     delay: 400  },
    { success: '>    恭喜你，你是真正的寶物獵人。', delay: 0    },
  ];

  function buildDOM() {
    const overlay = document.createElement('div');
    overlay.id = 'konami-overlay';
    overlay.innerHTML = `
      <div id="konami-terminal">
        <div id="konami-titlebar">
          <div class="konami-dot red"    id="konami-close"></div>
          <div class="konami-dot yellow"></div>
          <div class="konami-dot green"></div>
          <span>bash — 拾貨寶庫</span>
        </div>
        <div id="konami-body"><span id="konami-cursor"></span></div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeTerminal();
    });
    document.getElementById('konami-close').addEventListener('click', closeTerminal);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeTerminal();
    });
  }

  function closeTerminal() {
    const overlay = document.getElementById('konami-overlay');
    if (overlay) overlay.classList.remove('active');
  }

  async function typeText(el, text, speed = 38) {
    for (const ch of text) {
      el.textContent += ch;
      await new Promise(r => setTimeout(r, speed + Math.random() * 20));
    }
  }

  async function runTerminal() {
    const body   = document.getElementById('konami-body');
    const cursor = document.getElementById('konami-cursor');
    body.innerHTML = '';
    body.appendChild(cursor);

    for (const line of LINES) {
      await new Promise(r => setTimeout(r, line.delay));

      const span = document.createElement('span');
      span.className = 'konami-line';

      if (line.prompt !== undefined) {
        const p = document.createElement('span');
        p.className = 'prompt';
        p.textContent = line.prompt;
        span.appendChild(p);
        const c = document.createElement('span');
        c.className = 'cmd';
        span.appendChild(c);
        body.insertBefore(span, cursor);
        await typeText(c, line.cmd);
        await new Promise(r => setTimeout(r, 180));
      } else {
        const cls = line.out !== undefined ? 'out' : line.warn !== undefined ? 'warn' : 'success';
        const text = line[cls === 'out' ? 'out' : cls === 'warn' ? 'warn' : 'success'];
        const c = document.createElement('span');
        c.className = cls;
        span.appendChild(c);
        body.insertBefore(span, cursor);
        await typeText(c, text, 22);
      }
    }
  }

  function openTerminal() {
    const overlay = document.getElementById('konami-overlay');
    overlay.classList.add('active');
    runTerminal();
  }

  document.addEventListener('DOMContentLoaded', buildDOM);

  document.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    const expected = KONAMI[idx].toLowerCase();
    if (key === expected) {
      idx++;
      console.log(`[Konami] ${idx}/${KONAMI.length}: ${key} ✓`);
      if (idx === KONAMI.length) {
        idx = 0;
        openTerminal();
      }
    } else {
      idx = key === KONAMI[0].toLowerCase() ? 1 : 0;
    }
  });
})();
// ─────────────────────────────────────────────────────────
