import BackendService from '../BackendService.js';
import wpBackendService from '../wpBackendService.js';
import '../default/default.js';

let backendService;
let wpbackendService;
let chatInnerWin;
let chatInnerDoc;
let chatRoomList;

// ── Skeleton helpers ──
function hotSkeletonHTML(n = 6) {
  return Array.from({length: n}, () => `
    <div class="hot-item">
      <div class="card">
        <div class="img-box skeleton" style="border-radius:10px 10px 0 0;"></div>
        <div class="hot-item-footer">
          <div class="skeleton skeleton-text" style="width:65%;margin:0;flex:1;"></div>
          <div class="card-seller" style="flex-shrink:0;">
            <div class="skeleton" style="width:16px;height:16px;border-radius:50%;"></div>
            <div class="skeleton skeleton-text" style="width:32px;margin:0;"></div>
          </div>
        </div>
      </div>
    </div>`).join('');
}
function productGridSkeletonHTML(n = 6) {
  return Array.from({length: n}, () => `
    <div class="col">
      <div class="card product-card h-100">
        <div class="skeleton product-thumb" style="height:180px;border-radius:8px 8px 0 0;"></div>
        <div class="card-body">
          <div class="skeleton skeleton-text" style="width:90%;"></div>
          <div class="skeleton skeleton-text" style="width:55%;"></div>
          <div class="skeleton skeleton-text" style="width:35%;margin-top:10px;"></div>
        </div>
      </div>
    </div>`).join('');
}
function wishAreaSkeletonHTML(n = 8) {
  const items = Array.from({length: n * 2}, () => `
    <div class="wish">
      <div class="skeleton" style="width:68px;height:68px;border-radius:50%;"></div>
      <div class="skeleton skeleton-text" style="width:64px;margin-top:7px;"></div>
    </div>`).join('');
  return `<div class="wish-track" style="animation:none;">${items}</div>`;
}

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, s =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s])
  );
}

const midcontent = document.getElementById('midcontent');
//JavaScript: 控制左右按鈕捲動

  const scrollContainer = document.getElementById('scrollContainer');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

// TODO seller
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const page = params.get("page");

  const seller = document.getElementById("seller");
  const midcontent = document.getElementById("midcontent");

  if (page === "seller") {
    seller.style.display = "block";
    midcontent.style.display = "none";
  } else {
    seller.style.display = "none";
    midcontent.style.display = "block";
  }
  const iframe = document.getElementById('talkInterface');
  iframe.src = '../chatroom/chatroom.html';
// 必須等待 iframe 載入完成
  iframe.addEventListener('load', () => {
      try {
          // 取得 iframe 內部的 document
          const innerDoc = iframe.contentDocument;
          const innerWindow = iframe.contentWindow;
          chatInnerDoc = innerDoc; // 儲存內部 document 參考
          chatInnerWin = innerWindow; // 儲存內部 window 參考
          // 抓取裡面的元素，例如一個 ID 為 "message-input" 的輸入框
          const element = innerDoc.getElementById('chatList');
          console.log('抓到的元素：', element);
          //element.value = "從外部設定的文字";
      } catch (e) {
          console.error("無法存取：可能跨網域或尚未完全載入", e);
      }
  });
});
const backbtn = document.getElementById('back-btn');
backbtn.addEventListener('click', () => {
  window.history.back();
});

// 取得元素
const modal = document.getElementById('myModal');
const openBtn = document.getElementById('openModal');


// 點擊按鈕時打開模態視窗
openBtn?.addEventListener('click', () => {
  modal.style.display = 'block';
});

// 當點擊模態背景也關閉模態視窗
window.addEventListener('click', (event) => {
  if (event.target === modal) {
    modal.style.display = 'none';
  }
});


