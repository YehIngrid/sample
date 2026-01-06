

// // function openCloseChatInterface() {
// //     const chatInterface = document.getElementById('talkInterface');
// //     if (chatInterface.style.display === 'none' || chatInterface.style.display === '') {
// //         chatInterface.style.display = 'block';
// //     } else {
// //         chatInterface.style.display = 'none';
// //     }
// // }
// class ChatRoom {
//     constructor() {
//         this.currentRoom = 'general';        
//         this.currentRoomName = '一般討論';        
//         this.eventSource = null;        
//         this.username = 'User_' + Math.floor(Math.random() * 1000);        
//         this.isConnected = false;        
//         this.isMobile = window.innerWidth < 768;     
//         this.lightbox = null; // PhotoSwipe instance           
//         this.init();
//     }

//     init() {
//         this.setupEventListeners();        
//         this.setupMobileView();        
//         this.connectSSE();        
//         this.scrollToBottom();    
//         this.initPhotoSwipe(); // 初始化 PhotoSwipe            
//         // 監聽視窗大小變化        
//         window.addEventListener('resize', () => {            
//             this.handleResize();        
//         });
//     }

//     // 初始化 PhotoSwipe
//     initPhotoSwipe() {
//         // 動態載入 PhotoSwipe CSS 和 JS
//         const cssLink = document.createElement('link');
//         cssLink.rel = 'stylesheet';
//         cssLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/photoswipe/5.4.4/photoswipe.min.css';
//         document.head.appendChild(cssLink);

//         // 載入 PhotoSwipe JavaScript
//         const script = document.createElement('script');
//         script.src = 'https://cdnjs.cloudflare.com/ajax/libs/photoswipe/5.4.4/photoswipe-lightbox.esm.min.js';
//         script.type = 'module';
//         script.onload = () => {
//             console.log('PhotoSwipe 已載入');
//         };
//         document.head.appendChild(script);
//     }

//     // 設置手機視圖    
//     setupMobileView() {        
//         this.isMobile = window.innerWidth < 768; 
//         if (this.isMobile) {            // 手機版：預設顯示側邊欄，隱藏聊天主區域         
//             this.showSidebar();            
//             this.hideChatMain();        
//         } else {            // 桌面版：兩者都顯示  
//             this.showSidebar();            
//             this.showChatMain();        
//         }    
//     }    
//     // 處理視窗大小變化    
//     handleResize() {        
//         const wasMobile = this.isMobile;        
//         this.isMobile = window.innerWidth < 768;                
//         // 如果從手機切換到桌面        
//         if (wasMobile && !this.isMobile) {            
//             this.showSidebar();            
//             this.showChatMain();        
//         }        
//         // 如果從桌面切換到手機        
//         else if (!wasMobile && this.isMobile) {            
//             this.showSidebar();            
//             this.hideChatMain();        
//         }    
//     }    
//     // 顯示側邊欄    
//     showSidebar() {        
//         const sidebar = document.getElementById('sidebar');        
//         sidebar.classList.remove('mobile-hidden');    
//     }    
//     // 隱藏側邊欄    
//     hideSidebar() {        
//         const sidebar = document.getElementById('sidebar');        
//         sidebar.classList.add('mobile-hidden');    
//     }    
//     // 顯示聊天主區域    
//     showChatMain() {        
//         const chatMain = document.getElementById('chatMain');        
//         chatMain.classList.remove('mobile-hidden');    
//     }    
//     // 隱藏聊天主區域    
//     hideChatMain() {        
//         const chatMain = document.getElementById('chatMain');        
//         chatMain.classList.add('mobile-hidden');    
//     }    
//     // 手機版：切換到聊天室視圖    
//     switchToChat() {        
//         if (this.isMobile) {            
//             this.hideSidebar();            
//             this.showChatMain();        
//         }    
//     }    
//     // 手機版：返回到側邊欄視圖    
//     backToSidebar() {        
//         if (this.isMobile) {            
//             this.showSidebar();            
//             this.hideChatMain();        
//         }    
//     }
//     // SSE 連接
//     connectSSE() {
//         const sseUrl = '/sse/chat'; // 請替換為您的 SSE 端點
        
//         this.eventSource = new EventSource(sseUrl);
        
