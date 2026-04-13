import BackendService from '../BackendService.js';
import '../default/default.js';

// ── Image skeleton: fade-in when photo loads ──
document.addEventListener('load', e => {
  const img = e.target;
  if (img.tagName !== 'IMG') return;
  const thumb = img.closest('.product-card .product-thumb');
  if (thumb) thumb.classList.add('img-loaded');
}, true);

// ── Skeleton helper ──
function commoditySkeletonHTML(n = 12) {
  return Array.from({length: n}, () => `
    <div class="col">
      <div class="product-card h-100">
        <div class="product-thumb skeleton" style="border-radius:8px 8px 0 0;"></div>
        <div class="card-body d-flex flex-column">
          <div class="skeleton skeleton-text" style="width:80%;"></div>
          <div class="skeleton skeleton-text" style="width:55%;"></div>
          <div class="mt-auto d-flex justify-content-between align-items-center" style="margin-top:10px;">
            <div class="skeleton skeleton-text" style="width:38%;margin:0;"></div>
            <div class="d-flex align-items-center gap-1">
              <div class="skeleton" style="width:16px;height:16px;border-radius:50%;flex-shrink:0;"></div>
              <div class="skeleton skeleton-text" style="width:36px;margin:0;"></div>
            </div>
          </div>
        </div>
      </div>
    </div>`).join('');
}

// ====== 設定 ======
const PAGE_SIZE = 18;
let currentCategory = 'all';
let pageIndex = 0;
let isLoading = false;
let activeKeyword = '';  // 只在搜尋表單提交時更新，sort/filter 不觸發搜尋 API

// DOM 元素
const productRow = document.getElementById('productRow');
const sortItems = document.querySelectorAll('.sort_item');
const paginationEl = document.getElementById('pagination');


// 中文分類名稱 → API key 對照表（HTML data-category 與 URL param 均可能為中文）
const catMap = {
  "書籍與學籍用品": "book",
  "宿舍與生活用品": "life",
  "學生專用器材": "special",
  "環保生活用品": "reuse",
  "儲物與收納用品": "storage",
  "其他": "other"
};

// ====== 初始化分類按鈕事件 ======
sortItems.forEach(el => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    sortItems.forEach(x => x.classList.remove('active'));
    el.classList.add('active');
    const rawCat = el.dataset.category || el.textContent.trim();
    changeCategory(catMap[rawCat] ?? rawCat);
  });
});


// 切換大分類
function changeCategory(category) {
  currentCategory = category;
  // 切換分類時清除搜尋關鍵字，避免搜尋結果污染分類瀏覽
  activeKeyword = '';
  const si = document.getElementById('searchInput');
  if (si) si.value = '';
  const mt = document.getElementById('searchTriggerMobile');
  if (mt) mt.value = '';
  pageIndex = 0;
  productRow.innerHTML = '';
  loadProducts();
}

//TODO 載入商品（分頁，含前端篩選與 totalCount 更新）
// async function loadProducts() {
//   if (isLoading) return;
//   isLoading = true;
// 

//   try {
//     let items = [];
//     const backendService = new BackendService();
//     const pagingInfo = { page: pageIndex + 1, limit: PAGE_SIZE };
//     if (currentCategory === 'hot') {
//         backendService.getHotItems(pagingInfo, (response => {
//             console.log("call getHotItems()", response.data);
//             items = response?.data?.commodities || [];
//             finishRender(items);
//         }), (errorMessage => {
//           console.log(errorMessage);
//         }))
//     } else if (currentCategory === 'new') {
//         backendService.getNewItems(pagingInfo, (response => {
//             console.log("call getHotItems()", response.data);
//             items = response?.data?.commodities || [];
//             finishRender(items);
//         }), (errorMessage => {
//           console.log(errorMessage);
//         }))
//     } else {
//         // 其他分類都撈全部，然後前端再篩選
//         const response = await backendService.getAllCommodities(pagingInfo);
//         // API 回傳的商品
//         items = response.data?.commodities || [];
//     }
    
    

//     // === 前端分類篩選 ===
//     const categoryMap = {
//       book: '書籍與學籍用品',
//       life: '宿舍與生活用品',
//       student: '學生專用器材',
//       recycle: '環保生活用品',
//       clean: '儲物與收納用品',
//       other: '其他',
//     };

//     let filteredItems = items;

//     // 篩選大分類
//     if (currentCategory !== ('all' || 'hot' || 'new')) {
//       filteredItems = filteredItems.filter(p => categoryMap[p.category] === currentCategory);
//     }

