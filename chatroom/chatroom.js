class ChatRoomList {
    constructor(initialRoomId = null) {
        this.backend = new ChatBackendService();
        this.currentRoomId = initialRoomId;
        this.currentRoomName = '';
        this.eventSource = null;
        this.username = localStorage.getItem('username') || '';
        this.userId = localStorage.getItem('uid');
        this.auth = new BackendService();
        this.isMobile = window.innerWidth < 768;
        this.lightbox = null;
        this.pendingImage = null;
        this.hasMore = true;
        this.isLoading = false;
        this.sendImagebtn = document.getElementById('send-image-btn');
        this.previewArea = document.getElementById('image-upload');
        this.input = document.getElementById('messageInput');
        this.submitBtn = document.querySelector('#messageForm button[type="submit"]');
        this.isSending = false;
        this.alreadyInit = false;

        // 每個房間各自記錄 lastReadMessageId 和 lastReadTimestamp
        this.lastReadMap = new Map(); // roomId -> { id, timestamp }（自己的已讀進度）
        this.partnerReadMap = new Map(); // roomId -> { id }（對方的已讀進度）
        this.partnerInfoMap = new Map(); // roomId -> { name, photoURL }（對方的個人資訊）

        this.officialRoomsSet = new Set(); // 記錄官方頻道房間 ID

        this.markReadTimer = null;
        this.readObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                const msgId = entry.target.dataset.messageId;
                const msgTimestamp = entry.target.dataset.timestamp;
                if (!msgId || !msgTimestamp) return;

                const roomRead = this.lastReadMap.get(String(this.currentRoomId));

                // id 是 string，比較時用字串比較會有問題，改用 timestamp 比較
                if (msgTimestamp <= (roomRead?.timestamp ?? '')) return;

                // 更新本地已讀進度到最新可見訊息
                this.lastReadMap.set(String(this.currentRoomId), {
                    id: msgId,
                    timestamp: msgTimestamp
                });
                this.readObserver.unobserve(entry.target);

                // 防抖：多則訊息同時進入視窗只送一次 API（帶最新 timestamp）
                clearTimeout(this.markReadTimer);
                this.markReadTimer = setTimeout(() => {
                    const latest = this.lastReadMap.get(String(this.currentRoomId));
                    if (latest?.timestamp) {
                        // ✅ API: PATCH /api/chat/rooms/{roomId}/read
                        // body: { readAt: "最新可見訊息的 timestamp" }
                        this.backend.markAsRead(this.currentRoomId, latest.timestamp);
                    }
                }, 300);
            });
        }, { root: document.getElementById('messagesContainer'), threshold: 0 });
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
                </div>
                <span class="preview-hint">可在下方輸入文字一起傳送</span>`;
            container.appendChild(preview);
        };
        reader.readAsDataURL(file);
    }

    async sendImage(file, caption = '') {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async () => {
                try {
                    await this.backend.sendAttach(this.currentRoomId, reader.result, caption);
                    resolve();
                } catch (err) {
                    console.error('發送圖片錯誤:', err);
                    reject(err);
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // 圖片 + 文字 caption 合併泡泡
    appendCombinedMessage(data, prepend = false) {
        const container = document.getElementById('messagesContainer');
        const wrapper = document.createElement('div');
        const isSelf = data.isSelf === true || data.username === this.username;
        wrapper.className = `imgmessage ${isSelf ? 'message-self' : 'message-other'}`;
        wrapper.dataset.timestamp = data.timestamp;
        wrapper.dataset.messageId = data.id ?? '';

        const time = new Date(data.timestamp).toLocaleTimeString('zh-TW', {
            hour: '2-digit', minute: '2-digit', hour12: false
        });
        const imageUrl = Array.isArray(data.attachments) ? data.attachments[0] : '';
        const partnerPhoto = this.officialRoomsSet.has(String(this.currentRoomId))
            ? '../webP/treasurehub.webp'
            : (this.partnerInfoMap.get(String(this.currentRoomId))?.photoURL || data.photoURL || '../image/default-avatar.png');

        wrapper.innerHTML = `
            ${!isSelf ? `<div class="message-avatar"><img src="${partnerPhoto}" style="width:30px;height:30px;border-radius:50%;object-fit:cover;"/></div>` : ''}
            <div class="message-content">
                <div class="d-flex align-items-end">
                    ${isSelf ? `
                    <div class="d-flex flex-column align-items-center me-2">
                        <i class="bi bi-check2-all read-receipt d-none" style="font-size:0.8rem;color:#4CAF50;"></i>
                        <small class="text-muted" style="font-size:0.75rem;">${time}</small>
                    </div>` : ''}
                    <div class="combined-bubble">
                        <a href="${imageUrl}" data-pswp-width="auto" data-pswp-height="auto"
                           target="_blank" class="image-link">
                            <img src="${imageUrl}" alt="Image" loading="lazy">
                        </a>
                        <div class="combined-caption">${this.escapeHtml(data.message)}</div>
                    </div>
                    ${isSelf ? '' : `<small class="text-muted ms-2" style="font-size:0.75rem;">${time}</small>`}
                </div>
            </div>`;

        if (prepend) {
            container.prepend(wrapper);
        } else {
            container.appendChild(wrapper);
            requestAnimationFrame(() => {
                if (!this.isInitialLoading) container.scrollTop = container.scrollHeight;
            });
        }

        const tempImg = new Image();
        tempImg.onload = () => {
            const link = wrapper.querySelector('.image-link');
            if (link) {
                link.setAttribute('data-pswp-width', tempImg.naturalWidth);
                link.setAttribute('data-pswp-height', tempImg.naturalHeight);
            }
            this.initPhotoSwipeGallery();
            if (!prepend && !this.isInitialLoading) container.scrollTop = container.scrollHeight;
        };
        tempImg.src = imageUrl;
        this.detectRead(wrapper);
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

        const partnerPhoto = this.officialRoomsSet.has(String(this.currentRoomId))
            ? '../webP/treasurehub.webp'
            : (this.partnerInfoMap.get(String(this.currentRoomId))?.photoURL || data.photoURL || '../image/default-avatar.png');
        imgWrapper.innerHTML = `
            ${!isSelf ? `<div class="message-avatar"><img src="${partnerPhoto}" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;"/></div>` : ''}
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

        // Close fullscreen chatroom on mobile
        const closeChatBtn = document.getElementById('closeChatFullscreen');
        if (closeChatBtn) {
            // Show button only when embedded in a mobile-sized parent window
            const updateCloseBtn = () => {
                const isMobileParent = window !== window.parent && window.outerWidth <= 991;
                closeChatBtn.style.display = isMobileParent ? 'inline-flex' : 'none';
            };
            updateCloseBtn();
            window.addEventListener('resize', updateCloseBtn);
            closeChatBtn.addEventListener('click', () => {
                window.parent?.postMessage({ type: 'closeChat' }, '*');
            });
        }

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
                const isOfficial = data.type === 'OFFICIAL';
                if (isOfficial) this.officialRoomsSet.add(String(data.id));
                const target = isOfficial ? null : data.members.find(m => m.name !== this.username);
                const myself = isOfficial ? null : data.members.find(m => m.name === this.username);

                const roomName   = isOfficial ? (data.officialChannel?.name ?? '官方帳號') : (target?.name ?? '未知');
                const roomAvatar = isOfficial ? '../webP/treasurehub.webp' : (target?.photoURL || '../image/default-avatar.png');

                const isMyMessage  = data.lastMessage?.username === myself?.name;
                const isNewMessage = !isOfficial && !isMyMessage && myself?.lastReadMessageId !== data.lastMessageId;

                // ✅ 用 Map 記錄每個房間的已讀資訊（id + timestamp）
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
                    this.partnerInfoMap.set(String(data.id), {
                        name: target.name ?? '未知用戶',
                        photoURL: target.photoURL || '../image/default-avatar.png',
                        id: target.id ?? target.accountId ?? target.userId ?? null
                    });
                }

                const item = document.createElement('div');
                item.className = 'chat-item';
                item.dataset.roomId = data.id;
                item.innerHTML = `
                    <div class="d-flex align-items-center">
                        <div class="chat-avatar">
                            <img src="${roomAvatar}"
                                 alt="${this.escapeHtml(roomName)}"
                                 style="width: 45px; height: 45px; border-radius: 50px; object-fit: cover; object-position: center;${isOfficial ? ' border: 2px solid #004b97;' : ''}">
                        </div>
                        <div class="flex-grow-1">
                            <h6 class="mb-0 roomName">${this.escapeHtml(roomName)}${isOfficial ? ' <span style="font-size:0.6rem; background:#004b97; color:#fff; border-radius:4px; padding:1px 5px; vertical-align:middle;">官方</span>' : ''}</h6>
                            <small class="text-muted lastMessage">${this.escapeHtml(this.getLastMessageText(data.lastMessage))}</small>
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
        const info = this.partnerInfoMap.get(String(roomId));
        const resolvedName = targetName || info?.name || '未知用戶';
        this.currentRoomName = resolvedName;
        this.hasMore = true;

        document.querySelectorAll('.chat-item').forEach(i => i.classList.remove('active'));
        document.querySelector(`[data-room-id="${roomId}"]`)?.classList.add('active');
        document.querySelector('.chat-header h6').textContent = resolvedName;

        // ✅ 官方頻道：停用輸入區域
        const isOfficialRoom = this.officialRoomsSet.has(String(roomId));
        this.input.disabled = isOfficialRoom;
        this.sendImagebtn.disabled = isOfficialRoom;
        this.previewArea.disabled = isOfficialRoom;
        this.input.placeholder = isOfficialRoom ? '官方頻道不支援傳送訊息' : '輸入訊息...';
        this.input.style.backgroundColor = isOfficialRoom ? '#f5f5f5' : '';

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
                ? messages.find(m => m.timestamp > lastReadTimestamp && m.username !== this.username)
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
                if (String(data.userId) !== String(this.userId)) {
                    chatItem.querySelector('.unread-dot')?.classList.remove('d-none');
                }
            }

            // ✅ 通知外層頁面的 chaticon 顯示紅點
            if (String(data.userId) !== String(this.userId)) {
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
            const partnerInfo = this.partnerInfoMap.get(String(data.room));
            const isPartnerRead = partnerInfo?.id != null
                ? String(data.userId) === String(partnerInfo.id)
                : data.username !== this.username; // fallback: ID 欄位不明時改用 username

            if (isPartnerRead) {
                // ✅ 對方已讀：更新目前聊天室訊息的「已讀」標記
                if (String(data.room) === String(this.currentRoomId)) {
                    this.updateReadReceipts(data.lastReadMessageId);
                }
            } else {
                // ✅ 自己已讀：移除聊天室列表的未讀 badge，通知外層清除紅點
                document.querySelector(`[data-room-id="${data.room}"]`)
                    ?.querySelector('.unread-dot')?.classList.add('d-none');
                window.parent?.dispatchEvent(new CustomEvent('chatRead'));
            }
        });

        // ✅ 官方公告廣播
        this.eventSource.addEventListener('broadcast', (event) => {
            const data = JSON.parse(event.data);
            this.renderBroadcast(data);
            // 通知外層頁面顯示未讀紅點
            window.parent?.dispatchEvent(new CustomEvent('chatUnread'));
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
        if (this.isSending) return;
        const input = document.getElementById('messageInput');
        const text = input.value.trim();
        const hasImage = !!this.pendingImage;
        const hasText = !!text;
        if (!hasImage && !hasText) return;
        if (!this.currentRoomId) return;

        // 鎖定，防止重複送出
        this.isSending = true;
        if (this.submitBtn) this.submitBtn.disabled = true;

        // 立即清除輸入狀態，提升回應感
        const imageFile = this.pendingImage;
        if (hasImage) {
            this.pendingImage = null;
            document.querySelector('.preview')?.remove();
            this.previewArea.value = '';
        }
        if (hasText) input.value = '';

        try {
            if (hasImage && hasText) {
                // 圖片 + 文字：一次送出（caption 帶入文字）
                await this.sendImage(imageFile, text);
            } else if (hasImage) {
                await this.sendImage(imageFile);
            } else {
                await this.backend.sendMessage(this.currentRoomId, text);
            }
        } finally {
            this.isSending = false;
            if (this.submitBtn) this.submitBtn.disabled = false;
        }
    }

    renderMessage(data, prepend = false) {
        // ✅ attachments 是陣列，有內容才視為圖片訊息
        if (Array.isArray(data.attachments) && data.attachments.length > 0) {
            if (data.message && data.message.trim()) {
                // 圖片 + 文字 caption：合併顯示
                this.appendCombinedMessage(data, prepend);
            } else {
                this.appendImageMessage({
                    id: data.id,
                    attachments: data.attachments,
                    username: data.username,
                    photoURL: data.photoURL,
                    timestamp: data.timestamp
                }, prepend);
            }
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
        const partnerPhoto = this.officialRoomsSet.has(String(this.currentRoomId))
            ? '../webP/treasurehub.webp'
            : (this.partnerInfoMap.get(String(this.currentRoomId))?.photoURL || data.photoURL || '../image/default-avatar.png');
        div.innerHTML = `
            ${!isSelf ? `<div class="message-avatar"><img src="${partnerPhoto}" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;"/></div>` : ''}
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
        if (element.classList.contains('message-self')) return;
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

    // ✅ 官方公告：顯示為置中系統訊息
    renderBroadcast(data) {
        const container = document.getElementById('messagesContainer');
        if (!container) return;

        const time = data.timestamp
            ? new Date(data.timestamp).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
            : '';

        // ✅ attachments 可能是陣列或字串，統一取第一個有效值
        const broadcastImg = Array.isArray(data.attachments)
            ? (data.attachments[0] || null)
            : (data.attachments || data.attachment || data.imageUrl || null);

        const el = document.createElement('div');
        el.className = 'broadcast-msg';
        el.innerHTML = `
            <div class="broadcast-inner">
                <div class="broadcast-label">📢 官方公告</div>
                <div class="broadcast-text">${this.escapeHtml(data.message || '')}</div>
                ${broadcastImg ? `<img src="${broadcastImg}" class="broadcast-img" alt="公告圖片">` : ''}
                ${time ? `<div class="broadcast-time">${time}</div>` : ''}
            </div>`;
        container.appendChild(el);
        container.scrollTop = container.scrollHeight;
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
        if (chatRoomList.partnerInfoMap.has(String(roomId))) {
            chatRoomList.switchRoom(roomId);
        } else {
            chatRoomList.loadRooms().then(() => chatRoomList.switchRoom(roomId));
        }
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

// ── 訊息主題功能 ──
(function initMessageTheme() {
    const THEME_KEY = 'chatBubbleTheme';
    const root = document.documentElement;

    function hexToRgba(hex, alpha) {
        var full = hex.replace('#', '');
        if (full.length === 3) full = full[0]+full[0]+full[1]+full[1]+full[2]+full[2];
        var r = parseInt(full.slice(0,2),16);
        var g = parseInt(full.slice(2,4),16);
        var b = parseInt(full.slice(4,6),16);
        if (isNaN(r)||isNaN(g)||isNaN(b)) return null;
        return 'rgba('+r+','+g+','+b+','+alpha+')';
    }

    function applyTheme(from, to) {
        root.style.setProperty('--primary-color', from);
        root.style.setProperty('--secondary-color', to);
        // 訊息容器背景設為所選顏色的淡色調
        var tint = hexToRgba(from, 0.07);
        if (tint) root.style.setProperty('--chat-bg-tint', tint);
    }

    // 恢復已儲存的主題
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) {
        try {
            const { from, to } = JSON.parse(saved);
            if (from && to) applyTheme(from, to);
        } catch(e) {}
    }

    const panel     = document.getElementById('themePanel');
    const overlay   = document.getElementById('themePanelOverlay');
    const openBtn   = document.getElementById('openThemePanel');
    const closeBtn  = document.getElementById('closeThemePanel');
    const swatches  = document.querySelectorAll('.theme-swatch');
    const customRow = document.getElementById('customColorRow');
    const color1    = document.getElementById('customColor1');
    const color2    = document.getElementById('customColor2');
    const applyBtn  = document.getElementById('applyCustomColor');

    if (!panel) return;

    function markActive(id) {
        swatches.forEach(s => s.classList.toggle('active', s.dataset.id === id));
    }

    function syncActiveState() {
        const s = localStorage.getItem(THEME_KEY);
        if (!s) { markActive('default'); return; }
        try { const { id } = JSON.parse(s); markActive(id || 'default'); }
        catch(e) { markActive('default'); }
    }

    function openPanel() {
        syncActiveState();
        panel.style.display = 'block';
        overlay.style.display = 'block';
    }
    function closePanel() {
        panel.style.display = 'none';
        overlay.style.display = 'none';
        customRow.style.display = 'none';
    }

    openBtn?.addEventListener('click', (e) => { e.preventDefault(); openPanel(); });
    closeBtn?.addEventListener('click', closePanel);
    overlay?.addEventListener('click', closePanel);

    swatches.forEach(swatch => {
        swatch.addEventListener('click', () => {
            const id   = swatch.dataset.id;
            const from = swatch.dataset.from;
            const to   = swatch.dataset.to;

            if (id === 'custom') {
                customRow.style.display = 'flex';
                markActive('custom');
                return;
            }
            customRow.style.display = 'none';
            markActive(id);
            applyTheme(from, to);
            localStorage.setItem(THEME_KEY, JSON.stringify({ id, from, to }));
        });
    });

    applyBtn?.addEventListener('click', () => {
        const from = color1.value;
        const to   = color2.value;
        applyTheme(from, to);
        localStorage.setItem(THEME_KEY, JSON.stringify({ id: 'custom', from, to }));
        closePanel();
    });
})();