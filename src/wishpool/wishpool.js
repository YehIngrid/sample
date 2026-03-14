import BackendService from '../BackendService.js';
import wpBackendService from '../wpBackendService.js';
import '../../default/default.js';

let backendService;
let wpbackendService;

// ── Constants ──
const CARD_COLORS = ['#FFD966','#FF9F9F','#A8D8EA','#B5EAD7','#FFDAC1','#C7CEEA','#E2F0CB','#F7CAC9'];
const PHOTO_CARD_COLORS = ['#C1E8DD','#BDD6E1'];
const PRIORITY_LABEL = { LOW:'不急', MEDIUM:'一般', HIGH:'緊急', 1:'不急', 2:'一般', 3:'急需' };
const PRIORITY_COLOR  = { LOW:'#6bb56b', MEDIUM:'#e6a817', HIGH:'#e05353', 1:'#6bb56b', 2:'#e6a817', 3:'#e05353' };

function randomCardColor() {
  return CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)];
}

// ── Skeleton helper ──
function wishSkeletonHTML(n = 8) {
  return Array.from({length: n}, () => `<div class="wish-skel-wrapper"></div>`).join('');
}
let isLoggedIn;
let currentPage = 1;
let totalPages = 1; // 如果後端有回 totalPages
let mycurrentPage = 1;
let mytotalPages = 1;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById('prevPage')?.addEventListener('click', () => {
    if (currentPage > 1) {
      listAll(currentPage - 1);
    }
  });

  document.getElementById('nextPage')?.addEventListener('click', () => {
    if (currentPage < totalPages) {
      listAll(currentPage + 1);
    }
  });

  document.getElementById('myprevPage')?.addEventListener('click', () => {
    if (mycurrentPage > 1) {
      listMyWishes(mycurrentPage - 1);
    }
  });

  document.getElementById('mynextPage')?.addEventListener('click', () => {
    if (mycurrentPage < mytotalPages) {
      listMyWishes(mycurrentPage + 1);
    }
  });
})
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
    currentPage = 1;
    await listAll(1);
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
      mycurrentPage = 1;
      await listMyWishes(1);
    }
  }
  if(hash === '#makewish') {
    isLoggedIn = await checkLogin();
    if (!isLoggedIn) {
      Swal.fire({
        title: '請先登入會員',
        text: '需登入會員才可送出許願清單歐！'
      });
    }
  }
  if(hash === '#about') {
    animateCountUp("wishNum", 128);
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

async function listAll(page = 1) {
  const total = document.getElementById('total');
  const wishGrid = document.getElementById('wishGrid');
  if (wishGrid) wishGrid.innerHTML = wishSkeletonHTML();
    wpbackendService = new wpBackendService();
    try {
      const res = await wpbackendService.listWishes(page);
      currentPage = page;
      showInfo(res.data);
      if (res.data.pagination.totalPages) {
        totalPages = res.data.pagination.totalPages;
      }
      if(res.data.pagination.total) {
        total.innerText = res.data.pagination.total;
      }
      updatePaginationUI();
    } catch (error) {
      console.error('Error loading wishpool data:', error);
    }
}
// TODO nextpage previous page 還沒做
async function listMyWishes(mypage) {
  const mytotal = document.getElementById('my-total');
  const myWishGrid = document.getElementById('myWishGrid');
  if (myWishGrid) myWishGrid.innerHTML = wishSkeletonHTML();
    wpbackendService = new wpBackendService();
    try {
      const res = await wpbackendService.myWishes(mypage, null);
      mycurrentPage = mypage;
      showMyInfo(res.data);
      if(res.data.pagination.totalPages) {
        mytotalPages = res.data.pagination.totalPages;
      }
      if(res.data.pagination.total) {
        mytotal.innerText = res.data.pagination.total;
      }
      myupdatePaginationUI();
    } catch (error) {
      console.error('Error loading my wishes data:', error);
    }
}
function updatePaginationUI() {
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');
  const pageInfo = document.getElementById('pageInfo');

  if (!prevBtn || !nextBtn || !pageInfo) return;

  pageInfo.textContent = `第 ${currentPage} 頁`;

  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= totalPages;
}
function myupdatePaginationUI() {
  const myprevBtn = document.getElementById('myprevPage');
  const mynextBtn = document.getElementById('mynextPage');
  const mypageInfo = document.getElementById('mypageInfo');

  if (!myprevBtn || !mynextBtn || !mypageInfo) return;

  mypageInfo.textContent = `第 ${mycurrentPage} 頁`;

  myprevBtn.disabled = mycurrentPage <= 1;
  mynextBtn.disabled = mycurrentPage >= mytotalPages;
}


function showInfo(data) {
  const container = document.getElementById('wishGrid');
  if (!data.wishes || data.pagination.total === 0) {
    container.innerHTML = '<p class="empty">目前還沒有願望</p>';
    return;
  }
  container.innerHTML = '';
  data.wishes.forEach(wish => {
    container.appendChild(createWishCard(wish, false));
  });
  handleAutoFocus();
}

function showMyInfo(data) {
  const container = document.getElementById('myWishGrid');
  const emptycontainer = document.getElementById('empty');
  if (!data.wishes || data.pagination.total === 0) {
    emptycontainer.innerHTML = '<p class="empty">你目前還沒有願望</p>';
    return;
  }
  container.innerHTML = '';
  data.wishes.forEach(wish => {
    container.appendChild(createWishCard(wish, true));
  });
}
async function deleteWish(id) {
  wpbackendService = wpbackendService || new wpBackendService();
  const confirm = await Swal.fire({
    icon: 'warning',
    title: '確定刪除？',
    text: '願望刪除後僅能在「我的願望」裡查看。',
    showCancelButton: true,
    confirmButtonText: '確定刪除',
    cancelButtonText: '取消'
  });
  if (!confirm.isConfirmed) return;
  try {
    await wpbackendService.deleteWish(id);
    const wrapper = document.querySelector(`[data-id="${id}"]`);
    if (wrapper) {
      wrapper.querySelector('.wish-card')?.classList.remove('flipped');
      wrapper.classList.add('wish-disabled');
    }
    Swal.fire({ icon: 'success', title: '刪除成功', timer: 1500, showConfirmButton: false });
    setTimeout(() => listMyWishes(mycurrentPage), 1600);
  } catch (error) {
    Swal.fire({ icon: 'error', title: 'Oops...刪除失敗', text: error.message });
  }
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
    const items = document.querySelectorAll('#wishGrid .wish-card-wrapper');
    const activeTags = Array.from(tags)
      .filter(tag => tag.classList.contains('active'))
      .map(tag => tag.dataset.tag);

    items.forEach(item => {
      const itemTags = (item.dataset.tags || '').split(' ');
      if (activeTags.length === 0) {
        item.style.display = '';
        return;
      }
      const match = activeTags.every(tag => itemTags.includes(tag));
      item.style.display = match ? '' : 'none';
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
fileInput.addEventListener('change', validatePhoto);
// expireDate.addEventListener('input', () => { validexpireDate();});
budgetMax.addEventListener('input', () => { validateBudgetMax(); });
urgency.addEventListener('change', validateUrgency);


// ---- 圖片壓縮 helper ----
function compressImage(blob, maxWidth = 1200, quality = 0.82) {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        b => resolve(new File([b], 'image.webp', { type: 'image/webp' })),
        'image/webp', quality
      );
    };
    img.src = url;
  });
}

