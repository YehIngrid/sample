let backendService;
let wpbackendService;
let isLoggedIn;

// document.addEventListener("DOMContentLoaded", (e) => {

// })
const pages = document.querySelectorAll('.page');
const links = document.querySelectorAll('.nav-link');

// SPA 顯示邏輯
async function showPage(hash) {
  pages.forEach(p => p.classList.remove('active'));
  links.forEach(l => l.classList.remove('active'));

  const target = document.querySelector(hash);
  const activeLink = document.querySelector(`a[href="${hash}"]`);

  if (target) target.classList.add('active');
  if (activeLink) activeLink.classList.add('active');

  // ===== 公開願望池 =====
  if (hash === '#wishpool') {
    await listAll();
  }

  // ===== 我的願望 =====
  if (hash === '#mywishes') {
    isLoggedIn = await checkLogin();
    if (!isLoggedIn) {
      Swal.fire({
        icon: 'warning',
        title: '請先登入會員',
        text: '需登入會員才可查看我的願望'
      });
      location.hash = '#wishpool';
      return; // ⛔ 很重要
    } else {
      await listMyWishes();
    }
  }
  if(hash === '#makewish') {
    Swal.fire({
      text: "歡迎許願！記得要先登入會員歐～"
    });
  }
}


// 只負責「點擊 → 改 hash」
document.querySelectorAll('a[data-spa]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    location.hash = link.getAttribute('href');
  });
});

showPage(location.hash || '#wishpool');
// hash 改變時切換頁面
window.addEventListener('hashchange', () => {
  showPage(location.hash);
});

async function checkLogin() {
  backendService = new BackendService();
  try {
    const response = await backendService.whoami(); 
    return response.data;
  } catch (error) {
    console.error('Error checking login status:', error);
    return false;
  }
}

async function listAll() {
    wpbackendService = new wpBackendService();
    try {
      const res = await wpbackendService.listWishes(1);
      showInfo(res.data);
      return res.data;
    } catch (error) {
      console.error('Error loading wishpool data:', error);
    }
}
// TODO nextpage previous page 還沒做
async function listMyWishes() {
    wpbackendService = new wpBackendService();
    try {
      const res = await wpbackendService.myWishes(1, null);
      showMyInfo(res.data);
      return res.data;
    } catch (error) {
      console.error('Error loading my wishes data:', error);
    }
}

function showInfo(data) {
  if (!data || data.length === 0) {
    container.innerHTML = '<p class="empty">你目前還沒有願望 🌱</p>';
    return;
  }
  const container = document.getElementById('wishGrid');
  container.innerHTML = ''; //清除資料
  data.wishes.forEach(wish => {
    const card = document.createElement('div');
    card.classList.add('card', 'item','text-dark', 'bg-light');
    const tagsString = generateTags(wish);
    card.setAttribute('data-tags', tagsString);
    const expiresAt = new Date(wish.expiresAt);
    card.dataset.id = wish.id;
    const showImage = wish.photoURL != null;
    const image = showImage ? `<img src="${wish.photoURL}" alt="${wish.itemName}的照片" style="width: 100px;">`: `<img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23f2f2f2'/><rect x='18' y='22' width='64' height='44' rx='4' ry='4' fill='none' stroke='%23999999' stroke-width='3'/><polyline points='22,58 40,40 52,52 66,38 78,50' fill='none' stroke='%23999999' stroke-width='3'/><circle cx='60' cy='34' r='4' fill='%23999999'/><text x='50' y='82' font-size='12' text-anchor='middle' fill='%23999999' font-family='Arial, Helvetica, sans-serif'>No Image</text></svg>
" alt="No Image" style="width: 100px;">`;
    card.innerHTML = `
        <div class="card-header">${expiresAt.toLocaleDateString()} 截止</div>
        <div class="card-body d-flex align-items-center">
          <div class="left">
            ${image}
          </div>
          <div class="right" style="margin-left: 15px;">
            <h5 class="card-title">${wish.itemName}</h5>
            <p class="card-text ellipsis-text-wp">${wish.description}</p>
          </div>
        </div>
    `;
    card.addEventListener('click', () => {
      const pid = card.dataset.id;
      if (pid) location.href = `../wishinfo/wishinfo.html?id=${encodeURIComponent(pid)}`;
    });
    container.appendChild(card);
  });
}

