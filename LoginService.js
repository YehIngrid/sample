class LoginService {
    constructor(backendService) {
        this.backendService = backendService;
    }


    isLogin() {
        const userId = localStorage.getItem('userId');
        return userId !== null;
    }
    getCurrentUid() {
        
    }
    getCurrentUser() {
        const userId = localStorage.getItem('userId');
        if (userId) {
            return this.backendService.getUserData(userId, 
                (data) => {
                    return data;
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