//         this.eventSource.onopen = () => {
//             console.log('SSE 連接成功');
//             this.isConnected = true;
//             this.updateConnectionStatus(true);
//         };

//         this.eventSource.onmessage = (event) => {
//             try {
//                 const data = JSON.parse(event.data);
//                 this.handleMessage(data);
//             } catch (error) {
//                 console.error('解析訊息錯誤:', error);
//             }
//         };

//         this.eventSource.onerror = (error) => {
//             console.error('SSE 連接錯誤:', error);
//             this.isConnected = false;
//             this.updateConnectionStatus(false);
            
//             // 5秒後重新連接
//             setTimeout(() => {
//                 console.log('嘗試重新連接...');
//                 this.connectSSE();
//             }, 5000);
//         };

//         // 監聽特定事件類型
//         this.eventSource.addEventListener('newMessage', (event) => {
//             const data = JSON.parse(event.data);
//             this.addMessage(data);
//         });

//         this.eventSource.addEventListener('userJoined', (event) => {
//             const data = JSON.parse(event.data);
//             this.showSystemMessage(`${data.username} 加入了聊天室`);
//         });

//         this.eventSource.addEventListener('userLeft', (event) => {
//             const data = JSON.parse(event.data);
//             this.showSystemMessage(`${data.username} 離開了聊天室`);
//         });

//         this.eventSource.addEventListener('typing', (event) => {
//             const data = JSON.parse(event.data);
//             this.showTypingIndicator(data.username);
//         });
//     }

//     // 處理接收到的訊息
//     handleMessage(data) {
//         switch(data.type) {
//             case 'message':
//                 // 檢查是否為圖片訊息
//                 if (data.message.includes('<img')) {
//                     this.appendImageMessage(data);
//                 } else {
//                     this.addMessage(data);
//                 }
//                 break;
//             case 'userList':
//                 this.updateOnlineUsers(data.users);
//                 break;
//             case 'typing':
//                 this.showTypingIndicator(data.username);
//                 break;
//             default:
//                 console.log('未知訊息類型:', data);
//         }
//     }

//     sendImage(file) {
//         const reader = new FileReader();
//         reader.onload = async () => {
//             const base64Image = reader.result;
//             const messageData = {
//                 room: this.currentRoom,
//                 username: this.username,
//                 message: base64Image, // 直接存儲 base64 數據
//                 type: 'image',
//                 timestamp: new Date().toISOString()
//             };
//             try {
//                 const response = await fetch('/api/send-message', {
//                     method: 'POST',
//                     headers: {
//                         'Content-Type': 'application/json'
//                     },
//                     body: JSON.stringify(messageData)
//                 });
//                 if (!response.ok) {
//                     console.error('發送圖片失敗');
//                     alert('發送圖片失敗,請稍後再試');
//                 }
//             } catch (error) {
//                 console.error('發送圖片錯誤:', error);
//                 // 即使沒有伺服器,也在本地顯示圖片訊息(用於測試)
//                 this.appendImageMessage({
//                     ...messageData,
//                     isSelf: true
//                 });
//             }
//         };
//         reader.readAsDataURL(file);
//     }

//     // 修正後的圖片訊息添加函數
//     appendImageMessage(data) {
//         const container = document.getElementById('messagesContainer');
//         const imgWrapper = document.createElement('div');
        
//         // 修正：正確判斷是否為自己的訊息
//         const isSelf = data.isSelf === true || data.username === this.username;
//         imgWrapper.className = `imgmessage ${isSelf ? 'message-self' : 'message-other'}`;

//         const time = new Date(data.timestamp).toLocaleTimeString('zh-TW', {
//             hour: '2-digit',
//             minute: '2-digit'
//         });

//         // 提取圖片 URL
//         let imageUrl = data.message;
//         if (data.message.includes('<img')) {
//             const match = data.message.match(/src="([^"]+)"/);
//             if (match) {
//                 imageUrl = match[1];
//             }
//         }

