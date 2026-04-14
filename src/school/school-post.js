document.addEventListener('DOMContentLoaded', () => {
  const id = Number(new URLSearchParams(window.location.search).get('id'));
  const art = MOCK_ARTICLES.find(a => a.id === id);

  if (!art) {
    document.getElementById('spArticle').innerHTML = `
      <div class="sp-not-found">
        <img src="../svg/noschoolbook.svg" alt="找不到" style="width:80px;opacity:.45;">
        <h2>找不到這篇攻略</h2>
        <p>可能已被移除，或連結有誤</p>
        <a href="school.html" class="school-create-btn-sm mt-3 d-inline-block" style="text-decoration:none;">回到攻略站</a>
      </div>`;
    return;
  }

  // ── Title ──
  document.title = `${art.title} | TreasureHub 校園攻略站`;

  // ── Badge ──
  const badgeEl = document.getElementById('spBadge');
  badgeEl.className = `article-badge ${BADGE_CLASS[art.cat]}`;
  badgeEl.textContent = BADGE_LABEL[art.cat];

  // ── Title ──
  document.getElementById('spTitle').textContent = art.title;

  // ── Meta ──
  document.getElementById('spMeta').innerHTML = `
    <span class="article-avatar" style="display:inline-flex;align-items:center;justify-content:center;font-size:1rem;width:28px;height:28px;border-radius:50%;border:1.5px solid #d0d7e3;">${art.authorEmoji}</span>
    <span class="article-author">${art.author}</span>
    <span class="article-meta-dot">·</span>
    <span>${art.date}</span>
    <span class="article-meta-dot">·</span>
    <span>${art.readTime}閱讀</span>
    <span class="article-meta-dot">·</span>
    <span class="article-likes"><i class="ti ti-heart" style="font-size:0.9rem;"></i> ${art.likes}</span>`;

  // ── Body ──
  document.getElementById('spBody').innerHTML = DOMPurify.sanitize(art.body || `<p>${art.excerpt}</p>`);

  // ── TOC ──
  const bodyEl = document.getElementById('spBody');
  const tocList = document.getElementById('spTocList');
  const headings = bodyEl ? Array.from(bodyEl.querySelectorAll('h2, h3')) : [];
  if (tocList && headings.length > 0) {
    headings.forEach((h, i) => {
      if (!h.id) h.id = `sp-h-${i}`;
      const li = document.createElement('li');
      li.className = 'sp-toc-item';
      li.dataset.level = h.tagName === 'H3' ? '3' : '2';
      li.innerHTML = `<a href="#${h.id}">${h.textContent}</a>`;
      li.querySelector('a').addEventListener('click', e => {
        e.preventDefault();
        h.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      tocList.appendChild(li);
    });

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const id = entry.target.id;
        const item = tocList.querySelector(`[data-level] a[href="#${id}"]`)?.parentElement;
        if (item) item.classList.toggle('active', entry.isIntersecting);
      });
    }, { rootMargin: '-10% 0px -80% 0px' });

    headings.forEach(h => observer.observe(h));

    const panel = document.getElementById('spTocPanel');
    if (panel) panel.classList.add('open');
    document.getElementById('spTocPanelClose')?.addEventListener('click', () => {
      panel?.classList.toggle('collapsed');
    });
  }

  // ── Tags ──
  document.getElementById('spTags').innerHTML = (art.tags || []).map(t =>
    `<a class="school-tag" href="school.html">#${t}</a>`).join('');

  // ── Action Bar ──
  const actionBar = document.getElementById('spActionBar');
  if (actionBar) actionBar.style.display = 'flex';

  // Like
  let liked = false;
  let likes = art.likes;
  const likeBtn = document.getElementById('spLikeBtn');
  const likeCount = document.getElementById('spLikeCount');
  likeCount.textContent = likes;
  likeBtn.addEventListener('click', () => {
    liked = !liked;
    likes += liked ? 1 : -1;
    likeCount.textContent = likes;
    likeBtn.classList.toggle('liked', liked);
    likeBtn.querySelector('i').className = liked ? 'ti ti-heart-filled' : 'ti ti-heart';
  });

  // Share
  document.getElementById('spShareBtn').addEventListener('click', () => {
    if (navigator.share) {
      navigator.share({ title: art.title, url: window.location.href });
    } else {
      navigator.clipboard?.writeText(window.location.href);
      const btn = document.getElementById('spShareBtn');
      btn.innerHTML = '<i class="ti ti-check"></i>';
      setTimeout(() => { btn.innerHTML = '<i class="ti ti-share"></i>'; }, 2000);
    }
  });

  // Comment scroll
  document.getElementById('spCommentScrollBtn')?.addEventListener('click', () => {
    document.getElementById('spComments')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // Comments collapse toggle
  const commentsTitle = document.getElementById('spCommentsTitle');
  const commentsBody = document.getElementById('spCommentsBody');
  commentsTitle?.addEventListener('click', () => {
    const collapsed = commentsBody.classList.toggle('collapsed');
    commentsTitle.classList.toggle('collapsed', collapsed);
  });

  // ── Comments ──
  const STORAGE_KEY = `sp_comments_${art.id}`;
  let comments = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

  function updateCommentCount() {
    const n = comments.length;
    document.getElementById('spCommentCount').textContent = n;
    document.getElementById('spActionCommentCount').textContent = n;
  }

  function renderComments() {
    const list = document.getElementById('spCommentList');
    if (!list) return;
    if (comments.length === 0) {
      list.innerHTML = '<p class="sp-comment-empty">還沒有留言，來當第一個吧！</p>';
    } else {
      list.innerHTML = comments.map((c, i) => `
        <div class="sp-comment-item">
          <div class="sp-comment-avatar" style="background:${c.color}">${c.initials}</div>
          <div class="sp-comment-body">
            <div class="sp-comment-author">${c.author}<span class="sp-comment-time">${c.time}</span></div>
            <div class="sp-comment-text">${c.text.replace(/\n/g, '<br>')}</div>
          </div>
        </div>`).join('');
    }
    updateCommentCount();
  }

  const AVATAR_COLORS = ['#004b97','#1a9e6b','#c47a1e','#6c3cbf','#c0392b'];
  const commentInput = document.getElementById('spCommentInput');
  const formActions = document.getElementById('spCommentFormActions');

  commentInput?.addEventListener('focus', () => { if (formActions) formActions.style.display = 'flex'; });
  commentInput?.addEventListener('input', () => {
    commentInput.style.height = 'auto';
    commentInput.style.height = commentInput.scrollHeight + 'px';
  });
  document.getElementById('spCommentCancel')?.addEventListener('click', () => {
    commentInput.value = '';
    commentInput.style.height = 'auto';
    formActions.style.display = 'none';
    commentInput.blur();
  });
  document.getElementById('spCommentSubmit')?.addEventListener('click', () => {
    const text = commentInput.value.trim();
    if (!text) return;
    const names = ['同學A','同學B','同學C','你'];
    const name = names[Math.floor(Math.random() * 3)];
    comments.unshift({
      author: name,
      initials: name[0],
      color: AVATAR_COLORS[comments.length % AVATAR_COLORS.length],
      text,
      time: new Date().toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
    commentInput.value = '';
    commentInput.style.height = 'auto';
    formActions.style.display = 'none';
    renderComments();
  });

  renderComments();

  // ── Prev / Next ──
  const allIds = MOCK_ARTICLES.map(a => a.id);
  const idx = allIds.indexOf(art.id);
  const prevArt = idx > 0 ? MOCK_ARTICLES[idx - 1] : null;
  const nextArt = idx < MOCK_ARTICLES.length - 1 ? MOCK_ARTICLES[idx + 1] : null;
  const paginationEl = document.getElementById('spPagination');
  if (paginationEl && (prevArt || nextArt)) {
    paginationEl.innerHTML = `
      ${prevArt ? `
        <a class="sp-pagination-link sp-prev" href="school-post.html?id=${prevArt.id}">
          <span class="sp-pagination-label"><i class="ti ti-arrow-left"></i> 上一篇</span>
          <span class="sp-pagination-title">${prevArt.title}</span>
        </a>` : '<div class="sp-pagination-link sp-prev"></div>'}
      <div class="sp-pagination-divider"></div>
      ${nextArt ? `
        <a class="sp-pagination-link sp-next" href="school-post.html?id=${nextArt.id}">
          <span class="sp-pagination-label">下一篇 <i class="ti ti-arrow-right"></i></span>
          <span class="sp-pagination-title">${nextArt.title}</span>
        </a>` : '<div class="sp-pagination-link sp-next"></div>'}
    `;
  }

  // ── Related articles (same category, excluding current) ──
  const related = MOCK_ARTICLES.filter(a => a.cat === art.cat && a.id !== art.id).slice(0, 4);
  const relatedEl = document.getElementById('spRelated');
  if (related.length === 0) {
    relatedEl.innerHTML = '<p class="text-muted small p-3">暫無相關攻略</p>';
  } else {
    relatedEl.innerHTML = related.map(r => `
      <a class="sp-related-item" href="school-post.html?id=${r.id}">
        <div class="sp-related-title">${r.title}</div>
        <div class="sp-related-meta">${r.author} · ${r.date}</div>
      </a>`).join('');
  }
});
