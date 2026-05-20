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

// ── 重設密碼 token（從 URL 帶入）────────────────────────────
let _resetToken = null;

// ── 待驗證的 email（checkEmailPage 重送信用）──────────────
let _pendingEmail = null;

// ── 載入完成後隱藏 loader，顯示內容，並展示登入頁 ──────────
window.onload = async function() {
  var loader = document.getElementById('loader');
  var content = document.getElementById('whatcontent');
  if (loader && content) {
    loader.style.setProperty('display', 'none', 'important');
    content.style.setProperty('display', 'block', 'important');
  }

  const params = new URLSearchParams(window.location.search);
  const resetToken = params.get('reset_token');
  const verifyToken = params.get('verify_token');

  if (resetToken) {
    _resetToken = resetToken;
    showPage('resetpwdpage');
  } else if (verifyToken) {
    showPage('loginModal');
    try {
      const bs = new BackendService();
      await bs.verifyEmail(verifyToken);
      // 驗證後試探是否已有 session（後端若有自動登入則直接跳轉）
      try {
        await bs.whoami();
        // 有 session → 直接跳轉
        const redirectUrl = params.get('redirect');
        let target = '../shop/shop.html';
        if (redirectUrl) {
          try {
            const t = new URL(redirectUrl, window.location.origin);
            if (t.origin === window.location.origin) target = t.href;
          } catch (_) {}
        }
        await Swal.fire({ icon: 'success', title: '帳號驗證成功！', showConfirmButton: false, timer: 1500 });
        window.location.replace(target);
      } catch (_) {
        // 無 session → 顯示登入框
        await Swal.fire({ icon: 'success', title: '帳號驗證成功！', text: '請登入以繼續。', confirmButtonText: '確定' });
      }
    } catch (e) {
      await Swal.fire({ icon: 'error', title: '驗證失敗', text: e.message, confirmButtonText: '確定' });
    }
  } else {
    showPage('loginModal');
  }
};

// ── Inline 欄位錯誤 helper ────────────────────────────────
function fieldError(inputId, errorId, msg) {
  const el = document.getElementById(inputId);
  const err = document.getElementById(errorId);
  if (el) el.classList.add('is-invalid-custom');
  if (err) { err.textContent = msg; err.classList.add('show'); }
}
function fieldClear(inputId, errorId) {
  const el = document.getElementById(inputId);
  const err = document.getElementById(errorId);
  if (el) el.classList.remove('is-invalid-custom');
  if (err) err.classList.remove('show');
}
// 使用者輸入時自動清除該欄錯誤
[
  ['floatingInput',  'err-login-email'],
  ['floatingPassword','err-login-pwd'],
  ['email',          'err-signup-email'],
  ['password1',      'err-signup-pwd1'],
  ['password2',      'err-signup-pwd2'],
  ['name',           'err-signup-name'],
  ['forgetemail',    'err-forget-email'],
].forEach(([inputId, errorId]) => {
  document.getElementById(inputId)?.addEventListener('input', () => fieldClear(inputId, errorId));
});

// 註冊 email：離開欄位時驗證 s學號@mail.nchu.edu.tw / treasurehub.tw
function isValidSignupEmail(email) {
  return /^[^@]+@mail\.nchu\.edu\.tw$|^[^@]+@treasurehub\.tw$/i.test(email);
}
document.getElementById('email')?.addEventListener('blur', function() {
  const val = this.value.trim();
  if (val && !isValidSignupEmail(val)) {
    fieldError('email', 'err-signup-email', '請使用 @mail.nchu.edu.tw 的學校信箱註冊');
  }
});

// ── 註冊 ──────────────────────────────────────────────────
const signuppage = document.getElementById('signuppage');

