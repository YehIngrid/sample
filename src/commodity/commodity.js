import BackendService from '../BackendService.js';
import '../default/default.js';

// ── Image variant helpers ──
function toBigImg(url) {
  if (!url) return url;
  return url.replace(/(\.(?:webp|jpe?g|png|gif))(\?|$)/i, '_big$1$2');
}

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


// 中文分類名稱 → API key 對照表
const catMap = {
  "課業學習": "education",
  "3C 電子": "electronics",
  "住宿生活": "living",
  "運動休閒": "sports",
  "服飾配件": "accessories",
  "二手好物": "other"
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
  loadProducts();
}

// 無限捲動狀態
let hasMore = true;
let loadedCount = 0;
const scrollSentinel = document.getElementById('scrollSentinel');
const infiniteStatusEl = document.getElementById('infiniteStatus');

function setInfiniteStatus(mode) {
  if (!infiniteStatusEl) return;
  if (mode === 'loading') {
    infiniteStatusEl.innerHTML = `<span class="infinite-spinner"></span> 載入更多商品中…`;
    infiniteStatusEl.classList.add('is-visible');
  } else if (mode === 'end') {
    infiniteStatusEl.innerHTML = `<span class="infinite-end">沒有更多商品了</span>`;
    infiniteStatusEl.classList.add('is-visible');
  } else {
    infiniteStatusEl.innerHTML = '';
    infiniteStatusEl.classList.remove('is-visible');
  }
}

// 捲到底時自動載入下一頁
if (scrollSentinel) {
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && hasMore && !isLoading) {
      loadProducts(true);
    }
  }, { rootMargin: '400px 0px' });
  observer.observe(scrollSentinel);
}

// 載入商品；append=false 為換分類/篩選/搜尋的全新查詢，append=true 為捲動載入下一頁
async function loadProducts(append = false) {
  if (isLoading) return;
  if (append && !hasMore) return;
  isLoading = true;

  if (append) {
    setInfiniteStatus('loading');
  } else {
    pageIndex = 0;
    hasMore = true;
    loadedCount = 0;
    productRow.innerHTML = commoditySkeletonHTML(PAGE_SIZE);
    setInfiniteStatus('');
  }

  try {
    const backendService = new BackendService();
    const sortselected = sortSelect ? sortSelect.value : 'default';
    const keyword = activeKeyword;
    const rawMaxPrice = maxPriceInput?.value ? parseInt(maxPriceInput.value) : null;
    const maxPrice = (rawMaxPrice !== null && rawMaxPrice >= 0 && rawMaxPrice <= 999999) ? rawMaxPrice : null;
    const newOrOld = newOrOldInput?.value !== 'default' ? parseInt(newOrOldInput?.value) : null;
    const validCategories = ['education', 'electronics', 'living', 'sports', 'accessories', 'other'];

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
        newOrOld,
      });
      items = response?.data?.commodities || [];
      totalCount = response?.data?.pagination?.totalItems ?? items.length;
    }

    const mobileCountEl = document.getElementById('mobileResultCount');
    if (mobileCountEl) mobileCountEl.textContent = `共 ${totalCount} 件`;

    // 搜尋結果提示列
    const searchResultBar = document.getElementById('searchResultBar');
    const searchResultText = document.getElementById('searchResultText');
    if (searchResultBar && searchResultText) {
      if (keyword) {
        searchResultText.textContent = `搜尋「${keyword}」的結果 · 共 ${totalCount} 件`;
        searchResultBar.style.display = 'flex';
      } else {
        searchResultBar.style.display = 'none';
      }
    }

    if (!append) productRow.innerHTML = '';
    if (items.length > 0 || !append) renderProductsBootstrap(items);

    loadedCount += items.length;
    pageIndex += 1;
    hasMore = items.length > 0 && loadedCount < totalCount;
    setInfiniteStatus(hasMore ? '' : (loadedCount > 0 ? 'end' : ''));

    if (items.length === 0 && keyword && !append) {
      showWishCta(keyword);
      showYouMightLike();
    } else if (!append) {
      document.getElementById('wish-cta')?.classList.add('d-none');
      document.getElementById('you-might-like')?.classList.add('d-none');
    }


  } catch (err) {
    console.error('API 載入失敗', err);
    if (append) setInfiniteStatus('');

  } finally {
    isLoading = false;
  }

  // 若這頁內容還沒把畫面填滿（沒東西可捲），主動補下一頁，避免卡住
  if (hasMore && scrollSentinel && scrollSentinel.getBoundingClientRect().top < window.innerHeight) {
    loadProducts(true);
  }
}

