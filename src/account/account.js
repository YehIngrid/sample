import BackendService from '../BackendService.js';
import '../default/default.js';

// ── 頁面切換 ──────────────────────────────────────────────
function showPage(nextId) {
  const current = document.querySelector('.auth-step.active');
  const next = document.getElementById(nextId);
  if (!next || (current && current === next)) return;

  if (!current) {
    // 第一次顯示，直接帶入
    next.style.display = 'block';
    void next.offsetWidth;
    next.classList.add('active');
    return;
  }

  // 舊頁淡出 → 新頁淡入（sequential，避免兩頁同時佔位）
  current.classList.remove('active');
  current.addEventListener('transitionend', () => {
    current.style.display = 'none';
    next.style.display = 'block';
    void next.offsetWidth;
    next.classList.add('active');
  }, { once: true });
}

// ── 載入完成後隱藏 loader，顯示內容，並展示登入頁 ──────────
window.onload = function() {
  var loader = document.getElementById('loader');
  var content = document.getElementById('whatcontent');
  if (loader && content) {
    loader.style.setProperty('display', 'none', 'important');
    content.style.setProperty('display', 'block', 'important');
  }
  showPage('loginModal');
};

// ── 註冊 ──────────────────────────────────────────────────
const signuppage = document.getElementById('signuppage');

async function callSignUp() {
  const emailInput = document.getElementById('email');
  const passwordInput1 = document.getElementById('password1');
  const passwordInput2 = document.getElementById('password2');
  const nameInput = document.getElementById('name');
  const checkBackLogin = document.getElementById('checkBackLogin');

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

  const loader = document.getElementById('loader-wrapper');
  loader.style.display = 'flex';

  const backendService = new BackendService();

  try {
    const resp = await backendService.signup(payload);
    console.log("回傳資料：", resp.data);

    showPage('checkEmailPage');
    startResendCountdown(60);
    checkBackLogin.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = "account.html";
    });
  } catch (e) {
    console.log("回傳錯誤：", e.message);
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: e.message || "系統發生錯誤，請稍後再試"
    });
  } finally {
    loader.style.display = 'none';
  }
}

// ── 登入 ──────────────────────────────────────────────────
async function callLogin() {
  const emailEl = document.getElementById('floatingInput');
  const pwdEl   = document.getElementById('floatingPassword');

  const email = emailEl.value.trim();
  const password = pwdEl.value;
  if (!email || !password) {
    Swal.fire({ icon: 'warning', title: '請輸入帳號與密碼' });
    return;
  }

  const loaderLogin = document.getElementById('loaderLogin');
  loaderLogin.style.display = 'flex';
  const backendService = new BackendService();

  try {
    const resp = await backendService.login({ email, password });
    console.log('回傳資料：', resp.data);

    loaderLogin.style.display = 'none';
    await Swal.fire({
      icon: 'success',
      title: '登入成功',
      text: '歡迎回來！',
      showConfirmButton: false,
      timer: 2100
    });

    await backendService.getUserData?.();

    const params = new URLSearchParams(window.location.search);
    const redirectUrl = params.get("redirect");
    if (redirectUrl && redirectUrl.startsWith("/")) {
      window.location.replace(redirectUrl);
    } else {
      window.location.replace("../shop/shop.html");
    }
  } catch (e) {
    console.error('登入錯誤：', e);
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: e?.message || '登入失敗，請稍後再試'
    });
  } finally {
    loaderLogin.style.display = 'none';
  }
}

// ── 按鈕事件 ──────────────────────────────────────────────
const signbtn = document.getElementById('sign');
signbtn.addEventListener('click', function(e) {
  e.preventDefault();
  if (!document.getElementById('email').value ||
      !document.getElementById('password1').value ||
      !document.getElementById('password2').value ||
      !document.getElementById('name').value) {
    Swal.fire({ title: "請填寫所有必填資訊", icon: "warning" });
    return;
  }
  callSignUp();
});

const loginbtn = document.getElementById('send');
loginbtn.addEventListener('click', function(e) {
  e.preventDefault();
  if (!document.getElementById('floatingInput').value ||
      !document.getElementById('floatingPassword').value) {
    Swal.fire({ title: "請填寫所有必填資訊", icon: "warning" });
    return;
  }
  callLogin();
});

// ── 切換登入 ↔ 註冊 ──────────────────────────────────────
document.getElementById('signupLink').addEventListener('click', function(e) {
  e.preventDefault();
  showPage('signuppage');
});
document.getElementById('backlogin').addEventListener('click', function(e) {
  e.preventDefault();
  showPage('loginModal');
});