//         // 創建一個臨時圖片來獲取真實尺寸
//         const tempImg = new Image();
//         tempImg.onload = () => {
//             // 圖片載入完成後，更新 data 屬性
//             const link = imgWrapper.querySelector('.image-link');
//             if (link) {
//                 link.setAttribute('data-pswp-width', tempImg.naturalWidth);
//                 link.setAttribute('data-pswp-height', tempImg.naturalHeight);
//             }
//             // 重新初始化 PhotoSwipe 以包含新圖片
//             this.initPhotoSwipeGallery();
//         };
//         tempImg.src = imageUrl;

//         imgWrapper.innerHTML = `
//             ${!isSelf ? `
//                 <div class="message-avatar">
//                     <i class="bi bi-person-circle"></i>
//                 </div>
//             ` : ''}
//             <div class="message-content">
//                 <div class="message-header ${isSelf ? 'text-end' : ''}">
//                     ${isSelf ? `
//                         <small class="text-muted me-2">${time}</small>
//                         <strong>我</strong>
//                     ` : `
//                         <strong>${data.username}</strong>
//                         <small class="text-muted ms-2">${time}</small>
//                     `}
//                 </div>
//                 <div class="message-image-wrapper" style="margin-top: 8px;">
//                     <a href="${imageUrl}" 
//                        data-pswp-width="auto" 
//                        data-pswp-height="auto" 
//                        target="_blank"
//                        class="image-link">
//                         <img src="${imageUrl}" 
//                              alt="Image" 
//                              style="max-width: 200px; max-height: 200px; border-radius: 8px; cursor: pointer;"
//                              loading="lazy">
//                     </a>
//                 </div>
//             </div>
//         `;

//         container.appendChild(imgWrapper);
        
//         // 自動滾動到底部
//         this.scrollToBottom();
//     }

//     // 初始化 PhotoSwipe 圖庫
//     initPhotoSwipeGallery() {
//         // 等待 PhotoSwipe 模組載入
//         import('https://cdnjs.cloudflare.com/ajax/libs/photoswipe/5.4.4/photoswipe-lightbox.esm.min.js')
//             .then(module => {
//                 const PhotoSwipeLightbox = module.default;
                
//                 // 如果已存在實例，先銷毀
//                 if (this.lightbox) {
//                     this.lightbox.destroy();
//                 }

//                 // 創建新的 lightbox 實例
//                 this.lightbox = new PhotoSwipeLightbox({
//                     gallery: '#messagesContainer',
//                     children: 'a.image-link',
//                     pswpModule: () => import('https://cdnjs.cloudflare.com/ajax/libs/photoswipe/5.4.4/photoswipe.esm.min.js'),
//                     // 防止失真的關鍵設定
//                     padding: { top: 50, bottom: 50, left: 100, right: 100 },
//                     bgOpacity: 0.9,
//                     // 確保使用原始圖片尺寸
//                     preload: [1, 2],
//                     // 禁用圖片縮放時的模糊效果
//                     maxWidthToAnimate: 4000,
//                     // 保持圖片品質
//                     imageClickAction: 'zoom',
//                     tapAction: 'close',
//                     doubleTapAction: 'zoom'
//                 });

//                 // 在打開前動態獲取圖片尺寸
//                 this.lightbox.on('contentLoad', (e) => {
//                     const { content } = e;
                    
//                     // 如果還沒有正確的尺寸，從圖片元素獲取
//                     if (content.data.w === 'auto' || content.data.h === 'auto') {
//                         const img = new Image();
//                         img.onload = () => {
//                             content.data.w = img.naturalWidth;
//                             content.data.h = img.naturalHeight;
//                             content.onLoaded();
//                         };
//                         img.src = content.data.src;
                        
//                         // 防止內容載入
//                         e.preventDefault();
//                     }
//                 });

//                 this.lightbox.init();
//             })
//             .catch(error => {
//                 console.error('PhotoSwipe 載入失敗:', error);
//             });
//     }

//     // 設置事件監聽器
//     setupEventListeners() {
//         const backButton = document.getElementById('backButton');        
//         backButton.addEventListener('click', () => {            
//             this.backToSidebar();        
//         });
//         // 發送訊息
//         const form = document.getElementById('messageForm');
//         form.addEventListener('submit', (e) => {
//             e.preventDefault();
//             this.sendMessage();
//         });