// 使用 bootstrap row / col 來 render 商品
function renderProductsBootstrap(items) {
  const frag = document.createDocumentFragment();
  const noProducts = document.getElementById('no-products');


    if (!items || items.length === 0) {
        // 沒商品 → 顯示提示
        noProducts.style.display = 'block';
        const noText = document.getElementById('no-products-text');
        if (noText) noText.textContent = activeKeyword ? `找不到「${activeKeyword}」相關商品` : '目前沒有商品';
        return;
    }

    // 有商品 → 隱藏無商品提示＆你可能也喜歡＆許願 CTA
    noProducts.style.display = 'none';
    document.getElementById('you-might-like')?.classList.add('d-none');
    document.getElementById('wish-cta')?.classList.add('d-none');

  const categoryMap = {
    education:   '課業學習',
    electronics: '3C 電子',
    living:      '住宿生活',
    sports:      '運動休閒',
    accessories: '服飾配件',
    other:       '二手好物',
  };
  const newOrOldMap = {
    1:'全新', 2:'幾乎全新', 3:'半新', 4:'適中', 5:'稍舊', 6:'全舊',
  };

  items.forEach((p, i) => {
    const col = document.createElement('div');
    col.className = 'col';
    col.style.animationDelay = `${Math.min(i, 11) * 0.04}s`;
    const category = categoryMap[p.category] ?? '其他';
    const newOrOld = newOrOldMap[p.newOrOld] ?? '';
    const imgUrl   = toBigImg(p.mainImage) || '';
    col.innerHTML = `
      <div class="product-card position-relative h-100" data-id="${escapeHtml(p.id)}">
        <div class="product-thumb">
          ${imgUrl
            ? `<img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(p.name)}" loading="lazy">`
            : `<div class="product-thumb-placeholder">${escapeHtml(p.name.slice(0,6))}</div>`}
        </div>
        <div class="card-body">
          <div class="hotItemName ellipsis-text">${escapeHtml(p.name)}</div>
          <div class="card-tags">
            <span class="card-tag"># ${escapeHtml(category)}</span>
            ${newOrOld ? `<span class="card-tag"># ${escapeHtml(newOrOld)}</span>` : ''}
          </div>
          <div class="card-bottom">
            <span class="price">NT$ ${escapeHtml(String(p.price))}</span>
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

// 初始載入（修改後的版本）
document.addEventListener('DOMContentLoaded', () => {
  // 設定聊天室 iframe src（桌機版）
  const iframe = document.getElementById('talkInterface');
  if (iframe) iframe.src = '../chatroom/chatroom.html';
  // 搜尋表單提交（桌機 Enter / 手機 offcanvas）
  document.getElementById('searchForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    activeKeyword = (document.getElementById('searchInput')?.value.trim() || '').slice(0, 100);
    loadProducts();
  });

  // 清除搜尋按鈕
  document.getElementById('clearSearchBtn')?.addEventListener('click', () => {
    activeKeyword = '';
    const si = document.getElementById('searchInput');
    if (si) si.value = '';
    const mt = document.getElementById('searchTriggerMobile');
    if (mt) mt.value = '';
    loadProducts();
  });

  // 當搜尋欄清空時自動重新載入（不需要按 Enter）
  document.getElementById('searchInput')?.addEventListener('input', (e) => {
    if (e.target.value.trim() === '' && activeKeyword !== '') {
      activeKeyword = '';
      loadProducts();
    }
  });
  document.getElementById('searchTriggerMobile')?.addEventListener('input', (e) => {
    if (e.target.value.trim() === '' && activeKeyword !== '') {
      activeKeyword = '';
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
    const si = document.getElementById('searchInput');
    if (si) { si.value = qFromUrl; si.dispatchEvent(new Event('input')); }
    const mt = document.getElementById('searchTriggerMobile');
    if (mt) { mt.value = qFromUrl; mt.dispatchEvent(new Event('input')); }
    loadProducts();
  } else {
    changeCategory(initialCategory);
  }
});

function applyFilters(items) {
  return items;
}

function clearFilters() {
    activeKeyword = '';
    const si = document.getElementById('searchInput');
    if (si) si.value = '';
    maxPriceInput.value = '';
    newOrOldInput.value = 'default';
    sortSelect.value = 'default';
    loadProducts();
}

const sortSelect = document.getElementById('sortSelect');
const maxPriceInput = document.getElementById('maxPriceInput');
const newOrOldInput = document.getElementById('new_or_oldInput');

function triggerFilter() {
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

// ── 搜尋無結果：主動許願 CTA ──
function showWishCta(keyword) {
  const cta = document.getElementById('wish-cta');
  if (!cta) return;
  const kwEl = document.getElementById('wish-cta-keyword');
  if (kwEl) kwEl.textContent = keyword;
  const btn = document.getElementById('wish-cta-btn');
  if (btn) {
    // 用 onclick 覆寫，避免多次搜尋累積重複監聽
    btn.onclick = () => {
      location.href = `../wishpool/wishpool.html?wish=${encodeURIComponent(keyword)}#makewish`;
    };
  }
  cta.classList.remove('d-none');
}

// ── 搜尋無結果：你可能也喜歡 ──
async function showYouMightLike() {
  const section = document.getElementById('you-might-like');
  const grid = document.getElementById('youMightLikeGrid');
  if (!section || !grid) return;
  try {
    const bs = new BackendService();
    const res = await bs.getHotItems({ page: 1, limit: 6 });
    const items = res?.data?.commodities || [];
    if (!items.length) return;
    grid.innerHTML = '';
    items.forEach(p => {
      const col = document.createElement('div');
      col.className = 'col';
      const imgUrl = toBigImg(p.mainImage) || '';
      col.innerHTML = `
        <div class="product-card position-relative h-100" data-id="${escapeHtml(p.id)}">
          <div class="product-thumb">
            ${imgUrl
              ? `<img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(p.name)}" loading="lazy">`
              : `<div class="product-thumb-placeholder">${escapeHtml(p.name.slice(0,6))}</div>`}
          </div>
          <div class="card-body">
            <div class="hotItemName ellipsis-text">${escapeHtml(p.name)}</div>
            <div class="card-bottom">
              <span class="price">NT$ ${escapeHtml(String(p.price))}</span>
              <div class="card-seller">
                <img class="seller-avatar" src="${escapeHtml(p.owner?.photoURL || '../webP/default-avatar.webp')}" alt="${escapeHtml(p.owner?.name || '賣家')}" onerror="this.src='../webP/default-avatar.webp'">
                <span class="seller-name">${escapeHtml(p.owner?.name || '賣家')}</span>
              </div>
            </div>
          </div>
        </div>`;
      col.querySelector('.product-card').addEventListener('click', () => {
        location.href = `../product/product.html?id=${encodeURIComponent(p.id)}`;
      });
      const img = col.querySelector('.product-thumb img');
      if (img) {
        if (img.complete && img.naturalWidth > 0) img.closest('.product-thumb').classList.add('img-loaded');
        else img.addEventListener('load', () => img.closest('.product-thumb')?.classList.add('img-loaded'), { once: true });
      }
      grid.appendChild(col);
    });
    section.classList.remove('d-none');
  } catch {}
}
