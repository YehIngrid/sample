import BackendService from '../BackendService.js';
import ChatBackendService from '../chatroom/ChatBackendService.js';
import { formatTaipeiTime, requireLogin } from '../default/default.js';

// ── Skeleton helper ──
function sellerProductSkeletonHTML(n = 6) {
  return Array.from({length: n}, () => `
    <div class="hot-item">
      <div class="card">
        <div class="img-box skeleton" style="width:100%;height:148px;border-radius:10px 10px 0 0;"></div>
        <div style="padding:8px 6px">
          <div class="skeleton skeleton-text" style="width:85%;margin:0 auto;"></div>
        </div>
      </div>
    </div>`).join('');
}

// ── Seller items pagination state ──
let _sellerAllProducts = [];
let _sellerCurrentPage = 1;
const SELLER_PER_PAGE = 6;

function _renderSellerPage(page) {
  const container = document.getElementById('otherProducts');
  const dotsEl    = document.getElementById('sellerMobileDots');
  const infoEl    = document.getElementById('sellerPageInfo');
  const prevBtn   = document.getElementById('prevSellerBtn');
  const nextBtn   = document.getElementById('nextSellerBtn');
  if (!container) return;

  const totalPages = Math.ceil(_sellerAllProducts.length / SELLER_PER_PAGE);
  const start = (page - 1) * SELLER_PER_PAGE;
  const slice = _sellerAllProducts.slice(start, start + SELLER_PER_PAGE);

  container.innerHTML = '';
  slice.forEach(product => {
    const div = document.createElement('div');
    div.className = 'hot-item';
    div.dataset.id = product.id ?? product._id ?? product.commodityId ?? '';
    const imgSrc = product.mainImage || '';
    const name   = product.name || '未命名';
    const price  = Number(product.price ?? 0).toLocaleString('zh-TW');
    div.innerHTML = `
      <div class="card">
        <div class="img-box">
          <img class="main" src="${imgSrc}" alt="${name}" loading="lazy"
               onerror="this.src='../image/placeholder.png'">
          <p class="hotItemPrice"><span style="font-size:0.8rem">NT$</span> ${price}</p>
        </div>
        <div class="hotItemName">${name}</div>
      </div>`;
    div.addEventListener('click', () => {
      const pid = div.dataset.id;
      if (pid) location.href = `product.html`;
    });
    container.appendChild(div);
  });

  // Pagination info
  if (infoEl) infoEl.textContent = totalPages > 1 ? `${page} / ${totalPages}` : '';
  if (prevBtn) prevBtn.disabled = page <= 1;
  if (nextBtn) nextBtn.disabled = page >= totalPages;

  // Mobile dots
  if (dotsEl) {
    dotsEl.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
      const dot = document.createElement('span');
      dot.style.cssText = `width:7px;height:7px;border-radius:50%;display:inline-block;background:${i === page ? '#004b97' : '#ccc'};transition:background 0.2s;`;
      dotsEl.appendChild(dot);
    }
  }

  // Hide pager entirely if only 1 page
  const pagerEl = document.getElementById('sellerPager');
  if (pagerEl) pagerEl.style.display = totalPages <= 1 ? 'none' : '';
}

// 全域變數（不要再用 const/let 重新宣告它）
let backendService = null;
let chatService = null;
let sellerId = null;
let itemId = null;   // 放最上面
let chatInnerDoc = null; 
let chatInnerWin = null; // 儲存 iframe 內部 document 的參考

