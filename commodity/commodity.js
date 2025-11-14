// // ====== 設定 ======
// const PAGE_SIZE = 18;
// let currentCategory = 'all';
// let currentSub = null;
// let pageIndex = 0;
// let isLoading = false;

// // DOM
// const asideEl = document.getElementById('deepCategorySort');
// const deepListEl = document.getElementById('deepCategoryList');
// const productRow = document.getElementById('productRow');
// const loaderEl = document.getElementById('loader');
// const sortItems = document.querySelectorAll('.sort_item');
// const clearSubBtn = document.getElementById('clearSubBtn');
// const paginationEl = document.getElementById('pagination');

// // 範例：每個大分類對應的小分類
// const subcategories = {
//   '書籍與學籍用品': ['學校專業用書','通識課本/語言學習書','非學校用書', '文具用品','筆記/習題集', '其他'],
//   '宿舍與生活用品': ['廚房用具','寢具','電器用品','清潔用品','個人保養', '其他'],
//   '學生專用器材': ['實驗器材','測量工具', '其他'],
//   '環保生活用品': ['環保餐具','購物袋/手提袋', '其他'],
//   '儲物與收納用品': ['收納箱','置物架', '其他'],
//   '其他': ['周邊','腳踏車','衣服', '運動用品', '其他']
// };
// const subcategoryIcons = {
//   '書籍與學籍用品': {
//     '學校專業用書': '../svg/studybook.svg',
//     '通識課本/語言學習書': '../svg/languagebook.svg',
//     '非學校用書': '../svg/noschoolbook.svg',
//     '文具用品': '../svg/pencil.svg',
//     '筆記/習題集': '../svg/note.svg',
//     '其他': '../svg/mother.svg'
//   },
//   '宿舍與生活用品': {
//     '廚房用具': '../svg/kitchen.svg',
//     '寢具': '../svg/bed.svg',
//     '電器用品': '../svg/mlife.svg',
//     '清潔用品': '../svg/tshclean.svg',
//     '個人保養': '../svg/makeup.svg',
//     '其他': '../svg/mother.svg'
//   },
//   '學生專用器材': {
//     '實驗器材': '../svg/experiment.svg',
//     '測量工具': '../svg/mruler.svg', 
//     '其他':'../svg/mother.svg'
//   }, 
//   '環保生活用品': {
//     '環保餐具': '../svg/spoon.svg',
//     '購物袋/手提袋': '../svg/mnewbag.svg',
//     '其他': '../svg/mother.svg'
//   }, 
//   '儲物與收納用品': {
//     '收納箱': '../svg/box.svg',
//     '置物架': '../svg/store.svg',
//     '其他': '../svg/mother.svg'
//   }, 
//   '其他': {
//     '周邊': '../svg/idol.svg',
//     '腳踏車': '../svg/bike.svg',
//     '衣服': '../svg/clothes.svg',
//     '運動用品': '../svg/sports.svg', 
//     '其他': '../svg/mother.svg'
//   }

//   // … 其他分類照這樣寫
// };

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
//     productRow.innerHTML = '';
//     document.querySelectorAll('.deep-sub').forEach(x => x.classList.remove('active'));
//     loadProducts();
//   });
// }

// // 切換大分類
// function changeCategory(category) {
//   currentCategory = category;
//   currentSub = null;
//   pageIndex = 0;
//   productRow.innerHTML = '';
//   toggleAside(category);
//   loadProducts();
// }

// // 控制側欄顯示/填入子分類
// function toggleAside(category) {
//   if (category === 'all' || category == 'hot' || category == 'new') {
//     asideEl.classList.add('d-none');
//     document.getElementById('mobileSubCategoryIcons').innerHTML = '';
//   } else {
//     asideEl.classList.remove('d-none');
//     const items = subcategories[category] || [];

//     // 桌機版子分類清單
//     deepListEl.innerHTML = items.map(s => `<li><a href="#" class="deep-sub" data-sub="${s}">${s}</a></li>`).join('');

