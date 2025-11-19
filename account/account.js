//TODO 當頁面載入完畢後隱藏 loader，顯示內容
window.onload = function() {
  var loader = document.getElementById('loader');
  var content = document.getElementById('whatcontent');
  if (loader && content) {
    loader.style.setProperty('display', 'none', 'important');
    content.style.setProperty('display', 'block', 'important');
  }
};
const signuppage = document.getElementById('signuppage');
async function callSignUp() {
  const emailInput = document.getElementById('email');
  const passwordInput1 = document.getElementById('password1');
  const passwordInput2 = document.getElementById('password2');
  const nameInput = document.getElementById('name');
  const checkBackLogin = document.getElementById('checkBackLogin');
  const checkEmailPage = document.getElementById('checkEmailPage');

  // 密碼格式：至少 8 碼，含英數
  const pwd = passwordInput1.value.trim();
  const isValid = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(pwd);
  if (!isValid) {
    Swal.fire({ title: "密碼不符合最低要求", icon: "warning", text: "密碼需至少8位，且同時包含英文字母與數字" });
    return;
  }

  if (passwordInput1.value !== passwordInput2.value) {
    Swal.fire({ title: "密碼輸入不一致", icon: "warning" });
    return;
  }

  const payload = {
    email: emailInput.value.trim(),
    password: passwordInput1.value,
    username: nameInput.value.trim()
  };
  console.log("註冊資訊：", payload);

  // 顯示 loader
  const loader = document.getElementById('loader-wrapper');
  loader.style.display = 'flex';

  const backendService = new BackendService();

  try {
    const resp = await backendService.signup(payload); // <— 用 resp
    console.log("回傳資料：", resp.data);

    checkEmailPage.classList.remove('d-none');
    signuppage.classList.add('d-none');
    checkBackLogin.addEventListener('click', function(e){
      e.preventDefault();
      window.location.href = "account.html";
    });

    // // 導回登入頁
    // window.location.href = "account.html";
  } catch (e) {
    // 這裡的 e 會是 BackendService.signup() 丟出的 Error("此帳號已被註冊") 等
    console.log("回傳錯誤：", e.message);
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: e.message || "系統發生錯誤，請稍後再試"
    });
  } finally {
    // 無論成功失敗都關掉 loader
    loader.style.display = 'none';
  }
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

async function callLogin() {
  const emailEl = document.getElementById('floatingInput');
  const pwdEl   = document.getElementById('floatingPassword');
  // const rememberMe = document.getElementById('rememberMe').checked;

  // 簡單輸入檢查
  const email = emailEl.value.trim();
  const password = pwdEl.value;
  if (!email || !password) {
    Swal.fire({ icon: 'warning', title: '請輸入帳號與密碼' });
    return;
  }
  const loaderLogin = document.getElementById('loaderLogin');
  loaderLogin.style.display = 'flex';
  const backendService = new BackendService();
  // 顯示 loader
  
  try {
    const resp = await backendService.login({ email, password });
    console.log('回傳資料：', resp.data);

    // // 記住 email（選擇性）
    // if (rememberMe) localStorage.setItem('rememberEmail', email);
    // else localStorage.removeItem('rememberEmail');
    loaderLogin.style.display = 'none';
    await Swal.fire({
      icon: 'success',
      title: '登入成功',
      text: '歡迎回來！',
      showConfirmButton: false,
      timer: 2100
    });

    // 可選：拿使用者資料（若 login 內已拿就可省略）
    await backendService.getUserData?.();

    // 導頁
    window.location.href = '../shop/shoppingpage_bootstrap.html';
  } catch (e) {
    console.error('登入錯誤：', e);
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: e?.message || '登入失敗，請稍後再試'
    });
  } finally {
    // 無論成功失敗都關掉 loader
    loaderLogin.style.display = 'none';
  }
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
const forgetPasswordbtn = document.getElementById("forgetPasswordbtn");
forgetPasswordbtn.addEventListener("click", function (e) {
  e.preventDefault();
  // 隱藏 loginpage、顯示 forgetpwdpage
  document.getElementById("loginModal").classList.add("d-none");
  document.getElementById("forgetpwdpage").classList.remove("d-none");
});
const forgetBacklogin = document.getElementById("forgetBacklogin");
forgetBacklogin.addEventListener("click", function (e) {
  e.preventDefault();
  // 隱藏 forgetpwdpage、顯示 loginpage
  document.getElementById("forgetpwdpage").classList.add("d-none");
  document.getElementById("loginModal").classList.remove("d-none");
});
// TODO timer 5 minute
let countdownTimer = null;
let endTime = null;
let counting = false;   // 是否正在計時
let finished = false;   // 是否已經結束（避免 alert 無限跳）

function startCountdown() {
  counting = true;
  finished = false;

  // 5 分鐘後的時間
  endTime = Date.now() + 300000;

  updateCountdown();

  countdownTimer = setInterval(updateCountdown, 200);
}

function updateCountdown() {
  // 如果不在計時狀態，直接停止
  if (!counting) return;

  const timerEl = document.getElementById("timer");
  if (!timerEl) return; // 該區塊不在畫面上 → 自動停止

  const diff = endTime - Date.now();

  // 計時到了
  if (diff <= 0) {
    finishCountdown();
    return;
  }

  // 顯示剩餘時間
  const sec = Math.floor(diff / 1000);
  const min = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  timerEl.textContent = `${min}:${s}`;
}

