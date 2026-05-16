import '../default/default.js';
import BackendService from '../BackendService.js';
import ChatBackendService from '../chatroom/ChatBackendService.js';
import wpBackendService from '../wpBackendService.js';

const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

const chatSvc = new ChatBackendService();
const backendSvc = new BackendService();
const wpSvc = new wpBackendService();

// ── 登入驗證（以 cookie 為準，不依賴 localStorage）──────
(async () => {
  try {
    const me = await backendSvc.getMe();
    const username = me?.data?.data?.name || localStorage.getItem('username') || '管理員';
    document.getElementById('adminName').textContent = username;
    document.getElementById('dashAdminName').textContent = username;
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
function switchPanel(panelId) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.nav-group').forEach(g => g.classList.remove('has-active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));

  const activeBtn = document.querySelector(`.nav-btn[data-panel="${panelId}"]`);
  activeBtn?.classList.add('active');
  // 若該按鈕在群組內，展開群組並標示
  const parentGroup = activeBtn?.closest('.nav-group');
  if (parentGroup) {
    parentGroup.classList.add('open', 'has-active');
  }

  document.getElementById(panelId)?.classList.add('active');
  if (panelId === 'panel-broadcast') loadChannels();
  if (panelId === 'panel-history') loadHistoryChannels();
  if (panelId === 'panel-news') loadNewsAdmin();
  if (panelId === 'panel-analytics') loadAnalytics();
  if (panelId === 'panel-reports') loadAllReports(1);
  if (panelId === 'panel-report-categories') loadReportCategories();
  if (panelId === 'panel-review-tags') loadReviewTags();
  closeSidebar();
}
window.switchPanel = switchPanel;

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => switchPanel(btn.dataset.panel));
});