function showMyInfo(data) {
  const container = document.getElementById('myWishGrid');
  container.innerHTML = '';
  data.wishes.forEach(wish => {
    const card = document.createElement('div');
    card.classList.add('card', 'item','text-dark', 'bg-light');
    const tagsString = generateTags(wish);
    const showImage = wish.photoURL != null;
    const image = showImage ? `<img src="${wish.photoURL}" alt="${wish.itemName}的照片" style="width: 100px;">`: `<img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23f2f2f2'/><rect x='18' y='22' width='64' height='44' rx='4' ry='4' fill='none' stroke='%23999999' stroke-width='3'/><polyline points='22,58 40,40 52,52 66,38 78,50' fill='none' stroke='%23999999' stroke-width='3'/><circle cx='60' cy='34' r='4' fill='%23999999'/><text x='50' y='82' font-size='12' text-anchor='middle' fill='%23999999' font-family='Arial, Helvetica, sans-serif'>No Image</text></svg>
" alt="No Image" style="width: 100px;">`;
    card.setAttribute('data-tags', tagsString);
    card.dataset.id = wish.id;
    
    const statusMap = {
      1: '上架中',
      2: '已過期',
      3: '已刪除'
    }
    card.innerHTML = `
        <div class="card-header">願望狀態：${statusMap[wish.status]}</div>
        <div class="card-body d-flex align-items-center">
          <div class="left">
            ${image}
          </div>
          <div class="right" style="margin-left: 15px;">
            <h5 class="card-title">${wish.itemName}</h5>
            <p class="card-text ellipsis-text-wp">${wish.description}</p>
          </div>
        </div>
    `;
    const showDeleteBtn = wish.status === 1;
    const deleteButton = showDeleteBtn ? document.createElement('button'): null;
    if(deleteButton) {
      deleteButton.classList.add('btn', 'btn-danger');
      deleteButton.innerHTML = '刪除願望';
      card.appendChild(deleteButton);
      deleteButton.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteWish(card.dataset.id);
      });
    }
    card.addEventListener('click', () => {
      const pid = card.dataset.id;
      if (pid) location.href = `../wishinfo/wishinfo.html?id=${encodeURIComponent(pid)}`;
    });
    container.appendChild(card);
  });
  
}
async function deleteWish(id) {
  wpbackendService = new wpBackendService;
  Swal.fire({
    icon: 'warning',
    title: '確定刪除？',
    text: '願望刪除後僅能在「我的願望」裡查看。',
    showCancelButton: true,
    confirmButtonText: '確定刪除',
    cancelButtonText: '取消'
  }).then(async result => {
    if (result.isConfirmed) {
      try {
        await wpbackendService.deleteWish(id);
        Swal.fire({
          icon: 'success', 
          title: '刪除成功',
          confirmButtonText: 'ok',
        }).then (async result => {
          if(result.isConfirmed) {
            try {
              await wpbackendService.listMyWishes();
            } catch(error) {
              console.log('error: ',error);
            }
          }
        }); //TODO 加入重新載入
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Oops...刪除失敗',
          text: error.message
        });
      }
    }
  });
  
  
}

function generateTags(data) {
  const tags = [];

  const priorityMap = {
    1: 'nonecessary',
    2: 'normal',
    3: 'necessary'
  };

  if (priorityMap[data.priority]) {
    tags.push(priorityMap[data.priority]);
  }
  const bg = data.maxPrice;
  if (bg < 100) {
    tags.push('hundred');
  } else if (bg < 500) {
    tags.push('fiveh');
  } else if (bg < 1000) {
    tags.push('tothous');
  } else if (bg < 3000) {
    tags.push('thousand');
  } else {
    tags.push('trithou');
  }
  console.log('tags:', tags);
  return tags.join(' ');
}


  const tags = document.querySelectorAll('.tag');
  
  tags.forEach(tag => {
    tag.addEventListener('click', () => {
      tag.classList.toggle('active'); // 重點！
      filterItems();
    });
  });

  function filterItems() {
    const items = document.querySelectorAll('.item');
    // 目前被選取的 tags
    const activeTags = Array.from(tags)
      .filter(tag => tag.classList.contains('active'))
      .map(tag => tag.dataset.tag);
  
    items.forEach(item => {
      const itemTags = item.dataset.tags.split(' ');
  
      // 沒選任何 tag → 全顯示
      if (activeTags.length === 0) {
        item.style.display = 'block';
        return;
      }
  
      const match = activeTags.every(tag =>
        itemTags.includes(tag)
      );
  
      item.style.display = match ? 'block' : 'none';
    });
  }
  

