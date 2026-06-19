export default class ChatBackendService {
    constructor() {
        this.baseUrl = import.meta.env.VITE_API_BASE_URL;
        this.http = axios.create({ baseURL: this.baseUrl });
    }
    _forbidden(error) {
        if (error?.response?.status === 403) throw new Error('存取被禁止 - 帳號已停用或電子郵件未驗證');
    }
    async sendMessage(roomId, message, attachments = []) {
        try {
            const formData = new FormData();
            formData.append('room', String(roomId));
            if (message) formData.append('message', message);
            attachments.forEach(att => formData.append('attachments', att));
            const response = await axios.post(
                `${this.baseUrl}/api/chat/send-message`,
                formData
            );
            return response.data;
        } catch (error) {
            this._forbidden(error);
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
            this._forbidden(error);
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
            this._forbidden(error);
            console.error('Error fetching chat history:', error);
            return Promise.reject(error);
        }
    }
    async createRoom(targetUserId) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/api/chat/create-room`,
                { targetUserId: String(targetUserId) }
            );
            return response.data;
        } catch (error) {
            this._forbidden(error);
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
            this._forbidden(error);
            console.error('Error listing rooms:', error);
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
            this._forbidden(error);
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
    async broadCastOfficial(channelId, message, attachments = []) {
        try {
            const formData = new FormData();
            formData.append('channelId', String(channelId));
            if (message) formData.append('message', message);
            attachments.forEach(att => formData.append('attachments', att));
            const response = await axios.post(
                `${this.baseUrl}/api/chat/official-channels/broadcast`,
                formData
            );
            return response.data;
        } catch(error) {
            console.error('Error broadcasting to official channel:', error);
            return Promise.reject(error);
        }
    }
    async requestSupport(roomId, orderId, reason) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/api/chat/rooms/${roomId}/request-support`,
                { orderId, reason },
                { withCredentials: true }
            );
            return response.data;
        } catch (error) {
            this._forbidden(error);
            console.error('Error requesting support:', error);
            return Promise.reject(error);
        }
    }
    async leaveSupport(roomId) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/api/chat/rooms/${roomId}/leave-support`,
                {},
                { withCredentials: true }
            );
            return response.data;
        } catch (error) {
            this._forbidden(error);
            console.error('Error leaving support room:', error);
            return Promise.reject(error);
        }
    }
    async listOfficialChannels(page, limit) {
        try {
            const response = await axios.get(`${this.baseUrl}/api/chat/official-channels`, {params: {page: page, limit: limit}});
            return response.data;
        } catch(error) {
            console.error('Error listing official channels,' ,error);
            return Promise.reject(error);
        }
    }
    async getRoomOrders(roomId) {
        try {
            const response = await axios.get(`${this.baseUrl}/api/chat/rooms/${roomId}/orders`);
            return response.data;
        } catch (error) {
            console.error('Error getting room orders:', error);
            return Promise.reject(error);
        }
    }
    // ── Ticket API ──
    async createTicket(data) {
        try {
            const response = await axios.post(`${this.baseUrl}/api/ticket/create`, data, { withCredentials: true });
            return response.data;
        } catch (error) {
            this._forbidden(error);
            console.error('Error creating ticket:', error);
            return Promise.reject(error);
        }
    }
    async claimTicket(ticketId) {
        try {
            const response = await axios.post(`${this.baseUrl}/api/ticket/claim/${ticketId}`, {}, { withCredentials: true });
            return response.data;
        } catch (error) {
            this._forbidden(error);
            console.error('Error claiming ticket:', error);
            return Promise.reject(error);
        }
    }
    async resolveTicket(ticketId) {
        try {
            const response = await axios.post(`${this.baseUrl}/api/ticket/resolve/${ticketId}`, {}, { withCredentials: true });
            return response.data;
        } catch (error) {
            this._forbidden(error);
            console.error('Error resolving ticket:', error);
            return Promise.reject(error);
        }
    }
    async adjudicateTicket(ticketId, data) {
        try {
            const response = await axios.post(`${this.baseUrl}/api/ticket/adjudicate/${ticketId}`, data, { withCredentials: true });
            return response.data;
        } catch (error) {
            this._forbidden(error);
            console.error('Error adjudicating ticket:', error);
            return Promise.reject(error);
        }
    }
    async getMyTickets() {
        try {
            const response = await axios.get(`${this.baseUrl}/api/ticket/mine`, { withCredentials: true });
            return response.data;
        } catch (error) {
            this._forbidden(error);
            console.error('Error getting my tickets:', error);
            return Promise.reject(error);
        }
    }
    async getTicketsByRoom(roomId) {
        try {
            const response = await axios.get(`${this.baseUrl}/api/ticket/rooms/${roomId}`, { withCredentials: true });
            return response.data;
        } catch (error) {
            this._forbidden(error);
            console.error('Error getting tickets by room:', error);
            return Promise.reject(error);
        }
    }
    async getTicketHistory(ticketId) {
        try {
            const response = await axios.get(`${this.baseUrl}/api/ticket/history/${ticketId}`, { withCredentials: true });
            return response.data;
        } catch (error) {
            this._forbidden(error);
            console.error('Error getting ticket history:', error);
            return Promise.reject(error);
        }
    }
    async getTicketOrder(ticketId) {
        try {
            const response = await axios.get(`${this.baseUrl}/api/ticket/order/${ticketId}`, { withCredentials: true });
            return response.data;
        } catch (error) {
            this._forbidden(error);
            console.error('Error getting ticket order:', error);
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
        eventSource.addEventListener('newBroadcast', (event) => {
            console.log('新公告:', JSON.parse(event.data));
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
