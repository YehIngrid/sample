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
                { roomId: roomId, message: message }
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
                { roomId: roomId, isTyping: true }
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
    async openSse(roomId) {
        const eventSource = new EventSource(`/api/chat/stream?roomId=${roomId}`, {
            withCredentials: true
        }, {params: { roomId: roomId }});

        eventSource.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        console.log('新訊息:', data);
        });

        eventSource.addEventListener('typing', (event) => {
        console.log('使用者正在輸入:', event.data);
        });

        eventSource.onerror = (error) => {
        console.error('連接錯誤:', error);
        eventSource.close();
        };

        return eventSource;
    }
}