const formatPrice = (v) => `${Number(v ?? 0).toLocaleString('zh-TW')}<span>NT$</span>`;
const toArray = (v) => Array.isArray(v) ? v : (v ? [v] : []);
const toFullURL = (u) => (!u ? '' : (/^https?:\/\//.test(u) ? u : u)); // 如需前綴可在此加

const backbtn = document.querySelector('#back-btn');
backbtn.addEventListener('click', function(e){
    window.history.back();
})

// ── 分享功能 ──
function getShareInfo() {
  const name = document.getElementById('product-name')?.textContent?.trim() || '商品';
  const url  = location.href;
  return { name, url };
}


// 各平台分享連結（電腦版 + 手機版一起更新）
function updateDesktopShareLinks() {
  const { name, url } = getShareInfo();
  const enc = encodeURIComponent(url);
  const encText = encodeURIComponent(`拾貨寶庫｜${name}`);
  const fbUrl   = `https://www.facebook.com/sharer/sharer.php?u=${enc}`;
  const lineUrl = `https://social-plugins.line.me/lineit/share?url=${enc}`;
  const xUrl    = `https://twitter.com/intent/tweet?url=${enc}&text=${encText}`;

  ['shareFb', 'shareFbM'].forEach(id => { const el = document.getElementById(id); if (el) el.href = fbUrl; });
  ['shareLine', 'shareLineM'].forEach(id => { const el = document.getElementById(id); if (el) el.href = lineUrl; });
  ['shareX', 'shareXM'].forEach(id => { const el = document.getElementById(id); if (el) el.href = xUrl; });
}

// IG 和複製連結
async function copyLink() {
  const { url } = getShareInfo();
  try {
    await navigator.clipboard.writeText(url);
    Swal.fire({ icon: 'success', title: '已複製連結', showConfirmButton: false, timer: 1400 });
  } catch (_) {
    Swal.fire({ icon: 'info', title: '分享連結', text: url });
  }
}
['shareIg', 'shareIgM'].forEach(id => {
  document.getElementById(id)?.addEventListener('click', async () => {
    await copyLink();
    Swal.fire({ icon: 'info', title: 'Instagram 分享', text: '連結已複製，請到 Instagram 貼上分享！', showConfirmButton: true });
  });
});
['shareCopy', 'shareCopyM'].forEach(id => {
  document.getElementById(id)?.addEventListener('click', copyLink);
});

document.addEventListener('DOMContentLoaded', async () => {
  backendService = new BackendService();
  itemId = new URLSearchParams(location.search).get('id');
  console.log('id:', itemId);
  if (!itemId) {
    console.warn('缺少商品 id');
    return;
  }
  if (itemId) {
    document.querySelectorAll('.order').forEach(btn => {
      btn.dataset.id = itemId;
    });
  }
  try {
    const response = await backendService.getItemsInfo(itemId);
    onSuccess(response);
  } catch (e) {
    console.error('取得商品失敗', e);
    const status = e?.response?.status;
    if (status === 404 || !status) {
      window.location.replace('../NotFoundPage.html');
    }
  }
  document.querySelectorAll('.shopcart').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      if (btn.dataset.ownProduct) return;
      if (!(await requireLogin())) return;
      onAddToCart(e);
    });
  });
  document.querySelectorAll('.buybtn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      if (btn.dataset.ownProduct) return;
      if (!(await requireLogin())) return;
      orderNow(e);
    });
  });
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



  const onSuccess =  async(response) => {
    const product = response?.data ?? {};
    console.log('product:', product);

    // === 基本資訊 ===
    const nameEl = document.getElementById('product-name');
    if (nameEl) nameEl.textContent = product.name || '未命名';

    const priceEl = document.getElementById('product-price');
    if (priceEl) priceEl.innerHTML = formatPrice(product.price);

    const descEl = document.getElementById('product-description');
    if (descEl) descEl.textContent = product.description || '無描述';

    // === 分類 / 新舊 ===
    const categoryMap = {
      book: '書籍與學籍用品',
      life: '宿舍與生活用品',
      student: '學生專用器材',
      recycle: '環保生活用品',
      clean: '儲物與收納用品',
      other: '其他',
    };
    const newOrOldMap = {
      1 : '全新', 
      2 : '幾乎全新', 
      3 : '半新',
      4 : '適中', 
      5 : '稍舊', 
      6 : '全舊', 
    };
    const newOrOld = newOrOldMap[product.newOrOld] ?? '未標示';
    const category = categoryMap?.[product.category] ?? '未分類(其他)';
    const sizeMap = {
      0: '小',
      1: '中',
      2: '大'
    };
    const size = sizeMap?.[product.size] ?? '未標示';
    const updatedTime = formatTaipeiTime(product.updatedAt);
    const createdTime = formatTaipeiTime(product.createdAt);

/* ---------- 工具：安全轉數字 + 金額格式 ---------- */
const num = (v, d = 0) => Number.isFinite(+v) ? +v : d;
const fmt = (v) => new Intl.NumberFormat('zh-Hant-TW').format(num(v, 0));

/* ---------- 1) 標題／價格／庫存／數量加減 ---------- */
(function renderBasics(){
  // 名稱
  const nameEl = document.getElementById('product-name');
  if (nameEl) nameEl.textContent = product?.name ?? '';
  updateDesktopShareLinks();

  // 價格（只放數字；右邊的 NT$ 已在 HTML）
  const priceEl = document.getElementById('price');
  if (priceEl) priceEl.textContent = fmt(product?.price);

  // 庫存
  const stockEl = document.getElementById('stock');
  const stock = num(product?.stock, 0);
  if (stockEl) stockEl.textContent = stock;

  // 數量加減（1 ~ 庫存（若庫存<=0 則固定為 0/不可購買，可依需求擋按鈕））
  const qtyInput = document.getElementById('qty');
  const plusBtn  = document.getElementById('plus');
  const minusBtn = document.getElementById('minus');

  function clampQty(v){
    v = Number(String(v).replace(/[^\d]/g,'')) || 1;
    if (stock > 0){
      if (v < 1) v = 1;
      if (v > stock) v = stock;
    }else{
      v = 0;
    }
    return v;
  }
  if (qtyInput){
    qtyInput.value = clampQty(qtyInput.value);
    qtyInput.addEventListener('input', () => qtyInput.value = clampQty(qtyInput.value));
  }
  plusBtn?.addEventListener('click', () => { qtyInput.value = clampQty(num(qtyInput.value) + 1); });
  minusBtn?.addEventListener('click', () => { qtyInput.value = clampQty(num(qtyInput.value) - 1); });
})();

/* ---------- 2) 規格／屬性（使用 <dl>） ---------- */
(function renderMeta() {
  const wrap = document.getElementById('product-category');
  if (!wrap) return;

  const ageText =
    String(product?.age) === '-1' || product?.age == null ? '未知' : `${product.age} 年`;

  const fields = [
    ['商品大小',  size ?? '-'],
    ['商品年齡',  ageText],
    ['新舊程度',  newOrOld ?? '未知'],
    ['分類',      category ?? '未分類'],
    ['上架時間',  createdTime ?? '-'],
    ['更新時間',  updatedTime ?? '-'],
  ];

  wrap.innerHTML = fields.map(([k, v]) => `
    <div class="row gy-2 align-items-center mb-1 meta-row">
      <div class="col-4 col-md-3 text-muted">${k}</div>
      <div class="col-8 col-md-9">${v}</div>
    </div>
  `).join('');
})();


/* ---------- 3) 圖片（主圖＋縮圖，含錯誤 fallback） ---------- */
(function renderImages() {
  const mainImg   = document.querySelector('.tryimg');         // 主圖 <img>
  const thumbList = document.querySelector('.thumbnail-list'); // 縮圖容器

  // 3.1 建立清單：先 mainImage，再 imageUrl；排除空值
  const looksLikeUrl = (u) => !!u && (/^https?:\/\//i.test(u) || u.startsWith('/'));
  let list = toArray(product?.imageUrl).map(toFullURL).filter(Boolean);

  if (product?.mainImage && looksLikeUrl(product.mainImage)) {
    const main = toFullURL(product.mainImage);
    if (main && !list.some(u => toFullURL(u) === main)) list.unshift(main);
  }
  if (!list.length) list = ['https://picsum.photos/900/900?grayscale'];

  // 3.2 主圖切換 + 錯誤 fallback
  let currentIdx = 0;
  function setMainByIndex(idx){
    if (!mainImg) return;
    currentIdx = idx;
    mainImg.src = list[idx];
    mainImg.alt = product?.name ?? '';
    mainImg.loading = 'lazy';

    // active 標示
    thumbList?.querySelectorAll('.thumb-img').forEach((el, i) => {
      el.classList.toggle('active', i === idx);
    });
  }

  if (mainImg){
    mainImg.onerror = () => {
      // 換下一張，直到可用或全部嘗試完
      const next = currentIdx + 1;
      if (next < list.length) setMainByIndex(next);
    };
  }

  // 3.3 產生縮圖
  if (thumbList){
    thumbList.innerHTML = '';
    list.forEach((src, idx) => {
      const imgEl = document.createElement('img');
      imgEl.src = src;
      imgEl.alt = `縮圖 ${idx + 1}`;
      imgEl.loading = 'lazy';
      imgEl.className = 'thumb-img' + (idx === 0 ? ' active' : '');
      imgEl.addEventListener('click', () => setMainByIndex(idx));
      thumbList.appendChild(imgEl);
    });
  }

  // 初始化主圖
  setMainByIndex(0);

  // 3.4 左右箭頭切換
  const prevBtn = document.getElementById('imgPrev');
  const nextBtn = document.getElementById('imgNext');
  if (prevBtn && nextBtn) {
    if (list.length <= 1) {
      prevBtn.classList.add('hidden');
      nextBtn.classList.add('hidden');
    } else {
      prevBtn.addEventListener('click', e => {
        e.stopPropagation();
        setMainByIndex((currentIdx - 1 + list.length) % list.length);
      });
      nextBtn.addEventListener('click', e => {
        e.stopPropagation();
        setMainByIndex((currentIdx + 1) % list.length);
      });
    }
  }

  // 3.5 手機左右滑動切換
  if (list.length > 1 && mainImg) {
    let swipeStartX = 0;
    mainImg.addEventListener('touchstart', e => {
      swipeStartX = e.touches[0].clientX;
    }, { passive: true });
    mainImg.addEventListener('touchend', e => {
      const diff = swipeStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) < 40) return;
      if (diff > 0) {
        setMainByIndex((currentIdx + 1) % list.length);
      } else {
        setMainByIndex((currentIdx - 1 + list.length) % list.length);
      }
    }, { passive: true });
  }

  // 3.6 PhotoSwipe 點擊放大（使用圖片實際尺寸）
  if (mainImg && typeof PhotoSwipe !== 'undefined' && list.length > 0) {
    function getImgSize(src) {
      return new Promise(resolve => {
        const img = new Image();
        img.onload  = () => resolve({ src, width: img.naturalWidth,  height: img.naturalHeight });
        img.onerror = () => resolve({ src, width: 1200, height: 900 });
        img.src = src;
      });
    }

    let pswpDataSource = null;
    async function openPswp(idx) {
      if (!pswpDataSource) {
        pswpDataSource = await Promise.all(list.map(getImgSize));
      }
      const pswp = new PhotoSwipe({
        dataSource: pswpDataSource,
        index: idx,
        bgOpacity: 0.88,
        showHideAnimationType: 'zoom',
        clickToCloseNonZoomable: true,
      });
      pswp.on('change', () => setMainByIndex(pswp.currIndex));
      pswp.init();
    }

    // 只在主圖 img 本身上監聽，避免箭頭按鈕觸發（箭頭已有 stopPropagation）
    mainImg.addEventListener('click', () => openPswp(currentIdx));
  }
})();

  
    // === 賣家資訊（保留；若有 API 就渲染） ===
    if (product?.owner) {
        const u = product.owner;

        // 先取出你原本的欄位（給預設值）
        const photo               = u.photoURL || '../image/default-avatar.png';
        const sellerName          = u.name || '賣家名稱';
        const sellerIntroduction  = u.introduction || '賣家簡介';
        // 這裡確保是數字；u.rate 可能是字串
        const sellerRate          = Number.isFinite(+u.rate) ? +u.rate : 0;
        sellerId            = u.accountId;

        // 組成 renderSellerInfo 需要的結構
        const data = {
          id: sellerId,
          name: sellerName,
          intro: sellerIntroduction,
          score: sellerRate,   // 注意：數字
          photoUrl: photo
        };

        renderSellerInfo(data);
        showSellerCommodities(sellerId); // 顯示賣家其他商品
        await checkIsOwnProduct(sellerId);
    } else {
      // 沒有 owner：可隱藏整張卡
      document.getElementById('sellerInfo')?.classList.add('d-none');
      console.log('略過賣家資訊渲染');
    }
  };

