//TODO 當頁面載入完畢後隱藏 loader，顯示內容
window.onload = function() {
  var loader = document.getElementById('loader');
  var content = document.getElementById('whatcontent');
  if (loader && content) {
    loader.style.setProperty('display', 'none', 'important');
    content.style.setProperty('display', 'block', 'important');
  }
};

// DOMContentLoaded 事件：設定手機版搜尋功能
document.addEventListener('DOMContentLoaded', function() {
  const mobileSearchIcon = document.getElementById('mobileSearchIcon');
  const searchForm = document.getElementById('searchForm');
  
  if (mobileSearchIcon && searchForm) {
    mobileSearchIcon.addEventListener('click', function() {
      mobileSearchIcon.style.display = 'none';
      searchForm.style.display = 'flex';
      
      // 將游標自動移至搜尋輸入框
      const input = searchForm.querySelector('input');
      if (input) {
        input.focus();
      }
    });
  }
});

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
    Swal.fire({
      title: "請填寫所有必填資訊",
      icon: "warning"
    });
    return;
  }
  //TODO:email's limit
  // if(!emailInput.value.endsWith('@mail.nchu.edu.tw')){
  //   Swal.fire({
  //     title:"帳號不符合註冊要求",
  //     icon:"warning", 
  //     text:"請使用 @mail.nchu.edu.tw 結尾的學校帳號註冊！"
  //   });
  //   return;
  // }
  const pwd = passwordInput1.value;
  const isValid = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/.test(pwd);

  if (!isValid) {
    Swal.fire({
      title: "密碼不符合最低要求",
      icon: "warning",
      text: "密碼需至少6位，且同時包含英文字母與數字"
    });
    return;
  }

  // if(passwordInput1.value.length < 6 || /[a-zA-Z]/.test(passwordInput1.value)|| /[0-9]/.test(passwordInput1.value)){
  //   Swal.fire({
  //     title: "密碼不符合最低要求",
  //     icon: "warning",
  //     text: "請重新設定一組新密碼"
  //   });
  //   return;
  // }
  if (passwordInput1.value !== passwordInput2.value) {
    Swal.fire({
      title: "密碼輸入不一致",
      icon: "warning"
    });
    return;
  }
  
  let obj = {
    email: emailInput.value,
    password: passwordInput1.value,
    name: nameInput.value
  };
  console.log("註冊資訊：", obj);
  
  
  // 顯示 loader
  document.getElementById('loader-wrapper').style.display = 'flex';

  axios.post('https://store-backend-iota.vercel.app/api/account/signup', obj)
    .then(function (response) {
      // 隱藏 loader
      document.getElementById('loader-wrapper').style.display = 'none';

      console.log("回傳資料：", response.data);
      if(response.data.message == "User created successfully"){
        Swal.fire({
          icon: "success",
          title: "帳號註冊成功",
          showConfirmButton: false,
          footer: "即將返回登入頁面",
          timer: 1800
        });
        setTimeout(() => {
          window.location.href = "account.html";
        }, 2000);
      } 
    })
    .catch(function (error) {
      // 隱藏 loader
      document.getElementById('loader-wrapper').style.display = 'none';

      console.error("註冊錯誤：", error);
      if(error.response?.data?.message === "Email already exists"){
        Swal.fire({
          icon: "error",
          title: "此帳號已被註冊",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text:"系統發生錯誤，請稍後再試"
        });
      }
    });
}

const signbtn = document.getElementById('sign');
signbtn.addEventListener('click', function(e){
  e.preventDefault();
  console.log("hi");
  callSignUp();
})
const signup = document.getElementById('signupLink');
const backlogin = document.getElementById('backlogin');
const signuppage = document.getElementById('signuppage');
const loginpage = document.getElementById('loginModal');
signup.addEventListener('click', function(e){

  if (signuppage && loginpage) {
    signuppage.style.setProperty('display', 'block', 'important');
    loginpage.style.setProperty('display', 'none', 'important');
  }
})
backlogin.addEventListener('click', function(e){
  if (signuppage && loginpage) {
    signuppage.style.setProperty('display', 'none', 'important');
    loginpage.style.setProperty('display', 'block', 'important');
  }
})

// 切換密碼顯示/隱藏（點擊眼睛圖示）
$("#checkEye").click(function () {
  if($(this).hasClass('fa-eye')){
     $("#floatingPassword").attr('type', 'text');
  } else {
     $("#floatingPassword").attr('type', 'password');
  }
  $(this).toggleClass('fa-eye').toggleClass('fa-eye-slash');
});
$("#checkEye1").click(function () {
  if($(this).hasClass('fa-eye')){
     $("#password1").attr('type', 'text');
  } else {
     $("#password1").attr('type', 'password');
  }
  $(this).toggleClass('fa-eye').toggleClass('fa-eye-slash');
});
$("#checkEye2").click(function () {
  if($(this).hasClass('fa-eye')){
     $("#password2").attr('type', 'text');
  } else {
     $("#password2").attr('type', 'password');
  }
  $(this).toggleClass('fa-eye').toggleClass('fa-eye-slash');
});

  function handleScroll() {
    const scrollY = window.scrollY;
    document.querySelectorAll('.parallax').forEach(el => {
      el.style.setProperty('--scroll', `${scrollY * 0.1}px`);
    });
  }
  window.addEventListener('scroll', handleScroll);

