import '../default/default.js';
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

        this.pendingImage = null;
        this.hasMore = true;
        this.isLoading = false;
        this.sendImagebtn = document.getElementById('send-image-btn');
        this.previewArea = document.getElementById('image-upload');
        this.input = document.getElementById('messageInput');
        this.submitBtn = document.querySelector('#messageForm button[type="submit"]');
        this.isSending = false;
        this.alreadyInit = false;
        this.optimisticQueue = [];

        // 每個房間各自記錄 lastReadMessageId 和 lastReadTimestamp
        this.lastReadMap = new Map(); // roomId -> { id, timestamp }（自己的已讀進度）
        this.partnerReadMap = new Map(); // roomId -> { id }（對方的已讀進度）
        this.partnerInfoMap = new Map(); // roomId -> { name, photoURL }（對方的個人資訊）
        this.userInfoMap = new Map(); // userId -> { photoURL, role }（所有房間成員，供訊息頭像查詢）

        this.officialRoomsSet = new Set(); // 記錄官方頻道房間 ID
        this.officialChannelToRoomMap = new Map(); // channelId → roomId（SSE channelId 轉換用）
        this.supportRoomsSet = new Set(); // 客服頻道（官方但可雙向傳訊）
        this.mySupportRoomsSet = new Set(); // 自己是 SUPPORT 角色的房間
        this.supportTypeRoomsSet = new Set(); // type === 'SUPPORT' 的客服處理聊天室
        this.roomDataMap = new Map(); // roomId -> 原始 room data（供 info panel 使用）
        this.currentTicket = null; // 目前 SUPPORT 房間的客服單

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
        // 預設未登入，getMe 成功才視為已登入（避免 localStorage 殘留舊帳號被當成有效 session）
        this.userId = null;
        this.username = '';
        try {
            await this.auth.getMe();
            this.userId = localStorage.getItem('uid');
            this.username = localStorage.getItem('username') || '';
        } catch (_) {}
        this.setupMobileView();
        document.getElementById('messagesContainer')?.addEventListener('click', e => {
            const img = e.target.closest('.chat-image');
            if (!img) return;
            Swal.fire({ imageUrl: img.src, imageAlt: '圖片', showConfirmButton: false, showCloseButton: true, width: 'auto', padding: '0.5rem', background: '#111' });
        });
        if (this.userId && localStorage.getItem('emailVerify') === 'false') {
            // 已登入但信箱未驗證
            const loader = document.getElementById('chatLoader');
            if (loader) loader.style.display = 'none';
            const chatList = document.getElementById('chatList');
            if (chatList) {
                const redirect = encodeURIComponent(location.pathname + location.search);
                chatList.innerHTML = `
                    <div style="padding:32px 16px;text-align:center;color:#888;">
                        <i class="ti ti-mail-exclamation" style="font-size:2.2rem;display:block;margin-bottom:12px;color:#004b97;"></i>
                        <p style="margin-bottom:4px;font-size:0.9rem;font-weight:600;color:#333;">信箱尚未驗證</p>
                        <p style="margin-bottom:16px;font-size:0.85rem;line-height:1.6;color:#888;">完成電子信箱驗證後<br>即可使用聊天室</p>
                        <button onclick="location.replace('../account/account.html?redirect=${redirect}')"
                           style="display:inline-block;padding:8px 24px;background:#004b97;color:#fff;border-radius:8px;border:none;font-size:0.85rem;cursor:pointer;">
                            前往驗證
                        </button>
                    </div>`;
            }
            return;
        } else if (this.userId) {
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
                        window.parent?.postMessage({ type: 'closeChat' }, window.location.origin);
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
        this._initVisualViewport();
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
                empty.innerHTML = '<i class="ti ti-speakerphone" style="margin-right:4px;opacity:0.5;"></i>目前沒有官方公告';
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
            errEl.innerHTML = '<i class="ti ti-alert-circle" style="margin-right:4px;opacity:0.5;"></i>載入官方公告失敗';
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
        if (this.submitBtn) this.submitBtn.disabled = true;
        if (this.submitBtn) this.submitBtn.style.opacity = '0.35';
        this.input.placeholder = '官方頻道不支援傳送訊息';
        const quickReplyBar = document.getElementById('quickReplyBar');
        if (quickReplyBar) quickReplyBar.style.display = 'none';
        _syncQuickReplyPad(false);
        document.getElementById('time-picker-btn')?.style.setProperty('display', 'none');
        document.getElementById('location-picker-btn')?.style.setProperty('display', 'none');
        document.getElementById('timePicker').style.display = 'none';
        document.getElementById('locationPicker').style.display = 'none';
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
                container.innerHTML = '<p class="text-center text-muted mt-3"><i class="ti ti-speakerphone" style="margin-right:4px;opacity:0.5;"></i>沒有公告訊息</p>';
            } else {
                items.forEach(msg => this.renderBroadcast(msg));
                container.scrollTop = container.scrollHeight;
            }
        } catch (err) {
            container.innerHTML = '<p class="text-center text-muted mt-3"><i class="ti ti-alert-circle" style="margin-right:4px;opacity:0.5;"></i>載入公告失敗</p>';
        } finally {
            this.isInitialLoading = false;
        }
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
        const isSelf = data.isSelf === true || (this.userId ? String(data.userId) === String(this.userId) : data.username === this.username);
        wrapper.className = `imgAndMessage ${isSelf ? 'message-self' : 'message-other'}`;
        wrapper.dataset.timestamp = data.timestamp;
        wrapper.dataset.messageId = data.id ?? '';
        const _senderName1 = data.username || this.userInfoMap.get(String(data.userId))?.name || '';
        wrapper.dataset.username = _senderName1;

        const time = new Date(data.timestamp).toLocaleTimeString('zh-TW', {
            hour: '2-digit', minute: '2-digit', hour12: false
        });
        const imageUrl = Array.isArray(data.attachments)
            ? (data.attachments[0] || '')
            : (data.attachments || '');
        const _uInfo = this.userInfoMap.get(String(data.userId));
        const partnerPhoto = this.officialRoomsSet.has(String(this.currentRoomId))
            ? '../webP/treasurehub.webp'
            : (_uInfo !== undefined
                ? (_uInfo.photoURL || '../image/default-avatar.webp')
                : (this.partnerInfoMap.get(String(this.currentRoomId))?.photoURL || data.photoURL || '../image/default-avatar.webp'));
        const _msgAvatar1 = (() => {
            if (isSelf) return '';
            const _isDefault = partnerPhoto === '../image/default-avatar.webp';
            const _role = this.userInfoMap.get(String(data.userId))?.role ?? this.partnerInfoMap.get(String(this.currentRoomId))?.role;
            const _badge = (_role === 'ADMIN' || _role === 'MODERATOR') ? `<span class="role-badge role-badge-sm"><i class="ti ti-shield-check"></i></span>` : '';
            const _themeBg = (() => { try { return JSON.parse(localStorage.getItem('chatBubbleTheme'))?.from || '#abdad5'; } catch(e) { return '#abdad5'; } })();
            const _img = _isDefault ? `<div class="avatar-default-msg" style="width:30px;height:30px;border-radius:50%;background:${_themeBg};display:flex;align-items:center;justify-content:center;"><img src="../svg/default-avatar.svg" style="width:20px;height:20px;opacity:0.85;filter:brightness(10);"></div>` : `<img src="${partnerPhoto}" style="width:30px;height:30px;border-radius:50%;object-fit:cover;">`;
            return `<div class="message-avatar" style="position:relative;">${_img}${_badge}</div>`;
        })();

        wrapper.innerHTML = `
            ${_msgAvatar1}
            <div class="message-content">
                ${!isSelf ? `<small class="msg-sender-name">${this.escapeHtml(_senderName1)}</small>` : ''}
                <div class="d-flex align-items-end">
                    ${isSelf ? `
                    <div class="d-flex flex-row align-items-center gap-1 me-2">
                        <i class="bi bi-check2-all read-receipt d-none" style="font-size:0.8rem;color:#4CAF50;"></i>
                        <small class="text-muted msg-time" style="font-size:0.75rem;">${time}</small>
                    </div>` : ''}
                    <div class="combined-bubble">
                        <div class="combined-caption">${this.escapeHtml(data.message || '').replace(/\n/g, '<br>')}</div>
                        <img src="${imageUrl}" alt="Image" loading="lazy" class="chat-image" style="cursor:pointer;display:block;margin-top:6px;">
                    </div>
                    ${isSelf ? '' : `<small class="text-muted ms-2 msg-time" style="font-size:0.75rem;">${time}</small>`}
                </div>
            </div>`;

        const wasNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
        if (prepend) {
            container.prepend(wrapper);
        } else {
            container.appendChild(wrapper);
            this._insertDateDividerBefore(wrapper);
            this._applyGrouping(wrapper);
            if (!this.isInitialLoading && wasNearBottom) {
                requestAnimationFrame(() => { container.scrollTop = container.scrollHeight; });
            }
        }

        this.detectRead(wrapper);
    }

    // ✅ attachments 是陣列 ["url1", ...]，取第一個元素顯示
    appendImageMessage(data, prepend = false) {
        this.hideEmptyHint();
        const container = document.getElementById('messagesContainer');
        const imgWrapper = document.createElement('div');
        const isSelf = data.isSelf === true || (this.userId ? String(data.userId) === String(this.userId) : data.username === this.username);
        imgWrapper.className = `imgmessage ${isSelf ? 'message-self' : 'message-other'}`;
        imgWrapper.dataset.timestamp = data.timestamp;
        imgWrapper.dataset.messageId = data.id ?? '';
        const _senderName2 = data.username || this.userInfoMap.get(String(data.userId))?.name || '';
        imgWrapper.dataset.username = _senderName2;

        const time = new Date(data.timestamp).toLocaleTimeString('zh-TW', {
            hour: '2-digit', minute: '2-digit', hour12: false
        });

        // ✅ attachments 是陣列，取第一個
        const imageUrl = Array.isArray(data.attachments)
            ? data.attachments[0]
            : (data.attachments || '');

        const _uInfo = this.userInfoMap.get(String(data.userId));
        const partnerPhoto = this.officialRoomsSet.has(String(this.currentRoomId))
            ? '../webP/treasurehub.webp'
            : (_uInfo !== undefined
                ? (_uInfo.photoURL || '../image/default-avatar.webp')
                : (this.partnerInfoMap.get(String(this.currentRoomId))?.photoURL || data.photoURL || '../image/default-avatar.webp'));
        const _msgAvatar2 = (() => {
            if (isSelf) return '';
            const _isDefault = partnerPhoto === '../image/default-avatar.webp';
            const _role = this.userInfoMap.get(String(data.userId))?.role ?? this.partnerInfoMap.get(String(this.currentRoomId))?.role;
            const _badge = (_role === 'ADMIN' || _role === 'MODERATOR') ? `<span class="role-badge role-badge-sm"><i class="ti ti-shield-check"></i></span>` : '';
            const _themeBg = (() => { try { return JSON.parse(localStorage.getItem('chatBubbleTheme'))?.from || '#abdad5'; } catch(e) { return '#abdad5'; } })();
            const _img = _isDefault ? `<div class="avatar-default-msg" style="width:30px;height:30px;border-radius:50%;background:${_themeBg};display:flex;align-items:center;justify-content:center;"><img src="../svg/default-avatar.svg" style="width:20px;height:20px;opacity:0.85;filter:brightness(10);"></div>` : `<img src="${partnerPhoto}" style="width:30px;height:30px;border-radius:50%;object-fit:cover;">`;
            return `<div class="message-avatar" style="position:relative;">${_img}${_badge}</div>`;
        })();
        imgWrapper.innerHTML = `
            ${_msgAvatar2}
            <div class="message-content">
                ${!isSelf ? `<small class="msg-sender-name">${this.escapeHtml(_senderName2)}</small>` : ''}
                <div class="d-flex align-items-end">
                    ${isSelf ? `
                    <div class="d-flex flex-row align-items-center gap-1 me-2">
                        <i class="bi bi-check2-all read-receipt d-none" style="font-size: 0.8rem; color: #4CAF50;"></i>
                        <small class="text-muted msg-time" style="font-size: 0.75rem;">${time}</small>
                    </div>` : ''}
                    <div class="message-image-wrapper" style="margin-top: 8px;">
                        <img src="${imageUrl}" alt="Image" class="chat-image"
                             style="width: 200px; background: #f0f0f0; border-radius: 8px; cursor: pointer;"
                             loading="lazy">
                    </div>
                    ${isSelf ? '' : `<small class="text-muted me-2 msg-time" style="font-size: 0.75rem;">${time}</small>`}
                </div>
            </div>`;

        const wasNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
        if (prepend) {
            container.prepend(imgWrapper);
        } else {
            container.appendChild(imgWrapper);
            this._insertDateDividerBefore(imgWrapper);
            this._applyGrouping(imgWrapper);
            if (!this.isInitialLoading && wasNearBottom) {
                requestAnimationFrame(() => { container.scrollTop = container.scrollHeight; });
            }
        }

        this.detectRead(imgWrapper);
    }

    _renderOptimisticImage(localUrl, caption = null) {
        const container = document.getElementById('messagesContainer');
        const wasNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
        const wrapper = document.createElement('div');

        if (caption) {
            wrapper.className = 'imgAndMessage message-self optimistic-msg';
            wrapper.innerHTML = `
                <div class="message-content">
                    <div class="d-flex align-items-end">
                        <div class="d-flex flex-row align-items-center gap-1 me-2">
                            <small class="text-muted msg-time" style="font-size:0.75rem;">--:--</small>
                        </div>
                        <div class="combined-bubble">
                            <div style="position:relative;">
                                <img src="${localUrl}" alt="Image" class="chat-image" style="opacity:0.8;">
                                <div class="img-upload-spinner"></div>
                            </div>
                            <div class="combined-caption">${this.escapeHtml(caption).replace(/\n/g, '<br>')}</div>
                        </div>
                    </div>
                </div>`;
        } else {
            wrapper.className = 'imgmessage message-self optimistic-msg';
            wrapper.innerHTML = `
                <div class="message-content">
                    <div class="d-flex align-items-end">
                        <div class="d-flex flex-row align-items-center gap-1 me-2">
                            <small class="text-muted msg-time" style="font-size:0.75rem;">--:--</small>
                        </div>
                        <div class="message-image-wrapper" style="margin-top:8px;position:relative;">
                            <img src="${localUrl}" alt="Image" class="chat-image"
                                 style="width:200px;background:#f0f0f0;border-radius:8px;opacity:0.8;">
                            <div class="img-upload-spinner"></div>
                        </div>
                    </div>
                </div>`;
        }

        container.appendChild(wrapper);
        requestAnimationFrame(() => { container.scrollTop = container.scrollHeight; });
        return wrapper;
    }

    setupMobileView() {
        if (this.isMobile) {
            this.showSidebar();
            this.hideChatMain();
        }
    }

    _initVisualViewport() {
        if (!window.visualViewport) return;
        const chatMain = document.getElementById('chatMain');
        if (!chatMain) return;
        const update = () => {
            if (window.innerWidth < 768) {
                chatMain.style.height = window.visualViewport.height + 'px';
                chatMain.style.top = window.visualViewport.offsetTop + 'px';
            } else {
                chatMain.style.height = '';
                chatMain.style.top = '';
            }
        };
        window.visualViewport.addEventListener('resize', update);
        window.visualViewport.addEventListener('scroll', update);
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
                // 切回電腦：清除 mobile 的 padding-bottom
                const mc = document.querySelector('.messages-container');
                if (mc) mc.style.removeProperty('padding-bottom');
            }
        }
        // 手機鍵盤開關會觸發 resize（viewport 縮小），重新同步 padding
        if (this.isMobile) {
            const bar = document.getElementById('quickReplyBar');
            _syncQuickReplyPad(bar && bar.style.display !== 'none');
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
            // 清除 openSupport 參數，避免返回後再次自動開啟客服頻道
            const url = new URL(window.location.href);
            if (url.searchParams.has('openSupport')) {
                url.searchParams.delete('openSupport');
                history.replaceState(null, '', url.toString());
            }
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
                    window.parent?.postMessage({ type: 'closeChat' }, window.location.origin);
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
                window.parent?.postMessage({ type: 'restoreChat' }, window.location.origin);
            } else {
                window.parent?.postMessage({ type: 'closeChat' }, window.location.origin);
            }
        });

        document.getElementById('messageForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });

        // 桌機：Enter 送出，Shift+Enter 換行；IME 選字時不觸發送出
        // 手機：不攔截 Enter（讓 textarea 原生換行），改由送出按鈕送出
        const isTouchDevice = navigator.maxTouchPoints > 0;
        if (!isTouchDevice) {
            this.input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        // 隨內容自動撐高 + 偵測輸入中（throttle 3s，避免 429）
        let typingLastSent = 0;
        this.input.addEventListener('input', () => {
            this.input.style.height = 'auto';
            this.input.style.height = Math.min(this.input.scrollHeight, 120) + 'px';
            const now = Date.now();
            if (now - typingLastSent > 3000) {
                typingLastSent = now;
                this.backend.typing(this.currentRoomId).catch(() => {});
            }
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
            this.input.dispatchEvent(new Event('input'));
        });

        // ── 時間 / 地點選擇器 ──
        const timePicker = document.getElementById('timePicker');
        const locPicker  = document.getElementById('locationPicker');

        document.getElementById('time-picker-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            const open = timePicker.style.display !== 'none';
            locPicker.style.display = 'none';
            timePicker.style.display = open ? 'none' : 'block';
        });
        document.getElementById('location-picker-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            const open = locPicker.style.display !== 'none';
            timePicker.style.display = 'none';
            locPicker.style.display = open ? 'none' : 'block';
        });
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#timePicker') && !e.target.closest('#time-picker-btn'))
                timePicker.style.display = 'none';
            if (!e.target.closest('#locationPicker') && !e.target.closest('#location-picker-btn'))
                locPicker.style.display = 'none';
        });

        // 時間選擇 chips
        let _selDay = '', _selSlot = '';
        document.getElementById('timePickerDays')?.addEventListener('click', (e) => {
            const chip = e.target.closest('.picker-chip');
            if (!chip) return;
            document.querySelectorAll('#timePickerDays .picker-chip').forEach(c => c.classList.remove('selected'));
            chip.classList.add('selected');
            _selDay = chip.dataset.val;
        });
        document.getElementById('timePickerSlots')?.addEventListener('click', (e) => {
            const chip = e.target.closest('.picker-chip');
            if (!chip) return;
            document.querySelectorAll('#timePickerSlots .picker-chip').forEach(c => c.classList.remove('selected'));
            chip.classList.add('selected');
            _selSlot = chip.dataset.val;
            // 選了時段就清掉確切時間（互斥）
            const exactInput = document.getElementById('timePickerExact');
            if (exactInput) exactInput.value = '';
        });
        // 填入確切時間時，清除時段選擇（互斥）
        document.getElementById('timePickerExact')?.addEventListener('input', () => {
            document.querySelectorAll('#timePickerSlots .picker-chip').forEach(c => c.classList.remove('selected'));
            _selSlot = '';
        });
        document.getElementById('timePickerExactClear')?.addEventListener('click', () => {
            const exactInput = document.getElementById('timePickerExact');
            if (exactInput) exactInput.value = '';
        });
        document.getElementById('timePickerConfirm')?.addEventListener('click', () => {
            const exactVal = document.getElementById('timePickerExact')?.value;
            const timeStr = exactVal ? exactVal : _selSlot;
            if (!_selDay && !timeStr) return;
            if (this.input.disabled) return;
            const text = `面交時間：${_selDay}${timeStr}`;
            const existing = this.input.value.trim();
            this.input.value = existing ? `${existing} ${text}` : text;
            this.input.dispatchEvent(new Event('input'));
            timePicker.style.display = 'none';
            this.input.focus();
            _selDay = ''; _selSlot = '';
            const exactInput = document.getElementById('timePickerExact');
            if (exactInput) exactInput.value = '';
            document.querySelectorAll('#timePickerDays .picker-chip, #timePickerSlots .picker-chip').forEach(c => c.classList.remove('selected'));
        });

        // 地點選擇 chips
        let _selLoc = '';
        document.getElementById('locationPickerChips')?.addEventListener('click', (e) => {
            const chip = e.target.closest('.picker-chip');
            if (!chip) return;
            document.querySelectorAll('#locationPickerChips .picker-chip').forEach(c => c.classList.remove('selected'));
            chip.classList.add('selected');
            _selLoc = chip.dataset.val;
        });
        document.getElementById('locationPickerConfirm')?.addEventListener('click', () => {
            if (!_selLoc) return;
            if (this.input.disabled) return;
            const text = `面交地點：${_selLoc}`;
            const existing = this.input.value.trim();
            this.input.value = existing ? `${existing} ${text}` : text;
            this.input.dispatchEvent(new Event('input'));
            locPicker.style.display = 'none';
            this.input.focus();
            _selLoc = '';
            document.querySelectorAll('#locationPickerChips .picker-chip').forEach(c => c.classList.remove('selected'));
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

        // 長按 / 短按（手機）→ 顯示操作選單
        let _longPressTimer;
        let _touchStartTime = 0;
        let _touchTarget = null;
        let _touchX = 0;
        let _touchY = 0;

        container.addEventListener('touchstart', (e) => {
            const msgText = e.target.closest('.message-text');
            if (!msgText) return;
            // 連結直接放行，不攔截
            if (e.target.closest('a.chat-link') || e.target.closest('a.cs-bot-link-btn')) return;
            e.preventDefault(); // 阻止系統長按選單
            _touchStartTime = Date.now();
            _touchTarget = msgText;
            const touch = e.touches[0];
            _touchX = touch.clientX;
            _touchY = touch.clientY;
            _longPressTimer = setTimeout(() => {
                _touchTarget = null; // 長按已觸發，touchend 不需重複
                showMsgMenu(_touchX, _touchY, msgText);
            }, 500);
        }, { passive: false });

        container.addEventListener('touchend', () => {
            clearTimeout(_longPressTimer);
            // 短按（< 300ms）也觸發選單
            if (_touchTarget && Date.now() - _touchStartTime < 300) {
                showMsgMenu(_touchX, _touchY, _touchTarget);
            }
            _touchTarget = null;
        });

        container.addEventListener('touchmove', () => {
            clearTimeout(_longPressTimer);
            _touchTarget = null;
        });

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

        // 客服機器人選項
        document.getElementById('csBotMenu')?.addEventListener('click', (e) => {
            const btn = e.target.closest('.cs-bot-option');
            if (!btn) return;
            this.handleBotOption(btn.dataset.botOption, btn.textContent.trim());
        });
    }

    playNotificationSound() {
        if (localStorage.getItem('chatSound') === '0') return;
        const audio = new Audio('../sound/mes.mp3');
        audio.play().catch(() => {});
    }

    appendSystemMessage(text) {
        const container = document.getElementById('messagesContainer');
        if (!container) return;
        const div = document.createElement('div');
        div.className = 'system-message';
        div.textContent = text;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    appendBotMessage(text, actionHtml = '') {
        const container = document.getElementById('messagesContainer');
        if (!container) return;
        const time = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
        const div = document.createElement('div');
        div.className = 'message message-other';
        div.innerHTML = `
            <div class="message-avatar"><img src="../webP/treasurehub.webp" style="width:30px;height:30px;border-radius:50%;object-fit:cover;border:1.5px solid #004b97;"/></div>
            <div class="message-content">
                <div class="d-flex align-items-end">
                    <div class="message-text cs-bot-text">${text}${actionHtml ? `<div class="cs-bot-actions">${actionHtml}</div>` : ''}</div>
                    <small class="text-muted ms-2 msg-time" style="font-size:0.75rem;">${time}</small>
                </div>
            </div>`;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    appendUserChoice(label) {
        const container = document.getElementById('messagesContainer');
        if (!container) return;
        const time = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
        const div = document.createElement('div');
        div.className = 'message message-self';
        div.innerHTML = `
            <div class="message-content">
                <div class="d-flex align-items-end">
                    <div class="d-flex flex-row align-items-center gap-1 me-2">
                        <small class="text-muted msg-time" style="font-size:0.75rem;">${time}</small>
                    </div>
                    <div class="message-text">${this.escapeHtml(label)}</div>
                </div>
            </div>`;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    handleBotOption(option, label) {
        this.appendUserChoice(label);
        setTimeout(() => {
            switch (option) {
                case '1':
                    this.appendBotMessage(
                        '您可以在「我的帳戶」中查看所有訂單的詳情與目前狀態。',
                        `<a class="cs-bot-link-btn" href="../person/person.html" target="_parent"><i class="bi bi-person-lines-fill"></i> 前往我的帳戶</a>`
                    );
                    break;
                case '2':
                    this.appendBotMessage(
                        '建議在中興大學校內公開場所進行面交，例如中興湖旁、圖書館正門、惠蓀堂前等。<br>交易前請在聊天室與對方確認好時間與地點，並注意個人安全。'
                    );
                    break;
                case '3':
                    this.appendBotMessage(
                        '您可以前往常見問題頁面，查看關於帳號、商品、訂單等各類說明。',
                        `<a class="cs-bot-link-btn" href="../questions/questions.html" target="_parent"><i class="bi bi-book"></i> 前往常見問題</a>`
                    );
                    break;
            }
        }, 600);
    }

    startOnboarding() {
        const steps = [
            {
                targets: ['send-image-btn'],
                icon: 'bi-image',
                title: '傳送照片',
                desc: '點這裡可以傳送商品圖片，讓對方更清楚了解你要的東西。',
                arrowDir: 'down',
            },
            {
                targets: ['time-picker-btn', 'location-picker-btn'],
                icon: 'bi-clock',
                title: '快速填入面交時間 / 地點',
                desc: '點 🕐 選時間、點 📍 選地點，一鍵插入訊息，省去來回確認的麻煩。',
                arrowDir: 'down',
            },
            {
                targets: ['chatMoreBtn'],
                icon: 'bi-palette2',
                title: '自訂主題顏色',
                desc: '點右上角三點選單 → 訊息主題，選你喜歡的泡泡顏色！',
                arrowDir: 'up',
            },
        ];

        let cur = 0;
        const overlay  = document.getElementById('chatOnboarding');
        const tooltip  = document.getElementById('onboardingTooltip');
        const stepEl   = document.getElementById('onboardingStep');
        const iconEl   = document.getElementById('onboardingIcon');
        const titleEl  = document.getElementById('onboardingTitle');
        const descEl   = document.getElementById('onboardingDesc');
        const nextBtn  = document.getElementById('onboardingNext');
        const skipBtn  = document.getElementById('onboardingSkip');

        const show = (i) => {
            const step = steps[i];
            document.querySelectorAll('.onboarding-highlight').forEach(el => el.classList.remove('onboarding-highlight'));
            step.targets.forEach(id => document.getElementById(id)?.classList.add('onboarding-highlight'));

            stepEl.textContent  = `${i + 1} / ${steps.length}`;
            iconEl.innerHTML    = `<i class="bi ${step.icon}"></i>`;
            titleEl.textContent = step.title;
            descEl.textContent  = step.desc;
            nextBtn.textContent = i === steps.length - 1 ? '完成 🎉' : '下一步';

            // 定位 tooltip 到目標元素旁
            const target = document.getElementById(step.targets[0]);
            const rect   = target?.getBoundingClientRect();
            tooltip.className = `onboarding-tooltip arrow-${step.arrowDir}`;
            if (rect) {
                const TW = 238;
                const left = Math.max(8, Math.min(rect.left + rect.width / 2 - TW / 2, window.innerWidth - TW - 8));
                tooltip.style.left = left + 'px';
                if (step.arrowDir === 'down') {
                    tooltip.style.top  = 'auto';
                    tooltip.style.bottom = (window.innerHeight - rect.top + 12) + 'px';
                } else {
                    tooltip.style.bottom = 'auto';
                    tooltip.style.top    = (rect.bottom + 12) + 'px';
                }
                // 箭頭水平對齊目標中心
                const arrowLeft = Math.max(12, Math.min(rect.left + rect.width / 2 - left - 8, TW - 28));
                tooltip.style.setProperty('--ob-arrow-left', arrowLeft + 'px');
            }
            overlay.style.display = 'block';
        };

        const finish = () => this.finishOnboarding();
        nextBtn.onclick = () => { cur++; if (cur >= steps.length) finish(); else show(cur); };
        skipBtn.onclick = finish;

        show(0);
    }

    finishOnboarding() {
        localStorage.setItem('chatOnboardingDone', '1');
        document.querySelectorAll('.onboarding-highlight').forEach(el => el.classList.remove('onboarding-highlight'));
        document.getElementById('chatOnboarding').style.display = 'none';
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
                chatList.innerHTML = '<p class="text-center text-muted mt-3"><i class="ti ti-messages-off" style="margin-right:4px;opacity:0.5;"></i>無可用聊天室</p>';
                return;
            }

            const officialRooms = [];
            const privateRooms = [];
            const supportTypeRooms = [];

            rooms.data.items.forEach(data => {
                if (data.type === 'OFFICIAL') {
                    officialRooms.push(data);
                } else if (data.type === 'SUPPORT') {
                    supportTypeRooms.push(data);
                    this.supportTypeRoomsSet.add(String(data.id));
                } else {
                    privateRooms.push(data);
                }
            });

            const renderRoomItem = (data) => {
                this.roomDataMap.set(String(data.id), data);
                const isOfficial = data.type === 'OFFICIAL';
                if (isOfficial) {
                    this.officialRoomsSet.add(String(data.id));
                    // ✅ 建立 channelId → roomId 對應，供 newBroadcast SSE 查找
                    const chId = data.officialChannel?.id ?? data.channelId;
                    if (chId) this.officialChannelToRoomMap.set(String(chId), String(data.id));
                    // 客服頻道：名稱含「客服」的官方頻道支援雙向傳訊
                    const chName = data.officialChannel?.name ?? data.name ?? '';
                    if (chName.includes('客服') || chName.includes('小助手')) this.supportRoomsSet.add(String(data.id));
                }
                const isSupport = data.type === 'SUPPORT';
                const target = isOfficial ? null :
                    (data.members?.find(m => m.role === 'USER' && String(m.userId) !== String(this.userId))
                    ?? data.members?.find(m => String(m.userId) !== String(this.userId)));
                // ✅ 官方頻道也要找到自己，才能判斷已讀狀態
                const myself = data.members?.find(m => String(m.userId) === String(this.userId));
                if (myself?.role === 'SUPPORT') this.mySupportRoomsSet.add(String(data.id));

                // SUPPORT 房間：對方是客服人員（SUPPORT role），若還沒加入則顯示「等待客服人員加入」
                let roomName, roomAvatar;
                if (isOfficial) {
                    roomName   = data.officialChannel?.name ?? '官方帳號';
                    roomAvatar = '../webP/treasurehub.webp';
                } else if (isSupport) {
                    const agent = data.members?.find(m => m.role === 'SUPPORT' && String(m.userId) !== String(this.userId));
                    const userMember = data.members?.find(m => m.role === 'USER' && String(m.userId) !== String(this.userId));
                    // 若我是 USER，顯示客服人員名稱（或等待中）；若我是 SUPPORT，顯示提單用戶名稱
                    if (myself?.role === 'SUPPORT') {
                        roomName   = userMember?.name ?? target?.name ?? '用戶';
                        roomAvatar = userMember?.photoURL || target?.photoURL || '../image/default-avatar.webp';
                    } else {
                        roomName   = agent?.name ?? '等待客服人員加入';
                        roomAvatar = agent?.photoURL || '../image/default-avatar.webp';
                    }
                } else {
                    roomName   = target?.name ?? '未知';
                    roomAvatar = target?.photoURL || '../image/default-avatar.webp';
                }

                const isMyMessage  = data.lastMessage?.username === myself?.name;
                // ✅ 官方頻道：lastMessageId 可能在 officialChannel 上
                const lastMsgId = data.lastMessageId ?? (isOfficial ? data.officialChannel?.lastMessageId : null);
                // ✅ 官方頻道：有 lastMessageId 且未讀就顯示紅點；一般頻道：對方訊息未讀才顯示
                const isNewMessage = lastMsgId != null
                    && myself?.lastReadMessageId !== lastMsgId
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
                        photoURL: target.photoURL || '../image/default-avatar.webp',
                        id: target.id ?? target.accountId ?? target.userId ?? null,
                        role: target.role ?? null
                    });
                }
                // 將所有成員的頭像存入 userInfoMap，供訊息渲染時按 userId 查詢
                data.members?.forEach(m => {
                    if (m.userId && !this.userInfoMap.has(String(m.userId))) {
                        this.userInfoMap.set(String(m.userId), {
                            photoURL: m.photoURL || null,
                            role: m.role ?? null
                        });
                    }
                });

                const item = document.createElement('div');
                item.className = 'chat-item';
                item.dataset.roomId = data.id;
                const _isDefaultAvatar = roomAvatar === '../image/default-avatar.webp';
                const _targetRole = target?.role;
                const _avatarInner = _isDefaultAvatar
                    ? `<img src="../svg/default-avatar.svg" style="width:45px;height:45px;">`
                    : `<img src="${roomAvatar}" alt="${this.escapeHtml(roomName)}" style="width:45px;height:45px;border-radius:50%;object-fit:cover;object-position:center;${isOfficial ? 'border:2px solid var(--primary-color,#004b97);' : ''}">`;
                const _roleBadge = !isOfficial && (_targetRole === 'ADMIN' || _targetRole === 'MODERATOR')
                    ? `<span class="role-badge"><i class="ti ti-shield-check"></i></span>`
                    : '';
                const _hasAdmin = !isOfficial && data.members?.some(m => m.role === 'ADMIN' || m.role === 'MODERATOR');
                item.innerHTML = `
                    <div class="d-flex align-items-center">
                        <div class="chat-avatar">
                            ${_avatarInner}${_roleBadge}
                        </div>
                        <div class="flex-grow-1">
                            <h6 class="mb-0 roomName">${this.escapeHtml(roomName)}${isOfficial ? ' <span class="broadcast-tag"><i class="bi bi-patch-check-fill"></i></span>' : ''}</h6>
                            <small class="text-muted lastMessage">${this.escapeHtml(isOfficial
                                ? (data.officialChannel?.description || '官方公告頻道')
                                : this.getLastMessageText(data.lastMessage)
                            )}</small>
                            ${_hasAdmin ? `<small class="admin-in-chat-note"><i class="ti ti-shield-half"></i> 管理員已加入此對話</small>` : ''}
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

            // 客服處理 section
            if (supportTypeRooms.length > 0) {
                const supHeader = document.createElement('div');
                supHeader.className = 'px-3 py-1 fw-semibold text-muted border-bottom';
                supHeader.style.cssText = 'font-size:0.72rem;background:#f8f9fa;letter-spacing:0.05em;';
                supHeader.innerHTML = '<i class="bi bi-headset" style="margin-right:4px;"></i>客服處理';
                chatList.appendChild(supHeader);
                supportTypeRooms.forEach(renderRoomItem);
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

            // 載入客服單 badge
            this._loadTicketBadges();

            // ?openSupport=1：自動切換到客服頻道
            if (new URLSearchParams(window.location.search).get('openSupport') === '1') {
                const supportRoomId = [...this.supportRoomsSet][0];
                if (supportRoomId) {
                    const supportItem = document.querySelector(`[data-room-id="${supportRoomId}"]`);
                    const supportName = supportItem?.querySelector('.roomName')?.textContent || '客服小助手';
                    await this.switchRoom(supportRoomId, supportName);
                }
            }

            // 初始未讀檢查：通知外層 chaticon 顯示紅點
            const hasUnread = rooms.data.items.some(data => {
                const isOfficial = data.type === 'OFFICIAL';
                const myself = data.members?.find(m => String(m.userId) === String(this.userId));
                const isMyMessage = data.lastMessage?.username === myself?.name;
                return data.lastMessageId != null
                    && myself?.lastReadMessageId !== data.lastMessageId
                    && (isOfficial || !isMyMessage);
            });
            // 雙向同步：讓 parent 紅點狀態與實際 unread 一致
            window.parent?.dispatchEvent(new CustomEvent(hasUnread ? 'chatUnread' : 'chatRead'));

        } catch (err) {
            console.error('聊天室列表載入失敗', err);
        }
    }

    async switchRoom(roomId, targetName) {
        if (this.readObserver) this.readObserver.disconnect();
        // 清除 typing / read timers，避免舊房間的殘留操作
        clearTimeout(this.markReadTimer);
        clearTimeout(this.typingTimer);
        clearTimeout(this.typingListTimer);
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) typingIndicator.style.display = 'none';
        // 還原側邊欄被 typing 覆蓋的 lastMessage 文字
        document.querySelectorAll('[data-original-text]').forEach(el => {
            el.textContent = el.dataset.originalText;
            delete el.dataset.originalText;
        });
        if (this.isMobile) { this.hideSidebar(); this.showChatMain(); }
        document.getElementById('roomInfoPanel')?.classList.remove('open');
        document.getElementById('roomInfoOverlay')?.classList.remove('open');
        const _infoBody = document.getElementById('roomInfoBody');
        if (_infoBody) _infoBody.innerHTML = '';

        this.currentRoomId = roomId;
        const info = this.partnerInfoMap.get(String(roomId));
        const resolvedName = targetName || info?.name || '未知用戶';
        this.currentRoomName = resolvedName;
        this.hasMore = true;
        const _infoPanelTitle = document.getElementById('roomInfoPanelTitle');
        if (_infoPanelTitle) _infoPanelTitle.textContent = resolvedName;

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

        // 官方頻道（含客服）一律停用自由輸入；客服房間改用 bot 選單操作
        const isSupportRoom = this.supportRoomsSet.has(String(roomId));
        const disableInput = isOfficialRoom;
        this.input.disabled = disableInput;
        this.sendImagebtn.disabled = disableInput;
        this.previewArea.disabled = disableInput;
        if (this.submitBtn) this.submitBtn.disabled = disableInput;
        this.input.placeholder = isSupportRoom ? '請使用上方選單選擇服務項目' : (disableInput ? '官方頻道不支援傳送訊息' : '輸入訊息...');
        this.input.style.backgroundColor = disableInput ? '#f5f5f5' : '';
        if (this.submitBtn) this.submitBtn.style.opacity = disableInput ? '0.35' : '';
        // 快速回覆 / 面交工具只在私人聊天顯示
        const quickReplyBar = document.getElementById('quickReplyBar');
        if (quickReplyBar) quickReplyBar.style.display = isOfficialRoom ? 'none' : 'flex';
        _syncQuickReplyPad(!isOfficialRoom);
        const csBotMenu = document.getElementById('csBotMenu');
        if (csBotMenu) csBotMenu.style.display = isSupportRoom ? 'block' : 'none';
        const isSupportTypeRoom = this.supportTypeRoomsSet.has(String(roomId));
        const isMySupport = this.mySupportRoomsSet.has(String(roomId));
        const requestSupportBtn = document.getElementById('requestSupportBtn');
        const leaveSupportBtn = document.getElementById('leaveSupportBtn');
        // 聯絡客服：只在一般 DIRECT 聊天室顯示（非官方、非客服處理房間）
        if (requestSupportBtn) requestSupportBtn.style.display = (!isOfficialRoom && !isSupportTypeRoom) ? '' : 'none';
        // 結束支援：只在客服處理房間、且自己是 SUPPORT 角色時顯示
        if (leaveSupportBtn) leaveSupportBtn.style.display = (isSupportTypeRoom && isMySupport) ? '' : 'none';
        const _pickerDisplay = isOfficialRoom ? 'none' : '';
        document.getElementById('time-picker-btn')?.style.setProperty('display', _pickerDisplay);
        document.getElementById('location-picker-btn')?.style.setProperty('display', _pickerDisplay);
        if (isOfficialRoom) {
            document.getElementById('timePicker').style.display = 'none';
            document.getElementById('locationPicker').style.display = 'none';
        }

        // ✅ 開啟房間：立即清除列表上的未讀紅點
        document.querySelector(`[data-room-id="${roomId}"]`)
            ?.querySelector('.unread-dot')?.classList.add('d-none');
        window.parent?.dispatchEvent(new CustomEvent('chatRead'));
        if (isOfficialRoom) {
            // 官方頻道 read SSE 不一定回傳，主動送一次
            const readAt = new Date().toISOString();
            this.backend.markAsRead(roomId, readAt).catch(() => {});
        }

        const container = document.getElementById('messagesContainer');
        container.dataset.supportRoom = isSupportRoom ? '1' : '';
        this.isInitialLoading = true;
        container.innerHTML = '';

        // ✅ GET /api/chat/history?room=&limit=&before=
        // DIRECT 房間回傳 { roomId, members, history }；OFFICIAL 房間回傳扁平訊息陣列
        const before = new Date().toISOString();
        const history = await this.backend.getHistory(roomId, 50, before);

        const isDirectRoom = !this.officialRoomsSet.has(String(roomId));
        // 從 history 取出訊息陣列（DIRECT: data.history；OFFICIAL: data 本身）
        const rawMessages = isDirectRoom
            ? (history.data?.history ?? [])
            : (Array.isArray(history.data) ? history.data : []);

        // DIRECT 房間：從 history 的 members 更新 userInfoMap（含後來加入的客服人員）
        if (isDirectRoom && history.data?.members) {
            history.data.members.forEach(m => {
                if (m.userId) {
                    this.userInfoMap.set(String(m.userId), {
                        photoURL: m.user?.photoURL || null,
                        name: m.user?.name || null,
                        role: m.role ?? null
                    });
                }
            });
        }

        if (rawMessages.length > 0) {
            const roomRead = this.lastReadMap.get(String(roomId));
            const lastReadTimestamp = roomRead?.timestamp ?? null;

            // ✅ id 是 string，用 timestamp 排序
            const messages = rawMessages.sort((a, b) =>
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

        // 客服處理房間：載入客服單橫幅；其他房間隱藏（先做，讓 info panel 開啟時 ticket 已就緒）
        if (isSupportTypeRoom) {
            await this._loadSupportTicket(roomId);
        } else {
            this.currentTicket = null;
            const banner = document.getElementById('ticketBanner');
            if (banner) banner.style.display = 'none';
        }

        this.connectSSE(); // SSE 已在 init() 開啟，此處為 idempotent 保護

        // 客服頻道：顯示客服機器人歡迎訊息
        if (isSupportRoom) {
            setTimeout(() => {
                this.appendBotMessage('您好！我是拾貨寶庫客服助理 🤖<br>請點選下方按鈕，我將為您解答：');
            }, 200);
        }

        // 第一次進入非官方房間 → 顯示操作引導
        if (!this.officialRoomsSet.has(String(roomId)) && !localStorage.getItem('chatOnboardingDone')) {
            setTimeout(() => this.startOnboarding(), 400);
        }

        // 若從商品頁／通知進入，預填訊息
        if (_pendingProductCtx) {
            const { productName, productPrice, _rawMessage } = _pendingProductCtx;
            _pendingProductCtx = null;
            const priceText = productPrice ? `（NT$ ${Number(productPrice).toLocaleString()}）` : '';
            this.input.value = _rawMessage || `你好，我對「${productName}」有興趣${priceText}。`;
            this.input.dispatchEvent(new Event('input'));
            this.input.focus();
        }
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

    // ── 客服單 badge：顯示在聊天室列表 ──
    async _loadTicketBadges() {
        const STATUS_LABEL = { UNRESOLVED: '等待認領', CLAIMED: '處理中' };
        const STATUS_COLOR = { UNRESOLVED: '#e67e22', CLAIMED: '#004b97' };
        try {
            const res = await this.backend.getMyTickets();
            // API 可能回傳單筆 { data: {...} }、{ data: { items: [...] } } 或陣列
            let tickets;
            if (Array.isArray(res)) tickets = res;
            else if (Array.isArray(res?.data?.items)) tickets = res.data.items;
            else if (Array.isArray(res?.data)) tickets = res.data;
            else if (res?.data && typeof res.data === 'object') tickets = [res.data];
            else tickets = [];
            tickets.forEach(ticket => {
                const rId = ticket.roomId ?? ticket.room?.id ?? ticket.supportRoomId;
                if (!rId) return;
                const roomItem = document.querySelector(`[data-room-id="${rId}"]`);
                if (!roomItem) return;
                // 關閉的單不顯示
                if (ticket.status === 'RESOLVED' || ticket.status === 'ADJUDICATED') return;
                // 避免重複加
                roomItem.querySelector('.ticket-status-chip')?.remove();
                const label = STATUS_LABEL[ticket.status] ?? ticket.status;
                const color = STATUS_COLOR[ticket.status] ?? '#888';
                const chip = document.createElement('span');
                chip.className = 'ticket-status-chip';
                chip.style.cssText = `font-size:0.65rem;font-weight:700;border-radius:20px;padding:1px 8px;background:${color}15;color:${color};border:1px solid ${color}40;white-space:nowrap;margin-left:4px;`;
                chip.textContent = label;
                const unreadDot = roomItem.querySelector('.unread-dot');
                if (unreadDot) unreadDot.before(chip);
                else roomItem.querySelector('.d-flex.align-items-center')?.appendChild(chip);
            });
        } catch { /* 靜默失敗 */ }
    }

    // ── 客服單：載入並渲染橫幅 ──
    async _loadSupportTicket(roomId) {
        this.currentTicket = null;
        const banner = document.getElementById('ticketBanner');
        if (!banner) return;
        try {
            const res = await this.backend.getTicketsByRoom(roomId);
            const list = Array.isArray(res) ? res
                : Array.isArray(res?.data?.items) ? res.data.items
                : Array.isArray(res?.data) ? res.data
                : res?.data ? [res.data] : [];
            this.currentTicket = list[0] ?? null;
        } catch { /* 靜默失敗 */ }
        this._renderTicketBanner(this.currentTicket);
    }

    _renderTicketBanner(ticket) {
        const banner = document.getElementById('ticketBanner');
        if (!banner) return;
        if (!ticket) { banner.style.display = 'none'; return; }

        const STATUS_LABEL = { UNRESOLVED: '等待認領', CLAIMED: '處理中', RESOLVED: '已解決', ADJUDICATED: '已裁定' };
        const STATUS_COLOR = { UNRESOLVED: '#e67e22', CLAIMED: '#004b97', RESOLVED: '#27ae60', ADJUDICATED: '#8e44ad' };
        const status = ticket.status ?? 'UNRESOLVED';
        const statusLabel = STATUS_LABEL[status] ?? status;
        const statusColor = STATUS_COLOR[status] ?? '#888';
        const isClosed = status === 'RESOLVED' || status === 'ADJUDICATED';
        const isMySupport = this.mySupportRoomsSet.has(String(this.currentRoomId));
        const isClaimedByMe = ticket.claimedBy != null && String(ticket.claimedBy) === String(this.userId);

        let actionsHtml = '';
        if (!isClosed && isMySupport) {
            if (status === 'UNRESOLVED') {
                actionsHtml = `<button class="ticket-action-btn" id="ticketClaimBtn"><i class="bi bi-hand-index-thumb"></i> 認領</button>`;
            } else if (status === 'CLAIMED' && isClaimedByMe) {
                actionsHtml = `
                    <button class="ticket-action-btn ticket-action-resolve" id="ticketResolveBtn"><i class="bi bi-check-circle"></i> 解決</button>
                    <button class="ticket-action-btn ticket-action-adjudicate" id="ticketAdjudicateBtn"><i class="bi bi-scale"></i> 裁定</button>
                `;
            } else if (status === 'CLAIMED' && !isClaimedByMe) {
                actionsHtml = `<span style="font-size:0.72rem;color:#888;">已由其他客服認領</span>`;
            }
        }

        banner.innerHTML = `
            <div class="ticket-banner-info">
                <i class="bi bi-ticket-detailed-fill"></i>
                <span class="ticket-banner-reason" title="${this.escapeHtml(ticket.reason ?? '')}">原因：${this.escapeHtml(ticket.reason ?? '找客服問問題')}</span>
            </div>
            <div class="ticket-banner-right">
                <span class="ticket-status-badge" style="background:${statusColor}18;color:${statusColor};border:1px solid ${statusColor}40;">${statusLabel}</span>
                ${actionsHtml}
            </div>
        `;
        banner.style.display = 'flex';
    }

    // ✅ 帳號層級 SSE：只連線一次，接收所有聊天室的事件
    connectSSE() {
        if (!this.userId) return; // 未登入不建立 SSE 連線
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

        this.eventSource.addEventListener('stopTyping', (event) => {
            const data = JSON.parse(event.data);
            if (data.username === this.username) return;
            if (String(data.room) === String(this.currentRoomId)) {
                clearTimeout(this.typingTimer);
                const indicator = document.getElementById('typingIndicator');
                if (indicator) indicator.style.display = 'none';
                if (this._typingAudio) { this._typingAudio.pause(); this._typingAudio.currentTime = 0; }
            }
            const chatItem = document.querySelector(`[data-room-id="${data.room}"]`);
            if (chatItem) {
                const lastMsgEl = chatItem.querySelector('.lastMessage');
                if (lastMsgEl && lastMsgEl.dataset.originalText !== undefined) {
                    clearTimeout(this.typingListTimer);
                    lastMsgEl.textContent = lastMsgEl.dataset.originalText;
                    delete lastMsgEl.dataset.originalText;
                }
            }
        });

        this.eventSource.addEventListener('read', (event) => {
            const data = JSON.parse(event.data);
            const partnerInfo = this.partnerInfoMap.get(String(data.room));
            const isMeRead = this.userId
                ? String(data.userId) === String(this.userId)
                : data.username === this.username;
            const isPartnerRead = !isMeRead && (partnerInfo?.id != null
                ? String(data.userId) === String(partnerInfo.id)
                : data.username !== this.username);

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
                        const msgText = this.getLastMessageText(data, '官方公告');
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

        this.eventSource.addEventListener('memberJoin', (event) => {
            const data = JSON.parse(event.data);
            if (String(data.room) !== String(this.currentRoomId)) return;
            this.appendSystemMessage('管理員已加入聊天室');
        });

        this.eventSource.addEventListener('memberLeft', (event) => {
            const data = JSON.parse(event.data);
            if (String(data.room) !== String(this.currentRoomId)) return;
            this.appendSystemMessage('管理員已離開聊天室');
        });

        this.eventSource.addEventListener('ping', () => {});
        this.eventSource.addEventListener('ready', () => {
            document.getElementById('sseDisconnectBanner').style.display = 'none';
            _syncQuickReplyPad(document.getElementById('quickReplyBar')?.style.display !== 'none');
        });
        this.eventSource.onopen = () => {
            document.getElementById('sseDisconnectBanner').style.display = 'none';
            _syncQuickReplyPad(document.getElementById('quickReplyBar')?.style.display !== 'none');
        };

        this.eventSource.onerror = () => {
            this.eventSource?.close();
            this.eventSource = null;
            document.getElementById('sseDisconnectBanner').style.display = 'flex';
            _syncQuickReplyPad(document.getElementById('quickReplyBar')?.style.display !== 'none');
            clearTimeout(this._reconnectTimer);
            this._reconnectTimer = setTimeout(() => this.connectSSE(), 4000);
        };
    }

    async sendMessage() {
        if (this.isSending) return;
        if (this.input.disabled) return;
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
            input.style.height = 'auto';
            const charCount = document.getElementById('msgCharCount');
            if (charCount) charCount.style.display = 'none';
        }

        // Optimistic UI: 傳送照片前先渲染本地預覽
        if (hasImage) {
            const localUrl = URL.createObjectURL(imageFile);
            const optimisticEl = this._renderOptimisticImage(localUrl, hasText ? text : null);
            this.optimisticQueue.push({ el: optimisticEl, localUrl });
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
        // 官方頻道訊息改用公告卡片風格（客服頻道例外，用一般訊息渲染）
        if (this.officialRoomsSet.has(String(this.currentRoomId)) && !this.supportRoomsSet.has(String(this.currentRoomId))) {
            this.renderBroadcast(data);
            return;
        }

        // ✅ attachments 可能是陣列或字串，統一判斷是否有圖片
        const hasAttachments = (Array.isArray(data.attachments) && data.attachments.length > 0)
            || (typeof data.attachments === 'string' && data.attachments.trim() !== '');
        if (hasAttachments) {
            // 移除 optimistic 預覽泡泡（僅自己送出的訊息）
            const isSelfMsg = this.userId ? String(data.userId) === String(this.userId) : data.username === this.username;
            if (isSelfMsg && !prepend && this.optimisticQueue.length > 0) {
                const { el, localUrl } = this.optimisticQueue.shift();
                el.remove();
                URL.revokeObjectURL(localUrl);
            }
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
        this.userId = this.userId || localStorage.getItem('uid');
const isSelf = this.userId ? String(data.userId) === String(this.userId) : this.username === data.username;
        const timestamp = new Date(data.timestamp).toLocaleTimeString('zh-TW', {
            hour: '2-digit', minute: '2-digit', hour12: false
        });

        const div = document.createElement('div');
        div.className = `message ${isSelf ? 'message-self' : 'message-other'}`;
        div.dataset.timestamp = data.timestamp;  // ISO 字串，用於 markAsRead
        div.dataset.messageId = data.id;          // string
        // username 可能不在訊息本體內（新版 history API），從 userInfoMap 補齊
        const _senderName = data.username || this.userInfoMap.get(String(data.userId))?.name || '';
        div.dataset.username = _senderName;
        const _uInfo = this.userInfoMap.get(String(data.userId));
        const partnerPhoto = this.officialRoomsSet.has(String(this.currentRoomId))
            ? '../webP/treasurehub.webp'
            : (_uInfo !== undefined
                ? (_uInfo.photoURL || '../image/default-avatar.webp')
                : (this.partnerInfoMap.get(String(this.currentRoomId))?.photoURL || data.photoURL || '../image/default-avatar.webp'));
        const _msgAvatar3 = (() => {
            if (isSelf) return '';
            const _isDefault = partnerPhoto === '../image/default-avatar.webp';
            const _role = this.userInfoMap.get(String(data.userId))?.role ?? this.partnerInfoMap.get(String(this.currentRoomId))?.role;
            const _badge = (_role === 'ADMIN' || _role === 'MODERATOR') ? `<span class="role-badge role-badge-sm"><i class="ti ti-shield-check"></i></span>` : '';
            const _themeBg = (() => { try { return JSON.parse(localStorage.getItem('chatBubbleTheme'))?.from || '#abdad5'; } catch(e) { return '#abdad5'; } })();
            const _img = _isDefault ? `<div class="avatar-default-msg" style="width:30px;height:30px;border-radius:50%;background:${_themeBg};display:flex;align-items:center;justify-content:center;"><img src="../svg/default-avatar.svg" style="width:20px;height:20px;opacity:0.85;filter:brightness(10);"></div>` : `<img src="${partnerPhoto}" style="width:30px;height:30px;border-radius:50%;object-fit:cover;">`;
            return `<div class="message-avatar" style="position:relative;">${_img}${_badge}</div>`;
        })();
        div.innerHTML = `
            ${_msgAvatar3}
            <div class="message-content">
                ${!isSelf ? `<small class="msg-sender-name">${this.escapeHtml(_senderName)}</small>` : ''}
                <div class="d-flex align-items-end">
                    ${isSelf ? `
                    <div class="d-flex flex-row align-items-center gap-1 me-2">
                        <i class="bi bi-check2-all read-receipt d-none" style="font-size: 0.8rem; color: #4CAF50;"></i>
                        <small class="text-muted msg-time" style="font-size: 0.75rem;">${timestamp}</small>
                    </div>` : ''}
                    <div class="message-text">${this.linkify(this.escapeHtml(data.message).replace(/\n/g, '<br>'))}</div>
                    ${isSelf ? '' : `<small class="text-muted ms-2 msg-time" style="font-size: 0.75rem;">${timestamp}</small>`}
                </div>
            </div>`;

        if (prepend) {
            container.prepend(div);
        } else {
            const wasNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
            container.appendChild(div);
            this._insertDateDividerBefore(div);
            this._applyGrouping(div);
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
        // 從所有訊息（含對方訊息）裡找 lastReadMessageId 的位置，
        // 避免對方的 lastReadMessageId 指向自己送的訊息（不在 selfMsgs 裡），
        // 導致迴圈跑完整個陣列、錯誤地把所有自己的訊息都標成已讀。
        const allMsgs = [...container.querySelectorAll('[data-message-id]')];
        const readIdx = allMsgs.findIndex(el => el.dataset.messageId === lastReadMessageId);
        if (readIdx === -1) return;

        for (const el of allMsgs.slice(0, readIdx + 1)) {
            if (el.classList.contains('message-self')) {
                el.querySelector('.read-receipt')?.classList.remove('d-none');
            }
        }
    }

    showTyping() {
        const indicator = document.getElementById('typingIndicator');
        indicator.style.display = 'block';
        indicator.innerHTML = `<small>對方正在輸入...</small>`;
        clearTimeout(this.typingTimer);

        // 播放打字音效（只建一次，重複觸發時從頭播）
        if (localStorage.getItem('chatSound') !== '0') {
            if (!this._typingAudio) {
                this._typingAudio = new Audio('../sound/typing.mp3');
                this._typingAudio.volume = 0.5;
            }
            this._typingAudio.currentTime = 0;
            this._typingAudio.play().catch(() => {});
        }

        this.typingTimer = setTimeout(() => {
            indicator.style.display = 'none';
            if (this._typingAudio) {
                this._typingAudio.pause();
                this._typingAudio.currentTime = 0;
            }
        }, 1000);
    }

    // ✅ 同一分鐘同一人的訊息群組：隱藏前一則的時間、縮小間距、隱藏頭像
    _applyGrouping(el) {
        let prev = el.previousElementSibling;
        while (prev && !prev.dataset.messageId) prev = prev.previousElementSibling;
        if (!prev) return;

        const sameUser = prev.dataset.username === el.dataset.username;
        const sameMinute = prev.dataset.timestamp?.slice(0, 16) === el.dataset.timestamp?.slice(0, 16);
        if (!sameUser || !sameMinute) return;

        prev.classList.add('message-continues');
        prev.querySelector('.msg-time')?.classList.add('msg-time-hidden');
        el.classList.add('message-grouped');
    }

    _formatDateLabel(dateKey) {
        const today = new Date();
        const todayKey = today.toLocaleDateString('sv'); // "YYYY-MM-DD"
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = yesterday.toLocaleDateString('sv');
        if (dateKey === todayKey) return '今天';
        if (dateKey === yesterdayKey) return '昨天';
        const [year, month, day] = dateKey.split('-');
        if (year === String(today.getFullYear())) return `${parseInt(month)}月${parseInt(day)}日`;
        return `${year}年${parseInt(month)}月${parseInt(day)}日`;
    }

    // ✅ 若與前一則訊息跨天（或是第一則），在 el 前插入日期分隔線
    _insertDateDividerBefore(el) {
        let prev = el.previousElementSibling;
        while (prev && !prev.dataset.messageId) prev = prev.previousElementSibling;

        const curDate = el.dataset.timestamp?.slice(0, 10);
        const prevDate = prev?.dataset.timestamp?.slice(0, 10) ?? null;
        if (!curDate || curDate === prevDate) return;

        const divider = document.createElement('div');
        divider.className = 'date-divider';
        divider.innerHTML = `<span>${this._formatDateLabel(curDate)}</span>`;
        el.before(divider);
    }

    // ✅ 向上載入舊訊息後重新套用整批群組與日期分隔（prepend 後呼叫）
    regroupAll() {
        const container = document.getElementById('messagesContainer');
        container.querySelectorAll('.date-divider').forEach(el => el.remove());
        const msgs = [...container.querySelectorAll('[data-message-id]')];
        msgs.forEach(el => {
            el.classList.remove('message-continues', 'message-grouped');
            el.querySelector('.msg-time')?.classList.remove('msg-time-hidden');
        });
        for (let i = 0; i < msgs.length; i++) {
            this._insertDateDividerBefore(msgs[i]);
            if (i > 0) this._applyGrouping(msgs[i]);
        }
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

            // DIRECT 房間回傳 { roomId, members, history }；OFFICIAL 回傳扁平陣列
            const _isDirectRoom = !this.officialRoomsSet.has(String(this.currentRoomId));
            const msgs = _isDirectRoom
                ? (history.data?.history ?? [])
                : (Array.isArray(history.data) ? history.data : []);

            if (msgs.length > 0) {
                // 由新到舊排序後反向 prepend，確保畫面順序正確
                const sorted = msgs.sort((a, b) =>
                    new Date(b.timestamp) - new Date(a.timestamp)
                );
                for (const msg of sorted) {
                    this.renderMessage(msg, true);
                }
                this.regroupAll();
                container.scrollTop = container.scrollHeight - oldScrollHeight;
                if (msgs.length < 50) {
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
        el.innerHTML = '<i class="ti ti-line-dashed" style="margin-right:4px;opacity:0.4;font-size:0.8em;"></i>沒有更多對話紀錄了';
        container.prepend(el);
    }

    // ✅ 官方公告：顯示為置中系統訊息
    renderBroadcast(data) {
        const container = document.getElementById('messagesContainer');
        if (!container) return;

        const time = data.timestamp
            ? new Date(data.timestamp).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
            : '';

        // ✅ attachments 統一轉成陣列
        const broadcastImgs = Array.isArray(data.attachments)
            ? data.attachments.filter(Boolean)
            : (data.attachments || data.attachment || data.imageUrl ? [data.attachments || data.attachment || data.imageUrl] : []);

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
                ${data.message ? `<div class="broadcast-text">${this.linkify(this.escapeHtml(data.message).replace(/\n/g, '<br>'))}</div>` : ''}
                ${broadcastImgs.map(src => `<img src="${src}" class="broadcast-img chat-image" alt="公告圖片" loading="lazy" style="cursor:pointer;">`).join('')}
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

    // 將純文字中的 URL 轉成可點擊的 <a> 連結（在 escapeHtml 之後呼叫）
    linkify(escapedHtml) {
        const urlPattern = /https?:\/\/[^\s<>"']+/g;
        return escapedHtml.replace(urlPattern, url => {
            // 移除末尾標點（句點、逗號、右括號等）
            const trailingPunct = url.match(/[.,;!?)]+$/);
            const cleanUrl = trailingPunct ? url.slice(0, -trailingPunct[0].length) : url;
            const suffix = trailingPunct ? trailingPunct[0] : '';
            return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="chat-link">${cleanUrl}</a>${suffix}`;
        });
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

