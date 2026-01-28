let backendService;
// 當整個頁面載入完成後，隱藏 loader 並顯示主要內容
window.onload = function() {
    // 當頁面載入完畢後隱藏載入動畫，顯示內容
  var loader = document.getElementById('loader');
  var content = document.getElementById('whatcontent');
  if (loader && content) {
    loader.style.setProperty('display', 'none', 'important');
    content.style.setProperty('display', 'block', 'important');
  }
}

// 判斷是否有 uid，顯示使用者資料
// 手機版
const mProfileName = document.getElementById('mProfileName');
const mProfileInfo = document.getElementById('mProfileInfo');
const mProfileAvatar = document.getElementById('mProfileAvatar');
mProfileName.textContent = localStorage.getItem("username") || "使用者名稱"; // 替換為實際使用者名稱
mProfileInfo.textContent = localStorage.getItem("intro") || "使用者介紹"; // 替換為實際使用者介紹
if (localStorage.getItem('avatar')) {
  mProfileAvatar.src = localStorage.getItem('avatar'); // 更新顯示的圖片
}
else { 
  mProfileAvatar.src = '../image/default-avatar.png'; // 替換為預設圖片的 URL
}
// 桌機版
const userRate = document.getElementById('rate');
const userRate1 = document.getElementById('rate1');
// const memberShip = document.getElementById('membership');
const showName = document.getElementById('showName');
const showIntro = document.getElementById('showIntro');
const profileName = document.getElementById('profileName');
const profileInfo = document.getElementById('profileInfo');
const profileAvatar = document.getElementById('profileAvatar');
  console.log("使用者名稱：", localStorage.getItem('username'));
  console.log("使用者介紹：", localStorage.getItem('intro'));
if (localStorage.getItem('avatar')) {
  profileAvatar.src = localStorage.getItem('avatar'); // 更新顯示的圖片
} else {
  profileAvatar.src = '../image/default-avatar.png'; // 替換為預設圖片的 URL
}
const el = document.getElementById('showTime');
const iso = localStorage.getItem('userCreatedAt'); // 例如 "2025-08-28T11:23:45.000Z"

if (!iso) {
  el.textContent = '無法顯示';
} else {
  const dt = new Date(iso); // 解析 UTC ISO
  if (isNaN(dt.getTime())) {
    el.textContent = '無法顯示';
  } else {
    el.textContent = dt.toLocaleDateString('zh-TW', {
      timeZone: 'Asia/Taipei',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }); // 例：2025/08/28
  }
}
userRate1.textContent = localStorage.getItem("rate") || "無法顯示";
userRate.textContent = localStorage.getItem("rate") || "無法顯示";
const localIntro = localStorage.getItem("intro") || "使用者介紹";
profileInfo.textContent = localIntro; // 替換為實際使用者介紹
showIntro.textContent = localIntro;
const localName = localStorage.getItem("username") ||"使用者名稱"; 
profileName.textContent = localName;// 替換為實際使用者名稱
showName.textContent = localName;
// TODO 使用者加入時間
//更新資料動作
document.getElementById('update-profile').addEventListener('click', async () => {
    const displayName = document.getElementById('display-name').value.trim();
    const photoInput = document.getElementById('photo');
    const bio = document.getElementById('bio').value.trim();
    const loader1 = document.getElementById('loader1');
    const formData = new FormData();
    if(!displayName && !bio && photoInput.files.length === 0){
      console.log("沒有任何資料");
      Swal.fire({
        icon: "warning",
        title: "請填寫完整資料",
        text: "請檢查是否有空白欄位"
      });
      return;
    }
    if (displayName) formData.append('name', displayName);
    if (bio) formData.append('introduction', bio);
    if (photoInput.files.length > 0) formData.append('photo', photoInput.files[0]);
    
    try {
      Swal.fire({
        title: "確定要進行更新嗎?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "是，我要更新",
        cancelButtonText: "取消"
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            // ✅ 顯示 loader
            loader1.style.display = 'block';

            backendService = new BackendService();
            const response = await backendService.updateProfile(formData);

            console.log("更新成功：", response);
            console.log(response.data.introduction);

            await Swal.fire({
              icon: "success",
              title: "更新成功",
              text: "個人資料已更新"
            });

            // 更新 DOM
            mProfileName.textContent = localStorage.getItem("username") || "使用者名稱";
            mProfileInfo.textContent = localStorage.getItem("intro") || "使用者介紹";
            mProfileAvatar.src = localStorage.getItem('avatar') || '../image/default-avatar.png';
            profileName.textContent = localStorage.getItem("username") || "使用者名稱";
            profileInfo.textContent = localStorage.getItem("intro") || "使用者介紹";
            profileAvatar.src = localStorage.getItem('avatar') || '../image/default-avatar.png';

            window.location.reload(); // 重新載入頁面以顯示最新資料
          } catch (errorMessage) {
            console.error("更新失敗：", errorMessage);
            Swal.fire({
              icon: "error",
              title: "更新失敗",
              text: errorMessage
            });
          } finally {
            loader1.style.display = 'none';
          }
        }
      });
    } catch (error) {
      console.error("更新失敗：", error);
      Swal.fire({
        icon: "error",
        title: "更新失敗",
        text: "請稍後再試"
      });
    }
  });
  