// ---- 裁切 Modal 邏輯 ----
let wishCropper = null;
const wishCropModalEl = document.getElementById('wishCropModal');
const wishCropImg     = document.getElementById('wishCropImg');
const wishCropModal   = bootstrap.Modal.getOrCreateInstance(wishCropModalEl);

function openWishCrop(file) {
  if (wishCropper) { wishCropper.destroy(); wishCropper = null; }
  const reader = new FileReader();
  reader.onload = (e) => {
    wishCropImg.src = e.target.result;
    wishCropModal.show();
  };
  reader.readAsDataURL(file);
}

// modal 完全顯示後再初始化 Cropper，並確保圖片已載入
wishCropModalEl.addEventListener('shown.bs.modal', () => {
  if (wishCropper) wishCropper.destroy();
  const init = () => {
    wishCropper = new Cropper(wishCropImg, {
      viewMode: 1,
      autoCropArea: 0.9,
      responsive: true,
    });
  };
  if (wishCropImg.complete && wishCropImg.naturalWidth > 0) {
    init();
  } else {
    wishCropImg.addEventListener('load', init, { once: true });
  }
});

document.getElementById('wishCropConfirm').addEventListener('click', () => {
  if (!wishCropper) return;
  const canvas = wishCropper.getCroppedCanvas({ maxWidth: 1200, maxHeight: 1200 });
  wishCropModal.hide();
  canvas.toBlob(async (blob) => {
    const compressed = await compressImage(blob, 1200, 0.82);
    const dt = new DataTransfer();
    dt.items.add(compressed);
    fileInput.files = dt.files;
    const url = URL.createObjectURL(compressed);
    imgEl.onload = () => URL.revokeObjectURL(url);
    imgEl.src = url;
    preview.classList.add('has-image');
    clearErr(fileInput);
  }, 'image/webp', 0.92);
});

