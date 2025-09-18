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
  if (category === 'all') {
    asideEl.classList.add('d-none');
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

// 載入商品（分頁）
async function loadProducts() {
  if (isLoading) return;
  isLoading = true;
  loaderEl.textContent = '載入中...';

  try {
    let items = [];
    let limit = PAGE_SIZE;
    const backendService = new BackendService();
    const pagingInfo = { page: pageIndex + 1, limit: limit};
    const response = await backendService.getAllCategories(pagingInfo);

    items = response.data?.commodities || [];
    const pg = response.data?.pagination || {};
    const totalCount = pg.total || items.length;

    productRow.innerHTML = '';
    renderProductsBootstrap(items);
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
  items.forEach(p => {
    const col = document.createElement('div');
    col.className = 'col-6 col-md-4 col-lg-3';
    col.innerHTML = `
      <div class="card h-100">
        ${p.img ? `<img src="${escapeHtml(p.mainImage)}" class="card-img-top product-card-img" alt="${escapeHtml(p.name)}">` :
        `<div class="product-card-img d-flex align-items-center justify-content-center text-secondary">${escapeHtml(p.name.slice(0,6))}</div>`}
        <div class="card-body d-flex flex-column">
          <h6 class="card-title" style="font-size:14px;">${escapeHtml(p.name)}</h6>
          <p class="mb-2 text-muted" style="font-size:13px;">類別：${escapeHtml(p.category)}</p>
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

  productRow.querySelectorAll('.add-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.dataset.id;
      alert('加入購物車：ID ' + id);
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
  prevBtn.textContent = '«';
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
  nextBtn.textContent = '»';
  nextBtn.className = 'btn btn-sm mx-1 ' + (pageIndex === totalPages - 1 ? 'btn-secondary disabled' : 'btn-outline-primary');
  nextBtn.addEventListener('click', () => {
    if (pageIndex < totalPages - 1) {
      pageIndex++;
      loadProducts();
    }
  });
  paginationEl.appendChild(nextBtn);
}

// 初始載入
document.addEventListener('DOMContentLoaded', () => {
  sortItems.forEach(x => x.classList.remove('active'));
  const allBtn = document.querySelector('.sort_item[data-category="all"]');
  if (allBtn) allBtn.classList.add('active');
  changeCategory('all');
});