const logoutButton = document.getElementById('logout');
logoutButton.addEventListener('click', function() {
  Swal.fire({
    title: '確定要登出嗎？',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: '登出',
    cancelButtonText: '取消'
  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.removeItem('uid');
      localStorage.removeItem('username');
      localStorage.removeItem('intro');
      localStorage.removeItem('avatar');
      Swal.fire({
        icon: 'success',
        title: '登出成功',
        text: '您已成功登出'
      }).then(() => {
        window.location.href = '../account/account.html'; // 登出後跳轉到首頁
      });
    }
  });
});
const logoutMobileButton = document.getElementById('logoutMobile');
logoutMobileButton.addEventListener('click', function() {
  Swal.fire({
    title: '確定要登出嗎？',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: '登出',
    cancelButtonText: '取消'
  }).then(async(result) => {
    if (result.isConfirmed) {
    try {
      await backendService.logout();
      Swal.fire({
        icon: 'success',
        title: '登出成功',
        text: '您已成功登出'
      }).then(() => {
        window.location.href = '../account/account.html'; // 登出後跳轉到首頁
      });
    } catch (error) {
      Swal.fire({
        icon: 'error', 
        title: '登出失敗請稍後重試'
      })
    }
    }
  });
});
 // 左側選單切換右側 section
  document.querySelectorAll('.list-group-item[data-target]').forEach(item => {
    item.addEventListener('click', function (e) {
      e.preventDefault();
      resetOrderView();
      // 隱藏全部
      document.querySelectorAll('.content-section').forEach(sec => sec.classList.add('d-none'));
      // 顯示目標
      const target = this.getAttribute('data-target');
      const pane = document.getElementById(target);
      if (pane) pane.classList.remove('d-none');
      // 更新 active 樣式
      document.querySelectorAll('.list-group-item[data-target]').forEach(link => link.classList.remove('active'));
      this.classList.add('active');
    });
  });

function resetOrderView() {
  // 賣家
  const sellSection = document.getElementById('sellProducts');
  if (sellSection) {
    const table = sellSection.querySelector('table');
    const detail = document.getElementById('sellOrderDetail');
    if (table) table.style.display = '';
    if (detail) detail.classList.add('d-none');
  }

  // 買家
  const buySection = document.getElementById('buyProducts');
  if (buySection) {
    const table = buySection.querySelector('table');
    const detail = document.getElementById('buyerOrderDetail');
    if (table) table.style.display = '';
    if (detail) detail.classList.add('d-none');
  }
}

// TODO 更改大頭照預覽
document.getElementById('photo').addEventListener('change', function (e) {
  const preview = document.getElementById('myAvatarPreview');
  preview.innerHTML = ''; // 清除舊圖

  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    const img = document.createElement('img');
    img.src = event.target.result;
    img.style.width = '150px';
    img.style.height = '150px';
    img.style.margin = '10px';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '50%';
    img.style.border = '2px solid #ccc';
    img.style.boxShadow = '0 0 6px rgba(0,0,0,0.1)';
    preview.appendChild(img);
  };
  reader.readAsDataURL(file);
});
document.addEventListener('DOMContentLoaded', () => {
  backendService = new BackendService();

  backendService.getMyItems(
    (response) => {
      const list = response?.data?.commodities ?? [];
      renderTable(list);
      renderCards(list);     // 手機用的卡片
      console.log(list);
    },
    (errorMessage) => {
      console.error(errorMessage);
      renderTable([]);
      renderCards([]);
    }
  );
  // const res = await backendService.getSellerOrders();

  // 事件委派（表格）
  document.querySelector('#products tbody')?.addEventListener('click', onRowAction);
  // 事件委派（卡片）
  document.querySelector('#product-cards')?.addEventListener('click', onCardAction);
  
  
  // 讀取賣家訂單
});
document.addEventListener('DOMContentLoaded', async () => {
  backendService = new BackendService();
  try {
    const response = await backendService.getSellerOrders();
    const list = response?.data?.data ?? [];
    renderSellerOrders(list);
    renderSellerCards(list);
  } catch (error) {
    renderSellerOrders([]);
    renderSellerCards([]);
    Swal.fire({
      title:"錯誤", 
      text: error, 
      icon: 'error'
    })
  }
  document.querySelector('#sellProducts tbody')?.addEventListener('click', onRowAction);
  document.querySelector('#sell-product')?.addEventListener('click', onCardAction);

  try {
    const response = await backendService.getBuyerOrders();
    const list = response?.data?.data ?? [];
    renderBuyerOrders(list);
    renderBuyerCards(list);
  } catch (error) {
    renderBuyerOrders([]);
    renderBuyerCards([]);
    Swal.fire({
      title:"錯誤", 
      text: error, 
      icon: 'error'
    })
  }
  document.querySelector('#buyProducts tbody')?.addEventListener('click', onRowAction);
  document.querySelector('#buy-product')?.addEventListener('click', onCardAction);
});