async function callSignUp() {
  const emailInput = document.getElementById('email');
  const passwordInput1 = document.getElementById('password1');
  const passwordInput2 = document.getElementById('password2');
  const nameInput = document.getElementById('name');
  const checkBackLogin = document.getElementById('checkBackLogin');

  // 密碼格式：至少 10 碼，需含大寫、小寫、數字、特殊符號
  const pwd = passwordInput1.value.trim();
  const isValid = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/.test(pwd);
  if (!isValid) {
    fieldError('password1', 'err-signup-pwd1', '密碼需至少 8 位，且包含大寫字母、小寫字母及數字');
    return;
  }

  if (passwordInput1.value !== passwordInput2.value) {
    fieldError('password2', 'err-signup-pwd2', '兩次輸入的密碼不一致');
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
    await backendService.signup(payload);
    _pendingEmail = payload.email;
    showPage('checkEmailPage');
  } catch (e) {
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
    loaderLogin.style.display = 'none';

    // 若後端回傳 emailVerify: false，詢問現在或之後驗證
    if (resp.data?.data?.emailVerify === false) {
      _pendingEmail = email;
      const choice = await Swal.fire({
        icon: 'warning',
        title: '帳號尚未驗證',
        html: `您的帳號尚未完成電子信箱驗證。<br><small style="color:#888;">未驗證前無法買賣商品。</small>`,
        confirmButtonText: '現在認證',
        cancelButtonText: '之後再說',
        showCancelButton: true,
      });
      if (choice.isConfirmed) {
        showPage('checkEmailPage');
        let resendMsg = `認證信已寄至 ${email}，請前往信箱點擊連結開通帳號。`;
        try {
          await backendService.resendVerificationEmail();
          startResendCountdown(300);
        } catch (err) {
          if (err?.message === 'RATE_LIMIT') {
            resendMsg = `認證信已於近期寄出，請檢查 ${email} 的收件匣（含垃圾郵件）。5 分鐘後可重新發送。`;
            startResendCountdown(300);
          } else {
            startResendCountdown(0);
          }
        }
        await Swal.fire({ icon: 'info', title: '請查收信箱', text: resendMsg, confirmButtonText: '確定' });
        return;
      }
      // 之後再說 → 繼續登入流程，但 emailVerify=false 已存入 localStorage
    }

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
    if (redirectUrl) {
      try {
        const target = new URL(redirectUrl, window.location.origin);
        if (target.origin === window.location.origin) {
          window.location.replace(target.href);
        } else {
          window.location.replace("../shop/shop.html");
        }
      } catch {
        window.location.replace("../shop/shop.html");
      }
    } else {
      window.location.replace("../shop/shop.html");
    }
  } catch (e) {
    console.error('登入錯誤：', e);
    if (e?.message === 'EMAIL_NOT_VERIFIED') {
      _pendingEmail = email;
      showPage('checkEmailPage');
      // 登入被拒沒有 session，無法自動送信；讓按鈕立即可用
      startResendCountdown(0);
      await Swal.fire({
        icon: 'warning',
        title: '帳號尚未驗證',
        text: '請前往信箱點擊認證連結，或點擊「重新發送認證信」補寄。',
        confirmButtonText: '確定'
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: e?.message || '登入失敗，請稍後再試'
      });
    }
  } finally {
    loaderLogin.style.display = 'none';
  }
}

// ── 密碼顯示／隱藏眼睛 ────────────────────────────────────
document.querySelectorAll('.pwd-wrap').forEach(wrap => {
  const input = wrap.querySelector('input[type="password"], input.pwd');
  if (!input) return;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'pwd-toggle';
  btn.innerHTML = '<i class="fa-regular fa-eye"></i>';
  wrap.appendChild(btn);
  btn.addEventListener('click', () => {
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.innerHTML = show ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
  });
});

// ── 條款 Modal ────────────────────────────────────────────
(function() {
  const overlay   = document.getElementById('termsModalOverlay');
  const body      = document.getElementById('termsModalBody');
  const agreeBtn  = document.getElementById('termsAgreeBtn');
  const hint      = document.getElementById('termsScrollHint');
  const closeBtn  = document.getElementById('termsModalClose');
  const openBtn   = document.getElementById('openTermsModal');
  const checkbox  = document.getElementById('agreeTerms');
  const signbtn   = document.getElementById('sign');

  function openModal() {
    overlay.classList.add('active');
    body.scrollTop = 0;
    agreeBtn.disabled = true;
    hint.style.opacity = '1';
  }
  function closeModal() {
    overlay.classList.remove('active');
  }

  openBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closeModal();
  });

  body.addEventListener('scroll', function() {
    const reachedBottom = body.scrollTop + body.clientHeight >= body.scrollHeight - 6;
    if (reachedBottom) {
      agreeBtn.disabled = false;
      hint.style.opacity = '0';
    }
  });

  agreeBtn.addEventListener('click', function() {
    checkbox.disabled = false;
    checkbox.checked  = true;
    signbtn.disabled  = false;
    closeModal();
  });

  checkbox.addEventListener('change', function() {
    signbtn.disabled = !this.checked;
  });
})();

