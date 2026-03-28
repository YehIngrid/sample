// ── Mock data（之後換成後端 API）──
const MOCK_ARTICLES = [
  {
    id: 1, featured: true,
    cat: 'newbie', title: '中興大學新生必看：開學前完整準備清單',
    excerpt: '從選課、住宿到日常用品，第一次離家的你一定要看！整理了所有入學前需要準備的事項，讓你開學第一週不手忙腳亂。',
    author: '王小明', authorEmoji: '🎓', date: '3小時前', readTime: '8分鐘', likes: 128, comments: 32,
    emoji: '🏫', tags: ['新生', '選課', '住宿'],
  },
  {
    id: 2, featured: false,
    cat: 'study', title: '期末考前兩週：高效複習策略完整版',
    excerpt: '分享如何在短時間內有效複習並提高考試成績，包含番茄鐘工作法、記憶宮殿技巧與考古題解析方法。',
    author: '陳小雨', authorEmoji: '📖', date: '1天前', readTime: '5分鐘', likes: 89, comments: 14,
    emoji: '📚', tags: ['讀書方法', '期末考', '效率'],
  },
  {
    id: 3, featured: false,
    cat: 'life', title: '宿舍收納神技：小空間大利用的15個技巧',
    excerpt: '住宿生必備！從床下空間到衣櫥分層，用不到500元讓你的宿舍煥然一新，還附上好物推薦清單。',
    author: '林美美', authorEmoji: '🏠', date: '2天前', readTime: '4分鐘', likes: 203, comments: 41,
    emoji: '🛏️', tags: ['宿舍', '收納', '生活好物'],
  },
  {
    id: 4, featured: false,
    cat: 'career', title: '大三就要開始：台中在地實習求職攻略',
    excerpt: '整理了中興大學周邊企業與台中主要科技廠的實習申請管道，附上履歷撰寫、面試準備一手心得。',
    author: '張大偉', authorEmoji: '💼', date: '3天前', readTime: '7分鐘', likes: 156, comments: 28,
    emoji: '💻', tags: ['實習', '求職', '台中'],
  },
  {
    id: 5, featured: false,
    cat: 'trade', title: '二手交易保護自己：防詐騙三步驟',
    excerpt: '身為拾貨寶庫的老用戶，整理了這幾年遇過的各種情況，教你如何辨識異常賣家、保障交易安全。',
    author: '黃阿成', authorEmoji: '🛡️', date: '4天前', readTime: '3分鐘', likes: 312, comments: 57,
    emoji: '🔒', tags: ['二手交易', '防詐', '安全'],
  },
  {
    id: 6, featured: false,
    cat: 'study', title: '選課必看：這幾門通識課CP值超高',
    excerpt: '根據歷屆同學的課程評論整理，這幾門通識課不但有趣還容易拿分，每學期秒殺的秘密終於公開！',
    author: '蔡文星', authorEmoji: '⭐', date: '5天前', readTime: '4分鐘', likes: 445, comments: 88,
    emoji: '🗓️', tags: ['選課', '通識', '課程評價'],
  },
  {
    id: 7, featured: false,
    cat: 'life', title: '台中美食地圖：中興大學周邊必吃30間',
    excerpt: '在地四年的美食踩點報告！從銅板價到特殊場合的餐廳，依照距離和預算完整分類，附上Google地圖連結。',
    author: '吳食神', authorEmoji: '🍜', date: '6天前', readTime: '6分鐘', likes: 521, comments: 95,
    emoji: '🍱', tags: ['美食', '台中', '校園周邊'],
  },
  {
    id: 8, featured: false,
    cat: 'newbie', title: '中興大學系館地圖：新生第一週不迷路',
    excerpt: '第一次到興大很容易找不到教室？這份手繪風格地圖配上文字說明，讓你快速搞定各系館位置。',
    author: '何地圖', authorEmoji: '🗺️', date: '1週前', readTime: '3分鐘', likes: 187, comments: 33,
    emoji: '🗺️', tags: ['新生', '地圖', '校園'],
  },
  {
    id: 9, featured: false,
    cat: 'career', title: '大學四年規劃建議：從大一就要做的事',
    excerpt: '現在大四回頭看，這些事情如果大一就做，現在會輕鬆很多。包含證照、社團、實習、人脈的時程規劃。',
    author: '劉規劃', authorEmoji: '📋', date: '1週前', readTime: '9分鐘', likes: 672, comments: 104,
    emoji: '🎯', tags: ['生涯規劃', '大學生活', '建議'],
  },
  {
    id: 10, featured: false,
    cat: 'trade', title: '二手教科書怎麼買最省？完整攻略',
    excerpt: '每本教科書動輒四五百元，這篇告訴你如何在拾貨寶庫、Dcard、PTT找到最便宜的二手教科書，還有如何快速出手。',
    author: '省錢王', authorEmoji: '💰', date: '2週前', readTime: '5分鐘', likes: 389, comments: 62,
    emoji: '📗', tags: ['二手教科書', '省錢', '交易'],
  },
];

