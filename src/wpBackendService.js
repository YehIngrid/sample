// ── 重試工具（同 BackendService）────────────────────────────────
async function withRetry(fn, maxRetries = 3, baseDelay = 800) {
    let lastErr;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastErr = err;
            const status = err?.response?.status;
            if (status && status < 500) throw err;
            if (attempt < maxRetries) {
                await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, attempt)));
            }
        }
    }
    throw lastErr;
}

export default class wpBackendService {
    constructor() {
        this.baseUrl = 'https://thpr.hlc23.dev/api/wishpool';
        this.http = axios.create({ baseURL: this.baseUrl });
    }
    async createWish(itemName, description, priority, maxPrice, photo) {
        try {
            const formData = new FormData();
            formData.append('itemName', itemName);
            formData.append('description', description);
            formData.append('priority', String(priority));
            formData.append('maxPrice', maxPrice);
            formData.append('photo', photo);
            const response = await axios.post(
                `${this.baseUrl}/create`,
                formData
            );
            return response.data;
        } catch (error) {
            if (error?.response?.status === 403) throw new Error('超過一周上傳上限');
            console.error('Error posting wish:', error);
            return Promise.reject(error);
        }
    }
    // List wishes with pagination and filter
    async listWishes(page, urgency, budget) {
        try {
            const params = { page, limit: 12 };
            if (urgency?.length) params.urgency = urgency.length === 1 ? urgency[0] : urgency;
            if (budget?.length)  params.budget  = budget.length  === 1 ? budget[0]  : budget;
            const response = await withRetry(() => axios.get(
                `${this.baseUrl}`,
                { params }
            ));
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
            const params = { page, limit: 12 };
            if (status) params.status = status; // integer: 1=活躍, 2=已過期, 3=已刪除
            const response = await axios.get(
                `${this.baseUrl}/my`,
                { params }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching my wishes:', error);
            return Promise.reject(error);
        }
    }
    async contactWisher(id, productId) {
        try {
            const response = await withRetry(() => axios.post(
                `${this.baseUrl}/${id}/contact`,
                productId ? { productId } : {}
            ), 2); // 最多重試 2 次（POST 聯絡操作保守一點）
            return response.data;
        } catch (error) {
            console.error('Error contacting wisher:', error);
            return Promise.reject(error);
        }
    }
}