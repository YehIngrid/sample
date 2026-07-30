import BackendService from '../BackendService.js';
import { AppModal } from '../default/app-modal.js';

const BASE_URL = 'https://treasurehub.tw';

function showState(id) {
    ['state-form', 'state-invalid', 'state-success'].forEach(s => {
        document.getElementById(s).classList.toggle('d-none', s !== id);
    });
}

function setError(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    const input = el.previousElementSibling?.querySelector?.('input') ??
                  el.closest('.rp-field')?.querySelector('.rp-input');
    if (input) input.classList.toggle('is-error', !!msg);
}

function clearErrors() {
    setError('err-password', '');
    setError('err-confirm', '');
}

document.addEventListener('DOMContentLoaded', () => {
    // 取出 token
    const token = new URLSearchParams(window.location.search).get('token');

    // 隱藏 loader，顯示內容
    document.getElementById('loader').style.display = 'none';
    document.getElementById('whatcontent').classList.remove('d-none');

    if (!token) {
        showState('state-invalid');
        return;
    }

    // 顯示/隱藏密碼切換
    document.querySelectorAll('.rp-eye').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = document.getElementById(btn.dataset.target);
            const isText = input.type === 'text';
            input.type = isText ? 'password' : 'text';
            btn.querySelector('i').className = isText ? 'fa fa-eye' : 'fa fa-eye-slash';
        });
    });

    // 密碼規則即時提示（跟註冊/帳號重設共用同一套規則：至少 8 碼＋大寫＋小寫＋數字）
    const pwdInput = document.getElementById('new-password');
    const pwdRules = {
        len:   v => v.length >= 8,
        upper: v => /[A-Z]/.test(v),
        lower: v => /[a-z]/.test(v),
        digit: v => /\d/.test(v),
    };
    function refreshPwdRules() {
        const v = pwdInput.value;
        Object.keys(pwdRules).forEach(rule => {
            document.querySelector(`#pwd-rules [data-rule="${rule}"]`)
                ?.classList.toggle('ok', pwdRules[rule](v));
        });
    }
    function isPasswordValid(v) {
        return Object.values(pwdRules).every(check => check(v));
    }
    pwdInput.addEventListener('input', refreshPwdRules);

    // 表單送出
    document.getElementById('reset-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        const newPassword   = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        // 前端驗證（跟後端實際規則一致：至少 8 碼＋大寫＋小寫＋數字）
        let hasError = false;
        refreshPwdRules();
        if (!isPasswordValid(newPassword)) {
            setError('err-password', '密碼需至少 8 位，且包含大寫字母、小寫字母及數字');
            hasError = true;
        }
        if (newPassword !== confirmPassword) {
            setError('err-confirm', '兩次輸入的密碼不一致');
            hasError = true;
        }
        if (hasError) return;

        // 送出
        const btn      = document.getElementById('submit-btn');
        const btnText  = document.getElementById('btn-text');
        const spinner  = document.getElementById('btn-spinner');
        btn.disabled   = true;
        btnText.classList.add('d-none');
        spinner.classList.remove('d-none');

        try {
            await axios.post(
                `${BASE_URL}/api/account/reset-password`,
                { token, newPassword },
                {
                    withCredentials: true,
                    timeout: 30000,
                }
            );
            showState('state-success');
        } catch (err) {
            const status = err.response?.status;
            if (status === 404 || status === 410) {
                // token 不存在或已過期，才顯示「連結失效」畫面
                showState('state-invalid');
            } else if (status === 400) {
                // 400 是驗證錯誤（例如密碼不符合規則），要把後端訊息秀出來，不能當成連結失效
                setError('err-password', err.response?.data?.message || '密碼不符合規則，請重新確認');
            } else if (err.code === 'ECONNABORTED' || !err.response) {
                AppModal.fire({
                    icon: 'error',
                    title: '網路連線異常',
                    text: '無法連線伺服器，請確認網路狀態後再試。',
                    confirmButtonText: '確定'
                });
            } else {
                AppModal.fire({
                    icon: 'error',
                    title: '重設失敗',
                    text: err.response?.data?.message ?? '請稍後再試，或重新申請重設連結。',
                    confirmButtonText: '確定'
                });
            }
        } finally {
            btn.disabled = false;
            btnText.classList.remove('d-none');
            spinner.classList.add('d-none');
        }
    });
});