// TODO wishpool 還沒改成適合wishpool.js的格式

const wishForm   = document.getElementById('wishForm');

// 基本檢查
if (!wishForm) {
  console.error('[wish] 缺少必要元素：',  wishForm );
} else {
  console.log('[wish] 元素載入完成，開始綁定事件');
}

const fileInput = document.getElementById('wish-image');
const preview   = document.getElementById('imgPreview');
const imgEl     = document.getElementById('imgPreviewImg');
const budgetMax = document.getElementById('budgetMax');
// const expireDate = document.getElementById('expireDate');
const urgency   = document.getElementById('urgency');

// --- 小工具：設/清錯 ---
function setErr(el, msg) {
  el.classList.add('is-invalid');
  const fb = el.nextElementSibling;
  if (fb && fb.classList.contains('invalid-feedback')) fb.textContent = msg || '此欄位有誤';
}
function clearErr(el) {
  el.classList.remove('is-invalid');
  const fb = el.nextElementSibling;
  if (fb && fb.classList.contains('invalid-feedback')) fb.textContent = '';
}

// --- 驗證：照片上傳 < 5MB ---
function validatePhoto() {
  clearErr(fileInput);

  const f = fileInput.files?.[0];
  const MAX_SIZE = 5 * 1024 * 1024;

  // 沒選照片 → 合法
  if (!f) return true;

  // 有選但超過 5MB
  if (f.size > MAX_SIZE) {
    setErr(fileInput, '照片大小不能超過 5MB');

    // 🔴 關鍵：清空檔案 & 預覽
    fileInput.value = '';
    preview.classList.remove('has-image');
    imgEl.removeAttribute('src');

    return false;
  }

  return true;
}


// --- 驗證：最低/最高預算 + 關係 ---
const toNum = v => (v === '' ? NaN : Number(v));

// function validexpireDate() {
//   clearErr(expireDate);
//   const v = expireDate.value;
//   if (!v) { setErr(expireDate, '請選擇願望過期日'); return false; }
//   const selectedDate = new Date(v);
//   const today = new Date();
//   today.setHours(0, 0, 0, 0);
//   if (selectedDate < today) {
//     setErr(expireDate, '過期日不可早於今天');
//     return false;
//   }
//   return true;
// }
function validateBudgetMax() {
  clearErr(budgetMax);
  const v = toNum(budgetMax.value);
  if (Number.isNaN(v)) { setErr(budgetMax, '請填最高預算'); return false; }
  if (v <= 0)          { setErr(budgetMax, '最高預算需大於 0'); return false; }
  return true;
}


// --- 驗證：急迫度必選 ---
function validateUrgency() {
  clearErr(urgency);
  if (!urgency.value) { setErr(urgency, '請選擇急迫度'); return false; }
  return true;
}

// --- 即時驗證（使用者輸入就檢查） ---
fileInput.addEventListener('change', validatePhoto());
// expireDate.addEventListener('input', () => { validexpireDate();});
budgetMax.addEventListener('input', () => { validateBudgetMax(); });
urgency.addEventListener('change', validateUrgency());