document.addEventListener('DOMContentLoaded', function() {
  // 目錄連結用 scrollIntoView，避免 hash 寫入 history 造成需多按一次返回
  document.querySelectorAll('.toc-seller a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  backendService = new BackendService();
  let page = 1;
  let limit = 6;
  let hotDirection = 1; // 1 = 下一頁（從右進入），-1 = 上一頁（從左進入）
  const listEl = document.getElementById('hotItems');
  const prevHotBtn = document.getElementById("prevHotBtn");
  const nextHotBtn = document.getElementById("nextHotBtn");
  const pageInfo = document.getElementById("pageInfo");
  fetchPage(page);
  callWish();

  async function fetchPage(p){
  listEl.innerHTML = hotSkeletonHTML();
  const pagingInfo = { page: p, limit: limit };
   const response = await backendService.getHotItems(pagingInfo);
    const items = response?.data?.commodities ?? [];
    const pg = response?.data?.pagination ?? {};
    page = pg.currentPage ?? p;

    renderItems(items);
    updatePager(pg);
}
function renderItems(items){
  listEl.innerHTML = '';
  // 套用滑入動畫
  const slideClass = hotDirection > 0 ? 'hot-slide-in-right' : 'hot-slide-in-left';
  listEl.classList.remove('hot-slide-in-right', 'hot-slide-in-left');
  void listEl.offsetWidth; // 強制 reflow 重置動畫
  listEl.classList.add(slideClass);
  setTimeout(() => listEl.classList.remove(slideClass), 350);

  items.forEach(item => {
    const div = document.createElement("div");
      div.className = "hot-item";
      div.dataset.id = item.id;
      div.innerHTML = `
        <div class="card">
          <div class="img-box">
            <img src="../svg/topicon.svg" class="hot-top-icon" alt="熱門商品標誌" width="46" height="46" decoding="async">
            <img class="main" src="${item.mainImage}" alt="${esc(item.name)}" width="148" height="148" loading="lazy" decoding="async">
            <p class="hotItemPrice"><span style="font-size: 0.8rem">NT$</span> ${esc(item.price)}</p>
          </div>
          <div class="hot-item-footer">
            <div class="hotItemName">${esc(item.name)}</div>
            <div class="card-seller">
              <img class="seller-avatar" src="${esc(item.owner?.photoURL || '../webP/default-avatar.webp')}" alt="${esc(item.owner?.name || '賣家')}" onerror="this.src='../webP/default-avatar.webp'">
              <span class="seller-name">${esc(item.owner?.name || '賣家')}</span>
            </div>
          </div>
        </div>
      `;
    listEl.appendChild(div);
    div.addEventListener('click', function() {
      const pid = this.dataset.id;
      if (pid) location.href = `../product/product.html?id=${encodeURIComponent(pid)}`;
    })
  });
  // 等瀏覽器排版完再判斷是否溢出
  requestAnimationFrame(updateHotAlignment);
}
function updatePager(pg){
  prevHotBtn.disabled = !pg.hasPrevPage;
  nextHotBtn.disabled = !pg.hasNextPage;
  pageInfo.textContent = `第 ${pg.currentPage} / ${pg.totalPages} 頁`;
}
const container = document.getElementById('hotItems');
const thumb = document.querySelector('.fake-thumb');
const fakeBar = document.querySelector('.fake-scrollbar');


function updateFakeScrollbar() {
const maxScroll = container.scrollWidth - container.clientWidth;
const visibleRatio = container.clientWidth / container.scrollWidth;


const rawThumbWidth = visibleRatio * container.clientWidth;
const thumbWidth = Math.min(120, Math.max(24, rawThumbWidth));


const scrollRatio = maxScroll > 0
? container.scrollLeft / maxScroll
: 0;


thumb.style.width = `${thumbWidth}px`;
thumb.style.transform = `translateX(${scrollRatio * (container.clientWidth - thumbWidth)}px)`;
}


function updateScrollbarVisibility() {
const canScrollRight =
container.scrollLeft + container.clientWidth < container.scrollWidth - 1;
fakeBar.classList.toggle('show', canScrollRight);
}

function updateHotAlignment() {
  const overflows = container.scrollWidth > container.clientWidth;
  container.classList.toggle('overflows', overflows);
}


container.addEventListener('scroll', () => {
requestAnimationFrame(() => {
updateFakeScrollbar();
updateScrollbarVisibility();
});
});


window.addEventListener('resize', () => {
requestAnimationFrame(() => {
  updateFakeScrollbar();
  updateScrollbarVisibility();
  updateHotAlignment();
});
});


// 初始化
updateFakeScrollbar();
updateScrollbarVisibility();
updateHotAlignment();

prevHotBtn.addEventListener("click", () => {
  if (page > 1) { hotDirection = -1; fetchPage(page - 1); }
});
nextHotBtn.addEventListener("click", () => {
  hotDirection = 1; fetchPage(page + 1);
});
  // 確保所有 DOM 元素都已經載入
  const openModalBtn = document.getElementById('create');

  // 將 submit 事件綁定到 form 上
  openModalBtn?.addEventListener('click', function(e) {
    e.preventDefault(); // 防止表單預設送出
    createCommodity();
  });

 
  async function createCommodity() {
  // 1. 商品名稱
  const nameEl = document.getElementById('name');
  if (!nameEl.value.trim()) {
    Swal.fire({ title: "請輸入商品名稱", icon: "warning" });
    return;
  }

  // 2. 商品描述
  const desc = document.getElementById('description').value.trim();
  if (!desc) {
    Swal.fire({ title: "請輸入商品描述", icon: "warning" });
    return;
  } else if (desc.length < 10) {
    Swal.fire({ title: "字數太少", text: "商品狀態描述至少需要 10 字以上，請再補充內容。", icon: "warning" });
    return;
  }

  // 3. 售價（數字檢查）
  const priceStr = document.getElementById('price').value.trim();
  const price = Number(priceStr);
  if (priceStr === '' || Number.isNaN(price) || price < 0) {
    Swal.fire({ title: "請輸入商品售價", text: "請確認金額為非負數", icon: "warning" });
    return;
  }

  // 4. 尺寸
  if (!document.getElementById('size').value) {
    Swal.fire({ title: "請選擇商品尺寸", icon: "warning" });
    return;
  }

  // 5. 新舊程度
  if (!document.getElementById('new_or_old').value) {
    Swal.fire({ title: "請選擇商品的新舊程度", icon: "warning" });
    return;
  }

  // 6. 分類
  const category = document.getElementById('category').value;
  if (!category || category === 'notselyet') {
    Swal.fire({ title: "請選擇商品分類", icon: "warning" });
    return;
  }

  // 7. 主要照片
  if (document.getElementById('mainImage').files.length === 0) {
    Swal.fire({ title: "請上傳主要照片", icon: "warning" });
    return;
  }
  // 8. 其他照片
  if (document.getElementById('image').files.length === 0) {
    Swal.fire({ title: "請至少上傳一張其他照片", icon: "warning" });
    return;
  }

  // 9. 庫存（數字檢查）
  const stockStr = document.getElementById('stock').value.trim();
  const stock = Number(stockStr);
  if (stockStr === '' || Number.isNaN(stock) || stock < 0) {
    Swal.fire({ title: "請填入庫存數量", icon: "warning" });
    return;
  }

  // 10. 年齡（允許 -1 表示不詳）
  const ageStr = document.getElementById('age').value.trim();
  const age = Number(ageStr);
  if (ageStr === '' || Number.isNaN(age) || age < -1) {
    Swal.fire({ title: "請選擇商品年齡", icon: "warning" });
    return;
  }

  // 二次確認
  const confirmRes = await Swal.fire({
    title: "確定要販賣此商品?",
    text: "請確認所有商品資訊與照片皆符合規定。",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "是，我就要賣！"
  });
  if (!confirmRes.isConfirmed) return;

  const loaderOverlay = document.getElementById('loadingOverlay');
  loaderOverlay.classList.remove('d-none');
  loaderOverlay.classList.add('d-flex');

  const formEl = document.getElementById('createCommodityForm');
  const sellData = new FormData(formEl);
  // 保險起見，把數字欄位用 set 覆蓋成數字字串
  sellData.set('price', String(price));
  sellData.set('stock', String(stock));
  sellData.set('age', String(age));

  const backendService = new BackendService();

  try {
    await backendService.create(sellData);
    loaderOverlay.classList.remove('d-flex');
    loaderOverlay.classList.add('d-none');
    await Swal.fire({
      title: "商品上架成功!",
      text: "請至首頁確認是否顯示您的商品",
      icon: "success"
    });
    formEl.reset();
    window.location.href = "shop.html";
  } catch (e) {
    Swal.fire({
      title: "Oops...發生錯誤，請稍後再試",
      text: e?.message || 'Failed to create commodity.',
      icon: "error"
    });
  } finally {
    loaderOverlay.classList.add('d-none');
    loaderOverlay.classList.remove('d-flex');
  }
}
})
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

// ---- 裁切 Modal 共用邏輯 ----
let shopCropper      = null;
let shopCropQueue    = [];   // 待裁切的原始 File 物件
let shopCroppedFiles = [];   // 已裁切+壓縮的結果
let shopCropTarget   = '';   // 'main' | 'multi'
let shopCropFromConfirm = false;

const shopCropModalEl = document.getElementById('shopCropModal');
const shopCropImg     = document.getElementById('shopCropImg');
const shopCropCounter = document.getElementById('shopCropCounter');
const shopCropModal   = bootstrap.Modal.getOrCreateInstance(shopCropModalEl);

function openShopCrop(files, target) {
  shopCropQueue    = Array.from(files);
  shopCroppedFiles = [];
  shopCropTarget   = target;
  processNextShopCrop();
}

function processNextShopCrop() {
  if (shopCropQueue.length === 0) { finishShopCrop(); return; }
  const total   = shopCroppedFiles.length + shopCropQueue.length;
  const current = shopCroppedFiles.length + 1;
  shopCropCounter.textContent = total > 1 ? `(${current} / ${total})` : '';
  if (shopCropper) { shopCropper.destroy(); shopCropper = null; }
  const reader = new FileReader();
  reader.onload = (e) => {
    shopCropImg.src = e.target.result;
    shopCropModal.show();
  };
  reader.readAsDataURL(shopCropQueue[0]);
}

// modal 完全顯示後才初始化 Cropper，並確保圖片已載入
shopCropModalEl.addEventListener('shown.bs.modal', () => {
  if (shopCropper) shopCropper.destroy();
  const init = () => {
    shopCropper = new Cropper(shopCropImg, {
      viewMode: 1,
      autoCropArea: 0.9,
      responsive: true,
    });
  };
  if (shopCropImg.complete && shopCropImg.naturalWidth > 0) {
    init();
  } else {
    shopCropImg.addEventListener('load', init, { once: true });
  }
});

document.getElementById('shopCropConfirm').addEventListener('click', () => {
  if (!shopCropper) return;
  shopCropFromConfirm = true;
  const canvas = shopCropper.getCroppedCanvas({ maxWidth: 1200, maxHeight: 1200 });
  shopCropModal.hide();
  canvas.toBlob(async (blob) => {
    const compressed = await compressImage(blob, 1200, 0.82);
    shopCroppedFiles.push(compressed);
    shopCropQueue.shift();
    processNextShopCrop();
  }, 'image/webp', 0.92);
});

shopCropModalEl.addEventListener('hidden.bs.modal', () => {
  if (shopCropper) { shopCropper.destroy(); shopCropper = null; }
  shopCropImg.src = '';
  if (!shopCropFromConfirm) {
    // 使用者取消 → 清空佇列，不更新 input
    shopCropQueue    = [];
    shopCroppedFiles = [];
  }
  shopCropFromConfirm = false;
});

function finishShopCrop() {
  if (shopCropTarget === 'main') {
    const input = document.getElementById('mainImage');
    const dt = new DataTransfer();
    dt.items.add(shopCroppedFiles[0]);
    input.files = dt.files;
    const preview = document.getElementById('mainImagePreview');
    preview.innerHTML = '';
    const img = document.createElement('img');
    const url = URL.createObjectURL(shopCroppedFiles[0]);
    img.onload = () => URL.revokeObjectURL(url);
    img.src = url;
    img.style.cssText = 'width:150px;border-radius:8px;border:1px solid #ccc;box-shadow:0 0 6px rgba(0,0,0,0.1);';
    preview.appendChild(img);
  } else {
    const input = document.getElementById('image');
    const dt = new DataTransfer();
    shopCroppedFiles.forEach(f => dt.items.add(f));
    input.files = dt.files;
    const preview = document.getElementById('previewArea');
    preview.innerHTML = '';
    shopCroppedFiles.forEach(f => {
      const img = document.createElement('img');
      const url = URL.createObjectURL(f);
      img.onload = () => URL.revokeObjectURL(url);
      img.src = url;
      img.style.cssText = 'width:100px;margin:5px;object-fit:cover;border:1px solid #ccc;border-radius:8px;';
      preview.appendChild(img);
    });
  }
}

document.getElementById('mainImage').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 5000000) {
    Swal.fire({ icon: 'warning', title: '照片太大', text: '單張照片不能超過 5MB，請壓縮後再上傳。' });
    return;
  }
  e.target.value = '';
  openShopCrop([file], 'main');
});

