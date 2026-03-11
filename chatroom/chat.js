async function toggleChatInterface() {
  const isMobile = window.innerWidth <= 991;
  if (talkInterface.style.display === 'none' || talkInterface.style.display === '') {
    if(!await canEnterChat()) {
      talkInterface.style.display = 'none';
      return;
    }
    talkInterface.style.display = 'block';
    if (isMobile) document.body.classList.add('chat-open-mobile');
  } else {
    talkInterface.style.display = 'none';
    document.body.classList.remove('chat-open-mobile');
  }
}
// 2. 全域監聽：用來處理「點擊外部關閉」（桌機版才作用）
window.addEventListener('click', function(e) {
    if (window.innerWidth <= 991) return; // fullscreen on mobile — no outside-click dismiss
    if (talkInterface.style.display === 'block' &&
        !talkInterface.contains(e.target) &&
        !chatopen.contains(e.target) &&
    !document.querySelector('.swal2-container')) {
        talkInterface.style.display = 'none';
    }
});
// 3. 接收 iframe 內傳來的關閉訊號（手機版全螢幕關閉按鈕）
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
    if (typeof ChatBackendService === 'undefined') return; // 未引入 ChatBackendService 則略過
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