// ── Navbar scroll cover effect ──
(function () {
  const nav = document.querySelector('.header_new');
  const hero = document.querySelector('.school-hero');
  if (!nav || !hero) return;
  function onScroll() {
    const heroBottom = hero.getBoundingClientRect().bottom;
    nav.classList.toggle('school-nav-scrolled', heroBottom <= 0);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

// ── State ──
let currentCat = 'all';
let currentSort = 'latest';
const PAGE_SIZE = 5;
let page = 1;

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
    <a class="school-featured-card" href="school-post.html?id=${art.id}">
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
    card.href = `school-post.html?id=${art.id}`;
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

  // Category tabs
  document.querySelectorAll('.school-cat-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.school-cat-tab').forEach(b => b.classList.remove('active'));
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
    window.location.href = 'school-editor.html';
  });

  // Search toggle
  const searchToggle = document.getElementById('searchToggle');
  const searchWrap = document.getElementById('schoolSearchWrap');
  const searchInput = document.getElementById('schoolSearchInput');
  if (searchToggle && searchWrap) {
    searchToggle.addEventListener('click', () => {
      const isOpen = searchWrap.classList.toggle('open');
      if (isOpen && searchInput) searchInput.focus();
    });
    document.addEventListener('click', (e) => {
      if (!searchWrap.contains(e.target) && !searchToggle.contains(e.target)) {
        searchWrap.classList.remove('open');
      }
    });
  }

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
