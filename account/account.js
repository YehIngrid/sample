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
 // 註冊函式：取得註冊表單欄位並呼叫後端 API
async function callSignUp(){
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
    username: nameInput.value
  };
  console.log("註冊資訊：", obj);
  
  
  // 顯示 loader
  document.getElementById('loader-wrapper').style.display = 'flex';

  let backendService = new BackendService();
  backendService.test(); // 測試後端服務是否正常
  let signupError = null;
  try {
    await backendService.signup(obj);
  } catch (error) {
    signupError = error;
  }
  if (signupError == null) {
    document.getElementById('loader-wrapper').style.display = 'none';
        console.log("回傳資料：", response.data);
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
  } else {
    let errorMessage = signupError.message;
    document.getElementById('loader-wrapper').style.display = 'none';
    console.log("回傳資料：", errorMessage);
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: errorMessage
    });
  }
  
  
  // axios.post('https://store-backend-iota.vercel.app/api/account/signup', obj)
  //   .then(function (response) {
  //     // 隱藏 loader
  //     document.getElementById('loader-wrapper').style.display = 'none';

  //     console.log("回傳資料：", response.data);
  //     if(response.data.message == "User created successfully"){
  //       Swal.fire({
  //         icon: "success",
  //         title: "帳號註冊成功",
  //         showConfirmButton: false,
  //         footer: "即將返回登入頁面",
  //         timer: 1800
  //       });
  //       setTimeout(() => {
  //         window.location.href = "account.html";
  //       }, 2000);
  //     } 
  //   })
  //   .catch(function (error) {
  //     // 隱藏 loader
  //     document.getElementById('loader-wrapper').style.display = 'none';

  //     console.error("註冊錯誤：", error);
  //     if(error.response?.data?.message === "Email already exists"){
  //       Swal.fire({
  //         icon: "error",
  //         title: "Oops...",
  //         text: "此帳號已被註冊"
  //       });
  //     } else {
  //       Swal.fire({
  //         icon: "error",
  //         title: "Oops...",
  //         text:"系統發生錯誤，請稍後再試"
  //       });
  //     }
  //   });
}

function callLogin() {
  const email = document.getElementById('floatingInput');
  const password = document.getElementById('floatingPassword');


  // TODO:  Input check 

  const backendService = new BackendService();
  backendService.login(
    {
      email: email.value,
      password: password.value
    },
    (data) => {
      console.log("回傳資料：", data);

      // TODO: save the jwt token 

      Swal.fire({
        icon: "success",
        title: "登入成功",
        text: `歡迎回來！`,//!越改越錯....破防
        showConfirmButton: false,
        timer: 2100
      })
      .then(async () => {
        await backendService.getUserData();
        window.location.href = "../shop/shoppingpage_bootstrap.html"; // 登入成功後跳轉到首頁
        
      });
      // TODO: something after login if needed
    },
    (errorMessage) => {
      console.error("登入錯誤：", errorMessage);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: errorMessage
      });
    }
  )
}

const signbtn = document.getElementById('sign');
signbtn.addEventListener('click', function(e){
    e.preventDefault();
    console.log("hi");
    callSignUp();
  })
const loginbtn = document.getElementById('send');
loginbtn.addEventListener('click', function(e){
    e.preventDefault();
    callLogin();
});

  //TODO : 切換登入與註冊頁面
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
// const signbtn = document.getElementById('sign');
// signbtn.addEventListener('click', function(e){
//   e.preventDefault();
//   console.log("hi");
//   callSignUp();
// })
// const signup = document.getElementById('signupLink');
// const backlogin = document.getElementById('backlogin');
// const signuppage = document.getElementById('signuppage');
// const loginpage = document.getElementById('loginModal');
// signup.addEventListener('click', function(e){

//   if (signuppage && loginpage) {
//     signuppage.style.setProperty('display', 'block', 'important');
//     loginpage.style.setProperty('display', 'none', 'important');
//   }
// })
// backlogin.addEventListener('click', function(e){
//   if (signuppage && loginpage) {
//     signuppage.style.setProperty('display', 'none', 'important');
//     loginpage.style.setProperty('display', 'block', 'important');
//   }
// })

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

