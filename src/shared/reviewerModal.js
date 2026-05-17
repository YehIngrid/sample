import BackendService from '../BackendService.js';

const _svc = new BackendService();
const _tagMeaningCache = {};
const _tagPositiveCache = {};
const DEFAULT_AVATAR = '../webP/default-avatar.webp';

function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function getTagLabel(tag) { return _tagMeaningCache[tag] ?? tag; }
function isTagPositive(tag) {
  if (!tag) return true;
  const v = _tagPositiveCache[tag] ?? _tagPositiveCache[tag.toLowerCase()];
  return v !== undefined ? v : true;
}
async function _loadTags() {
  if (Object.keys(_tagMeaningCache).length > 0) return;
  try {
    const res = await _svc.getReviewTags();
    (res?.data?.data?.tags ?? []).forEach(t => {
      _tagMeaningCache[t.tag] = t.description ?? t.meaning;
      _tagPositiveCache[t.tag] = t.positive;
    });
  } catch (_) {}
}

export function renderReviewCard(review, role) {
  const name     = review?.reviewer?.name ?? review?.reviewerName ?? '評價者';
  const photo    = review?.reviewer?.photoURL ?? review?.reviewerUser?.photoURL ?? DEFAULT_AVATAR;
  const rid      = review?.reviewer?.accountId ?? '';
  const reviewId = review?.id ?? '';
  const time     = review?.createdAt ? new Date(review.createdAt).toLocaleDateString('zh-TW') : '';
  const comment  = review?.comment ?? '';
  const commodity = review?.commodityName ?? '';
  const tags     = Array.isArray(review?.tags) ? review.tags : [];
  const roleBadge = role === 'seller' ? '賣' : role === 'buyer' ? '買' : '';
  const roleClass = role === 'seller' ? 'reviewer-role-badge--seller' : 'reviewer-role-badge--buyer';
  const tagChips = tags
    .map(t => `<span class="review-display-chip ${isTagPositive(t) ? 'positive' : 'negative'}">${esc(getTagLabel(t))}</span>`)
    .join('');
  return `
    <div class="review-card">
      <div class="review-card__header">
        <div class="reviewer-avatar-wrap">
          <img src="${esc(photo)}" alt="${esc(name)}" class="reviewer-avatar reviewer-avatar--clickable"
            data-reviewer-id="${rid}" data-reviewer-name="${esc(name)}" data-reviewer-photo="${esc(photo)}"
            title="查看 ${esc(name)} 的評價">
          ${roleBadge ? `<span class="reviewer-role-badge ${roleClass}">${roleBadge}</span>` : ''}
        </div>
        <div class="review-card__meta">
          <span class="reviewerName reviewer-avatar--clickable"
            data-reviewer-id="${rid}" data-reviewer-name="${esc(name)}" data-reviewer-photo="${esc(photo)}">${esc(name)}</span>
          ${commodity ? `<span class="review-commodity-name">· ${esc(commodity)}</span>` : ''}
        </div>
        <div class="review-card__actions">
          ${time ? `<span class="reviewTime">${time}</span>` : ''}
          ${reviewId ? `<button class="review-report-btn" data-report-review-id="${reviewId}"
            data-report-reviewer-id="${rid}" data-report-reviewer-name="${esc(name)}"
            title="檢舉此評價"><i class="ti ti-flag"></i></button>` : ''}
        </div>
      </div>
      ${tagChips ? `<div class="review-card__chips">${tagChips}</div>` : ''}
      ${comment ? `<div class="reviewText">${esc(comment)}</div>` : ''}
    </div>`;
}

async function _openReportSwal({ title, targetLabel, userId, reviewId }) {
  let categories = [];
  try {
    const res = await _svc.getReportCategories();
    categories = res?.data?.categories ?? [];
  } catch (_) {}
  const catOptions = categories.map(c => `<option value="${esc(c.category)}">${esc(c.meaning)}</option>`).join('');

  const { isConfirmed, value } = await Swal.fire({
    title,
    customClass: { popup: 'report-form-popup' },
    html: `
      ${targetLabel ? `<p class="report-form-target">檢舉對象：<strong>${esc(targetLabel)}</strong></p>` : ''}
      <label class="report-form-label" for="report-category">檢舉類型 <span style="color:red">*</span></label>
      <select id="report-category" class="report-form-select">
        <option value="" disabled selected>請選擇檢舉類型</option>
        ${catOptions}
      </select>
      <label class="report-form-label" for="report-subject">主旨 <span style="color:red">*</span></label>
      <input id="report-subject" class="report-form-input" placeholder="請輸入主旨（最多 120 字）" maxlength="120">
      <label class="report-form-label" for="report-detail">補充說明 <span class="report-form-optional">（選填，最多 1000 字）</span></label>
      <textarea id="report-detail" class="report-form-textarea" placeholder="請描述詳細情況" maxlength="1000"></textarea>
    `,
    showCancelButton: true,
    confirmButtonText: '送出檢舉',
    cancelButtonText: '取消',
    focusConfirm: false,
    preConfirm: () => {
      const category = document.getElementById('report-category').value;
      const subject  = document.getElementById('report-subject').value.trim();
      const detail   = document.getElementById('report-detail').value.trim();
      if (!category) { Swal.showValidationMessage('請選擇檢舉類型'); return false; }
      if (!subject)  { Swal.showValidationMessage('請填寫主旨'); return false; }
      return { category, subject, detail };
    },
  });
  if (!isConfirmed || !value) return;

  try {
    if (userId) {
      const fd = new FormData();
      fd.append('reportedUserId', userId);
      fd.append('category', value.category);
      fd.append('subject', value.subject);
      if (value.detail) fd.append('detail', value.detail);
      await _svc.submitReport(fd);
    } else if (reviewId) {
      await _svc.reportReview(reviewId, { reason: value.category, subject: value.subject, detail: value.detail });
    }
    Swal.fire({ icon: 'success', title: '檢舉已送出', text: '我們會盡快處理，謝謝你的回報。', timer: 2000, showConfirmButton: false });
  } catch (_) {
    Swal.fire({ icon: 'error', title: '送出失敗', text: '請稍後再試' });
  }
}

