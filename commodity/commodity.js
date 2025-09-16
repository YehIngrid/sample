// // ====== 設定 ======
// const PAGE_SIZE = 18;
// let currentCategory = 'all';
// let currentSub = null;
// let pageIndex = 0;
// let isLoading = false;
// let isAllLoaded = false;

// // DOM
// const asideEl = document.getElementById('deepCategorySort');
// const deepListEl = document.getElementById('deepCategoryList');
// const productRow = document.getElementById('productRow');
// const loadMoreTrigger = document.getElementById('loadMoreTrigger');
// const loaderEl = document.getElementById('loader');
// const sortItems = document.querySelectorAll('.sort_item');
// const clearSubBtn = document.getElementById('clearSubBtn');

// // 範例：每個大分類對應的小分類
// const subcategories = {
//   '書籍與學籍用品': ['學校專業用書','通識課本/語言學習書','非學校用書', '文具用品','筆記/習題集', '其他'],
//   '宿舍與生活用品': ['廚房用具','寢具','電器用品','清潔用品','個人保養', '其他'],
//   '學生專用器材': ['實驗器材','測量工具', '其他'],
//   '環保生活用品': ['環保餐具','購物袋/手提袋', '其他'],
//   '儲物與收納用品': ['收納箱','置物架', '其他'],
//   '其他': ['周邊','腳踏車','其他']
// };

// // 模擬資料（若有後端請直接改 fetchProductsFromServer）
// const allMockProducts = backendService.getAllCategories(); // 這裡會呼叫後端 API 取得資料
// function generateMockProducts(n) {
//   const cats = ['書籍與學籍用品','宿舍與生活用品','學生專用器材', '環保生活用品', '儲物與收納用品', '其他'];
//   const arr = [];
//   for (let i=1;i<=n;i++){
//     const c = cats[i % cats.length];
//     arr.push({
//       id: i,
//       title: `${c} - 商品 ${i}`,
//       category: c,
//       price: (i * 37) % 999 + 50,
//       img: '' // 如果有圖片 URL 就填
//     });
//   }
//   return arr;
// }

// // ====== 初始化分類按鈕事件 ======
// sortItems.forEach(el => {
//   el.addEventListener('click', (e) => {
//     e.preventDefault();
//     sortItems.forEach(x => x.classList.remove('active'));
//     el.classList.add('active');
//     const cat = el.dataset.category || el.textContent.trim();
//     changeCategory(cat);
//   });
// });

// // 清除子分類
// if (clearSubBtn) {
//   clearSubBtn.addEventListener('click', (e) => {
//     e.preventDefault();
//     currentSub = null;
//     pageIndex = 0;
//     isAllLoaded = false;
//     productRow.innerHTML = '';
//     // 把子分類的 active 樣式清掉
//     document.querySelectorAll('.deep-sub').forEach(x => x.classList.remove('active'));
//     loadProducts();
//   });
// }


// // 切換大分類
// function changeCategory(category) {
//   currentCategory = category;
//   currentSub = null;
//   pageIndex = 0;
//   isAllLoaded = false;
//   productRow.innerHTML = '';
//   toggleAside(category);
//   loadProducts();
// }

// // 控制側欄顯示/填入子分類
// function toggleAside(category) {
//   if (category === 'all') {
//     asideEl.classList.add('d-none'); // bootstrap 隱藏
//   } else {
//     asideEl.classList.remove('d-none');
//     const items = subcategories[category] || [];
//     deepListEl.innerHTML = items.map(s => `<li><a href="#" class="deep-sub" data-sub="${s}">${s}</a></li>`).join('');
//     // 綁事件
//     document.querySelectorAll('.deep-sub').forEach(a => {
//         a.addEventListener('click', (e) => {
//             e.preventDefault();
//             // 移除所有子分類的 active
//             document.querySelectorAll('.deep-sub').forEach(x => x.classList.remove('active'));
//             // 幫目前點到的加 active
//             a.classList.add('active');

//             const sub = a.dataset.sub;
//             currentSub = sub;
//             pageIndex = 0;
//             isAllLoaded = false;
//             productRow.innerHTML = '';
//             loadProducts();
//         });
//     });

//   }
// }

// // 載入商品（分頁）
// // 會先嘗試呼叫後端 API（示範），若失敗 fallback 到 mock
// async function loadProducts() {
//   if (isLoading || isAllLoaded) return;
//   isLoading = true;
//   loaderEl.textContent = '載入中...';

//   try {
//     // 組 query string
//     const params = new URLSearchParams();
//     if (currentCategory && currentCategory !== 'all') params.append('category', currentCategory);
//     if (currentSub) params.append('sub', currentSub);
//     params.append('page', pageIndex);
//     params.append('pageSize', PAGE_SIZE);

//     let items = [];
//     let totalCount = null;

