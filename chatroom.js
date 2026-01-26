class ChatRoom {
    constructor() {
        this.backend = new ChatBackendService();
        this.currentRoomId = null;
        this.currentRoomName = '';
        this.eventSource = null;
        this.username = '';
        this.auth = new BackendService();
        this.username = ''; // 可之後改成登入使用者
        this.isMobile = window.innerWidth < 768;
        this.lightbox = null; // PhotoSwipe instance
        this.pendingImage = null;
        this.sendImagebtn = document.getElementById('send-image-btn');
        this.previewArea = document.getElementById('image-upload');
        this.input = document.getElementById('messageInput');
        this.init();
    }

    async init() {
        // this.cacheDOM();
        this.setupMobileView();

        // this.showLoaders();
        await this.loadRooms();
        // this.hideLoaders();

        this.bindEvents();
        this.putImage();
        this.closePreview();
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }
    // cacheDOM() {
    //     this.chatList = document.getElementById('chatList');
    //     this.chatListLoader = document.getElementById('chatListLoader');
    
    //     this.chatMainLoader = document.getElementById('chatMainLoader');
    //     this.messagesContainer = document.getElementById('messagesContainer');
    // }
    // showLoaders() {
    //     this.chatListLoader?.classList.remove('d-none');
    //     this.chatMainLoader?.classList.remove('d-none');
    // }
    
    // hideLoaders() {
    //     this.chatListLoader?.classList.add('d-none');
    //     this.chatMainLoader?.classList.add('d-none');
    // }
    
    initPhotoSwipe() {
        // 動態載入 PhotoSwipe CSS 和 JS
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/photoswipe/5.4.4/photoswipe.min.css';
        document.head.appendChild(cssLink);
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/photoswipe/5.4.4/photoswipe-lightbox.esm.min.js';
        script.type = 'module';
        script.onload = () => {
            console.log('PhotoSwipe 已載入');
        };
        document.head.appendChild(script);
    }
    initPhotoSwipeGallery() {
        // 等待 PhotoSwipe 模組載入
        import('https://cdnjs.cloudflare.com/ajax/libs/photoswipe/5.4.4/photoswipe-lightbox.esm.min.js')
            .then(module => {
                const PhotoSwipeLightbox = module.default;
                
                // 如果已存在實例，先銷毀
                if (this.lightbox) {
                    this.lightbox.destroy();
                }

                // 創建新的 lightbox 實例
                this.lightbox = new PhotoSwipeLightbox({
                    gallery: '#messagesContainer',
                    children: 'a.image-link',
                    pswpModule: () => import('https://cdnjs.cloudflare.com/ajax/libs/photoswipe/5.4.4/photoswipe.esm.min.js'),
                    // 防止失真的關鍵設定
                    padding: { top: 50, bottom: 50, left: 100, right: 100 },
                    bgOpacity: 0.9,
                    // 確保使用原始圖片尺寸
                    preload: [1, 2],
                    // 禁用圖片縮放時的模糊效果
                    maxWidthToAnimate: 4000,
                    // 保持圖片品質
                    imageClickAction: 'zoom',
                    tapAction: 'close',
                    doubleTapAction: 'zoom'
                });

                // 在打開前動態獲取圖片尺寸
                this.lightbox.on('contentLoad', (e) => {
                    const { content } = e;
                    
                    // 如果還沒有正確的尺寸，從圖片元素獲取
                    if (content.data.w === 'auto' || content.data.h === 'auto') {
                        const img = new Image();
                        img.onload = () => {
                            content.data.w = img.naturalWidth;
                            content.data.h = img.naturalHeight;
                            content.onLoaded();
                        };
                        img.src = content.data.src;
                        
                        // 防止內容載入
                        e.preventDefault();
                    }
                });

                this.lightbox.init();
            })
            .catch(error => {
                console.error('PhotoSwipe 載入失敗:', error);
            });
    }
    putImage() {
        this.sendImagebtn.addEventListener('click', () => {
            console.log('點擊上傳圖片按鈕');
            this.previewArea.click();
        });

        this.previewArea.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if(file.size > 5 * 1024 * 1024) {
                alert('圖片大小超過 5MB 限制');
                return;
            }
            this.pendingImage = file;
            this.previewImage(file);
        });
    }
    closePreview() {
        document.addEventListener('click', (e) => {
            const closeBtn = e.target.closest('.btn-close');
            if (!closeBtn) return;
            else {
                console.log('關閉圖片預覽');
            }
            this.pendingImage = null;
            document.querySelector('.preview')?.remove();
        });
    }
    
    previewImage(file) {
        const reader = new FileReader();
        reader.onload = () => {
            const container = document.getElementById('img-input-container');

            const preview = document.createElement('div');
            preview.className = 'preview';

            preview.innerHTML = `
                <div class="position-relative d-inline-block">
                    <button type="button" class="btn-close" aria-label="Close"></button>
                    <img src="${reader.result}">
                </div>
            `;

            container.appendChild(preview);
        };
        reader.readAsDataURL(file);
    }

    sendImage(file) {
        const reader = new FileReader();
        reader.onload = async () => {
            const base64Image = reader.result;
            try {
                const response = await this.backend.sendAttach(this.currentRoomId, base64Image);
                console.log('圖片上傳成功:', response);
                // 上傳成功後，在聊天室中顯示圖片訊息
            } catch (error) {
                console.error('發送圖片錯誤:', error);
                // 即使沒有伺服器,也在本地顯示圖片訊息(用於測試)
                // this.appendImageMessage({
                //     ...messageData,
                //     isSelf: true
                // });
            }
        };
        reader.readAsDataURL(file);
    }

    // 修正後的圖片訊息添加函數
    appendImageMessage(data) {
        const container = document.getElementById('messagesContainer');
        const imgWrapper = document.createElement('div');
        
        // 修正：正確判斷是否為自己的訊息
        const isSelf = data.isSelf === true || data.username === this.username;
        imgWrapper.className = `imgmessage ${isSelf ? 'message-self' : 'message-other'}`;

        const time = new Date(data.timestamp).toLocaleTimeString('zh-TW', {
            hour: '2-digit',
            minute: '2-digit'
        });

        // 提取圖片 URL
        let imageUrl = data.attachments || '';

        // 創建一個臨時圖片來獲取真實尺寸
        const tempImg = new Image();
        tempImg.onload = () => {
            // 圖片載入完成後，更新 data 屬性
            const link = imgWrapper.querySelector('.image-link');
            if (link) {
                link.setAttribute('data-pswp-width', tempImg.naturalWidth);
                link.setAttribute('data-pswp-height', tempImg.naturalHeight);
            }
            // 重新初始化 PhotoSwipe 以包含新圖片
            this.initPhotoSwipeGallery();
        };
        tempImg.src = imageUrl;

        imgWrapper.innerHTML = `
            ${!isSelf ? `
                <div class="message-avatar">
                    <i class="bi bi-person-circle"></i>
                </div>
            ` : ''}
            <div class="message-content">
                <div class="message-header ${isSelf ? 'text-end' : ''}">
                    ${isSelf ? `
                        <small class="text-muted me-2">${time}</small>
                        <strong>${this.username}</strong>
                    ` : `
                        <strong>${data.username}</strong>
                        <small class="text-muted ms-2">${time}</small>
                    `}
                </div>
                <div class="message-image-wrapper" style="margin-top: 8px;">
                    <a href="${imageUrl}" 
                       data-pswp-width="auto" 
                       data-pswp-height="auto" 
                       target="_blank"
                       class="image-link">
                        <img src="${imageUrl}" 
                             alt="Image" 
                             style="max-width: 200px; max-height: 200px; border-radius: 8px; cursor: pointer;"
                             loading="lazy">
                    </a>
                </div>
            </div>
        `;

        container.appendChild(imgWrapper);
        container.scrollTop = container.scrollHeight;
    }
    setupMobileView() {
        this.isMobile = window.innerWidth < 768;
        console.log('初始視窗大小, 是否為手機版:', this.isMobile);
        if (this.isMobile) {
            this.showSidebar();
            this.hideChatMain();
        } else {
            this.showSidebar();
            this.showChatMain();
        }
    }

    handleResize() {
        const wasMobile = this.isMobile;
        console.log('視窗大小改變, 是否為手機版:', wasMobile, '->', window.innerWidth < 768);
        this.isMobile = window.innerWidth < 768;
        if (wasMobile && !this.isMobile) {
            this.showSidebar();
            this.showChatMain();
        } else if (!wasMobile && this.isMobile) {
            this.showSidebar();
            this.hideChatMain();
        }  
    }

    showSidebar() {
        const sidebar = document.getElementById('sidebar');
        console.log('顯示側邊欄', sidebar);
        sidebar.classList.remove('mobile-hidden');
    }
    hideSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.add('mobile-hidden');
    }
    showChatMain() {
        const chatMain = document.getElementById('chatMain');
        chatMain.classList.remove('mobile-hidden');
    }
    hideChatMain() {
        const chatMain = document.getElementById('chatMain');
        chatMain.classList.add('mobile-hidden');
    }
    switchToChat() {
        if (this.isMobile) {
            this.hideSidebar();
            this.showChatMain();
        }
    }
    backToSidebar() {
        if (this.isMobile) {
            this.showSidebar();
            this.hideChatMain();
        }
    }

    bindEvents() {
        const backButton = document.getElementById('backButton');
        console.log('是否收到backButton: ', backButton);
        backButton.addEventListener('click', () => {
            console.log('返回側邊欄');
            this.backToSidebar();
        });
        const form = document.getElementById('messageForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });
        this.input.addEventListener('input', () => {
            if (!this.currentRoomId) return;
            this.backend.typing(this.currentRoomId);
        });
        
        // let typingTimer;
        // input.addEventListener('input', () => {
        //     clearTimeout(typingTimer);
        //     this.showTyping(true);
        //     typingTimer = setTimeout(() => {
        //         this.showTyping(false);
        //     }, 100);
        // });
    }
    // 播放通知音
    playNotificationSound() {
        // 可以添加音效檔案
        const audio = new Audio('sound/mes.mp3');
        audio.play().catch(e => console.log('無法播放音效'));
    }
    /* ======================
       聊天室列表
    ====================== */

    async loadRooms() {
        const chatList = document.getElementById('chatList');
        if (!chatList) {
            console.error('找不到聊天室列表容器');
            return;
        }
        chatList.innerHTML = '';
        // this.showLoaders();
        try {
            const rooms = await this.backend.listRooms();  
            console.log(rooms);
            if (!rooms.data || rooms.data.length === 0) {
                chatList.innerHTML = '<p class="text-center text-muted mt-3">無可用聊天室</p>';
                return;
            }
            rooms.data.forEach(data => {
                const item = document.createElement('div');
                item.className = 'chat-item';
                item.dataset.roomId = data.id;
                item.innerHTML = `
                    <div class="d-flex align-items-center">
                        <div class="chat-avatar">
                            <img src="${data.item.mainImage}" alt="${data.item.name}的照片">
                        </div>
                        <div class="flex-grow-1">
                            <h6 class="mb-0 roomName">商品${data.item.name}聊天室</h6>
                            <small class="text-muted">${data.lastMessageId || '無訊息'}</small>
                        </div>
                        <span class="badge bg-primary rounded-pill ${data.lastMessageId == data.lastReadMessageId ? 'd-none' : ''}">new</span> 
                    </div>
                `;
                // 未讀訊息徽章(上面的badge)
                item.addEventListener('click', () => {
                    this.switchRoom(data.id);
                });

                chatList.appendChild(item);
            });

            if (rooms.length > 0) {
                this.switchRoom(rooms[0].id);
            }
        } catch (err) {
            console.error('聊天室列表載入失敗', err);
        }
        // } finally {
        //     this.hideLoaders();
        // }
    }

    /* ======================
       切換聊天室
    ====================== */

    async switchRoom(roomId) {
        // this.chatMainLoader.classList.remove('d-none');
        if(this.isMobile) {
            this.hideSidebar();
            this.showChatMain();
        }
        console.log('切換聊天室', roomId);
        this.currentRoomId = roomId;
        //this.currentRoomName = roomName;

        document.querySelectorAll('.chat-item').forEach(i => i.classList.remove('active'));
        document.querySelector(`[data-room-id="${roomId}"]`)?.classList.add('active');
        // 聊天室內名字
        document.querySelector('.chat-header h6').textContent = '商品' + roomId + '聊天室';

        const container = document.getElementById('messagesContainer');
        container.innerHTML = '';

        // 載入歷史訊息
        const before = new Date().toISOString();
        if(!before) return;
        console.log('載入歷史訊息', roomId, before);
        const limit = 50;
        const history = await this.backend.getHistory(roomId, limit, before);
        history.data.forEach(msg => this.renderMessage(msg));
        console.log('歷史訊息載入完成:', history);
        // this.chatMainLoader.classList.add('d-none');
        // SSE
        
        //await this.backend.markAsRead(roomId);
        //this.clearUnreadBadge(roomId);

        await this.connectSSE(roomId);
    }

    /* ======================
       SSE 即時訊息
    ====================== */

    async connectSSE(roomId) {
        if (this.eventSource) {
            this.eventSource.close();
        }

        this.eventSource = new EventSource(`${this.backend.baseUrl}/api/chat/stream?room=${roomId}`, {
            withCredentials: true
        });

        this.eventSource.addEventListener('newMessage', (event) => {
            const data = JSON.parse(event.data);
            this.renderMessage(data);
            this.playNotificationSound();
        });
        this.eventSource.addEventListener('typing', (event) => {
            const data = JSON.parse(event.data);
        
            // 確保有自己的 username
            this.username = localStorage.getItem('username');
        
            // 如果是自己送的 typing，忽略
            if (data.username === this.username) return;
        
            this.showTyping();
        });
        

        this.eventSource.addEventListener('ready', (event) => {
            const data = JSON.parse(event.data);
            console.log('連線狀態:', data);
        });

        this.eventSource.onerror = (error) => {
            console.error('SSE 連接錯誤:', error);
            this.eventSource.close();
        };
    }

    /* ======================
       傳送訊息
    ====================== */

    async sendMessage() {
        if (this.pendingImage) {
            await this.sendImage(this.pendingImage);
            this.pendingImage = null;
            document.querySelector('.preview')?.remove();
            return;
        }
        const input = document.getElementById('messageInput');
        const text = input.value.trim();
        if (!text || !this.currentRoomId) return;

        const mes = await this.backend.sendMessage(this.currentRoomId, text);
        // this.renderMessage(mes.data);
        input.value = '';
    }

    /* ======================
       UI 渲染
    ====================== */

    renderMessage(data) {
        if (data.attachments.length > 0) {
            this.appendImageMessage({
                attachments: data.attachments,
                username: data.username,
                timestamp: data.timestamp
            });
            return;
        }

        const container = document.getElementById('messagesContainer');
        console.log('data', data);
        this.username = localStorage.getItem('username');
        const isSelf = this.username == data.username;
        console.log('isSelf', isSelf);
        const timestamp = new Date(data.timestamp).toLocaleTimeString('zh-TW', {
            hour: '2-digit',
            minute: '2-digit'
        });
        const now = new Date().toLocaleTimeString('zh-TW', {
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
                        ? `<small class="text-muted me-2">${now}</small><strong>${this.username}</strong>`
                        : `<strong>對方</strong><small class="text-muted ms-2">${timestamp}</small>`
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

    showTyping() {
        const indicator = document.getElementById('typingIndicator');
        indicator.style.display = 'block';
        indicator.innerHTML = `<small>對方正在輸入...</small>`;
        clearTimeout(this.typingTimer);
        this.typingTimer = setTimeout(() => {
            indicator.style.display = 'none';
        }, 1000);
    }

    /* ======================
       綁定事件
    ====================== */

    // bindEvents() {
    //     const messageForm = document.getElementById('messageForm');
    //     if(!messageForm) return;
    //     messageForm.addEventListener('submit', e => {
    //         e.preventDefault();
    //         this.sendMessage();
    //     });

    //     document.getElementById('messageInput').addEventListener('input', () => {
    //         this.backend.typing(this.currentRoomId);
    //     });

    //     document.getElementById('backButton')?.addEventListener('click', () => {
    //         document.getElementById('sidebar').classList.remove('mobile-hidden');
    //         document.getElementById('chatMain').classList.add('mobile-hidden');
    //     });
    // }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

/* ======================
   初始化
====================== */
let chatRoom = null;
let backendService = null;
let chatBackendService = null;
document.addEventListener('DOMContentLoaded', () => {
    window.chatRoom = new ChatRoom();
});