//     // 篩選子分類（假設商品物件有 subCategory 欄位）
//     if (currentSub) {
//       filteredItems = filteredItems.filter(p => p.subCategory === currentSub);
//     }

//     filteredItems = applyFilters(filteredItems);
//     // 重新計算分頁數量
//     const totalCount = filteredItems.length;

//     // 依 pageIndex 切出這一頁要顯示的商品
//     const start = pageIndex * PAGE_SIZE;
//     const pagedItems = filteredItems.slice(start, start + PAGE_SIZE);

//     // 清空後重新 render
//     productRow.innerHTML = '';
//     renderProductsBootstrap(pagedItems);
//     renderPagination(totalCount);

// 
//   } catch (err) {
//     console.error('API 載入失敗', err);
// 
//   } finally {
//     isLoading = false;
//   }
// }
async function loadProducts() {
  if (isLoading) return;
  isLoading = true;
  productRow.innerHTML = commoditySkeletonHTML(PAGE_SIZE);


  try {
    const backendService = new BackendService();
    const sortselected = sortSelect ? sortSelect.value : 'default';
    const keyword = activeKeyword;
    const maxPrice = maxPriceInput?.value ? parseInt(maxPriceInput.value) : null;
    const newOrOld = newOrOldInput?.value !== 'default' ? parseInt(newOrOldInput?.value) : null;
    const validCategories = ['book', 'life', 'special', 'reuse', 'storage', 'other'];

    let items = [];
    let totalCount = 0;

    if (keyword) {
      // 有關鍵字 → 走搜尋 API（支援 keyword、category、maxPrice）
      const searchParams = { page: pageIndex + 1, limit: PAGE_SIZE };
      searchParams.keyword = keyword;
      if (maxPrice) searchParams.maxPrice = maxPrice;
      if (validCategories.includes(currentCategory)) searchParams.category = currentCategory;
      const response = await backendService.searchCommodities(searchParams);
      items = response?.data?.commodities || [];
      totalCount = response?.data?.pagination?.totalItems ?? items.length;

    } else {
      // 無關鍵字 → 統一使用 /api/commodity/list/{listName}
      // 決定 listName：'new' tab 用 all+sort=new，'hot' 用 hot，分類用該分類，其餘 all
      const listName = currentCategory === 'new' ? 'all'
                     : currentCategory === 'hot' ? 'hot'
                     : validCategories.includes(currentCategory) ? currentCategory
                     : 'all';

      // 決定 sort：'new' tab 強制 new；否則依下拉選單
      const sort = currentCategory === 'new' ? 'new'
                 : sortselected === 'priceAsc'  ? 'price-low'
                 : sortselected === 'priceDesc' ? 'price-high'
                 : 'default';

      const response = await backendService.getCommodityList(listName, {
        page: pageIndex + 1,
        limit: PAGE_SIZE,
        sort,
        maxPrice,
      });
      items = response?.data?.commodities || [];
      totalCount = response?.data?.pagination?.totalItems ?? items.length;
    }

    // 新舊程度：前端篩選（API 不支援）
    if (newOrOld !== null) {
      items = items.filter(p => p.newOrOld <= newOrOld);
    }

    const mobileCountEl = document.getElementById('mobileResultCount');
    if (mobileCountEl) mobileCountEl.textContent = `共 ${totalCount} 件`;

    productRow.innerHTML = '';
    renderProductsBootstrap(items);
    renderPagination(totalCount);


  } catch (err) {
    console.error('API 載入失敗', err);

  } finally {
    isLoading = false;
  }
}

function finishRender(items) {
    // 篩選、分頁
    const totalCount = items.length;
    const start = pageIndex * PAGE_SIZE;
    const pagedItems = items.slice(start, start + PAGE_SIZE);

    productRow.innerHTML = '';
    renderProductsBootstrap(pagedItems);
    renderPagination(totalCount);


    isLoading = false;
}