export function bindReviewerClicks(container) {
  container.addEventListener('click', e => {
    // 檢舉評價
    const reportBtn = e.target.closest('[data-report-review-id]');
    if (reportBtn) {
      _openReportSwal({
        title: '檢舉評價',
        targetLabel: reportBtn.dataset.reportReviewerName,
        reviewId: reportBtn.dataset.reportReviewId,
        userId: null,
      });
      return;
    }
    // 檢舉用戶
    const reportUserBtn = e.target.closest('[data-report-user-id]');
    if (reportUserBtn) {
      _openReportSwal({
        title: '檢舉用戶',
        targetLabel: reportUserBtn.dataset.reportUserName,
        userId: reportUserBtn.dataset.reportUserId,
        reviewId: null,
      });
      return;
    }
    // 查看評論者資訊
    const el = e.target.closest('[data-reviewer-id]');
    if (!el) return;
    const rid    = el.dataset.reviewerId;
    const rname  = el.dataset.reviewerName;
    const rphoto = el.dataset.reviewerPhoto;
    if (rid) openReviewerProfileModal(rid, rname, rphoto);
  });
}

export async function openReviewerProfileModal(accountId, name, photo) {
  await _loadTags();

  let stats = null;
  let sellerReviews = [];
  let buyerReviews  = [];
  let intro = '';
  let suspensionLevel = 'NONE';
  let lowScoreStrikeCount = 0;

  try {
    const [reviewRes, profileRes] = await Promise.all([
      _svc.getUserReviews(accountId),
      _svc.getPublicUserProfile(accountId).catch(() => null),
    ]);
    const d  = reviewRes?.data?.data;
    const pd = profileRes?.data?.data;
    stats              = d?.stats ?? null;
    sellerReviews      = d?.sellerReviews ?? [];
    buyerReviews       = d?.buyerReviews  ?? [];
    intro              = pd?.introduction ?? '';
    suspensionLevel    = pd?.suspensionLevel    ?? 'NONE';
    lowScoreStrikeCount = pd?.lowScoreStrikeCount ?? 0;
    if (!photo && pd?.photoURL) photo = pd.photoURL;
  } catch (_) {}

  const reviewCount  = Number(stats?.reviewCount ?? 0);
  const accountScore = stats?.accountScore ?? '-';
  const statsLine = reviewCount > 0
    ? `${reviewCount} 則評價 · 信譽積分 ${accountScore}`
    : '尚無評價紀錄';

  const suspensionBadge = (suspensionLevel && suspensionLevel !== 'NONE')
    ? `<span class="rp-badge rp-badge--danger">可疑帳號</span>` : '';
  const lowScoreBadge = lowScoreStrikeCount
    ? `<span class="rp-badge rp-badge--warn">低分紀錄 ${lowScoreStrikeCount} 次</span>` : '';

  const allCards = [
    ...sellerReviews.map(r => renderReviewCard(r, 'seller')),
    ...buyerReviews.map(r => renderReviewCard(r, 'buyer')),
  ].join('');
  const reviewHtml = allCards
    ? `<div class="review-list">${allCards}</div>`
    : `<div class="review-empty rp-empty"><i class="ti ti-message-circle" style="font-size:1.8rem;display:block;margin-bottom:6px;opacity:0.4;"></i>目前尚無評價紀錄</div>`;

  const myUid = localStorage.getItem('uid');
  const reportBtn = (accountId && String(accountId) !== String(myUid))
    ? `<button class="rp-report-btn" data-report-user-id="${accountId}" data-report-user-name="${esc(name)}">
         <i class="ti ti-flag"></i>檢舉此用戶
       </button>`
    : '';

  Swal.fire({
    title: false,
    customClass: { htmlContainer: 'swal-left-body', popup: 'rp-modal-popup' },
    html: `
      <div class="rp-profile">
        <img src="${esc(photo || DEFAULT_AVATAR)}" class="rp-avatar" alt="${esc(name)}頭像"
          onerror="this.src='${DEFAULT_AVATAR}'">
        <div class="rp-info">
          <div class="rp-name">${esc(name)}${suspensionBadge}${lowScoreBadge}</div>
          <div class="rp-stats">${statsLine}</div>
          ${intro ? `<div class="rp-intro">${esc(intro)}</div>` : ''}
        </div>
        ${reportBtn}
      </div>
      <div class="rp-divider"></div>
      <div class="rp-reviews">${reviewHtml}</div>
    `,
    confirmButtonText: '關閉',
    width: 520,
    didOpen: popup => bindReviewerClicks(popup),
  });
}