wishCropModalEl.addEventListener('hidden.bs.modal', () => {
  if (wishCropper) { wishCropper.destroy(); wishCropper = null; }
  wishCropImg.src = '';
});

// ---- file input change → 開裁切視窗 ----
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
  fileInput.value = ''; // 清空以便下次選同張圖也能觸發
  openWishCrop(file);
});

// ---- 拖曳上傳 ----
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
  const file = e.dataTransfer.files?.[0];
  if (!file) return;
  openWishCrop(file);
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
  showLoading();
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
      location.href = '../wishpool/wishpool.html#wishpool';
    });
  } catch (error) {
    console.error('願望建立失敗：', error);
    Swal.fire({
      icon: 'error',
      title: '願望送出失敗',
      text: '請稍後再試，或聯絡客服人員。',
    });
  } finally {
    hideLoading();
  }
}
function showLoading() {
  const el = document.getElementById('globalLoading');
  if (!el) return;

  el.classList.remove('d-none');
}

function hideLoading() {
  const el = document.getElementById('globalLoading');
  if (!el) return;

  el.classList.add('d-none');
}

function easeOutQuad(t) {
  return t * (2 - t);
}

function animateCountUp(id, target, duration = 2000) {
  const el = document.getElementById(id);
  const startTime = performance.now();

  function update(currentTime) {
    let progress = Math.min((currentTime - startTime) / duration, 1);
    progress = easeOutQuad(progress);

    const value = Math.floor(progress * target);
    el.textContent = value;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = target;
    }
  }

  requestAnimationFrame(update);
}

// ════════════════════════════════════════════════════
//  Square sticky-note card system
// ════════════════════════════════════════════════════

/**
 * Build and return a square sticky-note card wrapper element.
 */
