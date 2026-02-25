class ChatRoomList {
    constructor(initialRoomId = null) {
        this.backend = new ChatBackendService();
        this.currentRoomId = initialRoomId;
        this.currentRoomName = '';
        this.eventSource = null;
        this.username = localStorage.getItem('username') || '';
        this.auth = new BackendService();
        this.isMobile = window.innerWidth < 768;
        this.lightbox = null;
        this.pendingImage = null;
        this.hasMore = true;
        this.isLoading = false;
        this.sendImagebtn = document.getElementById('send-image-btn');
        this.previewArea = document.getElementById('image-upload');
        this.input = document.getElementById('messageInput');
        this.alreadyInit = false;

        // 每個房間各自記錄 lastReadMessageId 和 lastReadTimestamp
        this.lastReadMap = new Map(); // roomId -> { id, timestamp }（自己的已讀進度）
        this.partnerReadMap = new Map(); // roomId -> { id }（對方的已讀進度）

        this.isMarkingRead = false;
        this.readObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                const msgId = entry.target.dataset.messageId;
                const msgTimestamp = entry.target.dataset.timestamp;
                if (!msgId || !msgTimestamp) return;

                const roomRead = this.lastReadMap.get(String(this.currentRoomId));
                const lastReadId = roomRead?.id ?? '';

                // id 是 string，比較時用字串比較會有問題，改用 timestamp 比較
                if (msgTimestamp <= (roomRead?.timestamp ?? '')) return;
                if (this.isMarkingRead) return;

                this.isMarkingRead = true;

                // ✅ API: PATCH /api/chat/rooms/{roomId}/read
                // body: { readAt: "訊息的 timestamp" }  ← 傳訊息本身的時間，不是現在時間
                this.backend.markAsRead(this.currentRoomId, msgTimestamp)
                    .finally(() => { this.isMarkingRead = false; });

                this.lastReadMap.set(String(this.currentRoomId), {
                    id: msgId,
                    timestamp: msgTimestamp
                });
                this.readObserver.unobserve(entry.target);
            });
        }, { threshold: 0 });
        this.isInitialLoading = false;
    }

    async init() {
        if (this.alreadyInit) return;
        this.alreadyInit = true;
        this.setupMobileView();
        await this.loadRooms();
        this.connectSSE(); // 帳號層級 SSE，開啟一次即可
        if (this.currentRoomId) {
            const roomEl = document.querySelector(`[data-room-id="${this.currentRoomId}"]`);
            if (roomEl) {
                const name = roomEl.querySelector('.roomName')?.textContent || '未知';
                await this.switchRoom(this.currentRoomId, name);
            }
        }
        window.addEventListener('resize', () => this.handleResize());
        this.bindEvents();
        this.putImage();
        this.closePreview();
    }

    initPhotoSwipeGallery() {
        import('https://cdnjs.cloudflare.com/ajax/libs/photoswipe/5.4.4/photoswipe-lightbox.esm.min.js')
            .then(module => {
                const PhotoSwipeLightbox = module.default;
                if (this.lightbox) this.lightbox.destroy();
                this.lightbox = new PhotoSwipeLightbox({
                    gallery: '#messagesContainer',
                    children: 'a.image-link',
                    pswpModule: () => import('https://cdnjs.cloudflare.com/ajax/libs/photoswipe/5.4.4/photoswipe.esm.min.js'),
                    padding: { top: 50, bottom: 50, left: 100, right: 100 },
                    bgOpacity: 0.9,
                    preload: [1, 2],
                    maxWidthToAnimate: 4000,
                    imageClickAction: 'zoom',
                    tapAction: 'close',
                    doubleTapAction: 'zoom'
                });
                this.lightbox.on('contentLoad', (e) => {
                    const { content } = e;
                    if (content.data.w === 'auto' || content.data.h === 'auto') {
                        const img = new Image();
                        img.onload = () => {
                            content.data.w = img.naturalWidth;
                            content.data.h = img.naturalHeight;
                            content.onLoaded();
                        };
                        img.src = content.data.src;
                        e.preventDefault();
                    }
                });
                this.lightbox.init();
            })
            .catch(err => console.error('PhotoSwipe 載入失敗:', err));
    }

    putImage() {
        this.sendImagebtn.addEventListener('click', () => {
            this.previewArea.click();
        });
        this.previewArea.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > 5 * 1024 * 1024) {
                alert('圖片大小超過 5MB 限制');
                return;
            }
            this.pendingImage = file;
            this.previewImage(file);
        });
    }

    closePreview() {
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.btn-close')) return;
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
                </div>`;
            container.appendChild(preview);
        };
        reader.readAsDataURL(file);
    }

    async sendImage(file) {
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                // ✅ API: POST /api/chat/attachment
                // body: { room: roomId, image: base64字串 }
                await this.backend.sendAttach(this.currentRoomId, reader.result);
            } catch (err) {
                console.error('發送圖片錯誤:', err);
            }
        };
        reader.readAsDataURL(file);
    }

    // ✅ attachments 是陣列 ["url1", ...]，取第一個元素顯示
    appendImageMessage(data, prepend = false) {
        const container = document.getElementById('messagesContainer');
        const imgWrapper = document.createElement('div');
        const isSelf = data.isSelf === true || data.username === this.username;
        imgWrapper.className = `imgmessage ${isSelf ? 'message-self' : 'message-other'}`;
        imgWrapper.dataset.timestamp = data.timestamp;
        imgWrapper.dataset.messageId = data.id ?? '';

        const time = new Date(data.timestamp).toLocaleTimeString('zh-TW', {
            hour: '2-digit', minute: '2-digit', hour12: false
        });

        // ✅ attachments 是陣列，取第一個
        const imageUrl = Array.isArray(data.attachments)
            ? data.attachments[0]
            : (data.attachments || '');

        imgWrapper.innerHTML = `
            ${!isSelf ? `<div class="message-avatar"><img src="${data.photoURL || '../image/default-avatar.png'}" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;"/></div>` : ''}
            <div class="message-content">
                <div class="d-flex align-items-end">
                    ${isSelf ? `
                    <div class="d-flex flex-column align-items-center me-2">
                        <i class="bi bi-check2-all read-receipt d-none" style="font-size: 0.8rem; color: #4CAF50;"></i>
                        <small class="text-muted" style="font-size: 0.75rem;">${time}</small>
                    </div>` : ''}
                    <div class="message-image-wrapper" style="margin-top: 8px;">
                        <a href="${imageUrl}" data-pswp-width="auto" data-pswp-height="auto"
                           target="_blank" class="image-link">
                            <img src="${imageUrl}" alt="Image"
                                 style="width: 200px; background: #f0f0f0; border-radius: 8px; cursor: pointer;"
                                 loading="lazy">
                        </a>
                    </div>
                    ${isSelf ? '' : `<small class="text-muted me-2" style="font-size: 0.75rem;">${time}</small>`}
                </div>
            </div>`;

        if (prepend) {
            container.prepend(imgWrapper);
        } else {
            container.appendChild(imgWrapper);
            requestAnimationFrame(() => {
                if (!this.isInitialLoading) container.scrollTop = container.scrollHeight;
            });
        }

        const tempImg = new Image();
        tempImg.onload = () => {
            const link = imgWrapper.querySelector('.image-link');
            if (link) {
                link.setAttribute('data-pswp-width', tempImg.naturalWidth);
                link.setAttribute('data-pswp-height', tempImg.naturalHeight);
            }
            this.initPhotoSwipeGallery();
            if (!prepend && !this.isInitialLoading) container.scrollTop = container.scrollHeight;
        };
        tempImg.src = imageUrl;

        this.detectRead(imgWrapper);
    }

    setupMobileView() {
        this.isMobile = window.innerWidth < 768;
        if (this.isMobile) { this.showSidebar(); this.hideChatMain(); }
        else { this.showSidebar(); this.showChatMain(); }
    }

    handleResize() {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth < 768;
        if (wasMobile && !this.isMobile) { this.showSidebar(); this.showChatMain(); }
        else if (!wasMobile && this.isMobile) { this.showSidebar(); this.hideChatMain(); }
    }

    showSidebar() { document.getElementById('sidebar')?.classList.remove('mobile-hidden'); }
    hideSidebar() { document.getElementById('sidebar')?.classList.add('mobile-hidden'); }
    showChatMain() { document.getElementById('chatMain')?.classList.remove('mobile-hidden'); }
    hideChatMain() { document.getElementById('chatMain')?.classList.add('mobile-hidden'); }
    backToSidebar() { if (this.isMobile) { this.showSidebar(); this.hideChatMain(); } }

    bindEvents() {
        document.addEventListener('click', async (e) => {
            if (!e.target.closest('#backButton')) return;
            this.backToSidebar();
            await this.loadRooms();
        });

        document.getElementById('messageForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });

        let typingTimer;
        this.input.addEventListener('input', () => {
            clearTimeout(typingTimer);
            typingTimer = setTimeout(() => {
                this.backend.typing(this.currentRoomId);
            }, 400);
        });

        const container = document.getElementById('messagesContainer');
        container.addEventListener('scroll', () => {
            if (container.scrollTop <= 10) this.loadMoreMessages();
        });
    }

    playNotificationSound() {
        const audio = new Audio('../sound/mes.mp3');
        audio.play().catch(() => {});
    }

    getLastMessageText(lastMsg) {
        if (!lastMsg) return '無訊息';
        if (lastMsg.message) return lastMsg.message;
        // ✅ attachments 是陣列
        if (Array.isArray(lastMsg.attachments) && lastMsg.attachments.length > 0) return '傳送了一張圖片';
        return '無訊息';
    }

    async loadRooms() {
        const chatList = document.getElementById('chatList');
        if (!chatList) return;
        chatList.innerHTML = '';

        try {
            // ✅ GET /api/chat/rooms 回應: { data: { items: [...] } }
            const rooms = await this.backend.listRooms();
            if (!rooms.data.items?.length) {
                chatList.innerHTML = '<p class="text-center text-muted mt-3">無可用聊天室</p>';
                return;
            }

            rooms.data.items.forEach(data => {
                const target = data.members.find(m => m.name !== this.username);
                const myself = data.members.find(m => m.name === this.username);
                const isMyMessage = data.lastMessage?.username === myself?.name;
                const isNewMessage = !isMyMessage && myself?.lastReadMessageId !== data.lastMessageId;

                // ✅ 用 Map 記錄每個房間的已讀資訊（id + timestamp）
                // ⚠️ members 的 lastReadMessageId 欄位名稱待截圖確認，先沿用
                if (myself) {
                    // ✅ members 欄位確認: lastReadMessageId (string), lastReadAt (ISO字串)
                    this.lastReadMap.set(String(data.id), {
                        id: myself.lastReadMessageId ?? null,
                        timestamp: myself.lastReadAt ?? null
                    });
                }
                if (target) {
                    this.partnerReadMap.set(String(data.id), {
                        id: target.lastReadMessageId ?? null
                    });
                }

                const item = document.createElement('div');
                item.className = 'chat-item';
                item.dataset.roomId = data.id;
                item.innerHTML = `
                    <div class="d-flex align-items-center">
                        <div class="chat-avatar">
                            <img src="${target?.photoURL || '../image/default-avatar.png'}"
                                 alt="${target?.name}的照片"
                                 style="width: 45px; height: 45px; border-radius: 50px;">
                        </div>
                        <div class="flex-grow-1">
                            <h6 class="mb-0 roomName">${target?.name ?? '未知'}</h6>
                            <small class="text-muted lastMessage">${this.getLastMessageText(data.lastMessage)}</small>
                        </div>
                        <span class="unread-dot ${isNewMessage ? '' : 'd-none'}" style="
                            width: 10px; height: 10px;
                            background: red;
                            border-radius: 50%;
                            flex-shrink: 0;
                        "></span>
                    </div>`;
                chatList.appendChild(item);
            });

            // ✅ 用 cloneNode 斷開舊的 click listener，避免重複綁定
            const newChatList = chatList.cloneNode(true);
            chatList.parentNode.replaceChild(newChatList, chatList);
            newChatList.addEventListener('click', (e) => {
                const item = e.target.closest('.chat-item');
                if (!item) return;
                this.switchRoom(item.dataset.roomId, item.querySelector('.roomName').textContent);
            });

        } catch (err) {
            console.error('聊天室列表載入失敗', err);
        }
    }

    async switchRoom(roomId, targetName) {
        if (this.readObserver) this.readObserver.disconnect();
        if (this.isMobile) { this.hideSidebar(); this.showChatMain(); }

        this.currentRoomId = roomId;
        this.currentRoomName = targetName;
        this.hasMore = true;

        document.querySelectorAll('.chat-item').forEach(i => i.classList.remove('active'));
        document.querySelector(`[data-room-id="${roomId}"]`)?.classList.add('active');
        document.querySelector('.chat-header h6').textContent = targetName;

        const container = document.getElementById('messagesContainer');
        this.isInitialLoading = true;
        container.innerHTML = '';

        // ✅ GET /api/chat/history?room=&limit=&before=
        const before = new Date().toISOString();
        const history = await this.backend.getHistory(roomId, 50, before);

        if (history.data?.length > 0) {
            const roomRead = this.lastReadMap.get(String(roomId));
            const lastReadTimestamp = roomRead?.timestamp ?? null;

            // ✅ id 是 string，用 timestamp 排序
            const messages = history.data.sort((a, b) =>
                new Date(a.timestamp) - new Date(b.timestamp)
            );
            const firstUnread = lastReadTimestamp
                ? messages.find(m => m.timestamp > lastReadTimestamp)
                : null; // 沒有已讀紀錄 → 捲到最底部

            messages.forEach(msg => {
                if (firstUnread && msg.id === firstUnread.id) {
                    const divider = document.createElement('div');
                    divider.className = 'unread-divider';
                    divider.innerText = '以下為未讀訊息';
                    container.appendChild(divider);
                }
                this.renderMessage(msg);
            });

            // 等 DOM 渲染完畢再捲動
            requestAnimationFrame(() => {
                this.scrollToFirstUnread(firstUnread);
                // 用 setTimeout 確保 scrollToFirstUnread 觸發的 scroll 事件
                // 在 isInitialLoading 重置前被攔截，避免誤觸 loadMoreMessages
                setTimeout(() => { this.isInitialLoading = false; }, 100);
            });

            // ✅ 初始載入時套用對方已讀狀態
            const partnerRead = this.partnerReadMap.get(String(roomId));
            if (partnerRead?.id) this.updateReadReceipts(partnerRead.id);
        } else {
            container.innerHTML = '<p class="text-center text-muted mt-3">沒有訊息</p>';
            this.isInitialLoading = false;
        }

        this.connectSSE(); // SSE 已在 init() 開啟，此處為 idempotent 保護
    }

    scrollToFirstUnread(firstUnread) {
        const container = document.getElementById('messagesContainer');
        if (!firstUnread) {
            container.scrollTop = container.scrollHeight;
            return;
        }
        const el = container.querySelector(`[data-message-id="${firstUnread.id}"]`);
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
        else container.scrollTop = container.scrollHeight;
    }

    // ✅ 帳號層級 SSE：只連線一次，接收所有聊天室的事件
    connectSSE() {
        if (this.eventSource) return; // 已連線，不重複開啟

        this.eventSource = new EventSource(
            `${this.backend.baseUrl}/api/chat/stream`,
            { withCredentials: true }
        );

        this.eventSource.addEventListener('newMessage', (event) => {
            const data = JSON.parse(event.data);
            // ✅ 只在目前開啟的聊天室才渲染訊息
            if (String(data.room) === String(this.currentRoomId)) {
                this.renderMessage(data);
                this.playNotificationSound();
            }
            // ✅ 更新對應聊天室列表項目的最後一則訊息文字與未讀紅點
            const chatItem = document.querySelector(`[data-room-id="${data.room}"]`);
            if (chatItem) {
                const lastMsgEl = chatItem.querySelector('.lastMessage');
                if (lastMsgEl) {
                    const newText = this.getLastMessageText(data);
                    lastMsgEl.textContent = newText;
                    // typing 計時器進行中時，同步更新 originalText，避免計時器結束後覆蓋回舊文字
                    if (lastMsgEl.dataset.originalText !== undefined) {
                        lastMsgEl.dataset.originalText = newText;
                    }
                }
                if (data.username !== this.username) {
                    chatItem.querySelector('.unread-dot')?.classList.remove('d-none');
                }
            }

            // ✅ 通知外層頁面的 chaticon 顯示紅點
            if (data.username !== this.username) {
                window.parent?.dispatchEvent(new CustomEvent('chatUnread'));
            }
        });

        this.eventSource.addEventListener('typing', (event) => {
            const data = JSON.parse(event.data);
            this.username = localStorage.getItem('username');
            if (data.username === this.username) return;
            // ✅ 只在目前開啟的聊天室才顯示輸入中提示
            if (String(data.room) === String(this.currentRoomId)) {
                this.showTyping();
            }

            // ✅ 在對應聊天室列表也顯示「對方正在輸入...」
            const chatItem = document.querySelector(`[data-room-id="${data.room}"]`);
            if (chatItem) {
                const lastMsgEl = chatItem.querySelector('.lastMessage');
                if (lastMsgEl) {
                    if (!lastMsgEl.dataset.originalText) {
                        lastMsgEl.dataset.originalText = lastMsgEl.textContent;
                    }
                    lastMsgEl.textContent = '對方正在輸入...';
                    clearTimeout(this.typingListTimer);
                    this.typingListTimer = setTimeout(() => {
                        lastMsgEl.textContent = lastMsgEl.dataset.originalText || '';
                        delete lastMsgEl.dataset.originalText;
                    }, 1000);
                }
            }
        });

        this.eventSource.addEventListener('read', (event) => {
            const data = JSON.parse(event.data);
            const isSelf = data.username === this.username;

            if (isSelf) {
                // ✅ 自己已讀：移除聊天室列表的未讀 badge，通知外層清除紅點
                document.querySelector(`[data-room-id="${data.room}"]`)
                    ?.querySelector('.unread-dot')?.classList.add('d-none');
                window.parent?.dispatchEvent(new CustomEvent('chatRead'));
            } else {
                // ✅ 對方已讀：更新目前聊天室訊息的「已讀」標記
                if (String(data.room) === String(this.currentRoomId)) {
                    this.updateReadReceipts(data.lastReadMessageId);
                }
            }
        });

        this.eventSource.addEventListener('ping', () => {});
        this.eventSource.addEventListener('ready', (event) => {
            console.log('SSE ready:', JSON.parse(event.data));
        });

        this.eventSource.onerror = () => {
            this.eventSource?.close();
            this.eventSource = null;
        };
    }

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
        await this.backend.sendMessage(this.currentRoomId, text);
        input.value = '';
    }

    renderMessage(data, prepend = false) {
        // ✅ attachments 是陣列，有內容才視為圖片訊息
        if (Array.isArray(data.attachments) && data.attachments.length > 0) {
            this.appendImageMessage({
                id: data.id,
                attachments: data.attachments,  // 直接傳陣列
                username: data.username,
                photoURL: data.photoURL,
                timestamp: data.timestamp
            }, prepend);
            return;
        }

        const container = document.getElementById('messagesContainer');
        this.username = localStorage.getItem('username');
        const isSelf = this.username === data.username;
        const timestamp = new Date(data.timestamp).toLocaleTimeString('zh-TW', {
            hour: '2-digit', minute: '2-digit', hour12: false
        });

        const div = document.createElement('div');
        div.className = `message ${isSelf ? 'message-self' : 'message-other'}`;
        div.dataset.timestamp = data.timestamp;  // ISO 字串，用於 markAsRead
        div.dataset.messageId = data.id;          // string
        div.innerHTML = `
            ${!isSelf ? `<div class="message-avatar"><img src="${data.photoURL || '../image/default-avatar.png'}" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;"/></div>` : ''}
            <div class="message-content">
                <div class="d-flex align-items-end">
                    ${isSelf ? `
                    <div class="d-flex flex-column align-items-center me-2">
                        <i class="bi bi-check2-all read-receipt d-none" style="font-size: 0.8rem; color: #4CAF50;"></i>
                        <small class="text-muted" style="font-size: 0.75rem;">${timestamp}</small>
                    </div>` : ''}
                    <div class="message-text">${this.escapeHtml(data.message)}</div>
                    ${isSelf ? '' : `<small class="text-muted ms-2" style="font-size: 0.75rem;">${timestamp}</small>`}
                </div>
            </div>`;

        if (prepend) {
            container.prepend(div);
        } else {
            container.appendChild(div);
            if (!this.isInitialLoading) {
                container.scrollTop = container.scrollHeight;
            }
        }
        this.detectRead(div);
        return div;
    }

    // ✅ 對方讀到 lastReadMessageId 為止，顯示自己訊息上的打勾圖示
    updateReadReceipts(lastReadMessageId) {
        if (!lastReadMessageId) return;
        const container = document.getElementById('messagesContainer');
        const selfMsgs = [...container.querySelectorAll('.message-self, .imgmessage.message-self')];

        for (const el of selfMsgs) {
            el.querySelector('.read-receipt')?.classList.remove('d-none');
            if (el.dataset.messageId === lastReadMessageId) break;
        }
    }

    showTyping() {
        const indicator = document.getElementById('typingIndicator');
        indicator.style.display = 'block';
        indicator.innerHTML = `<small>對方正在輸入...</small>`;
        clearTimeout(this.typingTimer);
        this.typingTimer = setTimeout(() => { indicator.style.display = 'none'; }, 1000);
    }

    detectRead(element) {
        this.readObserver.observe(element);
    }

    async loadMoreMessages() {
        const container = document.getElementById('messagesContainer');
        if (!this.hasMore || this.isLoading || this.isInitialLoading) return;

        const firstMsgEl = container.querySelector('.message, .imgmessage');
        if (!firstMsgEl) return;
        const before = firstMsgEl.dataset.timestamp;
        const oldScrollHeight = container.scrollHeight;

        try {
            this.isLoading = true;
            const history = await this.backend.getHistory(this.currentRoomId, 50, before);

            if (history.data?.length > 0) {
                // 由新到舊排序後反向 prepend，確保畫面順序正確
                const sorted = history.data.sort((a, b) =>
                    new Date(b.timestamp) - new Date(a.timestamp)
                );
                for (const msg of sorted) {
                    this.renderMessage(msg, true);
                }
                container.scrollTop = container.scrollHeight - oldScrollHeight;
                if (history.data.length < 50) {
                    this.hasMore = false;
                    this.renderNoMoreHint(container);
                }
            } else {
                this.hasMore = false;
                this.renderNoMoreHint(container);
            }
        } catch (err) {
            console.error('載入更多訊息失敗', err);
        } finally {
            this.isLoading = false;
        }
    }

    renderNoMoreHint(container) {
        if (container.querySelector('.nohistory')) return;
        const el = document.createElement('div');
        el.className = 'text-center text-muted nohistory';
        el.textContent = '沒有更多對話紀錄了';
        container.prepend(el);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

let chatRoomList = null;
window.addEventListener('load', () => {
    openChatRoomList(null);
});

function openChatRoomList(roomId) {
    if (!chatRoomList) {
        chatRoomList = new ChatRoomList(roomId);
        // ✅ init() 內部已經會呼叫 switchRoom(currentRoomId)，這裡不要再呼叫一次
        chatRoomList.init();
    } else if (roomId) {
        chatRoomList.switchRoom(roomId);
    }
}

async function openChatWithTarget(targetUserId) {
    if (!targetUserId) return alert('無法開啟聊天室，缺少 User ID');
    const chatService = new ChatBackendService();
    try {
        const res = await chatService.createRoom(targetUserId);
        const roomId = res?.data?.room?.id;
        openChatRoomList(roomId);
    } catch (err) {
        console.error(err);
    }
}