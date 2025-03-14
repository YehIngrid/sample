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
// 當頁面載入完成後，先預加載所有圖片
window.addEventListener('load', () => {
  const imageUrls = [
    'https://github.com/YehIngrid/sample/blob/main/%E5%BB%A3%E5%91%8A%E8%A8%AD%E8%A8%88%E9%A0%81%E6%AD%A3%E5%BC%8F%E7%89%88.jpg?raw=true',
    'https://github.com/YehIngrid/sample/blob/main/%E5%BB%A3%E5%91%8A%E8%A8%AD%E8%A8%88%E9%A0%81%E6%AD%A3%E5%BC%8F%E7%89%88.jpg?raw=true',
    'https://github.com/YehIngrid/sample/blob/main/%E5%BB%A3%E5%91%8A%E8%A8%AD%E8%A8%88%E9%A0%81%E6%AD%A3%E5%BC%8F%E7%89%88.jpg?raw=true',
    'https://github.com/YehIngrid/sample/blob/main/%E5%BB%A3%E5%91%8A%E8%A8%AD%E8%A8%88%E9%A0%81%E6%AD%A3%E5%BC%8F%E7%89%88.jpg?raw=true',
    'https://github.com/YehIngrid/sample/blob/main/%E5%BB%A3%E5%91%8A%E8%A8%AD%E8%A8%88%E9%A0%81%E6%AD%A3%E5%BC%8F%E7%89%88.jpg?raw=true',
    
  ];
  imageUrls.forEach(url => {
    const img = new Image();
    img.src = url;
  });

  // 以下為原本的輪播程式碼

  const carousel = document.querySelector('.carousel');
  const track = document.querySelector('.carousel-track');
  let containerWidth = carousel.offsetWidth;
  let slideWidth = 600; // 桌面版預設幻燈片寬度
  // 初始設定：第一個真實幻燈片在 index 1
  let currentIndex = 1;
  
  // 更新輪播位置，根據容器寬度調整計算
  function updateCarousel() {
    containerWidth = carousel.offsetWidth;
    let offset;
    if (containerWidth < 800) {
      // 手機版：幻燈片全寬
      slideWidth = containerWidth;
      // currentIndex 從 1 代表第一個真實幻燈片，因此 offset = (currentIndex - 1) * slideWidth
      offset = (currentIndex - 1) * slideWidth;
    } else {
      // 桌面版：幻燈片固定 600px
      slideWidth = 600;
      // offset = currentIndex * 600 + slideWidth/2 - (containerWidth / 2)
      offset = currentIndex * slideWidth + slideWidth / 2 - containerWidth / 2;
    }
    track.style.transform = `translateX(-${offset}px)`;
  }
  updateCarousel();
  
  // 前進到下一張
  function moveToNext() {
    track.style.transition = "transform 0.5s ease";
    currentIndex++;
    updateCarousel();
  }
  
  // 往回上一張
  function moveToPrev() {
    track.style.transition = "transform 0.5s ease";
    currentIndex--;
    updateCarousel();
  }
  
  // 無縫循環處理：監聽 transitionend 事件
  track.addEventListener('transitionend', () => {
    const slides = document.querySelectorAll('.slide');
    // 如果移動到複製的第一張（最後一張），則重置到第一個真實幻燈片
    if (currentIndex === slides.length - 1) {
      track.style.transition = "none";
      currentIndex = 1;
      updateCarousel();
      void track.offsetWidth;
      track.style.transition = "transform 0.5s ease";
    }
    // 如果移動到複製的最後一張（index = 0），則重置到最後一個真實幻燈片
    else if (currentIndex === 0) {
      track.style.transition = "none";
      currentIndex = slides.length - 2;
      updateCarousel();
      void track.offsetWidth;
      track.style.transition = "transform 0.5s ease";
    }
  });
  
  // 自動輪播，每 3 秒前進一次
  let autoSlide = setInterval(moveToNext, 3000);
  
  // 箭頭點擊事件
  const arrowLeft = document.querySelector('.arrow-left');
  const arrowRight = document.querySelector('.arrow-right');
  arrowLeft.addEventListener('click', () => {
    clearInterval(autoSlide); // 手動操作時暫停自動輪播
    moveToPrev();
    autoSlide = setInterval(moveToNext, 2000);
  });
  arrowRight.addEventListener('click', () => {
    clearInterval(autoSlide);
    moveToNext();
    autoSlide = setInterval(moveToNext, 2000);
  });
  
  // 畫面尺寸變化時更新輪播位置
  window.addEventListener('resize', updateCarousel);
  
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      // 當頁籤變回可見時，強制更新狀態
      updateCarousel();
    }
  });
});
document.addEventListener('DOMContentLoaded', function() {
  const mobileSearchIcon = document.getElementById('mobileSearchIcon');
  const searchForm = document.getElementById('searchForm');
  
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
});
//JavaScript: 控制左右按鈕捲動

  const scrollContainer = document.getElementById('scrollContainer');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  // 點擊「←」按鈕，向左捲動
  prevBtn.addEventListener('click', () => {
    scrollContainer.scrollBy({
      left: -200,       // 向左捲動 200px
      behavior: 'smooth'
    });
  });

  // 點擊「→」按鈕，向右捲動
  nextBtn.addEventListener('click', () => {
    scrollContainer.scrollBy({
      left: 200,        // 向右捲動 200px
      behavior: 'smooth'
    });
  });
