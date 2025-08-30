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
const profileName = document.getElementById('profileName');
const profileInfo = document.getElementById('profileInfo');
const profileAvatar = document.getElementById('profileAvatar');
  console.log("使用者名稱：", localStorage.getItem('username'));
  console.log("使用者介紹：", localStorage.getItem('intro'));
  // console.log(data.data.photoUrl);
  // // ?這邊預覽照片部分
if (localStorage.getItem('avatar')) {
  profileAvatar.src = localStorage.getItem('avatar'); // 更新顯示的圖片
} else {
  profileAvatar.src = '../image/default-avatar.png'; // 替換為預設圖片的 URL
}
profileInfo.textContent = localStorage.getItem("intro") || "使用者介紹"; // 替換為實際使用者介紹
profileName.textContent = localStorage.getItem("username") ||"使用者名稱"; // 替換為實際使用者名稱

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
  
// const mcollapsebtn = document.getElementById('mcollapsebtn');
// const collapseContent = document.getElementById('collapseContent');
// mcollapsebtn.addEventListener('click', function () {
//     const mainContentArea = document.getElementById('mainContentArea');
//     mainContentArea.classList.toggle('d-none'); // 切換主內容的顯示狀態
    
//     collapseContent.classList.toggle('show'); // 切換折疊內容的顯示狀態
//     const backbtn7 = document.getElementById('back-btn7');
//     if (collapseContent.classList.contains('show')) {
//       backbtn7.style.display = 'block'; // 顯示返回按鈕
//     } else {
//       backbtn7.style.display = 'none'; // 隱藏返回按鈕
//     }
//   }
// );

//   document.getElementById('collapsebtn').addEventListener('click', function () {
//     const mainContentArea = document.getElementById('account');
//     mainContentArea.classList.toggle('d-none'); // 切換主內容的顯示狀態
//     const collapseContent = document.getElementById('collapseContent');
//     collapseContent.classList.toggle('show'); // 切換折疊內容的顯示狀態
//     const backbtn7 = document.getElementById('back-btn7');
//     if (collapseContent.classList.contains('show')) {
//       backbtn7.style.display = 'block'; // 顯示返回按鈕
//     } else {
//       backbtn7.style.display = 'none'; // 隱藏返回按鈕
//     }
//   });
  // document.getElementById('back-btn7').addEventListener('click', function () {
  //   const mainContentArea = document.getElementById('account');
  //   mainContentArea.classList.remove('d-none'); // 顯示主內容
  //   const collapseContent = document.getElementById('collapseContent');
  //   collapseContent.classList.remove('show'); // 隱藏折疊內容
  //   this.style.display = 'none'; // 隱藏返回按鈕
  // });
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

document.addEventListener('DOMContentLoaded', () => {
  // 呼叫 API 取商品
  backendService = new BackendService();
  backendService.getMyItems(
    (response) => {
      // 假設後端回傳 { commodities: [...] }
      const list = response.data.commodities ?? data; 
      renderProducts(list);
      console.log(list);
    },
    (errorMessage) => {
      console.error(errorMessage);
      renderProducts([]); // 出錯時顯示「目前沒有商品」
    }
  );
});

// ?====== 工具函式 ======
const STATUS_MAP = {
  listed:   { text: '上架中',  badge: 'text-bg-success', action: '編輯' },
  sold:     { text: '已售出',  badge: 'text-bg-secondary', action: '查看' },
  reserved: { text: '保留中',  badge: 'text-bg-warning', action: '查看' },
  draft:    { text: '草稿',    badge: 'text-bg-light', action: '編輯' }, 
  delete:   { text: '已下架',  badge: 'text-bg-danger', action: '查看'}
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
  const d = new Date(v); // 支援 ISO 或毫秒
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

// ?====== 渲染表格 ======
function renderProducts(list = []) {
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
  tbody.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-row-action');
  if (!btn) return;

  const tr = btn.closest('tr');
  const id = tr?.dataset.id;
  const action = btn.dataset.action; // edit 或 delete

  if (!id) return;

  if (action === 'edit') {
    console.log('編輯商品：', id);
    // 
  } else if (action === 'check') {
    location.href = `../product/product.html?id=${encodeURIComponent(id)}`;
  } else if (action === 'stop') {
    if(confirm('確定要暫停上架商品嗎?')) {

    }
  } else if (action === 'delete') {
    console.log('刪除商品：', id);
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
            Swal.fire({
              icon: "success",
              title: "商品下架成功",
            })
            tr.remove;
          },
          (err) => alert('刪除失敗：' + err)
        );
      }
    });
    // TODO: 呼叫後端 API -> backendService.deleteItem(id)
  }
});
}

// ====== 列表內按鈕事件（可選） ======
document.querySelector('#products tbody')?.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-row-action');
  if (!btn) return;
  const tr = btn.closest('tr');
  const id = tr?.dataset.id;
  if (!id) return;

  // 你可以改成跳轉或打開編輯器：
  // location.href = `product.html?id=${encodeURIComponent(id)}`;
  console.log('點到商品：', id);
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
    img.style.borderRadius = '50px';
    img.style.border = '1px solid #ccc';
    img.style.boxShadow = '0 0 6px rgba(0,0,0,0.1)';
    preview.appendChild(img);
  };
  reader.readAsDataURL(file);
});
