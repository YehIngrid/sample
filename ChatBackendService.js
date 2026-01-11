axios.defaults.withCredentials = true;
class ChatBackendService {
    constructor() {
        this.baseUrl = 'https://thpr.hlc23.dev';
        this.http = axios.create({ baseURL: this.baseUrl });
    }
    async sendMessage(roomId, message) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/api/chat/send-message`,
                { room: String(roomId), message: message }
            );
            return response.data;
        } catch (error) {
            console.error('Error sending message:', error);
            return Promise.reject(error);
        }
    }
    async typing(roomId) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/api/chat/typing`,
                { room: String(roomId), isTyping: true }
            );
            return response.data;
        } catch (error) {
            console.error('Error sending typing status:', error);
            return Promise.reject(error);
        }
    }
    async getHistory(roomId, limit, before) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/api/chat/history`, {params: { room: String(roomId), limit, before: before }}
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching chat history:', error);
            return Promise.reject(error);
        }
    }
    async createRoom(itemId) {
        console.log("發送請求前的最後確認:", { itemId });
        try {
            const response = await axios.post(
                `${this.baseUrl}/api/chat/create-room`,
                { itemId: itemId }
            );
            return response.data;
        } catch (error) {
            console.error('Error creating room:', error);
            return Promise.reject(error);
        }
    }
    async listRooms() {
        try {
            const response = await axios.get(
                `${this.baseUrl}/api/chat/rooms`
            );
            return response.data;
        } catch (error) {
            console.error('Error listing rooms:', error);
            return Promise.reject(error);
        }
    }
    async sendAttach(roomId, image) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/api/chat/send-attach`,
                { room: String(roomId), image: image }
            );
            return response.data;
        } catch (error) {
            console.error('Error sending attachment:', error);
            return Promise.reject(error);
        }
    }
    async openSse(roomId) {
        const eventSource = new EventSource(`${this.baseUrl}/api/chat/stream?room=${roomId}`, {
            withCredentials: true
        }, {params: { room: String(roomId) }});

        eventSource.addEventListener('newMessage', (event) => {
        const data = JSON.parse(event.data);
            console.log('新訊息:', data);
        });

        eventSource.addEventListener('typing', (event) => {
            console.log('使用者正在輸入:', event.data);
        });

        eventSource.addEventListener('ready', (event) => {
            console.log('狀態更新:', event.data);
        });

        eventSource.onerror = (error) => {
            console.error('連接錯誤:', error);
        eventSource.close();
        };

        return eventSource;
    }
}