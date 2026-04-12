// ── Quill init ──
const quill = new Quill('#quillEditor', {
  theme: 'snow',
  modules: {
    toolbar: '#quillToolbar',
  },
  placeholder: '在這裡開始寫你的攻略…\n\n分享你的親身經驗，讓更多同學少走彎路！',
});

// ── Tag system ──
const MAX_TAGS = 5;
let tags = [];

const tagInput     = document.getElementById('tagInput');
const tagsDisplay  = document.getElementById('tagsDisplay');
const tagInputWrap = document.getElementById('tagInputWrap');

function renderTagChips() {
  tagsDisplay.innerHTML = tags.map((t, i) => `
    <span class="se-tag-chip">
      #${t}
      <button class="se-tag-remove" data-i="${i}" aria-label="移除標籤">✕</button>
    </span>`).join('');
  tagsDisplay.querySelectorAll('.se-tag-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      tags.splice(Number(btn.dataset.i), 1);
      renderTagChips();
    });
  });
}

tagInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    const val = tagInput.value.trim().replace(/^#/, '');
    if (!val) return;
    if (tags.length >= MAX_TAGS) { showToast(`最多 ${MAX_TAGS} 個標籤`); return; }
    if (tags.includes(val)) { tagInput.value = ''; return; }
    tags.push(val);
    tagInput.value = '';
    renderTagChips();
  }
  if (e.key === 'Backspace' && tagInput.value === '' && tags.length > 0) {
    tags.pop();
    renderTagChips();
  }
});

tagInputWrap.addEventListener('click', () => tagInput.focus());

// ── Title counter ──
const titleInput = document.getElementById('articleTitle');
const titleLen   = document.getElementById('titleLen');
titleInput.addEventListener('input', () => {
  titleLen.textContent = titleInput.value.length;
});

// ── Word count & read time ──
const wordCountEl  = document.getElementById('wordCount');
const readTimeEl   = document.getElementById('readTimeEst');

quill.on('text-change', () => {
  const text = quill.getText().trim();
  const chars = text.length;
  wordCountEl.textContent = chars;
  readTimeEl.textContent = Math.max(1, Math.ceil(chars / 300));
});

// ── Toast helper ──
let toastTimer = null;
function showToast(msg) {
  let toast = document.querySelector('.se-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'se-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

// ── Save draft ──
document.getElementById('saveDraftBtn').addEventListener('click', () => {
  const draft = {
    title:   titleInput.value.trim(),
    cat:     document.getElementById('articleCat').value,
    tags,
    content: quill.root.innerHTML,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem('schoolDraft', JSON.stringify(draft));
  showToast('草稿已儲存 ✓');
});

// ── Restore draft ──
function restoreDraft() {
  const raw = localStorage.getItem('schoolDraft');
  if (!raw) return;
  try {
    const draft = JSON.parse(raw);
    if (draft.title) { titleInput.value = draft.title; titleLen.textContent = draft.title.length; }
    if (draft.cat)   document.getElementById('articleCat').value = draft.cat;
    if (draft.tags)  { tags = draft.tags; renderTagChips(); }
    if (draft.content) quill.root.innerHTML = draft.content;
  } catch (e) {}
}

// ── Publish flow ──
document.getElementById('publishBtn').addEventListener('click', () => {
  const title = titleInput.value.trim();
  const cat   = document.getElementById('articleCat').value;
  const text  = quill.getText().trim();

  if (!title)  { showToast('請輸入文章標題'); titleInput.focus(); return; }
  if (!cat)    { showToast('請選擇文章分類'); return; }
  if (text.length < 50) { showToast('內容太短，請至少寫 50 字'); return; }

  const BADGE_LABEL = { study: '學習攻略', life: '生活指南', career: '實習求職', trade: '二手交易', newbie: '新生必看' };
  document.getElementById('publishPreview').innerHTML = `
    <div class="se-publish-preview-title">${title}</div>
    <div class="se-publish-preview-meta">
      ${BADGE_LABEL[cat] || cat} ·
      ${tags.length > 0 ? tags.map(t => `#${t}`).join(' ') + ' · ' : ''}
      約 ${text.length} 字
    </div>`;

  new bootstrap.Modal(document.getElementById('publishModal')).show();
});

document.getElementById('confirmPublishBtn').addEventListener('click', () => {
  // TODO: submit to backend API
  bootstrap.Modal.getInstance(document.getElementById('publishModal')).hide();
  localStorage.removeItem('schoolDraft');
  showToast('攻略發布成功！正在返回…');
  setTimeout(() => { window.location.href = 'school.html'; }, 1800);
});

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  restoreDraft();
});
