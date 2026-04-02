import ChatBackendService from './ChatBackendService.js';

const talkInterface = document.getElementById('talkInterface');
const chatopen = document.getElementById('chaticon');

// 判斷目前頁面是否有底部導覽列（手機版頁面）
function hasBottomNav() {
  return !!document.querySelector('.bottom-nav');
}

// ── 放大/縮小按鈕（父頁面直接建立，不依賴 iframe 內部）──
let _maxBtn = null;
function _getOrCreateMaxBtn() {
  if (_maxBtn) return _maxBtn;
  if (!talkInterface) return null;
  _maxBtn = document.createElement('button');
  _maxBtn.id = 'chatMaxBtn';
  _maxBtn.title = '全螢幕';
  _maxBtn.innerHTML = '⛶';
  _maxBtn.style.display = 'none';
  document.body.appendChild(_maxBtn);
  _maxBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    _toggleMaximize();
  });
  return _maxBtn;
}

function _toggleMaximize(forceRestore = false) {
  if (!talkInterface) return;
  const isMax = forceRestore ? false : !talkInterface.classList.contains('maximized');
  talkInterface.classList.toggle('maximized', isMax);
  talkInterface.contentWindow?.postMessage({ type: isMax ? 'maximizeChat' : 'restoreFromParent' }, '*');
  if (_maxBtn) {
    _maxBtn.classList.toggle('maximized', isMax);
    _maxBtn.innerHTML = isMax ? '⊡' : '⛶';
    _maxBtn.title = isMax ? '縮小視窗' : '全螢幕';
  }
}

function _showMaxBtn() {
  const btn = _getOrCreateMaxBtn();
  if (btn) btn.style.display = 'block';
}
function _hideMaxBtn() {
  if (_maxBtn) _maxBtn.style.display = 'none';
}

async function toggleChatInterface() {
  // 有底部導覽列（手機版頁面）→ 直接跳轉到聊天室頁面
  if (hasBottomNav()) {
    window.location.href = '../chatroom/chatroom.html';
    return;
  }

  // 沒有底部導覽列（桌機版頁面）→ 保持原本 iframe 浮動視窗
  if (talkInterface.style.display === 'none' || talkInterface.style.display === '') {
    if (!await canEnterChat()) {
      talkInterface.style.display = 'none';
      return;
    }
    // 第一次開啟才設定 src，避免重複載入
    if (!talkInterface.src || talkInterface.src === 'about:blank' || talkInterface.src === window.location.href) {
      talkInterface.src = '../chatroom/chatroom.html';
    }
    talkInterface.style.display = 'block';
    _showMaxBtn();
  } else {
    talkInterface.classList.remove('maximized');
    talkInterface.style.display = 'none';
    _hideMaxBtn();
  }
}

// 桌機版：點擊外部關閉浮動視窗（放大狀態時不觸發）
window.addEventListener('click', function(e) {
    if (hasBottomNav()) return;
    if (talkInterface && talkInterface.style.display === 'block' &&
        !talkInterface.classList.contains('maximized') &&
        !talkInterface.contains(e.target) &&
        !chatopen?.contains(e.target) &&
        !document.querySelector('.swal2-container')) {
        talkInterface.style.display = 'none';
    }
});

// 桌機版 Esc：放大 → 縮小；縮小 → 關閉
document.addEventListener('keydown', function(e) {
    if (e.key !== 'Escape' || !talkInterface || talkInterface.style.display === 'none') return;
    if (talkInterface.classList.contains('maximized')) {
        _toggleMaximize(true);
    } else {
        talkInterface.style.display = 'none';
        _hideMaxBtn();
    }
});

// 接收 iframe 內傳來的訊號
window.addEventListener('message', function(e) {
    if (e.data?.type === 'closeChat') {
        if (talkInterface) {
            talkInterface.classList.remove('maximized');
            talkInterface.style.display = 'none';
        }
        _hideMaxBtn();
        document.body.classList.remove('chat-open-mobile');
    } else if (e.data?.type === 'maximizeChat') {
        _toggleMaximize(false);
    } else if (e.data?.type === 'restoreChat') {
        _toggleMaximize(true);
    }
});

