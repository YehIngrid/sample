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
                let userId = response.data.uid;
                localStorage.setItem('userId', userId); // 儲存使用者ID
                fnSuccess(response.data);
            })
            .catch(function(error) {
                fnError("登入失敗");
            });
    }
    getUserData(userId, fnSuccess, fnError) {
        return axios.get(`${this.baseUrl}/api/account/${userId}`)
            .then(function(response) {
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