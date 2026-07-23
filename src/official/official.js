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
    cancelButtonText: '取消',
    customClass: {
      title: 'swal-logout-title',
      htmlContainer: 'swal-logout-text'
    }
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
  if (panelId === 'panel-users') loadAdminUsers(1);
  if (panelId === 'panel-reports') loadAllReports(1);
  if (panelId === 'panel-report-categories') loadReportCategories();
  if (panelId === 'panel-review-tags') { loadReviewTagGroups(); loadReviewTags(); }
  if (panelId === 'panel-tickets') loadAdminTickets(1);
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
let broadcastFiles = [];
const BROADCAST_MAX     = 10;
const BROADCAST_MAX_MB  = 5 * 1024 * 1024;

const imgArea  = document.getElementById('broadcastImgArea');
const imgInput = document.getElementById('broadcastImgInput');
const imgList  = document.getElementById('broadcastImgList');

imgArea.addEventListener('click', () => imgInput.click());
imgArea.addEventListener('dragover', e => { e.preventDefault(); imgArea.classList.add('dragover'); });
imgArea.addEventListener('dragleave', () => imgArea.classList.remove('dragover'));
imgArea.addEventListener('drop', e => {
  e.preventDefault();
  imgArea.classList.remove('dragover');
  addBroadcastFiles(Array.from(e.dataTransfer.files));
});
imgInput.addEventListener('change', () => {
  addBroadcastFiles(Array.from(imgInput.files));
  imgInput.value = '';
});

async function addBroadcastFiles(files) {
  for (const f of files) {
    if (broadcastFiles.length >= BROADCAST_MAX) {
      Swal.fire({ icon: 'warning', title: `最多 ${BROADCAST_MAX} 張圖片` });
      break;
    }
    if (!f.type.startsWith('image/')) continue;
    if (f.size > BROADCAST_MAX_MB) {
      Swal.fire({ icon: 'warning', title: `「${f.name}」超過 5MB 限制` });
      continue;
    }
    const url = await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.readAsDataURL(f);
    });
    broadcastFiles.push({ file: f, url });
  }
  renderBroadcastImgList();
}

function removeBroadcastFile(i) {
  broadcastFiles.splice(i, 1);
  renderBroadcastImgList();
}