document.getElementById('image').addEventListener('change', function (e) {
  const files = Array.from(e.target.files);
  if (!files.length) return;
  const oversized = files.find(f => f.size > 5000000);
  if (oversized) {
    Swal.fire({ icon: 'warning', title: '照片太大', text: '單張照片不能超過 5MB，請壓縮後再上傳。' });
    return;
  }
  e.target.value = '';
  openShopCrop(files, 'multi');
});

// TODO member
// const member = document.getElementById('member');
// const memberbtn = document.getElementById('memberbtn');
// const backbtn2 = document.getElementById('back-btn2');
// memberbtn.addEventListener('click', function(e){
//   member.style.display = 'block';
//   midcontent.style.display = 'none';
//   talkInterface.style.display = 'none';
// })
// backbtn2.addEventListener('click', function(e){
//   member.style.display = 'none';
//   talkInterface.style.display = 'block';
//   midcontent.style.display = 'block';
// })
// TODO mystery
// const mystery = document.getElementById('mystery');
// const mysterybtn = document.getElementById('mysterybtn');
// const backbtn3 = document.getElementById('back-btn3');
// mysterybtn.addEventListener('click', function(e){
//   mystery.style.display = 'block';
//   midcontent.style.display = 'none';
//   talkInterface.style.display = 'none';
// })
// backbtn3.addEventListener('click', function(e){
//   mystery.style.display = 'none';
//   midcontent.style.display = 'block';
//   talkInterface.style.display = 'block';
// })
// TODO everyday
// const everyday = document.getElementById('everyday');
// const everydaybtn = document.getElementById('everydaybtn');
// const backbtn4 = document.getElementById('back-btn4');
// everydaybtn.addEventListener('click', function(e){
//   everyday.style.display = 'block';
//   midcontent.style.display = 'none';
//   talkInterface.style.display = 'none';
// })
// backbtn4.addEventListener('click', function(e){
//   everyday.style.display = 'none';
//   midcontent.style.display = 'block';
//   talkInterface.style.display = 'block';
// })
// TODO donate
// const donate = document.getElementById('donate');
// const donatebtn = document.getElementById('donatebtn');
// const backbtn5 = document.getElementById('back-btn5');
// donatebtn.addEventListener('click', function(e){
//   donate.style.display = 'block';
//   midcontent.style.display = 'none';
//   talkInterface.style.display = 'none';
// })
// backbtn5.addEventListener('click', function(e){
//   donate.style.display = 'none';
//   midcontent.style.display = 'block';
//   talkInterface.style.display = 'block';
// })
// TODO 校園攻略站
// const campus = document.getElementById('campus');
// const campusbtn = document.getElementById('campusbtn');
// const backbtn6 = document.getElementById('back-btn6');
// campusbtn.addEventListener('click', function(e){
//   // window.location.href = '../school/school.html';
//   // campus.style.display = 'block';
//   // midcontent.style.display = 'none';
//   // talkInterface.style.display = 'none';
// });
// backbtn6.addEventListener('click', function(e){
//   campus.style.display = 'none';
//   midcontent.style.display = 'block';
//   talkInterface.style.display = 'block';
// });