// === 把資料渲染到 #sellerInfo ===
function renderSellerInfo(data) {
  const root = document.getElementById('sellerInfo');
  if (!root) return;

  const img       = document.getElementById('sellerPhoto');
  const nameEl    = document.getElementById('sellerName');
  const introEl   = document.getElementById('sellerIntro');
  const scoreEl   = document.getElementById('sellerRate');
  const chatBtn   = document.getElementById('sellerChat'); // 與賣家聊聊
  const rateBtn   = root.querySelector('#sellerRatebtn');               // 查看賣家評價
  const reportBtn = root.querySelector('#sellerBad');            // 檢舉賣家

  // 灌資料（含預設值）
  if (img) {
    img.src = data.photoUrl || '../webP/default-avatar.webp';  // 和你的專案一致
    img.alt = data.name ? `${data.name} 的頭像` : '賣家頭像';
  }
  if (nameEl)  nameEl.textContent  = data.name  ?? '用戶名';
  if (introEl) introEl.textContent = data.intro ?? '這裡是我的自我介紹';
  if (scoreEl) scoreEl.textContent = Number.isFinite(+data.score) ? +data.score : 0;

  // 綁事件（依你的路由調整）
  if (chatBtn)   chatBtn.onclick   = () => openChatWithSeller(data.id);
  if (rateBtn)   rateBtn.onclick   = () => toggleSellerReviews();
  if (reportBtn) reportBtn.onclick = () => reportSeller(data.id);
}