// 使用 bootstrap row / col 來 render 商品
function renderProductsBootstrap(items) {
  const frag = document.createDocumentFragment();
  const noProducts = document.getElementById('no-products');


    if (!items || items.length === 0) {
        // 沒商品 → 顯示提示
        noProducts.style.display = 'block';
        return;
    }

    // 有商品 → 隱藏無商品提示
    noProducts.style.display = 'none';

  const categoryMap = {
    book: '書籍', life: '生活', special: '器材',
    other: '其他', reuse: '環保', storage: '收納',
  };
  const newOrOldMap = {
    1:'全新', 2:'幾乎全新', 3:'半新', 4:'適中', 5:'稍舊', 6:'全舊',
  };

  items.forEach(p => {
    const col = document.createElement('div');
    col.className = 'col';
    const category = categoryMap[p.category] ?? '其他';
    const newOrOld = newOrOldMap[p.newOrOld] ?? '';
    const imgUrl   = p.mainImage || '';
    col.innerHTML = `
      <div class="product-card position-relative h-100" data-id="${escapeHtml(p.id)}">
        <div class="product-thumb">
          ${imgUrl
            ? `<img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(p.name)}" loading="lazy">`
            : `<div class="product-thumb-placeholder">${escapeHtml(p.name.slice(0,6))}</div>`}
        </div>
        <div class="card-body d-flex flex-column">
          <h5 class="card-title ellipsis-text" style="font-size:13px;">${escapeHtml(p.name)}</h5>
          <p class="card-text mb-2 ellipsis-text d-flex gap-1" style="font-size:11px;">
            <span># ${escapeHtml(category)}</span>
            ${newOrOld ? `<span># ${escapeHtml(newOrOld)}</span>` : ''}
          </p>
          <div class="mt-auto d-flex justify-content-between align-items-center">
            <span class="fw-bold price" style="font-size:13px;">NT$ ${escapeHtml(String(p.price))}</span>
            <div class="card-seller">
              <img class="seller-avatar" src="${escapeHtml(p.owner?.photoURL || '../webP/default-avatar.webp')}" alt="${escapeHtml(p.owner?.name || '賣家')}" onerror="this.src='../webP/default-avatar.webp'">
              <span class="seller-name">${escapeHtml(p.owner?.name || '賣家')}</span>
            </div>
          </div>
        </div>
      </div>
    `;
    col.querySelector('.product-card').addEventListener('click', () => {
      location.href = `../product/product.html?id=${encodeURIComponent(p.id)}`;
    });

    // 已 cache 的圖片不會觸發 load event，需主動補上 img-loaded
    const img = col.querySelector('.product-thumb img');
    if (img) {
      if (img.complete && img.naturalWidth > 0) {
        img.closest('.product-thumb').classList.add('img-loaded');
      } else {
        img.addEventListener('load', () => {
          img.closest('.product-thumb').classList.add('img-loaded');
        }, { once: true });
      }
    }

    frag.appendChild(col);
  });
  productRow.appendChild(frag);

}

// escape HTML
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// 分頁按鈕
function renderPagination(totalCount) {
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  paginationEl.innerHTML = '';

  // 上一頁
  const prevBtn = document.createElement('button');
  prevBtn.textContent = '‹ 上一頁';
  prevBtn.className = 'pager-nav-btn' + (pageIndex === 0 ? ' disabled' : '');
  prevBtn.disabled = pageIndex === 0;
  prevBtn.addEventListener('click', () => {
    if (pageIndex > 0) {
      pageIndex--;
      loadProducts();
    }
  });
  paginationEl.appendChild(prevBtn);

  // 頁數按鈕
  for (let i = 0; i < totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i + 1;
    btn.className = 'pager-nav-btn' + (i === pageIndex ? ' pager-nav-btn--active' : '');
    btn.addEventListener('click', () => {
      if (i !== pageIndex) {
        pageIndex = i;
        loadProducts();
      }
    });
    paginationEl.appendChild(btn);
  }

  // 下一頁
  const nextBtn = document.createElement('button');
  nextBtn.textContent = '下一頁 ›';
  nextBtn.className = 'pager-nav-btn' + (pageIndex === totalPages - 1 ? ' disabled' : '');
  nextBtn.disabled = pageIndex === totalPages - 1;
  nextBtn.addEventListener('click', () => {
    if (pageIndex < totalPages - 1) {
      pageIndex++;
      loadProducts();
    }
  });
  paginationEl.appendChild(nextBtn);
}

// 初始載入（修改後的版本）
document.addEventListener('DOMContentLoaded', () => {
  // 設定聊天室 iframe src（桌機版）
  const iframe = document.getElementById('talkInterface');
  if (iframe) iframe.src = '../chatroom/chatroom.html';
  // 搜尋表單提交（桌機 Enter / 手機 offcanvas）
  document.getElementById('searchForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    activeKeyword = document.getElementById('searchInput')?.value.trim() || '';
    pageIndex = 0;
    productRow.innerHTML = '';
    loadProducts();
  });

  // 當搜尋欄清空時自動重新載入（不需要按 Enter）
  document.getElementById('searchInput')?.addEventListener('input', (e) => {
    if (e.target.value.trim() === '' && activeKeyword !== '') {
      activeKeyword = '';
      pageIndex = 0;
      productRow.innerHTML = '';
      loadProducts();
    }
  });
  document.getElementById('searchTriggerMobile')?.addEventListener('input', (e) => {
    if (e.target.value.trim() === '' && activeKeyword !== '') {
      activeKeyword = '';
      pageIndex = 0;
      productRow.innerHTML = '';
      loadProducts();
    }
  });

  // 取得 URL 參數
  const urlParams = new URLSearchParams(window.location.search);
  const categoryFromUrl = urlParams.get('category');
  const qFromUrl = urlParams.get('q');

  let initialCategory = 'all';

  // 如果 URL 有帶 category 參數，就用它的值作為初始分類（支援中文或英文 key）
  if (categoryFromUrl) {
    initialCategory = catMap[categoryFromUrl] ?? categoryFromUrl;
  }

  // 移除所有按鈕的 active 樣式
  sortItems.forEach(x => x.classList.remove('active'));

  // 找到對應的按鈕並加上 active 樣式（data-category 可能為中文或英文 key）
  const activeBtn = Array.from(sortItems).find(el => {
    const raw = el.dataset.category || '';
    return raw === initialCategory || (catMap[raw] ?? raw) === initialCategory;
  });
  if (activeBtn) activeBtn.classList.add('active');

  // 若從 shop.html 帶入搜尋關鍵字，預填搜尋欄並直接 loadProducts（跳過 changeCategory 以免清除 keyword）
  if (qFromUrl) {
    activeKeyword = qFromUrl;
    currentCategory = initialCategory;
    pageIndex = 0;
    const si = document.getElementById('searchInput');
    if (si) { si.value = qFromUrl; si.dispatchEvent(new Event('input')); }
    const mt = document.getElementById('searchTriggerMobile');
    if (mt) { mt.value = qFromUrl; mt.dispatchEvent(new Event('input')); }
    loadProducts();
  } else {
    changeCategory(initialCategory);
  }
});

// 僅保留不支援伺服器端篩選的條件（新舊程度），其餘由 loadProducts 的 API 呼叫處理
function applyFilters(items) {
  const newOrOld = newOrOldInput?.value !== 'default' ? parseInt(newOrOldInput?.value) : null;
  let result = items;
  if (newOrOld !== null) {
    result = result.filter(p => p.newOrOld <= newOrOld);
  }
  return result;
}

function clearFilters() {
    activeKeyword = '';
    const si = document.getElementById('searchInput');
    if (si) si.value = '';
    maxPriceInput.value = '';
    newOrOldInput.value = 'default';
    sortSelect.value = 'default';
    pageIndex = 0;
    productRow.innerHTML = '';
    loadProducts();
}

const sortSelect = document.getElementById('sortSelect');
const maxPriceInput = document.getElementById('maxPriceInput');
const newOrOldInput = document.getElementById('new_or_oldInput');

function triggerFilter() {
  pageIndex = 0;
  productRow.innerHTML = '';
  loadProducts();
}

sortSelect.addEventListener('change', triggerFilter);
newOrOldInput.addEventListener('change', triggerFilter);

let priceDebounce;
maxPriceInput.addEventListener('input', () => {
  clearTimeout(priceDebounce);
  priceDebounce = setTimeout(triggerFilter, 500);
});

const cleanFilterBtn = document.getElementById('cleanFilter');
cleanFilterBtn.addEventListener('click', (e) => {
    e.preventDefault();
    clearFilters();
});

// ── 手機版格狀/列表切換 ──
const layoutGridBtn = document.getElementById('layoutGrid');
const layoutListBtn = document.getElementById('layoutList');
if (layoutGridBtn && layoutListBtn) {
  layoutGridBtn.addEventListener('click', () => {
    productRow.classList.remove('list-view');
    layoutGridBtn.classList.add('active');
    layoutListBtn.classList.remove('active');
  });
  layoutListBtn.addEventListener('click', () => {
    productRow.classList.add('list-view');
    layoutListBtn.classList.add('active');
    layoutGridBtn.classList.remove('active');
  });
}
