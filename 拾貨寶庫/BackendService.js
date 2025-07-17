export class BackendService {
    constructor() {
        this.baseUrl = 'http://23.146.248.58:3000';
    }
    test() {
        console.log('OK');
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
    //     return axios.post(`${this.baseUrl}/api/account/login`, userData)
    //         .then(function(response) {
    //             fnSuccess(response.data);
    //         })
    //         .catch(function(error) {
    //             fnError("登入失敗");
    //         });
    // }
    // signout(userData, fnSuccess, fnError) {
    //     return axios
    // }
}