const MOCK_TAGS = ['選課', '新生', '宿舍', '實習', '二手教科書', '讀書方法', '台中美食', '防詐騙', '通識', '求職', '期末考', '生涯規劃'];

const MOCK_AUTHORS = [
  { name: '劉規劃', emoji: '📋', articles: 12, desc: '生涯規劃達人' },
  { name: '吳食神', emoji: '🍜', articles: 8, desc: '台中美食踩點' },
  { name: '蔡文星', emoji: '⭐', articles: 15, desc: '選課情報王' },
  { name: '黃阿成', emoji: '🛡️', articles: 6, desc: '交易安全守護者' },
];

// ── State ──
let currentCat = 'all';
let currentSort = 'latest';
const PAGE_SIZE = 5;
let page = 1;

// ── Badge class map ──
const BADGE_CLASS = { study: 'badge-study', life: 'badge-life', career: 'badge-career', trade: 'badge-trade', newbie: 'badge-newbie', all: 'badge-all' };
const BADGE_LABEL = { study: '學習攻略', life: '生活指南', career: '實習求職', trade: '二手交易', newbie: '新生必看', all: '全部' };

// ── Filter & sort ──
function getFiltered() {
  let list = currentCat === 'all' ? MOCK_ARTICLES : MOCK_ARTICLES.filter(a => a.cat === currentCat);
  if (currentSort === 'hot') list = [...list].sort((a, b) => b.likes - a.likes);
  return list;
}

// ── Render featured ──
function renderFeatured() {
  const wrap = document.getElementById('featuredWrap');
  if (!wrap) return;
  const list = getFiltered();
  const art = list[0];
  if (!art) { wrap.innerHTML = ''; return; }
  wrap.innerHTML = `
    <a class="school-featured-card" href="#">
      <div class="school-featured-thumb">
        <div class="school-featured-thumb-placeholder">${art.emoji}</div>
      </div>
      <div class="school-featured-body">
        <div>
          <div class="school-featured-label">精選攻略</div>
          <span class="article-badge ${BADGE_CLASS[art.cat]}">${BADGE_LABEL[art.cat]}</span>
          <h2 class="school-featured-title">${art.title}</h2>
          <p class="school-featured-excerpt">${art.excerpt}</p>
        </div>
        <div class="article-meta">
          <span class="article-avatar" style="display:inline-flex;align-items:center;justify-content:center;font-size:0.85rem;">${art.authorEmoji}</span>
          <span class="article-author">${art.author}</span>
          <span class="article-meta-dot">·</span>
          <span>${art.date}</span>
          <span class="article-meta-dot">·</span>
          <span>${art.readTime}閱讀</span>
          <span class="article-meta-dot">·</span>
          <span class="article-likes"><i class="ti ti-heart-filled" style="font-size:0.9rem;"></i> ${art.likes}</span>
        </div>
      </div>
    </a>`;
}

