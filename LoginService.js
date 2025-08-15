class LoginService {
    constructor(backendService) {
        this.backendService = backendService;
    }


    isLogin() {
        return localStorage.getItem('uid') !== null;
    }
    getCurrentUid() {
        
    }
    getCurrentUser(uid) {
        uid = localStorage.getItem('uid');
        if (uid) {
            return this.backendService.getUserData(
                (data) => {
                    return data.data;
                }, 
                (errorMessage) => {
                    console.error("無法取得使用者資料：", errorMessage);
                    return null;
                }
            );
        }
        return null;
    }

    login(email, password) {
       
    }

    logout() {

    }
}