//     // 手機版子分類 (圓形圖片)
//     const mobileIcons = document.getElementById('mobileSubCategoryIcons');
//     const iconMap = subcategoryIcons[category] || {};
//     mobileIcons.innerHTML = items.map(s => `
//       <div>
//         <img src="${iconMap[s] || 'icons/default.png'}" 
//              alt="${s}" 
//              class="mobile-sub" 
//              data-sub="${s}">
//         <div class="text-center" style="font-size:12px;">${s}</div>
//       </div>
//     `).join('');

//     // 綁定事件（桌機）
//     document.querySelectorAll('.deep-sub').forEach(a => {
//       a.addEventListener('click', (e) => {
//         e.preventDefault();
//         document.querySelectorAll('.deep-sub, .mobile-sub').forEach(x => x.classList.remove('active'));
//         a.classList.add('active');
//         currentSub = a.dataset.sub;
//         pageIndex = 0;
//         productRow.innerHTML = '';
//         loadProducts();
//       });
//     });

//     // 綁定事件（手機）
//     document.querySelectorAll('.mobile-sub').forEach(img => {
//       img.addEventListener('click', () => {
//         document.querySelectorAll('.deep-sub, .mobile-sub').forEach(x => x.classList.remove('active'));
//         img.classList.add('active');
//         currentSub = img.dataset.sub;
//         pageIndex = 0;
//         productRow.innerHTML = '';
//         loadProducts();
//       });
//     });
//   }
// }

// // 載入商品（分頁，含前端篩選與 totalCount 更新）
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
// function finishRender(items) {
//     // 篩選、分頁
//     const totalCount = items.length;
//     const start = pageIndex * PAGE_SIZE;
//     const pagedItems = items.slice(start, start + PAGE_SIZE);

//     productRow.innerHTML = '';
//     renderProductsBootstrap(pagedItems);
//     renderPagination(totalCount);

//     loaderEl.textContent = '';
//     isLoading = false;
// }

// // 使用 bootstrap row / col 來 render 商品
// function renderProductsBootstrap(items) {
//   const frag = document.createDocumentFragment();
//   const noProducts = document.getElementById('no-products');


//     if (!items || items.length === 0) {
//         // 沒商品 → 顯示提示
//         noProducts.style.display = 'block';
//         return;
//     }

//     // 有商品 → 隱藏無商品提示
//     noProducts.style.display = 'none';

//   items.forEach(p => {
//     const col = document.createElement('div');
//     col.className = 'col-6 col-md-4 col-lg-2';
//     const categoryMap = {
//         book: '書籍與學籍用品',
//         life: '宿舍與生活用品',
//         student: '學生專用器材',
//         other: '其他',
//         recycle: '環保生活用品',
//         clean: '儲物與收納用品',
//     };
//     const newOrOldMap = {
//       1:'全新',2:'幾乎全新',3:'半新',4:'適中',5:'稍舊',6:'全舊',
//     };
//     const category = categoryMap[p.category] ?? '其他';
//     const newOrOld = newOrOldMap[p.newOrOld] ?? '';
//     col.innerHTML = `
//       <div class="card h-100" style="cursor:pointer;" onclick="window.location.href='../product/product.html?id=${escapeHtml(p.id)}'">
//         ${p.mainImage ? `<img src="${escapeHtml(p.mainImage)}" class="card-img-top product-card-img" alt="${escapeHtml(p.name)}">` :
//         `<div class="product-card-img d-flex align-items-center justify-content-center text-secondary">${escapeHtml(p.name.slice(0,6))}</div>`}
//         <div class="card-body d-flex flex-column">
//           <h6 class="card-title" style="font-size:14px;">${escapeHtml(p.name)}</h6>
//           <p class="mb-2 text-muted" style="font-size:13px;"># ${escapeHtml(newOrOld)}</p>
//           <div class="mt-auto d-flex justify-content-between align-items-center">
//             <div class="fw-bold text-danger">NT$${escapeHtml(p.price)}</div>
//           </div>
//         </div>
//       </div>
//     `;
//     frag.appendChild(col);
//   });
//   productRow.appendChild(frag);

