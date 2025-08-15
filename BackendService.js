class BackendService {
    constructor() {
        this.baseUrl = 'http://23.146.248.58:3000';
    }
    test() {
        console.log('OK');
        // ? 是不是該做連線測試?
    }
    //在localstorage記住目前是否登入帳號後端，用localstorage記住帳號資訊等
    signup(userData, fnSuccess, fnError) {
        return axios.post(`${this.baseUrl}/api/account/signup`, userData)
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
        return axios.post(`${this.baseUrl}/api/account/login`, userData)
            .then(function(response) {
                let uid = response.data.data.uid;
                localStorage.setItem('uid', uid); // 儲存使用者ID
                fnSuccess(response.data);
            })
            .catch(function(error) {
                fnError("登入失敗");
            });
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
        return axios.get(`${this.baseUrl}/api/account/${savedUid}`)
            .then(function(response) {
                localStorage.setItem('username', response.data.data.name); 
                localStorage.setItem('intro', response.data.data.introduction);
                fnSuccess(response.data);
            })
            .catch(function(error) {
                fnError("無法取得使用者資料");
            });
    }
    whoami(fnSuccess, fnError) {
        return axios.get(`${this.baseUrl}/api/account/whoami`)
            .then(function(response) {
                fnSuccess(response.data);
            })
            .catch(function(error) {
                fnError("無法取得使用者資訊");
            });
    }
    // logout(userData, fnSuccess, fnError) {
    //     return axios
    // }
}