// ===== 工具 =====
const STATUS_MAP = {
  listed:   { text: '上架中',  badge: 'text-bg-success',  action: '編輯商品' },
  sold:     { text: '已售出',  badge: 'text-bg-secondary',action: '查看' },
  reserved: { text: '訂單處理中',  badge: 'text-bg-warning',  action: '查看' },
};
const order_STATUS_MAP = {
  pending: { text: '等待賣家接受訂單', badge: 'text-bg-warning', action: '接受訂單'}, 
  preparing: { text: '準備訂單', badge: 'text-bg-info', action: '即將出貨'}, 
  delivered: { text: '已出貨', badge: 'text-bg-primary', action: '確認出貨'}, 
  completed: { text: '買家成功取貨', badge: 'text-bg-success', action: '給對方評價'}, 
  canceled: { text: '訂單已被取消', badge: 'text-bg-danger' , action: '查看'}
}
const buyer_STATUS_MAP = {
  pending: { text: '等待賣家接受訂單', badge: 'text-bg-warning', action: '聯絡賣家'}, 
  preparing: { text: '賣家正在準備訂單', badge: 'text-bg-info', action: '聯絡賣家'}, 
  delivered: { text: '已出貨', badge: 'text-bg-primary', action: '成功取貨'}, 
  completed: { text: '已取貨', badge: 'text-bg-success', action: '給對方評價'}, 
  canceled: { text: '訂單已被取消', badge: 'text-bg-danger' , action: '查看'}
}
const nt = new Intl.NumberFormat('zh-TW', {
  style: 'currency', currency: 'TWD', maximumFractionDigits: 0
});

function fmtPrice(v) {
  if (v == null || isNaN(Number(v))) return '-';
  return nt.format(Number(v));
}

function fmtDate(v) {
  if (!v) return '-';
  const d = new Date(v);
  if (isNaN(d)) return '-';
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}/${m}/${day}`;
}

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, s =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s])
  );
}
function renderBuyerOrders(list) {
  const tbody = document.querySelector('#buyProducts tbody');
  if (!tbody) return;
  console.log('BuyerList:', list);
  if (!Array.isArray(list) || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-5">目前沒有訂單</td></tr>`;
    return;
  }
  const rows = list.map(item => {
    const id       = item.id;
    const name     = esc(item.name);
    const price    = fmtPrice(item.totalAmount);
    const seller = item.sellerUser.name;
    const type = item.type || '未知交易方式';
    const created  = fmtDate(item.createdAt);
    const key      = (item.status ?? 'listed').toLowerCase();
    const st       = buyer_STATUS_MAP[key] ?? buyer_STATUS_MAP.listed;
    const log = esc(item.log || '無詳細資訊');
  
  return `
      <tr data-id="${esc(id)}">
        <td>${id}</td>
        <td><span class="badge ${st.badge}">${st.text}</span></td>
        <td>${created}</td>
        <td>${price} 元</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-dark btn-row-action" data-action="checkInfo">查看訂單詳情</button>
          <button class="btn btn-sm btn-outline-primary btn-row-action" data-action="${st.action}">${st.action}</button>
          <button class="btn btn-sm btn-outline-danger btn-row-action" data-action="cancel">取消訂單</button>
        </td>
      </tr>
    `;
  }).join('');
  tbody.innerHTML = rows;
}

function renderSellerOrders(list) {
  const tbody = document.querySelector('#sellProducts tbody');
  if (!tbody) return;
  console.log('List:' , list);
  if (!Array.isArray(list) || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-5">目前沒有訂單</td></tr>`;
    return;
  }
  const rows = list.map(item => {
    const id       = item.id;
    const name     = esc(item.name);
    const price    = fmtPrice(item.totalAmount);
    const buyer = item.buyerUser.name;
    const type = item.type || '未知交易方式';
    const created  = fmtDate(item.createdAt);
    const key      = (item.status ?? 'listed').toLowerCase();
    const st       = order_STATUS_MAP[key] ?? order_STATUS_MAP.listed;
    return `
      <tr data-id="${esc(id)}">
        <td>${id}</td>
        <td><span class="badge ${st.badge}">${st.text}</span></td>
        <td>${created}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-dark btn-row-action" data-action="checkInfo">查看訂單詳情</button>
          <button class="btn btn-sm btn-outline-primary btn-row-action" data-action="${st.action}">${st.action}</button>
          <button class="btn btn-sm btn-outline-danger btn-row-action" data-action="cancel">取消訂單</button>
        </td>
      </tr>
    `;
  }).join('');
  tbody.innerHTML = rows;
}

