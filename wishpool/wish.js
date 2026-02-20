async function loadNotifications() {
  const res = await backendService.getNotifications();
  const notifications = res.data;

  const container = document.getElementById("notificationPanel");
  container.innerHTML = "";

  let unreadCount = 0;

  notifications.forEach(n => {
    if (!n.isRead) unreadCount++;

    const item = document.createElement("div");
    item.className = "notification-item d-flex p-2 border-bottom";

    item.innerHTML = `
      <img src="${n.seller.avatar}" 
           class="rounded-circle me-2" 
           width="40" height="40">

      <div>
        <div>
          <strong>${n.seller.name}</strong>
          回應了你的願望
        </div>
        <div class="text-muted small">
          媒合商品：${n.product.name}
        </div>
      </div>
    `;

    container.appendChild(item);
  });

  updateBadge(unreadCount);
}
document.getElementById("notificationBtn")
  .addEventListener("click", () => {
    const panel = document.getElementById("notificationPanel");
    panel.style.display =
      panel.style.display === "none" ? "block" : "none";
});