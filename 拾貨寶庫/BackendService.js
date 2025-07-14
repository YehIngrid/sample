class BackendService {
    constructor() {
        this.baseUrl = 'https://store-backend-iota.vercel.app/api/';
    }
    signup(userData, fnSuccess, fnError) {
        return axios.post(`${this.baseUrl}/api/account/signup`, userData)
            .then(function(response) {
                fnSuccess();
            })
            .catch(function(error) {
                if (error.response?.data?.message == "Email already exists") {
                    fnError("此帳號已被註冊");
                } else {
                    fnError("系統發生錯誤，請稍後再試");
                }
            });
    }
    // login(userData, fnSuccess, fnError) {
    //     return axios.post(`${this.baseUrl}account/login`, userData)
    //         .then(function(response) {
    //             fnSuccess(response.data);
    //         })
    //         .catch(function(error) {
    //             fnError("登入失敗")
    //             if (error.response?.data?.message == "Invalid credentials") {
    //                 fnError("帳號或密碼錯誤");
    //             } else {
    //                 fnError("系統發生錯誤，請稍後再試");
    //             }
    //         });
    // }
}