// ===== 渲染：桌機表格 =====
function renderTable(list = []) {
  const tbody = document.querySelector('#products tbody');
  if (!tbody) return;

  if (!Array.isArray(list) || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-5">目前沒有商品</td></tr>`;
    return;
  }

  const rows = list.map(item => {
    const id       = item.id;
    const name     = esc(item.name);
    const price    = fmtPrice(item.price);
    const updated  = fmtDate(item.updatedAt);
    const created  = fmtDate(item.createdAt);
    const key      = (item.status ?? 'listed').toLowerCase();
    const st       = STATUS_MAP[key] ?? STATUS_MAP.listed;

    return `
      <tr data-id="${esc(id)}">
        <td>${name}</td>
        <td><span class="badge ${st.badge}">${st.text}</span></td>
        <td>${price}</td>
        <td>${created}</td>
        <td>${updated}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-success btn-row-action" data-action="check">查看商品</button>
          <button class="btn btn-sm btn-outline-primary btn-row-action" data-action="${st.action}">${st.action}</button>
          <button class="btn btn-sm btn-outline-danger btn-row-action" data-action="delete">永久下架商品</button>
        </td>
      </tr>
    `;
  }).join('');

  tbody.innerHTML = rows;
}

// 表格事件處理
function onRowAction(e) {
  const btn = e.target.closest('.btn-row-action');
  if (!btn) return;

  const tr = btn.closest('tr');
  const id = tr?.dataset.id;
  const action = btn.dataset.action;
  if (!id) return;

  handleAction(action, id, tr);
}

