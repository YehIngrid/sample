import BackendService from '../BackendService.js';

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

    // 表單送出
    document.getElementById('reset-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        const newPassword   = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        // 前端驗證
        let hasError = false;
        if (newPassword.length < 8) {
            setError('err-password', '密碼至少需要 8 個字元');
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
            if (status === 400 || status === 404 || status === 410) {
                // token 無效或已過期
                showState('state-invalid');
            } else if (err.code === 'ECONNABORTED' || !err.response) {
                Swal.fire({
                    icon: 'error',
                    title: '網路連線異常',
                    text: '無法連線伺服器，請確認網路狀態後再試。',
                    confirmButtonText: '確定'
                });
            } else {
                Swal.fire({
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