async function canEnterChat() {
    return true;
}

// ── Toast Notification System ──
const _TOAST_MAX = 5;
const _TOAST_DURATION = 5000;
const _partnerCache = new Map(); // username → { name, photoURL, userId }
const _toastMap = new Map();     // username → { el, timer, count }

// 注入 toast 樣式（僅一次）
(function _injectToastStyles() {
  if (document.getElementById('chat-toast-style')) return;
  const s = document.createElement('style');
  s.id = 'chat-toast-style';
  s.textContent = `
    #chat-toast-container {
      position: fixed;
      bottom: 90px;
      right: 20px;
      z-index: 99999;
      display: flex;
      flex-direction: column-reverse;
      gap: 8px;
      pointer-events: none;
    }
    @media (min-width: 992px) {
      #chat-toast-container {
        left: auto;
        right: 30px;
        bottom: 150px;
      }
    }
    #talkInterface {
      transition: top 0.25s ease, left 0.25s ease, right 0.25s ease, bottom 0.25s ease,
                  width 0.25s ease, height 0.25s ease, border-radius 0.25s ease;
    }
    #talkInterface.maximized {
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      border-radius: 0 !important;
    }
    #chatMaxBtn {
      position: fixed;
      bottom: 625px;
      right: 38px;
      z-index: 10002;
      background: rgba(0,75,151,0.82);
      color: #fff;
      border: none;
      border-radius: 5px;
      padding: 3px 8px;
      font-size: 14px;
      cursor: pointer;
      line-height: 1.5;
    }
    #chatMaxBtn:hover { background: rgba(36,182,133,0.9); }
    #chatMaxBtn.maximized {
      bottom: auto;
      top: 10px;
      right: 10px;
    }
    .chat-toast {
      position: relative;
      background: #fff;
      border-radius: 14px;
      padding: 10px 12px 10px 12px;
      padding-top: 22px;
      box-shadow: 0 6px 24px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.07);
      pointer-events: auto;
      cursor: pointer;
      max-width: 290px;
      min-width: 210px;
      overflow: hidden;
      opacity: 0;
      transform: translateX(14px);
      transition: opacity 0.25s ease, transform 0.25s ease;
    }
    .chat-toast--visible {
      opacity: 1;
      transform: translateX(0);
    }
    .chat-toast:hover {
      box-shadow: 0 8px 28px rgba(0,0,0,0.18);
    }
    .chat-toast__badge {
      position: absolute;
      top: 6px;
      left: 10px;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #004b97;
      text-transform: uppercase;
      opacity: 0.75;
    }
    .chat-toast__progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 2px;
      width: 100%;
      background: #abdad5;
      border-radius: 0 0 12px 12px;
      transform-origin: left;
      transform: scaleX(1);
    }
    .chat-toast__progress--running {
      transition: transform linear;
      transform: scaleX(0);
    }
    .chat-toast__close {
      position: absolute;
      top: 4px;
      right: 8px;
      background: none;
      border: none;
      font-size: 14px;
      color: #bbb;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }
    .chat-toast__close:hover { color: #555; }
    .chat-toast__content {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .chat-toast__avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }
    .chat-toast__body {
      flex: 1;
      overflow: hidden;
    }
    .chat-toast__name {
      font-size: 13px;
      font-weight: 600;
      color: #222;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .chat-toast__preview {
      font-size: 12px;
      color: #777;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 2px;
    }
    .chat-toast__img-thumb {
      width: 42px;
      height: 42px;
      border-radius: 6px;
      object-fit: cover;
      flex-shrink: 0;
      border: 1px solid #eee;
    }
  `;
  document.head.appendChild(s);
})();

const _toastContainer = (() => {
  const el = document.createElement('div');
  el.id = 'chat-toast-container';
  document.body.appendChild(el);
  return el;
})();

