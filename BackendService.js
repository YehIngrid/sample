axios.defaults.withCredentials = true;

class BackendService {
    constructor() {
        this.baseUrl = 'https://thpr.hlc23.dev';
        this.http = axios.create({ baseURL: this.baseUrl });

        this.http.interceptors.response.use(
            res => res,
            err => {
                if (err?.response?.status === 413) {
                Swal.fire({
                    icon: 'warning',
                    title: '檔案太大',
                    text: '單張或總上傳大小超過限制，請壓縮或減少張數再試。'
                });
                }
                return Promise.reject(err);
            }
        );
    }
    test() {
        console.log('OK');
        // ? 是不是該做連線測試?
    }
    getCookie(name) {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        if (match) return match[2];
        return null;
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

    getUserData() {
        // 從 localStorage 取出
        const savedUid = localStorage.getItem('uid');
        const savedUsername = localStorage.getItem('username');
        const savedIntro = localStorage.getItem('intro');
        const savedRate = localStorage.getItem('rate');
        if(savedRate) {
            console.log('以儲存信譽積分', savedRate);
        } else {
            console.log('找不到信譽積分!');
        }
        if (savedUsername) {
            console.log('已儲存的使用者名稱:', savedUsername);
        }
        if (savedIntro) {
            console.log('已儲存的使用者介紹:', savedIntro);
        } else {
            console.log('尚未設定使用者介紹');
        }
        if (savedUid) {
        console.log('已儲存的 UID:', savedUid);
        // 這裡可以用來呼叫 API 或顯示用戶資訊
        } else {
        console.log('尚未儲存 UID');
        }
        return axios.get(`${this.baseUrl}/api/account/${savedUid}`, {
                withCredentials: true
            })
            .then(function(response) {
                localStorage.setItem('username', response.data.data.name); 
                localStorage.setItem('intro', response.data.data.introduction);
                localStorage.setItem('avatar', response.data.data.photoURL);
                localStorage.setItem('rate', response.data.data.rate);
                localStorage.setItem('userCreatedAt', response.data.data.createdAt);
            })
            .catch(function(error) {
                console.error("無法取得使用者資料", error);
                throw error;
            });
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
            console.error("無法取得使用者資訊", error);
            const status = error?.response?.status;
            const msg    = error?.response?.data?.message;
            
            if (status === 401 || /invalid/i.test(msg)) {
                if (localStorage.getItem('uid') != null) {
                    throw new Error('伺服器連線逾時，系統將自動幫您登出');
                }
                throw new Error('您尚未登入，無法進行買賣相關操作');
            }
            // 其他錯誤才走這裡
            throw new Error(msg || '伺服器發生錯誤，請稍後再試');
        }
    }

    create(sellData) {
        const token = this.getCookie('idtoken');
        return this.http.post(
            '/api/commodity/create',
            sellData,
            {
            withCredentials: true,
            headers: {
                idtoken: token
                // 不要手動設 'Content-Type'，讓 axios 依 FormData 自動帶 boundary
            }
            }
        )
        .then((res) => res.data)
        .catch((err) => {
            console.error(err);
            // 從後端取更精確的錯誤訊息
            const msg = err?.response?.data?.message || '上架商品失敗';
            throw new Error(msg);
        });
    }

    async getAllCommodities(pagingInfo) {
        try {
            const response = await axios.get(`${this.baseUrl}/api/commodity/list/all`, {
                params: {
                    page: pagingInfo.page,
                    limit: pagingInfo.limit
                }
            });
            return response.data;
        } catch (error) {
            console.error("無法取得分類資料", error);
            throw error;
        }
    }

