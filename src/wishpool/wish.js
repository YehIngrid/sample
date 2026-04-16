import '../default/default.js';
import BackendService from '../BackendService.js';

const backendService = new BackendService();

function updateBadge(count) {
  const badge = document.getElementById('notificationBadge');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count;
    badge.classList.remove('d-none');
  } else {
    badge.classList.add('d-none');
  }
}

function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? '剛剛' : `${mins} 分鐘前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小時前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}

async function loadNotifications() {
  const res = await backendService.getNotifications();
  const notifications = res.data;

  const list = document.getElementById("notifList");
  list.innerHTML = "";

  let unreadCount = 0;

  notifications.forEach(n => {
    if (!n.isRead) unreadCount++;

    const item = document.createElement("div");
    item.className = "notif-item" + (n.isRead ? "" : " notif-unread");

    item.innerHTML = `
      <img src="${n.seller.avatar}" class="notif-avatar" width="40" height="40" alt="賣家頭像">
      <div class="notif-body">
        <div class="notif-text">
          <strong>${n.seller.name}</strong> 回應了你的願望，媒合商品：${n.product.name}
        </div>
        <div class="notif-time">${relativeTime(n.createdAt)}</div>
      </div>
    `;

    list.appendChild(item);
  });

  updateBadge(unreadCount);
}
function openNotifPanel() {
  document.getElementById("notificationPanel").classList.add("open");
  document.getElementById("notifBackdrop").classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeNotifPanel() {
  document.getElementById("notificationPanel").classList.remove("open");
  document.getElementById("notifBackdrop").classList.remove("open");
  document.body.style.overflow = "";
}

document.getElementById("notificationBtn").addEventListener("click", openNotifPanel);
document.getElementById("notifCloseBtn").addEventListener("click", closeNotifPanel);
document.getElementById("notifBackdrop").addEventListener("click", closeNotifPanel);