function _syncQuickReplyPad(visible) {
    if (window.innerWidth >= 768) return; // desktop 不需要
    const mc = document.querySelector('.messages-container');
    if (!mc) return;
    if (visible) {
        mc.style.setProperty('padding-bottom', '56px', 'important');
    } else {
        mc.style.removeProperty('padding-bottom');
    }
    // padding 改變後若已在底部附近，重新捲到底確保最後一則訊息可見
    requestAnimationFrame(() => {
        const nearBottom = mc.scrollHeight - mc.scrollTop - mc.clientHeight < 120;
        if (nearBottom) mc.scrollTop = mc.scrollHeight;
    });
}

let chatRoomList = null;
let _chatReady = false;
let _pendingSellerId = null;
let _pendingProductCtx = null; // { productName, productPrice } 商品資訊，開聊後預填

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
        window.parent.postMessage({ type: 'chatReady' }, window.location.origin);
    }
    // 如果有在 ready 前就收到的 pending 請求，立刻執行
    if (_pendingSellerId) {
        openChatWithTarget(_pendingSellerId);
        _pendingSellerId = null;
    }
    // 讀取 URL 參數，自動開啟與指定用戶的聊天（手機版跳轉時使用）
    const _urlParams = new URLSearchParams(window.location.search);
    const openChatId = _urlParams.get('openChat');
    if (openChatId) {
        const productName = _urlParams.get('productName') || '';
        const productPrice = _urlParams.get('productPrice') || '';
        const message = _urlParams.get('message') || '';
        if (message) _pendingProductCtx = { _rawMessage: message };
        else if (productName) _pendingProductCtx = { productName, productPrice };
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
    if (e.origin !== window.location.origin) return;
    if (e.data?.type === 'openChatWithSeller' && e.data.sellerId) {
        const { productName, productPrice } = e.data;
        if (productName) _pendingProductCtx = { productName, productPrice: productPrice ?? '' };
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

    // ── 音效開關 ──────────────────────────────────────────
    function _isSoundOn() { return localStorage.getItem('chatSound') !== '0'; }
    function _updateSoundUI() {
        const icon  = document.getElementById('soundToggleIcon');
        const label = document.getElementById('soundToggleLabel');
        const on = _isSoundOn();
        if (icon)  icon.className  = on ? 'bi bi-volume-up-fill' : 'bi bi-volume-mute-fill';
        if (label) label.textContent = on ? '訊息音效（開）' : '訊息音效（關）';
    }
    _updateSoundUI();
    document.getElementById('toggleSoundBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.setItem('chatSound', _isSoundOn() ? '0' : '1');
        _updateSoundUI();
    });

    // ── 桌面通知按鈕 ─────────────────────────────────────
    function _updateNotifUI() {
        const icon  = document.getElementById('notifBellIcon');
        const label = document.getElementById('notifBtnLabel');
        const btn   = document.getElementById('enableNotifBtn');
        if (!('Notification' in window)) {
            if (btn) btn.style.display = 'none';
            return;
        }
        const p = Notification.permission;
        if (icon)  icon.className  = p === 'granted' ? 'bi bi-bell-fill' : 'bi bi-bell';
        if (label) label.textContent = p === 'granted' ? '桌面通知（已開啟）' : p === 'denied' ? '桌面通知（已封鎖）' : '開啟桌面通知';
        if (btn)   btn.style.opacity = p === 'denied' ? '0.45' : '1';
    }
    _updateNotifUI();
    document.getElementById('enableNotifBtn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!('Notification' in window) || Notification.permission === 'denied') return;
        if (Notification.permission === 'granted') return;
        await Notification.requestPermission();
        _updateNotifUI();
    });

    // ── 聊天室資訊 ──
    const _roomInfoPanel = document.getElementById('roomInfoPanel');
    const _roomInfoOverlay = document.getElementById('roomInfoOverlay');
    const _openRoomInfoPanel = () => { _roomInfoPanel?.classList.add('open'); _roomInfoOverlay?.classList.add('open'); };
    const _closeRoomInfoPanel = () => { _roomInfoPanel?.classList.remove('open'); _roomInfoOverlay?.classList.remove('open'); };
    document.getElementById('closeRoomInfoPanel')?.addEventListener('click', _closeRoomInfoPanel);
    _roomInfoOverlay?.addEventListener('click', _closeRoomInfoPanel);


    document.getElementById('openRoomInfoBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        const roomId = chatRoomList.currentRoomId;
        if (!roomId) return;
        const room = chatRoomList.roomDataMap.get(String(roomId));
        if (!room) return;

        const isOfficial = room.type === 'OFFICIAL';
        const createdAt = room.createdAt
            ? new Date(room.createdAt).toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
            : '—';

        const members = (room.members ?? []).slice().sort((a, b) => {
            const order = { USER: 0, MODERATOR: 1, ADMIN: 2 };
            return (order[a.role] ?? 9) - (order[b.role] ?? 9);
        });

        const roleLabel = { USER: '聊天對象', MODERATOR: '管理員', ADMIN: '系統管理員', SUPPORT: '客服人員' };
        const roleBadgeStyle = {
            USER:      'background:#e8f0fb;color:#004b97;',
            MODERATOR: 'background:#e8f0fb;color:#004b97;',
            ADMIN:     'background:#e8f0fb;color:#004b97;',
            SUPPORT:   'background:#fff3e0;color:#e67e22;',
        };
        const memberHtml = members.map(m => {
            const avatar = m.photoURL
                ? `<img src="${m.photoURL}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;">`
                : `<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(to right bottom,var(--primary-color,#004b97),var(--secondary-color,#abdad5));display:flex;align-items:center;justify-content:center;"><img src="../svg/default-avatar.svg" style="width:30px;height:30px;"></div>`;
            const badge = roleLabel[m.role]
                ? `<span style="font-size:0.62rem;${roleBadgeStyle[m.role] ?? ''}border-radius:4px;padding:1px 5px;margin-left:4px;">${roleLabel[m.role]}</span>`
                : '';
            return `<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid #f0f0f0;">
                        ${avatar}
                        <span style="font-size:0.85rem;">${m.name ?? '未知'}${badge}</span>
                    </div>`;
        }).join('');

        const isSupportTypeRoom = chatRoomList.supportTypeRoomsSet.has(String(roomId));
        const ticket = isSupportTypeRoom ? chatRoomList.currentTicket : null;
        const TICKET_STATUS_LABEL = { UNRESOLVED: '等待認領', CLAIMED: '處理中', RESOLVED: '已解決', ADJUDICATED: '已裁定' };
        const TICKET_STATUS_COLOR = { UNRESOLVED: '#e67e22', CLAIMED: '#004b97', RESOLVED: '#27ae60', ADJUDICATED: '#8e44ad' };
        const ticketStatusColor = ticket ? (TICKET_STATUS_COLOR[ticket.status] ?? '#888') : '#888';
        const isClaimedByMe = ticket?.claimedBy != null && String(ticket.claimedBy) === String(chatRoomList.userId);

        const infoHtml = `
            <div style="font-size:0.8rem;color:#888;margin-bottom:14px;">
                <i class="bi bi-calendar3 me-1"></i>建立時間
                <div style="color:#333;font-size:0.85rem;margin-top:3px;font-weight:500;">${createdAt}</div>
            </div>
            ${isOfficial && room.officialChannel?.description ? `
            <div style="font-size:0.8rem;color:#888;margin-bottom:14px;">
                <i class="bi bi-megaphone me-1"></i>頻道說明
                <div style="color:#333;font-size:0.85rem;margin-top:3px;">${room.officialChannel.description}</div>
            </div>` : ''}
            ${ticket ? `
            <div style="font-size:0.8rem;color:#888;margin-bottom:8px;margin-top:4px;">
                <i class="bi bi-ticket-detailed me-1"></i>客服單資訊
            </div>
            <div style="background:#fff8f0;border:1px solid #f5cba7;border-radius:8px;padding:10px 12px;margin-bottom:14px;font-size:0.82rem;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <span style="color:#555;">狀態</span>
                    <span style="font-weight:600;color:${ticketStatusColor};">${TICKET_STATUS_LABEL[ticket.status] ?? ticket.status}</span>
                </div>
                <div style="color:#555;margin-bottom:4px;">原因：<span style="color:#333;">${chatRoomList.escapeHtml(ticket.reason ?? '找客服問問題')}</span></div>
                ${ticket.claimedBy ? `<div style="color:#555;">負責客服：<span style="color:#333;">${chatRoomList.escapeHtml(ticket.claimed?.name ?? String(ticket.claimedBy))}</span></div>` : ''}
            </div>
            ${isClaimedByMe ? `
            <div style="font-size:0.8rem;color:#888;margin-bottom:8px;">
                <i class="bi bi-box-seam me-1"></i>關聯訂單
            </div>
            <div id="ticketOrderInfo"><div style="text-align:center;padding:12px 0;color:#aaa;font-size:0.8rem;"><div class="spinner-border spinner-border-sm text-secondary" role="status"></div></div></div>
            <div style="font-size:0.8rem;color:#888;margin-bottom:8px;margin-top:14px;">
                <i class="bi bi-chat-left-text me-1"></i>原始對話記錄
            </div>
            <div id="ticketHistoryList"><div style="text-align:center;padding:12px 0;color:#aaa;font-size:0.8rem;"><div class="spinner-border spinner-border-sm text-secondary" role="status"></div></div></div>
            ` : ''}
            ` : ''}
            <div style="font-size:0.8rem;color:#888;margin-bottom:8px;">
                <i class="bi bi-people me-1"></i>成員（${members.length} 人）
            </div>
            <div style="margin-bottom:14px;">${memberHtml}</div>
            ${!isOfficial && !isSupportTypeRoom ? `
            <div style="font-size:0.8rem;color:#888;margin-bottom:8px;margin-top:4px;">
                <i class="bi bi-receipt me-1"></i>交易紀錄
            </div>
            <div id="roomOrdersList"><div style="text-align:center;padding:12px 0;color:#aaa;font-size:0.8rem;"><div class="spinner-border spinner-border-sm text-secondary" role="status"></div></div></div>
            ` : ''}`;

        document.getElementById('roomInfoBody').innerHTML = infoHtml;
        _openRoomInfoPanel();

        // 載入關聯訂單（客服已認領 + 是認領者）
        if (ticket && isClaimedByMe) {
            chatRoomList.backend.getTicketOrder(ticket.id).then(orderRes => {
                const el = document.getElementById('ticketOrderInfo');
                if (!el) return;
                const o = orderRes?.data ?? orderRes;
                if (!o) { el.innerHTML = `<div style="text-align:center;padding:10px 0;color:#aaa;font-size:0.78rem;">無關聯訂單資訊</div>`; return; }
                const orderItems = o.orderItems ?? [];
                const first = orderItems[0];
                const productName = first?.item?.name ?? first?.name ?? '商品';
                const price = o.totalAmount != null ? `NT$ ${Number(o.totalAmount).toLocaleString('zh-TW')}` : '—';
                const buyerName = o.buyerUser?.name ?? o.buyerUser?.username ?? '—';
                const sellerName = o.sellerUser?.name ?? o.sellerUser?.username ?? '—';
                el.innerHTML = `
                    <div style="background:#f0f4ff;border:1px solid #c5d5f5;border-radius:8px;padding:10px 12px;font-size:0.81rem;margin-bottom:12px;">
                        <div style="font-weight:600;color:#333;margin-bottom:6px;">${chatRoomList.escapeHtml(productName)}${orderItems.length > 1 ? ` …等${orderItems.length}件` : ''}</div>
                        <div style="display:flex;justify-content:space-between;color:#555;margin-bottom:3px;">
                            <span>買家</span><span style="color:#004b97;font-weight:600;">${chatRoomList.escapeHtml(buyerName)}</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;color:#555;margin-bottom:3px;">
                            <span>賣家</span><span style="color:#27ae60;font-weight:600;">${chatRoomList.escapeHtml(sellerName)}</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;color:#555;">
                            <span>金額</span><span style="color:#004b97;font-weight:600;">${price}</span>
                        </div>
                    </div>`;
            }).catch(() => {
                const el = document.getElementById('ticketOrderInfo');
                if (el) el.innerHTML = `<div style="text-align:center;padding:10px 0;color:#ccc;font-size:0.78rem;">無法載入訂單資訊</div>`;
            });

            // 原始對話記錄
            chatRoomList.backend.getTicketHistory(ticket.id).then(histRes => {
                const el = document.getElementById('ticketHistoryList');
                if (!el) return;
                const msgs = Array.isArray(histRes) ? histRes : (Array.isArray(histRes?.data) ? histRes.data : []);
                if (!msgs.length) {
                    el.innerHTML = `<div style="text-align:center;padding:10px 0;color:#aaa;font-size:0.78rem;">無對話記錄</div>`;
                    return;
                }
                el.innerHTML = `<div style="max-height:220px;overflow-y:auto;border:1px solid #eee;border-radius:8px;padding:8px;">` +
                    msgs.map(m => {
                        const time = m.createdAt ? new Date(m.createdAt).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) : '';
                        return `<div style="margin-bottom:8px;font-size:0.78rem;">
                            <span style="font-weight:600;color:#004b97;">${chatRoomList.escapeHtml(m.senderName ?? m.username ?? '用戶')}</span>
                            <span style="color:#aaa;font-size:0.7rem;margin-left:6px;">${time}</span>
                            <div style="color:#333;margin-top:2px;">${chatRoomList.escapeHtml(m.content ?? m.message ?? '')}</div>
                        </div>`;
                    }).join('') + `</div>`;
            }).catch(() => {
                const el = document.getElementById('ticketHistoryList');
                if (el) el.innerHTML = `<div style="text-align:center;padding:10px 0;color:#ccc;font-size:0.78rem;">無法載入對話記錄</div>`;
            });
        }

        if (!isOfficial && !isSupportTypeRoom) {
            const _renderRoomOrders = (orders) => {
                const el = document.getElementById('roomOrdersList');
                if (!el) return;
                const STATUS_LABEL = {
                    pending: '待確認', preparing: '待出貨', shipping: '配送中',
                    delivered: '待收貨', review_pending: '待評價',
                    completed: '已完成', canceled: '已取消'
                };
                const STATUS_COLOR = {
                    pending: '#e67e22', preparing: '#004b97', shipping: '#004b97',
                    delivered: '#004b97', review_pending: '#27ae60',
                    completed: '#888', canceled: '#ccc'
                };
                if (!Array.isArray(orders) || orders.length === 0) {
                    el.innerHTML = `<div style="text-align:center;padding:16px 0;color:#aaa;font-size:0.8rem;"><i class="bi bi-receipt" style="font-size:1.4rem;display:block;margin-bottom:6px;"></i>尚無交易紀錄</div>`;
                    return;
                }
                const myUid = String(localStorage.getItem('uid') ?? '');
                el.innerHTML = orders.map(order => {
                    const orderItems = order.orderItems ?? [];
                    const first = orderItems[0];
                    const productName = first?.item?.name ?? first?.name ?? order.name ?? '商品';
                    const qty = first?.quantity ?? 1;
                    const extra = orderItems.length > 1 ? ` …等 ${orderItems.length} 件` : '';
                    const label = `${productName} × ${qty}${extra}`;
                    const statusKey = (order.status ?? '').toLowerCase();
                    const statusText = STATUS_LABEL[statusKey] ?? order.status ?? '—';
                    const statusColor = STATUS_COLOR[statusKey] ?? '#888';
                    const price = order.totalAmount != null ? `NT$ ${Number(order.totalAmount).toLocaleString('zh-TW')}` : '—';
                    const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '—';
                    const isBuyer = String(order.buyerUser?.id ?? '') === myUid;
                    const role = isBuyer ? '買家' : '賣家';
                    const roleColor = isBuyer ? '#004b97' : '#27ae60';
                    return `<div style="padding:9px 0;border-bottom:1px solid #f0f0f0;">
                        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px;margin-bottom:3px;">
                            <span style="font-size:0.82rem;color:#333;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${productName}">${label}</span>
                            <span style="font-size:0.7rem;font-weight:600;color:${statusColor};white-space:nowrap;">${statusText}</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <span style="font-size:0.75rem;color:#888;">${date} · <span style="color:${roleColor};">${role}</span></span>
                            <span style="font-size:0.78rem;color:#004b97;font-weight:600;">${price}</span>
                        </div>
                    </div>`;
                }).join('');
            };
            chatRoomList.backend.getRoomOrders(roomId).then(_renderRoomOrders).catch(() => {
                const el = document.getElementById('roomOrdersList');
                if (el) el.innerHTML = `<div style="text-align:center;padding:12px 0;color:#ccc;font-size:0.78rem;">無法載入交易紀錄</div>`;
            });
        }

    });

    // ── 聯絡客服 ──
    document.getElementById('requestSupportBtn')?.addEventListener('click', async () => {
        const roomId = chatRoomList.currentRoomId;
        if (!roomId) return;

        // 載入該聊天室的訂單
        let orders = [];
        try {
            orders = await chatRoomList.backend.getRoomOrders(roomId);
        } catch { /* 靜默失敗 */ }
        const hasOrders = Array.isArray(orders) && orders.length > 0;

        // ── 第一步：選擇問題類型 ──
        const swalCommonStyle = 'font-size:0.85rem;font-weight:600;color:#444;';
        const infoBox = `<div style="background:#fff8f0;border:1px solid #f5cba7;border-radius:8px;padding:10px 12px;margin-bottom:16px;font-size:0.8rem;color:#7d4e00;"><i class="bi bi-info-circle me-1"></i>送出後將由客服人員認領，請耐心等候。</div>`;

        if (hasOrders) {
            // ── 有訂單：先問是單純問問題還是訂單問題 ──
            const { isConfirmed: typeConfirmed, value: typeValue } = await Swal.fire({
                title: '<i class="bi bi-headset" style="color:#e67e22;margin-right:6px;"></i>聯絡客服',
                html: `
                    <div style="text-align:left;padding:0 4px;">
                        ${infoBox}
                        <label style="display:block;margin-bottom:10px;${swalCommonStyle}">請問您的問題類型？</label>
                        <div style="display:flex;flex-direction:column;gap:8px;">
                            <label style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid #ddd;border-radius:8px;cursor:pointer;">
                                <input type="radio" name="swal-type" value="general" checked style="accent-color:#004b97;">
                                <span style="font-size:0.85rem;color:#333;">單純問問題</span>
                            </label>
                            <label style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid #ddd;border-radius:8px;cursor:pointer;">
                                <input type="radio" name="swal-type" value="order" style="accent-color:#004b97;">
                                <span style="font-size:0.85rem;color:#333;">與訂單有關</span>
                            </label>
                        </div>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: '下一步',
                cancelButtonText: '取消',
                focusConfirm: false,
                customClass: { popup: 'support-swal-popup' },
                preConfirm: () => {
                    const type = document.querySelector('input[name="swal-type"]:checked')?.value;
                    return { type };
                }
            });
            if (!typeConfirmed) return;

            if (typeValue.type === 'general') {
                // ── 單純問問題 → createTicket ──
                const { isConfirmed } = await Swal.fire({
                    title: '<i class="bi bi-headset" style="color:#e67e22;margin-right:6px;"></i>聯絡客服',
                    html: `<div style="text-align:left;padding:0 4px;">${infoBox}<p style="font-size:0.85rem;color:#555;margin:0;">確認後將建立客服單，客服人員認領後會加入本聊天室協助您。</p></div>`,
                    showCancelButton: true,
                    confirmButtonText: '確認送出',
                    cancelButtonText: '取消',
                    customClass: { popup: 'support-swal-popup' },
                });
                if (!isConfirmed) return;
                try {
                    await chatRoomList.backend.createTicket({ roomId });
                    await Swal.fire({ icon: 'success', title: '客服單已建立', text: '請等待客服人員認領後介入協助。', timer: 2000, showConfirmButton: false });
                    await chatRoomList.loadRooms();
                } catch {
                    Swal.fire({ icon: 'error', title: '送出失敗', text: '請稍後再試' });
                }
            } else {
                // ── 訂單問題 → requestSupport ──
                const orderOptions = orders.map(o => {
                    const first = o.orderItems?.[0];
                    const name = first?.item?.name ?? first?.name ?? '商品';
                    const qty = first?.quantity ?? 1;
                    const extra = (o.orderItems?.length ?? 0) > 1 ? ` …等${o.orderItems.length}件` : '';
                    return `<option value="${o.id}">${name} × ${qty}${extra}</option>`;
                }).join('');

                const { isConfirmed, value } = await Swal.fire({
                    title: '<i class="bi bi-headset" style="color:#e67e22;margin-right:6px;"></i>訂單問題',
                    html: `
                        <div style="text-align:left;padding:0 4px;">
                            ${infoBox}
                            <label style="display:block;${swalCommonStyle}margin-bottom:6px;">關聯訂單</label>
                            <select id="swal-order" style="width:100%;border:1px solid #ddd;border-radius:8px;padding:8px 10px;font-size:0.85rem;color:#333;background:#fff;margin-bottom:14px;outline:none;">
                                ${orderOptions}
                            </select>
                            <label style="display:block;${swalCommonStyle}margin-bottom:6px;">問題描述</label>
                            <textarea id="swal-reason" style="width:100%;border:1px solid #ddd;border-radius:8px;padding:10px;font-size:0.85rem;color:#333;resize:vertical;min-height:90px;box-sizing:border-box;outline:none;" placeholder="請描述需要客服協助的原因..."></textarea>
                        </div>
                    `,
                    showCancelButton: true,
                    confirmButtonText: '送出',
                    cancelButtonText: '取消',
                    focusConfirm: false,
                    customClass: { popup: 'support-swal-popup' },
                    preConfirm: () => {
                        const orderId = document.getElementById('swal-order').value;
                        const reason = document.getElementById('swal-reason').value.trim();
                        if (!reason) { Swal.showValidationMessage('請描述問題原因'); return false; }
                        return { orderId, reason };
                    }
                });
                if (!isConfirmed) return;
                try {
                    const res = await chatRoomList.backend.requestSupport(roomId, value.orderId, value.reason);
                    const newRoomId = res?.data?.room?.id;
                    await Swal.fire({ icon: 'success', title: '客服請求已送出', text: '請等待客服人員認領後介入協助。', timer: 2000, showConfirmButton: false });
                    if (newRoomId) {
                        await chatRoomList.loadRooms();
                        const newItem = document.querySelector(`[data-room-id="${newRoomId}"]`);
                        const newName = newItem?.querySelector('.roomName')?.textContent || '客服處理';
                        await chatRoomList.switchRoom(newRoomId, newName);
                    }
                } catch {
                    Swal.fire({ icon: 'error', title: '送出失敗', text: '請稍後再試' });
                }
            }
        } else {
            // ── 無訂單 → 直接確認建立 ticket ──
            const { isConfirmed } = await Swal.fire({
                title: '<i class="bi bi-headset" style="color:#e67e22;margin-right:6px;"></i>聯絡客服',
                html: `<div style="text-align:left;padding:0 4px;">${infoBox}<p style="font-size:0.85rem;color:#555;margin:0;">確認後將建立客服單，客服人員認領後會加入本聊天室協助您。</p></div>`,
                showCancelButton: true,
                confirmButtonText: '確認送出',
                cancelButtonText: '取消',
                customClass: { popup: 'support-swal-popup' },
            });
            if (!isConfirmed) return;
            try {
                await chatRoomList.backend.createTicket({ roomId });
                await Swal.fire({ icon: 'success', title: '客服單已建立', text: '請等待客服人員認領後介入協助。', timer: 2000, showConfirmButton: false });
                await chatRoomList.loadRooms();
            } catch {
                Swal.fire({ icon: 'error', title: '送出失敗', text: '請稍後再試' });
            }
        }
    });

    // ── 結束支援 ──
    document.getElementById('leaveSupportBtn')?.addEventListener('click', async () => {
        const roomId = chatRoomList.currentRoomId;
        if (!roomId) return;
        const ticket = chatRoomList.currentTicket;

        // 先問結束方式
        const { isConfirmed: typeConfirmed, value: typeValue } = await Swal.fire({
            title: '結束支援',
            html: `
                <div style="text-align:left;padding:0 4px;">
                    <p style="font-size:0.85rem;color:#555;margin-bottom:14px;">請選擇結束方式：</p>
                    <div style="display:flex;flex-direction:column;gap:8px;">
                        <label style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid #ddd;border-radius:8px;cursor:pointer;">
                            <input type="radio" name="leave-type" value="resolve" checked style="accent-color:#004b97;">
                            <div>
                                <div style="font-size:0.85rem;font-weight:600;color:#333;">標記已解決</div>
                                <div style="font-size:0.75rem;color:#888;">問題已處理完畢，直接結束</div>
                            </div>
                        </label>
                        <label style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid #ddd;border-radius:8px;cursor:pointer;">
                            <input type="radio" name="leave-type" value="adjudicate" style="accent-color:#8e44ad;">
                            <div>
                                <div style="font-size:0.85rem;font-weight:600;color:#333;">填寫仲裁單後結束</div>
                                <div style="font-size:0.75rem;color:#888;">需記錄裁定結論並通知雙方</div>
                            </div>
                        </label>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: '下一步',
            cancelButtonText: '取消',
            focusConfirm: false,
            customClass: { popup: 'support-swal-popup' },
            preConfirm: () => ({ type: document.querySelector('input[name="leave-type"]:checked')?.value })
        });
        if (!typeConfirmed) return;

        const _doLeave = async () => {
            await chatRoomList.backend.leaveSupport(roomId);
            chatRoomList.mySupportRoomsSet.delete(String(roomId));
            chatRoomList.supportTypeRoomsSet.delete(String(roomId));
            await chatRoomList.loadRooms();
            const officialRoomId = [...chatRoomList.officialRoomsSet][0];
            if (officialRoomId) {
                const officialItem = document.querySelector(`[data-room-id="${officialRoomId}"]`);
                const officialName = officialItem?.querySelector('.roomName')?.textContent || '官方頻道';
                await chatRoomList.switchRoom(officialRoomId, officialName);
            }
        };

        if (typeValue.type === 'resolve') {
            const { isConfirmed } = await Swal.fire({
                title: '確認結束支援',
                text: '將標記客服單為已解決並離開聊天室。',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: '確定',
                cancelButtonText: '取消',
            });
            if (!isConfirmed) return;
            try {
                if (ticket) await chatRoomList.backend.resolveTicket(ticket.id);
                await _doLeave();
            } catch {
                Swal.fire({ icon: 'error', title: '操作失敗', text: '請稍後再試' });
            }
        } else {
            // 填寫仲裁單
            const { isConfirmed, value } = await Swal.fire({
                title: '<i class="bi bi-scale" style="color:#8e44ad;margin-right:6px;"></i>填寫仲裁單',
                html: `
                    <div style="text-align:left;padding:0 4px;">
                        <div style="background:#f9f0ff;border:1px solid #d7b8f5;border-radius:8px;padding:10px 12px;margin-bottom:14px;font-size:0.8rem;color:#5b2c6f;">
                            <i class="bi bi-info-circle me-1"></i>裁定結論將以通知形式傳送給聊天室所有成員，送出後客服單自動標記為已解決並離開聊天室。
                        </div>
                        <label style="display:block;font-size:0.85rem;font-weight:600;color:#444;margin-bottom:6px;">裁定結論</label>
                        <textarea id="swal-adjudication" style="width:100%;border:1px solid #ddd;border-radius:8px;padding:10px;font-size:0.85rem;color:#333;resize:vertical;min-height:70px;box-sizing:border-box;outline:none;margin-bottom:14px;" placeholder="例：買家提供的商品與描述不符，建議退款處理"></textarea>
                        <label style="display:block;font-size:0.85rem;font-weight:600;color:#444;margin-bottom:6px;">回覆訊息（發送給雙方）</label>
                        <textarea id="swal-reply-message" style="width:100%;border:1px solid #ddd;border-radius:8px;padding:10px;font-size:0.85rem;color:#333;resize:vertical;min-height:70px;box-sizing:border-box;outline:none;" placeholder="例：您好，我們已審查您的訂單，結論如下..."></textarea>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: '送出並結束',
                cancelButtonText: '取消',
                focusConfirm: false,
                customClass: { popup: 'support-swal-popup' },
                preConfirm: () => {
                    const adjudication = document.getElementById('swal-adjudication').value.trim();
                    const replyMessage = document.getElementById('swal-reply-message').value.trim();
                    if (!adjudication) { Swal.showValidationMessage('請填寫裁定結論'); return false; }
                    if (!replyMessage) { Swal.showValidationMessage('請填寫回覆訊息'); return false; }
                    return { adjudication, replyMessage };
                }
            });
            if (!isConfirmed) return;
            try {
                if (ticket) {
                    await chatRoomList.backend.adjudicateTicket(ticket.id, { adjudication: value.adjudication, replyMessage: value.replyMessage });
                    await chatRoomList.backend.resolveTicket(ticket.id);
                }
                await _doLeave();
            } catch {
                Swal.fire({ icon: 'error', title: '操作失敗', text: '請稍後再試' });
            }
        }
    });

    // ── 客服單操作（認領 / 解決 / 裁定）──
    document.getElementById('ticketBanner')?.addEventListener('click', async (e) => {
        const ticket = chatRoomList.currentTicket;
        if (!ticket) return;

        // 認領
        if (e.target.closest('#ticketClaimBtn')) {
            const { isConfirmed } = await Swal.fire({
                title: '認領客服單',
                text: '確定要認領此客服單嗎？認領後由您負責處理。',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: '確定認領',
                cancelButtonText: '取消',
            });
            if (!isConfirmed) return;
            try {
                await chatRoomList.backend.claimTicket(ticket.id);
                await chatRoomList._loadSupportTicket(chatRoomList.currentRoomId);
                Swal.fire({ icon: 'success', title: '已認領客服單', timer: 1500, showConfirmButton: false });
            } catch {
                Swal.fire({ icon: 'error', title: '認領失敗', text: '請稍後再試' });
            }
        }

        // 解決
        if (e.target.closest('#ticketResolveBtn')) {
            const { isConfirmed } = await Swal.fire({
                title: '標記為已解決',
                text: '確定要將此客服單標記為已解決並離開聊天室嗎？',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: '確定',
                cancelButtonText: '取消',
            });
            if (!isConfirmed) return;
            try {
                const roomId = chatRoomList.currentRoomId;
                await chatRoomList.backend.resolveTicket(ticket.id);
                await chatRoomList.backend.leaveSupport(roomId);
                await Swal.fire({ icon: 'success', title: '客服單已解決', timer: 1500, showConfirmButton: false });
                chatRoomList.mySupportRoomsSet.delete(String(roomId));
                chatRoomList.supportTypeRoomsSet.delete(String(roomId));
                await chatRoomList.loadRooms();
                const officialRoomId = [...chatRoomList.officialRoomsSet][0];
                if (officialRoomId) {
                    const officialItem = document.querySelector(`[data-room-id="${officialRoomId}"]`);
                    const officialName = officialItem?.querySelector('.roomName')?.textContent || '官方頻道';
                    chatRoomList.switchRoom(officialRoomId, officialName);
                }
            } catch {
                Swal.fire({ icon: 'error', title: '操作失敗', text: '請稍後再試' });
            }
        }

        // 裁定
        if (e.target.closest('#ticketAdjudicateBtn')) {
            const { isConfirmed, value } = await Swal.fire({
                title: '<i class="bi bi-scale" style="color:#8e44ad;margin-right:6px;"></i>裁定客服單',
                html: `
                    <div style="text-align:left;padding:0 4px;">
                        <div style="background:#f9f0ff;border:1px solid #d7b8f5;border-radius:8px;padding:10px 12px;margin-bottom:14px;font-size:0.8rem;color:#5b2c6f;">
                            <i class="bi bi-info-circle me-1"></i>裁定結論將以通知形式傳送給聊天室所有成員，裁定後請手動標記為已解決。
                        </div>
                        <label style="display:block;font-size:0.85rem;font-weight:600;color:#444;margin-bottom:6px;">裁定結論</label>
                        <textarea id="swal-adjudication" style="width:100%;border:1px solid #ddd;border-radius:8px;padding:10px;font-size:0.85rem;color:#333;resize:vertical;min-height:70px;box-sizing:border-box;outline:none;margin-bottom:14px;" placeholder="例：買家提供的商品與描述不符，建議退款處理"></textarea>
                        <label style="display:block;font-size:0.85rem;font-weight:600;color:#444;margin-bottom:6px;">回覆訊息（發送給雙方）</label>
                        <textarea id="swal-reply-message" style="width:100%;border:1px solid #ddd;border-radius:8px;padding:10px;font-size:0.85rem;color:#333;resize:vertical;min-height:70px;box-sizing:border-box;outline:none;" placeholder="例：您好，我們已審查您的訂單，結論如下..."></textarea>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: '送出裁定',
                cancelButtonText: '取消',
                focusConfirm: false,
                customClass: { popup: 'support-swal-popup' },
                preConfirm: () => {
                    const adjudication = document.getElementById('swal-adjudication').value.trim();
                    const replyMessage = document.getElementById('swal-reply-message').value.trim();
                    if (!adjudication) { Swal.showValidationMessage('請填寫裁定結論'); return false; }
                    if (!replyMessage) { Swal.showValidationMessage('請填寫回覆訊息'); return false; }
                    return { adjudication, replyMessage };
                }
            });
            if (!isConfirmed) return;
            try {
                await chatRoomList.backend.adjudicateTicket(ticket.id, { adjudication: value.adjudication, replyMessage: value.replyMessage });
                await chatRoomList._loadSupportTicket(chatRoomList.currentRoomId);
                Swal.fire({ icon: 'success', title: '裁定完成', text: '請記得點擊「解決」按鈕將客服單標記為已解決。', confirmButtonText: '我知道了' });
            } catch {
                Swal.fire({ icon: 'error', title: '裁定失敗', text: '請稍後再試' });
            }
        }
    });

    // ── 檢舉 ──
    document.getElementById('reportBtn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        const partnerInfo = chatRoomList.partnerInfoMap.get(String(chatRoomList.currentRoomId));
        const partnerName = partnerInfo?.name ?? '對方用戶';
        const partnerId   = partnerInfo?.id ?? null;

        const { isConfirmed, value } = await Swal.fire({
            title: '檢舉用戶',
            customClass: { popup: 'report-form-popup' },
            html: `
                <p class="report-form-target">檢舉對象：<strong>${partnerName}</strong></p>
                <label class="report-form-label" for="report-category">檢舉類型</label>
                <select id="report-category" class="report-form-select">
                    <option value="" disabled selected>請選擇檢舉類型</option>
                    <option value="illegal_goods">違法或禁售商品（菸、酒、藥品、醫療器材）</option>
                    <option value="ip_infringement">智財權侵權（非法講義、電子書、盜錄課程）</option>
                    <option value="fraud">疑似詐騙行為（私下匯款、釣魚網站）</option>
                    <option value="false_description">商品描述不實（照片不符、隱瞞瑕疵、分類錯誤）</option>
                    <option value="spam_harassment">惡意刷屏／騷擾（重複上架、人身攻擊）</option>
                    <option value="other">其他原因</option>
                </select>
                <label class="report-form-label" for="report-subject">標題</label>
                <input id="report-subject" class="report-form-input" placeholder="請輸入標題" maxlength="50">
                <label class="report-form-label" for="report-detail">內文補充說明（選填）</label>
                <textarea id="report-detail" class="report-form-textarea" placeholder="請描述詳細情況"></textarea>
            `,
            showCancelButton: true,
            confirmButtonText: '送出檢舉',
            cancelButtonText: '取消',
            focusConfirm: false,
            preConfirm: () => {
                const category = document.getElementById('report-category').value;
                const subject  = document.getElementById('report-subject').value.trim();
                const detail   = document.getElementById('report-detail').value.trim();
                if (!category) {
                    Swal.showValidationMessage('請選擇檢舉類型');
                    return false;
                }
                if (!subject) {
                    Swal.showValidationMessage('請填寫標題');
                    return false;
                }
                return { category, subject, detail };
            }
        });

        if (!isConfirmed || !value) return;

        try {
            await chatRoomList.auth.reportSeller(partnerId, {
                category: value.category,
                subject: value.subject,
                detail: value.detail,
                roomId: chatRoomList.currentRoomId
            });
            Swal.fire({ icon: 'success', title: '檢舉已送出', text: '我們會盡快處理，謝謝你的回報。', timer: 2000, showConfirmButton: false });
        } catch {
            Swal.fire({ icon: 'error', title: '送出失敗', text: '請稍後再試' });
        }
    });

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