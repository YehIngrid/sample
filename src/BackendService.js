axios.defaults.withCredentials = true;

// ── 全域 401 攔截：session 過期時統一導回登入頁 ────────────
let _handlingExpiry = false;
const _SKIP_401 = ['/api/account/login', '/api/account/signup', '/api/whoami'];

function _attach401Handler(instance) {
    instance.interceptors.response.use(
        res => res,
        err => {
            const url = err?.config?.url || '';
            const skip = _SKIP_401.some(p => url.includes(p));
            if (err?.response?.status === 401 && !skip && !_handlingExpiry) {
                _handlingExpiry = true;
                window.isLoggedIn = false;
                const currentUrl = window.location.pathname + window.location.search;
                Swal.fire({
                    icon: 'warning',
                    title: '登入已過期',
                    text: '請重新登入',
                    showConfirmButton: false,
                    timer: 2000
                }).then(() => {
                    _handlingExpiry = false;
                    location.href = `../account/account.html?redirect=${encodeURIComponent(currentUrl)}`;
                });
            }
            return Promise.reject(err);
        }
    );
}
_attach401Handler(axios); // 覆蓋絕大多數 API 呼叫

export default class BackendService {
    constructor() {
        this.baseUrl = 'https://thpr.hlc23.dev';
        this.http = axios.create({ baseURL: this.baseUrl, withCredentials: true });
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

            const uid = response?.data?.data?.uid;
            if (uid) localStorage.setItem('uid', uid);

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
            localStorage.removeItem('userCreatedAt');
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
            localStorage.setItem('username', response.data.data.name); 
            localStorage.setItem('intro', response.data.data.introduction);
            localStorage.setItem('avatar', response.data.data.photoURL);
            localStorage.setItem('rate', response.data.data.rate);
            localStorage.setItem('userCreatedAt', response.data.data.createdAt);
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
            return response.data;   // 通常直接回傳 data
        } catch (error) {
            this._forbidden(error);
            console.error("無法取得使用者資訊", error);
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
            // 從後端取更精確的錯誤訊息
            const msg = err?.response?.data?.message || '上架商品失敗';
            return Promise.reject(new Error(msg));
        }
    }

    // 統一商品列表 API：GET /api/commodity/list/{listName}
    // listName: all | hot | book | life | special | reuse | storage | other
    // sort: default | new | price-low | price-high
    async getCommodityList(listName = 'all', { page, limit, sort, maxPrice } = {}) {
        try {
            const params = {};
            if (page) params.page = page;
            if (limit) params.limit = limit;
            if (sort && sort !== 'default') params.sort = sort;
            if (maxPrice) params.maxPrice = maxPrice;
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
            const response = await axios.post(
                `${this.baseUrl}/api/cart/add/${commodityId}`,
                { quantity }, // <-- 必填 body
                { headers: { "Content-Type": "application/json" }, withCredentials: true }
            );
            return response;
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

    async getBuyerOrders(page = 1) {
        try {
            const response = await axios.get(`${this.baseUrl}/api/order/buyer`, { params: { page }, headers: { "Cache-Control": "no-cache" } });
            return response;
        } catch (error) {
            this._forbidden(error);
            console.error("發生錯誤", error);
            return Promise.reject(error);
        }
    }
    async getSellerOrders(page = 1) {
        try {
            const response = await axios.get(`${this.baseUrl}/api/order/seller`, { params: { page }, headers: { "Cache-Control": "no-cache" } });
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
    async getOrderReview(orderId) {
        try {
            const response = await axios.get(`${this.baseUrl}/api/reviews/order/${orderId}`);
            return response;
        } catch (error) {
            console.error("讀取評論失敗", error);
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
    async cancelMyOrder(id) {
        try {
            const response = await axios.post(`${this.baseUrl}/api/order/${id}/cancel`);
            return response;
        } catch (error) {
            console.error("發生錯誤", error);
            return Promise.reject(error);
        }
    }
    
}