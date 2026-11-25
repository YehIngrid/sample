function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ── Token 驗證（私密 URL）──
window.isTokenValid = true;
(function () {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const VALID_TOKEN = 'treasurehub2024';

  if (token !== VALID_TOKEN) {
    window.isTokenValid = false;
  }
})();

// ── 校園攻略站統計（文章總數/已認證作者數/本月閱讀數）──
// 這支檔案同時被 school.html（攻略首頁）和 school-about.html（攻略介紹）共用，
// 兩邊的 DOM 結構不一樣（class 不同），所以共用同一組 id 當橋接點，
// 哪個頁面沒有對應元素就直接跳過，不會噴錯。
(function () {
  const elArticles = document.getElementById('schoolStatArticles');
  const elAuthors = document.getElementById('schoolStatAuthors');
  const elReads = document.getElementById('schoolStatReads');
  if (!elArticles && !elAuthors && !elReads) return;
  if (!window.schoolBackendService) return;

  window.schoolBackendService.getSchoolStats().then(res => {
    const d = (res && res.data) || {};
    if (elArticles) elArticles.textContent = (d.articleCount || 0).toLocaleString();
    if (elAuthors) elAuthors.textContent = (d.verifiedAuthorCount || 0).toLocaleString();
    if (elReads) elReads.textContent = (d.monthlyReadCount || 0).toLocaleString();
  }).catch(e => {
    console.error('取得校園攻略站統計失敗：', e);
  });
})();

// ── 預覽用：預設為「已模擬登入」狀態（僅在尚未設定過時種入；登出後不覆蓋）──
(function () {
  try {
    if (localStorage.getItem('th_cg_auth') === null) {
      localStorage.setItem('th_cg_auth', '1');
      localStorage.setItem('th_cg_username', '王同學');
    }
  } catch (e) {}
})();

// ── Save / bookmark button on every article card ──
var bmOutline = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3 H18 A1 1 0 0 1 19 4 V21 L12 16 L5 21 V4 A1 1 0 0 1 6 3 Z"/></svg>';
var bmFilled = '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3 H18 A1 1 0 0 1 19 4 V21 L12 16 L5 21 V4 A1 1 0 0 1 6 3 Z"/></svg>';

var STORE_KEY = 'th_cg_saved';
var saved = {};
try { saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch (e) { saved = {}; }

function persist() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(saved)); } catch (e) {}
}

function attachSaveButtons() {
  document.querySelectorAll('.article').forEach(function (card, i) {
    var stats = card.querySelector('.read-stats');
    if (!stats) return;

    // 防止重複添加
    if (stats.querySelector('.save-btn')) return;

    var id = 'a' + i;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'save-btn' + (saved[id] ? ' saved' : '');
    btn.innerHTML = (saved[id] ? bmFilled : bmOutline) + '<span>' + (saved[id] ? '已儲存' : '儲存') + '</span>';
    btn.setAttribute('aria-pressed', saved[id] ? 'true' : 'false');
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation(); // 卡片整個包了 <a href> 導去文章頁，按鈕點擊不該跟著跳轉
      var on = !btn.classList.contains('saved');
      btn.classList.toggle('saved', on);
      btn.innerHTML = (on ? bmFilled : bmOutline) + '<span>' + (on ? '已儲存' : '儲存') + '</span>';
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on) { saved[id] = true; } else { delete saved[id]; }
      persist();
    });
    stats.appendChild(btn);
  });
}

// ── 每篇文章卡片右上角：可點擊的喜歡（愛心）── 疊在封面/內文交界處
var LIKE_KEY = 'th_cg_liked';
var liked = {};
try { liked = JSON.parse(localStorage.getItem(LIKE_KEY) || '{}'); } catch (e) { liked = {}; }

function persistLikes() {
  try { localStorage.setItem(LIKE_KEY, JSON.stringify(liked)); } catch (e) {}
}

var LIKE_HEART_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>';

function attachLikeButtons() {
  document.querySelectorAll('.article').forEach(function (card, i) {
    // 防止重複添加
    if (card.querySelector('.like-fab')) return;

    var id = 'a' + i;
    var countEl = card.querySelector('.like-count-display .likes-num');
    var baseCount = countEl ? (parseInt(String(countEl.textContent).replace(/[^\d]/g, ''), 10) || 0) : 0;
    var isLiked = !!liked[id];

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'like-fab' + (isLiked ? ' liked' : '');
    btn.setAttribute('aria-pressed', isLiked ? 'true' : 'false');
    btn.setAttribute('aria-label', '喜歡這篇文章');
    btn.innerHTML = LIKE_HEART_SVG;
    if (countEl) countEl.textContent = baseCount + (isLiked ? 1 : 0);

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation(); // 卡片本身若之後加上點擊導覽，避免誤觸跳轉
      var on = !btn.classList.contains('liked');
      btn.classList.toggle('liked', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on) { liked[id] = true; } else { delete liked[id]; }
      persistLikes();
      if (countEl) countEl.textContent = baseCount + (on ? 1 : 0);
    });

    card.appendChild(btn);
  });
}

// ── Admin button for 校園攻略站 ──
(function () {
  const schoolAdminBtn = document.getElementById('schoolAdminBtn');
  if (!schoolAdminBtn) return;
  // 等真正的登入驗證跑完再讀 role，避免 session 已過期但 localStorage 舊值還沒清掉時誤判
  Promise.resolve(window._authReady).then(() => {
    const role = window.isLoggedIn ? localStorage.getItem('role') : null;
    if (['MODERATOR', 'ADMIN'].includes(role)) {
      schoolAdminBtn.style.display = 'block';
    }
  });
})();

