import BackendService from '../BackendService.js';
import ChatBackendService from '../chatroom/ChatBackendService.js';

const chatSvc = new ChatBackendService();
const backendSvc = new BackendService();

// ── 登入驗證（以 cookie 為準，不依賴 localStorage）──────
(async () => {
  try {
    const me = await backendSvc.whoami();
    const username = me?.data?.username || me?.username || '管理員';
    document.getElementById('adminName').textContent = username;
  } catch (e) {
    await Swal.fire({ icon: 'warning', title: '請先登入', text: '即將跳轉至登入頁' });
    window.location.href = '../account/account.html';
  }
})();

// ── 登出 ──────────────────────────────────────────────
document.getElementById('logoutBtn').addEventListener('click', async () => {
  const confirm = await Swal.fire({
    title: '確定要登出？',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: '登出',
    cancelButtonText: '取消'
  });
  if (!confirm.isConfirmed) return;
  try { await backendSvc.logout(); } catch (_) {}
  window.location.href = '../account/account.html';
});

// ── 手機版側邊欄開關 ────────────────────────────────
const sidebar = document.getElementById('officialSidebar');
const overlay = document.getElementById('sidebarOverlay');
function openSidebar()  { sidebar.classList.add('open');    overlay.classList.add('active'); }
function closeSidebar() { sidebar.classList.remove('open'); overlay.classList.remove('active'); }
document.getElementById('sidebarToggle').addEventListener('click', openSidebar);
overlay.addEventListener('click', closeSidebar);

// ── 側邊選單切換 ─────────────────────────────────────
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.panel)?.classList.add('active');
    if (btn.dataset.panel === 'panel-broadcast') loadChannels();
    if (btn.dataset.panel === 'panel-news') loadNewsAdmin();
    if (btn.dataset.panel === 'panel-analytics') loadAnalytics();
    closeSidebar();
  });
});

// ════════════════════════════════════════════════════
//  頻道選擇
// ════════════════════════════════════════════════════
let selectedChannelId = null;

async function loadChannels() {
  const selector = document.getElementById('channelSelector');
  selector.innerHTML = `<div class="text-muted text-center py-3 small">
    <span class="spinner-border spinner-border-sm me-1"></span>載入中...
  </div>`;

  try {
    const res = await chatSvc.listOfficialChannels(1, 50);
    const items = res?.data?.items ?? res?.data ?? (Array.isArray(res) ? res : []);

    if (!Array.isArray(items) || items.length === 0) {
      selector.innerHTML = '<div class="text-muted text-center py-3 small">尚無頻道，請先至「建立頻道」新增</div>';
      return;
    }

    selector.innerHTML = '';
    items.forEach(ch => {
      const id   = ch.id ?? ch.channelId ?? '';
      const name = ch.name ?? '未命名頻道';
      const desc = ch.description ?? '';

      const card = document.createElement('div');
      card.className = 'channel-card';
      card.dataset.id = id;
      card.innerHTML = `
        <div class="ch-icon"><i class="fa fa-bullhorn"></i></div>
        <div class="ch-info">
          <div class="ch-name">${name}</div>
          ${desc ? `<div class="ch-desc">${desc}</div>` : ''}
          <code class="ch-id">${id}</code>
        </div>
        <div class="ch-check"><i class="fa fa-check-circle"></i></div>
      `;
      card.addEventListener('click', () => selectChannel(id, name, card));

      // Restore selection if previously selected
      if (id === selectedChannelId) card.classList.add('selected');
      selector.appendChild(card);
    });
  } catch (err) {
    selector.innerHTML = `<div class="text-danger text-center py-3 small">載入失敗：${err?.message || '請稍後再試'}</div>`;
  }
}

function selectChannel(id, name, cardEl) {
  selectedChannelId = id;
  document.getElementById('broadcastChannelId').value = id;
  document.querySelectorAll('.channel-card').forEach(c => c.classList.remove('selected'));
  cardEl.classList.add('selected');
  const badge = document.getElementById('selectedChannelBadge');
  document.getElementById('selectedChannelName').textContent = `已選擇：${name}`;
  badge.classList.remove('d-none');
}

document.getElementById('refreshChannelsBtn').addEventListener('click', loadChannels);

// Auto-load on page ready
loadChannels();

