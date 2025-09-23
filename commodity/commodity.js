// ====== 設定 ======
const PAGE_SIZE = 18;
let currentCategory = 'all';
let currentSub = null;
let pageIndex = 0;
let isLoading = false;

// DOM
const asideEl = document.getElementById('deepCategorySort');
const deepListEl = document.getElementById('deepCategoryList');
const productRow = document.getElementById('productRow');
const loaderEl = document.getElementById('loader');
const sortItems = document.querySelectorAll('.sort_item');
const clearSubBtn = document.getElementById('clearSubBtn');
const paginationEl = document.getElementById('pagination');

// 範例：每個大分類對應的小分類
const subcategories = {
  '書籍與學籍用品': ['學校專業用書','通識課本/語言學習書','非學校用書', '文具用品','筆記/習題集', '其他'],
  '宿舍與生活用品': ['廚房用具','寢具','電器用品','清潔用品','個人保養', '其他'],
  '學生專用器材': ['實驗器材','測量工具', '其他'],
  '環保生活用品': ['環保餐具','購物袋/手提袋', '其他'],
  '儲物與收納用品': ['收納箱','置物架', '其他'],
  '其他': ['周邊','腳踏車','其他']
};

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

// 清除子分類
if (clearSubBtn) {
  clearSubBtn.addEventListener('click', (e) => {
    e.preventDefault();
    currentSub = null;
    pageIndex = 0;
    productRow.innerHTML = '';
    document.querySelectorAll('.deep-sub').forEach(x => x.classList.remove('active'));
    loadProducts();
  });
}

// 切換大分類
function changeCategory(category) {
  currentCategory = category;
  currentSub = null;
  pageIndex = 0;
  productRow.innerHTML = '';
  toggleAside(category);
  loadProducts();
}

// 控制側欄顯示/填入子分類
function toggleAside(category) {
  if (category === 'all' || category == 'hot' || category == 'new') {
    asideEl.classList.add('d-none');
    // loadProducts();
  } else {
    asideEl.classList.remove('d-none');
    const items = subcategories[category] || [];
    deepListEl.innerHTML = items.map(s => `<li><a href="#" class="deep-sub" data-sub="${s}">${s}</a></li>`).join('');
    // 綁事件
    document.querySelectorAll('.deep-sub').forEach(a => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.deep-sub').forEach(x => x.classList.remove('active'));
            a.classList.add('active');

            const sub = a.dataset.sub;
            currentSub = sub;
            pageIndex = 0;
            productRow.innerHTML = '';
            loadProducts();
        });
    });
  }
}

// 載入商品（分頁，含前端篩選與 totalCount 更新）
async function loadProducts() {
  if (isLoading) return;
  isLoading = true;
  loaderEl.textContent = '載入中...';

  try {
    let items = [];
    const backendService = new BackendService();
    const pagingInfo = { page: pageIndex + 1, limit: PAGE_SIZE };
    if (currentCategory === 'hot') {
        const response = await backendService.getHotItems(pagingInfo);
        console.log("call getHotItems()", response.data);
        items = response.data?.data.commodities || [];
    } else if (currentCategory === 'new') {
        const response = await backendService.getNewItems(pagingInfo);
        console.log("call getNewItems()", response.data);
        items = response.data?.data.commodities || [];
    } else {
        // 其他分類都撈全部，然後前端再篩選
        const response = await backendService.getAllCommodities(pagingInfo);
        // API 回傳的商品
        items = response.data?.commodities || [];
    }
    
    

    // === 前端分類篩選 ===
    const categoryMap = {
      book: '書籍與學籍用品',
      life: '宿舍與生活用品',
      student: '學生專用器材',
      recycle: '環保生活用品',
      clean: '儲物與收納用品',
      other: '其他',
    };

    let filteredItems = items;

    // 篩選大分類
    if (currentCategory !== 'all') {
      filteredItems = filteredItems.filter(p => categoryMap[p.category] === currentCategory);
    }

    // 篩選子分類（假設商品物件有 subCategory 欄位）
    if (currentSub) {
      filteredItems = filteredItems.filter(p => p.subCategory === currentSub);
    }

    // 重新計算分頁數量
    const totalCount = filteredItems.length;

    // 依 pageIndex 切出這一頁要顯示的商品
    const start = pageIndex * PAGE_SIZE;
    const pagedItems = filteredItems.slice(start, start + PAGE_SIZE);

    // 清空後重新 render
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
    const category = categoryMap[p.category] ?? '其他';
    const newOrOld = newOrOldMap[p.newOrOld] ?? '';
    col.innerHTML = `
      <div class="card h-100" style="cursor:pointer;" onclick="window.location.href='../product/product.html?id=${escapeHtml(p.id)}'">
        ${p.mainImage ? `<img src="${escapeHtml(p.mainImage)}" class="card-img-top product-card-img" alt="${escapeHtml(p.name)}">` :
        `<div class="product-card-img d-flex align-items-center justify-content-center text-secondary">${escapeHtml(p.name.slice(0,6))}</div>`}
        <div class="card-body d-flex flex-column">
          <h6 class="card-title" style="font-size:14px;">${escapeHtml(p.name)}</h6>
          <p class="mb-2 text-muted" style="font-size:13px;"># ${escapeHtml(newOrOld)}</p>
          <div class="mt-auto d-flex justify-content-between align-items-center">
            <div class="fw-bold text-danger">NT$${escapeHtml(p.price)}</div>
            <button class="btn btn-sm btn-outline-primary add-cart" data-id="${p.id}">加入購物車</button>
          </div>
        </div>
      </div>
    `;
    frag.appendChild(col);
  });
  productRow.appendChild(frag);

  // 加購物車事件
  productRow.querySelectorAll('.add-cart').forEach(btn => {
    btn.addEventListener('click', async() => {
    const id = btn.dataset.id;
        try {
            await backendService.addItemsToCart(id, 1);
            Swal.fire({
            title: '已加入購物車！',
            icon: 'success', 
            showConfirmButton: false,
            timer: 1600,
            });
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || '請稍後再試';
            Swal.fire({ icon: 'error', title: '加入失敗', text: msg });
        } finally {
            btn.disabled = false;
        }
            });
        });
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