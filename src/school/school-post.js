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
  document.getElementById('spBody').innerHTML = art.body || `<p>${art.excerpt}</p>`;

  // ── Tags ──
  document.getElementById('spTags').innerHTML = (art.tags || []).map(t =>
    `<a class="school-tag" href="school.html">#${t}</a>`).join('');

  // ── Like button ──
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

  // ── Share button ──
  document.getElementById('spShareBtn').addEventListener('click', () => {
    if (navigator.share) {
      navigator.share({ title: art.title, url: window.location.href });
    } else {
      navigator.clipboard?.writeText(window.location.href);
      const btn = document.getElementById('spShareBtn');
      btn.innerHTML = '<i class="ti ti-check"></i> 已複製';
      setTimeout(() => { btn.innerHTML = '<i class="ti ti-share"></i> 分享'; }, 2000);
    }
  });

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