//     // 這裡示範呼叫後端 API，你可以改成你的 service
//     try {
//         backendService = new BackendService(); // 換成你的後端 URL
//         const res = await backendService.getAllCategories();
//         if (!res.ok) throw new Error('API fetch failed');
//         const json = await res.json();
//         items = json.items || [];
//         totalCount = json.totalCount ?? null;
//     } catch (err) {
//       // fallback to mock
//       console.warn('fetch failed, fallback to mock', err);
//       const fallback = mockFetch(currentCategory, currentSub, pageIndex, PAGE_SIZE);
//       items = fallback.items;
//       totalCount = fallback.totalCount;
//     }

//     // render
//     renderProductsBootstrap(items);

//     // 判斷結束
//     if (items.length < PAGE_SIZE || (totalCount !== null && (pageIndex + 1) * PAGE_SIZE >= totalCount)) {
//       isAllLoaded = true;
//       loaderEl.textContent = '沒有更多商品了';
//     } else {
//       pageIndex++;
//       loaderEl.textContent = '向下滾動以載入更多';
//     }
//   } catch (err) {
//     console.error(err);
//     loaderEl.textContent = '載入失敗，請稍後重試';
//   } finally {
//     isLoading = false;
//   }
// }

// // 使用 bootstrap row / col 來 render 商品
// function renderProductsBootstrap(items) {
//   // items 為陣列，每一項轉成 <div class="col-6 col-md-4 col-lg-3">...</div>
//   const frag = document.createDocumentFragment();
//   items.forEach(p => {
//     const col = document.createElement('div');
//     col.className = 'col-6 col-md-4 col-lg-3';
//     col.innerHTML = `
//       <div class="card h-100">
//         ${p.img ? `<img src="${escapeHtml(p.img)}" class="card-img-top product-card-img" alt="${escapeHtml(p.title)}">` :
//         `<div class="product-card-img d-flex align-items-center justify-content-center text-secondary">${escapeHtml(p.title.slice(0,6))}</div>`}
//         <div class="card-body d-flex flex-column">
//           <h6 class="card-title" style="font-size:14px;">${escapeHtml(p.title)}</h6>
//           <p class="mb-2 text-muted" style="font-size:13px;">類別：${escapeHtml(p.category)}</p>
//           <div class="mt-auto d-flex justify-content-between align-items-center">
//             <div class="fw-bold text-danger">NT$${escapeHtml(p.price)}</div>
//             <button class="btn btn-sm btn-outline-primary add-cart" data-id="${p.id}">加入購物車</button>
//           </div>
//         </div>
//       </div>
//     `;
//     frag.appendChild(col);
//   });
//   productRow.appendChild(frag);

//   // 若需要，在這裡初始化 card 內的按鈕事件（例如加入購物車）
//   productRow.querySelectorAll('.add-cart').forEach(btn => {
//     btn.addEventListener('click', (e) => {
//       const id = btn.dataset.id;
//       // TODO: 呼叫你的加入購物車邏輯
//       alert('加入購物車：ID ' + id);
//     });
//   });
// }

// // 簡單 escape
// function escapeHtml(str) {
//   return String(str ?? '')
//     .replace(/&/g, '&amp;')
//     .replace(/"/g, '&quot;')
//     .replace(/</g, '&lt;')
//     .replace(/>/g, '&gt;');
// }

// // IntersectionObserver (觸發載入下一頁)
// const io = new IntersectionObserver(entries => {
//   entries.forEach(entry => {
//     if (entry.isIntersecting) {
//       loadProducts();
//     }
//   });
// }, { root: null, rootMargin: '200px', threshold: 0.1 });

// if (loadMoreTrigger) io.observe(loadMoreTrigger);

// // MOCK fetch (本地測試)
// function mockFetch(category, sub, page, pageSize) {
//   let pool = allMockProducts.slice();
//   if (category && category !== 'all') {
//     pool = pool.filter(p => p.category === category);
//   }
//   if (sub) {
//     pool = pool.filter(p => p.title.includes(sub) || p.title.includes(sub)); // 簡易 mock
//   }
//   const start = page * pageSize;
//   const slice = pool.slice(start, start + pageSize);
//   return { items: slice, totalCount: pool.length };
// }

// // 初始載入
// document.addEventListener('DOMContentLoaded', () => {
//   // 預設選全部
//   sortItems.forEach(x => x.classList.remove('active'));
//   const allBtn = document.querySelector('.sort_item[data-category="all"]');
//   if (allBtn) allBtn.classList.add('active');
//   changeCategory('all');
// });
// sortItems.forEach(el => {
//   el.addEventListener('click', () => {
//     sortItems.forEach(x => x.classList.remove('active'));
//     el.classList.add('active');  // 這裡會套 active 樣式
//     changeCategory(el.dataset.category);
//   });
// });