function renderBroadcastImgList() {
  if (broadcastFiles.length === 0) { imgList.innerHTML = ''; return; }
  imgList.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">${
    broadcastFiles.map(({ url, file }, i) => `
      <div style="position:relative;display:inline-block;">
        <img src="${url}" alt="${esc(file.name)}"
             style="width:80px;height:80px;object-fit:cover;border-radius:10px;border:1px solid #d6e2ec;display:block;">
        <button type="button" onclick="removeBroadcastFile(${i})"
                style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;border:none;background:#c97f5a;color:#fff;font-size:12px;line-height:20px;text-align:center;cursor:pointer;padding:0;"
                aria-label="移除">×</button>
        <div style="font-size:10px;color:#6f87a0;max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px;">${esc(file.name)}</div>
      </div>`).join('')
  }</div>`;
}

function clearBroadcastFiles() {
  broadcastFiles = [];
  renderBroadcastImgList();
}
// onclick 屬性需要 global scope（module 內函式預設不是全域）
window.removeBroadcastFile = removeBroadcastFile;

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
  if (!message && broadcastFiles.length === 0) {
    Swal.fire({ icon: 'warning', title: '請輸入公告內容或選擇圖片' });
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> 發送中...';
  resultBox.className = 'result-box mt-3 d-none';

  try {
    await chatSvc.broadCastOfficial(channelId, message || undefined, broadcastFiles.map(e => e.file));
    resultBox.className = 'result-box mt-3 success';
    resultBox.innerHTML = '<div class="fw-bold">✅ 公告發送成功！</div>';
    document.getElementById('broadcastMessage').value = '';
    clearBroadcastFiles();
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

window.removeBroadcastFile = removeBroadcastFile;

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
    confirmButtonColor: '#c97f5a',
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
//  數據分析（Admin Stats API）
// ════════════════════════════════════════════════════

// ── 日期工具 ──
function _todayStr() { return new Date().toISOString().slice(0, 10); }
function _daysAgoStr(n) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); }

function _initDateRange() {
  const s = document.getElementById('statsStartDate');
  const e = document.getElementById('statsEndDate');
  if (s && !s.value) s.value = '2026-01-01';
  if (e && !e.value) e.value = _todayStr();
}

function _getDateParams() {
  const start = document.getElementById('statsStartDate')?.value;
  const end   = document.getElementById('statsEndDate')?.value;
  return {
    startDate: start ? `${start}T00:00:00` : _daysAgoStr(30),
    endDate:   end   ? `${end}T23:59:59`   : _todayStr(),
  };
}

// ── Chart 管理 ──
const _statsCharts = {};

function _makeChart(id, config) {
  if (_statsCharts[id]) { _statsCharts[id].destroy(); delete _statsCharts[id]; }
  const canvas = document.getElementById(id);
  if (!canvas) return null;
  _statsCharts[id] = new Chart(canvas, config);
  return _statsCharts[id];
}

// ── Chart config helpers（配色比照設計系統：藍綠光譜為主，terracotta 為唯一暖色點綴） ──
const _PALETTE = ['#004b97','#4a85c4','#7eb8d8','#abdad5','#003a78','#1a5b85','#2d7d70','#6f87a0','#c97f5a','#8fb8a8'];

function _trendCfg(labels, data, label, color = '#004b97') {
  return {
    type: 'line',
    data: { labels, datasets: [{ label, data, borderColor: color, backgroundColor: color + '22', fill: true, tension: 0.4, pointRadius: 3 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#d6e2ec' } },
        x: { grid: { display: false }, ticks: { maxTicksLimit: 10, maxRotation: 0 } },
      },
    },
  };
}

function _doughnutCfg(labels, data) {
  return {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: _PALETTE, borderWidth: 2, borderColor: '#fff' }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } } },
    },
  };
}

function _barCfg(labels, data, label) {
  return {
    type: 'bar',
    data: { labels, datasets: [{ label, data, backgroundColor: _PALETTE.map(c => c + 'bb'), borderColor: _PALETTE, borderWidth: 1.5, borderRadius: 5 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#f0f4fa' } },
        x: { grid: { display: false } },
      },
    },
  };
}

// ── Data parsers ──
function _parseTrend(arr) {
  if (!Array.isArray(arr) || !arr.length) return { labels: [], values: [] };
  return {
    labels: arr.map(d => d.date ?? d.day ?? d.period ?? d.label ?? ''),
    values: arr.map(d => d.count ?? d.value ?? d.total ?? 0),
  };
}

function _parseDist(dist) {
  if (Array.isArray(dist))
    return { labels: dist.map(d => d.label ?? d.name ?? d.key ?? ''), values: dist.map(d => d.count ?? d.value ?? 0) };
  if (dist && typeof dist === 'object')
    return { labels: Object.keys(dist), values: Object.values(dist).map(Number) };
  return { labels: [], values: [] };
}

function _statBlock(items) {
  return `<div class="row g-2">` +
    items.map(({ label, value, color }) =>
      `<div class="col-6"><div class="p-3 rounded" style="background:#f8fafc;border:1.5px solid #e0e6ef;">
        <div class="text-muted small mb-1">${label}</div>
        <div style="font-size:1.2rem;font-weight:700;color:${color || '#004b97'};">${value ?? '–'}</div>
      </div></div>`
    ).join('') +
    `</div>`;
}

function _listRows(items, labelFn, countFn) {
  if (!items?.length) return '<p class="text-muted small p-3 mb-0">無資料</p>';
  const getCnt = countFn ?? (item => item.count ?? item.total ?? item.orderCount ?? '');
  return items.slice(0, 5).map((item, i) =>
    `<div class="analytics-item-row">
      <span class="me-2 fw-bold text-muted" style="min-width:1.4rem;">${i + 1}</span>
      <span class="analytics-item-name">${esc(labelFn(item))}</span>
      <span class="analytics-item-price">${getCnt(item)}</span>
    </div>`
  ).join('');
}

function _errHtml(msg = '載入失敗') {
  return `<p class="text-danger text-center small py-3">${msg}</p>`;
}

// ── API fetch ──
async function _fetchStats(path, params) {
  const res = await backendSvc.http.get(path, { params });
  return res.data?.data ?? res.data;
}

// ── 首頁即時數據（用戶總數 / 信箱已驗證總數 / 許願總數 / 訂單總數 / 待認領客服單） ──
async function loadHomeStats() {
  const ids = ['home-stat-users', 'home-stat-verified', 'home-stat-wishes', 'home-stat-orders'];
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val != null ? Number(val).toLocaleString() : '–'; };
  try {
    const [dash, users] = await Promise.all([
      _fetchStats('/api/admin/stats/dashboard'),
      _fetchStats('/api/admin/stats/users'),
    ]);
    const ov = dash?.overview ?? dash;
    const verified = (users?.emailVerificationStats ?? []).find(e => e.verified === true)?.count ?? 0;
    set('home-stat-users',    ov?.totalUsers);
    set('home-stat-verified', verified);
    set('home-stat-wishes',   ov?.totalWishes);
    set('home-stat-orders',   ov?.totalOrders);
  } catch {
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.textContent = '–'; });
  }

  try {
    const pending = await chatSvc.listAdminTickets('UNRESOLVED', 1, 1);
    const el = document.getElementById('home-stat-pending-tickets');
    if (el) el.textContent = `${(pending?.data?.total ?? 0).toLocaleString()} 筆`;
  } catch {
    const el = document.getElementById('home-stat-pending-tickets');
    if (el) el.textContent = '–';
  }
}
loadHomeStats();

// ── Per-tab loaders ──
async function _loadDashboard(params) {
  const ids = ['stat-total-users','stat-total-products','stat-total-orders','stat-total-reports','stat-total-wishpool','stat-new-users-today','stat-active-users-7d'];
  ids.forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = '<span class="spinner-border spinner-border-sm"></span>'; });
  try {
    const d = await _fetchStats('/api/admin/stats/dashboard', params);
    const ov = d?.overview ?? d;
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val ?? '–'; };
    set('stat-total-users',       ov?.totalUsers);
    set('stat-total-products',    ov?.totalCommodities ?? ov?.activeCommodities);
    set('stat-total-orders',      ov?.totalOrders);
    set('stat-total-reports',     ov?.pendingReports);
    set('stat-total-wishpool',    ov?.totalWishes);
    set('stat-new-users-today',   ov?.newUsersToday);
    set('stat-active-users-7d',   ov?.activeUsers7d);
    document.getElementById('stat-total-error')?.classList.add('d-none');

    // 趨勢折線圖
    const { labels: tL, values: tV } = _parseTrend(d?.trends ?? []);
    _makeChart('chart-dashboard-trend', _trendCfg(tL, tV, '活躍人數', '#004b97'));
  } catch {
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.textContent = '–'; });
    document.getElementById('stat-total-error')?.classList.remove('d-none');
  }
}

async function _loadUserStats(params) {
  try {
    const d = await _fetchStats('/api/admin/stats/users', params);

    // 註冊趨勢
    const { labels: rL, values: rV } = _parseTrend(d?.registrationTrend ?? []);
    _makeChart('chart-user-reg-trend', _trendCfg(rL, rV, '新增用戶', '#004b97'));

    // 角色分布 [{ role, count }]
    const roleArr = d?.roleDistribution ?? [];
    _makeChart('chart-user-role', _doughnutCfg(
      roleArr.map(r => r.role ?? r.label ?? ''),
      roleArr.map(r => r.count ?? 0)
    ));

    // 評分分布 [{ range, count }]
    const scoreArr = d?.scoreDistribution ?? [];
    _makeChart('chart-user-rating', _barCfg(
      scoreArr.map(s => s.range ?? s.label ?? ''),
      scoreArr.map(s => s.count ?? 0),
      '人數'
    ));

    // 統計數字
    const act = d?.activeUsers ?? {};
    const susp = (d?.suspensionStats ?? []).filter(s => s.level !== 'NONE').reduce((n, s) => n + (s.count ?? 0), 0);
    const emailStats = d?.emailVerificationStats ?? [];
    const verified   = emailStats.find(e => e.verified === true)?.count ?? 0;
    const unverified = emailStats.find(e => e.verified === false)?.count ?? 0;
    const statsEl = document.getElementById('user-extra-stats');
    if (statsEl) statsEl.innerHTML = _statBlock([
      { label: '7 天活躍用戶',  value: act.last7Days },
      { label: '14 天活躍用戶', value: act.last14Days },
      { label: '30 天活躍用戶', value: act.last30Days },
      { label: '停權用戶數',    value: susp || 0, color: susp > 0 ? '#c97f5a' : undefined },
      { label: '信箱已驗證',    value: verified },
      { label: '信箱未驗證',    value: unverified, color: unverified > 0 ? '#c97f5a' : undefined },
    ]);

    // 信箱驗證狀態圓餅圖
    if (emailStats.length) {
      _makeChart('chart-user-email-verify', _doughnutCfg(
        ['已驗證', '未驗證'],
        [verified, unverified]
      ));
    }
  } catch { /* silent */ }
}

async function _loadCommodityStats(params) {
  try {
    const d = await _fetchStats('/api/admin/stats/commodities', params);

    // 上架趨勢
    const { labels: tL, values: tV } = _parseTrend(d?.listingTrend ?? []);
    _makeChart('chart-commodity-trend', _trendCfg(tL, tV, '新增商品', '#4a85c4'));

    // 分類分布 [{ category, count }]
    const catArr = d?.categoryDistribution ?? [];
    _makeChart('chart-commodity-category', _doughnutCfg(
      catArr.map(c => c.category ?? c.label ?? ''),
      catArr.map(c => c.count ?? 0)
    ));

    // 價格統計（API 用 average 不是 avg）
    const price = d?.priceStats ?? {};
    const priceEl = document.getElementById('commodity-price-stats');
    if (priceEl) priceEl.innerHTML = _statBlock([
      { label: '平均售價', value: price.average != null ? `NT$ ${Number(price.average).toLocaleString(undefined,{maximumFractionDigits:0})}` : null },
      { label: '最高售價', value: price.max     != null ? `NT$ ${Number(price.max).toLocaleString()}` : null },
      { label: '最低售價', value: price.min     != null ? `NT$ ${Number(price.min).toLocaleString()}` : null },
      { label: '熱門商品', value: d?.hotCount,  color: '#4a85c4' },
    ]);

    // 熱門賣家（count 欄位是 commodityCount）
    const topSellers = d?.topSellers ?? [];
    document.getElementById('commodity-top-sellers').innerHTML = _listRows(
      topSellers,
      i => i.name ?? i.username ?? '–',
      i => i.commodityCount ?? i.count ?? ''
    );
  } catch {
    document.getElementById('commodity-top-sellers').innerHTML = _errHtml();
  }
}

async function _loadOrderStats(params) {
  try {
    const d = await _fetchStats('/api/admin/stats/orders', params);

    const { labels: tL, values: tV } = _parseTrend(d?.orderTrend ?? []);
    _makeChart('chart-order-trend', _trendCfg(tL, tV, '訂單數', '#003a78'));

    // statusDistribution [{ status, count }]
    const statArr = d?.statusDistribution ?? [];
    _makeChart('chart-order-status', _doughnutCfg(
      statArr.map(s => s.status ?? s.label ?? ''),
      statArr.map(s => s.count ?? 0)
    ));

    const cancelRate = d?.cancelRate ?? d?.cancellationRate;
    const pct = v => (v != null && v !== '') ? `${(Number(v) * (Number(v) > 1 ? 1 : 100)).toFixed(1)}%` : null;
    const revEl = document.getElementById('order-revenue-stats');
    if (revEl) revEl.innerHTML = _statBlock([
      { label: '總營收',    value: d?.totalRevenue != null ? `NT$ ${Number(d.totalRevenue).toLocaleString()}` : null, color: 'rgb(36, 182, 133)' },
      { label: '平均客單價', value: d?.averageOrderAmount != null ? `NT$ ${Number(d.averageOrderAmount).toLocaleString(undefined,{maximumFractionDigits:0})}` : null },
      { label: '取消率',    value: pct(cancelRate), color: '#c97f5a' },
      { label: '完成訂單',  value: d?.completedOrders ?? d?.completed },
    ]);

    document.getElementById('order-top-buyers').innerHTML  = _listRows(d?.topBuyers  ?? [], i => i.name ?? i.username ?? '–');
    document.getElementById('order-top-sellers').innerHTML = _listRows(d?.topSellers ?? [], i => i.name ?? i.username ?? '–');
  } catch {
    document.getElementById('order-revenue-stats').innerHTML = _errHtml();
  }
}

async function _loadReportStats(params) {
  try {
    const d = await _fetchStats('/api/admin/stats/reports', params);

    const { labels: tL, values: tV } = _parseTrend(d?.reportTrend ?? []);
    _makeChart('chart-report-trend', _trendCfg(tL, tV, '檢舉數', '#c97f5a'));

    // categoryDistribution [{ category, count }]
    const catArr = d?.categoryDistribution ?? [];
    _makeChart('chart-report-category', _barCfg(
      catArr.map(c => c.category ?? c.label ?? ''),
      catArr.map(c => c.count ?? 0),
      '件'
    ));

    const pct = v => (v != null && v !== '') ? `${(Number(v) * (Number(v) > 1 ? 1 : 100)).toFixed(1)}%` : null;
    const avgTime = d?.avgReviewTimeHours ?? d?.avgReviewTime ?? d?.avgTime;
    const revEl = document.getElementById('report-review-stats');
    if (revEl) revEl.innerHTML = _statBlock([
      { label: '審核通過率',   value: pct(d?.approvalRate), color: 'rgb(36, 182, 133)' },
      { label: '平均審核時間', value: avgTime != null && avgTime !== '' ? `${Number(avgTime).toFixed(1)} 小時` : null },
      { label: '待審核件數',   value: (d?.statusDistribution ?? []).find(s => s.status === 'pending')?.count ?? d?.pendingCount },
      { label: '本期檢舉總數', value: (d?.statusDistribution ?? []).reduce((n, s) => n + (s.count ?? 0), 0) || null },
    ]);
  } catch {
    document.getElementById('report-review-stats').innerHTML = _errHtml();
  }
}

async function _loadWishpoolStats(params) {
  try {
    const d = await _fetchStats('/api/admin/stats/wishpool', params);

    // wishTrend（API 用 wishTrend 不是 wishpoolTrend）
    const { labels: tL, values: tV } = _parseTrend(d?.wishTrend ?? d?.wishpoolTrend ?? []);
    _makeChart('chart-wishpool-trend', _trendCfg(tL, tV, '新增心願', '#7eb8d8'));

    // statusDistribution [{ status, count }]
    const statArr = d?.statusDistribution ?? [];
    _makeChart('chart-wishpool-status', _doughnutCfg(
      statArr.map(s => s.status ?? s.label ?? ''),
      statArr.map(s => s.count ?? 0)
    ));

    // priorityDistribution [{ priority/level, count }]
    const prioArr = d?.priorityDistribution ?? [];
    _makeChart('chart-wishpool-priority', _barCfg(
      prioArr.map(p => String(p.priority ?? p.level ?? p.label ?? '')),
      prioArr.map(p => p.count ?? 0),
      '數量'
    ));

    // budgetDistribution [{ range, count }]
    const budArr = d?.budgetDistribution ?? [];
    _makeChart('chart-wishpool-budget', _barCfg(
      budArr.map(b => b.range ?? b.label ?? ''),
      budArr.map(b => b.count ?? 0),
      '數量'
    ));
  } catch { /* silent */ }
}

async function _loadSearchStats(params) {
  try {
    const d = await _fetchStats('/api/admin/stats/search', params);
    const { labels: tL, values: tV } = _parseTrend(d?.searchTrend ?? d?.trend ?? []);
    _makeChart('chart-search-trend', _trendCfg(tL, tV, '搜尋次數', '#4a85c4'));
    const kws = d?.popularKeywords ?? d?.topKeywords ?? d?.keywords ?? [];
    const kwEl = document.getElementById('search-keywords-cloud');
    if (kwEl) {
      if (!kws.length) {
        kwEl.innerHTML = '<p class="text-muted small p-3 mb-0">無資料</p>';
      } else {
        const maxCnt = Math.max(...kws.map(k => k.count ?? k.value ?? 1), 1);
        kwEl.innerHTML = '<div class="keyword-tags p-3">' +
          kws.slice(0, 20).map(k => {
            const word = k.keyword ?? k.word ?? k.label ?? String(k);
            const cnt  = k.count ?? k.value ?? 0;
            const size = (0.78 + (cnt / maxCnt) * 0.44).toFixed(2);
            return `<span class="kw-tag" style="font-size:${size}rem">${esc(word)}<sup class="kw-cnt">${cnt}</sup></span>`;
          }).join('') + '</div>';
      }
    }
    // searchTypeDistribution: { loggedIn, guest }
    const authDist = d?.searchTypeDistribution ?? d?.loginVsGuest ?? {};
    _makeChart('chart-search-auth', _doughnutCfg(
      ['登入用戶', '訪客'],
      [authDist.loggedIn ?? 0, authDist.guest ?? 0]
    ));
  } catch { /* silent */ }
}

// ── Tab 切換 ──
let _activeStatsTab = 'tab-dashboard';
const _loadedStatsTabs = new Set();

function _switchStatsTab(tabId) {
  document.querySelectorAll('.stats-tab').forEach(t => t.classList.add('d-none'));
  document.querySelectorAll('[data-stats-tab]').forEach(b => b.classList.remove('active'));
  document.getElementById(tabId)?.classList.remove('d-none');
  document.querySelector(`[data-stats-tab="${tabId}"]`)?.classList.add('active');
  _activeStatsTab = tabId;
  if (!_loadedStatsTabs.has(tabId)) {
    _loadedStatsTabs.add(tabId);
    _loadStatsTab(tabId);
  }
}

async function _loadStatsTab(tabId) {
  const p = _getDateParams();
  switch (tabId) {
    case 'tab-dashboard':    await _loadDashboard(p);     break;
    case 'tab-users':        await _loadUserStats(p);     break;
    case 'tab-commodities':  await _loadCommodityStats(p); break;
    case 'tab-orders':       await _loadOrderStats(p);    break;
    case 'tab-stat-reports': await _loadReportStats(p);   break;
    case 'tab-wishpool':     await _loadWishpoolStats(p); break;
    case 'tab-search':       await _loadSearchStats(p);   break;
  }
}

async function loadAnalytics() {
  _loadedStatsTabs.clear();
  _loadedStatsTabs.add(_activeStatsTab);
  await _loadStatsTab(_activeStatsTab);
}

// ── Wire-up ──
document.getElementById('refreshAnalyticsBtn')?.addEventListener('click', () => {
  _loadedStatsTabs.clear();
  loadAnalytics();
});

document.querySelectorAll('[data-stats-tab]').forEach(btn => {
  btn.addEventListener('click', () => _switchStatsTab(btn.dataset.statsTab));
});

document.querySelectorAll('.stats-quick-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const days = Number(btn.dataset.days);
    document.getElementById('statsStartDate').value = _daysAgoStr(days);
    document.getElementById('statsEndDate').value   = _todayStr();
    _loadedStatsTabs.clear();
    loadAnalytics();
  });
});

_initDateRange();

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
//  評論標籤群組管理
// ════════════════════════════════════════════════════
const TARGET_ROLE_LABEL = { BUYER_TO_SELLER: '買家→賣家', SELLER_TO_BUYER: '賣家→買家' };

async function loadReviewTagGroups() {
  const list = document.getElementById('reviewTagGroupsList');
  if (!list) return;
  list.innerHTML = '<div class="text-muted text-center py-3 small"><span class="spinner-border spinner-border-sm me-1"></span>載入中...</div>';
  try {
    const res = await backendSvc.getReviewTagGroups();
    const groups = res?.data?.groups ?? [];
    if (!groups.length) {
      list.innerHTML = '<div class="text-muted text-center py-3">目前沒有標籤群組</div>';
      return;
    }
    list.innerHTML = `<table class="table table-sm align-middle">
      <thead><tr><th>群組名稱</th><th>適用對象</th><th>選取模式</th><th>標籤數</th><th>操作</th></tr></thead>
      <tbody>
        ${groups.map(g => `
          <tr>
            <td>${esc(g.name)}</td>
            <td><span class="badge bg-secondary">${esc(TARGET_ROLE_LABEL[g.targetRole] ?? g.targetRole)}</span></td>
            <td>${g.exclusive
              ? '<span class="badge bg-info text-dark">互斥（單選）</span>'
              : '<span class="badge bg-light text-dark border">可複選</span>'}</td>
            <td>${g.tagCount ?? 0}</td>
            <td class="d-flex gap-1">
              <button class="btn btn-sm btn-outline-secondary" onclick="openEditTagGroupModal('${esc(g.id)}','${esc(g.name)}','${esc(g.targetRole)}',${g.exclusive})">
                <i class="fa fa-pencil"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger" onclick="deleteTagGroup('${esc(g.id)}','${esc(g.name)}',${g.tagCount ?? 0})">
                <i class="fa fa-trash"></i>
              </button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;
  } catch (e) {
    list.innerHTML = `<div class="text-muted text-center py-3">載入失敗：${esc(e?.message || '請稍後再試')}</div>`;
  }
}

document.getElementById('refreshTagGroupsBtn')?.addEventListener('click', loadReviewTagGroups);

document.getElementById('createTagGroupForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name      = document.getElementById('newGroupName').value.trim();
  const targetRole = document.getElementById('newGroupTargetRole').value;
  const exclusive  = document.getElementById('newGroupExclusive').value === 'true';
  const resultBox  = document.getElementById('createTagGroupResult');
  if (!name) return;
  try {
    resultBox.className = 'result-box mt-3 d-none';
    await backendSvc.createReviewTagGroup({ name, targetRole, exclusive });
    resultBox.className = 'result-box mt-3 success';
    resultBox.innerHTML = `<div class="fw-bold">✅ 群組「${esc(name)}」建立成功</div>`;
    document.getElementById('newGroupName').value = '';
    loadReviewTagGroups();
  } catch (err) {
    const msg = err?.response?.data?.message || err?.message || '請稍後再試';
    resultBox.className = 'result-box mt-3 error';
    resultBox.innerHTML = `<div class="fw-bold mb-1">❌ 建立失敗</div><div>${esc(msg)}</div>`;
  } finally {
    resultBox.classList.remove('d-none');
  }
});

function openEditTagGroupModal(id, name, targetRole, exclusive) {
  Swal.fire({
    title: `編輯群組`,
    html: `
      <div class="text-start">
        <label class="form-label fw-bold">群組名稱</label>
        <input id="editGroupName" class="form-control mb-3" value="${esc(name)}" maxlength="50">
        <label class="form-label fw-bold">適用對象</label>
        <select id="editGroupTargetRole" class="form-select mb-3">
          <option value="BUYER_TO_SELLER" ${targetRole === 'BUYER_TO_SELLER' ? 'selected' : ''}>買家評賣家</option>
          <option value="SELLER_TO_BUYER" ${targetRole === 'SELLER_TO_BUYER' ? 'selected' : ''}>賣家評買家</option>
        </select>
        <label class="form-label fw-bold">選取模式</label>
        <select id="editGroupExclusive" class="form-select">
          <option value="true" ${exclusive ? 'selected' : ''}>互斥（單選）</option>
          <option value="false" ${!exclusive ? 'selected' : ''}>可複選</option>
        </select>
      </div>`,
    showCancelButton: true,
    confirmButtonText: '儲存',
    cancelButtonText: '取消',
    focusConfirm: false,
    preConfirm: () => {
      const updatedName = document.getElementById('editGroupName').value.trim();
      if (!updatedName) { Swal.showValidationMessage('請輸入群組名稱'); return false; }
      return {
        name: updatedName,
        targetRole: document.getElementById('editGroupTargetRole').value,
        exclusive: document.getElementById('editGroupExclusive').value === 'true',
      };
    }
  }).then(async ({ isConfirmed, value }) => {
    if (!isConfirmed || !value) return;
    try {
      await backendSvc.updateReviewTagGroup(id, value);
      Swal.fire({ icon: 'success', title: '更新成功', timer: 1500, showConfirmButton: false });
      loadReviewTagGroups();
    } catch (err) {
      Swal.fire({ icon: 'error', title: '更新失敗', text: err?.response?.data?.message || '請稍後再試' });
    }
  });
}
window.openEditTagGroupModal = openEditTagGroupModal;

window.deleteTagGroup = async function(id, name, tagCount) {
  if (tagCount > 0) {
    Swal.fire({ icon: 'warning', title: '無法刪除', text: `群組「${name}」還有 ${tagCount} 個標籤，請先移除所有標籤後再刪除。` });
    return;
  }
  const confirm = await Swal.fire({
    title: `確定刪除群組「${esc(name)}」？`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: '刪除',
    cancelButtonText: '取消',
    confirmButtonColor: '#c97f5a',
  });
  if (!confirm.isConfirmed) return;
  try {
    await backendSvc.deleteReviewTagGroup(id);
    Swal.fire({ icon: 'success', title: '刪除成功', timer: 1500, showConfirmButton: false });
    loadReviewTagGroups();
  } catch (err) {
    Swal.fire({ icon: 'error', title: '刪除失敗', text: err?.response?.data?.message || '請稍後再試' });
  }
};

// ════════════════════════════════════════════════════
//  評論標籤管理
// ════════════════════════════════════════════════════
async function loadReviewTags() {
  const list = document.getElementById('reviewTagsList');
  if (!list) return;
  list.innerHTML = '<div class="text-muted text-center py-3 small"><span class="spinner-border spinner-border-sm me-1"></span>載入中...</div>';
  try {
    const res = await backendSvc.getReviewTags();
    const groups = res?.data?.data?.groups ?? [];
    // Flatten all tags across groups for display
    const allTags = groups.flatMap(g => (g.tags ?? []).map(t => ({ ...t, groupName: g.name, groupId: g.id })));
    if (!allTags.length) {
      list.innerHTML = '<div class="text-muted text-center py-3">目前沒有標籤</div>';
      return;
    }
    list.innerHTML = `<table class="table table-sm align-middle">
      <thead><tr><th>標籤</th><th>說明</th><th>所屬群組</th><th>正面</th><th>操作</th></tr></thead>
      <tbody>
        ${allTags.map(t => `
          <tr>
            <td><code>${esc(t.tag)}</code></td>
            <td>${esc(t.meaning ?? '')}</td>
            <td><span class="badge bg-light text-dark border">${esc(t.groupName ?? '')}</span></td>
            <td>${t.positive ? '<span class="badge bg-success">是</span>' : '<span class="badge bg-secondary">否</span>'}</td>
            <td>
              <button class="btn btn-sm btn-outline-secondary" onclick="openEditTagModal('${esc(t.tag)}','${esc(t.meaning ?? '')}',${t.positive},'${esc(t.groupId ?? '')}')">
                <i class="fa fa-pencil"></i>
              </button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;
    // Populate group select in create form
    _populateTagGroupSelect(groups);
  } catch (e) {
    list.innerHTML = `<div class="text-muted text-center py-3">載入失敗：${esc(e?.message || '請稍後再試')}</div>`;
  }
}

function _populateTagGroupSelect(groups) {
  const sel = document.getElementById('newTagGroupId');
  if (!sel) return;
  sel.innerHTML = '<option value="">（不指定群組）</option>' +
    groups.map(g => `<option value="${esc(g.id)}">${esc(g.name)}</option>`).join('');
}

document.getElementById('refreshTagsBtn')?.addEventListener('click', loadReviewTags);

document.getElementById('createTagForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const tag      = document.getElementById('newTagName').value.trim();
  const meaning  = document.getElementById('newTagMeaning').value.trim();
  const delta    = parseInt(document.getElementById('newTagDelta').value, 10);
  const groupId  = document.getElementById('newTagGroupId').value || undefined;
  const resultBox = document.getElementById('createTagResult');
  if (!tag || !meaning || isNaN(delta)) return;
  try {
    await backendSvc.createReviewTag({ tag, description: meaning, delta, groupId });
    resultBox.className = 'result-box mt-3 success';
    resultBox.innerHTML = `<div class="fw-bold">✅ 標籤「${esc(tag.toUpperCase())}」建立成功</div>`;
    document.getElementById('newTagName').value = '';
    document.getElementById('newTagMeaning').value = '';
    document.getElementById('newTagDelta').value = '';
    document.getElementById('newTagGroupId').value = '';
    loadReviewTags();
  } catch (err) {
    const msg = err?.response?.data?.message || err?.message || '請稍後再試';
    resultBox.className = 'result-box mt-3 error';
    resultBox.innerHTML = `<div class="fw-bold mb-1">❌ 建立失敗</div><div>${esc(msg)}</div>`;
  } finally {
    resultBox.classList.remove('d-none');
  }
});

function openEditTagModal(tag, meaning, positive, groupId = '') {
  Swal.fire({
    title: `編輯標籤 ${tag}`,
    html: `
      <div class="text-start">
        <label class="form-label fw-bold">說明</label>
        <input id="editTagMeaning" class="form-control mb-3" value="${esc(meaning)}" maxlength="100">
        <label class="form-label fw-bold">分數增減 (delta)</label>
        <input type="number" id="editTagDelta" class="form-control mb-3" placeholder="例：1 或 -5" min="-100" max="100">
        <label class="form-label fw-bold">啟用狀態</label>
        <select id="editTagEnabled" class="form-select mb-3">
          <option value="true" ${positive ? 'selected' : ''}>啟用</option>
          <option value="false" ${!positive ? 'selected' : ''}>停用</option>
        </select>
        <label class="form-label fw-bold">所屬群組 ID <small class="text-muted fw-normal">（選填）</small></label>
        <input id="editTagGroupId" class="form-control" value="${esc(groupId)}" placeholder="group-1" maxlength="50">
      </div>`,
    showCancelButton: true,
    confirmButtonText: '儲存',
    cancelButtonText: '取消',
    focusConfirm: false,
    preConfirm: () => {
      const delta = parseInt(document.getElementById('editTagDelta').value, 10);
      if (isNaN(delta)) { Swal.showValidationMessage('請輸入分數增減'); return false; }
      const groupIdVal = document.getElementById('editTagGroupId').value.trim();
      return {
        description: document.getElementById('editTagMeaning').value.trim(),
        delta,
        enabled: document.getElementById('editTagEnabled').value === 'true',
        ...(groupIdVal ? { groupId: groupIdVal } : {}),
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

// ════════════════════════════════════════════════════
//  客服單管理
// ════════════════════════════════════════════════════
const TICKET_STATUS_LABEL = { UNRESOLVED: '等待認領', CLAIMED: '處理中', RESOLVED: '已解決' };
const TICKET_STATUS_COLOR = { UNRESOLVED: '#c97f5a', CLAIMED: '#004b97', RESOLVED: 'rgb(36, 182, 133)' };

let _ticketCurrentPage = 1;
let _ticketHistoryModal = null;

async function loadAdminTickets(page = 1) {
  _ticketCurrentPage = page;
  const status = document.getElementById('ticketsStatusFilter')?.value ?? '';
  const listEl = document.getElementById('ticketsAdminList');
  const pagerEl = document.getElementById('ticketsAdminPager');
  if (!listEl) return;
  listEl.innerHTML = `<div class="text-muted text-center py-3 small"><span class="spinner-border spinner-border-sm me-1"></span>載入中...</div>`;
  if (pagerEl) pagerEl.innerHTML = '';
  try {
    const res = await chatSvc.listAdminTickets(status || undefined, page, 20);
    const items = Array.isArray(res?.data?.items) ? res.data.items
      : Array.isArray(res?.data) ? res.data
      : Array.isArray(res) ? res : [];
    const total = res?.data?.total ?? items.length;
    const totalPages = Math.max(1, Math.ceil(total / 20));

    if (!items.length) {
      listEl.innerHTML = `<div class="text-muted text-center py-4">目前沒有客服單</div>`;
      return;
    }

    listEl.innerHTML = items.map(t => {
      const color = TICKET_STATUS_COLOR[t.status] ?? '#888';
      const label = TICKET_STATUS_LABEL[t.status] ?? t.status;
      const createdTime = t.createdAt
        ? new Date(t.createdAt).toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
        : '—';
      const userName = t.user?.name ?? t.user?.username ?? '用戶';
      const agentName = t.claimedBy ? (t.agent?.name ?? t.agent?.username ?? '客服') : '未認領';
      const roomId = t.roomId ?? t.room?.id ?? '';
      const canClaim = t.status === 'UNRESOLVED';
      const isClaimed = t.status === 'CLAIMED';
      const isClosed = t.status === 'RESOLVED';
      const hasOrder = !!t.orderId;
      return `<div class="analytics-block mb-2" style="padding:12px 16px;display:flex;align-items:center;gap:12px;">
        <div style="flex:1;min-width:0;">
          <div style="font-size:0.88rem;font-weight:600;color:#333;margin-bottom:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(t.reason ?? '找客服問問題')}</div>
          <div style="font-size:0.75rem;color:#888;">提單用戶：${esc(userName)} · ${createdTime}</div>
          <div style="font-size:0.75rem;color:#888;">負責客服：${esc(agentName)}${t.orderId ? ` · 訂單 ${esc(t.orderId)}` : ''}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0;">
          <span style="font-size:0.68rem;font-weight:700;border-radius:20px;padding:2px 10px;background:${color}15;color:${color};border:1px solid ${color}40;white-space:nowrap;">${label}</span>
          ${canClaim
            ? `<button class="btn-claim-ticket btn btn-sm btn-warning" data-ticket-id="${esc(t.id)}" data-room-id="${esc(roomId)}" data-has-order="${hasOrder}" style="font-size:0.72rem;padding:2px 10px;">認領</button>`
            : isClaimed && hasOrder
              ? `<button class="btn-adjudicate-ticket btn btn-sm btn-outline-primary" data-ticket-id="${esc(t.id)}" data-order-id="${esc(t.orderId)}" data-user-id="${esc(t.userId ?? t.user?.id ?? '')}" data-claimed-by="${esc(t.claimedBy ?? '')}" style="font-size:0.72rem;padding:2px 10px;"><i class="bi bi-scale me-1"></i>查看記錄 & 仲裁</button>`
              : isClaimed && roomId
                ? `<a href="../chatroom/chatroom.html?roomId=${encodeURIComponent(roomId)}" target="_blank" style="font-size:0.72rem;color:#004b97;text-decoration:none;">前往聊天室 →</a>`
                : ''
          }
          ${isClosed ? `<button class="btn-view-history btn btn-sm btn-outline-secondary" data-ticket-id="${esc(t.id)}" data-order-id="${esc(t.orderId ?? '')}" data-user-id="${esc(t.userId ?? t.user?.id ?? '')}" data-claimed-by="${esc(t.claimedBy ?? '')}" style="font-size:0.72rem;padding:2px 10px;">查看記錄</button>` : ''}
        </div>
      </div>`;
    }).join('');

    // 認領按鈕
    listEl.querySelectorAll('.btn-claim-ticket').forEach(btn => {
      btn.addEventListener('click', async () => {
        const ticketId = btn.dataset.ticketId;
        const roomId = btn.dataset.roomId;
        const { isConfirmed } = await Swal.fire({
          title: '確定認領此客服單？',
          text: '認領後您將成為負責客服人員並加入聊天室。',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: '認領',
          cancelButtonText: '取消'
        });
        if (!isConfirmed) return;
        try {
          btn.disabled = true;
          btn.textContent = '認領中...';
          await chatSvc.claimTicket(ticketId);
          const hasOrder = btn.dataset.hasOrder === 'true';
          if (hasOrder) {
            await Swal.fire({ icon: 'success', title: '認領成功', text: '請透過「查看記錄 & 仲裁」處理此訂單客服單。', timer: 2000, showConfirmButton: false });
            loadAdminTickets(_ticketCurrentPage);
          } else {
            await Swal.fire({ icon: 'success', title: '認領成功', text: '即將跳轉至聊天室。', timer: 1500, showConfirmButton: false });
            if (roomId) window.location.href = `../chatroom/chatroom.html?roomId=${encodeURIComponent(roomId)}`;
          }
        } catch (err) {
          btn.disabled = false;
          btn.textContent = '認領';
          Swal.fire({ icon: 'error', title: '認領失敗', text: err?.response?.data?.message ?? '請稍後再試' });
        }
      });
    });

    // 查看記錄按鈕（modal 只初始化一次）
    if (!_ticketHistoryModal) {
      _ticketHistoryModal = new bootstrap.Modal(document.getElementById('ticketHistoryModal'));
    }
    const historyModal = _ticketHistoryModal;
    listEl.querySelectorAll('.btn-view-history').forEach(btn => {
      btn.addEventListener('click', async () => {
        const ticketId = btn.dataset.ticketId;
        const orderId = btn.dataset.orderId;
        const complainantId = btn.dataset.userId;
        const claimedById = btn.dataset.claimedBy;
        const bodyEl = document.getElementById('ticketHistoryModalBody');
        bodyEl.innerHTML = `<div class="text-center py-4"><span class="spinner-border spinner-border-sm me-1"></span>載入中...</div>`;
        document.getElementById('ticketAdjudicateFooter').style.display = 'none';
        historyModal.show();
        try {
          const promises = [chatSvc.getTicketHistory(ticketId)];
          if (orderId) promises.push(chatSvc.getTicketOrder(ticketId));
          const [histRes, orderRes] = await Promise.allSettled(promises);

          let html = '';

          // 關聯訂單
          if (orderId && orderRes && orderRes.status === 'fulfilled') {
            const o = orderRes.value?.data ?? orderRes.value;
            if (o) {
              const orderItems = o.orderItems ?? [];
              const first = orderItems[0];
              const productName = first?.item?.name ?? first?.name ?? '商品';
              const price = o.totalAmount != null ? `NT$ ${Number(o.totalAmount).toLocaleString('zh-TW')}` : '—';
              const buyerName = o.buyerUser?.name ?? o.buyerUser?.username ?? '—';
              const sellerName = o.sellerUser?.name ?? o.sellerUser?.username ?? '—';
              html += `
                <div class="fw-bold mb-2" style="font-size:0.85rem;color:#6f87a0;"><i class="fa fa-shopping-bag me-1"></i>關聯訂單</div>
                <div style="background:#e8f0fe;border:1px solid rgba(0,75,151,0.25);border-radius:8px;padding:10px 14px;font-size:0.82rem;margin-bottom:20px;">
                  <div style="font-weight:600;color:#1a2840;margin-bottom:6px;">${esc(productName)}${orderItems.length > 1 ? ` …等${orderItems.length}件` : ''}</div>
                  <div style="display:flex;justify-content:space-between;color:#6f87a0;margin-bottom:3px;"><span>買家</span><span style="color:#004b97;font-weight:600;">${esc(buyerName)}</span></div>
                  <div style="display:flex;justify-content:space-between;color:#6f87a0;margin-bottom:3px;"><span>賣家</span><span style="color:#004b97;font-weight:600;">${esc(sellerName)}</span></div>
                  <div style="display:flex;justify-content:space-between;color:#6f87a0;"><span>金額</span><span style="color:#004b97;font-weight:600;">${price}</span></div>
                </div>`;
            }
          }

          // 聊天記錄
          const histData = histRes.status === 'fulfilled' ? histRes.value?.data : null;
          const msgs = Array.isArray(histData?.history) ? [...histData.history].reverse() : [];
          html += `<div class="fw-bold mb-2" style="font-size:0.85rem;color:#6f87a0;"><i class="fa fa-comments me-1"></i>聊天記錄</div>`;
          if (!msgs.length) {
            html += `<div class="text-muted text-center py-3 small">無聊天記錄</div>`;
          } else {
            html += `<div style="display:flex;flex-direction:column;gap:6px;">` +
              msgs.map(m => {
                const isComplainant = String(m.userId) === String(complainantId);
                const isSupport = claimedById && String(m.userId) === String(claimedById);
                const time = m.createdAt ? new Date(m.createdAt).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) : '';
                const senderName = m.senderName ?? m.username ?? (isComplainant ? '投訴者' : isSupport ? '客服人員' : '對方');
                const align = isComplainant ? 'flex-end' : 'flex-start';
                const bg = isComplainant ? '#e8f0fe' : '#f8f9fa';
                const nameColor = isComplainant ? '#004b97' : '#6f87a0';
                const nameAlign = isComplainant ? 'right' : 'left';
                return `<div style="display:flex;flex-direction:column;align-items:${align};gap:2px;">
                  <span style="font-size:0.68rem;color:${nameColor};font-weight:600;padding:0 4px;text-align:${nameAlign};">${esc(senderName)}</span>
                  <div style="max-width:80%;padding:7px 11px;background:${bg};border-radius:10px;font-size:0.82rem;color:#1a2840;border:1px solid ${isComplainant ? 'rgba(0,75,151,0.25)' : '#e0e6ef'};">
                    ${esc(m.content ?? m.message ?? '')}
                    <div style="font-size:0.65rem;color:#6f87a0;margin-top:3px;text-align:right;">${time}</div>
                  </div>
                </div>`;
              }).join('') + `</div>`;
          }

          bodyEl.innerHTML = html;
          document.getElementById('ticketAdjudicateFooter').style.display = 'none';
        } catch {
          bodyEl.innerHTML = `<div class="text-danger text-center py-3">載入失敗，請稍後再試</div>`;
        }
      });
    });

    // 查看記錄 & 仲裁（CLAIMED + 有 orderId）
    if (!_ticketHistoryModal) {
      _ticketHistoryModal = new bootstrap.Modal(document.getElementById('ticketHistoryModal'));
    }
    listEl.querySelectorAll('.btn-adjudicate-ticket').forEach(btn => {
      btn.addEventListener('click', async () => {
        const ticketId = btn.dataset.ticketId;
        const orderId = btn.dataset.orderId;
        const complainantId2 = btn.dataset.userId;
        const claimedById2 = btn.dataset.claimedBy;
        const bodyEl = document.getElementById('ticketHistoryModalBody');
        const footerEl = document.getElementById('ticketAdjudicateFooter');
        bodyEl.innerHTML = `<div class="text-center py-4"><span class="spinner-border spinner-border-sm me-1"></span>載入中...</div>`;
        footerEl.style.removeProperty('display');
        document.getElementById('adjudicationText').value = '';
        document.getElementById('adjudicationReply').value = '';
        _ticketHistoryModal.show();

        // 載入訂單 & 聊天記錄
        try {
          const [histRes, orderRes] = await Promise.allSettled([
            chatSvc.getTicketHistory(ticketId),
            chatSvc.getTicketOrder(ticketId),
          ]);
          let html = '';
          if (orderRes.status === 'fulfilled') {
            const o = orderRes.value?.data ?? orderRes.value;
            if (o) {
              const orderItems = o.orderItems ?? [];
              const first = orderItems[0];
              const productName = first?.item?.name ?? first?.name ?? '商品';
              const price = o.totalAmount != null ? `NT$ ${Number(o.totalAmount).toLocaleString('zh-TW')}` : '—';
              const buyerName = o.buyerUser?.name ?? o.buyerUser?.username ?? '—';
              const sellerName = o.sellerUser?.name ?? o.sellerUser?.username ?? '—';
              html += `
                <div class="fw-bold mb-2" style="font-size:0.85rem;color:#6f87a0;"><i class="fa fa-shopping-bag me-1"></i>關聯訂單</div>
                <div style="background:#e8f0fe;border:1px solid rgba(0,75,151,0.25);border-radius:8px;padding:10px 14px;font-size:0.82rem;margin-bottom:20px;">
                  <div style="font-weight:600;color:#1a2840;margin-bottom:6px;">${esc(productName)}${orderItems.length > 1 ? ` …等${orderItems.length}件` : ''}</div>
                  <div style="display:flex;justify-content:space-between;color:#6f87a0;margin-bottom:3px;"><span>買家</span><span style="color:#004b97;font-weight:600;">${esc(buyerName)}</span></div>
                  <div style="display:flex;justify-content:space-between;color:#6f87a0;margin-bottom:3px;"><span>賣家</span><span style="color:#004b97;font-weight:600;">${esc(sellerName)}</span></div>
                  <div style="display:flex;justify-content:space-between;color:#6f87a0;"><span>金額</span><span style="color:#004b97;font-weight:600;">${price}</span></div>
                </div>`;
            }
          }
          const histData2 = histRes.status === 'fulfilled' ? histRes.value?.data : null;
          const msgs2 = Array.isArray(histData2?.history) ? [...histData2.history].reverse() : [];
          html += `<div class="fw-bold mb-2" style="font-size:0.85rem;color:#6f87a0;"><i class="fa fa-comments me-1"></i>聊天記錄</div>`;
          if (!msgs2.length) {
            html += `<div class="text-muted text-center py-3 small">無聊天記錄</div>`;
          } else {
            html += `<div style="display:flex;flex-direction:column;gap:6px;">` +
              msgs2.map(m => {
                const isComplainant = String(m.userId) === String(complainantId2);
                const isSupport2 = claimedById2 && String(m.userId) === String(claimedById2);
                const time = m.createdAt ? new Date(m.createdAt).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) : '';
                const senderName = m.senderName ?? m.username ?? (isComplainant ? '投訴者' : isSupport2 ? '客服人員' : '對方');
                const align = isComplainant ? 'flex-end' : 'flex-start';
                const bg = isComplainant ? '#e8f0fe' : '#f8f9fa';
                const nameColor = isComplainant ? '#004b97' : '#6f87a0';
                const nameAlign = isComplainant ? 'right' : 'left';
                return `<div style="display:flex;flex-direction:column;align-items:${align};gap:2px;">
                  <span style="font-size:0.68rem;color:${nameColor};font-weight:600;padding:0 4px;text-align:${nameAlign};">${esc(senderName)}</span>
                  <div style="max-width:80%;padding:7px 11px;background:${bg};border-radius:10px;font-size:0.82rem;color:#1a2840;border:1px solid ${isComplainant ? 'rgba(0,75,151,0.25)' : '#e0e6ef'};">
                    ${esc(m.content ?? m.message ?? '')}
                    <div style="font-size:0.65rem;color:#6f87a0;margin-top:3px;text-align:right;">${time}</div>
                  </div>
                </div>`;
              }).join('') + `</div>`;
          }
          bodyEl.innerHTML = html;
        } catch {
          bodyEl.innerHTML = `<div class="text-danger text-center py-3">載入失敗，請稍後再試</div>`;
        }

        // 仲裁送出
        const submitBtn = document.getElementById('adjudicateSubmitBtn');
        const newSubmitBtn = submitBtn.cloneNode(true);
        submitBtn.replaceWith(newSubmitBtn);
        newSubmitBtn.addEventListener('click', async () => {
          const adjudication = document.getElementById('adjudicationText').value.trim();
          const replyMessage = document.getElementById('adjudicationReply').value.trim();
          if (!adjudication) { Swal.fire({ icon: 'warning', title: '請填寫裁定結論' }); return; }
          if (!replyMessage) { Swal.fire({ icon: 'warning', title: '請填寫回覆訊息' }); return; }
          try {
            newSubmitBtn.disabled = true;
            newSubmitBtn.textContent = '送出中...';
            await chatSvc.adjudicateTicket(ticketId, { adjudication, replyMessage });
            await chatSvc.resolveTicket(ticketId);
            _ticketHistoryModal.hide();
            await Swal.fire({ icon: 'success', title: '仲裁完成', text: '客服單已標記為已解決。', timer: 1800, showConfirmButton: false });
            loadAdminTickets(_ticketCurrentPage);
          } catch {
            newSubmitBtn.disabled = false;
            newSubmitBtn.textContent = '送出仲裁並解決';
            Swal.fire({ icon: 'error', title: '送出失敗', text: '請稍後再試' });
          }
        });
      });
    });

    if (pagerEl && totalPages > 1) {
      pagerEl.innerHTML = Array.from({ length: totalPages }, (_, i) => i + 1).map(p =>
        `<button class="btn btn-sm ${p === page ? 'btn-primary' : 'btn-outline-secondary'}" data-page="${p}">${p}</button>`
      ).join('');
      pagerEl.querySelectorAll('[data-page]').forEach(btn => {
        btn.addEventListener('click', () => loadAdminTickets(Number(btn.dataset.page)));
      });
    }
  } catch (err) {
    listEl.innerHTML = `<div class="text-danger text-center py-3 small">載入失敗：${esc(err?.response?.data?.message ?? err?.message ?? '請稍後再試')}</div>`;
  }
}

document.getElementById('ticketsStatusFilter')?.addEventListener('change', () => loadAdminTickets(1));
document.getElementById('refreshTicketsBtn')?.addEventListener('click', () => loadAdminTickets(1));

// ════════════════════════════════════════════════════
//  用戶管理
// ════════════════════════════════════════════════════
let _userCurrentPage = 1;
let _userDetailModal = null;

async function loadAdminUsers(page = 1) {
  _userCurrentPage = page;
  const searchId = document.getElementById('userSearchInput')?.value?.trim() ?? '';
  const sortBy = document.getElementById('userSortBy')?.value ?? 'createdAt';
  const sortOrder = document.getElementById('userSortOrder')?.value ?? 'desc';

  const listEl = document.getElementById('usersAdminList');
  const pagerEl = document.getElementById('usersAdminPager');
  if (!listEl) return;

  listEl.innerHTML = `<div class="text-muted text-center py-3 small"><span class="spinner-border spinner-border-sm me-1"></span>載入中...</div>`;
  if (pagerEl) pagerEl.innerHTML = '';

  try {
    const params = {
      page,
      limit: 20,
      sortBy,
      sortOrder
    };
    if (searchId) params.id = searchId;

    const res = await backendSvc.http.get('/api/admin/users', { params });
    const resData = res?.data?.data || {};
    const users = resData.items || [];
    const total = resData.total || 0;
    const totalPages = resData.totalPages || Math.ceil(total / 20);

    if (!users || users.length === 0) {
      listEl.innerHTML = `<div class="text-muted text-center py-4 small">無用戶記錄</div>`;
      return;
    }

    listEl.innerHTML = users.map(user => `
      <div class="user-admin-item" style="border:1px solid #e0e0e0;border-radius:8px;padding:12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;gap:10px;">
        <div style="flex:1;">
          <div style="font-weight:600;color:#333;margin-bottom:4px;">
            ${esc(user.name || '未設定名稱')}
            ${user.emailVerify ? '<span style="color:rgb(36,182,133);font-size:0.85rem;margin-left:6px;"><i class="fa fa-check-circle"></i> 已驗證</span>' : '<span style="color:#c97f5a;font-size:0.85rem;margin-left:6px;"><i class="fa fa-times-circle"></i> 未驗證</span>'}
          </div>
          <div style="color:#666;font-size:0.9rem;margin-bottom:2px;">ID: ${esc(user.id)}</div>
          <div style="color:#999;font-size:0.85rem;margin-bottom:2px;">信箱: ${esc(user.email || 'N/A')}</div>
          <div style="color:#999;font-size:0.85rem;">評分: ★ ${(user.rate ?? 0).toFixed(2)}</div>
        </div>
        <button type="button" class="btn btn-sm btn-primary view-user-btn" data-user-id="${esc(user.id)}">
          <i class="fa fa-eye me-1"></i>查看詳情
        </button>
      </div>
    `).join('');

    document.querySelectorAll('.view-user-btn').forEach(btn => {
      btn.addEventListener('click', () => loadUserDetail(btn.dataset.userId));
    });

    if (pagerEl && totalPages > 1) {
      pagerEl.innerHTML = Array.from({ length: totalPages }, (_, i) => i + 1).map(p =>
        `<button class="btn btn-sm ${p === page ? 'btn-primary' : 'btn-outline-secondary'}" data-page="${p}">${p}</button>`
      ).join('');
      pagerEl.querySelectorAll('[data-page]').forEach(btn => {
        btn.addEventListener('click', () => loadAdminUsers(Number(btn.dataset.page)));
      });
    }
  } catch (err) {
    listEl.innerHTML = `<div class="text-danger text-center py-3 small">載入失敗：${esc(err?.response?.data?.message ?? err?.message ?? '請稍後再試')}</div>`;
  }
}

async function loadUserDetail(userId) {
  const modalEl = document.getElementById('userDetailModal');
  const bodyEl = document.getElementById('userDetailBody');
  if (!modalEl || !bodyEl) return;

  bodyEl.innerHTML = `<div class="text-center py-4"><span class="spinner-border spinner-border-sm me-1"></span>載入中...</div>`;

  if (!_userDetailModal) {
    _userDetailModal = new bootstrap.Modal(modalEl);
  }
  _userDetailModal.show();

  try {
    const res = await backendSvc.http.get(`/api/admin/users/${encodeURIComponent(userId)}`);
    const user = res?.data?.data || res?.data || {};
    const profile = user.profile || {};
    const stats = user.stats || {};

    const formatDate = (date) => {
      if (!date) return 'N/A';
      const d = new Date(date);
      return d.toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    bodyEl.innerHTML = `
      <div style="margin-bottom:20px;">
        <div class="d-flex align-items-center gap-2 mb-3">
          <i class="fa fa-user" style="font-size:2rem;color:#004b97;"></i>
          <div>
            <div style="font-weight:600;font-size:1.1rem;color:#333;">${esc(profile.name || '未設定名稱')}</div>
            <div style="color:#999;font-size:0.9rem;">ID: ${esc(user.id)}</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
          <div style="padding:12px;background:#f5f5f5;border-radius:6px;">
            <div style="color:#666;font-size:0.85rem;margin-bottom:4px;">評分</div>
            <div style="font-weight:600;font-size:1.2rem;color:#004b97;">★ ${(profile.rate ?? 0).toFixed(2)}</div>
          </div>
          <div style="padding:12px;background:#f5f5f5;border-radius:6px;">
            <div style="color:#666;font-size:0.85rem;margin-bottom:4px;">驗證狀態</div>
            <div style="font-weight:600;color:${user.emailVerify ? 'rgb(36,182,133)' : '#c97f5a'};">
              ${user.emailVerify ? '<i class="fa fa-check-circle me-1"></i>已驗證' : '<i class="fa fa-times-circle me-1"></i>未驗證'}
            </div>
          </div>
        </div>

        <hr style="margin:12px 0;border:none;border-top:1px solid #e0e0e0;">

        <div style="margin-bottom:12px;">
          <div style="color:#666;font-size:0.85rem;margin-bottom:4px;">信箱</div>
          <div style="color:#333;word-break:break-all;">${esc(user.email || 'N/A')}</div>
        </div>

        <div style="margin-bottom:12px;">
          <div style="color:#666;font-size:0.85rem;margin-bottom:4px;">聯繫信箱</div>
          <div style="color:#333;word-break:break-all;">${esc(profile.contactEmail || 'N/A')}</div>
        </div>

        <div style="margin-bottom:12px;">
          <div style="color:#666;font-size:0.85rem;margin-bottom:4px;">自我介紹</div>
          <div style="color:#333;">${esc(profile.introduction || 'N/A')}</div>
        </div>

        <div style="margin-bottom:12px;">
          <div style="color:#666;font-size:0.85rem;margin-bottom:4px;">註冊時間</div>
          <div style="color:#333;">${formatDate(user.createdAt)}</div>
        </div>

        <div style="margin-bottom:12px;">
          <div style="color:#666;font-size:0.85rem;margin-bottom:4px;">最後登入時間</div>
          <div style="color:#333;">${formatDate(user.lastLogin)}</div>
        </div>

        <hr style="margin:12px 0;border:none;border-top:1px solid #e0e0e0;">

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div style="padding:12px;background:#f5f5f5;border-radius:6px;">
            <div style="color:#666;font-size:0.85rem;margin-bottom:4px;">商品數</div>
            <div style="font-weight:600;font-size:1.2rem;color:#004b97;">${stats.itemsCount ?? 0}</div>
          </div>
          <div style="padding:12px;background:#f5f5f5;border-radius:6px;">
            <div style="color:#666;font-size:0.85rem;margin-bottom:4px;">訂單數</div>
            <div style="font-weight:600;font-size:1.2rem;color:#004b97;">${(stats.buyerOrdersCount ?? 0) + (stats.sellerOrdersCount ?? 0)}</div>
          </div>
          <div style="padding:12px;background:#f5f5f5;border-radius:6px;">
            <div style="color:#666;font-size:0.85rem;margin-bottom:4px;">評價數</div>
            <div style="font-weight:600;font-size:1.2rem;color:#004b97;">${stats.reviewsReceivedCount ?? 0}</div>
          </div>
          <div style="padding:12px;background:#f5f5f5;border-radius:6px;">
            <div style="color:#666;font-size:0.85rem;margin-bottom:4px;">被檢舉數</div>
            <div style="font-weight:600;font-size:1.2rem;color:#c97f5a;">${stats.reportsReceivedCount ?? 0}</div>
          </div>
          <div style="padding:12px;background:#f5f5f5;border-radius:6px;">
            <div style="color:#666;font-size:0.85rem;margin-bottom:4px;">邀請人數</div>
            <div style="font-weight:600;font-size:1.2rem;color:#004b97;">${stats.inviteesCount ?? 0}</div>
          </div>
          <div style="padding:12px;background:#f5f5f5;border-radius:6px;">
            <div style="color:#666;font-size:0.85rem;margin-bottom:4px;">帳停等級</div>
            <div style="font-weight:600;font-size:0.95rem;color:${profile.suspensionLevel === 'NONE' ? '#004b97' : '#c97f5a'};">${esc(profile.suspensionLevel || 'N/A')}</div>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    bodyEl.innerHTML = `<div class="text-danger text-center py-3 small">載入失敗：${esc(err?.response?.data?.message ?? err?.message ?? '請稍後再試')}</div>`;
  }
}

document.getElementById('userSearchBtn')?.addEventListener('click', () => loadAdminUsers(1));
document.getElementById('userRefreshBtn')?.addEventListener('click', () => loadAdminUsers(1));
document.getElementById('userSortBy')?.addEventListener('change', () => loadAdminUsers(1));
document.getElementById('userSortOrder')?.addEventListener('change', () => loadAdminUsers(1));
document.getElementById('userSearchInput')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') loadAdminUsers(1);
});
