// 當整個頁面載入完成後，隱藏 loader 並顯示主要內容
window.onload = function() {
    // 當頁面載入完畢後隱藏載入動畫，顯示內容
  var loader = document.getElementById('loader');
  var content = document.getElementById('whatcontent');
  if (loader && content) {
    loader.style.setProperty('display', 'none', 'important');
    content.style.setProperty('display', 'block', 'important');
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
  });
async function renderAuthUI() {
  try {
    const user = await backendService.whoami(); // 成功代表已登入
    const usernameEl = document.getElementById('username');
    usernameEl.textContent = user?.name || user?.username || '用戶';
    usernameEl.style.display = '';

    const loginOrNot = document.getElementById('loginornot');
    loginOrNot.textContent = '登出';
    loginOrNot.href = '#';
    loginOrNot.onclick = (e) => {
      e.preventDefault();
      doLogout();
    };
  } catch (err) {
    const usernameEl = document.getElementById('username');
    usernameEl.textContent = '';
    usernameEl.style.display = 'none';

    const loginOrNot = document.getElementById('loginornot');
    loginOrNot.textContent = '登入';
    loginOrNot.href = '../account/account.html';
    loginOrNot.onclick = null;
  }
}

function doLogout() {
  // 清除登入資訊
  localStorage.removeItem('uid');
  localStorage.removeItem('username');
  localStorage.removeItem('intro');
  localStorage.removeItem('avatar');

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
    location.href = '/account/account.html';
  });
}

document.addEventListener('DOMContentLoaded', renderAuthUI);