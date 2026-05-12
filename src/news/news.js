import BackendService from '../BackendService.js';

const backendService = new BackendService();
const ITEMS_PER_PAGE = 10;

let newsCache = [];    // items from last fetch
let currentPage = 1;
let totalItems  = 0;

// ── 工具 ──────────────────────────────────────────────────
function stripHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || '';
}

function extractPreview(html) {
  // 段落邊界轉換成換行，再取純文字
  const tmp = document.createElement('div');
  tmp.innerHTML = html
    .replace(/<\/?(p|h[1-6]|li|blockquote|div)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '');
  const lines = tmp.textContent
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);
  return lines.slice(0, 3).join('\n');
}

function fmtDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('zh-TW').replace(/\//g, '.');
}

// ── 列表 ──────────────────────────────────────────────────
async function loadNewsList(page = 1) {
  currentPage = page;
  const listEl = document.getElementById('newsList');
  listEl.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-secondary" role="status"></div></div>`;
  document.getElementById('pagination').innerHTML = '';
  document.getElementById('paginationWrap').style.display = 'none';

  try {
    const data  = await backendService.getNewsList(page, ITEMS_PER_PAGE);
    const items = data?.data?.news ?? data?.data?.items ?? data?.items ?? data?.data ?? [];
    const total = data?.data?.pagination?.totalItems ?? data?.data?.total ?? data?.total ?? items.length;

    newsCache  = items;
    totalItems = total;

    // 更新總數 badge
    const countEl = document.getElementById('newsCount');
    if (countEl) countEl.textContent = `共 ${total} 篇`;

    if (!items.length) {
      listEl.innerHTML = '<p class="news-empty">目前沒有公告</p>';
      return;
    }

    listEl.innerHTML = items.map((item, i) => {
      const preview = extractPreview(item.content ?? '');
      return `
        <div class="news-row" onclick="showNewsDetail('${item.id}',${i})">
          <div class="news-row-header">
            <span class="news-row-title">${item.title ?? '（未命名）'}</span>
            <span class="news-row-meta">
              <span class="news-row-date">${fmtDate(item.createdAt)}</span>
              <span class="news-row-views"><i class="fa-regular fa-eye"></i> ${item.viewCount ?? 0}</span>
            </span>
          </div>
          ${preview ? `<div class="news-row-preview">${preview}</div>` : ''}
        </div>`;
    }).join('');

    renderPagination(total, page);
  } catch (err) {
    listEl.innerHTML = `<p class="news-empty">載入失敗，請稍後再試</p>`;
  }
}

function renderPagination(total, page) {
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const wrap  = document.getElementById('paginationWrap');
  const info  = document.getElementById('paginationInfo');
  const el    = document.getElementById('pagination');
  const start = (page - 1) * ITEMS_PER_PAGE + 1;
  const end   = Math.min(page * ITEMS_PER_PAGE, total);

  wrap.style.display = 'block';
  info.textContent = `顯示第 ${start}–${end} 篇，共 ${total} 篇・第 ${page} / ${totalPages} 頁`;

  if (totalPages <= 1) { el.innerHTML = ''; return; }

  // 計算要顯示的頁碼（含省略）
  const pages = new Set([1, totalPages, page, page - 1, page + 1].filter(p => p >= 1 && p <= totalPages));
  const sorted = [...pages].sort((a, b) => a - b);

  let html = '';
  html += `<button ${page <= 1 ? 'disabled' : `onclick="renderNews(${page - 1})"`}>‹</button>`;

  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) html += `<span class="page-ellipsis">…</span>`;
    if (p === page) html += `<span class="active">${p}</span>`;
    else html += `<a href="#" onclick="event.preventDefault();renderNews(${p})">${p}</a>`;
    prev = p;
  }

  html += `<button ${page >= totalPages ? 'disabled' : `onclick="renderNews(${page + 1})"`}>›</button>`;
  el.innerHTML = html;
}