// ── 群組折疊 toggle ──────────────────────────────────
document.querySelectorAll('.nav-group-toggle').forEach(toggle => {
  toggle.addEventListener('click', () => {
    toggle.closest('.nav-group').classList.toggle('open');
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
    selector.innerHTML = `<div class="text-danger text-center py-3 small">載入失敗：${esc(err?.message) || '請稍後再試'}</div>`;
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
document.getElementById('refreshHistoryChannelsBtn').addEventListener('click', loadHistoryChannels);

// Auto-load on page ready
loadChannels();

// ── 公告紀錄：頻道選取 ───────────────────────────────────
async function loadHistoryChannels() {
  const selector = document.getElementById('historyChannelSelector');
  selector.innerHTML = `<div class="text-muted text-center py-3 small">
    <span class="spinner-border spinner-border-sm me-1"></span>載入中...
  </div>`;

  try {
    const res = await chatSvc.listOfficialChannels(1, 50);
    const items = res?.data?.items ?? res?.data ?? (Array.isArray(res) ? res : []);

    if (!Array.isArray(items) || items.length === 0) {
      selector.innerHTML = '<div class="text-muted text-center py-3 small">尚無頻道</div>';
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
      card.addEventListener('click', () => {
        selector.querySelectorAll('.channel-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        loadHistoryForChannel(id);
      });
      selector.appendChild(card);
    });
  } catch (err) {
    selector.innerHTML = `<div class="text-danger text-center py-3 small">載入失敗：${esc(err?.message) || '請稍後再試'}</div>`;
  }
}

async function loadHistoryForChannel(channelId) {
  const listEl = document.getElementById('historyList');
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
    listEl.innerHTML = `<p class="text-danger text-center py-4">載入失敗：${esc(err?.message) || '請稍後再試'}</p>`;
  }
}

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
    resultBox.innerHTML = `<div class="fw-bold mb-1">❌ 發送失敗</div><div>${esc(err?.response?.data?.message || err?.message) || '請稍後再試'}</div>`;
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
    resultBox.innerHTML = `<div class="fw-bold mb-1">❌ 建立失敗</div><div>${esc(err?.response?.data?.message || err?.message) || '請稍後再試'}</div>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa fa-plus me-1"></i> 建立官方頻道';
    resultBox.classList.remove('d-none');
  }
});

// ════════════════════════════════════════════════════
//  查詢公告紀錄
// ════════════════════════════════════════════════════

// ════════════════════════════════════════════════════
//  最新資訊管理
// ════════════════════════════════════════════════════
let newsAdminData  = [];      // 當前列表快取
let editingNewsId  = null;    // 編輯中的文章 ID，null = 新增
let newAttachFiles = [];      // 新選取的附件 File 物件
let keepAttachUrls = [];      // 編輯時保留的既有附件 URL

function newsStatusLabel(s) {
  return s === 'DRAFT' ? '草稿' : s === 'PUBLISHED' ? '已發布' : s === 'ARCHIVED' ? '已封存' : s ?? '–';
}
function newsStatusClass(s) {
  return s === 'DRAFT' ? 'status-draft' : s === 'PUBLISHED' ? 'status-published' : 'status-archived';
}

function renderNewsAdminList() {
  const el = document.getElementById('newsAdminList');
  if (!newsAdminData.length) {
    el.innerHTML = '<p class="text-muted text-center py-3 small">尚無文章</p>';
    return;
  }
  el.innerHTML = newsAdminData.map(item => {
    const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-TW') : '';
    return `
      <div class="news-admin-item">
        <span class="news-status-badge ${newsStatusClass(item.status)}">${newsStatusLabel(item.status)}</span>
        <span class="news-admin-item-title" title="${esc(item.title)}">${esc(item.title)}</span>
        <span class="news-admin-item-date">${date}</span>
        <div class="news-admin-item-actions">
          <button class="btn btn-sm btn-outline-primary" onclick="startEditNews('${item.id}')">
            <i class="fa fa-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteNews('${item.id}','${esc(item.title)}')">
            <i class="fa fa-trash"></i>
          </button>
        </div>
      </div>`;
  }).join('');
}

async function loadNewsAdmin() {
  const statusFilter = document.getElementById('newsStatusFilter')?.value || '';
  const el = document.getElementById('newsAdminList');
  el.innerHTML = `<div class="text-center py-3 small"><span class="spinner-border spinner-border-sm me-1"></span>載入中...</div>`;
  try {
    const data  = await backendSvc.getNewsAll(1, 50, statusFilter || null);
    const items = data?.data?.news ?? data?.data?.items ?? data?.items ?? data?.data ?? [];
    const total = data?.data?.pagination?.totalItems ?? data?.data?.total ?? data?.total ?? items.length;
    newsAdminData = items;
    renderNewsAdminList();
    document.getElementById('stat-news').textContent = total;
  } catch (err) {
    el.innerHTML = `<div class="text-danger text-center py-3 small">載入失敗：${esc(err?.message)}</div>`;
  }
  restoreDraft();
}

// ── 初始化 Quill 富文字編輯器 ──
const quill = new Quill('#newsEditor', {
  theme: 'snow',
  placeholder: '輸入文章內容...',
  modules: {
    toolbar: {
      container: [
        [{ header: [2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['blockquote', 'link'],
        ['clean'],
      ],
    },
  },
});



// ── 草稿：自動存取 ──────────────────────────────────────
const DRAFT_KEY = 'official_news_draft';
let _draftTimer = null;

function saveDraft() {
  const draft = {
    title:   document.getElementById('newsTitle').value,
    status:  document.getElementById('newsStatus').value,
    content: quill.getSemanticHTML(),
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
    if (draft.title)   document.getElementById('newsTitle').value = draft.title;
    if (draft.status)  document.getElementById('newsStatus').value = draft.status;
    if (draft.content) quill.clipboard.dangerouslyPasteHTML(draft.content);
    document.getElementById('newsDraftBadge').classList.remove('d-none');
  } catch (_) {}
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
  document.getElementById('newsDraftBadge').classList.add('d-none');
}

// 監聽欄位變動
function updateSubmitBtnLabel() {
  const isDraft = document.getElementById('newsStatus').value === 'DRAFT';
  const btn = document.getElementById('newsSubmitBtn');
  btn.innerHTML = isDraft
    ? '<i class="fa fa-floppy-disk me-1"></i> 儲存草稿'
    : '<i class="fa fa-paper-plane me-1"></i> 發布文章';
}
document.getElementById('newsStatus').addEventListener('change', updateSubmitBtnLabel);
updateSubmitBtnLabel();

['newsTitle', 'newsStatus'].forEach(id =>
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
  document.getElementById('newsStatus').value = 'DRAFT';
  quill.setContents([]);
});

// ── 預覽 ────────────────────────────────────────────────
const previewModal = new bootstrap.Modal(document.getElementById('newsPreviewModal'));

document.getElementById('newsPreviewBtn').addEventListener('click', () => {
  const title   = document.getElementById('newsTitle').value.trim() || '（未填標題）';
  const statusEl = document.getElementById('newsStatus');
  const statusText = statusEl.options[statusEl.selectedIndex]?.text ?? '';
  const detail  = quill.getSemanticHTML();

  const badge = document.getElementById('previewBadge');
  badge.textContent = statusText;
  badge.className = 'news-badge';
  document.getElementById('previewTitle').textContent = title;
  document.getElementById('previewDate').textContent = new Date().toLocaleDateString('zh-TW');
  document.getElementById('previewContent').innerHTML = detail;

  // 附件圖片預覽
  const attachWrap = document.getElementById('previewAttachments');
  const attachList = document.getElementById('previewAttachList');
  const imgStyle = 'max-width:160px;max-height:120px;border-radius:6px;object-fit:cover;border:1px solid #eee;';

  // 釋放舊的 object URL
  attachList.querySelectorAll('img[data-obj-url]').forEach(img => URL.revokeObjectURL(img.src));
  attachList.innerHTML = '';

  const imageExts = /\.(jpe?g|png|webp|gif)(\?.*)?$/i;
  const imgs = [
    ...keepAttachUrls.filter(u => imageExts.test(u)).map(u => `<img src="${u}" style="${imgStyle}" alt="">`),
    ...newAttachFiles.filter(f => f.type.startsWith('image/')).map(f => {
      const url = URL.createObjectURL(f);
      return `<img src="${url}" data-obj-url="1" style="${imgStyle}" alt="">`;
    })
  ];

  if (imgs.length) {
    attachList.innerHTML = imgs.join('');
    attachWrap.style.display = 'block';
  } else {
    attachWrap.style.display = 'none';
  }

  previewModal.show();
});

// ── 附件選取 ────────────────────────────────────────────
const newsAttachZone  = document.getElementById('newsAttachZone');
const newsAttachInput = document.getElementById('newsAttachInput');

newsAttachZone.addEventListener('click', () => newsAttachInput.click());
newsAttachZone.addEventListener('dragover', e => { e.preventDefault(); newsAttachZone.classList.add('dragover'); });
newsAttachZone.addEventListener('dragleave', () => newsAttachZone.classList.remove('dragover'));
newsAttachZone.addEventListener('drop', e => {
  e.preventDefault();
  newsAttachZone.classList.remove('dragover');
  addAttachFiles(Array.from(e.dataTransfer.files));
});
newsAttachInput.addEventListener('change', () => {
  addAttachFiles(Array.from(newsAttachInput.files));
  newsAttachInput.value = '';
});

function addAttachFiles(files) {
  const MAX = 10;
  const MAX_MB = 5 * 1024 * 1024;
  for (const f of files) {
    if (newAttachFiles.length + keepAttachUrls.length >= MAX) {
      Swal.fire({ icon: 'warning', title: `最多 ${MAX} 個附件` }); break;
    }
    if (f.size > MAX_MB) {
      Swal.fire({ icon: 'warning', title: `「${f.name}」超過 5MB` }); continue;
    }
    newAttachFiles.push(f);
  }
  renderAttachLists();
}

function renderAttachLists() {
  // 既有附件（編輯模式）
  const existEl = document.getElementById('newsExistingAttachList');
  existEl.innerHTML = keepAttachUrls.map((url, i) => {
    const name = decodeURIComponent(url.split('/').pop() || url).slice(0, 40);
    return `<span class="attach-chip">
      ${name}
      <button type="button" class="attach-chip-remove" onclick="removeExistAttach(${i})">×</button>
    </span>`;
  }).join('');

  // 新附件
  const newEl = document.getElementById('newsNewAttachList');
  newEl.innerHTML = newAttachFiles.map((f, i) =>
    `<span class="attach-chip attach-chip-new">
      ${f.name}
      <button type="button" class="attach-chip-remove" onclick="removeNewAttach(${i})">×</button>
    </span>`
  ).join('');
}

window.removeExistAttach = function(i) {
  keepAttachUrls.splice(i, 1);
  renderAttachLists();
};
window.removeNewAttach = function(i) {
  newAttachFiles.splice(i, 1);
  renderAttachLists();
};

// ── 表單送出 ────────────────────────────────────────────
document.getElementById('newsForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn       = document.getElementById('newsSubmitBtn');
  const resultBox = document.getElementById('newsFormResult');
  const isEdit    = editingNewsId !== null;

  const title   = document.getElementById('newsTitle').value.trim();
  const status  = document.getElementById('newsStatus').value;
  const content = quill.getSemanticHTML();

  if (!title || !content || content === '<p></p>') {
    Swal.fire({ icon: 'warning', title: '請填寫標題與內容' });
    return;
  }

  const fd = new FormData();
  fd.append('title', title);
  fd.append('content', content);
  fd.append('status', status);
  newAttachFiles.forEach(f => fd.append('attachments', f));
  // 編輯時保留既有附件 URL
  keepAttachUrls.forEach(url => fd.append('attachments', url));

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> 儲存中...';
  resultBox.className = 'result-box mt-3 d-none';

  try {
    if (isEdit) {
      await backendSvc.updateNews(editingNewsId, fd);
    } else {
      await backendSvc.createNews(fd);
    }
    cancelEditNews();
    clearDraft();
    resultBox.className = 'result-box mt-3 success';
    resultBox.innerHTML = `<div class="fw-bold">✅ 文章「${esc(title)}」已${isEdit ? '更新' : '發布'}！</div>`;
    await loadNewsAdmin();
  } catch (err) {
    resultBox.className = 'result-box mt-3 error';
    resultBox.innerHTML = `<div class="fw-bold mb-1">❌ ${isEdit ? '更新' : '發布'}失敗</div><div>${esc(err?.message) || '請稍後再試'}</div>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa fa-paper-plane me-1"></i> 發布文章';
    resultBox.classList.remove('d-none');
  }
});