// ── 按鈕事件 ──────────────────────────────────────────────
const signbtn = document.getElementById('sign');
signbtn.addEventListener('click', function(e) {
  e.preventDefault();
  if (!document.getElementById('agreeTerms').checked) return;
  let hasError = false;
  const signupEmailVal = document.getElementById('email').value.trim();
  if (!signupEmailVal) {
    fieldError('email', 'err-signup-email', '請輸入電子信箱'); hasError = true;
  } else if (!isValidSignupEmail(signupEmailVal)) {
    fieldError('email', 'err-signup-email', '請使用 @mail.nchu.edu.tw 的學校信箱註冊'); hasError = true;
  }
  if (!document.getElementById('password1').value) {
    fieldError('password1', 'err-signup-pwd1', '請輸入密碼'); hasError = true;
  }
  if (!document.getElementById('password2').value) {
    fieldError('password2', 'err-signup-pwd2', '請再次輸入密碼'); hasError = true;
  }
  if (!document.getElementById('name').value.trim()) {
    fieldError('name', 'err-signup-name', '請輸入暱稱'); hasError = true;
  }
  if (hasError) return;
  callSignUp();
});

const loginbtn = document.getElementById('send');
loginbtn.addEventListener('click', function(e) {
  e.preventDefault();
  let hasError = false;
  if (!document.getElementById('floatingInput').value.trim()) {
    fieldError('floatingInput', 'err-login-email', '請輸入電子信箱'); hasError = true;
  }
  if (!document.getElementById('floatingPassword').value) {
    fieldError('floatingPassword', 'err-login-pwd', '請輸入密碼'); hasError = true;
  }
  if (hasError) return;
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
document.getElementById('checkBackLogin')?.addEventListener('click', function(e) {
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

document.getElementById('forgetSendbtn').addEventListener('click', async function(e) {
  e.preventDefault();
  const email = document.getElementById('forgetemail').value.trim();
  if (!email) {
    fieldError('forgetemail', 'err-forget-email', '請輸入您的電子信箱');
    return;
  }
  const btn = this;
  btn.disabled = true;
  try {
    const bs = new BackendService();
    await bs.forgotPassword(email);
    showPage('getLinkPage');
  } catch (err) {
    Swal.fire({ icon: 'error', title: '發送失敗', text: err.message });
  } finally {
    btn.disabled = false;
  }
});

// ── 重設密碼流程 ──────────────────────────────────────────
document.getElementById('resetbtn').addEventListener('click', async function(e) {
  e.preventDefault();
  if (!_resetToken) {
    Swal.fire({ icon: 'error', title: '連結無效', text: '請透過信箱中的重設密碼連結進行操作' });
    return;
  }
  const pwd1 = document.getElementById('newPwd1').value;
  const pwd2 = document.getElementById('newPwd2').value;
  const isValid = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/.test(pwd1);
  if (!isValid) {
    Swal.fire({ icon: 'warning', title: '密碼格式不符', text: '密碼需至少 8 位，包含大寫、小寫字母及數字' });
    return;
  }
  if (pwd1 !== pwd2) {
    Swal.fire({ icon: 'warning', title: '密碼不一致', text: '兩次輸入的密碼不相同' });
    return;
  }
  const btn = this;
  btn.disabled = true;
  try {
    const bs = new BackendService();
    await bs.resetPassword(_resetToken, pwd1);
    showPage('resetsuccesspage');
  } catch (err) {
    Swal.fire({ icon: 'error', title: '重設失敗', text: err.message });
  } finally {
    btn.disabled = false;
  }
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

  clearInterval(_resendTimer);
  _resendTimer = null;
  btn.style.display = 'block';

  // seconds = 0 表示不需要倒數，直接開放按鈕
  if (seconds <= 0) {
    btn.disabled = false;
    display.textContent = '';
    btn.innerHTML = '重新發送認證信';
    return;
  }

  let remaining = seconds;
  btn.disabled = true;
  display.textContent = remaining;

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
  this.disabled = true;
  try {
    const bs = new BackendService();
    await bs.resendVerificationEmail();
    const hint = _pendingEmail ? `認證信已寄至 ${_pendingEmail}` : '請至信箱查收認證信';
    Swal.fire({ icon: 'success', title: '已重新發送', text: hint, confirmButtonText: '確定' });
    startResendCountdown(300); // 5 分鐘後才能再發
  } catch (e) {
    if (e?.message === 'RATE_LIMIT') {
      Swal.fire({ icon: 'warning', title: '發送過於頻繁', text: '每 5 分鐘只能發送一次，每小時上限 3 次，請稍後再試。', confirmButtonText: '確定' });
    } else {
      Swal.fire({ icon: 'error', title: '發送失敗', text: e?.message || '請稍後再試' });
    }
    this.disabled = false;
  }
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