function createWishCard(wish, isMyWish) {
  const isActive = !isMyWish || wish.status === 'ACTIVE';
  const isRead = !!localStorage.getItem('readWish_' + wish.id);

  const wrapper = document.createElement('div');
  wrapper.className = 'wish-card-wrapper' +
    (isRead ? ' read' : '') +
    (isActive ? '' : ' wish-disabled');
  wrapper.dataset.id = wish.id;
  wrapper.style.setProperty('--card-color', wish.photoURL
    ? PHOTO_CARD_COLORS[Math.floor(Math.random() * PHOTO_CARD_COLORS.length)]
    : '#ffffff');
  wrapper.dataset.tags = generateTags(wish);

  const expiresAt = wish.expiresAt ? new Date(wish.expiresAt) : null;
  const deadlineText = expiresAt
    ? `截止 ${(expiresAt.getMonth()+1).toString().padStart(2,'0')}/${expiresAt.getDate().toString().padStart(2,'0')}`
    : '';
  const avatarSrc = wish.owner?.photoURL || '../webP/default-avatar.webp';

  const statusMap = { ACTIVE: '上架中', EXPIRED: '已過期', DELETED: '已刪除' };
  const statusColor = wish.status === 'ACTIVE' ? '#28a745' : '#aaa';
  const statusBadgeHtml = (isMyWish && wish.status !== 'ACTIVE')
    ? `<span class="wf-status-badge" style="background:${statusColor};">${statusMap[wish.status] || wish.status}</span>`
    : '';

  const mediaHtml = wish.photoURL
    ? `<div class="wf-media"><img class="wf-photo" src="${wish.photoURL}" alt="${wish.itemName}" loading="lazy"></div>`
    : `<img class="wf-wishbg" src="../svg/wishbg.svg" alt="拾貨寶庫，校園二手電商平台" aria-hidden="true">`;

  wrapper.innerHTML = `
    <div class="wish-card">
      <div class="wish-card-front">
        <div class="wf-header">
          <img class="wf-avatar" src="${avatarSrc}" alt="許願者頭像"
               onerror="this.src='../webP/default-avatar.webp'">
          <div class="wf-title">${wish.itemName}</div>
          <div class="wf-deadline">${deadlineText}</div>
        </div>
        <div class="wf-price">收購 NT$${wish.maxPrice}</div>
        ${statusBadgeHtml}
        ${mediaHtml}
      </div>
      <div class="wish-card-back">
        <div class="wb-scroll">
          <div class="wb-top-bar"><button class="wb-close-btn">✕</button></div>
          <div class="wb-loading">
            <span class="spinner-border spinner-border-sm me-2"></span>載入中...
          </div>
        </div>
      </div>
    </div>
  `;

  if (isActive) {
    wrapper.querySelector('.wish-card-front').addEventListener('click', () => {
      flipCard(wrapper, wish.id, isMyWish);
    });
  }

  wrapper.querySelector('.wb-close-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    wrapper.querySelector('.wish-card').classList.remove('flipped');
  });

  return wrapper;
}

/**
 * Flip a card in-place (3D rotation). Lazy-loads detail on first open.
 */
async function flipCard(wrapper, wishId, isMyWish) {
  if (wrapper.dataset.loading) return;

  const inner = wrapper.querySelector('.wish-card');

  // Already loaded — just toggle
  if (wrapper.dataset.loaded) {
    inner.classList.toggle('flipped');
    return;
  }

  wrapper.dataset.loading = '1';
  localStorage.setItem('readWish_' + wishId, '1');
  wrapper.classList.add('read');
  inner.classList.add('flipped');

  try {
    wpbackendService = wpbackendService || new wpBackendService();
    const res = await wpbackendService.getWishInfo(wishId);
    const d   = res.data ?? res;
    const backScrollEl = wrapper.querySelector('.wb-scroll');
    renderCardBack(backScrollEl, d, wishId, isMyWish, inner);
    if (d.photoURL) initCardPhotoSwipe(backScrollEl, wishId, d.photoURL);
    wrapper.dataset.loaded = '1';
  } catch (err) {
    const backScrollEl = wrapper.querySelector('.wb-scroll');
    backScrollEl.innerHTML = `
      <div class="wb-top-bar"><button class="wb-close-btn">✕</button></div>
      <div class="wb-content" style="display:flex;align-items:center;justify-content:center;
           color:#dc3545;font-size:.85rem;padding:24px;">載入失敗，請重試</div>`;
    backScrollEl.querySelector('.wb-close-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      inner.classList.remove('flipped');
    });
  } finally {
    delete wrapper.dataset.loading;
  }
}

/**
 * Populate the back face (wb-scroll) with full wish detail.
 * inner = the .wish-card element (needed to remove .flipped on close).
 */
