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
    signup(userData, fnSuccess, fnError) {
        return axios.post(`${this.baseUrl}/api/account/signup`, userData, {
                withCredentials: true
            })
            .then(function(response) {
                fnSuccess(response);
            })
            .catch(function(error) {
                console.error("註冊錯誤：", error);
                if (error.response?.data?.message == "Email already exists") {
                    fnError("此帳號已被註冊");
                } else {
                    fnError("系統發生錯誤，請稍後再試");
                }
            });
    }
    login(userData, fnSuccess, fnError) {
        let _this = this;
        return axios.post(`${this.baseUrl}/api/account/login`, userData, {
                withCredentials: true
            })
            .then(function(response) {
                let uid = response.data.data.uid;
                localStorage.setItem('uid', uid); // 儲存使用者ID
                fnSuccess(response.data);
                _this.whoami(fnSuccess, fnError);
            })
            .catch(function(error) {
                console.error(error);
                fnError("登入失敗");
            });
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
    whoami(fnSuccess, fnError) {
        return axios.get(`${this.baseUrl}/api/whoami`, {
                withCredentials: true
            })
            .then(function(response) {
                fnSuccess(response.data);
            })
            .catch(function(error) {
                console.error(error);
                fnError("無法取得使用者資訊");
            });
    }
    create(sellData, fnSuccess, fnError) {
        const token = this.getCookie('idtoken');
        return axios.post(`${this.baseUrl}/api/commodity/create`, sellData, {
            withCredentials: true
        }, {
            headers: {
                'idtoken': token
            }})

        .then(function(response) {
            fnSuccess(response.data);
        })
        .catch(function(error) {
            console.error(error);
            fnError("上架商品失敗");
        })
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
        return axios.get(`${this.baseUrl}/api/commodity/my`)
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
    async addItemsToCart(commodityId) {
        try {
            const response = await axios.post(`${this.baseUrl}/api/cart/add/${commodityId}`);
            return response;
        } catch (error) {
            console.error("發生錯誤", error);
            return Promise.reject(error);
        }
    }
    async getMyCart() {
        try {
            const response = await axios.get(`${this.baseUrl}/api/cart/`);
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
    async clearMyCart() {
        try {
            const response = await axios.post(`${this.baseUrl}/api/cart/clear`);
            return response;
        } catch (error) {
            console.error("發生錯誤", error);
            return Promise.reject(error);
        }
    }
    // logout(userData, fnSuccess, fnError) {
    //     return axios
    // }
}