// ── 編輯 ────────────────────────────────────────────────
window.startEditNews = function(id) {
  const item = newsAdminData.find(n => n.id === id);
  if (!item) return;

  editingNewsId  = id;
  newAttachFiles = [];
  keepAttachUrls = Array.isArray(item.attachments) ? [...item.attachments] : [];

  document.getElementById('newsEditId').value    = id;
  document.getElementById('newsTitle').value     = item.title ?? '';
  document.getElementById('newsStatus').value    = item.status ?? 'DRAFT';
  quill.clipboard.dangerouslyPasteHTML(item.content ?? '');
  renderAttachLists();

  document.getElementById('newsEditorLabel').textContent = '編輯文章';
  document.getElementById('newsCancelEditBtn').classList.remove('d-none');
  document.getElementById('newsSubmitBtn').innerHTML = '<i class="fa fa-save me-1"></i> 儲存變更';
  document.querySelector('#panel-news').scrollTo({ top: 0, behavior: 'smooth' });
};

// ── 刪除 ────────────────────────────────────────────────
window.deleteNews = async function(id, title) {
  const confirm = await Swal.fire({
    title: `確定刪除「${esc(title)}」？`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: '刪除',
    cancelButtonText: '取消',
    confirmButtonColor: '#dc3545',
  });
  if (!confirm.isConfirmed) return;
  try {
    await backendSvc.deleteNews(id);
    await loadNewsAdmin();
  } catch (err) {
    Swal.fire({ icon: 'error', title: '刪除失敗', text: err?.message });
  }
};

