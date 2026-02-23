async function toggleChatInterface() {
  if (talkInterface.style.display === 'none' || talkInterface.style.display === '') {
    try {
        await backendService.whoami();
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
        return;
    }
    talkInterface.style.display = 'block'; 
  } else {
    talkInterface.style.display = 'none'; 
  }
}