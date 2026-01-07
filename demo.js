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
  backendService = new BackendService();
  const user = await backendService.whoami(); // 成功代表已登入
  console.log("目前使用", user);
  console.log("test userid", user.data.uid);

  document.querySelectorAll('.username').forEach((el) => {
    el.textContent = localStorage.getItem("username") || '使用者';
    el.style.display = '';
  });

  document.querySelectorAll('.loginornot').forEach((el) => {
    el.textContent = '登出';
    el.href = '#';
    el.onclick = (e) => {
      e.preventDefault();
      doLogout();
    };
  });

} catch (err) {
  document.querySelectorAll('.username').forEach((el) => {
    el.textContent = '';
    el.style.display = 'none';
  });

  document.querySelectorAll('.loginornot').forEach((el) => {
    el.textContent = '登入';
    el.href = '../account/account.html';
    el.onclick = null;
  });
}

}

function doLogout() {
  let res = backendService.logout(); // 清除 token
  console.log("登出結果", res);
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