// ── 詳細頁 ────────────────────────────────────────────────
async function showNewsDetail(id, cachedIdx) {
  // 優先用快取，避免二次請求
  let item = (newsCache[cachedIdx]?.id === id) ? newsCache[cachedIdx] : null;

  if (!item) {
    try {
      const data = await backendService.getNewsItem(id);
      item = data?.data ?? data;
    } catch {
      Swal.fire({ icon: 'error', title: '載入失敗', text: '無法讀取文章內容' });
      return;
    }
  }

  document.getElementById('detailTitle').textContent = item.title ?? '';

  // 發布時間
  const pubEl = document.getElementById('detailPublished');
  const updEl = document.getElementById('detailUpdated');
  const pubDate = item.publishedAt || item.createdAt;
  pubEl.textContent = `發布於 ${fmtDate(pubDate)}`;

  // 更新時間：僅在與發布時間不同時顯示（超過 60 秒差距）
  const diffMs = item.updatedAt && pubDate
    ? Math.abs(new Date(item.updatedAt) - new Date(pubDate))
    : 0;
  if (diffMs > 60000) {
    updEl.textContent = `更新於 ${fmtDate(item.updatedAt)}`;
    updEl.classList.remove('d-none');
  } else {
    updEl.classList.add('d-none');
  }

  const attachments = item.attachments ?? [];
  const imageExts = /\.(jpe?g|png|webp|gif)(\?.*)?$/i;
  const imgAttachments  = attachments.filter(u => imageExts.test(u));
  const fileAttachments = attachments.filter(u => !imageExts.test(u));

  // 圖片附件：顯示在文章內容之前
  const imgBannerHtml = imgAttachments.length
    ? `<div class="detail-attach-images">${imgAttachments.map(u =>
        `<img src="${u}" class="detail-attach-img" alt="" onerror="this.style.display='none'">`
      ).join('')}</div>`
    : '';

  document.getElementById('detailContent').innerHTML =
    imgBannerHtml + DOMPurify.sanitize(item.content ?? '');

  // 非圖片附件：顯示在底部，PDF 顯示專屬 icon
  const attachEl = document.getElementById('detailAttachments');
  if (fileAttachments.length) {
    attachEl.innerHTML = `
      <div class="detail-attachments">
        <div class="attach-section-label"><i class="fa-solid fa-paperclip me-1"></i>附件</div>
        ${fileAttachments.map(url => {
          const raw  = decodeURIComponent(url.split('/').pop() || url);
          const name = raw.replace(/^\d+-\w+\./, '').slice(0, 50) || raw.slice(0, 50);
          const isPdf = /\.pdf(\?.*)?$/i.test(url);
          const icon = isPdf
            ? '<i class="fa-solid fa-file-pdf" style="color:#e74c3c"></i>'
            : '<i class="fa-solid fa-file-lines" style="color:#004b97"></i>';
          return `<a href="${url}" target="_blank" class="attach-chip">${icon} ${name}</a>`;
        }).join('')}
      </div>`;
  } else {
    attachEl.innerHTML = '';
  }

  const authorEl = document.getElementById('detailAuthor');
  const authorName = item.author?.name ?? item.authorName ?? null;
  const viewCount  = item.viewCount ?? 0;
  authorEl.innerHTML = `
    <span class="detail-author-views"><i class="fa-regular fa-eye"></i> ${viewCount} 次觀看</span>
    ${authorName ? `<span>發布者：<span class="detail-author-name">${authorName}</span></span>` : ''}
  `;

  document.querySelector('.content').style.display = 'none';
  document.getElementById('newsDetailPage').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'instant' });
  bindImageLightbox();

  // 更新 URL，讓此頁可被分享
  const url = new URL(window.location.href);
  url.searchParams.set('id', id);
  history.pushState({ newsId: id }, '', url);
}

function showNewsList() {
  document.getElementById('newsDetailPage').style.display = 'none';
  const content = document.querySelector('.content');
  content.style.display = '';
  content.style.animation = 'none';
  void content.offsetWidth;
  content.style.animation = '';

  // 清掉 URL 的 id，返回乾淨列表頁
  const url = new URL(window.location.href);
  url.searchParams.delete('id');
  history.pushState({}, '', url);

  // 若快取是空的（直接從分享連結進來），補載列表
  if (!newsCache.length) loadNewsList(1);
}

// ── Lightbox ─────────────────────────────────────────────
function openLightbox(src) {
  const overlay = document.createElement('div');
  overlay.className = 'news-lightbox';

  const img = document.createElement('img');
  img.src = src;
  img.alt = '';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'news-lightbox-close';
  closeBtn.innerHTML = '&times;';

  const close = () => overlay.remove();
  overlay.addEventListener('click', close);
  img.addEventListener('click', e => e.stopPropagation());
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
  });

  overlay.appendChild(img);
  overlay.appendChild(closeBtn);
  document.body.appendChild(overlay);
}

function bindImageLightbox() {
  document.querySelectorAll('#detailContent img, .detail-attach-images img').forEach(img => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => openLightbox(img.src));
  });
}

function renderNews(page) { loadNewsList(page); }

function shareNews() {
  const url = window.location.href;
  navigator.clipboard.writeText(url).then(() => {
    Swal.fire({ icon: 'success', title: '連結已複製', text: url, timer: 2000, showConfirmButton: false });
  }).catch(() => {
    Swal.fire({ icon: 'info', title: '分享連結', text: url, confirmButtonText: '關閉' });
  });
}

// ── 全域（HTML onclick 需要） ────────────────────────────
window.renderNews       = renderNews;
window.showNewsDetail   = showNewsDetail;
window.showNewsList     = showNewsList;
window.shareNews        = shareNews;

// ── 初始載入：偵測 ?id= 直接顯示文章 ───────────────────────
(function init() {
  const id = new URLSearchParams(window.location.search).get('id');
  if (id) {
    showNewsDetail(id, -1);
  } else {
    loadNewsList(1);
  }
})();
