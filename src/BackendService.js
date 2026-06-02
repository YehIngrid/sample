// ── 重試工具：network 錯誤或 5xx 才重試，4xx 直接拋出 ────────────
async function withRetry(fn, maxRetries = 3, baseDelay = 800) {
    let lastErr;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastErr = err;
            const status = err?.response?.status;
            if (status && status < 500) throw err; // 4xx：不重試
            if (attempt < maxRetries) {
                await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, attempt)));
            }
        }
    }
    throw lastErr;
}

// ── 全域 401 攔截：session 過期時統一導回登入頁 ────────────
let _handlingExpiry = false;
const _SKIP_401 = ['/api/account/login', '/api/account/signup', '/api/whoami'];

// ── 網路逾時 / 離線 提示 ────────────
let _networkBannerShown = false;
const _BANNER_PAGES = [
    '/account/account.html',
    '/shop/shop.html',
    '/person/person.html',
    '/wishpool/wishpool.html',
    '/news/news.html',
    '/chatroom/chatroom.html',
    '/commodity/commodity.html',
    '/product/product.html',
];
function _showNetworkBanner() {
    const path = window.location.pathname;
    if (!_BANNER_PAGES.some(p => path.endsWith(p))) return;
    if (_networkBannerShown) return;
    _networkBannerShown = true;
    const existing = document.getElementById('_netBanner');
    if (existing) return;
    const el = document.createElement('div');
    el.id = '_netBanner';
    el.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#004b97;color:#fff;font-size:14px;font-weight:600;text-align:center;padding:10px 16px;letter-spacing:0.02em;box-shadow:0 2px 8px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;gap:10px;';
    el.innerHTML = `
      <span>⚠️ 無法連線伺服器，請確認網路狀態，或網站正在維護更新中。</span>
      <span id="_netBannerDots" style="display:inline-flex;gap:3px;align-items:center;">
        <span class="_nd" style="width:5px;height:5px;border-radius:50%;background:#abdad5;display:inline-block;animation:_ndPulse 1.2s ease-in-out infinite;"></span>
        <span class="_nd" style="width:5px;height:5px;border-radius:50%;background:#abdad5;display:inline-block;animation:_ndPulse 1.2s ease-in-out 0.2s infinite;"></span>
        <span class="_nd" style="width:5px;height:5px;border-radius:50%;background:#abdad5;display:inline-block;animation:_ndPulse 1.2s ease-in-out 0.4s infinite;"></span>
      </span>
      <span style="font-size:12px;opacity:0.85;font-weight:400;" id="_netBannerStatus">正在嘗試重連</span>
      <button onclick="location.reload()" style="background:#abdad5;color:#004b97;border:none;border-radius:6px;padding:3px 12px;cursor:pointer;font-weight:700;flex-shrink:0;">重新整理</button>
    `;
    if (!document.getElementById('_ndStyle')) {
      const style = document.createElement('style');
      style.id = '_ndStyle';
      style.textContent = '@keyframes _ndPulse{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1.2)}}';
      document.head.appendChild(style);
    }
    document.body.prepend(el);
}

// ── 全域攔截：任何 axios call 碰到網路層錯誤就顯示 banner ────────────
let _axiosInited = false;
function _initAxios() {
    if (_axiosInited) return;
    _axiosInited = true;
    axios.defaults.withCredentials = true;
    axios.defaults.timeout = 30000;
    axios.interceptors.response.use(
        res => res,
        err => {
            const isNetworkError = err.code === 'ECONNABORTED'
                || err.message === 'Network Error'
                || !err.response;
            if (isNetworkError) _showNetworkBanner();
            return Promise.reject(err);
        }
    );
    _attach401Handler(axios);
}