// ── Render article list ──
function renderArticles(reset = true) {
  const container = document.getElementById('articleList');
  const empty = document.getElementById('emptyState');
  const loadMoreWrap = document.getElementById('loadMoreWrap');
  const countEl = document.getElementById('resultCount');
  if (!container) return;

  const list = getFiltered().slice(1); // skip featured
  const total = list.length;

  if (countEl) countEl.textContent = `共 ${total + 1} 篇`;

  if (total === 0 && !getFiltered()[0]) {
    container.innerHTML = '';
    empty?.classList.remove('d-none');
    loadMoreWrap?.style.setProperty('display', 'none', 'important');
    return;
  }
  empty?.classList.add('d-none');

  if (reset) { page = 1; container.innerHTML = ''; }

  const slice = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  slice.forEach(art => {
    const card = document.createElement('a');
    card.className = 'school-article-card';
    card.href = '#';
    card.innerHTML = `
      <div class="article-card-body">
        <span class="article-badge ${BADGE_CLASS[art.cat]}">${BADGE_LABEL[art.cat]}</span>
        <h3 class="article-card-title">${art.title}</h3>
        <p class="article-card-excerpt">${art.excerpt}</p>
        <div class="article-meta">
          <span class="article-avatar" style="display:inline-flex;align-items:center;justify-content:center;font-size:0.82rem;">${art.authorEmoji}</span>
          <span class="article-author">${art.author}</span>
          <span class="article-meta-dot">·</span>
          <span>${art.date}</span>
          <span class="article-meta-dot">·</span>
          <span>${art.readTime}閱讀</span>
          <span class="article-meta-dot">·</span>
          <span class="article-likes"><i class="ti ti-heart" style="font-size:0.9rem;"></i> ${art.likes}</span>
        </div>
      </div>
      <div class="article-thumb">${art.emoji}</div>`;
    container.appendChild(card);
  });

  const hasMore = page * PAGE_SIZE < total;
  if (hasMore) {
    loadMoreWrap?.style.removeProperty('display');
    loadMoreWrap?.style.setProperty('display', 'block');
  } else {
    loadMoreWrap?.style.setProperty('display', 'none', 'important');
  }
}

// ── Render sidebar tags ──
function renderTags() {
  const cloud = document.getElementById('tagCloud');
  if (!cloud) return;
  cloud.innerHTML = MOCK_TAGS.map(t =>
    `<a class="school-tag" href="#">#${t}</a>`
  ).join('');
}

// ── Render sidebar authors ──
function renderAuthors() {
  const list = document.getElementById('authorList');
  if (!list) return;
  list.innerHTML = MOCK_AUTHORS.map(a => `
    <div class="school-author-item">
      <div class="school-author-avatar">${a.emoji}</div>
      <div class="school-author-info">
        <div class="school-author-name">${a.name}</div>
        <div class="school-author-count">${a.desc} · ${a.articles} 篇</div>
      </div>
      <button class="school-follow-btn">追蹤</button>
    </div>`).join('');
}

// ── Render stats ──
function renderStats() {
  const totalEl = document.getElementById('totalArticles');
  const authEl = document.getElementById('totalAuthors');
  if (totalEl) totalEl.textContent = MOCK_ARTICLES.length;
  if (authEl) authEl.textContent = MOCK_AUTHORS.length;
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  renderFeatured();
  renderArticles();
  renderTags();
  renderAuthors();
  renderStats();

  // Hero category pills
  document.querySelectorAll('.school-hero-tag').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.school-hero-tag').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCat = btn.dataset.cat;
      renderFeatured();
      renderArticles();
    });
  });

  // Sort tabs
  document.querySelectorAll('.school-sort-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.school-sort-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSort = btn.dataset.sort;
      renderFeatured();
      renderArticles();
    });
  });

  // Load more
  document.getElementById('loadMoreBtn')?.addEventListener('click', () => {
    page++;
    renderArticles(false);
  });

  // Onboarding modal
  const modalEl = document.getElementById('onboardingModal');
  const bsModal = modalEl ? new bootstrap.Modal(modalEl) : null;
  const openOnboarding = () => bsModal?.show();

  document.getElementById('openOnboarding')?.addEventListener('click', openOnboarding);
  document.getElementById('sidebarCreateBtn')?.addEventListener('click', openOnboarding);
  document.getElementById('emptyCreateBtn')?.addEventListener('click', openOnboarding);
  document.getElementById('goWriteBtn')?.addEventListener('click', () => {
    bsModal?.hide();
    // TODO: 導向編輯器頁面
  });

  // FinisherHeader on modal open
  if (modalEl) {
    let finisherInit = false;
    modalEl.addEventListener('shown.bs.modal', () => {
      if (!finisherInit && typeof FinisherHeader !== 'undefined') {
        finisherInit = true;
        try {
          new FinisherHeader({
            count: 8, size: { min: 800, max: 1200, pulse: 0 },
            speed: { x: { min: 0.4, max: 2 }, y: { min: 0.4, max: 2 } },
            colors: { background: '#826cff', particles: ['#ff884d', '#90b6ff', '#3d40fc', '#ffffff'] },
            blending: 'lighten',
            opacity: { center: 0.5, edge: 0 },
            skew: -2, shapes: ['c'],
          });
        } catch (e) {}
      }
    });
  }
});
