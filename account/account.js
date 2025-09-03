//TODO 當頁面載入完畢後隱藏 loader，顯示內容
window.onload = function() {
  var loader = document.getElementById('loader');
  var content = document.getElementById('whatcontent');
  if (loader && content) {
    loader.style.setProperty('display', 'none', 'important');
    content.style.setProperty('display', 'block', 'important');
  }
};

 // 註冊函式：取得註冊表單欄位並呼叫後端 API
async function callSignUp(){
  const emailInput = document.getElementById('email');
  const passwordInput1 = document.getElementById('password1');
  const passwordInput2 = document.getElementById('password2');
  const nameInput = document.getElementById('name');
  
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
    if(error.response?.data?.message === "Email already exists"){
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "此帳號已被註冊"
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text:"系統發生錯誤，請稍後再試"
        });
      }
  }
}

function callLogin() {
  const email = document.getElementById('floatingInput');
  const password = document.getElementById('floatingPassword');
  const rememberMe = document.getElementById('rememberMe').checked;

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
        text: `歡迎回來！`,
        showConfirmButton: false,
        timer: 2100
      })
      .then(async () => {
        await backendService.getUserData();
        // if (rememberMe) {
        //   localStorage.setItem('email', email.value);
        // } else {
        //   sessionStorage.setItem('password', email.value);
        // }

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
    if(!document.getElementById('email').value || !document.getElementById('password1').value || !document.getElementById('password2').value || !document.getElementById('name').value){
      Swal.fire({
        title: "請填寫所有必填資訊",
        icon: "warning"
      });
      return;
    }
    callSignUp();
  })
const loginbtn = document.getElementById('send');
loginbtn.addEventListener('click', function(e){
    e.preventDefault();
    if(!document.getElementById('floatingInput').value || !document.getElementById('floatingPassword').value){
      Swal.fire({
        title: "請填寫所有必填資訊",
        icon: "warning"
      });
      return;
    }
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

  function handleScroll() {
    const scrollY = window.scrollY;
    document.querySelectorAll('.parallax').forEach(el => {
      el.style.setProperty('--scroll', `${scrollY * 0.1}px`);
    });
  }
  window.addEventListener('scroll', handleScroll);
