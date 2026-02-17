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
  loaderEl.textContent = '載入中...';
  let currentSource = 'all';     // all | hot | new（資料來源）
let currentCategory = 'all';   // 書籍 / 生活用品…

  try {
    let items = [];
    const backendService = new BackendService();
    const pagingInfo = { page: pageIndex + 1, limit: PAGE_SIZE };

    // === 1️⃣ 依「來源」決定要撈哪支 API ===
    if (currentSource === 'hot') {
      const response = await backendService.getHotItems(pagingInfo);
      items = response?.data?.commodities || [];

    } else if (currentSource === 'new') {
      const response = await backendService.getNewItems(pagingInfo);
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

  items.forEach(p => {
    const col = document.createElement('div');
    col.className = 'col-6 col-md-4 col-lg-2';
    const categoryMap = {
        book: '書籍與學籍用品',
        life: '宿舍與生活用品',
        student: '學生專用器材',
        other: '其他',
        recycle: '環保生活用品',
        clean: '儲物與收納用品',
    };
    const newOrOldMap = {
      1:'全新',2:'幾乎全新',3:'半新',4:'適中',5:'稍舊',6:'全舊',
    };
    const newOrOld =  (p.newOrOld <= 6 && p.newOrOld >= 6) ? newOrOldMap[p.newOrOld] : '無法評估';
    col.innerHTML = `
      <div class="card h-100" style="cursor:pointer;" onclick="window.location.href='../product/product.html?id=${escapeHtml(p.id)}'">
        ${p.mainImage ? `<img src="${escapeHtml(p.mainImage)}" class="card-img-top product-card-img" alt="${escapeHtml(p.name)}">` :
        `<div class="product-card-img d-flex align-items-center justify-content-center text-secondary">${escapeHtml(p.name.slice(0,6))}</div>`}
        <div class="card-body d-flex flex-column">
          <h6 class="card-title" style="font-size:14px;">${escapeHtml(p.name)}</h6>
          <p class="mb-2 text-muted" style="font-size:13px;"># ${escapeHtml(newOrOld)}</p>
          <div class="mt-auto d-flex justify-content-between align-items-center">
            <div class="fw-bold text-danger">NT$${escapeHtml(p.price)}</div>
          </div>
        </div>
      </div>
    `;
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
  const sortselected = sortSelect.value;
  let result = items;


  if (maxPrice !== null) {
    result = result.filter(p => p.price <= maxPrice);
  }

  // 新舊程度篩選（假設 p.newOrOld 是 1~6 的數字）
  if (newOrOld !== null) {
    result = result.filter(p => p.newOrOld <= newOrOld);
  }
  if (sortselected === 'priceAsc') {
    result.sort((a, b) => a.price - b.price);
  } else if (sortselected === 'priceDesc') {
    result.sort((a, b) => b.price - a.price);
  }
  const filterResultCountEl = document.getElementById('filterResultCount');
  resultlength = result.length;
  if(!resultlength || resultlength === 0){
    resultlength = 0;
    productRow.innerHTML = '';
    const noProducts = document.getElementById('no-products');
    noProducts.style.display = 'block';
  }
  filterResultCountEl.textContent = `${resultlength === 0 ? 0 : resultlength}`;
  console.log('篩選後的商品:', result);
  return result;
}
function clearFilters() {
    maxPriceInput.value = '';
    newOrOldInput.value = 'default';
    sortSelect.value = 'default';
    pageIndex = 0;
    productRow.innerHTML = '';
    document.getElementById('filterAll').textContent = '';
    loadProducts();
}
const cleanFilterBtn = document.getElementById('cleanFilter');
cleanFilterBtn.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('點擊清除篩選按鈕');
    clearFilters();
});
const sortSelect = document.getElementById('sortSelect');
const maxPriceInput = document.getElementById('maxPriceInput');

const newOrOldInput = document.getElementById('new_or_oldInput');
const filterBtn = document.getElementById('filterBtn');
filterBtn.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('點擊篩選按鈕');
    const maxPrice = maxPriceInput.value ? parseInt(maxPriceInput.value) : null;
    const newOrOld = newOrOldInput.value !== 'default' ? newOrOldInput.value : null;
    let newOrOldMap = {
      1:'僅限全新',2:'稍新以上',3:'半新以上',4:'適中以上',5:'稍舊以上',6:'全舊以上',
    };
    console.log('篩選條件:', { maxPrice, newOrOld: newOrOld ? newOrOldMap[newOrOld] : null });
    // 在這裡可以根據篩選條件進行商品篩選
    const filterAllEl = document.getElementById('filterAll');
    let filterText = '';
    if (sortSelect.value == 'priceDesc') {
        filterText +=  `價格由高到低排序`;
        filterText +=  `\n`;
    } else if (sortSelect.value == 'priceAsc') {
        filterText +=  `價格由低到高排序`;
        filterText +=  `\n`;
    } else {
        filterText +=  ``;
    }
    if (maxPrice !== null){
      filterText += `最高接受價格: ${maxPrice} 元`;
      filterText +=  `\n`;
    } else filterText += ``; 
    if (newOrOld !== null) {
      filterText += `最低可接受之商品狀態: ${newOrOldMap[newOrOld]}`;
      filterText +=  `\n`;
    }
    else filterText += ``;
    if(filterText === '') filterText = '無篩選條件\n';
    filterAllEl.textContent = filterText;

    
    // 假設這裡有一個函式可以根據篩選條件取得符合的商品數量
    // 這裡暫時用一個假設的數字來示範

    // 例如，重新載入商品並應用篩選條件
    pageIndex = 0;
    productRow.innerHTML = '';
    loadProducts();
});