//   // 加購物車事件
//   // productRow.querySelectorAll('.add-cart').forEach(btn => {
//   //   btn.addEventListener('click', async(e) => {
//   //   const id = btn.dataset.id;
//   //       try {
//   //           await backendService.addItemsToCart(id, 1);
//   //           Swal.fire({
//   //           title: '已加入購物車！',
//   //           icon: 'success', 
//   //           showConfirmButton: false,
//   //           timer: 1600,
//   //           });
//   //       } catch (err) {
//   //           const msg = err?.response?.data?.message || err?.message || '請稍後再試';
//   //           Swal.fire({ icon: 'error', title: '加入失敗', text: msg });
//   //       } finally {
//   //           btn.disabled = false;
//   //       }
//   //           });
//   //       });
// }

// // escape HTML
// function escapeHtml(str) {
//   return String(str ?? '')
//     .replace(/&/g, '&amp;')
//     .replace(/"/g, '&quot;')
//     .replace(/</g, '&lt;')
//     .replace(/>/g, '&gt;');
// }

// // 分頁按鈕
// function renderPagination(totalCount) {
//   const totalPages = Math.ceil(totalCount / PAGE_SIZE);
//   paginationEl.innerHTML = '';

//   // 上一頁
//   const prevBtn = document.createElement('button');
//   prevBtn.textContent = '<';
//   prevBtn.className = 'btn btn-sm mx-1 ' + (pageIndex === 0 ? 'btn-secondary disabled' : 'btn-outline-primary');
//   prevBtn.addEventListener('click', () => {
//     if (pageIndex > 0) {
//       pageIndex--;
//       loadProducts();
//     }
//   });
//   paginationEl.appendChild(prevBtn);

//   // 頁數按鈕
//   for (let i = 0; i < totalPages; i++) {
//     const btn = document.createElement('button');
//     btn.textContent = i + 1;
//     btn.className = 'btn btn-sm mx-1 ' + (i === pageIndex ? 'btn-primary' : 'btn-outline-primary');
//     btn.addEventListener('click', () => {
//       if (i !== pageIndex) {
//         pageIndex = i;
//         loadProducts();
//       }
//     });
//     paginationEl.appendChild(btn);
//   }

//   // 下一頁
//   const nextBtn = document.createElement('button');
//   nextBtn.textContent = '>';
//   nextBtn.className = 'btn btn-sm mx-1 ' + (pageIndex === totalPages - 1 ? 'btn-secondary disabled' : 'btn-outline-primary');
//   nextBtn.addEventListener('click', () => {
//     if (pageIndex < totalPages - 1) {
//       pageIndex++;
//       loadProducts();
//     }
//   });
//   paginationEl.appendChild(nextBtn);
// }

// // 初始載入（修改後的版本）
// document.addEventListener('DOMContentLoaded', () => {
//   // 取得 URL 參數
//   const urlParams = new URLSearchParams(window.location.search);
//   const categoryFromUrl = urlParams.get('category');
  
//   let initialCategory = 'all';

//   // 如果 URL 有帶 category 參數，就用它的值作為初始分類
//   if (categoryFromUrl) {
//     initialCategory = categoryFromUrl;
//   }

//   // 移除所有按鈕的 active 樣式
//   sortItems.forEach(x => x.classList.remove('active'));

//   // 找到對應的按鈕並加上 active 樣式
//   const activeBtn = document.querySelector(`.sort_item[data-category="${initialCategory}"]`);
//   if (activeBtn) {
//     activeBtn.classList.add('active');
//   }
  
//   // 使用初始分類來載入商品
//   changeCategory(initialCategory);
// });
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

// 篩選器 DOM 元素
const sortSelect = document.getElementById('sortSelect');
const minPriceInput = document.getElementById('minPriceInput');
const maxPriceInput = document.getElementById('maxPriceInput');
const filterButton = document.getElementById('filterButton');