function cancelEditNews() {
  editingNewsId  = null;
  newAttachFiles = [];
  keepAttachUrls = [];
  document.getElementById('newsEditId').value = '';
  document.getElementById('newsEditorLabel').textContent = '新增文章';
  document.getElementById('newsCancelEditBtn').classList.add('d-none');
  document.getElementById('newsSubmitBtn').innerHTML = '<i class="fa fa-paper-plane me-1"></i> 發布文章';
  document.getElementById('newsTitle').value   = '';
  document.getElementById('newsStatus').value  = 'DRAFT';
  quill.setContents([]);
  renderAttachLists();
}
document.getElementById('newsCancelEditBtn').addEventListener('click', cancelEditNews);
document.getElementById('refreshNewsBtn').addEventListener('click', loadNewsAdmin);
document.getElementById('newsStatusFilter')?.addEventListener('change', loadNewsAdmin);

// ════════════════════════════════════════════════════
//  數據分析
// ════════════════════════════════════════════════════
let _categoryChart = null;

const CATEGORY_MAP = [
  { key: 'book',    label: '課本講義', color: '#1a73e8' },
  { key: 'life',    label: '生活用品', color: '#28a745' },
  { key: 'special', label: '限定商品', color: '#f57c00' },
  { key: 'reuse',   label: '二手回收', color: '#7b1fa2' },
  { key: 'storage', label: '宿舍收納', color: '#d93025' },
  { key: 'other',   label: '其他',     color: '#888888' },
];

async function loadAnalytics() {
  document.getElementById('stat-news').textContent = newsAdminData.length || '–';

  await Promise.allSettled([
    _loadScaleStats(),
    _loadWishpoolInsights(),
    _loadCategoryChart(),
    _loadNewItems(),
  ]);

  _renderSearchKeywords();
  _updatePitchSummary();
}

async function _loadScaleStats() {
  try {
    const res = await backendSvc.getCommodityList('all', { page: 1, limit: 1 });
    const total = res?.total ?? res?.data?.total ?? res?.pagination?.total ?? '–';
    document.getElementById('stat-products').textContent = total;
  } catch {
    document.getElementById('stat-products').textContent = '–';
  }

  try {
    const res = await backendSvc.getCommodityList('hot', { page: 1, limit: 1 });
    const total = res?.total ?? res?.data?.total ?? res?.pagination?.total ?? '–';
    document.getElementById('stat-hot').textContent = total;
  } catch {
    document.getElementById('stat-hot').textContent = '–';
  }
}