//         // 輸入時發送正在輸入狀態
//         let typingTimer;
//         const input = document.getElementById('messageInput');
//         input.addEventListener('input', () => {
//             clearTimeout(typingTimer);
//             this.sendTypingStatus(true);
            
//             typingTimer = setTimeout(() => {
//                 this.sendTypingStatus(false);
//             }, 1000);
//         });

//         // 圖片上傳
//         const imageUpload = document.getElementById('image-upload');
//         const sendImageBtn = document.getElementById('send-image-btn');

//         sendImageBtn.addEventListener('click', () => {
//             imageUpload.click();
//         });

//         imageUpload.addEventListener('change', (e) => {
//             const file = e.target.files[0];
//             if (file && file.type.startsWith('image/')) {
//                 this.sendImage(file);
//             }
//         });

//         // 切換聊天室
//         document.querySelectorAll('.chat-item').forEach(item => {
//             item.addEventListener('click', () => {
//                 this.switchRoom(item.dataset.room);
//                 this.switchToChat();
//             });
//         });

//         // 搜尋聊天室
//         document.getElementById('searchChat').addEventListener('input', (e) => {
//             this.filterChatList(e.target.value);
//         });
//     }

//     // 發送訊息
//     async sendMessage() {
//         const input = document.getElementById('messageInput');
//         const message = input.value.trim();
        
//         if (!message) return;

//         const messageData = {
//             room: this.currentRoom,
//             username: this.username,
//             message: message,
//             timestamp: new Date().toISOString()
//         };

//         try {
//             // 發送到伺服器
//             const response = await fetch('/api/send-message', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify(messageData)
//             });

//             if (response.ok) {
//                 input.value = '';
//                 // 訊息會透過 SSE 接收並顯示
//             } else {
//                 console.error('發送訊息失敗');
//                 alert('發送訊息失敗,請稍後再試');
//             }
//         } catch (error) {
//             console.error('發送訊息錯誤:', error);
            
//             // 即使沒有伺服器,也在本地顯示訊息(用於測試)
//             this.addMessage({
//                 ...messageData,
//                 isSelf: true
//             });
//             input.value = '';
//         }
//     }

//     // 添加訊息到聊天室
//     addMessage(data) {
//         const container = document.getElementById('messagesContainer');
//         const messageDiv = document.createElement('div');
//         const isSelf = data.isSelf === true || data.username === this.username;
//         messageDiv.className = `message ${isSelf ? 'message-self' : 'message-other'}`;

//         const time = new Date(data.timestamp).toLocaleTimeString('zh-TW', {
//             hour: '2-digit',
//             minute: '2-digit'
//         });

//         messageDiv.innerHTML = `
//             ${!isSelf ? `
//                 <div class="message-avatar">
//                     <i class="bi bi-person-circle"></i>
//                 </div>
//             ` : ''}
//             <div class="message-content">
//                 <div class="message-header ${isSelf ? 'text-end' : ''}">
//                     ${isSelf ? `
//                         <small class="text-muted me-2">${time}</small>
//                         <strong>我</strong>
//                     ` : `
//                         <strong>${data.username}</strong>
//                         <small class="text-muted ms-2">${time}</small>
//                     `}
//                 </div>
//                 <div class="message-text">
//                     ${this.escapeHtml(data.message)}
//                 </div>
//             </div>
//         `;

//         container.appendChild(messageDiv);
//         this.scrollToBottom();
        
//         // 播放通知音(可選)
//         this.playNotificationSound();
//     }

//     // 顯示系統訊息
//     showSystemMessage(text) {
//         const container = document.getElementById('messagesContainer');
//         const systemMsg = document.createElement('div');
//         systemMsg.className = 'text-center my-2';
//         systemMsg.innerHTML = `<small class="text-muted">${text}</small>`;
//         container.appendChild(systemMsg);
//         this.scrollToBottom();
//     }

//     // 顯示正在輸入指示器
//     showTypingIndicator(username) {
//         const indicator = document.getElementById('typingIndicator');
//         indicator.style.display = 'block';
//         indicator.innerHTML = `<small class="text-muted"><i class="bi bi-three-dots"></i> ${username} 正在輸入...</small>`;

//         setTimeout(() => {
//             indicator.style.display = 'none';
//         }, 3000);
//     }