function finishCountdown() {
  if (finished) return; // 已經 alert 過了 → 不要再跳

  finished = true;
  counting = false;

  clearInterval(countdownTimer);
  countdownTimer = null;

  // 顯示 00:00
  const timerEl = document.getElementById("timer");
  if (timerEl) timerEl.textContent = "00:00";

    Swal.fire({
    title: "Oops...",
    text: "驗證連結已過期，請重新申請。",
    icon: "warning",
  }).then (() => {
    // 倒數結束後，返回登入頁
    document.getElementById("getLinkPage").classList.add("d-none");
    document.getElementById("loginModal").classList.remove("d-none");
  });
}

// 🔥 監聽頁面區塊是否被隱藏
const observer = new MutationObserver(() => {
  const page = document.getElementById("getLinkPage");
  if (!page || page.classList.contains("d-none")) {
    // 被隱藏 → 停止倒數
    counting = false;
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
});

// 偵測 getLinkPage 的 d-none
observer.observe(document.body, { attributes: true, childList: true, subtree: true });
const forgetSendBtn = document.getElementById("forgetSendbtn");
forgetSendBtn.addEventListener("click", function(e) {
  e.preventDefault();

  // 切換畫面
  document.getElementById("forgetpwdpage").classList.add("d-none");
  document.getElementById("getLinkPage").classList.remove("d-none");

  // 開始倒數
  startCountdown();
});


const resetpwdpage = document.getElementById("resetpwdpage");
const checkBackLogin1 = document.getElementById("checkBackLogin1");
checkBackLogin1.addEventListener("click", function (e) {
  e.preventDefault();
  // 隱藏 getLinkPage、顯示 resetpwdpage
  document.getElementById("getLinkPage").classList.add("d-none");
  document.getElementById("resetpwdpage").classList.remove("d-none");
  // 停止倒數
  clearInterval(countdown);
});
const resetsuccesspage = document.getElementById("resetsuccesspage");
const resetpwdbtn = document.getElementById("resetbtn");
resetpwdbtn.addEventListener("click", function (e) {
  e.preventDefault();
  // 隱藏 resetpwdpage、顯示 resetsuccesspage
  document.getElementById("resetpwdpage").classList.add("d-none");
  document.getElementById("resetsuccesspage").classList.remove("d-none");
});
const resetsuccessBackLogin = document.getElementById("resetSuccessBackLogin");
resetsuccessBackLogin.addEventListener("click", function (e) {
  e.preventDefault();
  // 隱藏 resetsuccesspage、顯示 loginpage
  document.getElementById("resetsuccesspage").classList.add("d-none");
  document.getElementById("loginModal").classList.remove("d-none");
});
// TODO 密碼顯示1秒後隱藏功能
let timer;

document.querySelectorAll(".pwd").forEach((pwd) => {
  pwd.addEventListener("input", function () {
    // 顯示明碼
    pwd.type = "text";

    // 清掉前一個計時器
    clearTimeout(timer);

    // 1 秒後恢復 password
    timer = setTimeout(() => {
      pwd.type = "password";
    }, 300);
  });
});
// // TODO 檢查重設密碼電子郵件寄信 + function
// const forgetemailInput = document.getElementById("forgetemail");
// const backendService = new BackendService();
// async function sendResetEmail() {
//   const email = forgetemailInput.value.trim();
//   if (!email) {
//     Swal.fire({ title: "請輸入電子郵件地址", icon: "warning" });
//     return;
//   }
//   try {
//     const resp = await backendService.sendResetPasswordEmail({ email });
//     console.log("回傳資料：", resp.data);
//   } catch (e) {
//     console.log("回傳錯誤：", e.message);
//     Swal.fire({
//       icon: "error",
//       title: "Oops...",
//       text: e.message || "系統發生錯誤，請稍後再試"
//     });
//   }
// }
// // TODO 重設密碼功能 + function
// const newPassword1Input = document.getElementById("newPassword1");
// const newPassword2Input = document.getElementById("newPassword2");
// async function resetPassword() {
//   const newPassword1 = newPassword1Input.value;
//   const newPassword2 = newPassword2Input.value;
//   // 密碼格式：至少 8 碼，含英數
//   const isValid = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(newPassword1);
//   if (!isValid) {
//     Swal.fire({ title: "密碼不符合最低要求", icon: "warning", text: "密碼需至少8位，且同時包含英文字母與數字" });
//     return;
//   }
//   if (newPassword1 !== newPassword2) {
//     Swal.fire({ title: "密碼輸入不一致", icon: "warning" });
//     return;
//   }
//   try {
//     const resp = await backendService.resetPassword({ newPassword: newPassword1 });
//     console.log("回傳資料：", resp.data);
//   } catch (e) {
//     console.log("回傳錯誤：", e.message);
//     Swal.fire({
//       icon: "error",
//       title: "Oops...",
//       text: e.message || "系統發生錯誤，請稍後再試"
//     });
//   }
// }
// const resetpwdForm = document.getElementById("resetpwdForm");
// resetpwdForm.addEventListener("submit", function (e) {
//   e.preventDefault();
//   resetPassword();
// });
// // TODO 發送重設密碼郵件功能按鈕
// const forgetSendbtn = document.getElementById("forgetSendbtn");
// forgetSendbtn.addEventListener("click", function (e) {
//   e.preventDefault();
//   sendResetEmail();
// });