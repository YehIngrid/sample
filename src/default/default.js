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
      _authResolve(true);
      document.querySelectorAll('.username').forEach((el) => {
        el.textContent = localStorage.getItem("username") || '使用者';
        el.style.display = '';
      });

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
      const avatarSrc = (userAvatar && userAvatar !== 'null' && userAvatar !== '') ? userAvatar : '../image/default-avatar.png';
      document.querySelectorAll('.nav-user-avatar, .nav-user-avatar-sm').forEach(img => { img.src = avatarSrc; });
      document.querySelectorAll('.nav-guest-label').forEach(el => el.classList.add('d-none'));
      document.querySelectorAll('.nav-loggedin-area').forEach(el => el.classList.remove('d-none'));
      document.querySelectorAll('.nav-user-menu-header').forEach(el => el.classList.remove('d-none'));

      // Session keep-alive：每 5 分鐘 ping 一次，避免 cookie session 過期
      setInterval(async () => {
        try { await backendService.whoami(); } catch (_) {}
      }, 5 * 60 * 1000);

    } catch (err) {
      window.isLoggedIn = false;
      _authResolve(false);
      document.querySelectorAll('.username').forEach((el) => {
        el.textContent = '';
        el.style.display = 'none';
      });

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

document.addEventListener('DOMContentLoaded', renderAuthUI);
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