//     // 發送正在輸入狀態
//     async sendTypingStatus(isTyping) {
//         try {
//             await fetch('/api/typing', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify({
//                     room: this.currentRoom,
//                     username: this.username,
//                     isTyping: isTyping
//                 })
//             });
//         } catch (error) {
//             console.error('發送輸入狀態錯誤:', error);
//         }
//     }

//     // 切換聊天室
//     switchRoom(roomId) {
//         this.currentRoom = roomId;
        
//         // 更新 UI
//         document.querySelectorAll('.chat-item').forEach(item => {
//             item.classList.remove('active');
//         });
//         document.querySelector(`[data-room="${roomId}"]`).classList.add('active');

//         // 清空訊息
//         document.getElementById('messagesContainer').innerHTML = `
//             <div class="text-center my-4">
//                 <small class="text-muted">歡迎來到 ${roomId} 聊天室!</small>
//             </div>
//         `;

//         // 重新連接 SSE (如果需要針對不同房間)
//         // this.connectSSE();
//     }

//     // 更新在線用戶列表
//     updateOnlineUsers(users) {
//         const usersList = document.getElementById('onlineUsersList');
//         usersList.innerHTML = users.map(user => `
//             <div class="d-flex align-items-center mb-2">
//                 <span class="online-dot"></span>
//                 <small>${user}</small>
//             </div>
//         `).join('');
//     }

//     // 更新連接狀態
//     updateConnectionStatus(isConnected) {
//         const statusBtn = document.getElementById('connectionStatus');
//         if (statusBtn) {
//             if (isConnected) {
//                 statusBtn.innerHTML = '<i class="bi bi-circle-fill text-success"></i> 已連接';
//                 statusBtn.classList.remove('btn-outline-danger');
//                 statusBtn.classList.add('btn-outline-secondary');
//             } else {
//                 statusBtn.innerHTML = '<i class="bi bi-circle-fill text-danger"></i> 已斷線';
//                 statusBtn.classList.remove('btn-outline-secondary');
//                 statusBtn.classList.add('btn-outline-danger');
//             }
//         }
//     }

//     // 過濾聊天室列表
//     filterChatList(searchTerm) {
//         const items = document.querySelectorAll('.chat-item');
//         items.forEach(item => {
//             const text = item.textContent.toLowerCase();
//             if (text.includes(searchTerm.toLowerCase())) {
//                 item.style.display = 'block';
//             } else {
//                 item.style.display = 'none';
//             }
//         });
//     }

//     // 滾動到底部
//     scrollToBottom() {
//         const container = document.getElementById('messagesContainer');
//         setTimeout(() => {
//             container.scrollTop = container.scrollHeight;
//         }, 100);
//     }

//     // HTML 轉義
//     escapeHtml(text) {
//         const div = document.createElement('div');
//         div.textContent = text;
//         return div.innerHTML;
//     }

//     // 播放通知音
//     playNotificationSound() {
//         // 可以添加音效檔案
//         // const audio = new Audio('/sounds/notification.mp3');
//         // audio.play().catch(e => console.log('無法播放音效'));
//     }

//     // 清理連接
//     disconnect() {
//         if (this.eventSource) {
//             this.eventSource.close();
//             console.log('SSE 連接已關閉');
//         }
//         if (this.lightbox) {
//             this.lightbox.destroy();
//         }
//     }
// }

// // 初始化聊天室
// let chatRoom;
// document.addEventListener('DOMContentLoaded', () => {
//     chatRoom = new ChatRoom();
// });

// // 頁面關閉時清理連接
// window.addEventListener('beforeunload', () => {
//     if (chatRoom) {
//         chatRoom.disconnect();
//     }
// });
class ChatRoom {
    constructor() {
        this.backend = new ChatBackendService();
        this.currentRoomId = null;
        this.currentRoomName = '';
        this.eventSource = null;
        this.username = '我'; // 可之後改成登入使用者

        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadRooms();
    }

    /* ======================
       聊天室列表
    ====================== */