function _esc(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function _dismissToast(username) {
  const entry = _toastMap.get(username);
  if (!entry) return;
  clearTimeout(entry.timer);
  entry.el.classList.remove('chat-toast--visible');
  setTimeout(() => { entry.el.remove(); _toastMap.delete(username); }, 300);
}

function _getAttachmentUrl(attachments) {
  if (!attachments) return null;
  if (Array.isArray(attachments) && attachments.length > 0) return attachments[0];
  if (typeof attachments === 'string' && attachments.trim()) return attachments.trim();
  return null;
}

function _showChatToast(data) {
  const username = data.username;
  const partner = _partnerCache.get(username) || {
    name: data._overrideName ?? username,
    photoURL: data._overrideAvatar ?? '../image/default-avatar.png',
    userId: null
  };
  if (data._overrideName) partner.name = data._overrideName;
  if (data._overrideAvatar) partner.photoURL = data._overrideAvatar;
  const isMobile = hasBottomNav();
  const hasIframe = !!talkInterface;
  const imgUrl = _getAttachmentUrl(data.attachments);
  const hasText = !!data.message?.trim();
  const previewText = hasText ? data.message.slice(0, 45) : (imgUrl ? '傳送一張圖片' : '');

  // 合併：同一人已有 toast → 更新計數
  if (_toastMap.has(username)) {
    const entry = _toastMap.get(username);
    clearTimeout(entry.timer);
    entry.count++;
    const previewEl = entry.el.querySelector('.chat-toast__preview');
    if (previewEl) previewEl.textContent = `${entry.count} 則新訊息`;
    entry.timer = setTimeout(() => _dismissToast(username), _TOAST_DURATION);
    return;
  }

  // 超過上限：移除最舊的
  if (_toastMap.size >= _TOAST_MAX) {
    _dismissToast(_toastMap.keys().next().value);
  }

  const el = document.createElement('div');
  el.className = 'chat-toast';
  el.innerHTML = `
    <span class="chat-toast__badge">New Message</span>
    <div class="chat-toast__progress"></div>
    <button class="chat-toast__close" aria-label="關閉">×</button>
    <div class="chat-toast__content">
      <img class="chat-toast__avatar" src="${_esc(partner.photoURL)}" onerror="this.src='../image/default-avatar.png'" alt="">
      <div class="chat-toast__body">
        <div class="chat-toast__name">${_esc(partner.name)}</div>
        <div class="chat-toast__preview">${_esc(previewText)}</div>
      </div>
      ${imgUrl ? `<img class="chat-toast__img-thumb" src="${_esc(imgUrl)}" alt="圖片預覽">` : ''}
    </div>
  `;

  el.querySelector('.chat-toast__close').addEventListener('click', (e) => {
    e.stopPropagation();
    _dismissToast(username);
  });

  el.addEventListener('click', () => {
    _dismissToast(username);
    const uid = partner.userId;
    if (!isMobile && hasIframe && uid) {
      // 桌機版且頁面有 iframe → 在 iframe 中開啟指定對話
      talkInterface.src = `../chatroom/chatroom.html?openChat=${uid}`;
      talkInterface.style.display = 'block';
    } else {
      window.location.href = `../chatroom/chatroom.html${uid ? '?openChat=' + uid : ''}`;
    }
  });

  _toastContainer.appendChild(el);
  requestAnimationFrame(() => {
    el.classList.add('chat-toast--visible');
    const bar = el.querySelector('.chat-toast__progress');
    if (bar) {
      bar.style.transitionDuration = `${_TOAST_DURATION}ms`;
      requestAnimationFrame(() => bar.classList.add('chat-toast__progress--running'));
    }
  });
  const timer = setTimeout(() => _dismissToast(username), _TOAST_DURATION);
  _toastMap.set(username, { el, timer, count: 1 });
}

// ── 瀏覽器桌面通知 ──────────────────────────────────────────
function _requestNotifPermission() {
    if (!('Notification' in window) || Notification.permission !== 'default') return;
    Notification.requestPermission();
}

function _showBrowserNotif(title, body, icon, openUrl) {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    if (!document.hidden) return; // 使用者正在看頁面，toast 已夠用
    const n = new Notification(title, {
        body,
        icon: icon || '../webP/treasurehub.webp',
        badge: '../webP/treasurehub.webp',
        tag: 'treasurehub-chat', // 多則通知合併，不堆疊
    });
    n.onclick = () => {
        window.focus();
        if (openUrl) window.location.href = openUrl;
        n.close();
    };
}

// 帳號層級 SSE：頁面載入即建立連線，接收所有聊天室即時通知（顯示 chaticon 紅點 + toast）
window.addEventListener('load', async () => {
    const _notifSvc = new ChatBackendService();
    const myUsername = localStorage.getItem('username');

    // 初始未讀檢查 + 建立 partner cache
    try {
        const rooms = await _notifSvc.listRooms();
        let hasUnread = false;

        rooms.data.items?.forEach(data => {
            // 建立 partner cache（私人聊天室）
            if (data.type !== 'OFFICIAL') {
                const partner = data.members?.find(m => m.name !== myUsername);
                if (partner) {
                    _partnerCache.set(partner.name, {
                        name: partner.name,
                        photoURL: partner.photoURL || '../image/default-avatar.png',
                        userId: partner.id ?? partner.accountId ?? partner.userId ?? null
                    });
                }
            }
            // 判斷是否有未讀
            const isOfficial = data.type === 'OFFICIAL';
            const myself = data.members?.find(m => m.name === myUsername);
            const isMyMessage = data.lastMessage?.username === myself?.name;
            // 官方頻道：若 members 中找不到自己，改用 lastReadMessageId 欄位（部分 API 直接回傳）
            const myLastRead = myself?.lastReadMessageId ?? data.lastReadMessageId ?? null;
            if (data.lastMessageId != null
                && myLastRead !== data.lastMessageId
                && (isOfficial || !isMyMessage)) {
                hasUnread = true;
            }
        });

        if (hasUnread) window.dispatchEvent(new CustomEvent('chatUnread'));
        _requestNotifPermission(); // 登入確認後請求授權
    } catch (e) { /* 未登入或錯誤，略過 */ }

    const _notifSse = new EventSource(
        `${_notifSvc.baseUrl}/api/chat/stream`,
        { withCredentials: true }
    );
    _notifSse.addEventListener('newMessage', (event) => {
        const data = JSON.parse(event.data);
        if (data.username !== myUsername) {
            window.dispatchEvent(new CustomEvent('chatUnread'));
            _showChatToast(data);
            const partner = _partnerCache.get(data.username);
            _showBrowserNotif(
                `拾貨寶庫 — ${partner?.name ?? data.username}`,
                data.message?.trim() || '傳送了一張圖片',
                partner?.photoURL ?? '../webP/treasurehub.webp',
                `../chatroom/chatroom.html${partner?.userId ? '?openChat=' + partner.userId : ''}`
            );
        }
    });
    _notifSse.addEventListener('newBroadcast', (event) => {
        window.dispatchEvent(new CustomEvent('chatUnread'));
        try {
            const data = JSON.parse(event.data);
            const channelName = data.channelName || data.channel?.name || '拾貨寶庫公告';
            _showChatToast({
                username: '__official__',
                message: data.message || '新的官方公告',
                attachments: data.attachments,
                _overrideName: channelName,
                _overrideAvatar: '../webP/treasurehub.webp',
            });
            _showBrowserNotif(
                `拾貨寶庫 — ${channelName}`,
                data.message || '新的官方公告',
                '../webP/treasurehub.webp',
                '../chatroom/chatroom.html'
            );
        } catch (e) {}
    });
    _notifSse.addEventListener('ping', () => {});
    _notifSse.addEventListener('ready', () => {});
    _notifSse.onerror = () => { _notifSse.close(); };
});

// 手機版底部導覽列：未讀訊息紅點
function _updateNavBadge(show) {
  const badge = document.getElementById('chatNavBadge');
  if (!badge) return;
  badge.classList.toggle('show', show);
}

window.addEventListener('chatUnread', () => _updateNavBadge(true));

window.toggleChatInterface = toggleChatInterface;
window.canEnterChat = canEnterChat;