// ── Render featured article ──
// GET /api/school/featured — 目前 weeklyPicks 在真實環境一律是空陣列（後端
// 尚未實作每週精選的篩選邏輯），所以下面同時處理「有資料」與「目前必為空」
// 兩種情況：沒有精選就直接把整個 #featuredWrap 隱藏，不要留一個空殼。
(async function () {
  const featuredWrap = document.getElementById('featuredWrap');
  if (!featuredWrap) return;

  let pick = null;
  try {
    const res = await window.schoolBackendService.getFeature();
    const picks = (res && res.data && res.data.weeklyPicks) || [];
    pick = picks[0] || null;
  } catch (error) {
    console.error('取得本週精選失敗：', error);
  }

  if (!pick) {
    featuredWrap.style.display = 'none';
    return;
  }

  // weeklyPicks 的單篇物件形狀目前沒有實例可核對，先用跟 /articles 列表同樣的
  // 欄位名稱做防禦性讀取（article 可能包一層、也可能跟列表一樣是平的）。
  const art = pick.article || pick;
  const author = art.author || {};
  const titles = author.titles || [];
  const title = art.title || '';
  const excerpt = art.subtitle || '';
  const category = art.categoryName || '';
  const year = art.applicableYear || '長期適用';
  const authorName = author.displayName || author.nickname || '匿名作者';
  const tags = titles.map(t => t.shortName).filter(Boolean);
  const reads = (art.viewCount || 0).toLocaleString() + ' 次閱讀';
  const isFree = art.type === 'FREE';
  const price = isFree ? '免費閱讀' : ('NT$ ' + (art.price || 0));
  const publishedDate = art.publishedAt ? new Date(art.publishedAt).toLocaleDateString('zh-TW').replace(/\//g, ' / ') : '';

  const html = `
    <span class="badge">本週精選</span>
    <div class="cover" style="display:none;"></div>
    <div class="copy">
      <div class="meta-top">
        <span class="cat-pill">${category}</span>
        ${publishedDate ? `<span>${publishedDate}</span><span>·</span>` : ''}
        <span>適用 ${year}</span>
      </div>
      <h2>${title}</h2>
      <p class="excerpt">${excerpt}</p>
      <div class="author-row">
        <div class="av"></div>
        <div class="author-info">
          <div class="author-name">${authorName}</div>
          <div class="author-tags">
            ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
        </div>
        <div class="read-meta">
          <span><img src="../svg/read.svg" style="width:15px;height:15px;vertical-align:middle;margin-right:4px;" alt="閱讀"> ${reads}</span>
        </div>
      </div>
      <div class="price-box">
        <div class="price">${isFree ? '免費閱讀' : price}</div>
        <a class="btn-read" href="school-post.html?id=${art.id}">立即閱讀 →</a>
      </div>
    </div>
  `;

  featuredWrap.innerHTML = html;
})();

// ── Article data and rendering ──
(function () {
  let ARTICLES = [];

  // 粗略相對時間（跟 mock 資料原本用的「X 天前／X 週前」風格一致）
  function timeAgo(iso) {
    if (!iso) return '';
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return Math.max(mins, 1) + ' 分鐘前';
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours + ' 小時前';
    const days = Math.floor(hours / 24);
    if (days < 7) return days + ' 天前';
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return weeks + ' 週前';
    const months = Math.floor(days / 30);
    if (months < 12) return months + ' 個月前';
    return Math.floor(days / 365) + ' 年前';
  }

  const GRADIENTS = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6'];

  // 把 GET /api/school/articles 回傳的單篇物件轉成這支檔案原本卡片渲染
  // （articleCardHTML／anchorRowHTML）期待的欄位命名。API 目前沒有 gradient／
  // anchorValues 這類純裝飾或分類專屬結構化欄位，只能合理地簡化/省略，不是漏接。
  function mapArticle(item, idx) {
    const author = item.author || {};
    const titles = author.titles || [];
    // 這些欄位現在是真實使用者輸入（標題/副標/標籤/作者暱稱都來自撰寫器），
    // 直接塞進 articleCardHTML 的樣板字串當 innerHTML 用，一定要先跳脫，
    // 不然是存儲型 XSS（CLAUDE.md 明確要求注意這塊）。
    return {
      id: item.id,
      title: esc(item.title),
      excerpt: esc(item.subtitle || ''),
      category: esc(item.categoryName || ''),
      coverUrl: item.coverUrl || '',
      gradient: GRADIENTS[idx % GRADIENTS.length],
      tag: item.schoolOnly ? '同校生限定' : (item.type === 'FREE' ? '免費' : ''),
      year: esc(item.applicableYear || '長期適用'),
      author: esc(author.displayName || author.nickname || '匿名作者'),
      verified: !!titles.length || author.studentStatus === 'ENROLLED',
      badge: titles[0] && esc(titles[0].shortName),
      tags: (item.tags || []).map(t => esc(t)),
      time: timeAgo(item.publishedAt),
      price: item.type === 'FREE' ? '免費閱讀' : ('NT$ ' + item.price),
      views: (item.viewCount || 0).toLocaleString(),
      likes: (item.likeCount || 0).toLocaleString(),
      comments: (item.reviewCount || 0).toLocaleString(),
    };
  }

  let ARTICLES_TOTAL = 0;
  let currentCategoryId = ''; // 空字串 = 全部文章，點側邊欄分類會換成真正的 categoryId
  let currentTagName = ''; // 空字串 = 不篩標籤，點側邊欄「熱門標籤」會換成真正的標籤名稱

  async function fetchArticles() {
    try {
      const params = { limit: 20, sort: 'latest' };
      if (currentCategoryId) params.category = currentCategoryId;
      if (currentTagName) params.tag = currentTagName;
      const res = await window.schoolBackendService.getArticles(params);
      const items = (res && res.data && res.data.items) || [];
      ARTICLES_TOTAL = (res && res.data && res.data.total) || items.length;
      ARTICLES = items.map(mapArticle);
    } catch (error) {
      console.error('取得文章列表失敗：', error);
      ARTICLES = [];
      ARTICLES_TOTAL = 0;
    }
  }

  // 錨點資訊：文章列表 API（GET /api/school/articles）每篇文章實際回傳的
  // tags（撰寫時選的 hashtag），不是 school-composer.html 那套「主題必填錨點
  // 欄位」（answers/anchorValues，只有單篇文章詳情 GET /api/school/articles/{id}
  // 才有，列表 API 沒有，逐篇另外打一次詳情 API 會是 N+1，不值得），所以列表卡片
  // 上能穩定呈現的「錨點」只有這組 tags。
  function tagRowHTML(art) {
    if (!art.tags || !art.tags.length) return '';
    return '<div class="tag-row">' + art.tags.map(function (t) { return '<span class="tag-chip">#' + t + '</span>'; }).join('') + '</div>';
  }

  function articleCardHTML(art) {
    if (art.nocover) {
      return `
        <a class="article-card-link" href="school-post.html?id=${art.id}">
        <article class="article nocover" data-article-id="${art.id}">
          <div class="body">
            <div class="meta-row">
              <span class="cat-pill-inline">${art.category}</span>
              <span class="valid-tag ${art.stale ? 'stale' : ''}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7 V12 L15 14"/></svg>
                ${art.year}
              </span>
            </div>
            <h2>${art.title}</h2>
            <p class="excerpt">${art.excerpt}</p>
            ${tagRowHTML(art)}
            <div class="author-row">
              <div class="av-sm"></div>
              <div class="author-meta">
                <div class="name">${art.author}</div>
                <div class="sub">${art.badge ? `<span class="badge-pill">${art.badge.replace(/\*/g, '')}</span> · ` : ''}${art.time}</div>
              </div>
              <div class="price">${art.price}</div>
            </div>
            <div class="read-stats">
              <span><img src="../svg/read.svg" style="width:15px;height:15px;vertical-align:middle;margin-right:4px;" alt="閱讀"> <span class="views-num">${art.views}</span></span>
              <span class="like-count-display"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;display:inline-block;color:#c97f5a;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg> <span class="likes-num">${art.likes}</span></span>
              <span><img src="../svg/comment_school.svg" style="width:13px;height:13px;vertical-align:middle;margin-right:4px;" alt="評論"> <span class="comments-num">${art.comments}</span></span>
            </div>
          </div>
        </article>
        </a>
      `;
    }

    return `
      <a class="article-card-link" href="school-post.html?id=${art.id}">
      <article class="article" data-article-id="${art.id}">
        <div class="cover ${art.gradient || 'g1'}" ${art.coverUrl ? `style="background-image:url('${art.coverUrl}');background-size:cover;background-position:center;"` : ''}>
          <span class="cat-pill-cover">${art.category}</span>
          ${art.tag ? `<span class="${art.tag === '免費' ? 'free-tag' : 'biz-tag'}">${art.tag}</span>` : ''}
        </div>
        <div class="body">
          <span class="valid-tag ${art.stale ? 'stale' : ''}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7 V12 L15 14"/></svg>
            ${art.year}
          </span>
          <h2>${art.title}</h2>
          <p class="excerpt">${art.excerpt}</p>
          ${tagRowHTML(art)}
          <div class="author-row">
            <div class="av-sm"></div>
            <div class="author-meta">
              <div class="name">${art.author}</div>
              <div class="sub">${art.badge ? `<span class="badge-pill">${art.badge.replace(/\*/g, '')}</span> · ` : ''}${art.time}</div>
            </div>
            <div class="price ${art.price === '免費閱讀' ? 'free' : ''}">${art.price}</div>
          </div>
          <div class="read-stats">
            <span><img src="../svg/read.svg" style="width:15px;height:15px;vertical-align:middle;margin-right:4px;" alt="閱讀"> <span class="views-num">${art.views}</span></span>
            <span class="like-count-display"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;display:inline-block;color:#c97f5a;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg> <span class="likes-num">${art.likes}</span></span>
            <span><img src="../svg/comment_school.svg" style="width:13px;height:13px;vertical-align:middle;margin-right:4px;" alt="評論"> <span class="comments-num">${art.comments}</span></span>
          </div>
        </div>
      </article>
    `;
  }

  // 卡片還沒渲染出來前的骨架屏（形狀比照 .article 的封面＋標題＋摘要＋作者列）
  function articleSkeletonHTML() {
    return `
      <article class="article article-skeleton">
        <div class="skeleton" style="height:140px;border-radius:0;"></div>
        <div class="body">
          <div class="skeleton skeleton-text" style="width:30%;height:20px;margin-bottom:10px;"></div>
          <div class="skeleton skeleton-text" style="width:90%;height:20px;"></div>
          <div class="skeleton skeleton-text" style="width:65%;height:20px;margin-bottom:14px;"></div>
          <div class="skeleton skeleton-text" style="width:100%;"></div>
          <div class="skeleton skeleton-text" style="width:55%;margin-bottom:16px;"></div>
          <div style="display:flex;align-items:center;gap:10px;padding-top:14px;border-top:1px solid var(--line);">
            <div class="skeleton" style="width:28px;height:28px;border-radius:50%;flex-shrink:0;"></div>
            <div class="skeleton skeleton-text" style="width:40%;margin:0;"></div>
          </div>
        </div>
      </article>
    `;
  }

  // ── Masonry：卡片各自高度、不強制拉齊（跟蝦皮等電商的商品牆一樣），
  // 依序把下一張卡放進目前最短的欄位，盡量保留原本的新舊排序 ──
  function layoutMasonry(container, htmlList, evenSplit) {
    const colCount = window.matchMedia('(max-width: 1000px)').matches ? 1 : 2;
    container.innerHTML = '';
    const cols = [];
    for (let i = 0; i < colCount; i++) {
      const col = document.createElement('div');
      col.className = 'masonry-col';
      container.appendChild(col);
      cols.push(col);
    }
    htmlList.forEach((html, idx) => {
      const wrap = document.createElement('div');
      wrap.innerHTML = html.trim();
      const el = wrap.firstElementChild;
      let target;
      if (evenSplit || colCount === 1) {
        target = cols[idx % colCount];
      } else {
        target = cols.reduce((shortest, col) => col.offsetHeight < shortest.offsetHeight ? col : shortest, cols[0]);
      }
      target.appendChild(el);
    });
  }

  const SKELETON_COUNT = 6;

  async function renderArticles() {
    const container = document.getElementById('articleList');
    if (!container) return;

    // 先鋪一輪骨架屏，讓使用者知道內容正在載入
    layoutMasonry(container, Array(SKELETON_COUNT).fill(0).map(articleSkeletonHTML), true);

    await fetchArticles();

    const secLabel = document.getElementById('articlesSecLabel');

    if (!ARTICLES.length) {
      if (secLabel) secLabel.style.display = 'none';
      container.innerHTML = `
        <div class="article-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2 H6 a2 2 0 0 0-2 2 V20 a2 2 0 0 0 2 2 H18 a2 2 0 0 0 2-2 V8 Z"/>
            <path d="M14 2 V8 H20"/>
          </svg>
          <p>${currentCategoryId ? '這個分類目前還沒有文章，換個分類看看吧！' : '目前還沒有攻略文章，成為第一個發佈的人吧！'}</p>
        </div>
      `;
      return;
    }

    if (secLabel) secLabel.style.display = '';
    const countPill = document.getElementById('articlesCountPill');
    if (countPill) countPill.textContent = ARTICLES_TOTAL.toLocaleString() + ' 篇 · 依發佈時間';

    layoutMasonry(container, ARTICLES.map(articleCardHTML), false);
    attachSaveButtons();
    attachLikeButtons();
  }

  // 數字變動時「由下往上」滾動替換：舊數字往上滑出＋淡出，新數字從正下方滑進定位，
  // 取代直接覆蓋文字造成的突兀跳動。el 必須是只包含純文字數字/逗號的 inline 元素
  // （views-num/likes-num/comments-num），動畫進行中若又收到新值，直接跳過動畫
  // 改成立即覆蓋，避免同一顆卡片在短時間內被疊加觸發兩次滾動動畫互相打架。
  function rollNumberTo(el, newValue) {
    if (!el || el.textContent === newValue) return;
    if (el.dataset.rolling === '1') { el.textContent = newValue; return; }
    el.dataset.rolling = '1';

    const oldValue = el.textContent;
    const height = el.offsetHeight || 16;
    el.classList.add('roll-wrap');
    el.style.height = height + 'px';
    el.style.lineHeight = height + 'px';
    el.innerHTML = '<span class="roll-old">' + oldValue + '</span><span class="roll-new">' + newValue + '</span>';

    requestAnimationFrame(() => el.classList.add('animating'));

    setTimeout(() => {
      el.textContent = newValue;
      el.classList.remove('roll-wrap', 'animating');
      el.style.height = '';
      el.style.lineHeight = '';
      delete el.dataset.rolling;
    }, 450);
  }

  // 每 10 秒重打一次文章列表，比對每篇文章的閱讀/按讚/留言數，有變動的用
  // rollNumberTo() 做滾動動畫；只更新卡片裡的數字節點，不重建整個 masonry
  // （避免整批卡片重新渲染打斷使用者正在操作的收藏/喜歡按鈕狀態）。
  async function pollArticleStats() {
    if (!window.schoolBackendService || !document.getElementById('articleList')) return;
    try {
      const params = { limit: 20, sort: 'latest' };
      if (currentCategoryId) params.category = currentCategoryId;
      if (currentTagName) params.tag = currentTagName;
      const res = await window.schoolBackendService.getArticles(params);
      const items = (res && res.data && res.data.items) || [];
      items.forEach(item => {
        const card = document.querySelector('.article[data-article-id="' + CSS.escape(item.id) + '"]');
        if (!card) return;
        rollNumberTo(card.querySelector('.views-num'), (item.viewCount || 0).toLocaleString());
        rollNumberTo(card.querySelector('.likes-num'), (item.likeCount || 0).toLocaleString());
        rollNumberTo(card.querySelector('.comments-num'), (item.reviewCount || 0).toLocaleString());
      });
    } catch (error) {
      console.error('輪詢文章數據失敗：', error);
    }
  }
  setInterval(pollArticleStats, 10000);

  let _resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(() => {
      const container = document.getElementById('articleList');
      if (!container || !ARTICLES.length) return;
      layoutMasonry(container, ARTICLES.map(articleCardHTML), false);
      attachSaveButtons();
      attachLikeButtons();
    }, 200);
  });

  // ── 側邊欄／手機版「文章分類」列表 ──
  // 原本 .cat-list / .mobile-cat-bar 是寫死的分類名稱 + 假數字，改成讀
  // GET /api/school/categories 拿真正的分類與 id，每個分類的篇數則用
  // GET /api/school/articles?category=X&limit=1 的 total 欄位湊出來（分類 API
  // 本身不回傳篇數，只能逐一問文章列表）。點擊會換成真正的分類篩選，重新打
  // getArticles({category}) 篩文章列表，不是純裝飾的連結。
  async function renderCategorySidebar() {
    const desktopList = document.querySelector('.cat-list');
    const mobileList = document.querySelector('.mobile-cat-bar');
    if (!desktopList && !mobileList) return;
    if (!window.schoolBackendService) return;

    let categories = [];
    try {
      const res = await window.schoolBackendService.getCategories();
      categories = (res && res.data) || [];
    } catch (e) {
      console.error('取得文章分類失敗：', e);
      return;
    }

    const entries = [{ id: '', name: '全部文章' }, ...categories.map(c => ({ id: c.id, name: c.name }))];
    const counts = await Promise.all(entries.map(async e => {
      try {
        const res = await window.schoolBackendService.getArticles(e.id ? { category: e.id, limit: 1 } : { limit: 1 });
        return (res && res.data && res.data.total) || 0;
      } catch {
        return 0;
      }
    }));

    const html = entries.map((e, i) =>
      `<a href="#" data-cat-id="${esc(e.id)}" class="${e.id === currentCategoryId ? 'on' : ''}">${esc(e.name)} <span class="count">${counts[i].toLocaleString()}</span></a>`
    ).join('');

    if (desktopList) desktopList.innerHTML = html;
    if (mobileList) mobileList.innerHTML = html;

    [desktopList, mobileList].forEach(list => {
      if (!list) return;
      list.addEventListener('click', e => {
        const a = e.target.closest('[data-cat-id]');
        if (!a) return;
        e.preventDefault();
        currentCategoryId = a.dataset.catId;
        list.parentElement.querySelectorAll('[data-cat-id]').forEach(el => el.classList.toggle('on', el === a));
        document.querySelectorAll('.cat-list [data-cat-id], .mobile-cat-bar [data-cat-id]').forEach(el => {
          el.classList.toggle('on', el.dataset.catId === currentCategoryId);
        });
        renderArticles();
      });
    });
  }
  document.addEventListener('DOMContentLoaded', renderCategorySidebar);

  // ── 側邊欄「熱門標籤」── 原本 .tag-list 是寫死的假標籤連結，改讀
  // GET /api/school/tags（依 useCount 由高到低排序），點擊比照分類篩選，
  // 加上 tag 條件重新打 getArticles({tag})。school.html 跟 school-article.html
  // 都有同一份 .tag-list 側欄結構，這裡一次處理兩邊。
  async function renderTagSidebar() {
    const lists = document.querySelectorAll('.tag-list');
    if (!lists.length || !window.schoolBackendService) return;

    let tags = [];
    try {
      const res = await window.schoolBackendService.getTags({ limit: 20 });
      tags = ((res && res.data) || []).slice().sort((a, b) => (b.useCount || 0) - (a.useCount || 0));
    } catch (e) {
      console.error('取得熱門標籤失敗：', e);
      return;
    }

    const html = tags.map(t =>
      `<a href="#" data-tag-name="${esc(t.name)}" class="${t.name === currentTagName ? 'on' : ''}">#${esc(t.name)}</a>`
    ).join('');

    lists.forEach(list => {
      list.innerHTML = html;
      list.addEventListener('click', e => {
        const a = e.target.closest('[data-tag-name]');
        if (!a) return;
        e.preventDefault();
        currentTagName = currentTagName === a.dataset.tagName ? '' : a.dataset.tagName;
        document.querySelectorAll('.tag-list [data-tag-name]').forEach(el => {
          el.classList.toggle('on', el.dataset.tagName === currentTagName);
        });
        renderArticles();
      });
    });
  }
  document.addEventListener('DOMContentLoaded', renderTagSidebar);

  document.addEventListener('DOMContentLoaded', renderArticles);
})();