// 由於 HTML 中除了 sortSelect 外，其他 select 沒有 ID，這裡依照順序獲取
const sortAndProductDiv = document.querySelector('.sortAndProductdiv');
const selectElements = sortAndProductDiv ? sortAndProductDiv.querySelectorAll('select') : [];
const sizeSelect = selectElements.length >= 2 ? selectElements[1] : null;       // 第二個 select (商品大小)
const ageSelect = selectElements.length >= 3 ? selectElements[2] : null;        // 第三個 select (商品年齡)
const conditionSelect = selectElements.length >= 4 ? selectElements[3] : null;  // 第四個 select (商品狀態)

// 範例：每個大分類對應的小分類
const subcategories = {
    '書籍與學籍用品': ['學校專業用書','通識課本/語言學習書','非學校用書', '文具用品','筆記/習題集', '其他'],
    '宿舍與生活用品': ['廚房用具','寢具','電器用品','清潔用品','個人保養', '其他'],
    '學生專用器材': ['實驗器材','測量工具', '其他'],
    '環保生活用品': ['環保餐具','購物袋/手提袋', '其他'],
    '儲物與收納用品': ['收納箱','置物架', '其他'],
    '其他': ['周邊','腳踏車','衣服', '運動用品', '其他']
};
const subcategoryIcons = {
    '書籍與學籍用品': {
        '學校專業用書': '../svg/studybook.svg',
        '通識課本/語言學習書': '../svg/languagebook.svg',
        '非學校用書': '../svg/noschoolbook.svg',
        '文具用品': '../svg/pencil.svg',
        '筆記/習題集': '../svg/note.svg',
        '其他': '../svg/mother.svg'
    },
    '宿舍與生活用品': {
        '廚房用具': '../svg/kitchen.svg',
        '寢具': '../svg/bed.svg',
        '電器用品': '../svg/mlife.svg',
        '清潔用品': '../svg/tshclean.svg',
        '個人保養': '../svg/makeup.svg',
        '其他': '../svg/mother.svg'
    },
    '學生專用器材': {
        '實驗器材': '../svg/experiment.svg',
        '測量工具': '../svg/mruler.svg', 
        '其他':'../svg/mother.svg'
    }, 
    '環保生活用品': {
        '環保餐具': '../svg/spoon.svg',
        '購物袋/手提袋': '../svg/mnewbag.svg',
        '其他': '../svg/mother.svg'
    }, 
    '儲物與收納用品': {
        '收納箱': '../svg/box.svg',
        '置物架': '../svg/store.svg',
        '其他': '../svg/mother.svg'
    }, 
    '其他': {
        '周邊': '../svg/idol.svg',
        '腳踏車': '../svg/bike.svg',
        '衣服': '../svg/clothes.svg',
        '運動用品': '../svg/sports.svg', 
        '其他': '../svg/mother.svg'
    }
};

// ====== 篩選參數獲取函式 ======
function getFilterParams() {
    // 獲取排序方式
    const sortBy = sortSelect ? sortSelect.value : 'default';

    // 獲取價格範圍
    const minPrice = minPriceInput ? parseFloat(minPriceInput.value) || 0 : 0;
    const maxPrice = maxPriceInput ? parseFloat(maxPriceInput.value) : Infinity;

    // 獲取商品大小 (0:小型, 1:中型, 2:大型)
    const sizeValue = sizeSelect ? sizeSelect.value : 'default';
    // 假設 size 欄位在商品物件上是數字 0/1/2
    const size = sizeValue !== 'default' ? parseInt(sizeValue) : null; 

    // 獲取商品年齡 (0:全新, 1:1年內, 2:1-3年, 3:3年以上)
    const ageValue = ageSelect ? ageSelect.value : 'default';
    // 假設 age 欄位在商品物件上是數字 0/1/2/3
    const age = ageValue !== 'default' ? parseInt(ageValue) : null;

    // 獲取商品狀態 (前端 0-5 => API 1-6)
    const conditionValue = conditionSelect ? conditionSelect.value : 'default';
    let condition = null;
    if (conditionValue !== 'default') {
        const value = parseInt(conditionValue);
        // *** 修正：將前端 0-5 範圍轉換為 API 的 1-6 範圍 ***
        condition = value + 1; 
    }
    
    // 檢查價格邏輯
    if (minPrice > maxPrice) {
        alert('最低預算不能高於最高預算！請重新輸入。');
        return { isValid: false };
    }

    return {
        isValid: true,
        sortBy,
        minPrice,
        maxPrice: maxPrice === Infinity ? null : maxPrice,
        size,       // null 或 0/1/2
        age,        // null 或 0/1/2/3
        condition,  // null 或 1-6
    };
}


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