// ====== 設定 ======
// 移除 import BackendService from './BackendService.js';
const PAGE_SIZE = 18;
let currentCategory = 'all';
let currentSub = null;
let pageIndex = 0;
let isLoading = false;
let isAllLoaded = false;

// DOM
const asideEl = document.getElementById('deepCategorySort');
const deepListEl = document.getElementById('deepCategoryList');
const productRow = document.getElementById('productRow');
const loadMoreTrigger = document.getElementById('loadMoreTrigger');
const loaderEl = document.getElementById('loader');
const sortItems = document.querySelectorAll('.sort_item');
const clearSubBtn = document.getElementById('clearSubBtn');

// 範例：每個大分類對應的小分類
const subcategories = {
  '書籍與學籍用品': ['學校專業用書','通識課本/語言學習書','非學校用書', '文具用品','筆記/習題集', '其他'],
  '宿舍與生活用品': ['廚房用具','寢具','電器用品','清潔用品','個人保養', '其他'],
  '學生專用器材': ['實驗器材','測量工具', '其他'],
  '環保生活用品': ['環保餐具','購物袋/手提袋', '其他'],
  '儲物與收納用品': ['收納箱','置物架', '其他'],
  '其他': ['周邊','腳踏車','其他']
};

// // 模擬資料
// const allMockProducts = generateMockProducts(300);
// function generateMockProducts(n) {
//   const cats = ['書籍與學籍用品','宿舍與生活用品','學生專用器材', '環保生活用品', '儲物與收納用品', '其他'];
//   const arr = [];
//   for (let i=1;i<=n;i++){
//     const c = cats[i % cats.length];
//     arr.push({
//       id: i,
//       title: `${c} - 商品 ${i}`,
//       category: c,
//       price: (i * 37) % 999 + 50,
//       img: ''
//     });
//   }
//   return arr;
// }

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
    isAllLoaded = false;
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
  isAllLoaded = false;
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
            isAllLoaded = false;
            productRow.innerHTML = '';
            loadProducts();
        });
    });

  }
}

// 載入商品（分頁）
async function loadProducts() {
  if (isLoading || isAllLoaded) return;
  isLoading = true;
  loaderEl.textContent = '載入中...';

  try {
    let items = [];
    let totalCount = null;

    // 使用 BackendService 呼叫 API
    const backendService = new BackendService();
    const response = await backendService.getAllCategories();
    // 假設 response.data 包含 items 和 totalCount
    items = response.data?.items || [];
    totalCount = response.data?.totalCount ?? null;

    // render
    renderProductsBootstrap(items);

    // 判斷結束
    if (items.length < PAGE_SIZE || (totalCount !== null && (pageIndex + 1) * PAGE_SIZE >= totalCount)) {
      isAllLoaded = true;
      loaderEl.textContent = '沒有更多商品了';
    } else {
      pageIndex++;
      loaderEl.textContent = '向下滾動以載入更多';
    }
  } catch (err) {
    console.error('API 載入失敗，回退到 mock 資料。', err);
    loaderEl.textContent = '載入失敗，請稍後重試';

    // fallback to mock
    // 這裡我們直接使用一個簡化版的 mockFetch，模擬回傳所有商品
    const fallback = mockFetch();
    renderProductsBootstrap(fallback.items);
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
        ${p.img ? `<img src="${escapeHtml(p.img)}" class="card-img-top product-card-img" alt="${escapeHtml(p.title)}">` :
        `<div class="product-card-img d-flex align-items-center justify-content-center text-secondary">${escapeHtml(p.title.slice(0,6))}</div>`}
        <div class="card-body d-flex flex-column">
          <h6 class="card-title" style="font-size:14px;">${escapeHtml(p.title)}</h6>
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

// 簡單 escape
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// IntersectionObserver (觸發載入下一頁)
const io = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadProducts();
    }
  });
}, { root: null, rootMargin: '200px', threshold: 0.1 });

if (loadMoreTrigger) io.observe(loadMoreTrigger);

// MOCK fetch (簡化版本，回傳所有資料)
function mockFetch() {
  const start = pageIndex * PAGE_SIZE;
  const slice = allMockProducts.slice(start, start + PAGE_SIZE);
  return { items: slice, totalCount: allMockProducts.length };
}

// 初始載入
document.addEventListener('DOMContentLoaded', () => {
  sortItems.forEach(x => x.classList.remove('active'));
  const allBtn = document.querySelector('.sort_item[data-category="all"]');
  if (allBtn) allBtn.classList.add('active');
  changeCategory('all');
});
sortItems.forEach(el => {
  el.addEventListener('click', () => {
    sortItems.forEach(x => x.classList.remove('active'));
    el.classList.add('active');
    changeCategory(el.dataset.category);
  });
});