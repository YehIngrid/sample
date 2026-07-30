/**
 * AppModal — 站內自製彈窗元件，取代 SweetAlert2。
 * 樣式跟就學證明認證那組 modal 一致（圓角卡片、打勾動畫、藥丸按鈕），
 * 顏色吃 tokens.css 的站內色票，不用另外載入 SweetAlert2 CDN。
 *
 * 用法（呼叫方式盡量比照 Swal.fire，方便替換舊的呼叫）：
 *
 *   import { AppModal } from '../default/app-modal.js';
 *
 *   // 純提示
 *   AppModal.fire({ icon: 'success', title: '已送出', text: '審核通常 1–3 個工作天完成' });
 *
 *   // 確認／取消
 *   AppModal.fire({
 *     icon: 'warning',
 *     title: '確定要登出？',
 *     showCancelButton: true,
 *     confirmButtonText: '登出',
 *     cancelButtonText: '取消'
 *   }).then(res => { if (res.isConfirmed) doLogout(); });
 *
 *   // 右上角 toast，自動消失
 *   AppModal.fire({ toast: true, icon: 'success', title: '已複製邀請碼', timer: 1500, showConfirmButton: false });
 *
 *   // 文字輸入
 *   AppModal.fire({ icon: 'question', title: '請輸入暱稱', input: 'text', inputPlaceholder: '暱稱' })
 *     .then(res => { if (res.isConfirmed) console.log(res.value); });
 *
 *   // 單一核取方塊
 *   AppModal.fire({ title: '服務條款', input: 'checkbox', inputPlaceholder: '我同意服務條款' })
 *     .then(res => { if (res.isConfirmed) console.log(res.value); }); // value 為 true/false
 *
 *   // 圖片燈箱（放大檢視單張圖片，右上角關閉）
 *   AppModal.fire({ imageUrl: img.src, imageAlt: '商品照片' });
 *
 *   // 開啟後才需要綁定事件時
 *   AppModal.fire({ title: '...', html: '<button id="x">按我</button>', didOpen: (dialog) => {
 *     dialog.querySelector('#x').addEventListener('click', ...);
 *   }});
 *
 * 回傳值一律是 Promise<{ isConfirmed, isDismissed, value }>，跟 SweetAlert2 的結構對齊。
 * 不支援 preConfirm / inputValidator（需要攔截確認並顯示驗證錯誤的複雜表單，暫時仍用 SweetAlert2）。
 */

const ICON_COLOR = {
  success:  { ring: 'var(--color-soft)',    mark: 'var(--color-primary)' },
  error:    { ring: 'var(--color-error)',   mark: 'var(--color-error)' },
  warning:  { ring: 'var(--color-warning)', mark: 'var(--color-warning)' },
  info:     { ring: 'var(--color-primary)', mark: 'var(--color-primary)' },
  question: { ring: 'var(--color-primary)', mark: 'var(--color-primary)' }
};

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]));
}

function iconMarkup(icon) {
  const c = ICON_COLOR[icon];
  if (!c) return '';
  if (icon === 'success') {
    return `<svg class="am-icon-svg" viewBox="0 0 60 60" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <circle class="am-ring" cx="30" cy="30" r="26" stroke="${c.ring}" stroke-width="3"/>
      <path class="am-mark am-mark-pop" d="M19 31 l8 8 14-16" stroke="${c.mark}" stroke-width="4"/>
    </svg>`;
  }
  if (icon === 'error') {
    return `<svg class="am-icon-svg" viewBox="0 0 60 60" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <circle class="am-ring" cx="30" cy="30" r="26" stroke="${c.ring}" stroke-width="3"/>
      <path class="am-mark am-mark-pop" d="M21 21 39 39 M39 21 21 39" stroke="${c.mark}" stroke-width="4"/>
    </svg>`;
  }
  const symbol = icon === 'warning' ? '!' : icon === 'question' ? '?' : 'i';
  return `<svg class="am-icon-svg" viewBox="0 0 60 60" fill="none">
      <circle class="am-ring" cx="30" cy="30" r="26" stroke="${c.ring}" stroke-width="3"/>
      <text class="am-mark am-mark-pop" x="30" y="40" text-anchor="middle" font-size="26" font-weight="700" fill="${c.mark}">${symbol}</text>
    </svg>`;
}