function renderCardBack(backScrollEl, d, wishId, isMyWish, inner) {
  const priorityLabel = PRIORITY_LABEL[d.priority] || '未設定';
  const priorityColor = PRIORITY_COLOR[d.priority] || '#888';
  const ownerAvatar   = d.owner?.photoURL || '../webP/default-avatar.webp';
  const ownerName     = d.owner?.name || '未知';

  const photoHtml = d.photoURL ? `
    <div class="pswp-gallery" id="wb-gallery-${wishId}">
      <a href="${d.photoURL}" data-pswp-width="1200" data-pswp-height="800" target="_blank">
        <img class="wb-photo" src="${d.photoURL}" alt="${d.itemName}">
      </a>
    </div>` : '';

  const actionHtml = isMyWish
    ? `<button class="wb-delete-btn" data-wish-id="${wishId}">刪除願望</button>`
    : `<button class="wb-contact-btn wb-contact-js">聯絡許願者</button>`;

  backScrollEl.innerHTML = `
    <div class="wb-top-bar"><button class="wb-close-btn">✕</button></div>
    <div class="wb-content">
      ${photoHtml}
      <div class="wb-title">${d.itemName || '無標題'}</div>
      <div class="wb-meta">
        <span class="wb-priority-badge" style="background:${priorityColor};">${priorityLabel}</span>
        <span class="wb-price">收購 NT$${d.maxPrice || 0}</span>
      </div>
      <div class="wb-wisher">
        <img class="wb-wisher-avatar" src="${ownerAvatar}" alt="許願者頭像"
             onerror="this.src='../webP/default-avatar.webp'">
        <span class="wb-wisher-name">${ownerName}</span>
      </div>
      <div class="wb-desc">${d.description || '無描述'}</div>
      <div class="wb-actions">${actionHtml}</div>
    </div>`;

  backScrollEl.querySelector('.wb-close-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    inner.classList.remove('flipped');
  });

  if (!isMyWish) {
    const contactBtn = backScrollEl.querySelector('.wb-contact-js');
    if (contactBtn) {
      contactBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleContactWisher(wishId, contactBtn);
      });
    }
  }
  if (isMyWish) {
    const deleteBtn = backScrollEl.querySelector('.wb-delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', e => {
        e.stopPropagation();
        deleteWish(deleteBtn.dataset.wishId);
      });
    }
  }
}

/**
 * Initialise a per-card PhotoSwipe gallery after measuring natural image size.
 */
function initCardPhotoSwipe(backEl, wishId, photoUrl) {
  const galleryEl = backEl.querySelector(`#wb-gallery-${wishId}`);
  if (!galleryEl) return;
  const linkEl = galleryEl.querySelector('a');
  if (!linkEl) return;

  const img = new Image();
  img.src = photoUrl;
  img.onload = function () {
    linkEl.setAttribute('data-pswp-width',  this.naturalWidth  || 1200);
    linkEl.setAttribute('data-pswp-height', this.naturalHeight || 800);
    import('https://cdnjs.cloudflare.com/ajax/libs/photoswipe/5.4.4/photoswipe-lightbox.esm.min.js')
      .then(module => {
        const PhotoSwipeLightbox = module.default;
        const lightbox = new PhotoSwipeLightbox({
          gallery: `#wb-gallery-${wishId}`,
          children: 'a',
          pswpModule: () => import('https://cdnjs.cloudflare.com/ajax/libs/photoswipe/5.4.4/photoswipe.esm.min.js')
        });
        lightbox.init();
      });
  };
}

/**
 * Contact-wisher flow (adapted from wishinfo.js, runs inside wishpool).
 */