// ===== 渲染：手機卡片 =====
function renderCards(list = []) {
  const wrap = document.getElementById('product-cards');
  if (!wrap) return;

  if (!Array.isArray(list) || list.length === 0) {
    wrap.innerHTML = `<div class="col-12 text-center text-muted py-5">目前沒有商品</div>`;
    return;
  }

  const html = list.map(item => {
    const id       = item.id;
    const name     = esc(item.name);
    const price    = fmtPrice(item.price);
    const updated  = fmtDate(item.updatedAt);
    const created  = fmtDate(item.createdAt);
    const key      = (item.status ?? 'listed').toLowerCase();
    const st       = STATUS_MAP[key] ?? STATUS_MAP.listed;
    const img      = esc(item.mainImage || item.imageUrl || '../image/placeholder.png');

    return `
      <div class="col" data-id="${esc(id)}">
        <div class="card h-100 shadow-sm">
          <div class="card-body d-flex flex-column">
            <div class="d-flex flex-row">
              <div class="bg-light">
                <img src="${img}" alt="${name}" class="object-cover">
              </div>
              <div>
                <h6 class="mb-0 text-truncate" title="${name}">${name}</h6>
                <span class="badge ${st.badge}">${st.text}</span>
                <div class="small text-muted mb-2">建立：${created}<br>更新：${updated}</div>
                <div class="fw-bold mb-2">${price}</div>
              </div>
            </div>
            <div class="mt-auto d-flex gap-2">
              <button class="btn btn-outline-success btn-sm btn-card-action" data-action="check">查看商品</button>
              <button class="btn btn-outline-primary btn-sm btn-card-action" data-action="${st.action}">${st.action}</button>
              <button class="btn btn-outline-danger btn-sm btn-card-action" data-action="delete">永久下架商品</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  wrap.innerHTML = html;
}
function renderSellerCards(list = []) {
  const wrap = document.getElementById('sell-product');
  if (!wrap) return;

  if (!Array.isArray(list) || list.length === 0) {
    wrap.innerHTML = `<div class="col-12 text-center text-muted py-5">目前沒有商品</div>`;
    return;
  }

  const html = list.map(item => {
    const id       = item.id;
    const name     = esc(item.name);
    const price    = fmtPrice(item.price);
    const updated  = fmtDate(item.updatedAt);
    const created  = fmtDate(item.createdAt);
    const key      = (item.status ?? 'listed').toLowerCase();
    const st       = order_STATUS_MAP[key] ?? order_STATUS_MAP.listed;
    const img      = esc(item.mainImage || item.imageUrl || '../image/placeholder.png');

    return `
      <div class="col" data-id="${esc(id)}">
        <div class="card h-100 shadow-sm">
          <div class="card-body d-flex flex-column">
            <div class="d-flex flex-row">
              <div class="bg-light">
                <img src="${img}" alt="${name}" class="object-cover">
              </div>
              <div>
                <h6 class="mb-0 text-truncate" title="${name}">${name}</h6>
                <span class="badge ${st.badge}">${st.text}</span>
                <div class="small text-muted mb-2">建立：${created}<br>更新：${updated}</div>
                <div class="fw-bold mb-2">${price}</div>
              </div>
            </div>
            <div class="mt-auto d-flex gap-2">
              <button class="btn btn-outline-success btn-sm btn-card-action" data-action="checkInfo">查看訂單詳情</button>
              <button class="btn btn-outline-primary btn-sm btn-card-action" data-action="${st.action}">${st.action}</button>
              <button class="btn btn-outline-danger btn-sm btn-card-action" data-action="delete">取消訂單</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  wrap.innerHTML = html;
}
function renderBuyerCards(list = []) {
  const wrap = document.getElementById('buy-product');
  if (!wrap) return;

  if (!Array.isArray(list) || list.length === 0) {
    wrap.innerHTML = `<div class="col-12 text-center text-muted py-5">目前沒有商品</div>`;
    return;
  }

  const html = list.map(item => {
    const id       = item.id;
    const name     = esc(item.name);
    const price    = fmtPrice(item.price);
    const updated  = fmtDate(item.updatedAt);
    const created  = fmtDate(item.createdAt);
    const key      = (item.status ?? 'listed').toLowerCase();
    const st       = buyer_STATUS_MAP[key] ?? buyer_STATUS_MAP.listed;
    const img      = esc(item.mainImage || item.imageUrl || '../image/placeholder.png');

    return `
      <div class="col" data-id="${esc(id)}">
        <div class="card h-100 shadow-sm">
          <div class="card-body d-flex flex-column">
            <div class="d-flex flex-row">
              <div class="bg-light">
                <img src="${img}" alt="${name}" class="object-cover">
              </div>
              <div>
                <h6 class="mb-0 text-truncate" title="${name}">${name}</h6>
                <span class="badge ${st.badge}">${st.text}</span>
                <div class="small text-muted mb-2">建立：${created}<br>更新：${updated}</div>
                <div class="fw-bold mb-2">${price}</div>
              </div>
            </div>
            <div class="mt-auto d-flex gap-2">
              <button class="btn btn-outline-success btn-sm btn-card-action" data-action="checkInfo">查看訂單詳情</button>
              <button class="btn btn-outline-primary btn-sm btn-card-action" data-action="${st.action}">${st.action}</button>
              <button class="btn btn-outline-danger btn-sm btn-card-action" data-action="delete">取消訂單</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  wrap.innerHTML = html;
}
// 卡片事件處理
function onCardAction(e) {
  const btn = e.target.closest('.btn-card-action');
  if (!btn) return;

  const card = btn.closest('[data-id]');
  const id = card?.dataset.id;
  const action = btn.dataset.action;
  if (!id) return;

  handleAction(action, id, card);
}

// ===== 共用：按鈕動作（表格/卡片都走這裡） =====
async function handleAction(action, id, rowOrCardEl) {
  if (action === '編輯商品') {
    console.log('編輯商品：', id);
    openEditDrawer(id, rowOrCardEl);
    // TODO: 打開編輯頁 / Modal
  } else if (action === 'check') {
    const url = `../product/product.html?id=${encodeURIComponent(id)}`;
    window.open(url, '_blank');
  } else if (action === 'stop') {
    if (confirm('確定要暫停上架商品嗎?')) {
      // TODO: 呼叫暫停 API
      console.log('暫停上架：', id);
    }
  } else if (action === '接受訂單') {
    try {
      await backendService.sellerAcceptOrders(id);
      Swal.fire({
        title: '已同意訂單，系統將自動通知買家', 
        icon: 'success',
      })
      window.location.reload();
    } catch (error) {
      Swal.fire({
        title: '訂單同意失敗，請稍後再試', 
        icon: 'error',
        text: error
      })
    }
  } else if (action === '即將出貨') {
    try {
      await backendService.sellerDeliveredOrders(id);
      Swal.fire({
        title: '請在約定的時間與地點與買家進行交易', 
        icon: 'success',
      }).then(() => {
        window.location.reload();
      })
    } catch (error) {
      Swal.fire({
        title: '系統登記出貨失敗，請稍後再試', 
        icon: 'error',
        text: error
      })
    }
  } else if (action === '成功取貨') {
    try {
      await backendService.buyerCompletedOrders(id);
      Swal.fire({
        title: "感謝您使用拾貨寶庫進行交易! 已通知賣家您已確認商品正確無誤",
        text: "可以對賣家進行此次的交易評分",
        icon: "success",
      }).then(() => {
        window.location.reload();
      });
    } catch (error) {
      Swal.fire({
        title: '系統登記取貨失敗，請稍後再試', 
        icon: 'error',
        text: error
      })
    }
  } else if (action === 'checkInfo') {
    try {
      let res = await backendService.getOrderDetails(id);

      const sellSection = document.getElementById('sellProducts');
      const buySection = document.getElementById('buyProducts');

      const sellTable = sellSection.querySelector('table');
      const buyTable = buySection.querySelector('table');

      const sellDetail = document.getElementById('sellOrderDetail');
      const buyDetail = document.getElementById('buyerOrderDetail');

      const item = res.data?.data;
      const orderStatus = item.status;
      const type = res.data.data.type;
      const builtOrderTime = new Date(res.data.data.createdAt).toLocaleDateString();
      const buyerName = res.data.data.buyerUser.name; 
      const sellerName = res.data.data.sellerUser.name;
      const totalAmount = res.data.data.totalAmount;
      console.log('res: ', res);
      // 填入資訊（你原本的）
      document.getElementById('sellOrderInfo').innerHTML = `
        <p>訂單編號： ${id}</p>
        <p>狀態： ${orderStatus}</p>
        <p>交貨方式： ${type}</p>
        <p>建立日期： ${builtOrderTime}</p>
        <p>買家姓名：${buyerName}</p>
        <p style="text-align: end;">總計： <span style="font-weight: 600; color: var(--brand-color)">${totalAmount}</span> 元</p>
      `;
      document.getElementById('buyerOrderInfo').innerHTML = `
        <p>訂單編號： ${id}</p>
        <p>狀態： ${orderStatus}</p>
        <p>交貨方式： ${type}</p>
        <p>建立日期： ${builtOrderTime}</p>
        <p>賣家姓名：${sellerName}</p>
        <p style="text-align: end;">總計： <span style="font-weight: 600; color: var(--brand-color)">${totalAmount}</span> 元</p>
      `;

      updateOrderFlowImg(orderStatus);

      // 🔥 關鍵：切換畫面
      if (!sellSection.classList.contains('d-none')) {
        sellTable.style.display = 'none';
        sellDetail.classList.remove('d-none');
      }

      if (!buySection.classList.contains('d-none')) {
        buyTable.style.display = 'none';
        buyDetail.classList.remove('d-none');
      }
    } catch (error) {
      Swal.fire({
        title: 'Oops', 
        icon: 'error', 
        text: error
      })
    }
} else if (action === 'delete') {
    Swal.fire({
      title: "確定要下架並刪除此商品嗎？",
      text: "無法再查看商品詳細資訊",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "是，我要下架",
      cancelButtonText: "取消"
    }).then((result) => {
      if (result.isConfirmed) {
        backendService.deleteMyItems(id,
          () => {
            Swal.fire({ icon: "success", title: "商品下架成功" });
            // 同時移除表格列與卡片
            removeItemDom(id);
          },
          (err) => alert('刪除失敗：' + err)
        );
      }
    });
  }
  // person.js

}

function updateOrderFlowImg(status) {
  const img = document.getElementById("flowImage");
  const imgbuyer = document.getElementById("flowImagebuyer");
  const map = {
    pending:   "../svg/allstate_pending.svg",
    preparing: "../svg/allstate_preparing.svg",
    c2c:       "../svg/allstate_ctoc.svg",
    delivered: "../svg/allstate_deliver.svg",
    completed: "../svg/allstate_finish.svg"
  };

  img.src = map[status] || "../svg/allstate.svg";  // 預設灰色
  imgbuyer.src = map[status] || "../svg/allstate.svg";
}

(() => {
  'use strict';

  let currentEditId = null;

  // 主圖預覽的 ObjectURL
  let mainPreviewObjectUrl = null;

  // 次要圖：既有 URL 與「這次新選」的檔案
  let existingSecondaryUrls = [];     // 從後端帶入（如果有）
  let selectedSecondaryFiles = [];    // 使用者新選的檔案（有則覆蓋全部）
  let secondaryObjectUrls = [];       // 只為預覽用，render 後要記得 revoke

  const LIMIT_COUNT = 5;
  const LIMIT_MB = 5;

  let el = null;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    el = getEls();
    if (!el.drawer || !el.form) {
      console.error('[edit-drawer] 缺少 Drawer 必要節點 (#editDrawer / #editItemForm)');
      return;
    }

    // 主圖預覽
    el.image?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) { hideMainPreview(); return; }
      if (mainPreviewObjectUrl) URL.revokeObjectURL(mainPreviewObjectUrl);
      mainPreviewObjectUrl = URL.createObjectURL(file);
      el.imagePreview.src = mainPreviewObjectUrl;
      el.imagePreview.classList.remove('d-none');
    });

    // 次要圖選擇（多檔）
    el.imagesInput?.addEventListener('change', (e) => {
      const files = Array.from(e.target.files || []);
      const okFiles = [];

      for (const f of files) {
        const sizeMB = f.size / (1024 * 1024);
        if (sizeMB > LIMIT_MB) {
          Swal.fire({ icon: 'warning', title: '檔案過大', text: `${f.name} 超過 ${LIMIT_MB}MB` });
          continue;
        }
        okFiles.push(f);
      }

      // 最多 5 張
      selectedSecondaryFiles = okFiles.slice(0, LIMIT_COUNT);

      // 只要有新檔就視為覆蓋 → 不顯示既有，改顯示新檔預覽
      renderSecondaryPreview();
      syncFileInputFromSelected();
      updateSecondaryHint();
    });

    // 取消/關閉/ESC
    el.cancelBtn?.addEventListener('click', closeEditDrawer);
    el.closeBtn?.addEventListener('click', closeEditDrawer);
    el.backdrop?.addEventListener('click', closeEditDrawer);
    window.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && !el.drawer.hidden) closeEditDrawer();
    });

    // 送出儲存
    el.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentEditId) return;

      const formData = new FormData();
      formData.append('name', el.name.value.trim());
      formData.append('price', el.price.value);
      formData.append('category', el.category.value);
      formData.append('description', el.description.value);

      // 主圖（可選）
      const mainFile = el.image?.files?.[0];
      if (mainFile) formData.append('image', mainFile);

      // 次要圖（若有新選就覆蓋全部）
      if (selectedSecondaryFiles.length > 0) {
        selectedSecondaryFiles.forEach(file => formData.append('otherImages[]', file));
        // 若後端要旗標可打開：
        // formData.append('replaceAllOtherImages', 'true');
      } else {
        // 沒有新選 → 保留現有，不需傳 anything（依後端規則）
        // 如果後端要你帶既有 URL 以保留可這樣做：
        // existingSecondaryUrls.forEach(u => formData.append('existingOtherImages[]', u));
      }

      try {
        const config = { headers: { 'Content-Type': 'multipart/form-data' } };
        await backendService.updateMyItems(currentEditId, formData, config);

        await Swal.fire({ icon: 'success', title: '已更新' });

        // 若你有前端即時更新列表可在這裡補：
        if (typeof window.tryUpdateListDom === 'function') {
          window.tryUpdateListDom(currentEditId, {
            name: el.name.value.trim(),
            price: el.price.value
          });
        }

        closeEditDrawer();
        // 你之前提出「更新完要重新載入」
        location.reload();
      } catch (err) {
        console.error(err);
        Swal.fire({ icon: 'error', title: '更新失敗', text: String(err || '請稍後再試') });
      }
    });

    // 將開關方法掛到全域
    window.openEditDrawer = openEditDrawer;
    window.closeEditDrawer = closeEditDrawer;
  }

  function getEls() {
    return {
      drawer: document.getElementById('editDrawer'),
      backdrop: document.getElementById('editDrawerBackdrop'),
      closeBtn: document.getElementById('editDrawerCloseBtn'),
      cancelBtn: document.getElementById('editDrawerCancelBtn'),
      form: document.getElementById('editItemForm'),
      id: document.getElementById('edit-id'),
      name: document.getElementById('edit-name'),
      price: document.getElementById('edit-price'),
      category: document.getElementById('edit-category'),
      description: document.getElementById('edit-description'),
      image: document.getElementById('edit-image'),
      imagePreview: document.getElementById('edit-image-preview'),
      imagesInput: document.getElementById('edit-images'),
      imagesPreview: document.getElementById('edit-images-preview'),
      imagesHint: document.getElementById('edit-images-hint'),
    };
  }

  async function openEditDrawer(id, rowOrCardEl = null) {
    currentEditId = id;
    el.id.value = id;

    // 重置表單 + 清預覽
    el.form.reset();
    hideMainPreview();
    resetSecondary();

    // （可選）載入單筆資料填入表單
    // 若你有 backendService.getMyItem(id, ok, err) 可打開這段
    try {
      if (backendService?.getMyItem) {
        await new Promise((resolve, reject) => {
          backendService.getMyItem(id, (res) => {
            const item = res?.data ?? {};
            fillForm(item);
            resolve();
          }, (err) => reject(err));
        });
      }
    } catch (e) {
      console.warn('讀取商品失敗，將以空白表單開啟', e);
    }

    // 顯示 Drawer
    el.drawer.hidden = false;
    el.backdrop.hidden = false;
    requestAnimationFrame(() => {
      el.drawer.classList.add('show');
      el.backdrop.classList.add('show');
      document.body.classList.add('overflow-hidden');
      el.name?.focus();
    });
  }

  function closeEditDrawer() {
    el.drawer.classList.remove('show');
    el.backdrop.classList.remove('show');
    document.body.classList.remove('overflow-hidden');
    setTimeout(() => {
      el.drawer.hidden = true;
      el.backdrop.hidden = true;
      hideMainPreview();
      resetSecondary();
    }, 200);
  }

  function fillForm(item) {
    el.name.value = item.name ?? '';
    el.price.value = item.price ?? '';
    el.category.value = item.category ?? '';
    el.description.value = item.description ?? '';

    // 主圖
    if (item.imageUrl) {
      el.imagePreview.src = item.imageUrl;
      el.imagePreview.classList.remove('d-none');
    } else {
      hideMainPreview();
    }

    // 次要圖（既有 URL）
    existingSecondaryUrls = Array.isArray(item.otherImageUrls)
      ? item.otherImageUrls
      : (Array.isArray(item.images) ? item.images.slice(1) : []); // 若後端把 images[0] 當主圖
    selectedSecondaryFiles = [];
    renderSecondaryPreview();
    updateSecondaryHint();
  }

  /* ---------- 主圖工具 ---------- */
  function hideMainPreview() {
    el.imagePreview.classList.add('d-none');
    el.imagePreview.removeAttribute('src');
    if (mainPreviewObjectUrl) {
      URL.revokeObjectURL(mainPreviewObjectUrl);
      mainPreviewObjectUrl = null;
    }
  }

  /* ---------- 次要圖工具 ---------- */
  function resetSecondary() {
    // 釋放上次預覽用的 object URL
    secondaryObjectUrls.forEach(url => URL.revokeObjectURL(url));
    secondaryObjectUrls = [];

    existingSecondaryUrls = [];
    selectedSecondaryFiles = [];
    if (el.imagesInput) el.imagesInput.value = '';
    if (el.imagesPreview) el.imagesPreview.innerHTML = '';
    updateSecondaryHint();
  }

  function renderSecondaryPreview() {
    if (!el.imagesPreview) return;

    // 釋放前次建立的 object URLs
    secondaryObjectUrls.forEach(url => URL.revokeObjectURL(url));
    secondaryObjectUrls = [];

    el.imagesPreview.innerHTML = '';
    const usingNew = selectedSecondaryFiles.length > 0;

    if (usingNew) {
      selectedSecondaryFiles.forEach((file, idx) => {
        const url = URL.createObjectURL(file);
        secondaryObjectUrls.push(url);

        const col = document.createElement('div');
        col.className = 'col-4';
        col.innerHTML = `
          <div class="thumb-card1">
            <span class="badge rounded-pill text-bg-primary thumb-badge">新</span>
            <button type="button" class="btn btn-sm btn-outline-danger thumb-remove" data-index="${idx}">&times;</button>
            <img src="${url}" alt="${file.name}">
          </div>
        `;
        el.imagesPreview.appendChild(col);
      });

      // 綁刪除（只對新檔）
      el.imagesPreview.querySelectorAll('.thumb-remove').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.getAttribute('data-index'));
          if (!Number.isNaN(idx)) {
            selectedSecondaryFiles.splice(idx, 1);
            renderSecondaryPreview();
            syncFileInputFromSelected();
            updateSecondaryHint();
          }
        });
      });
    } else {
      // 顯示既有 URL（純預覽，不給個別刪除；若要改規則可再調）
      existingSecondaryUrls.forEach((href) => {
        const col = document.createElement('div');
        col.className = 'col-4';
        col.innerHTML = `
          <div class="thumb-card1">
            <span class="badge rounded-pill text-bg-secondary thumb-badge">既有</span>
            <img src="${href}" alt="existing">
          </div>
        `;
        el.imagesPreview.appendChild(col);
      });
    }
  }

  function updateSecondaryHint() {
    if (!el.imagesHint) return;
    const count = (selectedSecondaryFiles.length > 0)
      ? Math.min(selectedSecondaryFiles.length, LIMIT_COUNT)
      : existingSecondaryUrls.length;
    el.imagesHint.textContent = `已選 ${count} / ${LIMIT_COUNT}`;
  }

  // FileList 不可直接改，使用 DataTransfer 重建 input.files
  function syncFileInputFromSelected() {
    if (!el.imagesInput) return;
    const dt = new DataTransfer();
    selectedSecondaryFiles.slice(0, LIMIT_COUNT).forEach(f => dt.items.add(f));
    el.imagesInput.files = dt.files;
  }

})();


// 賣家返回列表
document.getElementById('backToSellTable')?.addEventListener('click', () => {
  const section = document.getElementById('sellProducts');
  section.querySelector('table').style.display = '';
  document.getElementById('sellOrderDetail').classList.add('d-none');
});

// 買家返回列表
document.getElementById('backToBuyTable')?.addEventListener('click', () => {
  const section = document.getElementById('buyProducts');
  section.querySelector('table').style.display = '';
  document.getElementById('buyerOrderDetail').classList.add('d-none');
});


function removeItemDom(id) {
  // 表格
  document.querySelector(`#products tbody tr[data-id="${CSS?.escape ? CSS.escape(id) : id}"]`)?.remove();
  // 卡片（每張卡外層 .col 有 data-id）
  document.querySelector(`#product-cards [data-id="${CSS?.escape ? CSS.escape(id) : id}"]`)?.remove();
}
