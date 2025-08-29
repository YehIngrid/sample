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
      // ✅ 顯示 loader
      loader1.style.display = 'block';
      backendService = new BackendService();
      const response = await backendService.updateProfile(formData, (data) => {
        console.log("更新成功：", data);
        console.log(data.data.introduction);
      // 更新顯示的介紹
      Swal.fire({
        icon: "success",
        title: "更新成功",
        text: "個人資料已更新"
      }).then(() => {
        window.location.reload(); // 重新載入頁面以顯示最新資料
      });
      }, (errorMessage) => {
        console.error("更新失敗：", errorMessage);
        Swal.fire({
          icon: "error",
          title: "更新失敗",
          text: errorMessage
        });
      });
      loader1.style.display = 'none';
      console.log("更新回傳資料：", response);
      // 更新成功後，重新載入頁面以顯示最新資料
      mProfileName.textContent = localStorage.getItem("username") || "使用者名稱"; // 替換為實際使用者名稱
      mProfileInfo.textContent = localStorage.getItem("intro") || "使用者介紹"; // 替換為實際使用者介紹
      if (localStorage.getItem('avatar')) {
        mProfileAvatar.src = localStorage.getItem('avatar'); // 更新顯示的圖片
      }
      else { 
        mProfileAvatar.src = '../image/default-avatar.png'; // 替換為預設圖片的 URL
      }
      
      if (localStorage.getItem('avatar')) {
        profileAvatar.src = localStorage.getItem('avatar'); // 更新顯示的圖片
      } else {
        profileAvatar.src = '../image/default-avatar.png'; // 替換為預設圖片的 URL
      }
      profileInfo.textContent = localStorage.getItem("intro") || "使用者介紹"; // 替換為實際使用者介紹
      profileName.textContent = localStorage.getItem("username") ||"使用者名稱"; // 替換為實際使用者名稱

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
  document.getElementById('back-btn7').addEventListener('click', function () {
    const mainContentArea = document.getElementById('account');
    mainContentArea.classList.remove('d-none'); // 顯示主內容
    const collapseContent = document.getElementById('collapseContent');
    collapseContent.classList.remove('show'); // 隱藏折疊內容
    this.style.display = 'none'; // 隱藏返回按鈕
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
  backendService.getMyItems(
    (response) => {
      // 假設後端回傳 { commodities: [...] }
      const list = response.data.commodities ?? data; 
      renderProducts(list);
    },
    (errMsg) => {
      console.warn(errMsg);
      renderProducts([]); // 出錯時顯示「目前沒有商品」
    }
  );
});

// ?====== 工具函式 ======
const STATUS_MAP = {
  listed:   { text: '上架中',  badge: 'text-bg-success', action: '編輯' },
  sold:     { text: '已售出',  badge: 'text-bg-secondary', action: '查看' },
  reserved: { text: '保留中',  badge: 'text-bg-warning', action: '查看' },
  draft:    { text: '草稿',    badge: 'text-bg-light', action: '編輯' }
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
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-5">目前沒有商品</td></tr>`;
    return;
  }

  const rows = list.map(item => {
    const id       = item.id ?? item._id ?? item.commodity_id ?? '';
    const name     = esc(item.name ?? item.title ?? '未命名商品');
    const price    = fmtPrice(item.price);
    const updated  = fmtDate(item.updatedAt ?? item.updated_at ?? item.last_update ?? item.createdAt);
    const key      = (item.status ?? 'listed').toLowerCase();
    const st       = STATUS_MAP[key] ?? STATUS_MAP.listed;

    return `
      <tr data-id="${esc(id)}">
        <td>${name}</td>
        <td><span class="badge ${st.badge}">${st.text}</span></td>
        <td>${price}</td>
        <td>${updated}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary btn-row-action">${st.action}</button>
        </td>
      </tr>
    `;
  }).join('');

  tbody.innerHTML = rows;
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
