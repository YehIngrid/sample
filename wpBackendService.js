axios.defaults.withCredentials = true;

class wpBackendService {
    constructor() {
        this.baseUrl = 'https://thpr.hlc23.dev/api/wishpool';
        this.http = axios.create({ baseURL: this.baseUrl });
    }
    async createWish(itemName, description, priority, maxPrice, photo) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/create`,
                { itemName, description, priority, maxPrice, photo }
            );
            return response.data;
        } catch (error) {
            console.error('Error posting wish:', error);
            return Promise.reject(error);
        }
    }
    // List wishes with pagination and priority filter
    async listWishes(page) {
        try {
            const response = await axios.get(
                `${this.baseUrl}`, 
                {params: {page: page, limit: 12}}
            );
            return response.data;
        } catch (error) {
            console.error('Error listing wishes:', error);
            return Promise.reject(error);
        }
    }
    // Get wish details by ID
    async getWishInfo(id) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/${id}`
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching wish:', error);
            return Promise.reject(error);
        }
    }
    async deleteWish(id) {
        try {
            const response = await axios.delete(
                `${this.baseUrl}/${id}`
            );
            return response.data;
        } catch (error) {
            console.error('Error deleting wish:', error);
            return Promise.reject(error);
        }
    }
    async myWishes(page, status) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/my`,
                {params: {page: page, limit: 12, status: status}}
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching my wishes:', error);
            return Promise.reject(error);
        }
    }
    async contactWisher(id) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/${id}/contact`
            );
            return response.data;
        } catch (error) {
            console.error('Error contacting wisher:', error);
            return Promise.reject(error);
        }
    }
}