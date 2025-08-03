//TODO 當整個頁面載入完成後，隱藏 loader 並顯示主要內容
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

//TODO 手機版：點擊黑色搜尋圖示時，隱藏該圖示並顯示搜尋表單（新行出現）
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
// Firebase 設定
// const firebaseConfig = {
//   apiKey: "AIzaSyCtC488RFTmMSoe7lPj6c-rOVVuKOseTAk",
//   authDomain: "store-backend-75fea.firebaseapp.com",
//   projectId: "store-backend-75fea",
//   storageBucket: "store-backend-75fea.firebasestorage.app",
//   messagingSenderId: "585571611965",
//   appId: "1:585571611965:web:65b013617b7877e2904154"
// };

// Initialize Firebase
// firebase.initializeApp(firebaseConfig);
// const auth = firebase.auth();

// // 可設定持久性，確保 Firebase 在刷新時保留登入狀態
// auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

// 頁面載入時，先根據 localStorage 設定按鈕初始狀態
$(document).ready(function(){
  console.log("文件已加載完成！");
  const send = document.getElementById('send');
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
      $(location).attr('href', 'https://yehingrid.github.io/sample/%E6%8B%BE%E8%B2%A8%E5%AF%B6%E5%BA%AB/account.html');
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

// auth.onAuthStateChanged(function(user) {
//   const loginForm = document.getElementById('loginForm');
//   const logoutButton = document.getElementById('logoutButton');
//   const authButton = document.getElementById('authButton');
//   const username = document.getElementById('username');
//   const avatarImg = document.getElementById('avatar-img');


//   if (user) {
//     console.log("使用者已登入：", user);
//     console.log("username: ", user.displayName);
//     localStorage.setItem("isLoggedIn", "true");
//     if (loginForm) loginForm.style.display = "none";
//     if (logoutButton) logoutButton.style.display = "block";
//     if (username) {
//       username.textContent = `${user.displayName}`;
//       // username.style.display = "block";
//     }
//     if(avatarImg) {
//       avatarImg.src = user.photoURL || 'https://github.com/YehIngrid/sample/blob/main/image/default-avatar.png?raw=true'; // 預設頭像
//       avatarImg.style.display = "block";
//     }
//     if (authButton) {
//       authButton.textContent = "登出";
//       authButton.onclick = function(e) {
//         e.preventDefault();
//         Swal.fire({
//           title: "確定登出？",
//           text: "登出後無法購物與上架商品",
//           icon: "warning",
//           showCancelButton: true,
//           confirmButtonColor: "#3085d6",
//           cancelButtonColor: "#d33",
//           confirmButtonText: "我要登出"
//         }).then((result) => {
//           if (result.isConfirmed) {
//             callLogout();
//           }
//       })};
//     }
//   } else {
//     console.log("目前無使用者登入");
//     localStorage.removeItem("isLoggedIn");
//     if (loginForm) loginForm.style.display = "block";
//     if (logoutButton) logoutButton.style.display = "none";
//     if (authButton) {
//       authButton.textContent = "登入";
//     }
//     send.onclick = function(e) {
//       e.preventDefault();
//       callLogIn();
//     };
//   }
// });

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
  
  // auth.signInWithEmailAndPassword(obj.email, obj.password)
  //   .then((userCredential) => {
  //     var user = userCredential.user;
  //     Swal.fire({
  //       icon: "success",
  //       title: "登入成功",
  //       text: "歡迎回來！",
  //       showConfirmButton: false,
  //       footer: "即將跳轉購物頁面",
  //       timer: 1500
  //     });
  //     return user.getIdToken();
  //   })
  //   .then((token) => {
  //     console.log("使用者 Token：", token);
  //     setTimeout(() => {
  //       window.location.href = "shoppingpage_bootstrap.html";
  //     }, 2000);
  //   })
  //   .catch(function (error) {
  //     console.error("登入錯誤：", error);
  //     Swal.fire({
  //       icon: "error",
  //       title: "登入失敗",
  //       text: "請確認帳號密碼是否正確，或註冊新帳號"
  //     });
  //   });
}

// 登出函式：使用 Firebase 的 signOut 方法
function callLogout() {
  // auth.signOut()
  //   .then(() => {
  //     Swal.fire({
  //       icon: "success",
  //       title: "登出成功",
  //       text: "歡迎再度光臨",
  //       showConfirmButton: false,
  //       footer: "即將返回登入頁面",
  //       timer: 1800
  //     });
  //     // 登出後從 localStorage 移除登入狀態
  //     localStorage.removeItem("isLoggedIn");
  //     setTimeout(() => {
  //       window.location.href = "account.html";
  //     }, 2000);
  //   })
  //   .catch(function(error) {
  //     console.error("登出錯誤：", error);
  //     Swal.fire({
  //       icon: "error",
  //       title: "Oops...登出失敗",
  //       text: "系統暫時發生錯誤，請稍後再試"
  //     });
  //   });
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
document.addEventListener('DOMContentLoaded', function() {
    // 1. 左側側邊欄選單切換
    const navItems = document.querySelectorAll('.nav-menu li');
    const tabContents = document.querySelectorAll('.tab-content');
  
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        // 移除其他項目的 active
        navItems.forEach(i => i.classList.remove('active'));
        // 給自己加上 active
        item.classList.add('active');
  
        // 隱藏所有 tab-content
        tabContents.forEach(tab => {
          tab.classList.remove('active');
        });
  
        // 顯示對應的 tab-content
        const tabId = item.getAttribute('data-tab'); // 讀取 data-tab 屬性
        const targetTab = document.getElementById(tabId);
        if (targetTab) {
          targetTab.classList.add('active');
        }
      });
    });
  
    // 2. 購物車內的子標籤切換
    const cartTabButtons = document.querySelectorAll('.cart-tab-button');
    const cartTabContents = document.querySelectorAll('.cart-tab-content');
  
    cartTabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // 移除其他按鈕的 active
        cartTabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
  
        // 隱藏所有 cart-tab-content
        cartTabContents.forEach(ctc => ctc.classList.remove('active'));
  
        // 顯示對應的 cart-tab-content
        const cartTabId = btn.getAttribute('data-cart-tab');
        const targetContent = document.getElementById(cartTabId);
        if (targetContent) {
          targetContent.classList.add('active');
        }
      });
    });
  });
  
  document.getElementById('sidebar-toggle').addEventListener('click', function () {
    document.getElementById('mobile-sidebar').classList.toggle('active');
    document.getElementById('sidebar-overlay').classList.toggle('active');
  });

  document.getElementById('sidebar-overlay').addEventListener('click', function () {
    document.getElementById('mobile-sidebar').classList.remove('active');
    this.classList.remove('active');
  });