// === 事件處理：依你的實作調整 ===
async function openChatWithSeller(targetSellerId) {
  if (!targetSellerId) {
    return Swal.fire({ icon: 'warning', title: '缺少sellerid' });
  }

  // 手機版：導向 person.html 並帶入目標 ID，由 person.js 自動開啟聊天
  if (window.innerWidth <= 991) {
    window.location.href = `../person/person.html`;
    return;
  }

  openCloseChatInterface();
  chatService = new ChatBackendService();

  try {
    chatInnerWin.openChatWithTarget(targetSellerId);
  } catch (err) {
    console.error(err);
    Swal.fire({ icon: 'error', title: '無法建立聊天室' });
  }
}

function toggleSellerReviews() {
  const reviewContainer = document.getElementById('sellerReviews');

  if (reviewContainer.classList.contains('d-none')) {
    // 顯示邏輯
    reviewContainer.classList.remove('d-none');
    
    // 強制瀏覽器重繪 (Reflow)，確保動畫能觸發
    void reviewContainer.offsetWidth; 
    
    reviewContainer.classList.add('show');
  } else {
    // 隱藏邏輯
    reviewContainer.classList.remove('show');

    // 等動畫結束 (300ms) 再加上 d-none 節省效能
    setTimeout(() => {
      reviewContainer.classList.add('d-none');
    }, 300);
  }
}