async function _loadCategoryChart() {
  const loader = document.getElementById('categoryChartLoader');
  const canvas = document.getElementById('categoryChart');
  if (!canvas) return;

  try {
    const counts = await Promise.all(
      CATEGORY_MAP.map(c =>
        backendSvc.getCommodityList(c.key, { page: 1, limit: 1 })
          .then(res => res?.total ?? res?.data?.total ?? res?.pagination?.total ?? 0)
          .catch(() => 0)
      )
    );

    if (loader) loader.style.display = 'none';
    canvas.style.display = 'block';

    if (_categoryChart) _categoryChart.destroy();

    _categoryChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: CATEGORY_MAP.map(c => c.label),
        datasets: [{
          label: '商品數量',
          data: counts,
          backgroundColor: CATEGORY_MAP.map(c => c.color + 'bb'),
          borderColor: CATEGORY_MAP.map(c => c.color),
          borderWidth: 1.5,
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y} 件` } },
        },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#f0f4fa' } },
          x: { grid: { display: false } },
        },
      },
    });
  } catch {
    if (loader) loader.textContent = '圖表載入失敗';
  }
}

async function _loadWishpoolInsights() {
  const el = document.getElementById('wishpoolInsights');
  const statEl = document.getElementById('stat-wishes');
  if (!el) return;
  try {
    const res = await wpSvc.listWishes(1);
    const items = res?.items ?? res?.data?.items ?? [];
    const total = res?.total ?? res?.data?.total;

    if (statEl) statEl.textContent = total != null ? total : items.length;

    if (!items.length) {
      el.innerHTML = '<p class="text-muted text-center py-3 small">尚無心願資料</p>';
      return;
    }

    el.innerHTML = items.slice(0, 8).map(wish => {
      const name  = wish.itemName ?? wish.name ?? '未命名';
      const desc  = wish.description ?? '';
      const price = wish.maxPrice ? `最高 NT$\u00a0${Number(wish.maxPrice).toLocaleString()}` : '';
      const stars = Number(wish.priority) > 0
        ? `<span class="wish-stars">${'★'.repeat(Math.min(5, Number(wish.priority)))}</span>` : '';
      return `
        <div class="analytics-item-row">
          ${stars}
          <span class="analytics-item-name" title="${desc || name}">${name}</span>
          ${price ? `<span class="analytics-item-price">${price}</span>` : ''}
        </div>`;
    }).join('');
  } catch {
    el.innerHTML = '<p class="text-muted text-center py-3 small">無法載入許願池資料</p>';
    if (statEl) statEl.textContent = '–';
  }
}

function _renderSearchKeywords() {
  const wrap = document.getElementById('searchKeywordsWrap');
  if (!wrap) return;
  const raw = localStorage.getItem('th_search_log');
  if (!raw) {
    wrap.innerHTML = '<p class="text-muted small">尚無搜尋紀錄。在搜尋頁加入追蹤後將自動累積。</p>';
    return;
  }
  try {
    const log = JSON.parse(raw);
    const sorted = Object.entries(log).sort((a, b) => b[1] - a[1]).slice(0, 20);
    if (!sorted.length) {
      wrap.innerHTML = '<p class="text-muted small">尚無搜尋紀錄。</p>';
      return;
    }
    const maxCnt = sorted[0][1] || 1;
    wrap.innerHTML = '<div class="keyword-tags">' +
      sorted.map(([kw, cnt]) => {
        const size = (0.78 + (cnt / maxCnt) * 0.42).toFixed(2);
        return `<span class="kw-tag" style="font-size:${size}rem">${kw}<sup class="kw-cnt">${cnt}</sup></span>`;
      }).join('') +
      '</div>';
  } catch {
    wrap.innerHTML = '<p class="text-muted small">無法讀取搜尋紀錄。</p>';
  }
}

async function _loadNewItems() {
  const el = document.getElementById('analyticsNewItems');
  if (!el) return;
  try {
    const res = await backendSvc.getCommodityList('all', { page: 1, limit: 8, sort: 'new' });
    const items = res?.data?.items ?? res?.data ?? res?.items ?? [];
    if (!items.length) { el.innerHTML = '<p class="text-muted text-center py-3 small">無資料</p>'; return; }
    el.innerHTML = items.map(item => {
      const img   = Array.isArray(item.images) ? item.images[0] : (item.image || '');
      const price = item.price != null ? `NT$\u00a0${Number(item.price).toLocaleString()}` : '–';
      return `
        <div class="analytics-item-row">
          ${img ? `<img class="analytics-item-img" src="${img}" alt="" onerror="this.style.display='none'">` : '<div class="analytics-item-img"></div>'}
          <span class="analytics-item-name">${item.name ?? '未知商品'}</span>
          <span class="analytics-item-price">${price}</span>
        </div>`;
    }).join('');
  } catch {
    el.innerHTML = '<p class="text-muted text-center py-3 small">無法載入商品資料</p>';
  }
}

function _updatePitchSummary() {
  const el = document.getElementById('pitchSummary');
  if (!el) return;
  const products = document.getElementById('stat-products')?.textContent || '–';
  const hot      = document.getElementById('stat-hot')?.textContent || '–';
  const wishes   = document.getElementById('stat-wishes')?.textContent || '–';

  el.innerHTML = `
    <div class="pitch-grid">
      <div class="pitch-item">
        <div class="pitch-num">${products}</div>
        <div class="pitch-label">件商品在平台流通</div>
      </div>
      <div class="pitch-item">
        <div class="pitch-num">${hot}</div>
        <div class="pitch-label">件熱門競標商品</div>
      </div>
      <div class="pitch-item">
        <div class="pitch-num">${wishes}</div>
        <div class="pitch-label">則未被滿足的學生需求</div>
      </div>
      <div class="pitch-item">
        <div class="pitch-num">中興大學</div>
        <div class="pitch-label">精準學生受眾群</div>
      </div>
    </div>
    <p class="pitch-note mt-3 mb-0">
      <i class="fa fa-info-circle me-1"></i>
      以上為可立即對外提供的平台數據。DAU/MAU、用戶畫像、全體搜尋熱詞等進階指標需後端依上方規格補充 API 後啟用。
    </p>`;
}

document.getElementById('refreshAnalyticsBtn')?.addEventListener('click', loadAnalytics);

// ════════════════════════════════════════════════════
//  檢舉管理
// ════════════════════════════════════════════════════
const REPORT_STATUS_LABEL = { pending: '審核中', approved: '已通過', rejected: '已駁回' };
const REPORT_STATUS_BADGE = { pending: 'badge bg-warning text-dark', approved: 'badge bg-success', rejected: 'badge bg-secondary' };

let _currentReportId = null;

async function loadAllReports(page = 1) {
  const list  = document.getElementById('reportsAdminList');
  const pager = document.getElementById('reportsAdminPager');
  if (!list) return;
  const status = document.getElementById('reportsStatusFilter')?.value || '';
  list.innerHTML = '<div class="text-muted text-center py-3 small"><span class="spinner-border spinner-border-sm me-1"></span>載入中...</div>';
  pager.innerHTML = '';
  try {
    const res = await backendSvc.getAllReports({ status: status || undefined, page, limit: 20 });
    const reports    = res?.data?.reports ?? [];
    const pagination = res?.data?.pagination ?? {};
    if (!reports.length) {
      list.innerHTML = '<div class="text-muted text-center py-4">目前沒有符合條件的檢舉紀錄</div>';
      return;
    }
    list.innerHTML = reports.map(r => {
      const st = REPORT_STATUS_LABEL[r.status] ?? r.status;
      const bc = REPORT_STATUS_BADGE[r.status] ?? 'badge bg-secondary';
      const date = r.createdAt ? new Date(r.createdAt).toLocaleString('zh-TW') : '';
      const canReview = r.status === 'pending';
      const atts = Array.isArray(r.attachments) ? r.attachments : [];
      const attHtml = atts.length ? `
        <div class="report-att-list mt-2">
          ${atts.map(a => {
            const url = esc(a.url ?? '');
            const mime = a.mimeType ?? '';
            if (mime.startsWith('image/')) {
              return `<a href="${url}" target="_blank" class="report-att-img-wrap" title="點擊查看原圖">
                <img src="${url}" class="report-att-img" alt="附件圖片" onerror="this.closest('a').style.display='none'">
              </a>`;
            }
            const icon = mime === 'application/pdf' ? 'fa-file-pdf-o' : 'fa-file-o';
            const label = mime === 'application/pdf' ? 'PDF' : (a.mimeType ?? '檔案');
            return `<a href="${url}" target="_blank" class="report-att-file"><i class="fa ${icon} me-1"></i>${label}</a>`;
          }).join('')}
        </div>` : '';
      return `
        <div class="news-admin-item mb-2" style="cursor:default;">
          <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
            <div>
              <span class="${bc}" style="font-size:0.75rem;">${st}</span>
              <strong class="ms-2">${esc(r.subject ?? '')}</strong>
            </div>
            <small class="text-muted">${date}</small>
          </div>
          <div class="text-muted small mt-1 d-flex flex-wrap gap-2 align-items-center">
            <span>類型：${esc(r.category ?? '')}</span>
            <span>檢舉人：<button class="report-user-btn" data-uid="${esc(r.reporterId ?? r.reporterUserId ?? '')}" data-name="${esc(r.reporter?.name ?? '')}">${esc(r.reporter?.name ?? r.reporterId ?? '—')}</button></span>
            <span>被檢舉人：<button class="report-user-btn" data-uid="${esc(r.reportedUserId ?? '')}" data-name="${esc(r.reportedUser?.name ?? '')}">${esc(r.reportedUser?.name ?? r.reportedUserId ?? '—')}</button></span>
          </div>
          ${r.detail ? `<div class="text-muted small mt-1" style="white-space:pre-wrap;">${esc(r.detail)}</div>` : ''}
          ${attHtml}
          ${canReview ? `<button class="btn btn-sm btn-outline-danger mt-2" onclick="openReviewModal('${esc(r.id)}','${esc(r.subject ?? '')}')"><i class="fa fa-gavel me-1"></i>審核</button>` : ''}
        </div>`;
    }).join('');

    const total = pagination.totalPages ?? 1;
    if (total > 1) {
      let html = '';
      for (let i = 1; i <= total; i++) {
        html += `<button class="btn btn-sm ${i === page ? 'btn-primary' : 'btn-outline-secondary'} mx-1" onclick="loadAllReports(${i})">${i}</button>`;
      }
      pager.innerHTML = html;
    }
  } catch (e) {
    list.innerHTML = `<div class="text-muted text-center py-4">載入失敗：${esc(e?.message || '請稍後再試')}</div>`;
  }
}
window.loadAllReports = loadAllReports;

document.getElementById('refreshReportsBtn')?.addEventListener('click', () => loadAllReports(1));
document.getElementById('reportsStatusFilter')?.addEventListener('change', () => loadAllReports(1));

document.getElementById('reportsAdminList')?.addEventListener('click', e => {
  const btn = e.target.closest('.report-user-btn');
  if (!btn || !btn.dataset.uid) return;
  viewUserProfile(btn.dataset.uid, btn.dataset.name);
});

async function viewUserProfile(uid, fallbackName = '') {
  const DEFAULT_AVATAR = '../webP/default-avatar.webp';
  let html = `<div class="text-center py-3"><span class="spinner-border spinner-border-sm"></span></div>`;
  const { value: popup } = await Swal.fire({
    title: '用戶資料',
    html,
    showConfirmButton: false,
    showCloseButton: true,
    width: 420,
    didOpen: async (pop) => {
      try {
        const res = await backendSvc.getPublicUserProfile(uid);
        const d = res?.data?.data ?? res?.data ?? {};
        const name    = d.name ?? fallbackName ?? '—';
        const photo   = d.photoURL ?? d.avatar ?? DEFAULT_AVATAR;
        const rate    = d.rate ?? d.creditScore ?? '—';
        const intro   = d.intro ?? d.description ?? '';
        const email   = d.email ?? '';
        const dept    = d.department ?? '';
        const isSuspended = d.suspended ?? d.isSuspended ?? false;
        pop.querySelector('.swal2-html-container').innerHTML = `
          <div style="display:flex;align-items:center;gap:14px;text-align:left;margin-bottom:16px;">
            <img src="${esc(photo)}" onerror="this.src='${DEFAULT_AVATAR}'"
              style="width:60px;height:60px;border-radius:50%;object-fit:cover;border:2px solid #e0e6ef;flex-shrink:0;">
            <div>
              <div style="font-size:16px;font-weight:700;color:#1a2b45;">${esc(name)}</div>
              <code style="font-size:11px;color:#888;">${esc(uid)}</code>
              ${isSuspended ? `<div style="margin-top:4px;"><span class="badge bg-danger" style="font-size:11px;">已停權</span></div>` : ''}
            </div>
          </div>
          <table style="width:100%;font-size:13px;border-collapse:collapse;">
            ${email ? `<tr><td style="padding:5px 0;color:#888;width:80px;">信箱</td><td>${esc(email)}</td></tr>` : ''}
            ${dept  ? `<tr><td style="padding:5px 0;color:#888;">系所</td><td>${esc(dept)}</td></tr>` : ''}
            <tr><td style="padding:5px 0;color:#888;">信譽積分</td><td><strong style="color:#004b97;">${esc(String(rate))}</strong></td></tr>
            ${intro ? `<tr><td style="padding:5px 0;color:#888;vertical-align:top;">自我介紹</td><td style="color:#4a627a;">${esc(intro)}</td></tr>` : ''}
          </table>`;
      } catch (err) {
        pop.querySelector('.swal2-html-container').innerHTML =
          `<div class="text-danger text-center py-3">載入失敗：${esc(err?.response?.data?.message || err?.message || '請稍後再試')}</div>`;
      }
    },
  });
}

let _reviewModal = null;
function openReviewModal(reportId, subject) {
  _currentReportId = reportId;
  document.getElementById('reviewReportBody').innerHTML = `
    <p class="mb-3">主旨：<strong>${esc(subject)}</strong></p>
    <div class="mb-3">
      <label class="form-label fw-bold">審核決定 <span class="text-danger">*</span></label>
      <p class="text-muted small">點擊下方「通過」或「駁回」按鈕送出審核結果。</p>
    </div>
    <div class="mb-3">
      <label class="form-label">信譽積分調整（通過時套用，負值扣分）</label>
      <input type="number" id="reviewScoreDelta" class="form-control" value="-10" step="1" placeholder="例：-10">
    </div>
    <div class="mb-3">
      <label class="form-label">審核備註 <span class="text-muted">（選填）</span></label>
      <textarea id="reviewNote" class="form-control" rows="3" placeholder="給當事人看到的備註說明"></textarea>
    </div>
  `;
  if (!_reviewModal) {
    _reviewModal = new bootstrap.Modal(document.getElementById('reviewReportModal'));
  }
  _reviewModal.show();
}
window.openReviewModal = openReviewModal;

async function submitReview(status) {
  if (!_currentReportId) return;
  const scoreDelta  = parseInt(document.getElementById('reviewScoreDelta')?.value ?? '0', 10) || 0;
  const reviewNote  = document.getElementById('reviewNote')?.value.trim() ?? '';
  const payload     = { status, scoreDelta, reviewNote };
  try {
    await backendSvc.reviewReport(_currentReportId, payload);
    _reviewModal?.hide();
    _currentReportId = null;
    Swal.fire({ icon: 'success', title: '審核完成', timer: 1500, showConfirmButton: false });
    loadAllReports(1);
  } catch (e) {
    const msg = e?.response?.data?.message || e?.message || '請稍後再試';
    Swal.fire({ icon: 'error', title: '審核失敗', text: msg });
  }
}

document.getElementById('reviewApproveBtn')?.addEventListener('click', () => submitReview('approved'));
document.getElementById('reviewRejectBtn')?.addEventListener('click',  () => submitReview('rejected'));

// ════════════════════════════════════════════════════
//  評論標籤管理
// ════════════════════════════════════════════════════
async function loadReviewTags() {
  const list = document.getElementById('reviewTagsList');
  if (!list) return;
  list.innerHTML = '<div class="text-muted text-center py-3 small"><span class="spinner-border spinner-border-sm me-1"></span>載入中...</div>';
  try {
    const res = await backendSvc.getReviewTags();
    const tags = res?.data?.data?.tags ?? [];
    if (!tags.length) {
      list.innerHTML = '<div class="text-muted text-center py-3">目前沒有標籤</div>';
      return;
    }
    list.innerHTML = `<table class="table table-sm align-middle">
      <thead><tr><th>標籤</th><th>說明</th><th>正面</th><th>操作</th></tr></thead>
      <tbody>
        ${tags.map(t => `
          <tr>
            <td><code>${esc(t.tag)}</code></td>
            <td>${esc(t.description ?? t.meaning ?? '')}</td>
            <td>${t.positive ? '<span class="badge bg-success">是</span>' : '<span class="badge bg-secondary">否</span>'}</td>
            <td>
              <button class="btn btn-sm btn-outline-secondary" onclick="openEditTagModal('${esc(t.tag)}','${esc(t.description ?? t.meaning ?? '')}',${t.positive})">
                <i class="fa fa-pencil"></i>
              </button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;
  } catch (e) {
    list.innerHTML = `<div class="text-muted text-center py-3">載入失敗：${esc(e?.message || '請稍後再試')}</div>`;
  }
}

document.getElementById('refreshTagsBtn')?.addEventListener('click', loadReviewTags);

document.getElementById('createTagForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const tag      = document.getElementById('newTagName').value.trim();
  const meaning  = document.getElementById('newTagMeaning').value.trim();
  const delta    = parseInt(document.getElementById('newTagDelta').value, 10);
  const resultBox = document.getElementById('createTagResult');
  if (!tag || !meaning || isNaN(delta)) return;
  try {
    await backendSvc.createReviewTag({ tag, description: meaning, delta });
    resultBox.className = 'result-box mt-3 success';
    resultBox.innerHTML = `<div class="fw-bold">✅ 標籤「${esc(tag.toUpperCase())}」建立成功</div>`;
    document.getElementById('newTagName').value = '';
    document.getElementById('newTagMeaning').value = '';
    document.getElementById('newTagDelta').value = '';
    loadReviewTags();
  } catch (err) {
    const msg = err?.response?.data?.message || err?.message || '請稍後再試';
    resultBox.className = 'result-box mt-3 error';
    resultBox.innerHTML = `<div class="fw-bold mb-1">❌ 建立失敗</div><div>${esc(msg)}</div>`;
  } finally {
    resultBox.classList.remove('d-none');
  }
});

function openEditTagModal(tag, meaning, positive) {
  Swal.fire({
    title: `編輯標籤 ${tag}`,
    html: `
      <div class="text-start">
        <label class="form-label fw-bold">說明</label>
        <input id="editTagMeaning" class="form-control mb-3" value="${esc(meaning)}" maxlength="100">
        <label class="form-label fw-bold">分數增減 (delta)</label>
        <input type="number" id="editTagDelta" class="form-control mb-3" placeholder="例：1 或 -5" min="-100" max="100">
        <label class="form-label fw-bold">啟用狀態</label>
        <select id="editTagEnabled" class="form-select">
          <option value="true" ${positive ? 'selected' : ''}>啟用</option>
          <option value="false" ${!positive ? 'selected' : ''}>停用</option>
        </select>
      </div>`,
    showCancelButton: true,
    confirmButtonText: '儲存',
    cancelButtonText: '取消',
    focusConfirm: false,
    preConfirm: () => {
      const delta = parseInt(document.getElementById('editTagDelta').value, 10);
      if (isNaN(delta)) { Swal.showValidationMessage('請輸入分數增減'); return false; }
      return {
        description: document.getElementById('editTagMeaning').value.trim(),
        delta,
        enabled: document.getElementById('editTagEnabled').value === 'true',
      };
    }
  }).then(async ({ isConfirmed, value }) => {
    if (!isConfirmed || !value) return;
    try {
      await backendSvc.updateReviewTag(tag, value);
      Swal.fire({ icon: 'success', title: '更新成功', timer: 1500, showConfirmButton: false });
      loadReviewTags();
    } catch (err) {
      Swal.fire({ icon: 'error', title: '更新失敗', text: err?.response?.data?.message || '請稍後再試' });
    }
  });
}
window.openEditTagModal = openEditTagModal;

// ════════════════════════════════════════════════════
//  檢舉類別管理
// ════════════════════════════════════════════════════
async function loadReportCategories() {
  const list = document.getElementById('reportCatsList');
  if (!list) return;
  list.innerHTML = '<div class="text-muted text-center py-3 small"><span class="spinner-border spinner-border-sm me-1"></span>載入中...</div>';
  try {
    const res = await backendSvc.getReportCategories();
    const cats = res?.data ?? res ?? [];
    const arr = Array.isArray(cats) ? cats : (cats?.categories ?? cats?.data ?? []);
    if (!arr.length) {
      list.innerHTML = '<div class="text-muted text-center py-3">目前沒有檢舉類別</div>';
      return;
    }
    list.innerHTML = `<table class="table table-sm align-middle">
      <thead><tr><th>類別代碼</th><th>說明</th><th>狀態</th></tr></thead>
      <tbody>
        ${arr.map(c => `
          <tr>
            <td><code>${esc(c.category ?? c.key ?? '')}</code></td>
            <td>${esc(c.meaning ?? c.description ?? '')}</td>
            <td>${c.enabled !== false
              ? '<span class="badge bg-success">啟用</span>'
              : '<span class="badge bg-secondary">停用</span>'}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
  } catch (err) {
    const msg = err?.response?.data?.message || err?.message || '請稍後再試';
    list.innerHTML = `<div class="text-danger text-center py-3 small">載入失敗：${esc(msg)}</div>`;
  }
}

document.getElementById('refreshReportCatsBtn')?.addEventListener('click', loadReportCategories);

document.getElementById('createReportCatForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const resultBox = document.getElementById('createReportCatResult');
  const category = document.getElementById('newCatKey').value.trim();
  const description = document.getElementById('newCatDesc').value.trim();
  if (!category || !description) return;
  if (!/^[a-zA-Z0-9_]+$/.test(category)) {
    resultBox.className = 'result-box mt-3 error';
    resultBox.innerHTML = '<div class="fw-bold">❌ 類別代碼只能包含英文字母、數字與底線</div>';
    resultBox.classList.remove('d-none');
    return;
  }
  try {
    resultBox.className = 'result-box mt-3 d-none';
    await backendSvc.createReportCategory({ category, description });
    resultBox.className = 'result-box mt-3 success';
    resultBox.innerHTML = `<div class="fw-bold">✅ 類別「${esc(category)}」建立成功</div>`;
    document.getElementById('newCatKey').value = '';
    document.getElementById('newCatDesc').value = '';
    loadReportCategories();
  } catch (err) {
    const msg = err?.response?.data?.message || err?.message || '請稍後再試';
    resultBox.className = 'result-box mt-3 error';
    resultBox.innerHTML = `<div class="fw-bold mb-1">❌ 建立失敗</div><div>${esc(msg)}</div>`;
  } finally {
    resultBox.classList.remove('d-none');
  }
});
