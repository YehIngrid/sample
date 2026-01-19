let backendService;
let wpbackendService;
document.querySelectorAll('a[data-spa]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault(); // 阻止跳頁
      location.hash = link.getAttribute('href');
    });
    const pages = document.querySelectorAll('.page');
    const links = document.querySelectorAll('.nav-link');
  
    async function showPage(hash) {
      pages.forEach(p => p.classList.remove('active'));
      links.forEach(l => l.classList.remove('active'));
  
      const target = document.querySelector(hash);
      const link = document.querySelector(`a[href="${hash}"]`);
  
      if (target) target.classList.add('active');
      if (link) link.classList.add('active');
      if(hash === '#wishpool'){
        await listAll();
      }
      // ?登入檢查，先註解起來
      // if (hash === '#mywishes') {
      //   const isLoggedIn = await checkLogin();
      //   if (!isLoggedIn) {
      //     Swal.fire({
      //       icon: 'warning',
      //       title: '請先登入會員',
      //       text: '需登入會員才可查看我的願望'
      //     });
      //     location.hash = '#wishpool';
      //   }
      // }
    }
  
    // 第一次載入
    showPage(location.hash || '#wishpool');
  });
 // 點擊切換
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
      getInfo(res.data);
    } catch (error) {
      console.error('Error loading wishpool data:', error);
    }
}
// TODO nextpage previous page 還沒做
async function listMyWishes() {
    wpbackendService = new wpBackendService();
    try {
      const res = await wpbackendService.myWishes(1, null);
      getMyInfo(res.data);
    } catch (error) {
      console.error('Error loading my wishes data:', error);
    }
}

function getInfo(data) {
  data.wishes.forEach(wish => {
    const container = document.getElementById('wishGrid');
    const card = document.createElement('div');
    card.classList.add('card', 'item','text-dark', 'bg-light');
    const tagsString = generateTags(wish);
    card.setAttribute('data-tags', tagsString);
    card.dataset.id = wish.id;
    card.innerHTML = `
        <div class="card-header">${wish.expiresAt} 截止</div>
        <div class="card-body d-flex align-items-center">
          <div class="left">
            <img src="${wish.photoURL}" alt="${wish.itemName}的照片" style="width: 100px;">
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

function getMyInfo(data) {
  data.wishes.forEach(wish => {
    const container = document.getElementById('myWishGrid');
    const card = document.createElement('div');
    card.classList.add('card', 'item','text-dark', 'bg-light');
    const tagsString = generateTags(wish);
    card.setAttribute('data-tags', tagsString);
    card.dataset.id = wish.id;
    const showDeleteBtn = wish.status === 1;
    const deleteButtonHTML = showDeleteBtn ? `<button class="btn btn-danger">刪除願望</button>`: '';

    const statusMap = {
      1: '上架中',
      2: '已過期',
      3: '已刪除'
    }
    card.innerHTML = `
        <div class="card-header">願望狀態：${statusMap[wish.status]}</div>
        <div class="card-body d-flex align-items-center">
          <div class="left">
            <img src="${wish.photoURL}" alt="${wish.itemName}的照片" style="width: 100px;">
          </div>
          <div class="right" style="margin-left: 15px;">
            <h5 class="card-title">${wish.itemName}</h5>
            <p class="card-text ellipsis-text-wp">${wish.description}</p>
          </div>
        </div>
        ${deleteButtonHTML}
    `;
    card.addEventListener('click', () => {
      const pid = card.dataset.id;
      if (pid) location.href = `../wishinfo/wishinfo.html?id=${encodeURIComponent(pid)}`;
    });
    container.appendChild(card);
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

  return tags.join(' ');
}


  const tags = document.querySelectorAll('.tag');
  const items = document.querySelectorAll('.item');
  
  function filterItems() {
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
  
      // 只要符合「任一個」被選 tag 就顯示（OR）
      const match = activeTags.every(tag =>
        itemTags.includes(tag)
      );
  
      item.style.display = match ? 'block' : 'none';
    });
  }
  
  tags.forEach(tag => {
    tag.addEventListener('click', () => {
      tag.classList.toggle('active'); // 重點！
      filterItems();
    });
  });
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
const expireDate = document.getElementById('expireDate');
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

// --- 驗證：照片必上傳 ---
function validatePhoto() {
  clearErr(fileInput);
  const f = fileInput.files && fileInput.files[0];
  if (!f) { setErr(fileInput, '請上傳商品照片'); return false; }
  return true;
}

// --- 驗證：最低/最高預算 + 關係 ---
const toNum = v => (v === '' ? NaN : Number(v));

function validexpireDate() {
  clearErr(expireDate);
  const v = expireDate.value;
  if (!v) { setErr(expireDate, '請選擇願望過期日'); return false; }
  const selectedDate = new Date(v);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (selectedDate < today) {
    setErr(expireDate, '過期日不可早於今天');
    return false;
  }
  return true;
}
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
fileInput.addEventListener('change', validatePhoto);
expireDate.addEventListener('input', () => { validexpireDate();});
budgetMax.addEventListener('input', () => { validateBudgetMax(); });
urgency.addEventListener('change', validateUrgency);


fileInput.addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) {
    preview.classList.remove('has-image');
    imgEl.removeAttribute('src');
    return;
  }
  const url = URL.createObjectURL(file);
  imgEl.onload = () => URL.revokeObjectURL(url); // 釋放暫存
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
  const okDate  = validexpireDate();
  const okMax   = validateBudgetMax();
  const okUrg   = validateUrgency();

  isValid = isValid && okPhoto && okDate && okMax && okUrg;

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

  submit(); // 你自己的 async function
});

async function submit() {
  wpbackendService = new wpBackendService();
  
  try {
    const result = await wpbackendService.createWish(
      wishName.value,
      wishDesc.value,
      urgency.value,
      budgetMax.value,
      fileInput.files[0]
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