async function reportSeller(sellerId) {
  if (!sellerId) return;

  const res = await Swal.fire({
    title: '檢舉賣家',
    input: 'textarea',
    inputPlaceholder: '請描述檢舉原因',
    showCancelButton: true,
  });

  if (!res.isConfirmed) return;

  try {
    await backendService.reportSeller(sellerId, { reason: res.value });
    Swal.fire('已送出', '', 'success');
  } catch (e) {
    Swal.fire('送出失敗', '', 'error');
  }
}

async function onAddToCart(e) {
  const btn = e.target.closest('.shopcart');

  // 防呆：service 是否就緒 & 方法存在
  if (!backendService || typeof backendService.addItemsToCart !== 'function') {
    console.error('backendService 尚未就緒或不存在 addItemsToCart：', backendService);
    Swal.fire({ icon: 'error', title: '系統尚未就緒', text: '請重新整理後再試' });
    return;
  }

  // 取商品 id（優先 data-id，退而求其次用 URL ?id）
  const id = btn.dataset.id || new URLSearchParams(location.search).get('id');
  if (!id) {
    Swal.fire({ icon: 'warning', title: '找不到商品編號' });
    return;
  }

  // 取數量：找同區塊的 .qty-input，找不到就用 1
  const qtyEl = btn.closest('.card, .product, body').querySelector?.('.qty-input');
  const quantity = Number(qtyEl ? qtyEl.value : 1) || 1;

  btn.disabled = true;
  try {
    await backendService.addItemsToCart(id, quantity);
    await Swal.fire({
      title: '已加入購物車！',
      icon: 'success', 
      showConfirmButton: false,
      timer: 1600,
    });
  } catch (err) {
    const msg = err?.response?.data?.message || err?.message || '請稍後再試';
    if (String(msg).toLowerCase().includes('stock')) {
      Swal.fire({ icon: 'warning', title: '庫存不足，您在購物車已有這個商品', text: msg });
    } else if (String(msg).toLowerCase().includes('No JWT token provided')) {
      Swal.fire({ icon: 'warning', title: '請先登入才可將商品加入購物車', text: msg });
    } else {
      Swal.fire({ icon: 'error', title: '加入失敗', text: msg });
    }
  } finally {
    btn.disabled = false;
  }
}
async function showSellerCommodities(id) {
  const container = document.getElementById('otherProducts');
  if (!container) return;

  // Skeleton while loading
  container.innerHTML = sellerProductSkeletonHTML();
  document.getElementById('sellerPager').style.display = 'none';

  try {
    const response = await backendService.getUserCommodities(id);
    const products = response?.data?.data.commodities ?? [];
    if (!Array.isArray(products) || products.length === 0) {
      container.closest('.sellerCommodities').style.display = 'none';
      return;
    }

    _sellerAllProducts = products;
    _sellerCurrentPage = 1;
    _renderSellerPage(1);

    // Wire pagination buttons
    const prevBtn = document.getElementById('prevSellerBtn');
    const nextBtn = document.getElementById('nextSellerBtn');
    prevBtn?.addEventListener('click', () => {
      if (_sellerCurrentPage > 1) { _sellerCurrentPage--; _renderSellerPage(_sellerCurrentPage); }
    });
    nextBtn?.addEventListener('click', () => {
      const total = Math.ceil(_sellerAllProducts.length / SELLER_PER_PAGE);
      if (_sellerCurrentPage < total) { _sellerCurrentPage++; _renderSellerPage(_sellerCurrentPage); }
    });

    // Touch swipe (mobile)
    let touchStartX = 0;
    container.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    container.addEventListener('touchend', e => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      const total = Math.ceil(_sellerAllProducts.length / SELLER_PER_PAGE);
      if (diff > 40 && _sellerCurrentPage < total) { _sellerCurrentPage++; _renderSellerPage(_sellerCurrentPage); }
      else if (diff < -40 && _sellerCurrentPage > 1) { _sellerCurrentPage--; _renderSellerPage(_sellerCurrentPage); }
    }, { passive: true });

  } catch (err) {
    console.error('取得賣家商品失敗：', err);
    const wrap = container.closest('.sellerCommodities');
    if (wrap) wrap.style.display = 'none';
  }
}
document.addEventListener('click', async (e) => {
  // 判斷點擊的是否為 .order 按鈕
  const btn = e.target.closest('.order');
  if (!btn) return;
  if (btn.dataset.ownProduct) return;

  e.preventDefault();

  if (!(await requireLogin())) return;

  orderNow(e);
});
async function orderNow(e) {
  const btn = e.target.closest('.order');; // 取得被點擊的按鈕

  // 1. 防呆：backendService 是否存在
  if (!backendService || typeof backendService.addItemsToCart !== 'function') {
    Swal.fire({ icon: 'error', title: '系統尚未就緒', text: '請重新整理後再試' });
    return;
  }

  // 2. 取得商品 ID (優先從 data-id 拿，沒有則從變數 itemId 或 URL 拿)
  // 註：如果你在 HTML 寫 <button class="order-now" data-id="123"> 這裡就抓得到
  const id = btn.dataset.id || new URLSearchParams(location.search).get('id');
  
  if (!id) {
    Swal.fire({ icon: 'warning', title: '找不到商品編號' });
    return;
  }

  // 3. 取得數量
  const qtyInput = document.getElementById('qty');
  const quantity = Math.max(1, Number(qtyInput?.value) || 1);

  // --- 開始執行 ---
  btn.disabled = true; // 禁用按鈕防止重複送出

  try {
    // 4. 發送請求
    const response = await backendService.addItemsToCart(id, quantity);
    
    // 5. 判斷是否成功 (相容 Axios 或 Fetch 的回傳結構)
    // 通常 API 回傳 200 或 201 代表成功
    if (response.status === 200 || response.status === 201 || response.ok) {
      
      // 成功後存儲狀態並跳轉
      localStorage.setItem("selectedCartItem", id);
      console.log('下單成功，商品 ID 已存儲到 localStorage:', id);
      window.location.href = "../shoppingcart/shoppingcart.html";
      
    } else {
      // 伺服器邏輯錯誤 (例如庫存不足)
      throw response; // 丟出 response 進入 catch 統一處理
    }

  } catch (err) {
    // 6. 統一錯誤處理 (邏輯與 onAddToCart 相同)
    console.error('Order Error:', err);
    const msg = err?.response?.data?.message || err?.data?.message || err?.message || '請稍後再試';
    
    if (String(msg).toLowerCase().includes('stock')) {
      Swal.fire({ icon: 'warning', title: '庫存不足', text: msg });
    } else if (String(msg).toLowerCase().includes('jwt')) {
      Swal.fire({ icon: 'warning', title: '請先登入', text: '登入後即可進行購買' });
    } else {
      Swal.fire({ icon: 'error', title: '下單失敗', text: msg });
    }
  } finally {
    // 無論成功或失敗，都要把按鈕恢復 (雖然成功會跳頁，但為了保險起見)
    btn.disabled = false;
  }
}
// 聊天室介面顯示與隱藏
const chatopen = document.getElementById('chaticon');
const chatclose = document.getElementById('closechat');
const talkInterface = document.getElementById('talkInterface');
chatopen.addEventListener('click', function(e){
    toggleChatInterface();
})

