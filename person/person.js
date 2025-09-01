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
const identify = document.getElementById('identify');
const memberShip = document.getElementById('membership');
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
memberShip.textContent = "尚未開放";
identify.textContent = "已驗證";
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
 // 左側選單切換右側 section
  document.querySelectorAll('.list-group-item[data-target]').forEach(item => {
    item.addEventListener('click', function (e) {
      e.preventDefault();
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

  // 事件委派（表格）
  document.querySelector('#products tbody')?.addEventListener('click', onRowAction);
  // 事件委派（卡片）
  document.querySelector('#product-cards')?.addEventListener('click', onCardAction);
});

// ===== 工具 =====
const STATUS_MAP = {
  listed:   { text: '上架中',  badge: 'text-bg-success',  action: '編輯' },
  sold:     { text: '已售出',  badge: 'text-bg-secondary',action: '查看' },
  reserved: { text: '保留中',  badge: 'text-bg-warning',  action: '查看' },
  draft:    { text: '草稿',    badge: 'text-bg-light',    action: '編輯' },
  delete:   { text: '已下架',  badge: 'text-bg-danger',   action: '查看' }
};

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
          <button class="btn btn-sm btn-outline-primary btn-row-action" data-action="edit">${st.action}</button>
          <button class="btn btn-sm btn-outline-secondary btn-row-action" data-action="stop">暫停上架商品</button>
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
    const img      = esc(item.mainImage || item.imageUrl || '../webP/placeholder.webp');

    return `
      <div class="col" data-id="${esc(id)}">
        <div class="card h-100 shadow-sm">
          <div class="bg-light">
            <img src="${img}" alt="${name}" class="object-cover">
          </div>
          <div class="card-body d-flex flex-column">
            <div class="d-flex align-items-center justify-content-between mb-1">
              <h6 class="mb-0 text-truncate" title="${name}">${name}</h6>
              <span class="badge ${st.badge}">${st.text}</span>
            </div>
            <div class="small text-muted mb-2">建立：${created} · 更新：${updated}</div>
            <div class="fw-bold mb-2">${price}</div>
            <div class="mt-auto d-grid gap-2">
              <button class="btn btn-outline-success btn-sm btn-card-action" data-action="check">查看商品</button>
              <button class="btn btn-outline-primary btn-sm btn-card-action" data-action="edit">${st.action}</button>
              <button class="btn btn-outline-secondary btn-sm btn-card-action" data-action="stop">暫停上架商品</button>
              <button class="btn btn-outline-danger btn-sm btn-card-action" data-action="delete">永久下架商品</button>
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
function handleAction(action, id, rowOrCardEl) {
  if (action === 'edit') {
    console.log('編輯商品：', id);
    openEditDrawer(id, rowOrCardEl);
    // TODO: 打開編輯頁 / Modal
  } else if (action === 'check') {
    location.href = `../product/product.html?id=${encodeURIComponent(id)}`;
  } else if (action === 'stop') {
    if (confirm('確定要暫停上架商品嗎?')) {
      // TODO: 呼叫暫停 API
      console.log('暫停上架：', id);
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
(() => {
  'use strict';

  let currentEditId = null;
  let previewObjectUrl = null;
  let el = null;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    el = getEls();
    if (!el.drawer || !el.form) {
      console.error('[person.js] 缺少 Drawer 必要節點 (#editDrawer / #editItemForm)');
      return;
    }

    // 圖片預覽
    el.image?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) { hidePreview(); return; }
      if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
      previewObjectUrl = URL.createObjectURL(file);
      el.imagePreview.src = previewObjectUrl;
      el.imagePreview.classList.remove('d-none');
    });

    // 取消/關閉/ESC
    el.cancelBtn?.addEventListener('click', closeEditDrawer);
    el.closeBtn?.addEventListener('click', closeEditDrawer);
    el.backdrop?.addEventListener('click', closeEditDrawer);
    window.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && !el.drawer.hidden) closeEditDrawer();
    });

    // 送出儲存
    el.form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!currentEditId) return;

      const formData = new FormData();
      formData.append('name', el.name.value.trim());
      formData.append('price', el.price.value);
      formData.append('category', el.category.value);
      formData.append('description', el.description.value);

      const statusValue = el.status.listed.checked ? 'listed'
                        : el.status.reserved.checked ? 'reserved'
                        : 'sold';
      formData.append('status', statusValue);

      const file = el.image?.files?.[0];
      if (file) formData.append('image', file);

      // 依你的 backendService 介面
      backendService.updateMyItems(currentEditId, formData)
        .then(() => {
          Swal.fire({ icon: 'success', title: '已更新' });
          if (typeof window.tryUpdateListDom === 'function') {
            window.tryUpdateListDom(currentEditId, {
              name: el.name.value.trim(),
              price: el.price.value,
              status: statusValue
            });
          }
          closeEditDrawer();
        })
        .catch(err => {
          console.error(err);
          Swal.fire({ icon: 'error', title: '更新失敗', text: String(err || '請稍後再試') });
        });
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
      status: {
        listed: document.getElementById('status-listed'),
        reserved: document.getElementById('status-reserved'),
        sold: document.getElementById('status-sold'),
      }
    };
  }

  async function openEditDrawer(id, rowOrCardEl = null) {
    currentEditId = id;
    el.id.value = id;

    // 重置表單 + 清預覽
    el.form.reset();
    hidePreview();

    // 讀單筆資料（有就帶，沒有就跳過）
    if (typeof backendService?.getMyItem === 'function') {
      try {
        await new Promise((resolve, reject) => {
          backendService.getMyItem(id, (res) => {
            const item = res?.data ?? {};
            fillForm(item);
            resolve();
          }, (err) => reject(err));
        });
      } catch (e) {
        console.error('讀取商品失敗', e);
      }
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
      hidePreview();
    }, 200);
  }

  function fillForm(item) {
    el.name.value = item.name ?? '';
    el.price.value = item.price ?? '';
    el.category.value = item.category ?? '';
    el.description.value = item.description ?? '';
    const s = (item.status ?? 'listed');
    (el.status[s] || el.status.listed).checked = true;

    if (item.imageUrl) {
      el.imagePreview.src = item.imageUrl;
      el.imagePreview.classList.remove('d-none');
    } else {
      hidePreview();
    }
  }

  function hidePreview() {
    el.imagePreview.classList.add('d-none');
    el.imagePreview.removeAttribute('src');
    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
      previewObjectUrl = null;
    }
  }
})();

}


function removeItemDom(id) {
  // 表格
  document.querySelector(`#products tbody tr[data-id="${CSS?.escape ? CSS.escape(id) : id}"]`)?.remove();
  // 卡片（每張卡外層 .col 有 data-id）
  document.querySelector(`#product-cards [data-id="${CSS?.escape ? CSS.escape(id) : id}"]`)?.remove();
}