function _attach401Handler(instance) {
    instance.interceptors.response.use(
        res => res,
        err => {
            const url = err?.config?.url || '';
            const status = err?.response?.status;
            const msg = err?.response?.data?.message || '';

            // 逾時或網路中斷（banner 由全域 interceptor 處理，這裡直接跳過）
            if (err.code === 'ECONNABORTED' || err.message === 'Network Error' || !err.response) {
                return Promise.reject(err);
            }

            if (status === 403 && msg === 'Account is temporarily suspended') {
                const loader = document.getElementById('loader');
                const content = document.getElementById('whatcontent');
                if (loader) { loader.classList.add('d-none'); loader.classList.remove('d-flex'); }
                if (content) content.classList.remove('d-none');
                Swal.fire({
                    icon: 'error',
                    title: '帳號已被限制',
                    text: '信譽積分太低，無法使用',
                    confirmButtonText: '確定',
                });
                return Promise.reject(err);
            }

            if (status === 401 && msg === 'Email not verified') {
                return Promise.reject(err);
            }

            const skip = _SKIP_401.some(p => url.includes(p));
            const onAccountPage = window.location.pathname.includes('account.html');
            if (status === 401 && !skip && !_handlingExpiry && !onAccountPage) {
                _handlingExpiry = true;
                window.isLoggedIn = false;
                const currentUrl = window.location.pathname + window.location.search;

                // 使用者本 session 已拒絕重新登入 → 靜默更新 UI，不再詢問
                if (sessionStorage.getItem('_loginExpiredDeclined') === '1') {
                    _handlingExpiry = false;
                    if (typeof window._showLoggedOutUI === 'function') window._showLoggedOutUI();
                    return Promise.reject(err);
                }

                Swal.fire({
                    icon: 'warning',
                    title: '登入已過期',
                    text: '是否前往重新登入？',
                    showCancelButton: true,
                    confirmButtonText: '前往登入',
                    cancelButtonText: '取消',
                    allowOutsideClick: false
                }).then(async (result) => {
                    _handlingExpiry = false;
                    if (result.isConfirmed) {
                        sessionStorage.removeItem('_loginExpiredDeclined');
                        location.href = `../account/account.html?redirect=${encodeURIComponent(currentUrl)}`;
                    } else {
                        sessionStorage.setItem('_loginExpiredDeclined', '1');
                        try { await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/account/logout`, {}, { withCredentials: true }); } catch (_) {}
                        if (typeof window._showLoggedOutUI === 'function') window._showLoggedOutUI();
                    }
                });
            }
            return Promise.reject(err);
        }
    );
}
export default class BackendService {
    constructor() {
        _initAxios(); // 確保 axios.defaults 和 global interceptors 設定好（只執行一次）
        this.baseUrl = import.meta.env.VITE_API_BASE_URL;
        this.http = axios.create({
            baseURL: this.baseUrl,
            withCredentials: true,
            timeout: 30000,
        });
        _attach401Handler(this.http); // 覆蓋少數用 this.http 的呼叫
    }
    _forbidden(error) {
        if (error?.response?.status === 403) throw new Error('存取被禁止 - 帳號已停用或電子郵件未驗證');
    }
    getCookie(name) {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        if (match) return match[2];
        return null;
    }
    ping() {
        return this.http.get('/api/ping');
    }
    //在localstorage記住目前是否登入帳號後端，用localstorage記住帳號資訊等
    async signup(userData) {
        let response;
        try {
            response = await axios.post(`${this.baseUrl}/api/account/signup`, userData);
            return response;
        } catch (error) {
            console.error("註冊錯誤：", error);
            if (error.response?.data?.message == "Email already exists") {
                throw new Error("此帳號已被註冊");
            } else {
                throw new Error("系統發生錯誤，請稍後再試");
            }
        }
    }
    async login(userData) {
        try {
            const response = await axios.post(
            `${this.baseUrl}/api/account/login`,
            userData,
            { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
            );

            const d = response?.data?.data;
            if (d?.uid)          localStorage.setItem('uid', d.uid);
            if (d?.role)         localStorage.setItem('role', d.role);
            if (d?.emailVerify != null) localStorage.setItem('emailVerify', String(d.emailVerify));

            // 若 whoami / getUserData 是 Promise 版
            if (typeof this.whoami === 'function') {
            try { await this.whoami(); } catch (_) {}
            }
            if (typeof this.getUserData === 'function') {
            try { await this.getUserData(); } catch (_) {}
            }

            return response;
        } catch (error) {
            console.error('登入錯誤：', error);

            // 友善化錯誤訊息
            const status = error?.response?.status;
            const msg    = error?.response?.data?.message;

            if (status === 403) throw new Error('存取被禁止 - 帳號已停用或電子郵件未驗證');
            if (status === 401 && msg === 'Email not verified') throw new Error('EMAIL_NOT_VERIFIED');
            if (status === 401 || /invalid/i.test(msg)) {
            throw new Error('帳號或密碼錯誤');
            }
            if (status === 429) {
            throw new Error('嘗試次數過多，請稍後再試');
            }
            throw new Error('登入失敗，請稍後再試');
        }
        }
    async logout() {
        try {
            const response = await axios.post(`${this.baseUrl}/api/account/logout`);
            // 清除 localStorage
            localStorage.removeItem('uid');
            localStorage.removeItem('username');
            localStorage.removeItem('intro');
            localStorage.removeItem('avatar');
            localStorage.removeItem('rate');
            localStorage.removeItem('role');
            localStorage.removeItem('emailVerify');
            localStorage.removeItem('loginEmail');
            return response;
        } catch (error) {
            console.error("登出錯誤：", error);
            throw new Error("系統發生錯誤，請稍後再試");
        }
    }

    async getUserData() {
        // 從 localStorage 取出
        const savedUid = localStorage.getItem('uid');
        const savedUsername = localStorage.getItem('username');
        const savedIntro = localStorage.getItem('intro');
        const savedRate = localStorage.getItem('rate');
        try {
            const response = await axios.get(`${this.baseUrl}/api/account/${savedUid}`, {
                withCredentials: true
            });
            const d = response.data.data;
            localStorage.setItem('username', d.name);
            localStorage.setItem('intro', d.introduction);
            localStorage.setItem('avatar', d.photoURL);
            localStorage.setItem('rate', d.rate);
            if (d.contactEmail != null) {
                localStorage.setItem('contractEmail', d.contactEmail);
            }
            return response;
        } catch (error) {
            console.error("無法取得使用者資料", error);
            throw new Error("系統發生錯誤，請稍後再試");
        }
    }
    async updateProfile(userData) {
        let _this = this;
        let response;
        try {
            response = await axios.patch(`${this.baseUrl}/api/account/update`, userData, {
                    withCredentials: true
                });
        } catch (error) {
            console.error("更新錯誤：", error);
            if (error.response?.data?.message == "User not found") {
                console.error("使用者不存在", error);
            } else {
                console.error("更新失敗，請稍後再試", error);
            }
            return Promise.reject(error);
        }
        // 更新成功後，儲存新的使用者資料到 localStorage
        await _this.getUserData();
        return response;
    }
    async whoami() {
        try {
            const response = await axios.get(`${this.baseUrl}/api/whoami`, {withCredentials: true });
            const d = response.data?.data ?? response.data;
            if (d?.contactEmail != null) localStorage.setItem('contractEmail', d.contactEmail);
            // 已登入但 localStorage 缺少使用者資料（如清除快取後）→ 自動補充
            if (!localStorage.getItem('username') || !localStorage.getItem('uid')) {
                try { await this.getMe(); } catch (_) {}
            }
            return response.data;
        } catch (error) {
            this._forbidden(error);
            console.error("無法取得使用者資訊", error);
            return Promise.reject(error);
        }
    }
    async getMe() {
        try {
            const response = await axios.get(`${this.baseUrl}/api/account/me`, { withCredentials: true });
            const d = response.data?.data;
            if (d) {
                if (d.uid)              localStorage.setItem('uid', d.uid);
                if (d.role)             localStorage.setItem('role', d.role);
                if (d.name)             localStorage.setItem('username', d.name);
                if (d.introduction != null) localStorage.setItem('intro', d.introduction);
                if (d.photoURL)         localStorage.setItem('avatar', d.photoURL);
                if (d.rate != null)     localStorage.setItem('rate', d.rate);
                if (d.contactEmail != null) localStorage.setItem('contractEmail', d.contactEmail);
                if (d.account?.email)   localStorage.setItem('loginEmail', d.account.email);
                if (d.account?.emailVerify != null) localStorage.setItem('emailVerify', String(d.account.emailVerify));
            }
            return response;
        } catch (error) {
            console.error("取得帳號資訊失敗", error);
            return Promise.reject(error);
        }
    }
    async disableAccount() {
        try {
            const response = await axios.post(`${this.baseUrl}/api/account/disable`);
            return response;
        } catch (error) {
            console.error("停用帳號錯誤：", error);
            throw new Error("系統發生錯誤，請稍後再試");
        }
    }
    async forgotPassword(email) {
        try {
            const response = await axios.post(`${this.baseUrl}/api/account/forgot-password`, { email });
            return response;
        } catch (error) {
            console.error('忘記密碼錯誤：', error);
            throw new Error('系統發生錯誤，請稍後再試');
        }
    }
    async resetPassword(token, newPassword) {
        try {
            const response = await axios.post(`${this.baseUrl}/api/account/reset-password`, { token, newPassword });
            return response;
        } catch (error) {
            console.error('重設密碼錯誤：', error);
            const msg = error?.response?.data?.message;
            if (error?.response?.status === 400) throw new Error(msg || '連結無效或已過期，請重新申請');
            throw new Error('系統發生錯誤，請稍後再試');
        }
    }
    async verifyEmail(token) {
        try {
            const response = await axios.get(`${this.baseUrl}/api/account/verify-email/${encodeURIComponent(token)}`);
            return response;
        } catch (error) {
            console.error('驗證電子郵件錯誤：', error);
            const msg = error?.response?.data?.message;
            throw new Error(msg || '驗證失敗，連結可能已過期');
        }
    }
    async resendVerificationEmail() {
        try {
            const response = await axios.post(`${this.baseUrl}/api/account/resend-verification`, {}, { withCredentials: true });
            return response;
        } catch (error) {
            const status = error?.response?.status;
            const msg = error?.response?.data?.message;
            if (status === 429) throw new Error('RATE_LIMIT');
            throw new Error(msg || '發送失敗，請稍後再試');
        }
    }
    async changePassword(currentPassword, newPassword) {
        try {
            const response = await this.http.post('/api/account/change-password', { currentPassword, newPassword });
            return response;
        } catch (error) {
            console.error('修改密碼錯誤：', error);
            const status = error?.response?.status;
            const msg = error?.response?.data?.message;
            if (status === 400 || status === 401) throw new Error(msg || '目前密碼錯誤');
            throw new Error('系統發生錯誤，請稍後再試');
        }
    }
    // ── News API ──────────────────────────────────────────
    async getNewsList(page = 1, limit = 10) {
        try {
            const response = await axios.get(`${this.baseUrl}/api/news/list`, { params: { page, limit }, withCredentials: true });
            return response.data;
        } catch (error) {
            console.error('取得新聞列表錯誤：', error);
            throw new Error('無法載入最新資訊');
        }
    }
    async getNewsItem(id) {
        try {
            const response = await axios.get(`${this.baseUrl}/api/news/item/${id}`, { withCredentials: true });
            return response.data;
        } catch (error) {
            console.error('取得新聞詳情錯誤：', error);
            throw new Error('無法載入文章內容');
        }
    }
    async getNewsAll(page = 1, limit = 20, status = null) {
        try {
            const params = { page, limit };
            if (status) params.status = status;
            const response = await this.http.get('/api/news/all', { params });
            return response.data;
        } catch (error) {
            console.error('取得全部新聞錯誤：', error);
            throw new Error('無法載入文章列表');
        }
    }
    async createNews(formData) {
        try {
            const response = await this.http.post('/api/news/create', formData);
            return response.data;
        } catch (error) {
            console.error('新增新聞錯誤：', error);
            const msg = error?.response?.data?.message;
            throw new Error(msg || '發布失敗，請稍後再試');
        }
    }
    async updateNews(id, formData) {
        try {
            const response = await this.http.put(`/api/news/update/${id}`, formData);
            return response.data;
        } catch (error) {
            console.error('更新新聞錯誤：', error);
            const msg = error?.response?.data?.message;
            throw new Error(msg || '更新失敗，請稍後再試');
        }
    }
    async deleteNews(id) {
        try {
            const response = await this.http.delete(`/api/news/delete/${id}`);
            return response.data;
        } catch (error) {
            console.error('刪除新聞錯誤：', error);
            throw new Error('刪除失敗，請稍後再試');
        }
    }
    async create(sellData) {
        const token = this.getCookie('idtoken');
        try {
            const response = await this.http.post(
                '/api/commodity/create',
                sellData,
                {
                    withCredentials: true,
                    headers: {
                        idtoken: token
                        // 不要手動設 'Content-Type'，讓 axios 依 FormData 自動帶 boundary
                    }
                }
            );
            return response.data;
        } catch (err) {
            console.error(err);
            const status = err?.response?.status;
            const msg = err?.response?.data?.message || '上架商品失敗';
            const error = new Error(msg);
            error.status = status;
            return Promise.reject(error);
        }
    }

    // 統一商品列表 API：GET /api/commodity/list/{listName}
    // listName: all | hot | book | life | special | reuse | storage | other
    // sort: default | new | price-low | price-high
    async getCommodityList(listName = 'all', { page, limit, sort, maxPrice, newOrOld } = {}) {
        try {
            const params = {};
            if (page) params.page = page;
            if (limit) params.limit = limit;
            if (sort && sort !== 'default') params.sort = sort;
            if (maxPrice) params.maxPrice = maxPrice;
            if (newOrOld) params.new_or_old = newOrOld;
            const response = await axios.get(`${this.baseUrl}/api/commodity/list/${listName}`, { params });
            return response.data;
        } catch (error) {
            console.error("無法取得商品列表", error);
            return Promise.reject(error);
        }
    }
    // 保留舊方法以向下相容（內部改呼叫新 API）
    async getAllCommodities(pagingInfo) { return this.getCommodityList('all', pagingInfo); }
    async getHotItems(pagingInfo) { return this.getCommodityList('hot', pagingInfo); }
    async getNewItems(pagingInfo) { return this.getCommodityList('all', { ...pagingInfo, sort: 'new' }); }
    // 根據分類取得商品列表
    async searchCommodities({ keyword, category, maxPrice, page, limit } = {}) {
        try {
            const params = {};
            if (keyword) params.keyword = keyword;
            if (category && category !== 'all') params.category = category;
            if (maxPrice) params.maxPrice = maxPrice;
            if (page) params.page = page;
            if (limit) params.limit = limit;
            const response = await axios.get(`${this.baseUrl}/api/commodity/search`, { params });
            return response.data;
        } catch (error) {
            console.error("搜尋商品失敗", error);
            return Promise.reject(error);
        }
    }
    async getCategoryItems(category, pagingInfo) {
        return this.getCommodityList(category, pagingInfo);
    }
    async getItemsInfo(id) {
        try {
            const response = await axios.get(`${this.baseUrl}/api/commodity/item/${id}`);
            return response.data;
        } catch (error) {
            console.error("讀取商品資訊失敗", error);
            return Promise.reject(error);
        } 
    }
    async getMyItems(pagingInfo = {}) {
        try {
            const response = await axios.get(`${this.baseUrl}/api/commodity/my`, {
                params: pagingInfo,
                headers: { "Cache-Control": "no-cache" },
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            console.error(error);
            return Promise.reject(error);
        }
    }
    async deleteMyItems(id) {
        try {
            const response = await axios.delete(`${this.baseUrl}/api/commodity/delete/${id}`);
            return response.data;
        } catch (error) {
            this._forbidden(error);
            console.error(error);
            return Promise.reject(new Error("無法刪除商品"));
        }
    }
    async updateMyItems(id, data) {
        try {
            const token = this.getCookie('idtoken'); // 直接拿 cookie
            const headers = { idtoken: token };

            // 如果傳的是 JSON，就自己加 Content-Type
            if (!(data instanceof FormData)) {
                headers['Content-Type'] = 'application/json';
            }

            const res = await axios.put(
                `${this.baseUrl}/api/commodity/update/${id}`,
                data,
                { headers }
            );
            return res;
        } catch (error) {
            console.error("更新錯誤：", error);
            return Promise.reject(error);
        }
    }
    async addItemsToCart(commodityId, quantity) {
        if (!commodityId) {
            return Promise.reject(new Error("Commodity ID is required"));
        }
        if (!Number.isInteger(quantity) || quantity <= 0) {
            return Promise.reject(new Error("Quantity 必須是正整數"));
        }

        try {
            return await withRetry(() => axios.post(
                `${this.baseUrl}/api/cart/add/${commodityId}`,
                { quantity },
                { headers: { "Content-Type": "application/json" }, withCredentials: true }
            ));
        } catch (error) {
            this._forbidden(error);
            console.error("發生錯誤", error);
            return Promise.reject(error);
        }
    }

    async getMyCart() {
        try {
            const response = await axios.get(`${this.baseUrl}/api/cart`, { withCredentials: true });
            return response;
        } catch (error) {
            this._forbidden(error);
            console.error("發生錯誤", error);
            return Promise.reject(error);
        }
    }
    async removeItemsFromCart(commodityId) {
        try {
            const response = await axios.post(`${this.baseUrl}/api/cart/remove/${commodityId}`);
            return response;
        } catch (error) {
            this._forbidden(error);
            console.error("發生錯誤", error);
            return Promise.reject(error);
        }
    }
    async updateCartItemQuantity(cartItemId, quantity) {
        if (!Number.isInteger(quantity) || quantity < 1) {
            return Promise.reject(new Error("Quantity 必須是正整數"));
        }

        try {
            const response = await axios.patch(
                `${this.baseUrl}/api/cart/update/${cartItemId}`,
                { quantity },
                { headers: { "Content-Type": "application/json" }, withCredentials: true }
            );
            return response;
        } catch (error) {
            this._forbidden(error);
            console.error("發生錯誤", error);
            return Promise.reject(error);
        }
    }
    async clearMyCart() {
        try {
            const response = await axios.delete(`${this.baseUrl}/api/cart/clear`);
            return response;
        } catch (error) {
            this._forbidden(error);
            console.error("發生錯誤", error);
            return Promise.reject(error);
        }
    }
    async getUserCommodities(uid) {
        try {
            const response = await axios.get(`${this.baseUrl}/api/commodity/user/${uid}`);
            return response;
        } catch (error) {
            console.error("發生錯誤", error);
            return Promise.reject(error);
        }
    }
    async getOrderStatus() {
        try {
            const response = await axios.get(`${this.baseUrl}/api/order`, { headers: { "Cache-Control": "no-cache" } });
            return response;
        } catch (error) {
            this._forbidden(error);
            console.error("發生錯誤", error);
            return Promise.reject(error);
        }
    }
    async createOrder(cartItems) {
        try {
            const payload = {
                cartItems : cartItems.map(item => ({
                    id: item.id,
                    qty: item.qty
                }))
            };
            const response = await axios.post(
            `${this.baseUrl}/api/order/create`,
            payload
            );

            return response;
        } catch (error) {
            this._forbidden(error);
            console.error('建立訂單失敗', error);
            return Promise.reject(error);
        }
    }

    async getBuyerOrders(page = 1, status = null) {
        try {
            const params = { page };
            if (status) params.status = status;
            const response = await axios.get(`${this.baseUrl}/api/order/buyer`, { params, headers: { "Cache-Control": "no-cache" } });
            return response;
        } catch (error) {
            this._forbidden(error);
            console.error("發生錯誤", error);
            return Promise.reject(error);
        }
    }
    async getSellerOrders(page = 1, status = null) {
        try {
            const params = { page };
            if (status) params.status = status;
            const response = await axios.get(`${this.baseUrl}/api/order/seller`, { params, headers: { "Cache-Control": "no-cache" } });
            return response;
        } catch (error) {
            this._forbidden(error);
            console.error("發生錯誤", error);
            return Promise.reject(error);
        }
    }
    async getOrderDetails(id) {
        try {
            const response = await axios.get(`${this.baseUrl}/api/order/${id}`);
            return response;
        } catch (error) {
            this._forbidden(error);
            console.error("發生錯誤", error);
            return Promise.reject(error);
        }
    }
    async getOrderBothReviews(orderId) {
        try {
            const response = await axios.get(`${this.baseUrl}/api/review/order/${orderId}`);
            return response;
        } catch (error) {
            console.error("讀取訂單雙方評論失敗", error);
            return Promise.reject(error);
        }
    }
    async getPublicUserProfile(userId) {
        try {
            const response = await axios.get(`${this.baseUrl}/api/account/${userId}`);
            return response;
        } catch (error) {
            console.error("取得使用者資料失敗", error);
            return Promise.reject(error);
        }
    }
    async getUserReviews(userId, page = 1, limit = 10) {
        try {
            const response = await axios.get(`${this.baseUrl}/api/review/user/${userId}`, { params: { page, limit } });
            return response;
        } catch (error) {
            console.error("讀取用戶評價失敗", error);
            return Promise.reject(error);
        }
    }
    async getReviewTags() {
        try {
            const response = await this.http.get('/api/review/tags');
            return response;
        } catch (error) {
            console.error("取得評論標籤失敗", error);
            return Promise.reject(error);
        }
    }
    async postReview(orderId, payload) {
        try {
            const response = await axios.post(`${this.baseUrl}/api/review/order/${orderId}`, payload);
            return response;
        } catch (error) {
            console.error("送出評價失敗", error);
            return Promise.reject(error);
        }
    }
    async sellerAcceptOrders(id) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/api/order/${id}/accept`,
                { headers: { "Content-Type": "application/json" } }
            );
            return response;
        } catch (error) {
            console.error("發生錯誤", error);
            return Promise.reject(error);
        }
    }
    async sellerDeliveredOrders(id) {
        try {
            const response = await axios.post(`${this.baseUrl}/api/order/${id}/delivered`);
            return response;
        } catch (error) {
            console.error("發生錯誤", error);
            return Promise.reject(error);
        }
    }
    async buyerCompletedOrders(id) {
        try {
            const response = await axios.post(`${this.baseUrl}/api/order/${id}/completed`);
            return response;
        } catch (error) {
            console.error("發生錯誤", error);
            return Promise.reject(error);
        }
    }
    async sellerCompletedOrders(id, pin) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/api/order/${id}/completed?pinCode=${encodeURIComponent(pin)}`
            );
            return response;
        } catch (error) {
            console.error("發生錯誤", error);
            return Promise.reject(error);
        }
    }
    async reportSeller(userId, payload) {
        try {
            const response = await axios.post(`${this.baseUrl}/api/reports`, { reportedUserId: userId, ...payload });
            return response;
        } catch (error) {
            console.error("檢舉失敗", error);
            return Promise.reject(error);
        }
    }
    async reportReview(reviewId, payload) {
        try {
            const fd = new FormData();
            fd.append('reviewId', reviewId);
            if (payload) Object.entries(payload).forEach(([k, v]) => { if (v != null) fd.append(k, v); });
            const response = await axios.post(`${this.baseUrl}/api/reports`, fd);
            return response;
        } catch (error) {
            console.error("檢舉評價失敗", error);
            return Promise.reject(error);
        }
    }
    async cancelMyOrder(id) {
        try {
            const response = await axios.post(`${this.baseUrl}/api/order/${id}/cancel`);
            return response;
        } catch (error) {
            console.error("發生錯誤", error);
            return Promise.reject(error);
        }
    }
    async getNotifications(page = 1, limit = 20) {
        try {
            const response = await axios.get(`${this.baseUrl}/api/notifications`, { params: { page, limit } });
            return response;
        } catch (error) {
            console.error("取得通知失敗", error);
            return Promise.reject(error);
        }
    }
    async markNotificationRead(id) {
        try {
            const response = await axios.patch(`${this.baseUrl}/api/notifications/${id}/read`);
            return response;
        } catch (error) {
            console.error("標記通知已讀失敗", error);
            return Promise.reject(error);
        }
    }
    async markAllNotificationsRead() {
        try {
            const response = await axios.patch(`${this.baseUrl}/api/notifications/read-all`);
            return response;
        } catch (error) {
            console.error("全部已讀失敗", error);
            return Promise.reject(error);
        }
    }

    // ── Review Tags Admin API ─────────────────────────────
    async createReviewTag(payload) {
        try {
            const response = await this.http.post('/api/review/tags', payload);
            return response.data;
        } catch (error) {
            console.error("建立評論標籤失敗", error);
            return Promise.reject(error);
        }
    }
    async updateReviewTag(tag, payload) {
        try {
            const response = await this.http.patch(`/api/review/tags/${encodeURIComponent(tag)}`, payload);
            return response.data;
        } catch (error) {
            console.error("更新評論標籤失敗", error);
            return Promise.reject(error);
        }
    }

    // ── Reports API ───────────────────────────────────────
    async getReportCategories() {
        try {
            const response = await this.http.get('/api/reports/categories');
            return response.data;
        } catch (error) {
            console.error("取得檢舉類型失敗", error);
            return Promise.reject(error);
        }
    }
    async submitReport(formData) {
        try {
            const response = await this.http.post('/api/reports', formData);
            return response.data;
        } catch (error) {
            console.error("送出檢舉失敗", error);
            return Promise.reject(error);
        }
    }
    async getMyReports({ page = 1, limit = 10 } = {}) {
        try {
            const response = await this.http.get('/api/reports/mine', { params: { page, limit } });
            return response.data;
        } catch (error) {
            console.error("取得我的檢舉失敗", error);
            return Promise.reject(error);
        }
    }
    async getAllReports({ status, page = 1, limit = 20 } = {}) {
        try {
            const params = { page, limit };
            if (status) params.status = status;
            const response = await this.http.get('/api/reports', { params });
            return response.data;
        } catch (error) {
            console.error("取得所有檢舉失敗", error);
            return Promise.reject(error);
        }
    }
    async getReportDetail(id) {
        try {
            const response = await this.http.get(`/api/reports/${id}`);
            return response.data;
        } catch (error) {
            console.error("取得檢舉詳情失敗", error);
            return Promise.reject(error);
        }
    }
    async reviewReport(id, payload) {
        try {
            const response = await this.http.patch(`/api/reports/${id}/review`, payload);
            return response.data;
        } catch (error) {
            console.error("審核檢舉失敗", error);
            return Promise.reject(error);
        }
    }
    async createReportCategory(payload) {
        try {
            const response = await this.http.post('/api/reports/categories', payload);
            return response.data;
        } catch (error) {
            console.error("建立檢舉類別失敗", error);
            return Promise.reject(error);
        }
    }

    async getReportHistory({ page = 1, limit = 10 } = {}) {
        try {
            const response = await this.http.get('/api/reports/history', {
                params: { page, limit }
            });
            return response.data;
        } catch (error) {
            console.error("取得被檢舉紀錄失敗", error);
            return Promise.reject(error);
        }
    }

    // ── Search API ────────────────────────────────────────
    async getTrendingKeywords({ days = 7, limit = 10 } = {}) {
        try {
            const response = await this.http.get('/api/commodity/search/trending', {
                params: { days, limit }
            });
            return response.data;
        } catch (error) {
            console.error("取得熱門關鍵字失敗", error);
            return Promise.reject(error);
        }
    }

}