    getHotItems(pagingInfo, fnSuccess, fnError) {
        return axios.get(`${this.baseUrl}/api/commodity/list/hot`, {
            params: {
                page: pagingInfo.page,
                limit: pagingInfo.limit
            }
        })
        .then(function(response) {
            fnSuccess(response.data);
        })
        .catch(function(error) {
            console.error(error);
            fnError("發生錯誤");
        })
    }
    getNewItems(pagingInfo, fnSuccess, fnError) {
        return axios.get(`${this.baseUrl}/api/commodity/list/new`, {
            params: {
                page: pagingInfo.page, 
                limit: pagingInfo.limit
            }
        })
        .then(function(response) {
            fnSuccess(response.data);
        })
        .catch(function(error) {
            console.error(error);
            fnError("發生錯誤");
        })
    }
    getItemsInfo(id, fnSuccess, fnError) {
        return axios.get(`${this.baseUrl}/api/commodity/item/${id}`)
        .then(function(response) {
            fnSuccess(response.data);
        })
        .catch(function(error) {
            console.error(error);
            fnError("讀取商品資訊失敗");
        }) 
    }
    getMyItems(fnSuccess, fnError) {
        return axios.get(`${this.baseUrl}/api/commodity/my`, { headers: { "Cache-Control": "no-cache" } })
        .then(function(response) {
            fnSuccess(response.data);
        })
        .catch(function(error) {
            console.error(error);
            fnError("讀取商品資訊失敗");
        }) 
    }
    deleteMyItems(id, fnSuccess, fnError) {
        return axios.delete(`${this.baseUrl}/api/commodity/delete/${id}`)
        .then(function(response) {
            fnSuccess(response.data);
        })
        .catch(function(error) {
            console.error(error);
            fnError("無法刪除商品");
        })
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
        if (!Number.isInteger(quantity) || quantity < 1) {
            return Promise.reject(new Error("Quantity 必須是正整數"));
        }

        try {
            const response = await axios.post(
                `${this.baseUrl}/api/cart/add/${commodityId}`,
                { quantity }, // <-- 必填 body
                { headers: { "Content-Type": "application/json" }, withCredentials: true }
            );
            console.log('quantity:', quantity);
            return response;
        } catch (error) {
            console.error("發生錯誤", error);
            return Promise.reject(error);
        }
    }

    async getMyCart() {
        try {
            const response = await axios.get(`${this.baseUrl}/api/cart`, { withCredentials: true });
            console.log("購物車內容：", response.data);
            return response;
        } catch (error) {
            console.error("發生錯誤", error);
            return Promise.reject(error);
        }
    }
    async removeItemsFromCart(commodityId) {
        try {
            const response = await axios.post(`${this.baseUrl}/api/cart/remove/${commodityId}`);
            return response;
        } catch (error) {
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
            console.log('Updated quantity to:', quantity);
            return response;
        } catch (error) {
            console.error("發生錯誤", error);
            return Promise.reject(error);
        }
    }
    async clearMyCart() {
        try {
            const response = await axios.delete(`${this.baseUrl}/api/cart/clear`);
            return response;
        } catch (error) {
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
            console.error("發生錯誤", error);
            return Promise.reject(error);
        }
    }
    async createOrder(cartItemsId) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/api/order/create`,
                // 將參數名稱從 { cartItemsId } 改為 { "cartItem_ids": cartItemsId }
                { "cartItem_ids": cartItemsId } 
            );
            return response;
        } catch (error) {
            console.error("發生錯誤", error);
            return Promise.reject(error);
        }
    }
    async getBuyerOrders() {
        try {
            const response = await axios.get(`${this.baseUrl}/api/order/buyer`, { headers: { "Cache-Control": "no-cache" } });
            return response;
        } catch (error) {
            console.error("發生錯誤", error);
            return Promise.reject(error);
        }
    }
    async getSellerOrders() {
        try {
            const response = await axios.get(`${this.baseUrl}/api/order/seller`, { headers: { "Cache-Control": "no-cache" } });
            return response;
        } catch (error) {
            console.error("發生錯誤", error);
            return Promise.reject(error);
        }
    }
    async getOrderDetails(id) {
        try {
            const response = await axios.get(`${this.baseUrl}/api/order/${id}`);
            return response;
        } catch (error) {
            console.error("發生錯誤", error);
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
            const response = await axios.post(`${this.baseUrl}/api/order/cancel/${id}`);
            return response;
        } catch (error) {
            console.error("發生錯誤", error);
            return Promise.reject(error);
        }
    }
    
}