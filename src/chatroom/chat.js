import ChatBackendService from './ChatBackendService.js';

const talkInterface = document.getElementById('talkInterface');
const chatopen = document.getElementById('chaticon');

// 判斷目前頁面是否有底部導覽列（手機版頁面）
function hasBottomNav() {
  return !!document.querySelector('.bottom-nav');
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
    talkInterface.style.display = 'block';
  } else {
    talkInterface.style.display = 'none';
  }
}

// 桌機版：點擊外部關閉浮動視窗
window.addEventListener('click', function(e) {
    if (hasBottomNav()) return; // 手機版已跳頁，不需要此邏輯
    if (talkInterface.style.display === 'block' &&
        !talkInterface.contains(e.target) &&
        !chatopen.contains(e.target) &&
        !document.querySelector('.swal2-container')) {
        talkInterface.style.display = 'none';
    }
});

// 接收 iframe 內傳來的關閉訊號（桌機版浮動視窗關閉按鈕）
window.addEventListener('message', function(e) {
    if (e.data?.type === 'closeChat') {
        talkInterface.style.display = 'none';
        document.body.classList.remove('chat-open-mobile');
    }
});
async function canEnterChat() {
    // 官方公告不需要登入；私人訊息在 chatroom 內部處理
    return true;
}

// 帳號層級 SSE：頁面載入即建立連線，接收所有聊天室即時通知（顯示 chaticon 紅點）
window.addEventListener('load', async () => {
    const _notifSvc = new ChatBackendService();

    // 初始未讀檢查：頁面載入時若已有未讀訊息，立即亮紅點
    try {
        const rooms = await _notifSvc.listRooms();
        const username = localStorage.getItem('username');
        const hasUnread = rooms.data.items?.some(data => {
            const isOfficial = data.type === 'OFFICIAL';
            const myself = data.members?.find(m => m.name === username);
            const isMyMessage = data.lastMessage?.username === myself?.name;
            return data.lastMessageId != null
                && myself?.lastReadMessageId !== data.lastMessageId
                && (isOfficial || !isMyMessage);
        });
        if (hasUnread) window.dispatchEvent(new CustomEvent('chatUnread'));
    } catch (e) { /* 未登入或錯誤，略過 */ }

    const _notifSse = new EventSource(
        `${_notifSvc.baseUrl}/api/chat/stream`,
        { withCredentials: true }
    );
    _notifSse.addEventListener('newMessage', (event) => {
        const data = JSON.parse(event.data);
        if (data.username !== localStorage.getItem('username')) {
            window.dispatchEvent(new CustomEvent('chatUnread'));
        }
    });
    _notifSse.addEventListener('newBroadcast', () => {
        window.dispatchEvent(new CustomEvent('chatUnread'));
    });
    _notifSse.addEventListener('ping', () => {});
    _notifSse.addEventListener('ready', () => {});
    _notifSse.onerror = () => { _notifSse.close(); };
});

window.toggleChatInterface = toggleChatInterface;
window.canEnterChat = canEnterChat;