function buildDialog(opts) {
  const backdrop = document.createElement('div');
  backdrop.className = 'am-backdrop' + (opts.toast ? ' am-toast-mode' : '');
  if (opts.customClass?.container) backdrop.classList.add(opts.customClass.container);

  const isLightbox = !!opts.imageUrl;
  const dialog = document.createElement('div');
  dialog.className = 'am-dialog' + (opts.toast ? ' am-toast' : '') + (isLightbox ? ' am-lightbox' : '');
  if (opts.customClass?.popup) dialog.classList.add(opts.customClass.popup);
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  if (opts.width && !isLightbox) {
    const w = typeof opts.width === 'number' ? opts.width + 'px' : opts.width;
    dialog.style.width = `min(${w}, 100%)`;
  }

  let html = '';

  if (isLightbox) {
    html += `<button type="button" class="am-lightbox-close" data-am-cancel aria-label="關閉">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
    </button>
    <img class="am-lightbox-img" src="${opts.imageUrl}" alt="${escapeHtml(opts.imageAlt || '')}">`;
    dialog.innerHTML = html;
    backdrop.appendChild(dialog);
    return { backdrop, dialog };
  }

  if (opts.icon && ICON_COLOR[opts.icon]) {
    html += `<div class="am-icon">${iconMarkup(opts.icon)}</div>`;
  }
  if (opts.title) html += `<div class="am-title${opts.customClass?.title ? ' ' + opts.customClass.title : ''}">${escapeHtml(opts.title)}</div>`;
  if (opts.html) html += `<div class="am-text${opts.customClass?.htmlContainer ? ' ' + opts.customClass.htmlContainer : ''}">${opts.html}</div>`;
  else if (opts.text) html += `<div class="am-text">${escapeHtml(opts.text)}</div>`;

  if (opts.input === 'text') {
    html += `<input class="am-input" type="text" placeholder="${escapeHtml(opts.inputPlaceholder || '')}" value="${escapeHtml(opts.inputValue || '')}">`;
  } else if (opts.input === 'checkbox') {
    html += `<label class="am-checkbox"><input type="checkbox" ${opts.inputValue ? 'checked' : ''}><span>${escapeHtml(opts.inputPlaceholder || '')}</span></label>`;
  }

  const showConfirm = opts.showConfirmButton !== false;
  if (!opts.toast && (showConfirm || opts.showCancelButton)) {
    html += '<div class="am-actions">';
    if (opts.showCancelButton) html += `<button type="button" class="am-btn am-cancel" data-am-cancel>${escapeHtml(opts.cancelButtonText || '取消')}</button>`;
    if (showConfirm) html += `<button type="button" class="am-btn am-confirm" data-am-confirm>${escapeHtml(opts.confirmButtonText || '確定')}</button>`;
    html += '</div>';
  }

  dialog.innerHTML = html;
  backdrop.appendChild(dialog);
  return { backdrop, dialog };
}

let _currentClose = null;

export const AppModal = {
  /**
   * @param {Object} opts
   * @returns {Promise<{isConfirmed:boolean, isDismissed:boolean, value:*}>}
   */
  fire(opts) {
    if (typeof opts === 'string') opts = { title: opts };
    opts = opts || {};
    return new Promise((resolve) => {
      const { backdrop, dialog } = buildDialog(opts);
      document.body.appendChild(backdrop);
      document.body.style.overflow = opts.toast ? '' : 'hidden';

      let settled = false;
      let timerId = null;

      function readValue() {
        if (opts.input === 'text') return dialog.querySelector('.am-input')?.value ?? '';
        if (opts.input === 'checkbox') return !!dialog.querySelector('.am-checkbox input')?.checked;
        return undefined;
      }
      function close(result) {
        if (settled) return;
        settled = true;
        clearTimeout(timerId);
        if (_currentClose === close) _currentClose = null;
        if (typeof opts.willClose === 'function') opts.willClose(dialog);
        backdrop.classList.remove('open');
        document.body.style.overflow = '';
        setTimeout(() => backdrop.remove(), 200);
        resolve(result);
      }
      if (!opts.toast) _currentClose = close;

      requestAnimationFrame(() => {
        backdrop.classList.add('open');
        if (typeof opts.didOpen === 'function') opts.didOpen(dialog);
      });

      dialog.querySelector('[data-am-confirm]')?.addEventListener('click', () => {
        close({ isConfirmed: true, isDismissed: false, value: readValue() });
      });
      dialog.querySelector('[data-am-cancel]')?.addEventListener('click', () => {
        close({ isConfirmed: false, isDismissed: true, value: undefined });
      });
      if (opts.allowOutsideClick !== false && !opts.toast) {
        backdrop.addEventListener('click', (e) => {
          if (e.target === backdrop) close({ isConfirmed: false, isDismissed: true, value: undefined });
        });
      }
      if (!opts.toast && opts.allowEscapeKey !== false) {
        const onKey = (e) => {
          if (e.key === 'Escape') { close({ isConfirmed: false, isDismissed: true, value: undefined }); document.removeEventListener('keydown', onKey); }
        };
        document.addEventListener('keydown', onKey);
      }
      if (opts.timer) {
        timerId = setTimeout(() => close({ isConfirmed: false, isDismissed: true, value: undefined }), opts.timer);
      }
    });
  },

  /** 關閉目前開著的彈窗（例如 fire() 一個沒有按鈕的「處理中」提示，之後用這個關掉）。 */
  close() {
    if (_currentClose) _currentClose({ isConfirmed: false, isDismissed: true, value: undefined });
  }
};