// product.js 修正後的 openCloseChatInterface 函式
async function openCloseChatInterface() {
  if(await canEnterChat()) {
    if (talkInterface.style.display === 'none' || talkInterface.style.display === '') {
        talkInterface.style.display = 'block'; 
    }
  } else {
    talkInterface.style.display = 'none';
  }
}

// TODO 顯示評價
function renderStars(score) {
  return '★'.repeat(score) + '☆'.repeat(5 - score);
}
const scoreStar = document.querySelector('.score');
scoreStar.textContent = renderStars(Number(scoreStar.textContent));
/**
 * 檢查登入者是否為賣家本人，若是則禁用相關按鈕
 */
async function checkIsOwnProduct(sellerId) {
    if (!backendService) return;
    try {
        const res = await backendService.whoami();
        const currentUserId = res?.data?.uid;
        if (currentUserId && String(currentUserId) === String(sellerId)) {
            disableActionButtons();
        }
    } catch (_) {
        // 未登入，無需禁用按鈕
    }
}

/**
 * 禁用按鈕的具體實作
 */
function disableActionButtons() {
    // 定義所有需要禁用的按鈕選擇器
    const buttonsToDisable = [
        '.order',          // 馬上下單 (含手機版)
        '.shopcart',       // 加入購物車 (含手機版)
        '#sellerChat',     // 與賣家聊聊
        '#sellerBad'       // 檢舉賣家
    ];

    buttonsToDisable.forEach(selector => {
    document.querySelectorAll(selector).forEach(btn => {
        // 1. 視覺與功能禁用
        // 注意：如果設了 disabled = true，某些瀏覽器會抓不到 click 事件
        // 所以我們改用 CSS 的 pointer-events 來控制，或者保留 disabled 但用父層捕捉
        btn.dataset.ownProduct = '1';
        btn.style.opacity = '0.7';
        btn.style.cursor = 'not-allowed';
        btn.title = '您不能購買或檢舉自己的商品';

        // 2. 統一攔截點擊事件
        btn.onclick = (e) => {
            e.preventDefault();
            e.stopImmediatePropagation(); // 防止觸發其他綁定的事件

            return Swal.fire({
                icon: 'info',
                title: '這是您的商品或資料',
                text: '您無法對自己的商品與資料執行此操作'
            });
        };
        
        // 如果原本 HTML 有 disabled 屬性，建議移除或改用 pointer-events: none 的邏輯
        // 這樣 onclick 才能被觸發
    });
  });
}