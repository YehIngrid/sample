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
    async createRoom(targetUserId) {
        console.log("發送請求前的最後確認:", { targetUserId });
        try {
            const response = await axios.post(
                `${this.baseUrl}/api/chat/create-room`,
                { targetUserId: String(targetUserId) }
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
                `${this.baseUrl}/api/chat/attachment`,
                { room: String(roomId), image: image }
            );
            return response.data;
        } catch (error) {
            console.error('Error sending attachment:', error);
            return Promise.reject(error);
        }
    }
    async markAsRead(roomId, readAt) {
        try {
            const response = await axios.patch(
                `${this.baseUrl}/api/chat/rooms/${roomId}/read`,
                { readAt: readAt }
            );
            return response.data;
        } catch (error) {
            console.error('Error marking messages as read:', error);
            return Promise.reject(error);
        }
    }
    async getBroadcast(channelId, limit, before) {
        try {
            const response = await axios.get(`${this.baseUrl}/api/chat/official-channels/broadcast-history`, 
                {params: {channelId: String(channelId), limit, before}}
            );
            return response.data;
        } catch (error) {
            console.error('Error getting broadcast history,', error);
            return Promise.reject(error);
        }
    }
    async createOfficialChannel(name, description) {
        try {
            const response = await axios.post(`${this.baseUrl}/api/chat/official-channels/create`,
                { name, description }
            );
            return response.data;
        } catch(error) {
            console.error('Error create official channel,' ,error);
            return Promise.reject(error);
        }
    }
    async broadCastOfficial(channelId, message, attachments) {
        try {
            const response = await axios.post(`${this.baseUrl}/api/chat/official-channels/broadcast`, 
                {channelId, message, attachments: String(attachments)}
            );
            return response.data;
        } catch(error) {
            console.error('Error create official channel,' ,error);
            return Promise.reject(error);
        }
    }
    openSse() {
        const url = `${this.baseUrl}/api/chat/stream`;
        const eventSource = new EventSource(url, { withCredentials: true });

        eventSource.addEventListener('newMessage', (event) => {
            console.log('新訊息:', JSON.parse(event.data));
        });
        eventSource.addEventListener('typing', (event) => {
            console.log('使用者正在輸入:', event.data);
        });
        eventSource.addEventListener('ready', (event) => {
            console.log('連線就緒:', event.data);
        });
        eventSource.addEventListener('read', (event) => {
            console.log('訊息已讀:', event.data);
        });
        eventSource.addEventListener('ping', (event) => {
            console.log('ping:', event.data);
        });
        eventSource.onerror = (error) => {
            console.error('連接錯誤:', error);
            eventSource.close();
        };

        return eventSource;
    }
}