// ════════════════════════════════════════════════════
//  圖片上傳 & 預覽
// ════════════════════════════════════════════════════
let broadcastImageFile = null;

const imgArea        = document.getElementById('broadcastImgArea');
const imgInput       = document.getElementById('broadcastImgInput');
const imgPreview     = document.getElementById('broadcastImgPreview');
const imgPlaceholder = document.getElementById('broadcastImgPlaceholder');
const clearImgBtn    = document.getElementById('clearImgBtn');

imgArea.addEventListener('click', (e) => {
  if (e.target !== clearImgBtn) imgInput.click();
});
imgArea.addEventListener('dragover', e => { e.preventDefault(); imgArea.classList.add('dragover'); });
imgArea.addEventListener('dragleave', () => imgArea.classList.remove('dragover'));
imgArea.addEventListener('drop', e => {
  e.preventDefault();
  imgArea.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) setImageFile(file);
});
imgInput.addEventListener('change', () => {
  if (imgInput.files[0]) setImageFile(imgInput.files[0]);
});
clearImgBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  clearImage();
});

function setImageFile(file) {
  broadcastImageFile = file;
  const reader = new FileReader();
  reader.onload = () => {
    imgPreview.src = reader.result;
    imgPreview.classList.remove('d-none');
    imgPlaceholder.classList.add('d-none');
    clearImgBtn.classList.remove('d-none');
  };
  reader.readAsDataURL(file);
}

function clearImage() {
  broadcastImageFile = null;
  imgInput.value = '';
  imgPreview.src = '';
  imgPreview.classList.add('d-none');
  imgPlaceholder.classList.remove('d-none');
  clearImgBtn.classList.add('d-none');
}

// ════════════════════════════════════════════════════
//  發送官方公告
// ════════════════════════════════════════════════════
document.getElementById('broadcastForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const channelId = selectedChannelId || document.getElementById('broadcastChannelId').value.trim();
  const message   = document.getElementById('broadcastMessage').value.trim();
  const resultBox = document.getElementById('broadcastResult');
  const submitBtn = document.getElementById('broadcastSubmitBtn');

  if (!channelId) {
    Swal.fire({ icon: 'warning', title: '請先選擇頻道' });
    return;
  }
  if (!message && !broadcastImageFile) {
    Swal.fire({ icon: 'warning', title: '請輸入公告內容或選擇圖片' });
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> 發送中...';
  resultBox.className = 'result-box mt-3 d-none';

  try {
    await chatSvc.broadCastOfficial(channelId, message || undefined, broadcastImageFile ? [broadcastImageFile] : []);
    resultBox.className = 'result-box mt-3 success';
    resultBox.innerHTML = '<div class="fw-bold">✅ 公告發送成功！</div>';
    document.getElementById('broadcastMessage').value = '';
    clearImage();
  } catch (err) {
    resultBox.className = 'result-box mt-3 error';
    resultBox.innerHTML = `<div class="fw-bold mb-1">❌ 發送失敗</div><div>${err?.response?.data?.message || err?.message || '請稍後再試'}</div>`;
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa fa-paper-plane me-1"></i> 發送公告';
    resultBox.classList.remove('d-none');
  }
});