// 篩選按鈕事件
if (filterButton) {
    filterButton.addEventListener('click', (e) => {
        e.preventDefault();
        // 點擊篩選按鈕時，重設分頁並載入商品
        pageIndex = 0;
        productRow.innerHTML = '';
        loadProducts();
    });
}

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
        document.getElementById('mobileSubCategoryIcons').innerHTML = '';
    } else {
        asideEl.classList.remove('d-none');
        const items = subcategories[category] || [];

        // 桌機版子分類清單
        deepListEl.innerHTML = items.map(s => `<li><a href="#" class="deep-sub" data-sub="${s}">${s}</a></li>`).join('');

        // 手機版子分類 (圓形圖片)
        const mobileIcons = document.getElementById('mobileSubCategoryIcons');
        const iconMap = subcategoryIcons[category] || {};
        mobileIcons.innerHTML = items.map(s => `
            <div>
                <img src="${iconMap[s] || 'icons/default.png'}" 
                     alt="${s}" 
                     class="mobile-sub" 
                     data-sub="${s}">
                <div class="text-center" style="font-size:12px;">${s}</div>
            </div>
        `).join('');

        // 綁定事件（桌機）
        document.querySelectorAll('.deep-sub').forEach(a => {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.deep-sub, .mobile-sub').forEach(x => x.classList.remove('active'));
                a.classList.add('active');
                currentSub = a.dataset.sub;
                pageIndex = 0;
                productRow.innerHTML = '';
                loadProducts();
            });
        });

        // 綁定事件（手機）
        document.querySelectorAll('.mobile-sub').forEach(img => {
            img.addEventListener('click', () => {
                document.querySelectorAll('.deep-sub, .mobile-sub').forEach(x => x.classList.remove('active'));
                img.classList.add('active');
                currentSub = img.dataset.sub;
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

    // 獲取篩選參數
    const filters = getFilterParams();
    if (!filters.isValid) {
        isLoading = false;
        loaderEl.textContent = '';
        return;
    }
    
    // 輸出篩選參數（用於除錯）
    console.log('當前篩選參數:', filters);
    
    try {
        let items = [];
        // 假設 BackendService 類別在全域可用
        const backendService = new BackendService(); 
        const pagingInfo = { page: pageIndex + 1, limit: PAGE_SIZE };

        // 處理熱門和最新商品 (API 直接回傳)
        if (currentCategory === 'hot') {
            backendService.getHotItems(pagingInfo, (response => {
                items = response?.data?.commodities || [];
                finishRender(items, filters); 
            }), (errorMessage => {
                console.error("getHotItems 失敗:", errorMessage);
                loaderEl.textContent = '載入失敗，請稍後重試';
                isLoading = false;
            }))
            return; 
        } else if (currentCategory === 'new') {
            backendService.getNewItems(pagingInfo, (response => {
                items = response?.data?.commodities || [];
                finishRender(items, filters);
            }), (errorMessage => {
                console.error("getNewItems 失敗:", errorMessage);
                loaderEl.textContent = '載入失敗，請稍後重試';
                isLoading = false;
            }))
            return; 
        }
        
        // 處理其他所有分類 (呼叫 getAllCommodities 後在前端篩選)
        const response = await backendService.getAllCommodities(pagingInfo);
        items = response.data?.commodities || [];
        finishRender(items, filters);


    } catch (err) {
        console.error('API 載入失敗', err);
        loaderEl.textContent = '載入失敗，請稍後重試';
    } finally {
        // 在 finishRender 內部會將 isLoading 設為 false，此處不需要
    }
}

// 整合篩選、排序、分頁和渲染
function finishRender(items, filters) {
    
    const categoryMap = {
        book: '書籍與學籍用品',
        life: '宿舍與生活用品',
        student: '學生專用器材',
        recycle: '環保生活用品',
        clean: '儲物與收納用品',
        other: '其他',
    };

    let filteredItems = items;

    // 1. 篩選大分類
    if (currentCategory !== 'all' && currentCategory !== 'hot' && currentCategory !== 'new') {
        // 假設商品物件有 p.category 欄位（如 'book', 'life'）
        filteredItems = filteredItems.filter(p => categoryMap[p.category] === currentCategory);
    }

    // 2. 篩選子分類
    if (currentSub) {
        // 假設商品物件有 p.subCategory 欄位
        filteredItems = filteredItems.filter(p => p.subCategory === currentSub);
    }
    
    // ====== 3. 篩選額外條件 (價格、大小、年齡、狀態) ======

    // 篩選價格
    filteredItems = filteredItems.filter(p => {
        // 確保 p.price 是數字型態
        const price = parseFloat(p.price); 
        const minOk = price >= filters.minPrice;
        const maxOk = filters.maxPrice === null || price <= filters.maxPrice;
        return minOk && maxOk;
    });

    // 篩選商品大小 (假設商品物件有 size 欄位，值為 0/1/2)
    if (filters.size !== null) {
        filteredItems = filteredItems.filter(p => {
            // p.size 欄位應是 0/1/2
            return parseInt(p.size) === filters.size; 
        });
    }

    // 篩選商品年齡 (假設商品物件有 age 欄位，值為 0/1/2/3)
    if (filters.age !== null) {
        filteredItems = filteredItems.filter(p => {
            // p.age 欄位應是 0/1/2/3
            return parseInt(p.age) === filters.age; 
        });
    }

    // 篩選商品狀態 (p.newOrOld 欄位，值為 API 範圍 1-6)
    if (filters.condition !== null) {
        filteredItems = filteredItems.filter(p => {
            // filters.condition 已轉換為 1-6，與 p.newOrOld (1-6) 進行比較
            return p.newOrOld === filters.condition;
        });
    }

    // ====== 4. 執行排序 ======

    if (filters.sortBy !== 'default') {
        filteredItems.sort((a, b) => {
            const priceA = parseFloat(a.price);
            const priceB = parseFloat(b.price);

            switch (filters.sortBy) {
                case 'priceAsc':
                    return priceA - priceB;
                case 'priceDesc':
                    return priceB - priceA;
                case 'newest':
                    // 假設商品物件有 createdAt 欄位，用於最新排序
                    const dateA = new Date(a.createdAt || 0).getTime();
                    const dateB = new Date(b.createdAt || 0).getTime();
                    return dateB - dateA; // 降冪 (最新的在前面)
                default:
                    return 0;
            }
        });
    }
    
    // ====== 5. 渲染分頁 ======

    const totalCount = filteredItems.length;
    const start = pageIndex * PAGE_SIZE;
    const pagedItems = filteredItems.slice(start, start + PAGE_SIZE);

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
        noProducts.style.display = 'block';
        return;
    }

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
        // *** 修正：商品狀態映射為 API 回傳的 1-6 數值 ***
        const newOrOldMap = {
            1:'全新', 2:'稍新', 3:'半新', 4:'稍舊', 5:'半舊', 6:'全舊',
        };
        const category = categoryMap[p.category] ?? '其他';
        const newOrOld = newOrOldMap[p.newOrOld] ?? ''; // p.newOrOld 應該是 1-6
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

    // ... (加購物車事件註釋保持不變)
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

// 初始載入
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