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

// 載入商品（分頁，含前端篩選與 totalCount 更新）
async function loadProducts() {
  if (isLoading) return;
  isLoading = true;
  loaderEl.textContent = '載入中...';

  try {
    let items = [];
    const backendService = new BackendService();
    const pagingInfo = { page: pageIndex + 1, limit: PAGE_SIZE };
    const response = await backendService.getAllCategories(pagingInfo);

    // API 回傳的商品
    items = response.data?.commodities || [];

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