    async loadRooms() {
        const chatList = document.getElementById('chatList');
        chatList.innerHTML = '';

        try {
            const rooms = await this.backend.listRooms();

            rooms.data.forEach(room => {
                const item = document.createElement('div');
                item.className = 'chat-item';
                item.dataset.roomId = room.id;

                item.innerHTML = `
                    <div class="d-flex align-items-center">
                        <div class="chat-avatar">
                            <i class="bi bi-chat-dots-fill"></i>
                        </div>
                        <div class="flex-grow-1">
                            <h6 class="mb-0">${room.roomName}</h6>
                        </div>
                    </div>
                `;

                item.addEventListener('click', () => {
                    this.switchRoom(room.id, room.roomName);
                });

                chatList.appendChild(item);
            });

            if (rooms.length > 0) {
                this.switchRoom(rooms[0].id, rooms[0].roomName);
            }
        } catch (err) {
            console.error('聊天室列表載入失敗', err);
        }
    }

    /* ======================
       切換聊天室
    ====================== */

    async switchRoom(roomId, roomName) {
        this.currentRoomId = roomId;
        this.currentRoomName = roomName;

        document.querySelectorAll('.chat-item').forEach(i => i.classList.remove('active'));
        document.querySelector(`[data-room-id="${roomId}"]`)?.classList.add('active');

        document.querySelector('.chat-header h5').textContent = roomName;

        const container = document.getElementById('messagesContainer');
        container.innerHTML = '';

        // 載入歷史訊息
        const history = await this.backend.getHistory(roomId);
        history.forEach(msg => this.renderMessage(msg));

        // SSE
        this.connectSSE(roomId);
    }

    /* ======================
       SSE 即時訊息
    ====================== */

    connectSSE(roomId) {
        if (this.eventSource) {
            this.eventSource.close();
        }

        this.eventSource = this.backend.openSse(roomId);

        this.eventSource.addEventListener('message', (event) => {
            const data = JSON.parse(event.data);
            this.renderMessage(data);
        });

        this.eventSource.addEventListener('typing', (event) => {
            const data = JSON.parse(event.data);
            this.showTyping(data.username);
        });
    }

    /* ======================
       傳送訊息
    ====================== */

    async sendMessage() {
        const input = document.getElementById('messageInput');
        const text = input.value.trim();
        if (!text || !this.currentRoomId) return;

        await this.backend.sendMessage(this.currentRoomId, text);
        input.value = '';
    }

    /* ======================
       UI 渲染
    ====================== */

    renderMessage(data) {
        const container = document.getElementById('messagesContainer');
        const isSelf = data.senderName === this.username;

        const time = new Date(data.createdAt).toLocaleTimeString('zh-TW', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const div = document.createElement('div');
        div.className = `message ${isSelf ? 'message-self' : 'message-other'}`;

        div.innerHTML = `
            ${!isSelf ? `
                <div class="message-avatar">
                    <i class="bi bi-person-circle"></i>
                </div>` : ''}
            <div class="message-content">
                <div class="message-header ${isSelf ? 'text-end' : ''}">
                    ${isSelf
                        ? `<small class="text-muted me-2">${time}</small><strong>我</strong>`
                        : `<strong>${data.senderName}</strong><small class="text-muted ms-2">${time}</small>`
                    }
                </div>
                <div class="message-text">
                    ${this.escapeHtml(data.message)}
                </div>
            </div>
        `;

        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    showTyping(username) {
        const indicator = document.getElementById('typingIndicator');
        indicator.style.display = 'block';
        indicator.innerHTML = `<small>${username} 正在輸入...</small>`;
        clearTimeout(this.typingTimer);
        this.typingTimer = setTimeout(() => {
            indicator.style.display = 'none';
        }, 3000);
    }

    /* ======================
       綁定事件
    ====================== */

    bindEvents() {
        const messageForm = document.getElementById('messageForm');
        if(!messageForm) return;
        messageForm.addEventListener('submit', e => {
            e.preventDefault();
            this.sendMessage();
        });

        document.getElementById('messageInput').addEventListener('input', () => {
            this.backend.typing(this.currentRoomId);
        });

        document.getElementById('backButton')?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.remove('mobile-hidden');
            document.getElementById('chatMain').classList.add('mobile-hidden');
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

/* ======================
   初始化
====================== */

document.addEventListener('DOMContentLoaded', () => {
    window.chatRoom = new ChatRoom();
});
