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
  try {
      await backendService.whoami();
      return true;
  } catch (error) {
      console.error('Error fetching user info:', error);
      if (error.response && (error.response.status === 401 || error.response.data.message === 'No JWT token provided')) {
          Swal.fire({ title: '請先登入會員', icon: 'warning', text: '您需要登入才能使用聊天室功能', showConfirmButton: true, confirmButtonText: '前往登入', showCancelButton: true }).then((result) => {
              if (result.isConfirmed) {
                  const currentUrl = window.location.pathname + window.location.search;
                  window.location.href = `../account/account.html?redirect=${encodeURIComponent(currentUrl)}`;
              }
          });
      } else {
          Swal.fire({ title: '發生錯誤，請稍後再試', icon: 'error' });
      }
      return false;
  }
}

// 帳號層級 SSE：頁面載入即建立連線，接收所有聊天室即時通知（顯示 chaticon 紅點）
window.addEventListener('load', () => {
    if (typeof ChatBackendService === 'undefined') return; // 未引入 ChatBackendService 則略過
    const _notifSvc = new ChatBackendService();
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
    _notifSse.addEventListener('ping', () => {});
    _notifSse.addEventListener('ready', () => {});
    _notifSse.onerror = () => { _notifSse.close(); };
});