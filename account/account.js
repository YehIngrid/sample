//TODO 當頁面載入完畢後隱藏 loader，顯示內容
window.onload = function() {
  var loader = document.getElementById('loader');
  var content = document.getElementById('whatcontent');
  if (loader && content) {
    loader.style.setProperty('display', 'none', 'important');
    content.style.setProperty('display', 'block', 'important');
  }
};
async function callSignUp() {
  const emailInput = document.getElementById('email');
  const passwordInput1 = document.getElementById('password1');
  const passwordInput2 = document.getElementById('password2');
  const nameInput = document.getElementById('name');

  // 密碼格式：至少 6 碼，含英數
  const pwd = passwordInput1.value.trim();
  const isValid = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/.test(pwd);
  if (!isValid) {
    Swal.fire({ title: "密碼不符合最低要求", icon: "warning", text: "密碼需至少6位，且同時包含英文字母與數字" });
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

    await Swal.fire({
      icon: "success",
      title: "帳號註冊成功",
      showConfirmButton: false,
      footer: "即將返回登入頁面",
      timer: 2100
    });

    // 導回登入頁
    window.location.href = "account.html";
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
