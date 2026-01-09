axios.defaults.withCredentials = true;

class wpBackendService {
    constructor() {
        this.baseUrl = 'https://thpr.hlc23.dev';
        this.http = axios.create({ baseURL: this.baseUrl });
    }
    async postwish(wishId) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/api/wish/post-wish`,
                { wishId: wishId }
            );
            return response.data;
        } catch (error) {
            console.error('Error posting wish:', error);
            return Promise.reject(error);
        }
    }
    async listwishes() {
        try {
            const response = await axios.get(
                `${this.baseUrl}/api/wish/list-wishes`
            );
            return response.data;
        } catch (error) {
            console.error('Error listing wishes:', error);
            return Promise.reject(error);
        }
    }
    async getwish(wishId) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/api/wish/get-wish`, {params: { wishId: wishId }}
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching wish:', error);
            return Promise.reject(error);
        }
    }
}