// ── 視差 ──────────────────────────────────────────────────
window.addEventListener('scroll', function() {
  const scrollY = window.scrollY;
  document.querySelectorAll('.parallax').forEach(el => {
    el.style.setProperty('--scroll', `${scrollY * 0.1}px`);
  });
});

// ── 忘記密碼流程 ──────────────────────────────────────────
document.getElementById('forgetPasswordbtn').addEventListener('click', function(e) {
  e.preventDefault();
  showPage('forgetpwdpage');
});
document.getElementById('forgetBacklogin').addEventListener('click', function(e) {
  e.preventDefault();
  showPage('loginModal');
});

// ── 倒數計時 ──────────────────────────────────────────────
let countdownTimer = null;
let endTime = null;
let counting = false;
let finished = false;

function startCountdown() {
  counting = true;
  finished = false;
  endTime = Date.now() + 300000;
  updateCountdown();
  countdownTimer = setInterval(updateCountdown, 200);
}

function updateCountdown() {
  if (!counting) return;
  const timerEl = document.getElementById("timer");
  if (!timerEl) return;
  const diff = endTime - Date.now();
  if (diff <= 0) {
    finishCountdown();
    return;
  }
  const sec = Math.floor(diff / 1000);
  const min = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  timerEl.textContent = `${min}:${s}`;
}

function finishCountdown() {
  if (finished) return;
  finished = true;
  counting = false;
  clearInterval(countdownTimer);
  countdownTimer = null;

  const timerEl = document.getElementById("timer");
  if (timerEl) timerEl.textContent = "00:00";

  Swal.fire({
    title: "Oops...",
    text: "驗證連結已過期，請重新申請。",
    icon: "warning",
  }).then(() => {
    showPage('loginModal');
  });
}

// 偵測 getLinkPage 被隱藏時停止倒數
const observer = new MutationObserver(() => {
  const page = document.getElementById("getLinkPage");
  if (!page || page.classList.contains("d-none") || !page.classList.contains("active")) {
    counting = false;
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
});
observer.observe(document.body, { attributes: true, childList: true, subtree: true });

document.getElementById('forgetSendbtn').addEventListener('click', function(e) {
  e.preventDefault();
  showPage('getLinkPage');
  startCountdown();
});

// ── 重設密碼流程 ──────────────────────────────────────────
document.getElementById('checkBackLogin1').addEventListener('click', function(e) {
  e.preventDefault();
  showPage('resetpwdpage');
  clearInterval(countdownTimer);
});

document.getElementById('resetbtn').addEventListener('click', function(e) {
  e.preventDefault();
  showPage('resetsuccesspage');
});

document.getElementById('resetSuccessBackLogin').addEventListener('click', function(e) {
  e.preventDefault();
  showPage('loginModal');
});

// ── 認證信倒數 + 重新發送 ─────────────────────────────────
let _resendTimer = null;

function startResendCountdown(seconds = 60) {
  const btn = document.getElementById('resendVerifyBtn');
  const display = document.getElementById('resendCountdown');
  if (!btn || !display) return;

  let remaining = seconds;
  btn.disabled = true;
  display.textContent = remaining;
  btn.style.display = 'block';

  clearInterval(_resendTimer);
  _resendTimer = setInterval(() => {
    remaining -= 1;
    display.textContent = remaining;
    if (remaining <= 0) {
      clearInterval(_resendTimer);
      _resendTimer = null;
      btn.disabled = false;
      display.textContent = '';
      btn.innerHTML = '重新發送認證信';
    }
  }, 1000);
}

document.getElementById('resendVerifyBtn').addEventListener('click', async function() {
  // TODO: 等後端實作 resend verification email API
  Swal.fire({
    icon: 'info',
    title: '功能即將開放',
    text: '重新發送認證信功能正在準備中，請稍後再試。',
    confirmButtonText: '好的'
  });
  // 點擊後重新開始倒數（避免重複點擊）
  // startResendCountdown(60);
});

// ── 密碼顯示 300ms 後隱藏 ────────────────────────────────
let timer;
document.querySelectorAll(".pwd").forEach((pwd) => {
  pwd.addEventListener("input", function() {
    pwd.type = "text";
    clearTimeout(timer);
    timer = setTimeout(() => {
      pwd.type = "password";
    }, 300);
  });
});

window.startCountdown = startCountdown;
