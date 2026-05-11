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

  try {
    const data  = await backendService.getNewsList(page, ITEMS_PER_PAGE);
    const items = data?.items ?? data?.data?.items ?? data?.data ?? [];
    const total = data?.total ?? data?.data?.total ?? items.length;

    newsCache  = items;
    totalItems = total;

    if (!items.length) {
      listEl.innerHTML = '<p class="news-empty">目前沒有公告</p>';
      return;
    }

    listEl.innerHTML = items.map((item, i) => `
      <div class="news-row" onclick="showNewsDetail('${item.id}',${i})">
        <span class="news-row-date">${fmtDate(item.createdAt)}</span>
        <span class="news-row-title">${item.title ?? '（未命名）'}</span>
      </div>
    `).join('');

    renderPagination(total, page);
  } catch (err) {
    listEl.innerHTML = `<p class="news-empty">載入失敗，請稍後再試</p>`;
  }
}

function renderPagination(total, page) {
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const el = document.getElementById('pagination');
  if (totalPages <= 1) { el.innerHTML = ''; return; }

  let html = '';
  html += `<button ${page <= 1 ? 'disabled' : `onclick="renderNews(${page - 1})"`}>上一頁</button>`;
  for (let i = 1; i <= totalPages; i++) {
    if (i === page) html += `<span class="active">${i}</span>`;
    else html += `<a href="#" onclick="event.preventDefault();renderNews(${i})">${i}</a>`;
  }
  html += `<button ${page >= totalPages ? 'disabled' : `onclick="renderNews(${page + 1})"`}>下一頁</button>`;
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
  document.getElementById('detailTime').textContent  = fmtDate(item.createdAt);
  document.getElementById('detailContent').innerHTML = DOMPurify.sanitize(item.content ?? '');

  // 附件
  const attachEl = document.getElementById('detailAttachments');
  const attachments = item.attachments ?? [];
  if (attachments.length) {
    attachEl.innerHTML = `
      <div class="detail-attachments">
        <div class="attach-section-label"><i class="fa-solid fa-paperclip me-1"></i>附件</div>
        ${attachments.map(url => {
          const name = decodeURIComponent(url.split('/').pop() || url).slice(0, 40);
          return `<a href="${url}" target="_blank" class="attach-chip">${name}</a>`;
        }).join('')}
      </div>`;
  } else {
    attachEl.innerHTML = '';
  }

  document.querySelector('.content').style.display = 'none';
  document.getElementById('newsDetailPage').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function showNewsList() {
  document.getElementById('newsDetailPage').style.display = 'none';
  const content = document.querySelector('.content');
  content.style.display = '';
  content.style.animation = 'none';
  void content.offsetWidth;
  content.style.animation = '';
}

function renderNews(page) { loadNewsList(page); }

// ── 全域（HTML onclick 需要） ────────────────────────────
window.renderNews       = renderNews;
window.showNewsDetail   = showNewsDetail;
window.showNewsList     = showNewsList;

// ── 初始載入 ──────────────────────────────────────────────
loadNewsList(1);