//TODO Firebase 設定
// Firebase 設定
const firebaseConfig = {
  apiKey: "AIzaSyCtC488RFTmMSoe7lPj6c-rOVVuKOseTAk",
  authDomain: "store-backend-75fea.firebaseapp.com",
  projectId: "store-backend-75fea",
  storageBucket: "store-backend-75fea.firebasestorage.app",
  messagingSenderId: "585571611965",
  appId: "1:585571611965:web:65b013617b7877e2904154"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// 可設定持久性，確保 Firebase 在刷新時保留登入狀態
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

// 頁面載入時，先根據 localStorage 設定按鈕初始狀態
$(document).ready(function(){
  console.log("文件已加載完成！");
  
  const authButton = document.getElementById('authButton');
  const storedStatus = localStorage.getItem("isLoggedIn");
  if (storedStatus === "true") {
    authButton.textContent = "登出";
    authButton.onclick = function(e) {
      e.preventDefault();
      callLogout();
    };
  } else {
    authButton.textContent = "登入";
    authButton.onclick = function(e) {
      //e.preventDefault();
      callLogIn();
    };
  }
  
  // 綁定 #send 按鈕提交事件，觸發登入
  $('#send').on('click', function(e){
    e.preventDefault(); // 攔截表單預設提交
    console.log("表單已提交！");
    callLogIn();
  });
  
  // 綁定 #logoutButton 按鈕提交事件，觸發登出
  $('#logoutButton').on('click', function(e){
    e.preventDefault();
    callLogout();
  });
});

// 監聽 Firebase 認證狀態變化，並同步更新 localStorage 與介面狀態
auth.onAuthStateChanged(function(user) {
  const loginForm = document.getElementById('loginForm');
  const logoutButton = document.getElementById('logoutButton');
  const authButton = document.getElementById('authButton');

  if (user) {
    console.log("使用者已登入：", user);
    localStorage.setItem("isLoggedIn", "true");
    if (loginForm) loginForm.style.display = "none";
    if (logoutButton) logoutButton.style.display = "block";
    if (authButton) {
      authButton.textContent = "登出";
      authButton.onclick = function(e) {
        e.preventDefault();
        callLogout();
      };
    }
  } else {
    console.log("目前無使用者登入");
    localStorage.removeItem("isLoggedIn");
    if (loginForm) loginForm.style.display = "block";
    if (logoutButton) logoutButton.style.display = "none";
    if (authButton) {
      authButton.textContent = "登入";
      authButton.onclick = function(e) {
        e.preventDefault();
        callLogIn();
      };
    }
  }
});

// 登入函式：取得表單欄位並呼叫 Firebase 登入 API
function callLogIn(){
  const floatingInput = document.getElementById('floatingInput');
  const floatingPassword = document.getElementById('floatingPassword');

  if (!floatingInput || !floatingPassword) {
    console.error("無法取得登入欄位，請確認元素 id 是否正確");
    return;
  }
  
  if (!floatingInput.value || !floatingPassword.value) {
    Swal.fire({
      title: "請填寫所有必填資訊",
      icon: "warning"
    });
    return;
  }
  
  let obj = {
    email: floatingInput.value,
    password: floatingPassword.value
  };
  console.log("登入資訊：", obj);
  
  auth.signInWithEmailAndPassword(obj.email, obj.password)
    .then((userCredential) => {
      var user = userCredential.user;
      Swal.fire({
        icon: "success",
        title: "登入成功",
        text: "歡迎回來！",
        showConfirmButton: false,
        footer: "即將跳轉購物頁面",
        timer: 1500
      });
      return user.getIdToken();
    })
    .then((token) => {
      console.log("使用者 Token：", token);
      setTimeout(() => {
        window.location.href = "shoppingpage_bootstrap.html";
      }, 2000);
    })
    .catch(function (error) {
      console.error("登入錯誤：", error);
      Swal.fire({
        icon: "error",
        title: "登入失敗",
        text: "請確認帳號密碼是否正確，或註冊新帳號"
      });
    });
}

// 登出函式：使用 Firebase 的 signOut 方法
function callLogout() {
  auth.signOut()
    .then(() => {
      Swal.fire({
        icon: "success",
        title: "登出成功",
        text: "歡迎再度光臨",
        showConfirmButton: false,
        footer: "即將返回登入頁面",
        timer: 1800
      });
      // 登出後從 localStorage 移除登入狀態
      localStorage.removeItem("isLoggedIn");
      setTimeout(() => {
        window.location.href = "account.html";
      }, 2000);
    })
    .catch(function(error) {
      console.error("登出錯誤：", error);
      Swal.fire({
        icon: "error",
        title: "Oops...登出失敗",
        text: "系統暫時發生錯誤，請稍後再試"
      });
    });
}

// 註冊函式：取得註冊表單欄位並呼叫後端 API
function callSignUp(){
  const emailInput = document.getElementById('email');
  const passwordInput1 = document.getElementById('password1');
  const passwordInput2 = document.getElementById('password2');
  const nameInput = document.getElementById('name');
  
  if (!emailInput.value || !passwordInput1.value || !passwordInput2.value || !nameInput.value) {
    alert("請填寫所有必填資訊");
    return;
  }
  if (passwordInput1.value !== passwordInput2.value) {
    alert("密碼輸入不一致");
    return;
  }
  
  let obj = {
    email: emailInput.value,
    password: passwordInput1.value,
    name: nameInput.value
  };
  console.log("註冊資訊：", obj);
  
  axios.post('http://localhost:3000', obj)
    .then(function (response) {
      if(response.data.message === "帳號註冊成功"){
        alert("恭喜帳號註冊成功");
      } else {
        alert("此帳號已被註冊");
      }
    })
    .catch(function (error) {
      console.error("註冊錯誤：", error);
    });
}

// 切換密碼顯示/隱藏（點擊眼睛圖示）
$("#checkEye").click(function () {
  if($(this).hasClass('fa-eye')){
     $("#floatingPassword").attr('type', 'text');
  } else {
     $("#floatingPassword").attr('type', 'password');
  }
  $(this).toggleClass('fa-eye').toggleClass('fa-eye-slash');
});
