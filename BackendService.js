axios.defaults.withCredentials = true;

class BackendService {
    constructor() {
        this.baseUrl = 'https://thpr.hlc23.dev';
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
    getUserItems(fnSuccess, fnError) {
        return axios.get()
    }
    getUserData(fnSuccess, fnError) {
        // 從 localStorage 取出
        const savedUid = localStorage.getItem('uid');
        const savedUsername = localStorage.getItem('username');
        const savedIntro = localStorage.getItem('intro');
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
                fnSuccess(response.data);
            })
            .catch(function(error) {
                fnError("無法取得使用者資料");
            });
    }
    updateProfile(userData, fnSuccess, fnError) {
        let _this = this;
        return axios.patch(`${this.baseUrl}/api/account/update`, userData, {
                withCredentials: true
            })
            .then(function(response) {
                fnSuccess(response);
                // 更新成功後，儲存新的使用者資料到 localStorage
                _this.getUserData(fnSuccess, fnError);
            })
            .catch(function(error) {
                console.error("更新錯誤：", error);
                if (error.response?.data?.message == "User not found") {
                    fnError("使用者不存在");
                } else {
                    fnError("更新失敗，請稍後再試");
                }
            });
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
    // logout(userData, fnSuccess, fnError) {
    //     return axios
    // }
}