// TODO 陳列商品


// ── 最新上架：電腦版分頁 / 手機版左右滑切換 ──
document.addEventListener('DOMContentLoaded', () => {
  const container  = document.getElementById('product-grid');
  const prevBtn    = document.getElementById('newPrev');
  const nextBtn    = document.getElementById('newNext');
  const pageInfo   = document.getElementById('newInfo');
  const dotsEl     = document.getElementById('newMobileDots');
  const swipeHint  = document.getElementById('newSwipeHint');

  if (!container) { console.warn('#product-grid 容器不存在'); return; }

  // 初始化排版
  [...container.classList].forEach(cls => {
    if (cls.startsWith('row-cols-')) container.classList.remove(cls);
  });
  container.classList.add('row', 'row-cols-2', 'row-cols-md-3', 'row-cols-lg-6', 'g-3', 'container-card');

  const DESKTOP_LIMIT = 12;
  const MOBILE_CHUNK  = 6;

  // 高度鎖定：防止換頁時因商品數量不足而縮小
  let _minHDesktop = 0;
  let _minHMobile  = 0;

  // 電腦版狀態
  let desktopPage = 1;

  // 手機版狀態
  let mobileBuffer   = [];   // 已抓到的所有商品
  let mobileChunk    = 0;    // 目前顯示第幾塊（每塊 6 個）
  let backendPage    = 1;    // 下次要跟後端要的頁碼
  let backendHasMore = true; // 後端是否還有更多
  let isFetching     = false;

  function isDesktop() { return window.innerWidth >= 992; }

  // ── 初始化 ──
  if (isDesktop()) {
    showDesktopUI();
    fetchDesktopPage(1);
  } else {
    showMobileUI();
    initMobile();
  }

  // ── 視窗縮放切換模式 ──
  let wasDesktop = isDesktop();
  window.addEventListener('resize', () => {
    const nowDesktop = isDesktop();
    if (nowDesktop === wasDesktop) return;
    wasDesktop = nowDesktop;
    // 切換版型時重置高度鎖定（欄數不同，原高度不適用）
    _minHDesktop = 0;
    _minHMobile  = 0;
    container.style.minHeight = '';
    if (nowDesktop) {
      showDesktopUI();
      fetchDesktopPage(desktopPage);
    } else {
      showMobileUI();
      if (mobileBuffer.length === 0) initMobile();
      else renderMobileChunk(mobileChunk);
    }
  });

  function showDesktopUI() {
    if (swipeHint) swipeHint.style.display = 'none';
    if (dotsEl)    dotsEl.style.display    = 'none';
  }
  function showMobileUI() {
    if (swipeHint) swipeHint.style.display = '';
    if (dotsEl)    dotsEl.style.display    = '';
  }

  // ────────── 電腦版 ──────────
  prevBtn.addEventListener('click', () => { if (!prevBtn.disabled) fetchDesktopPage(desktopPage - 1); });
  nextBtn.addEventListener('click', () => { if (!nextBtn.disabled) fetchDesktopPage(desktopPage + 1); });

  async function fetchDesktopPage(p) {
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    pageInfo.textContent = '載入中…';
    container.innerHTML = productGridSkeletonHTML(12);
    const response = await backendService.getNewItems({ page: p, limit: DESKTOP_LIMIT });
    const productList = response?.data?.commodities ?? [];
    const pg = response?.data?.pagination ?? { currentPage: p, totalPages: 1, hasPrevPage: p > 1, hasNextPage: false };
    desktopPage = pg.currentPage ?? p;
    renderItems(productList);
    prevBtn.disabled = !pg.hasPrevPage;
    nextBtn.disabled = !pg.hasNextPage;
    pageInfo.textContent = `第 ${pg.currentPage} / ${pg.totalPages} 頁`;
  }

  // ────────── 手機版 ──────────
  async function initMobile() {
    container.innerHTML = productGridSkeletonHTML(6);
    await fetchMobileNextBatch();
    renderMobileChunk(0);
  }

  // 靜默地抓下一批，不主動更新畫面
  async function fetchMobileNextBatch() {
    if (isFetching || !backendHasMore) return;
    isFetching = true;
    try {
      const response = await backendService.getNewItems({ page: backendPage, limit: DESKTOP_LIMIT });
      const items = response?.data?.commodities ?? [];
      const pg    = response?.data?.pagination ?? {};
      backendHasMore = !!pg.hasNextPage;
      backendPage    = (pg.currentPage ?? backendPage) + 1;
      mobileBuffer.push(...items);
    } finally {
      isFetching = false;
    }
    updateDots();
  }

  function renderMobileChunk(idx) {
    mobileChunk = idx;
    const start = idx * MOBILE_CHUNK;
    renderItems(mobileBuffer.slice(start, start + MOBILE_CHUNK));
    updateDots();
    // 在最後一塊時預先靜默抓取下一批
    const totalChunks = Math.ceil(mobileBuffer.length / MOBILE_CHUNK);
    if (idx >= totalChunks - 1 && backendHasMore && !isFetching) {
      fetchMobileNextBatch();
    }
  }

  function updateDots() {
    if (!dotsEl) return;
    const totalChunks = Math.max(1, Math.ceil(mobileBuffer.length / MOBILE_CHUNK));
    let html = '';
    for (let i = 0; i < totalChunks; i++) {
      html += `<span class="swipe-dot${i === mobileChunk ? ' active' : ''}"></span>`;
    }
    if (backendHasMore) html += `<span class="swipe-dot swipe-dot-more"></span>`;
    dotsEl.innerHTML = html;

    // 更新左右箭頭透明度
    const leftArrow  = swipeHint?.querySelector('.swipe-arrow-left');
    const rightArrow = swipeHint?.querySelector('.swipe-arrow-right');
    if (leftArrow)  leftArrow.style.opacity  = mobileChunk > 0 ? '1' : '0.25';
    if (rightArrow) rightArrow.style.opacity = (mobileChunk < totalChunks - 1 || backendHasMore) ? '1' : '0.25';
  }

  // ── 觸控滑動偵測 ──
  let touchX = 0, touchY = 0;
  container.addEventListener('touchstart', e => {
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
  }, { passive: true });
  container.addEventListener('touchend', e => {
    if (isDesktop()) return;
    const dx = e.changedTouches[0].clientX - touchX;
    const dy = e.changedTouches[0].clientY - touchY;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return; // 不夠水平
    if (dx < 0) swipeToNext();
    else         swipeToPrev();
  }, { passive: true });

  function swipeToNext() {
    const totalChunks = Math.ceil(mobileBuffer.length / MOBILE_CHUNK);
    if (mobileChunk < totalChunks - 1) {
      animateSwitch('left', () => renderMobileChunk(mobileChunk + 1));
    } else if (backendHasMore && !isFetching) {
      // 現有資料已顯示完，再跟後端要一批
      fetchMobileNextBatch().then(() => {
        const newTotal = Math.ceil(mobileBuffer.length / MOBILE_CHUNK);
        if (mobileChunk < newTotal - 1) {
          animateSwitch('left', () => renderMobileChunk(mobileChunk + 1));
        }
      });
    }
  }

  function swipeToPrev() {
    if (mobileChunk > 0) animateSwitch('right', () => renderMobileChunk(mobileChunk - 1));
  }

  function animateSwitch(dir, callback) {
    container.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
    container.style.opacity    = '0';
    container.style.transform  = `translateX(${dir === 'left' ? '-20px' : '20px'})`;
    setTimeout(() => {
      callback();
      container.style.transform = `translateX(${dir === 'left' ? '20px' : '-20px'})`;
      void container.offsetHeight; // force reflow
      container.style.opacity   = '1';
      container.style.transform = 'translateX(0)';
      setTimeout(() => {
        container.style.transition = '';
        container.style.transform  = '';
        container.style.opacity    = '';
      }, 160);
    }, 150);
  }

  // ── 共用 renderItems ──
  function renderItems(productList) {
    container.innerHTML = '';
    const categoryMap = {
      book: '書籍與學籍用品', life: '宿舍與生活用品',
      student: '學生專用器材', other: '其他',
      recycle: '環保生活用品', clean: '儲物與收納用品',
    };
    const newOrOldMap = { 1:'全新',2:'幾乎全新',3:'半新',4:'適中',5:'稍舊',6:'全舊' };

    productList.forEach((product) => {
      const col  = document.createElement('div');
      col.className = 'col';
      const card = document.createElement('div');
      card.className = 'product-card position-relative h-100';
      card.dataset.id = product.id;
      card.style.width = '100%';
      card.style.borderRadius = '0.3rem';
      const imgUrl   = product.mainImage || '/img/placeholder.png';
      const category = categoryMap[product.category] ?? '其他';
      const newOrOld = newOrOldMap[product.newOrOld] ?? '';
      card.innerHTML = `
        <div class="product-thumb">
          <img src="${imgUrl}" alt="${esc(product.name)}" loading="lazy">
        </div>
        <div class="card-body d-flex flex-column">
          <h5 class="card-title ellipsis-text">${esc(product.name)}</h5>
          <p class="card-text mb-2 ellipsis-text d-flex"><span># ${category} </span><span>${newOrOld ? `# ${newOrOld}` : '#未知'}</span></p>
          <div class="mt-auto">
            <div class="d-flex justify-content-between align-items-center">
              <span class="fw-bold price">NT$ ${esc(product.price)}</span>
              <div class="card-seller">
                <img class="seller-avatar" src="${esc(product.owner?.photoURL || '../webP/default-avatar.webp')}" alt="${esc(product.owner?.name || '賣家')}" onerror="this.src='../webP/default-avatar.webp'">
                <span class="seller-name">${esc(product.owner?.name || '賣家')}</span>
              </div>
            </div>
          </div>
        </div>
      `;
      card.addEventListener('click', () => {
        const pid = card.dataset.id;
        if (pid) location.href = `../product/product.html?id=${encodeURIComponent(pid)}`;
      });
      col.appendChild(card);
      container.appendChild(col);
    });

    // 首次滿版渲染後鎖定高度，防止換頁時因商品數量不足而縮小
    requestAnimationFrame(() => {
      const h = container.offsetHeight;
      if (h <= 0) return;
      if (isDesktop()) {
        if (_minHDesktop === 0 && productList.length >= DESKTOP_LIMIT) _minHDesktop = h;
        if (_minHDesktop > 0) container.style.minHeight = _minHDesktop + 'px';
      } else {
        if (_minHMobile === 0 && productList.length >= MOBILE_CHUNK) _minHMobile = h;
        if (_minHMobile > 0) container.style.minHeight = _minHMobile + 'px';
      }
    });
  }
});


// 切換 icon 工具
function toggleIcon(iconEl, toFav) {
  if (toFav) {
    iconEl.classList.remove('fa-regular');
    iconEl.classList.add('fa-solid');
  } else {
    iconEl.classList.remove('fa-solid');
    iconEl.classList.add('fa-regular');
  }
}


// TODO 學力銀行

const grid = document.getElementById('product-grid');
const pagination = document.getElementById('pagination');
let allProducts = [];
let currentPage = 1;
const itemsPerPage = 12;


function renderPagination() {
  pagination.innerHTML = '';
  const totalPages = Math.ceil(allProducts.length / itemsPerPage);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.innerText = i;
    btn.style.margin = '10px 4px';
    btn.style.padding = '6px 11px';
    btn.style.borderRadius = '50px';
    btn.style.border = 'none';
    btn.style.background = i === currentPage ? 'linear-gradient(to left bottom, rgba(36,182,133,0.4), #004b9750)' : '#fbfbfb';
    btn.style.color = i === currentPage ? '#fff' : '#000';

    btn.addEventListener('click', () => {
      currentPage = i;
      renderPage(currentPage);
      renderPagination();
      window.scrollTo({
        top: document.getElementById('product-grid').offsetTop,
        behavior: 'smooth'
      });
    });

    pagination.appendChild(btn);
  }
}
(function(){
  const links = Array.from(document.querySelectorAll('#tocSeller a'));
  const sections = links.map(a => document.querySelector(a.getAttribute('href')));
  const observer = new IntersectionObserver((entries)=>{
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a,b)=> a.boundingClientRect.top - b.boundingClientRect.top)[0];
    if(!visible) return;
    const id = '#'+visible.target.id;
    links.forEach(l => l.classList.toggle('active', l.getAttribute('href')===id));
  }, { rootMargin:'0px 0px -60% 0px', threshold:0.2 });
  sections.forEach(sec => sec && observer.observe(sec));
})();

document.addEventListener("DOMContentLoaded", function () {
  const chatList = document.getElementById("chatList");
  const chatConversation = document.getElementById("chatConversation");
  const chatTargetName = document.getElementById("chatTargetName");
  const backToList = document.getElementById("backToList");
  const sendBtn = document.getElementById("sendBtn");
  const messageInput = document.getElementById("messageInput");
  const chatBox = document.getElementById("chatBox");
 if (!chatList || !chatConversation || !chatTargetName || !backToList || !sendBtn || !messageInput || !chatBox) {
    console.warn("缺少必要的聊天介面元素");
    return;
  } else {
    console.log("聊天介面元素載入完成");
  }
  // 點擊聊天清單 → 進入對話
  document.querySelectorAll(".person").forEach(person => {
    person.addEventListener("click", () => {
      const name = person.dataset.name || "未命名";
      chatTargetName.textContent = name;
      chatList.classList.add("d-none");
      chatConversation.classList.remove("d-none");
      console.log(`開始與 ${name} 聊天`);
      // 預設假訊息
      chatBox.innerHTML = `
        <div class="message receiver">嗨！我是 ${name}</div>
        <div class="timestamp">${new Date().toLocaleString()}</div>
      `;
    });
  });

  // 返回清單
  backToList.addEventListener("click", () => {
    chatConversation.classList.add("d-none");
    chatList.classList.remove("d-none");
  });

  // 送出訊息
  sendBtn.addEventListener("click", () => {
    const msg = messageInput.value.trim();
    if (!msg) return;

    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", "sender");
    msgDiv.textContent = msg;

    const timeDiv = document.createElement("div");
    timeDiv.classList.add("timestamp");
    timeDiv.textContent = new Date().toLocaleTimeString();

    chatBox.appendChild(msgDiv);
    chatBox.appendChild(timeDiv);

    messageInput.value = "";
    chatBox.scrollTop = chatBox.scrollHeight; // 自動捲到底
  });
});
// TODO 呼叫 wishpool.js, wpBackendService.js 來展示願望
async function callWish() {
  const wishContainer = document.getElementById("wishArea");
  if (wishContainer) wishContainer.innerHTML = wishAreaSkeletonHTML(8);
  wpbackendService = new wpBackendService();
  try {
    const res = await wpbackendService.listWishes(1);
    showWishes(res.data);
  } catch (error) {
    console.error('showWishes error: ', error);
  }
}
function showWishes(data) {
  const container = document.getElementById("wishArea");
  if (!data.wishes || data.pagination.total === 0) {
    container.innerHTML = '<p class="empty">目前還沒有願望</p>';
    return;
  }
  const wishes = data.wishes.slice(0, 10).map(w => ({
    ...w,
    _size: Math.floor(Math.random() * 51) + 50,    // 50–100px
    _marginTop: Math.floor(Math.random() * 160) - 80, // -80~+80px, large height spread
    _gap: Math.floor(Math.random() * 40) + 5        // 5–44px 不固定間距
  }));

  // 建立一條 track：4份複製 → translateX(-25%) 完全無縫
  function makeTrack(layerClass, list) {
    const track = document.createElement('div');
    track.className = `wish-track ${layerClass}`;
    [...list, ...list, ...list, ...list].forEach((wish) => {
      const b = document.createElement('div');
      b.className = 'wish';
      b.dataset.id = wish.id;
      b.style.width = `${wish._size + 10}px`;
      b.style.marginTop = `${wish._marginTop}px`;
      b.style.marginRight = `${wish._gap}px`;
      const photo = wish.owner?.photoURL || '../webP/default-avatar.webp';
      b.innerHTML = `
        <img class="wish-avatar" src="${esc(photo)}" alt="許願者頭像"
             style="width:${wish._size}px;height:${wish._size}px;"
             onerror="this.src='../webP/default-avatar.webp'">
        <span class="wish-label">${esc(wish.itemName)}</span>
      `;
      b.addEventListener('click', () => {
        if (wish.id) {
          sessionStorage.setItem('focusWishId', String(wish.id));
          location.href = '../wishpool/wishpool.html#wishpool';
        }
      });
      track.appendChild(b);
    });
    return track;
  }

  // 保留 HTML 裡的波浪層，只重建泡泡 track
  const waveLayers = Array.from(container.querySelectorAll('.wish-wave-layer'));
  container.innerHTML = '';
  waveLayers.forEach(el => container.appendChild(el));
  container.appendChild(makeTrack('wish-track--front', wishes));
}

// 聊天室介面顯示與隱藏
const chatopen = document.getElementById('chaticon');
const chatclose = document.getElementById('closechat');
const talkInterface = document.getElementById('talkInterface');
chatopen.addEventListener('click', function(e){
    toggleChatInterface();
})
const container = document.getElementById("ruleContainer");
const leftBtn = document.getElementById("ruleLeft");
const rightBtn = document.getElementById("ruleRight");

const scrollAmount = 300;

rightBtn.addEventListener("click", () => {
  container.scrollLeft += scrollAmount;
});

leftBtn.addEventListener("click", () => {
  container.scrollLeft -= scrollAmount;
});