// ════════════════════════════════════════════════════
//  建立官方頻道
// ════════════════════════════════════════════════════
document.getElementById('createChannelForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name        = document.getElementById('channelName').value.trim();
  const description = document.getElementById('channelDescription').value.trim();
  const btn         = document.getElementById('createChannelBtn');
  const resultBox   = document.getElementById('channelResult');

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> 建立中...';
  resultBox.className = 'result-box mt-3 d-none';

  try {
    const res = await chatSvc.createOfficialChannel(name, description || undefined);
    const channel   = res?.data ?? res;
    const channelId = channel?.id ?? channel?.channelId ?? JSON.stringify(channel);

    resultBox.className = 'result-box mt-3 success';
    resultBox.innerHTML = `
      <div class="fw-bold mb-1">✅ 官方頻道建立成功！</div>
      <div>頻道 ID：<code style="user-select:all; font-size:1rem;">${channelId}</code></div>
      <div class="text-muted small mt-1">已可在「發送公告」頁選擇此頻道</div>
    `;
  } catch (err) {
    resultBox.className = 'result-box mt-3 error';
    resultBox.innerHTML = `<div class="fw-bold mb-1">❌ 建立失敗</div><div>${err?.response?.data?.message || err?.message || '請稍後再試'}</div>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa fa-plus me-1"></i> 建立官方頻道';
    resultBox.classList.remove('d-none');
  }
});

// ════════════════════════════════════════════════════
//  查詢公告紀錄
// ════════════════════════════════════════════════════
document.getElementById('loadHistoryBtn').addEventListener('click', async () => {
  const channelId = document.getElementById('historyChannelId').value.trim();
  const listEl    = document.getElementById('historyList');

  if (!channelId) {
    Swal.fire({ icon: 'warning', title: '請輸入頻道 ID' });
    return;
  }

  listEl.innerHTML = `<div class="text-center py-4"><div class="spinner-border text-secondary"></div></div>`;

  try {
    const before = new Date().toISOString();
    const res    = await chatSvc.getBroadcast(channelId, 50, before);
    const items  = res?.data?.items ?? res?.data ?? res ?? [];

    if (!Array.isArray(items) || items.length === 0) {
      listEl.innerHTML = '<p class="text-muted text-center py-4">此頻道尚無公告紀錄</p>';
      return;
    }

    listEl.innerHTML = items
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .map(item => {
        const time    = new Date(item.timestamp).toLocaleString('zh-TW');
        const attachUrls = Array.isArray(item.attachments)
          ? item.attachments
          : (item.attachments ? [item.attachments] : []);
        const imgHtml = attachUrls.map(src => `<img src="${src}" class="hi-img" alt="附件">`).join('');
        return `
          <div class="history-item">
            <div class="hi-time">${time}</div>
            <div class="hi-msg">${item.message || ''}</div>
            ${imgHtml}
          </div>`;
      }).join('');
  } catch (err) {
    listEl.innerHTML = `<p class="text-danger text-center py-4">載入失敗：${err?.message || '請稍後再試'}</p>`;
  }
});

// ════════════════════════════════════════════════════
//  最新資訊管理
//  TODO：將下方 API_NEWS_URL 換成實際後端 endpoint
// ════════════════════════════════════════════════════
const API_NEWS_URL = `${backendSvc.baseUrl}/api/news`; // 待確認

// news.js 的現有文章資料（前端暫存，串接後端後可移除）
let newsData = [
  { from:'平台規則', n_name:'拾貨寶庫買賣流程公告', time:'2026-05-20',
    detail:'<p>為了讓大家能安心在拾貨寶庫交易...' }
];

function newsBadgeClass(from) {
  return from === '系統公告' ? 'system'
       : from === '店鋪公告' ? 'store'
       : from === '平台規則' ? 'rules' : 'other';
}

function renderNewsAdminList() {
  const el = document.getElementById('newsAdminList');
  if (!newsData.length) {
    el.innerHTML = '<p class="text-muted text-center py-3 small">尚無文章</p>';
    return;
  }
  el.innerHTML = newsData.map((item, i) => `
    <div class="news-admin-item">
      <span class="news-admin-item-badge ${newsBadgeClass(item.from)}">${item.from}</span>
      <span class="news-admin-item-title" title="${item.n_name}">${item.n_name}</span>
      <span class="news-admin-item-date">${item.time}</span>
      <div class="news-admin-item-actions">
        <button class="btn btn-sm btn-outline-primary" onclick="startEditNews(${i})">
          <i class="fa fa-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteNews(${i})">
          <i class="fa fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
}

async function loadNewsAdmin() {
  // TODO：串接後端後改為 GET API_NEWS_URL
  // const res = await axios.get(API_NEWS_URL);
  // newsData = res.data?.items ?? res.data ?? [];
  renderNewsAdminList();
  document.getElementById('stat-news').textContent = newsData.length;
  restoreDraft();
}

// ── 初始化 Quill 富文字編輯器 ──
const quill = new Quill('#newsEditor', {
  theme: 'snow',
  placeholder: '輸入文章內容...',
  modules: {
    toolbar: [
      [{ header: [2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['blockquote', 'link'],
      ['clean'],
    ],
  },
});

// 設定日期預設值為今天
document.getElementById('newsDate').value = new Date().toISOString().slice(0, 10);

// ── 草稿：自動存取 ──────────────────────────────────────
const DRAFT_KEY = 'official_news_draft';
let _draftTimer = null;

function saveDraft() {
  const draft = {
    from:    document.getElementById('newsCategory').value,
    n_name:  document.getElementById('newsTitle').value,
    time:    document.getElementById('newsDate').value,
    detail:  quill.getSemanticHTML(),
  };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  document.getElementById('newsDraftBadge').classList.remove('d-none');
}

function scheduleDraftSave() {
  clearTimeout(_draftTimer);
  _draftTimer = setTimeout(saveDraft, 600);
}

function restoreDraft() {
  const raw = localStorage.getItem(DRAFT_KEY);
  if (!raw) return;
  try {
    const draft = JSON.parse(raw);
    if (draft.n_name) document.getElementById('newsTitle').value = draft.n_name;
    if (draft.from)   document.getElementById('newsCategory').value = draft.from;
    if (draft.time)   document.getElementById('newsDate').value = draft.time;
    if (draft.detail) quill.clipboard.dangerouslyPasteHTML(draft.detail);
    document.getElementById('newsDraftBadge').classList.remove('d-none');
  } catch (_) {}
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
  document.getElementById('newsDraftBadge').classList.add('d-none');
}

// 監聽欄位變動
['newsCategory', 'newsTitle', 'newsDate'].forEach(id =>
  document.getElementById(id).addEventListener('input', scheduleDraftSave)
);
quill.on('text-change', scheduleDraftSave);

document.getElementById('newsClearDraftBtn').addEventListener('click', async () => {
  const r = await Swal.fire({
    title: '清除草稿？',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: '清除',
    cancelButtonText: '取消',
  });
  if (!r.isConfirmed) return;
  clearDraft();
  document.getElementById('newsTitle').value = '';
  document.getElementById('newsDate').value = new Date().toISOString().slice(0, 10);
  document.getElementById('newsCategory').value = '系統公告';
  quill.setContents([]);
});

// ── 預覽 ────────────────────────────────────────────────
const previewModal = new bootstrap.Modal(document.getElementById('newsPreviewModal'));

document.getElementById('newsPreviewBtn').addEventListener('click', () => {
  const from    = document.getElementById('newsCategory').value;
  const title   = document.getElementById('newsTitle').value.trim() || '（未填標題）';
  const date    = document.getElementById('newsDate').value || '–';
  const detail  = quill.getSemanticHTML();
  const badgeClass = newsBadgeClass(from);

  const badge = document.getElementById('previewBadge');
  badge.textContent = from;
  badge.className = `news-badge ${badgeClass}`;
  document.getElementById('previewTitle').textContent = title;
  document.getElementById('previewDate').textContent = date;
  document.getElementById('previewContent').innerHTML = detail;
  previewModal.show();
});

document.getElementById('newsForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('newsSubmitBtn');
  const resultBox = document.getElementById('newsFormResult');
  const editIdx = document.getElementById('newsEditIndex').value;
  const isEdit = editIdx !== '';

  const detail = quill.getSemanticHTML();
  const article = {
    from:   document.getElementById('newsCategory').value,
    n_name: document.getElementById('newsTitle').value.trim(),
    time:   document.getElementById('newsDate').value,
    detail,
  };

  if (!article.n_name || !article.detail) {
    Swal.fire({ icon: 'warning', title: '請填寫標題與內容' });
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> 發布中...';
  resultBox.className = 'result-box mt-3 d-none';

  try {
    // TODO：串接後端
    // if (isEdit) {
    //   await axios.put(`${API_NEWS_URL}/${newsData[editIdx].id}`, article);
    //   newsData[editIdx] = article;
    // } else {
    //   const res = await axios.post(API_NEWS_URL, article);
    //   newsData.unshift(res.data ?? article);
    // }
    if (isEdit) {
      newsData[parseInt(editIdx)] = article;
    } else {
      newsData.unshift(article);
    }
    renderNewsAdminList();
    cancelEditNews();
    clearDraft();
    resultBox.className = 'result-box mt-3 success';
    resultBox.innerHTML = `<div class="fw-bold">✅ 文章「${article.n_name}」已${isEdit ? '更新' : '發布'}！</div>`;
    document.getElementById('newsTitle').value = '';
    quill.setContents([]);
    document.getElementById('newsDate').value = new Date().toISOString().slice(0, 10);
    document.getElementById('stat-news').textContent = newsData.length;
  } catch (err) {
    resultBox.className = 'result-box mt-3 error';
    resultBox.innerHTML = `<div class="fw-bold mb-1">❌ 發布失敗</div><div>${err?.response?.data?.message || err?.message || '請稍後再試'}</div>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa fa-paper-plane me-1"></i> 發布文章';
    resultBox.classList.remove('d-none');
  }
});

window.startEditNews = function(i) {
  const item = newsData[i];
  document.getElementById('newsEditIndex').value = i;
  document.getElementById('newsCategory').value = item.from;
  document.getElementById('newsTitle').value = item.n_name;
  document.getElementById('newsDate').value = item.time;
  quill.clipboard.dangerouslyPasteHTML(item.detail ?? '');
  document.getElementById('newsEditorLabel').textContent = '編輯文章';
  document.getElementById('newsCancelEditBtn').classList.remove('d-none');
  document.getElementById('newsSubmitBtn').innerHTML = '<i class="fa fa-save me-1"></i> 儲存變更';
  document.querySelector('#panel-news').scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteNews = async function(i) {
  const item = newsData[i];
  const confirm = await Swal.fire({
    title: `確定刪除「${item.n_name}」？`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: '刪除',
    cancelButtonText: '取消',
    confirmButtonColor: '#dc3545',
  });
  if (!confirm.isConfirmed) return;
  // TODO：await axios.delete(`${API_NEWS_URL}/${item.id}`);
  newsData.splice(i, 1);
  renderNewsAdminList();
  document.getElementById('stat-news').textContent = newsData.length;
};

function cancelEditNews() {
  document.getElementById('newsEditIndex').value = '';
  document.getElementById('newsEditorLabel').textContent = '新增文章';
  document.getElementById('newsCancelEditBtn').classList.add('d-none');
  document.getElementById('newsSubmitBtn').innerHTML = '<i class="fa fa-paper-plane me-1"></i> 發布文章';
  quill.setContents([]);
}
document.getElementById('newsCancelEditBtn').addEventListener('click', cancelEditNews);
document.getElementById('refreshNewsBtn').addEventListener('click', loadNewsAdmin);

// ════════════════════════════════════════════════════
//  數據分析
// ════════════════════════════════════════════════════
async function loadAnalytics() {
  // ① 上架商品總數
  try {
    const res = await backendSvc.getCommodityList('all', { page: 1, limit: 1 });
    const total = res?.total ?? res?.data?.total ?? res?.pagination?.total ?? '–';
    document.getElementById('stat-products').textContent = total;
  } catch {
    document.getElementById('stat-products').textContent = '–';
  }

  // ② 熱門商品數
  try {
    const res = await backendSvc.getCommodityList('hot', { page: 1, limit: 1 });
    const total = res?.total ?? res?.data?.total ?? res?.pagination?.total ?? '–';
    document.getElementById('stat-hot').textContent = total;
  } catch {
    document.getElementById('stat-hot').textContent = '–';
  }

  // ③ 最新資訊文章數（已由 loadNewsAdmin 填入）
  document.getElementById('stat-news').textContent = newsData.length;

  // ④ 最新上架商品列表
  try {
    const res = await backendSvc.getCommodityList('all', { page: 1, limit: 8, sort: 'new' });
    const items = res?.data?.items ?? res?.data ?? res?.items ?? [];
    const el = document.getElementById('analyticsNewItems');
    if (!items.length) { el.innerHTML = '<p class="text-muted text-center py-3 small">無資料</p>'; return; }
    el.innerHTML = items.map(item => {
      const img = Array.isArray(item.images) ? item.images[0] : (item.image || '');
      const price = item.price != null ? `NT$ ${Number(item.price).toLocaleString()}` : '–';
      return `
        <div class="analytics-item-row">
          ${img ? `<img class="analytics-item-img" src="${img}" alt="${item.name}" onerror="this.style.display='none'">` : '<div class="analytics-item-img"></div>'}
          <span class="analytics-item-name">${item.name ?? '未知商品'}</span>
          <span class="analytics-item-price">${price}</span>
        </div>`;
    }).join('');
  } catch {
    document.getElementById('analyticsNewItems').innerHTML = '<p class="text-muted text-center py-3 small">無法載入商品資料</p>';
  }
}