fileInput.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) {
    preview.classList.remove('has-image');
    imgEl.removeAttribute('src');
    return;
  }

  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    setErr(fileInput, '照片大小不能超過 5MB');
    fileInput.value = '';
    preview.classList.remove('has-image');
    imgEl.removeAttribute('src');
    return;
  }

  const url = URL.createObjectURL(file);
  imgEl.onload = () => URL.revokeObjectURL(url);
  imgEl.src = url;
  preview.classList.add('has-image');
});


  //（可選）支援拖曳上傳
  ['dragenter','dragover'].forEach(evt =>
    preview.addEventListener(evt, (e) => {
      e.preventDefault();
      e.dataTransfer && (e.dataTransfer.dropEffect = 'copy');
      preview.classList.add('dragover');
    })
);
['dragleave','drop'].forEach(evt =>
  preview.addEventListener(evt, (e) => {
    e.preventDefault();
    preview.classList.remove('dragover');
  })
);
preview.addEventListener('drop', (e) => {
  const file = e.dataTransfer.files && e.dataTransfer.files[0];
  if (!file) return;
  // --- 新增：把拖進來的檔案同步到 <input type="file">，讓下方顯示檔名 ---
  const dt = new DataTransfer();       // 新增
  dt.items.add(file);                  // 新增
  fileInput.files = dt.files;          // 新增
  const url = URL.createObjectURL(file);
  imgEl.onload = () => URL.revokeObjectURL(url);
  imgEl.src = url;
  preview.classList.add('has-image');
});



const wishFormbig = document.getElementById("wishFormbtn");
if (!wishFormbig) {
  console.error("[wish] 缺少必要元素：", wishFormbig);
}
// 綁定送出事件
wishFormbig.addEventListener("click", function (e) {
  console.log("送出表單，進行最終驗證");
  e.preventDefault(); // 一律阻止原生送出

  let isValid = true;

  const okPhoto = validatePhoto();
  // const okDate  = validexpireDate();
  const okMax   = validateBudgetMax();
  const okUrg   = validateUrgency();

  isValid = isValid && okPhoto && okMax && okUrg;

  // 商品名稱
  const wishName = document.getElementById("wishName");
  if (!wishName.value.trim()) {
    wishName.classList.add("is-invalid");
    wishName.classList.remove("is-valid");
    isValid = false;
  } else {
    wishName.classList.remove("is-invalid");
    wishName.classList.add("is-valid");
  }
  //預算最高
  const budgetMax = document.getElementById("budgetMax");
  if (!budgetMax.value.trim() || budgetMax.value <= 0) {
    budgetMax.classList.add("is-invalid");
    budgetMax.classList.remove("is-valid");
    isValid = false;
  } else {
    budgetMax.classList.remove("is-invalid");
    budgetMax.classList.add("is-valid");
  }

  // 內容說明
  const wishDesc = document.getElementById("wishDesc");
  if (!wishDesc.value.trim() || wishDesc.value.length < 10) {
    wishDesc.classList.add("is-invalid");
    wishDesc.classList.remove("is-valid");
    isValid = false;
  } else {
    wishDesc.classList.remove("is-invalid");
    wishDesc.classList.add("is-valid");
  }

  // ✅ 全部通過才真的送出
  if (!isValid) return;
  if (!isLoggedIn){
    Swal.fire({
      icon: 'warning',
      title: '請先登入會員',
      text: '需登入會員才可查看我的願望'
    });
    return;
  }
  Swal.fire({
    icon: 'warning',
    title: '確定送出？請詳閱下方規則',
    text: '願望送出後，7天後過期刪除，並且7天後才能許下一個願望。',
    showCancelButton: true,
    confirmButtonText: '確定送出',
    cancelButtonText: '再想想'
  }).then(result => {
    if (result.isConfirmed) {
      submit(); // 你的 async function
    }
  });
  
});

async function submit() {
  wpbackendService = new wpBackendService();
  const photo = fileInput.files?.[0] || null;
  try {
    const result = await wpbackendService.createWish(
      wishName.value,
      wishDesc.value,
      urgency.value,
      budgetMax.value,
      photo
    );
    console.log('願望建立成功：', result);
    Swal.fire({
      icon: 'success',
      title: '願望已送出！',
      text: '感謝您的參與，已將您的願望發布。',
    }).then(() => {
      location.href = '../wishpool/wishpool.html';
    });
  } catch (error) {
    console.error('願望建立失敗：', error);
    Swal.fire({
      icon: 'error',
      title: '願望送出失敗',
      text: '請稍後再試，或聯絡客服人員。',
    });
  }
}
// card.addEventListener('click', () => {
//   const pid = card.dataset.id;
//   if (pid) location.href = `../wishinfo/wishinfo.html?id=${encodeURIComponent(pid)}`;
// });
// TODO create wish
