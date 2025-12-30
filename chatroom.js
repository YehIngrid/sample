class ChatRoom {
    constructor() {
        this.currentRoom = 'general';
        this.eventSource = null;
        this.username = 'User_' + Math.floor(Math.random() * 1000);
        this.isConnected = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.connectSSE();
        this.scrollToBottom();
    }

    // SSE 連接
    connectSSE() {
        const sseUrl = '/sse/chat'; // 請替換為您的 SSE 端點
        
        this.eventSource = new EventSource(sseUrl);
        
        this.eventSource.onopen = () => {
            console.log('SSE 連接成功');
            this.isConnected = true;
            this.updateConnectionStatus(true);
        };

        this.eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            } catch (error) {
                console.error('解析訊息錯誤:', error);
            }
        };

        this.eventSource.onerror = (error) => {
            console.error('SSE 連接錯誤:', error);
            this.isConnected = false;
            this.updateConnectionStatus(false);
            
            // 5秒後重新連接
            setTimeout(() => {
                console.log('嘗試重新連接...');
                this.connectSSE();
            }, 5000);
        };

        // 監聽特定事件類型
        this.eventSource.addEventListener('newMessage', (event) => {
            const data = JSON.parse(event.data);
            this.addMessage(data);
        });

        this.eventSource.addEventListener('userJoined', (event) => {
            const data = JSON.parse(event.data);
            this.showSystemMessage(`${data.username} 加入了聊天室`);
        });

        this.eventSource.addEventListener('userLeft', (event) => {
            const data = JSON.parse(event.data);
            this.showSystemMessage(`${data.username} 離開了聊天室`);
        });

        this.eventSource.addEventListener('typing', (event) => {
            const data = JSON.parse(event.data);
            this.showTypingIndicator(data.username);
        });
    }

    // 處理接收到的訊息
    handleMessage(data) {
        switch(data.type) {
            case 'message':
                this.addMessage(data);
                break;
            case 'userList':
                this.updateOnlineUsers(data.users);
                break;
            case 'typing':
                this.showTypingIndicator(data.username);
                break;
            default:
                console.log('未知訊息類型:', data);
        }
    }

    // 設置事件監聽器
    setupEventListeners() {
        // 發送訊息
        const form = document.getElementById('messageForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });

        // Enter 發送訊息
        const input = document.getElementById('messageInput');
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // 輸入時顯示正在輸入
        let typingTimer;
        input.addEventListener('input', () => {
            clearTimeout(typingTimer);
            this.sendTypingStatus(true);
            
            typingTimer = setTimeout(() => {
                this.sendTypingStatus(false);
            }, 1000);
        });

        // 切換聊天室
        document.querySelectorAll('.chat-item').forEach(item => {
            item.addEventListener('click', () => {
                this.switchRoom(item.dataset.room);
            });
        });

        // 搜尋聊天室
        document.getElementById('searchChat').addEventListener('input', (e) => {
            this.filterChatList(e.target.value);
        });
    }

    // 發送訊息
    async sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (!message) return;

        const messageData = {
            room: this.currentRoom,
            username: this.username,
            message: message,
            timestamp: new Date().toISOString()
        };

        try {
            // 發送到伺服器
            const response = await fetch('/api/send-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(messageData)
            });

            if (response.ok) {
                input.value = '';
                // 訊息會透過 SSE 接收並顯示
            } else {
                console.error('發送訊息失敗');
                alert('發送訊息失敗,請稍後再試');
            }
        } catch (error) {
            console.error('發送訊息錯誤:', error);
            
            // 即使沒有伺服器,也在本地顯示訊息(用於測試)
            this.addMessage({
                ...messageData,
                isSelf: true
            });
            input.value = '';
        }
    }

    // 添加訊息到聊天室
    addMessage(data) {
        const container = document.getElementById('messagesContainer');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${data.isSelf || data.username === this.username ? 'message-self' : 'message-other'}`;

        const time = new Date(data.timestamp).toLocaleTimeString('zh-TW', {
            hour: '2-digit',
            minute: '2-digit'
        });

        messageDiv.innerHTML = `
            ${!data.isSelf && data.username !== this.username ? `
                <div class="message-avatar">
                    <i class="bi bi-person-circle"></i>
                </div>
            ` : ''}
            <div class="message-content">
                <div class="message-header ${data.isSelf || data.username === this.username ? 'text-end' : ''}">
                    ${data.isSelf || data.username === this.username ? `
                        <small class="text-muted me-2">${time}</small>
                        <strong>我</strong>
                    ` : `
                        <strong>${data.username}</strong>
                        <small class="text-muted ms-2">${time}</small>
                    `}
                </div>
                <div class="message-text">
                    ${this.escapeHtml(data.message)}
                </div>
            </div>
        `;

        container.appendChild(messageDiv);
        this.scrollToBottom();
        
        // 播放通知音(可選)
        this.playNotificationSound();
    }

    // 顯示系統訊息
    showSystemMessage(text) {
        const container = document.getElementById('messagesContainer');
        const systemMsg = document.createElement('div');
        systemMsg.className = 'text-center my-2';
        systemMsg.innerHTML = `<small class="text-muted">${text}</small>`;
        container.appendChild(systemMsg);
        this.scrollToBottom();
    }

    // 顯示正在輸入指示器
    showTypingIndicator(username) {
        const indicator = document.getElementById('typingIndicator');
        indicator.style.display = 'block';
        indicator.innerHTML = `<small class="text-muted"><i class="bi bi-three-dots"></i> ${username} 正在輸入...</small>`;

        setTimeout(() => {
            indicator.style.display = 'none';
        }, 3000);
    }

    // 發送正在輸入狀態
    async sendTypingStatus(isTyping) {
        try {
            await fetch('/api/typing', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    room: this.currentRoom,
                    username: this.username,
                    isTyping: isTyping
                })
            });
        } catch (error) {
            console.error('發送輸入狀態錯誤:', error);
        }
    }

    // 切換聊天室
    switchRoom(roomId) {
        this.currentRoom = roomId;
        
        // 更新 UI
        document.querySelectorAll('.chat-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-room="${roomId}"]`).classList.add('active');

        // 清空訊息
        document.getElementById('messagesContainer').innerHTML = `
            <div class="text-center my-4">
                <small class="text-muted">歡迎來到 ${roomId} 聊天室!</small>
            </div>
        `;

        // 重新連接 SSE (如果需要針對不同房間)
        // this.connectSSE();
    }

    // 更新在線用戶列表
    updateOnlineUsers(users) {
        const usersList = document.getElementById('onlineUsersList');
        usersList.innerHTML = users.map(user => `
            <div class="d-flex align-items-center mb-2">
                <span class="online-dot"></span>
                <small>${user}</small>
            </div>
        `).join('');
    }

    // 更新連接狀態
    updateConnectionStatus(isConnected) {
        const statusBtn = document.getElementById('connectionStatus');
        if (isConnected) {
            statusBtn.innerHTML = '<i class="bi bi-circle-fill text-success"></i> 已連接';
            statusBtn.classList.remove('btn-outline-danger');
            statusBtn.classList.add('btn-outline-secondary');
        } else {
            statusBtn.innerHTML = '<i class="bi bi-circle-fill text-danger"></i> 已斷線';
            statusBtn.classList.remove('btn-outline-secondary');
            statusBtn.classList.add('btn-outline-danger');
        }
    }

    // 過濾聊天室列表
    filterChatList(searchTerm) {
        const items = document.querySelectorAll('.chat-item');
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (text.includes(searchTerm.toLowerCase())) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    // 滾動到底部
    scrollToBottom() {
        const container = document.getElementById('messagesContainer');
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 100);
    }

    // HTML 轉義
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 播放通知音
    playNotificationSound() {
        // 可以添加音效檔案
        // const audio = new Audio('/sounds/notification.mp3');
        // audio.play().catch(e => console.log('無法播放音效'));
    }

    // 清理連接
    disconnect() {
        if (this.eventSource) {
            this.eventSource.close();
            console.log('SSE 連接已關閉');
        }
    }
}

// 初始化聊天室
let chatRoom;
document.addEventListener('DOMContentLoaded', () => {
    chatRoom = new ChatRoom();
});

// 頁面關閉時清理連接
window.addEventListener('beforeunload', () => {
    if (chatRoom) {
        chatRoom.disconnect();
    }
});
