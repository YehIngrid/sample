import BackendService from '../BackendService.js';
import ChatBackendService from './ChatBackendService.js';

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
        this.officialChannelToRoomMap = new Map(); // channelId → roomId（SSE channelId 轉換用）

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
        if (this.userId) {
            await this.loadRooms();
            this.connectSSE(); // 帳號層級 SSE，開啟一次即可
            if (this.currentRoomId) {
                // 直接聯絡對方：進入指定房間
                const roomEl = document.querySelector(`[data-room-id="${this.currentRoomId}"]`);
                if (roomEl) {
                    const name = roomEl.querySelector('.roomName')?.textContent || '未知';
                    await this.switchRoom(this.currentRoomId, name);
                }
            } else if (!this.isMobile && !new URLSearchParams(window.location.search).get('openChat')) {
                // 電腦版預設進入官方帳號房間（openChat 參數存在時跳過，由 openChatWithTarget 負責）
                const officialItem = [...document.querySelectorAll('.chat-item[data-room-id]')]
                    .find(el => this.officialRoomsSet.has(String(el.dataset.roomId)));
                if (officialItem) {
                    const name = officialItem.querySelector('.roomName')?.textContent || '拾貨寶庫提醒您';
                    await this.switchRoom(officialItem.dataset.roomId, name);
                }
            }
        } else {
            // 未登入：顯示登入提示，不載入任何資料
            const loader = document.getElementById('chatLoader');
            if (loader) loader.style.display = 'none';

            // 顯示返回按鈕
            const closeChatBtn = document.getElementById('closeChatFullscreen');
            if (closeChatBtn) {
                closeChatBtn.style.display = 'inline-flex';
                closeChatBtn.addEventListener('click', () => {
                    if (window !== window.parent) {
                        window.parent?.postMessage({ type: 'closeChat' }, '*');
                    } else {
                        const returnUrl = sessionStorage.getItem('chatroomReturnUrl');
                        if (returnUrl) { sessionStorage.removeItem('chatroomReturnUrl'); location.href = returnUrl; }
                        else history.back();
                    }
                });
            }

            const chatList = document.getElementById('chatList');
            if (chatList) {
                const redirect = encodeURIComponent(location.pathname + location.search);
                chatList.innerHTML = `
                    <div style="padding:32px 16px;text-align:center;color:#888;">
                        <i class="bi bi-lock" style="font-size:2.2rem;display:block;margin-bottom:12px;color:#004b97;"></i>
                        <p style="margin-bottom:16px;font-size:0.9rem;line-height:1.6;">請先登入<br>才能使用聊天室</p>
                        <button onclick="location.replace('../account/account.html?redirect=${redirect}')"
                           style="display:inline-block;padding:8px 24px;background:#004b97;color:#fff;border-radius:8px;border:none;font-size:0.85rem;cursor:pointer;">
                            前往登入
                        </button>
                    </div>`;
            }
            return;
        }
        window.addEventListener('resize', () => this.handleResize());
        this.bindEvents();
        this.putImage();
        this.closePreview();

        // 隱藏載入遮罩
        const loader = document.getElementById('chatLoader');
        if (loader) {
            loader.classList.add('hidden');
            setTimeout(() => loader.remove(), 350);
        }
    }

    // 未登入用戶：只載入官方公告頻道
    async loadPublicRooms() {
        const chatList = document.getElementById('chatList');
        if (!chatList) return;
        chatList.innerHTML = '';

        const officialHeader = document.createElement('div');
        officialHeader.className = 'px-3 py-1 fw-semibold text-muted border-bottom';
        officialHeader.style.cssText = 'font-size:0.72rem;background:aliceblue;letter-spacing:0.05em;';
        officialHeader.textContent = '官方公告';
        chatList.appendChild(officialHeader);

        try {
            const result = await this.backend.listOfficialChannels(1, 20);
            const channels = result.data?.items ?? result.data ?? [];
            if (!channels.length) {
                const empty = document.createElement('p');
                empty.className = 'text-center text-muted mt-2 mb-1';
                empty.style.fontSize = '0.85rem';
                empty.textContent = '目前沒有官方公告';
                chatList.appendChild(empty);
            } else {
                channels.forEach(ch => {
                    const item = document.createElement('div');
                    item.className = 'chat-item';
                    item.dataset.channelId = ch.id;
                    item.innerHTML = `
                        <div class="d-flex align-items-center">
                            <div class="chat-avatar">
                                <img src="../webP/treasurehub.webp" alt="${this.escapeHtml(ch.name ?? '官方公告')}"
                                     style="width:45px;height:45px;border-radius:50px;object-fit:cover;border:2px solid var(--primary-color,#004b97);">
                            </div>
                            <div class="flex-grow-1">
                                <h6 class="mb-0 roomName">${this.escapeHtml(ch.name ?? '官方公告')} <span class="broadcast-tag"><i class="bi bi-patch-check-fill"></i></span></h6>
                                <small class="text-muted lastMessage">${this.escapeHtml(ch.description ?? '官方公告頻道')}</small>
                            </div>
                        </div>`;
                    chatList.appendChild(item);
                    item.addEventListener('click', () => {
                        this.switchPublicChannel(ch.id, ch.name ?? '官方公告');
                    });
                });
            }
        } catch (err) {
            const errEl = document.createElement('p');
            errEl.className = 'text-center text-muted mt-2 mb-1';
            errEl.style.fontSize = '0.85rem';
            errEl.textContent = '載入官方公告失敗';
            chatList.appendChild(errEl);
        }

        // 私人訊息區：引導登入
        const privateHeader = document.createElement('div');
        privateHeader.className = 'px-3 py-1 fw-semibold text-muted border-bottom mt-2';
        privateHeader.style.cssText = 'font-size:0.72rem;background:aliceblue;letter-spacing:0.05em;';
        privateHeader.textContent = '私人訊息';
        chatList.appendChild(privateHeader);

        const loginPrompt = document.createElement('div');
        loginPrompt.className = 'text-center p-3';
        loginPrompt.innerHTML = `<p class="text-muted mb-0" style="font-size:0.88rem;">請<a href="../account/account.html" target="_parent" class="text-primary">登入</a>以查看私人訊息</p>`;
        chatList.appendChild(loginPrompt);
    }

    // 未登入用戶：切換官方公告頻道（用 channelId 讀廣播歷史）
    async switchPublicChannel(channelId, name) {
        if (this.isMobile) { this.hideSidebar(); this.showChatMain(); }
        this.currentRoomId = null;
        this.currentRoomName = name;
        document.querySelectorAll('.chat-item').forEach(i => i.classList.remove('active'));
        document.querySelector(`[data-channel-id="${channelId}"]`)?.classList.add('active');
        document.querySelector('.chat-header h6').innerHTML = `${this.escapeHtml(name)} <span class="broadcast-tag"><i class="bi bi-patch-check-fill"></i></span>`;
        const headerSubtitlePub = document.getElementById('chatHeaderSubtitle');
        if (headerSubtitlePub) headerSubtitlePub.style.display = '';
        this.input.disabled = true;
        this.sendImagebtn.disabled = true;
        this.input.placeholder = '官方頻道不支援傳送訊息';
        const quickReplyBar = document.getElementById('quickReplyBar');
        if (quickReplyBar) quickReplyBar.style.display = 'none';
        this.input.style.backgroundColor = '#f5f5f5';

        const container = document.getElementById('messagesContainer');
        container.innerHTML = '';
        this.isInitialLoading = true;
        try {
            const before = new Date().toISOString();
            const history = await this.backend.getBroadcast(channelId, 50, before);
            const items = (history.data?.items ?? history.data ?? [])
                .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            if (!items.length) {
                container.innerHTML = '<p class="text-center text-muted mt-3">沒有公告訊息</p>';
            } else {
                items.forEach(msg => this.renderBroadcast(msg));
                container.scrollTop = container.scrollHeight;
            }
        } catch (err) {
            container.innerHTML = '<p class="text-center text-muted mt-3">載入公告失敗</p>';
        } finally {
            this.isInitialLoading = false;
        }
    }

    initPhotoSwipeGallery() {
        import('https://cdn.jsdelivr.net/npm/photoswipe@5.4.4/dist/photoswipe-lightbox.esm.min.js')
            .then(module => {
                const PhotoSwipeLightbox = module.default;
                if (this.lightbox) this.lightbox.destroy();
                this.lightbox = new PhotoSwipeLightbox({
                    gallery: '#messagesContainer',
                    children: 'a.image-link',
                    pswpModule: () => import('https://cdn.jsdelivr.net/npm/photoswipe@5.4.4/dist/photoswipe.esm.min.js'),
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
                Swal.fire({ icon: 'warning', title: '圖片大小超過 5MB 限制' });
                return;
            }
            this.previewArea.value = ''; // 清空，下次選同張也能觸發
            this._openCropModal(file);
        });
    }

    _openCropModal(file) {
        const modalEl = document.getElementById('chatCropModal');
        const cropImg = document.getElementById('chatCropImg');
        const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);

        if (this._cropper) { this._cropper.destroy(); this._cropper = null; }

        const reader = new FileReader();
        reader.onload = (e) => {
            cropImg.src = e.target.result;
            bsModal.show();
        };
        reader.readAsDataURL(file);

        // modal 完全顯示後再初始化 Cropper，並確保圖片已載入
        modalEl.addEventListener('shown.bs.modal', () => {
            if (this._cropper) this._cropper.destroy();
            const init = () => {
                this._cropper = new Cropper(cropImg, {
                    viewMode: 1,
                    autoCropArea: 0.9,
                    responsive: true,
                });
            };
            if (cropImg.complete && cropImg.naturalWidth > 0) {
                init();
            } else {
                cropImg.addEventListener('load', init, { once: true });
            }
        }, { once: true });

        // 確認裁切
        document.getElementById('chatCropConfirm').onclick = async () => {
            if (!this._cropper) return;
            const canvas = this._cropper.getCroppedCanvas({ maxWidth: 1200, maxHeight: 1200 });
            bsModal.hide();
            canvas.toBlob(async (blob) => {
                const compressed = await compressImage(blob, 1200, 0.82);
                this.pendingImage = compressed;
                this.previewImage(compressed);
            }, 'image/webp', 0.92);
        };

        // 關閉時銷毀 cropper
        modalEl.addEventListener('hidden.bs.modal', () => {
            if (this._cropper) { this._cropper.destroy(); this._cropper = null; }
            cropImg.src = '';
        }, { once: true });
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
        try {
            await this.backend.sendMessage(this.currentRoomId, caption || undefined, [file]);
        } catch (err) {
            console.error('發送圖片錯誤:', err);
            throw err;
        }
    }

    // 圖片 + 文字 caption 合併泡泡
    appendCombinedMessage(data, prepend = false) {
        const container = document.getElementById('messagesContainer');
        const wrapper = document.createElement('div');
        const isSelf = data.isSelf === true || data.username === this.username;
        wrapper.className = `imgAndMessage ${isSelf ? 'message-self' : 'message-other'}`;
        wrapper.dataset.timestamp = data.timestamp;
        wrapper.dataset.messageId = data.id ?? '';

        const time = new Date(data.timestamp).toLocaleTimeString('zh-TW', {
            hour: '2-digit', minute: '2-digit', hour12: false
        });
        const imageUrl = Array.isArray(data.attachments)
            ? (data.attachments[0] || '')
            : (data.attachments || '');
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
                        <div class="combined-caption">${this.escapeHtml(data.message || '')}</div>
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
            if (!prepend && !this.isInitialLoading) {
                const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
                if (isNearBottom) container.scrollTop = container.scrollHeight;
            }
        };
        tempImg.src = imageUrl;
        this.detectRead(wrapper);
    }

    // ✅ attachments 是陣列 ["url1", ...]，取第一個元素顯示
    appendImageMessage(data, prepend = false) {
        this.hideEmptyHint();
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
            if (!prepend && !this.isInitialLoading) {
                const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
                if (isNearBottom) container.scrollTop = container.scrollHeight;
            }
        };
        tempImg.src = imageUrl;

        this.detectRead(imgWrapper);
    }

    setupMobileView() {
        if (this.isMobile) {
            this.showSidebar();
            this.hideChatMain();
        }
    }

    handleResize() {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth < 768;
        if (wasMobile !== this.isMobile) {
            if (this.isMobile) {
                // 切到手機：若有開著的房間保持聊天，否則顯示列表
                if (this.currentRoomId) {
                    this.hideSidebar();
                    this.showChatMain();
                } else {
                    this.showSidebar();
                    this.hideChatMain();
                }
            } else {
                // 切到電腦：移除所有 mobile-hidden，讓 Bootstrap 並排
                this.showSidebar();
                this.showChatMain();
            }
        }
    }

    showSidebar() {
        document.getElementById('sidebar')?.classList.remove('mobile-hidden');
        const nav = document.getElementById('bottomNav');
        if (nav) nav.style.display = '';
    }
    hideSidebar() { document.getElementById('sidebar')?.classList.add('mobile-hidden'); }
    showChatMain() {
        document.getElementById('chatMain')?.classList.remove('mobile-hidden');
        if (this.isMobile) {
            const nav = document.getElementById('bottomNav');
            if (nav) nav.style.display = 'none';
        }
    }
    hideChatMain() { document.getElementById('chatMain')?.classList.add('mobile-hidden'); }
    backToSidebar() { if (this.isMobile) { this.showSidebar(); this.hideChatMain(); } }

    bindEvents() {
        document.addEventListener('click', async (e) => {
            if (!e.target.closest('#backButton')) return;
            this.backToSidebar();
            if (this.userId) {
                await this.loadRooms();
            } else {
                await this.loadPublicRooms();
            }
        });

        // 關閉按鈕：iframe 內傳訊息給父頁面；獨立頁面直接 history.back()
        const closeChatBtn = document.getElementById('closeChatFullscreen');
        if (closeChatBtn) {
            const isInIframe = window !== window.parent;
            // 永遠顯示關閉按鈕（列表→聊天模式下一律需要）
            closeChatBtn.style.display = 'inline-flex';
            closeChatBtn.addEventListener('click', () => {
                if (isInIframe) {
                    window.parent?.postMessage({ type: 'closeChat' }, '*');
                } else {
                    const returnUrl = sessionStorage.getItem('chatroomReturnUrl');
                    if (returnUrl) {
                        sessionStorage.removeItem('chatroomReturnUrl');
                        window.location.href = returnUrl;
                    } else {
                        history.back();
                    }
                }
            });
        }


        // Esc：放大 → 縮小；縮小 → 關閉
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape' || window === window.parent) return;
            if (document.body.classList.contains('chat-maximized')) {
                document.body.classList.remove('chat-maximized');
                window.parent?.postMessage({ type: 'restoreChat' }, '*');
            } else {
                window.parent?.postMessage({ type: 'closeChat' }, '*');
            }
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
            // 捲動到底部按鈕
            const scrollToBtn = document.getElementById('scrollToBottomBtn');
            if (scrollToBtn) {
                const distFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
                scrollToBtn.style.display = distFromBottom > 200 ? 'flex' : 'none';
            }
        });

        // 捲動到底部按鈕點擊
        document.getElementById('scrollToBottomBtn')?.addEventListener('click', () => {
            container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        });

        // 字數提示
        const charCount = document.getElementById('msgCharCount');
        this.input.addEventListener('input', () => {
            const len = this.input.value.length;
            if (len > 0) {
                charCount.textContent = `${len} / 500`;
                charCount.style.display = 'block';
                charCount.classList.toggle('near-limit', len >= 450);
            } else {
                charCount.style.display = 'none';
            }
        });

        // 快速回覆
        document.getElementById('quickReplyBar')?.addEventListener('click', (e) => {
            const chip = e.target.closest('.quick-reply-chip');
            if (!chip) return;
            this.input.value = chip.dataset.text;
            this.input.focus();
            this.input.dispatchEvent(new Event('input')); // 觸發字數更新
        });

        // 自訂右鍵/長按選單
        const msgMenu = document.getElementById('msgContextMenu');
        let _menuTarget = null;

        const showMsgMenu = (x, y, msgText) => {
            _menuTarget = msgText;
            msgMenu.style.left = x + 'px';
            msgMenu.style.top  = y + 'px';
            msgMenu.style.display = 'block';
            // 防止選單超出視窗
            const rect = msgMenu.getBoundingClientRect();
            if (rect.right  > window.innerWidth)  msgMenu.style.left = (x - rect.width)  + 'px';
            if (rect.bottom > window.innerHeight) msgMenu.style.top  = (y - rect.height) + 'px';
        };
        const hideMsgMenu = () => {
            msgMenu.style.display = 'none';
            _menuTarget = null;
        };

        // 右鍵（桌機）
        container.addEventListener('contextmenu', (e) => {
            const msgText = e.target.closest('.message-text');
            if (!msgText) return;
            e.preventDefault();
            showMsgMenu(e.clientX, e.clientY, msgText);
        });

        // 長按（手機）
        let _longPressTimer;
        container.addEventListener('touchstart', (e) => {
            const msgText = e.target.closest('.message-text');
            if (!msgText) return;
            e.preventDefault(); // 必須同步呼叫，阻止系統長按選單
            const touch = e.touches[0];
            _longPressTimer = setTimeout(() => {
                showMsgMenu(touch.clientX, touch.clientY, msgText);
            }, 600);
        }, { passive: false }); // 必須 non-passive 才能 preventDefault
        container.addEventListener('touchend',  () => clearTimeout(_longPressTimer));
        container.addEventListener('touchmove', () => clearTimeout(_longPressTimer));

        // 點擊選單外關閉
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#msgContextMenu')) hideMsgMenu();
        });
        document.addEventListener('touchstart', (e) => {
            if (!e.target.closest('#msgContextMenu')) hideMsgMenu();
        }, { passive: true });

        // 選單操作
        document.getElementById('msgMenuCopy')?.addEventListener('click', () => {
            if (!_menuTarget) return;
            navigator.clipboard?.writeText(_menuTarget.textContent).then(() => {
                hideMsgMenu();
            });
        });
    }

    playNotificationSound() {
        const audio = new Audio('../sound/mes.mp3');
        audio.play().catch(() => {});
    }

    getLastMessageText(lastMsg, fallback = '尚無訊息') {
        if (!lastMsg) return fallback;
        if (lastMsg.message?.trim()) return lastMsg.message;
        // ✅ attachments 是陣列
        if (Array.isArray(lastMsg.attachments) && lastMsg.attachments.length > 0) return '傳送了一張圖片';
        if (typeof lastMsg.attachments === 'string' && lastMsg.attachments.trim()) return '傳送了一張圖片';
        return fallback;
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

            const officialRooms = [];
            const privateRooms = [];

            rooms.data.items.forEach(data => {
                if (data.type === 'OFFICIAL') {
                    officialRooms.push(data);
                } else {
                    privateRooms.push(data);
                }
            });

            const renderRoomItem = (data) => {
                const isOfficial = data.type === 'OFFICIAL';
                if (isOfficial) {
                    this.officialRoomsSet.add(String(data.id));
                    // ✅ 建立 channelId → roomId 對應，供 newBroadcast SSE 查找
                    const chId = data.officialChannel?.id ?? data.channelId;
                    if (chId) this.officialChannelToRoomMap.set(String(chId), String(data.id));
                }
                const target = isOfficial ? null : data.members?.find(m => m.name !== this.username);
                // ✅ 官方頻道也要找到自己，才能判斷已讀狀態
                const myself = data.members?.find(m => m.name === this.username);

                const roomName   = isOfficial ? (data.officialChannel?.name ?? '官方帳號') : (target?.name ?? '未知');
                const roomAvatar = isOfficial ? '../webP/treasurehub.webp' : (target?.photoURL || '../image/default-avatar.png');

                const isMyMessage  = data.lastMessage?.username === myself?.name;
                // ✅ 官方頻道：有 lastMessageId 且未讀就顯示紅點；一般頻道：對方訊息未讀才顯示
                const isNewMessage = data.lastMessageId != null
                    && myself?.lastReadMessageId !== data.lastMessageId
                    && (isOfficial || !isMyMessage);

                // ✅ 用 Map 記錄每個房間的已讀資訊（id + timestamp）
                if (myself) {
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
                                 style="width: 45px; height: 45px; border-radius: 50px; object-fit: cover; object-position: center;${isOfficial ? ' border: 2px solid var(--primary-color,#004b97);' : ''}">
                        </div>
                        <div class="flex-grow-1">
                            <h6 class="mb-0 roomName">${this.escapeHtml(roomName)}${isOfficial ? ' <span class="broadcast-tag"><i class="bi bi-patch-check-fill"></i></span>' : ''}</h6>
                            <small class="text-muted lastMessage">${this.escapeHtml(isOfficial
                                ? this.getLastMessageText(
                                    data.lastMessage ?? data.officialChannel?.lastMessage ?? data.lastBroadcast,
                                    data.officialChannel?.description || '官方公告頻道'
                                  )
                                : this.getLastMessageText(data.lastMessage)
                            )}</small>
                        </div>
                        <span class="unread-dot ${isNewMessage ? '' : 'd-none'}" style="
                            width: 10px; height: 10px;
                            background: red;
                            border-radius: 50%;
                            flex-shrink: 0;
                        "></span>
                    </div>`;
                chatList.appendChild(item);
            };

            // 官方公告 section
            if (officialRooms.length > 0) {
                const offHeader = document.createElement('div');
                offHeader.className = 'px-3 py-1 fw-semibold text-muted border-bottom';
                offHeader.style.cssText = 'font-size:0.72rem;background:#f8f9fa;letter-spacing:0.05em;';
                offHeader.innerHTML = '<img src="../svg/alarm.svg" style="width:13px;height:13px;margin-right:4px;vertical-align:middle;"> 官方公告';
                chatList.appendChild(offHeader);
                officialRooms.forEach(renderRoomItem);
            }

            // 私人訊息 section
            if (privateRooms.length > 0) {
                const pvtHeader = document.createElement('div');
                pvtHeader.className = 'px-3 py-1 fw-semibold text-muted border-bottom';
                pvtHeader.style.cssText = 'font-size:0.72rem;background:#f8f9fa;letter-spacing:0.05em;';
                pvtHeader.textContent = '私人訊息';
                chatList.appendChild(pvtHeader);
                privateRooms.forEach(renderRoomItem);
            }

            // ✅ 用 cloneNode 斷開舊的 click listener，避免重複綁定
            const newChatList = chatList.cloneNode(true);
            chatList.parentNode.replaceChild(newChatList, chatList);
            newChatList.addEventListener('click', (e) => {
                const item = e.target.closest('.chat-item');
                if (!item) return;
                this.switchRoom(item.dataset.roomId, item.querySelector('.roomName').textContent);
            });

            // 初始未讀檢查：通知外層 chaticon 顯示紅點
            const hasUnread = rooms.data.items.some(data => {
                const isOfficial = data.type === 'OFFICIAL';
                const myself = data.members?.find(m => m.name === this.username);
                const isMyMessage = data.lastMessage?.username === myself?.name;
                return data.lastMessageId != null
                    && myself?.lastReadMessageId !== data.lastMessageId
                    && (isOfficial || !isMyMessage);
            });
            if (hasUnread) window.parent?.dispatchEvent(new CustomEvent('chatUnread'));

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
        const isOfficialRoom = this.officialRoomsSet.has(String(roomId));
        const headerH6 = document.querySelector('.chat-header h6');
        const headerSubtitle = document.getElementById('chatHeaderSubtitle');
        if (isOfficialRoom) {
            headerH6.innerHTML = `${this.escapeHtml(resolvedName)} <span class="broadcast-tag"><i class="bi bi-patch-check-fill"></i></span>`;
            if (headerSubtitle) headerSubtitle.style.display = '';
        } else {
            headerH6.textContent = resolvedName;
            if (headerSubtitle) headerSubtitle.style.display = 'none';
        }

        // ✅ 官方頻道：停用輸入區域
        this.input.disabled = isOfficialRoom;
        this.sendImagebtn.disabled = isOfficialRoom;
        this.previewArea.disabled = isOfficialRoom;
        this.input.placeholder = isOfficialRoom ? '官方頻道不支援傳送訊息' : '輸入訊息...';
        this.input.style.backgroundColor = isOfficialRoom ? '#f5f5f5' : '';
        // 快速回覆只在私人聊天顯示
        const quickReplyBar = document.getElementById('quickReplyBar');
        if (quickReplyBar) quickReplyBar.style.display = isOfficialRoom ? 'none' : 'flex';

        // ✅ 開啟官方頻道：立即清除列表上的未讀紅點，並通知後端已讀
        if (isOfficialRoom) {
            document.querySelector(`[data-room-id="${roomId}"]`)
                ?.querySelector('.unread-dot')?.classList.add('d-none');
            const readAt = new Date().toISOString();
            this.backend.markAsRead(roomId, readAt).catch(() => {});
            // 官方頻道的 read SSE 事件不一定會回傳，直接通知外層清除紅點
            window.parent?.dispatchEvent(new CustomEvent('chatRead'));
        }

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

            // 等 DOM 與圖片都算好高度後再捲動
            setTimeout(() => {
                this.scrollToFirstUnread(firstUnread);
                setTimeout(() => { this.isInitialLoading = false; }, 200);
            }, 150);

            // ✅ 初始載入時套用對方已讀狀態
            const partnerRead = this.partnerReadMap.get(String(roomId));
            if (partnerRead?.id) this.updateReadReceipts(partnerRead.id);
        } else {
            container.innerHTML = '';
            this.showEmptyHint();
            this.isInitialLoading = false;
        }

        this.connectSSE(); // SSE 已在 init() 開啟，此處為 idempotent 保護
    }

    scrollToFirstUnread(firstUnread) {
        const container = document.getElementById('messagesContainer');
        if (!firstUnread) {
            container.scrollTo({ top: container.scrollHeight, behavior: 'instant' });
            return;
        }
        // 優先捲到 divider，讓「以下為未讀訊息」標記可見
        const divider = container.querySelector('.unread-divider');
        const target = divider || container.querySelector(`[data-message-id="${firstUnread.id}"]`);
        if (target) {
            // 用 offsetTop 直接計算相對容器的位置，避免 getBoundingClientRect 受到 scroll-behavior 動畫影響
            let offsetTop = 0;
            let el = target;
            while (el && el !== container) {
                offsetTop += el.offsetTop;
                el = el.offsetParent;
            }
            container.scrollTo({ top: offsetTop, behavior: 'instant' });
        } else {
            container.scrollTo({ top: container.scrollHeight, behavior: 'instant' });
        }
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

        // ✅ 官方公告廣播（舊事件，保留相容）
        this.eventSource.addEventListener('broadcast', (event) => {
            const data = JSON.parse(event.data);
            this.renderBroadcast(data);
            // 通知外層頁面顯示未讀紅點
            window.parent?.dispatchEvent(new CustomEvent('chatUnread'));
        });

        // ✅ 官方頻道廣播（新格式，含 channelId 及時間戳）
        this.eventSource.addEventListener('newBroadcast', (event) => {
            const data = JSON.parse(event.data);
            const channelId = String(data.channelId ?? data.room ?? '');
            // ✅ SSE 送來的是 channelId，DOM 上是 roomId；透過 Map 轉換
            const roomId = this.officialChannelToRoomMap.get(channelId) ?? channelId;

            // 若目前開著對應官方頻道，直接渲染廣播訊息
            if (roomId && String(this.currentRoomId) === roomId) {
                this.renderBroadcast(data);
            }

            // 更新聊天室列表對應頻道的最後訊息預覽
            if (roomId) {
                const chatItem = document.querySelector(`[data-room-id="${roomId}"]`);
                if (chatItem) {
                    const lastMsgEl = chatItem.querySelector('.lastMessage');
                    if (lastMsgEl) {
                        const msgText = data.message || (data.attachments?.length ? '傳送了一張圖片' : '官方公告');
                        lastMsgEl.innerHTML = '<img src="../svg/alarm.svg" style="width:12px;height:12px;margin-right:3px;vertical-align:middle;">';
                        lastMsgEl.appendChild(document.createTextNode(msgText));
                    }
                    // 非目前開著的房間才顯示未讀紅點
                    if (roomId !== String(this.currentRoomId)) {
                        chatItem.querySelector('.unread-dot')?.classList.remove('d-none');
                    }
                }
            }

            // 通知外層頁面顯示未讀紅點
            window.parent?.dispatchEvent(new CustomEvent('chatUnread'));
        });

        this.eventSource.addEventListener('ping', () => {});
        this.eventSource.addEventListener('ready', () => {
            document.getElementById('sseDisconnectBanner').style.display = 'none';
        });
        this.eventSource.onopen = () => {
            document.getElementById('sseDisconnectBanner').style.display = 'none';
        };

        this.eventSource.onerror = () => {
            this.eventSource?.close();
            this.eventSource = null;
            document.getElementById('sseDisconnectBanner').style.display = 'flex';
            clearTimeout(this._reconnectTimer);
            this._reconnectTimer = setTimeout(() => this.connectSSE(), 4000);
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
        if (hasText) {
            input.value = '';
            const charCount = document.getElementById('msgCharCount');
            if (charCount) charCount.style.display = 'none';
        }

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

    showEmptyHint() {
        const container = document.getElementById('messagesContainer');
        if (!container || container.querySelector('.empty-chat-hint')) return;
        const el = document.createElement('div');
        el.className = 'empty-chat-hint';
        el.innerHTML = `<i class="bi bi-chat-dots" style="font-size:2.5rem;color:var(--primary-color,#84a2d4);opacity:0.5;"></i>
            <p style="margin:0;">還沒有訊息<br><small>傳送第一則訊息開始對話吧！</small></p>`;
        container.appendChild(el);
    }

    hideEmptyHint() {
        document.querySelector('.empty-chat-hint')?.remove();
    }

    renderMessage(data, prepend = false) {
        this.hideEmptyHint();
        // 官方頻道訊息改用公告卡片風格
        if (this.officialRoomsSet.has(String(this.currentRoomId))) {
            this.renderBroadcast(data);
            return;
        }

        // ✅ attachments 可能是陣列或字串，統一判斷是否有圖片
        const hasAttachments = (Array.isArray(data.attachments) && data.attachments.length > 0)
            || (typeof data.attachments === 'string' && data.attachments.trim() !== '');
        if (hasAttachments) {
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
            const wasNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
            container.appendChild(div);
            if (wasNearBottom) {
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

        const channelName = data.channelName || data.channel?.name || '拾貨寶庫提醒您';

        const el = document.createElement('div');
        el.className = 'broadcast-msg';
        el.innerHTML = `
            <div class="broadcast-inner">
                <div class="broadcast-header">
                    <img src="../webP/treasurehub.webp" class="broadcast-avatar" alt="官方">
                    <span class="broadcast-label">${this.escapeHtml(channelName)}</span>
                    <span class="broadcast-tag"><i class="bi bi-patch-check-fill"></i></span>
                </div>
                ${broadcastImg ? `
                <a href="${broadcastImg}" class="image-link broadcast-img-link"
                   data-pswp-width="auto" data-pswp-height="auto" target="_blank">
                    <img src="${broadcastImg}" class="broadcast-img" alt="公告圖片" loading="lazy">
                </a>` : ''}
                ${data.message ? `<div class="broadcast-text">${this.escapeHtml(data.message)}</div>` : ''}
                ${time ? `<div class="broadcast-time">${time}</div>` : ''}
            </div>`;
        container.appendChild(el);
        container.scrollTop = container.scrollHeight;

        if (broadcastImg) {
            const tempImg = new Image();
            tempImg.onload = () => {
                const link = el.querySelector('.image-link');
                if (link) {
                    link.setAttribute('data-pswp-width', tempImg.naturalWidth);
                    link.setAttribute('data-pswp-height', tempImg.naturalHeight);
                }
                this.initPhotoSwipeGallery();
            };
            tempImg.src = broadcastImg;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ---- 圖片壓縮 helper ----
function compressImage(blob, maxWidth = 1200, quality = 0.82) {
    return new Promise(resolve => {
        const img = new Image();
        const url = URL.createObjectURL(blob);
        img.onload = () => {
            const scale = Math.min(1, maxWidth / img.width);
            const canvas = document.createElement('canvas');
            canvas.width  = Math.round(img.width  * scale);
            canvas.height = Math.round(img.height * scale);
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);
            canvas.toBlob(
                b => resolve(new File([b], 'image.webp', { type: 'image/webp' })),
                'image/webp', quality
            );
        };
        img.src = url;
    });
}

let chatRoomList = null;
let _chatReady = false;
let _pendingSellerId = null;

// 防止 bfcache 還原舊的未登入狀態
window.addEventListener('pageshow', (e) => {
    if (e.persisted) location.reload();
});

window.addEventListener('load', () => {
    // 優先標記 iframe 模式，讓 CSS 立即生效
    if (window.parent !== window) {
        document.body.classList.add('in-iframe');
    }
    openChatRoomList(null);
    _chatReady = true;
    // 通知父頁面 iframe 已準備好
    if (window.parent !== window) {
        window.parent.postMessage({ type: 'chatReady' }, '*');
    }
    // 如果有在 ready 前就收到的 pending 請求，立刻執行
    if (_pendingSellerId) {
        openChatWithTarget(_pendingSellerId);
        _pendingSellerId = null;
    }
    // 讀取 URL 參數，自動開啟與指定用戶的聊天（手機版跳轉時使用）
    const openChatId = new URLSearchParams(window.location.search).get('openChat');
    if (openChatId) {
        openChatWithTarget(openChatId);
    }
});

function openChatRoomList(roomId) {
    if (!chatRoomList) {
        chatRoomList = new ChatRoomList(roomId);
        chatRoomList.init();
    } else if (roomId) {
        chatRoomList.loadRooms().then(() => {
            const info = chatRoomList.partnerInfoMap.get(String(roomId));
            const name = info?.name || '聊天';
            chatRoomList.switchRoom(roomId, name);
        });
    }
}

window.openChatWithSeller = openChatWithTarget;

// 接收父頁面 postMessage 開啟聊天室
window.addEventListener('message', (e) => {
    if (e.data?.type === 'openChatWithSeller' && e.data.sellerId) {
        if (_chatReady) {
            openChatWithTarget(e.data.sellerId);
        } else {
            // 還沒 ready，先存起來等 load 完再執行
            _pendingSellerId = e.data.sellerId;
        }
    }
    // 父頁面觸發縮小（Esc）→ 同步 iframe 內狀態
    if (e.data?.type === 'restoreFromParent') {
        document.body.classList.remove('chat-maximized');
    }
});

async function openChatWithTarget(targetUserId) {
    if (!targetUserId) { Swal.fire({ icon: 'error', title: '無法開啟聊天室', text: '缺少 User ID' }); return; }
    const chatService = new ChatBackendService();
    try {
        const res = await chatService.createRoom(targetUserId);
        const roomId = res?.data?.room?.id || res?.data?.id;
        console.log('[Chat] createRoom response:', res?.data, 'roomId:', roomId);
        if (!roomId) {
            console.error('[Chat] createRoom 沒有回傳 roomId');
            return;
        }
        openChatRoomList(roomId);
    } catch (err) {
        console.error('[Chat] createRoom 失敗:', err);
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

    function applyTheme(from, to, dark = false) {
        root.style.setProperty('--primary-color', from);
        root.style.setProperty('--secondary-color', to);
        // 訊息容器背景設為所選顏色的淡色調
        var tint = hexToRgba(from, 0.07);
        if (tint) root.style.setProperty('--chat-bg-tint', tint);
        // 自己訊息泡泡背景
        var selfBg = hexToRgba(from, 0.18);
        if (selfBg) root.style.setProperty('--self-bubble-bg', selfBg);
        var selfBorder = hexToRgba(from, 0.38);
        if (selfBorder) root.style.setProperty('--self-bubble-border', selfBorder);
        // 聊天列表 active 背景 & 官方公告分隔線
        var listActive = hexToRgba(from, 0.1);
        if (listActive) root.style.setProperty('--list-active-bg', listActive);
        var borderTint = hexToRgba(from, 0.1);
        if (borderTint) root.style.setProperty('--primary-border-tint', borderTint);
        // Dark mode
        if (dark) {
            root.setAttribute('data-theme-dark', '1');
            root.style.setProperty('--chat-bg-tint', '#252536');
            root.style.setProperty('--list-active-bg', '#313244');
        } else {
            root.removeAttribute('data-theme-dark');
        }
    }

    // 恢復已儲存的主題
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) {
        try {
            const { from, to, dark } = JSON.parse(saved);
            if (from && to) applyTheme(from, to, !!dark);
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
            const dark = swatch.dataset.dark === '1';
            applyTheme(from, to, dark);
            localStorage.setItem(THEME_KEY, JSON.stringify({ id, from, to, dark }));
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