async function handleContactWisher(wishId, btn) {
  if (!btn) return;
  const origText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '載入中...';

  try {
    backendService = backendService || new BackendService();
    const res = await backendService.getMyItems();
    const commodities = res?.data?.commodities || [];

    if (commodities.length === 0) {
      const redirectUrl = encodeURIComponent(window.location.pathname + window.location.hash);
      const goSell = await Swal.fire({
        icon: 'info',
        title: '您目前沒有上架的商品',
        text: '請先到個人頁面上架商品後再媒合。',
        showCancelButton: true,
        confirmButtonText: '去上架商品',
        cancelButtonText: '關閉'
      });
      if (goSell.isConfirmed) {
        window.location.href = `../../shop/shop.html`;
      }
      return;
    }

    const cardsHtml = commodities.map(item => {
      const name  = item.name?.replace(/</g, '&lt;').replace(/>/g, '&gt;') || '未命名';
      const price = Number(item.price).toLocaleString();
      const img   = item.mainImage || '../image/default-avatar.png';
      return `
        <div class="wc-card" data-id="${item.id}" tabindex="0">
          <img src="${img}" alt="${name}" loading="lazy">
          <div class="wc-info">
            <div class="wc-name">${name}</div>
            <div class="wc-price">$${price}</div>
            <div class="wc-stock">庫存：${item.stock}</div>
          </div>
        </div>`;
    }).join('');

    const result = await Swal.fire({
      title: '請選擇要媒合的商品',
      width: 680,
      html: `
        <div class="wc-grid">${cardsHtml}</div>
        <div style="text-align:right;margin-top:10px;">
          <a href="../shop/shop.html?page=seller&redirect=${encodeURIComponent(window.location.pathname + window.location.hash)}"
             style="font-size:.8rem;color:#888;text-decoration:underline;">
            找不到想上架的商品？點此新增商品
          </a>
        </div>`,
      showCancelButton: true,
      confirmButtonText: '確認媒合',
      cancelButtonText: '取消',
      didOpen: () => {
        document.querySelectorAll('.wc-card').forEach(card => {
          const select = () => {
            document.querySelectorAll('.wc-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
          };
          card.addEventListener('click', select);
          card.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); }
          });
        });
      },
      preConfirm: () => {
        const selected = document.querySelector('.wc-card.selected');
        if (!selected) { Swal.showValidationMessage('請選擇一個商品'); return false; }
        return selected.dataset.id;
      }
    });

    if (result.isConfirmed) {
      wpbackendService = wpbackendService || new wpBackendService();
      await wpbackendService.contactWisher(wishId, result.value);
      Swal.fire({ icon: 'success', title: '已聯絡許願者！', text: '請等待對方回覆。' });
    }
  } catch (error) {
    console.error('Error contacting wisher:', error);
    Swal.fire({ icon: 'error', title: '聯絡失敗', text: '請稍後再試。' });
  } finally {
    btn.disabled  = false;
    btn.textContent = origText;
  }
}

/**
 * Auto-focus: if sessionStorage has a focusWishId, scroll to and flip that card.
 * Called at the end of showInfo() after cards are rendered.
 */
async function handleAutoFocus() {
  const focusId = sessionStorage.getItem('focusWishId');
  if (!focusId) return;
  sessionStorage.removeItem('focusWishId');

  let wrapper = document.querySelector(`#wishGrid [data-id="${focusId}"]`);

  if (!wrapper) {
    // Card not in current page — fetch detail and prepend
    try {
      wpbackendService = wpbackendService || new wpBackendService();
      const res = await wpbackendService.getWishInfo(focusId);
      const d   = res.data ?? res;
      const wishObj = {
        id:        focusId,
        itemName:  d.itemName,
        maxPrice:  d.maxPrice,
        expiresAt: d.expiresAt,
        photoURL:  d.photoURL,
        priority:  d.priority,
        owner:     d.owner
      };
      wrapper = createWishCard(wishObj, false);
      wrapper.style.outline       = '3px solid var(--brand-color)';
      wrapper.style.outlineOffset = '2px';
      document.getElementById('wishGrid')?.prepend(wrapper);
    } catch (err) {
      console.warn('handleAutoFocus: 無法載入願望', err);
      return;
    }
  }

  wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => flipCard(wrapper, focusId, false), 650);
}
