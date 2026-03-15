import BackendService from '../BackendService.js';
import '../default/default.js';

// ── Skeleton helper ──
function commoditySkeletonHTML(n = 12) {
  return Array.from({length: n}, () => `
    <div class="col">
      <div class="product-card h-100">
        <div class="skeleton" style="aspect-ratio:1/1;border-radius:8px 8px 0 0;"></div>
        <div class="card-body">
          <div class="skeleton skeleton-text" style="width:85%;"></div>
          <div class="skeleton skeleton-text" style="width:50%;"></div>
          <div class="skeleton skeleton-text" style="width:40%;margin-top:8px;"></div>
        </div>
      </div>
    </div>`).join('');
}

// ====== 設定 ======
const PAGE_SIZE = 18;
let currentCategory = 'all';
let pageIndex = 0;
let isLoading = false;

// DOM 元素
const productRow = document.getElementById('productRow');
const loaderEl = document.getElementById('loader');
const sortItems = document.querySelectorAll('.sort_item');
const paginationEl = document.getElementById('pagination');


// ====== 初始化分類按鈕事件 ======
sortItems.forEach(el => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    sortItems.forEach(x => x.classList.remove('active'));
    el.classList.add('active');
    const cat = el.dataset.category || el.textContent.trim();
    changeCategory(cat);
  });
});


// 切換大分類
function changeCategory(category) {
  currentCategory = category;
  pageIndex = 0;
  productRow.innerHTML = '';
  loadProducts();
}

//TODO 載入商品（分頁，含前端篩選與 totalCount 更新）
// async function loadProducts() {
//   if (isLoading) return;
//   isLoading = true;
//   loaderEl.textContent = '載入中...';

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

//     loaderEl.textContent = '';
//   } catch (err) {
//     console.error('API 載入失敗', err);
//     loaderEl.textContent = '載入失敗，請稍後重試';
//   } finally {
//     isLoading = false;
//   }
// }
async function loadProducts() {
  if (isLoading) return;
  isLoading = true;
  productRow.innerHTML = commoditySkeletonHTML();
  loaderEl.textContent = '載入中...';
  let currentSource = 'all';     // all | hot | new（資料來源）
let currentCategory = 'all';   // 書籍 / 生活用品…

  try {
    let items = [];
    const backendService = new BackendService();
    const pagingInfo = { page: pageIndex + 1, limit: PAGE_SIZE };

    // === 1️⃣ 依「來源」及排序決定要撈哪支 API ===
    const sortselected = sortSelect ? sortSelect.value : 'default';
    if (currentSource === 'hot') {
      const response = await backendService.getHotItems(pagingInfo);
      items = response?.data?.commodities || [];

    } else if (currentSource === 'new') {
      const response = await backendService.getNewItems(pagingInfo);
      items = response?.data?.commodities || [];

    } else if (sortselected === 'priceAsc') {
      const response = await backendService.getPriceLowItems(pagingInfo);
      items = response?.data?.commodities || [];

    } else if (sortselected === 'priceDesc') {
      const response = await backendService.getPriceHighItems(pagingInfo);
      items = response?.data?.commodities || [];

    } else {
      // all
      const response = await backendService.getAllCommodities(pagingInfo);
      items = response?.data?.commodities || [];
    }

    // === 2️⃣ 前端分類 / 篩選 ===
    const categoryMap = {
      book: '書籍與學籍用品',
      life: '宿舍與生活用品',
      student: '學生專用器材',
      recycle: '環保生活用品',
      clean: '儲物與收納用品',
      other: '其他',
    };

    let filteredItems = items;

    // 👉 大分類（不是 all 才篩）
    if (currentCategory && currentCategory !== 'all') {
      filteredItems = filteredItems.filter(
        p => categoryMap[p.category] === currentCategory
      );
    }

    // 👉 其他條件（價格、關鍵字…）
    filteredItems = applyFilters(filteredItems);

    // === 3️⃣ 分頁 ===
    const totalCount = filteredItems.length;
    const start = pageIndex * PAGE_SIZE;
    const pagedItems = filteredItems.slice(start, start + PAGE_SIZE);

    productRow.innerHTML = '';
    renderProductsBootstrap(pagedItems);
    renderPagination(totalCount);

    loaderEl.textContent = '';
  } catch (err) {
    console.error('API 載入失敗', err);
    loaderEl.textContent = '載入失敗，請稍後重試';
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

    loaderEl.textContent = '';
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
    book: '書籍', life: '生活', student: '器材',
    other: '其他', recycle: '環保', clean: '收納',
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
  prevBtn.textContent = '<';
  prevBtn.className = 'btn btn-sm mx-1 ' + (pageIndex === 0 ? 'btn-secondary disabled' : 'btn-outline-primary');
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
    btn.className = 'btn btn-sm mx-1 ' + (i === pageIndex ? 'btn-primary' : 'btn-outline-primary');
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
  nextBtn.textContent = '>';
  nextBtn.className = 'btn btn-sm mx-1 ' + (pageIndex === totalPages - 1 ? 'btn-secondary disabled' : 'btn-outline-primary');
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
  // 搜尋表單提交（桌機 Enter / 手機 offcanvas）
  document.getElementById('searchForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    pageIndex = 0;
    productRow.innerHTML = '';
    loadProducts();
  });

  // 取得 URL 參數
  const urlParams = new URLSearchParams(window.location.search);
  const categoryFromUrl = urlParams.get('category');
  
  let initialCategory = 'all';

  // 如果 URL 有帶 category 參數，就用它的值作為初始分類
  if (categoryFromUrl) {
    initialCategory = categoryFromUrl;
  }

  // 移除所有按鈕的 active 樣式
  sortItems.forEach(x => x.classList.remove('active'));

  // 找到對應的按鈕並加上 active 樣式
  const activeBtn = document.querySelector(`.sort_item[data-category="${initialCategory}"]`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  // 使用初始分類來載入商品
  changeCategory(initialCategory);
});

function applyFilters(items) {
  const maxPrice = maxPriceInput.value ? parseInt(maxPriceInput.value) : null;
  const newOrOld = newOrOldInput.value !== 'default' ? parseInt(newOrOldInput.value) : null;
  let result = items;

  // 關鍵字搜尋
  const searchInput = document.getElementById('searchInput');
  if (searchInput && searchInput.value.trim()) {
    const kw = searchInput.value.trim().toLowerCase();
    result = result.filter(p =>
      (p.name || p.title || '').toLowerCase().includes(kw) ||
      (p.description || '').toLowerCase().includes(kw)
    );
  }

  if (maxPrice !== null) {
    result = result.filter(p => p.price <= maxPrice);
  }

  if (newOrOld !== null) {
    result = result.filter(p => p.newOrOld <= newOrOld);
  }

  const mobileCountEl = document.getElementById('mobileResultCount');
  if (mobileCountEl) mobileCountEl.textContent = `共 ${result.length} 件`;

  return result;
}

function clearFilters() {
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
