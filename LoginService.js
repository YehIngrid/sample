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
        return null; // TODO:
    }

    login(email, password) {
       
    }

    logout() {

    }
}