// ── Glass card scroll animation ──
(function () {
  const glassCards = document.querySelectorAll('.glass-card');
  if (glassCards.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  glassCards.forEach(card => observer.observe(card));
})();

// ── Navbar login with avatar dropdown ──
(function () {
  const loginBtn = document.getElementById('loginBtn');
  const userChip = document.getElementById('userChip');

  if (!loginBtn || !userChip) return;

  const AUTH_KEY = 'th_cg_auth';
  const USERNAME_KEY = 'th_cg_username';

  // 創建下拉選單（版面比照校園攻略站下拉選單 .drop-menu，樣式定義在 school.css）
  const dropdown = document.createElement('div');
  dropdown.className = 'user-dropdown';
  dropdown.innerHTML = `
    <div class="user-dropdown-identity">
      <div class="user-dropdown-name" id="dropdownUserName">載入中…</div>
      <div class="user-dropdown-mode-row">
        <span class="user-dropdown-mode-label">半實名顯示</span>
        <button class="tgl" type="button" id="dropdownModeToggle" aria-label="是否開啟半實名顯示" disabled></button>
      </div>
    </div>
    <div class="user-dropdown-sep"></div>
    <a href="school-profile.html" class="user-dropdown-item">我的資訊</a>
    <button type="button" class="user-dropdown-item theme-toggle-trigger" id="themeToggleAvatar" title="切換深色模式">
      <span class="theme-toggle-label">深色模式</span>
      <i class="ti ti-moon theme-toggle-icon"></i>
    </button>
    <div class="user-dropdown-sep"></div>
    <a href="#" class="user-dropdown-item" id="logoutLink">登出</a>
  `;

  userChip.style.position = 'relative';
  userChip.appendChild(dropdown);

  // 下拉選單是動態插入的，套用當下的深色模式狀態（school-theme.js 在它出現前就先套過主題了）
  const avatarThemeIcon = dropdown.querySelector('.theme-toggle-icon');
  const avatarThemeLabel = dropdown.querySelector('.theme-toggle-label');
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (avatarThemeIcon) avatarThemeIcon.className = 'theme-toggle-icon ti ' + (isDark ? 'ti-sun' : 'ti-moon');
  // 標籤顯示「切換後會變成的模式」，而不是目前所在的模式
  if (avatarThemeLabel) avatarThemeLabel.textContent = isDark ? '淺色模式' : '深色模式';

  // 登入時把深色模式切換鈕藏進頭像選單，登出時放回 nav 外層
  const themeToggleOuter = document.getElementById('themeToggle');

  const isAuthed = localStorage.getItem(AUTH_KEY) === '1';
  const username = localStorage.getItem(USERNAME_KEY) || '王同學';

  // ── 姓名身份顯示 + 半實名/暱稱切換 ──
  // 跟 school-profile.html 的 id-card 共用同一組跨 script 全域狀態慣例（見該頁
  // 「前台顯示名稱」那段 IIFE：window.__schoolAccountName/__schoolDisplayNameMode/
  // updateIdCardNameDisplay/__publicSemiRealName）。這裡包一層 updateIdCardNameDisplay，
  // 讓 profile 頁與這個下拉選單互相同步；profile 頁本身仍會各自呼叫一次 getAccountMe/
  // getMySettings，所以只有「同時在 school-profile.html」這一種情況會重複打 API 兩次，
  // 其餘頁面都只有這裡打一次。
  const dropdownNameEl = dropdown.querySelector('#dropdownUserName');
  const dropdownModeBtn = dropdown.querySelector('#dropdownModeToggle');

  // school-profile.html 沒有串「真實姓名」欄位的 API，半實名目前仍是前端 mock
  // 佔位字（見 memory: school_api_doc_gaps.md #3）。這裡複製同一套規則，只在
  // window.__publicSemiRealName（profile 頁才有，含使用者實際選字結果）不存在時
  // 當作 fallback。
  function computeSemiRealName(nameRevealIndex) {
    const FULL = '葉潔頤';
    const SUFFIX = '同學';
    const chars = FULL.split('');
    const idx = (typeof nameRevealIndex === 'number' && nameRevealIndex >= 0 && nameRevealIndex < chars.length) ? nameRevealIndex : 0;
    return chars[idx] + SUFFIX;
  }

  function renderDropdownIdentity() {
    if (!dropdownNameEl) return;
    const mode = window.__schoolDisplayNameMode;
    dropdownNameEl.textContent = mode === 'SEMI_REAL'
      ? (typeof window.__publicSemiRealName === 'function' ? window.__publicSemiRealName() : computeSemiRealName(window.__schoolNameRevealIndex))
      : (window.__schoolAccountName || username);
    if (dropdownModeBtn) {
      dropdownModeBtn.disabled = !mode;
      dropdownModeBtn.classList.toggle('on', mode === 'SEMI_REAL');
    }
  }

  const prevUpdateIdCard = typeof window.updateIdCardNameDisplay === 'function' ? window.updateIdCardNameDisplay : null;
  window.updateIdCardNameDisplay = function () {
    if (prevUpdateIdCard) prevUpdateIdCard();
    renderDropdownIdentity();
  };

  if (dropdownModeBtn) {
    dropdownModeBtn.addEventListener('click', async function (e) {
      e.stopPropagation();
      if (dropdownModeBtn.disabled) return;
      const prevMode = window.__schoolDisplayNameMode;
      const nextMode = prevMode === 'SEMI_REAL' ? 'NICKNAME' : 'SEMI_REAL';
      // 樂觀更新：先切畫面，失敗才退回（跟 school-profile.html 的 dnmToggle 同一套模式）
      window.__schoolDisplayNameMode = nextMode;
      window.updateIdCardNameDisplay();
      dropdownModeBtn.disabled = true;
      try {
        await window.schoolBackendService.updateMySettings({ displayNameMode: nextMode });
      } catch (error) {
        window.__schoolDisplayNameMode = prevMode;
        window.updateIdCardNameDisplay();
        AppModal.fire({ icon: 'error', title: '更新失敗', text: error.message || '請稍後再試' });
      } finally {
        dropdownModeBtn.disabled = !window.__schoolDisplayNameMode;
      }
    });
  }

  let identityLoaded = false;
  async function loadIdentity() {
    if (identityLoaded || !window.schoolBackendService) return;
    identityLoaded = true;
    try {
      const [meRes, settingsRes] = await Promise.all([
        window.schoolBackendService.getAccountMe(),
        window.schoolBackendService.getMySettings()
      ]);
      const me = (meRes && meRes.data) || {};
      const settings = (settingsRes && settingsRes.data) || {};
      window.__schoolAccountName = me.name || username;
      window.__schoolNameRevealIndex = settings.nameRevealIndex;
      window.__schoolDisplayNameMode = settings.displayNameMode || me.displayNameMode || 'NICKNAME';
      window.updateIdCardNameDisplay();
    } catch (error) {
      identityLoaded = false;
      console.error('載入身份資訊失敗：', error);
    }
  }

  function applyAuth(loggedIn) {
    loginBtn.style.display = loggedIn ? 'none' : '';
    userChip.style.display = loggedIn ? 'block' : 'none';
    dropdown.classList.remove('open');
    if (themeToggleOuter) themeToggleOuter.style.display = loggedIn ? 'none' : '';
    if (loggedIn) loadIdentity();
  }

  applyAuth(isAuthed);

  loginBtn.addEventListener('click', function () {
    // 模擬登入，設置用戶名
    localStorage.setItem(AUTH_KEY, '1');
    localStorage.setItem(USERNAME_KEY, '王同學');
    applyAuth(true);
    location.reload();
  });

  userChip.addEventListener('click', function (e) {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });

  document.getElementById('logoutLink').addEventListener('click', function (e) {
    e.preventDefault();
    AppModal.fire({
      title: '確定要登出?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '登出',
      cancelButtonText: '取消',
      customClass: {
        title: 'swal-logout-title',
        htmlContainer: 'swal-logout-text'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.setItem(AUTH_KEY, '0');
        localStorage.removeItem(USERNAME_KEY);
        applyAuth(false);
        dropdown.classList.remove('open');
        location.reload();
      }
    });
  });

  document.addEventListener('click', function (e) {
    if (!userChip.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });
})();

// ── Wishpool with real data ──
// 跟 shop.js 首頁「猜你喜歡的願望」同一支 API：wpBackendService.listWishes(1)
// → res.data.wishes，欄位是 itemName／owner.photoURL（不是扁平的 wish.photoURL）。
(function () {
  function initWishpool() {
    const container = document.querySelector('.wp-stage-school');
    if (!container) return;

    let wishes = [];
    if (window.wpBackendServiceInstance) {
      window.wpBackendServiceInstance.listWishes(1).then(response => {
        wishes = (response.data?.wishes || []).filter(w => w.itemName).slice(0, 20);
        renderWishpool(wishes);
      }).catch(e => {
        console.warn('Failed to load wishpool:', e);
        renderWishpool([]);
      });
    } else {
      renderWishpool([]);
    }

    function renderWishpool(wishes) {
      const SLOGANS = [
        { _isSlogan: true, id: 's1', _sloganText: '快來許願！', _sloganBg: '#004b97', _sloganColor: '#fff' },
        { _isSlogan: true, id: 's2', _sloganText: '賣家等你', _sloganBg: '#f3e3b5', _sloganColor: '#004b97' },
        { _isSlogan: true, id: 's3', _sloganText: '說出你的需求', _sloganBg: '#4a85c4', _sloganColor: '#fff' },
        { _isSlogan: true, id: 's4', _sloganText: '找到好物', _sloganBg: '#abdad5', _sloganColor: '#004b97' },
        { _isSlogan: true, id: 's5', _sloganText: '許個願吧', _sloganBg: '#7eb8d8', _sloganColor: '#fff' },
      ].map(s => ({ ...s, _size: Math.floor(Math.random() * 25) + 65, _marginTop: Math.floor(Math.random() * 160) - 80 }));

      // 真實願望物件本身沒有 _size/_marginTop，一定要在這裡補上：.disc-school 的
      // width/height 是 var(--d, 84px)，--d 若被設成 "undefinedpx" 這種無法解析的
      // 值，CSS 會直接判定整條 width 宣告失效、retreat 回 auto，而不是吃到 84px
      // 這個 fallback（fallback 只在「完全沒設定這個自訂屬性」時才生效）。auto 寬高
      // 疊上 img 的 54% 百分比寬高又解不出基準，最後整張原圖會用原始像素尺寸撐開，
      // 也就是願望照片「跑版、超大」的真正原因。
      const sizedWishes = wishes.map(w => ({
        ...w,
        _size: Math.floor(Math.random() * 25) + 65,
        _marginTop: Math.floor(Math.random() * 160) - 80,
      }));

      const displayWishes = sizedWishes.length <= 3
        ? SLOGANS.flatMap((s, i) => [s, ...(sizedWishes[i % sizedWishes.length] ? [sizedWishes[i % sizedWishes.length]] : [])])
        : sizedWishes;

      const track = container.querySelector('.track-school');
      if (!track) return;

      track.innerHTML = '';
      [...displayWishes, ...displayWishes, ...displayWishes, ...displayWishes].forEach((wish) => {
        const b = document.createElement('div');
        b.className = 'bub-school';
        b.style.setProperty('--y', wish._marginTop + 'px');
        b.style.animationDelay = (Math.random() * -5).toFixed(2) + 's';
        b.style.animationDuration = (4.4 + Math.random() * 1.6).toFixed(2) + 's';

        if (wish._isSlogan) {
          const disc = document.createElement('div');
          disc.className = 'disc-school msg';
          disc.style.setProperty('--d', wish._size + 'px');
          disc.style.background = wish._sloganBg;
          disc.style.color = wish._sloganColor;
          disc.style.fontSize = (wish._size >= 92 ? 15 : 13) + 'px';
          disc.textContent = wish._sloganText;
          b.appendChild(disc);
        } else {
          const hasPhoto = !!(wish.photoURL && wish.photoURL !== 'null');
          const disc = document.createElement('div');
          disc.className = 'disc-school icon' + (hasPhoto ? ' has-photo' : '');
          disc.style.setProperty('--d', wish._size + 'px');
          const img = document.createElement('img');
          // 願望本身的照片是扁平欄位 wish.photoURL（跟 wishpool.js 的 wn-photo/wb-photo
          // 用同一個欄位），不是 wish.owner.photoURL——owner.photoURL 是許願者的大頭貼，
          // 用在 shop.js 首頁那個完全不同的「許願跑馬燈」widget，兩者不能混用。
          img.src = hasPhoto ? wish.photoURL : '../svg/bigwish.svg';
          img.alt = wish.itemName || '許願';
          // 有真實照片時用 .has-photo 滿版鋪滿圓形泡泡（object-fit:cover）；
          // 沒有照片用預設 fallback 圖示時維持原本縮在中間 54% 的小圖示排版，
          // 兩者用不同 class 區分，不要用 inline style 蓋掉 CSS 比例。
          img.onerror = function() { this.src = '../svg/bigwish.svg'; };
          disc.appendChild(img);
          b.appendChild(disc);

          const cap = document.createElement('span');
          cap.className = 'cap-school';
          cap.textContent = wish.itemName || '新許願';
          b.appendChild(cap);
        }

        b.addEventListener('click', () => {
          if (!wish._isSlogan && wish.id) {
            sessionStorage.setItem('focusWishId', String(wish.id));
          }
          location.href = '../wishpool/wishpool.html#wishpool';
        });

        track.appendChild(b);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWishpool);
  } else {
    initWishpool();
  }
})();

// ── Advertisement Carousel（桌機 .ad-carousel 與手機 .ad-carousel-mobile 各自獨立輪播）──
(function () {
  document.querySelectorAll('.ad-carousel, .ad-carousel-mobile').forEach(function (carousel) {
    const items = carousel.querySelectorAll('.carousel-item');
    const indicators = carousel.querySelectorAll('.carousel-indicators .indicator');
    if (items.length < 2) return;

    let currentSlide = 0;
    let autoplayTimer = null;

    function goToSlide(n) {
      currentSlide = ((n % items.length) + items.length) % items.length;

      items.forEach(item => item.classList.remove('active'));
      indicators.forEach(ind => ind.classList.remove('active'));

      items[currentSlide].classList.add('active');
      if (indicators[currentSlide]) indicators[currentSlide].classList.add('active');
    }

    function nextSlide() {
      goToSlide(currentSlide + 1);
    }

    function startAutoplay() {
      autoplayTimer = setInterval(nextSlide, 5000);
    }

    function stopAutoplay() {
      clearInterval(autoplayTimer);
    }

    indicators.forEach(indicator => {
      indicator.addEventListener('click', function () {
        goToSlide(parseInt(this.dataset.slide, 10));
        stopAutoplay();
        startAutoplay();
      });
    });

    carousel.addEventListener('mouseenter', stopAutoplay);
    carousel.addEventListener('mouseleave', startAutoplay);

    startAutoplay();
  });
})();

// ── 通知面板（校園攻略站）──
// 比照 default.js 的做法「動態注入」到統一 navbar，三頁共用本檔即可，
// 無需在每頁 HTML 重複貼 markup。外觀沿用 default.css 的 .notif-* 樣式。
(function () {
  function initSchoolNotif() {
    const right = document.querySelector('.nav .right');
    if (!right || document.getElementById('schoolNotifWrap')) return;

    // demo 通知資料（校園攻略站情境）
    const NOTIFS = [
      { unread: true,  title: '王同學 回覆了你的攻略', body: '「備審改版前後對比太實用了，謝謝學姊！」', time: '3 分鐘前' },
      { unread: true,  title: '范同學 回覆了你的留言', body: '交大版本整理中，下個月上架，追蹤就會收到通知！', time: '1 小時前' },
      { unread: true,  title: '你關注的作者發佈了新攻略', body: '《推甄面試最常被問的 12 題與我的回答框架》', time: '3 小時前' },
      { unread: false, title: '本週攻略成效', body: '你的攻略這週被閱讀 214 次、獲得 18 個喜歡。', time: '1 天前' },
      { unread: false, title: '系統通知', body: '你解鎖的攻略已可永久閱讀，隨時回來複習。', time: '2 天前' },
    ];

    const avatar = '../image/default-avatar.webp';
    const itemsHtml = NOTIFS.map(n => `
      <div class="notif-item${n.unread ? ' notif-unread' : ''}">
        <img src="${avatar}" class="notif-avatar" alt="通知" onerror="this.onerror=null;this.src='../webP/default-avatar.webp'">
        <div class="notif-body">
          <div class="notif-text"><strong>${n.title}</strong></div>
          <div class="notif-text notif-content">${n.body}</div>
          <div class="notif-time">${n.time}</div>
        </div>
      </div>`).join('');

    // 鈴鐺：插在登入鈕之前
    const bell = document.createElement('div');
    bell.className = 'notif-bell-wrap';
    bell.id = 'schoolNotifWrap';
    bell.innerHTML = `
      <button class="notif-bell-btn" id="schoolNotifBtn" type="button" aria-label="通知">
        <i class="fa-solid fa-bell"></i>
      </button>
      <span class="notif-badge" id="schoolNotifBadge">0</span>`;
    right.insertBefore(bell, right.firstChild);

    // 面板 + 遮罩
    document.body.insertAdjacentHTML('beforeend', `
      <div class="notif-backdrop" id="schoolNotifBackdrop"></div>
      <div class="notif-panel" id="schoolNotifPanel">
        <div class="notif-header">
          <span class="notif-title"><i class="ti ti-bell me-2"></i>通知</span>
          <div class="notif-header-actions">
            <button class="notif-read-all-btn" id="schoolNotifReadAll">全部已讀</button>
            <button class="notif-close" id="schoolNotifClose" aria-label="關閉通知"><i class="ti ti-x"></i></button>
          </div>
        </div>
        <div class="notif-list" id="schoolNotifList">${itemsHtml}</div>
      </div>`);

    const panel = document.getElementById('schoolNotifPanel');
    const backdrop = document.getElementById('schoolNotifBackdrop');
    const badge = document.getElementById('schoolNotifBadge');
    const list = document.getElementById('schoolNotifList');

    function updateBadge() {
      const n = list.querySelectorAll('.notif-item.notif-unread').length;
      if (n > 0) { badge.textContent = n; badge.classList.remove('d-none'); }
      else { badge.classList.add('d-none'); }
    }
    function openPanel() { panel.classList.add('open'); backdrop.classList.add('open'); }
    function closePanel() { panel.classList.remove('open'); backdrop.classList.remove('open'); }

    document.getElementById('schoolNotifBtn').addEventListener('click', openPanel);
    document.getElementById('schoolNotifClose').addEventListener('click', closePanel);
    backdrop.addEventListener('click', closePanel);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePanel(); });
    document.getElementById('schoolNotifReadAll').addEventListener('click', () => {
      list.querySelectorAll('.notif-item.notif-unread').forEach(el => el.classList.remove('notif-unread'));
      updateBadge();
    });
    list.addEventListener('click', (e) => {
      const item = e.target.closest('.notif-item');
      if (item && item.classList.contains('notif-unread')) { item.classList.remove('notif-unread'); updateBadge(); }
    });

    updateBadge();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSchoolNotif);
  else initSchoolNotif();
})();
