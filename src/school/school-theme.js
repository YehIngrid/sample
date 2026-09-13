// ── School theme toggle（shared across school pages）──
(function () {
  const KEY = 'school-theme';
  const media = window.matchMedia('(prefers-color-scheme: dark)');

  function storedTheme() {
    return localStorage.getItem(KEY);
  }

  function resolveTheme() {
    // 1. 使用者手動選過 → 尊重 localStorage
    // 2. 沒選過 → 讀系統偏好 prefers-color-scheme
    // 3. 都沒有 → 預設 light
    return storedTheme() || (media.matches ? 'dark' : 'light');
  }

  // ── 文章內文顏色（撰寫攻略工具列的黑/藍/紅/綠/橘/紫）淺色↔深色對應表 ──
  // 文章顏色是編輯器用 execCommand('foreColor', ...) 直接寫死存進內文的，
  // 換主題時要即時把這幾個「已知色票」轉成對應深/淺色版本，讀者才看得到字。
  const ARTICLE_COLOR_LIGHT_TO_DARK = {
    '#1a2840': '#eaf1f9', // 黑（預設）
    '#2a78d6': '#6aa9e8', // 藍
    '#e24b4a': '#f0827f', // 紅
    '#1d9e75': '#4fd9ac', // 綠
    '#ba7517': '#e0a83f', // 橘
    '#7f77dd': '#a89bf0', // 紫
  };

  function normalizeColor(input) {
    if (!input) return null;
    input = String(input).trim().toLowerCase();
    const hexMatch = input.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
    if (hexMatch) {
      let h = hexMatch[1];
      if (h.length === 3) h = h.split('').map((c) => c + c).join('');
      return '#' + h;
    }
    const rgbMatch = input.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (rgbMatch) {
      const [r, g, b] = rgbMatch.slice(1, 4).map(Number);
      return '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');
    }
    return null;
  }

  let articleObserver = null;

  function themeArticleColors(root) {
    root = root || document;
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    // 標題／副標（撰寫頁 input、預覽頁 h1/p）套色時是整個欄位設 style.color，
    // 不在 .article-body 底下，要另外納入才會跟著深/淺色主題換色。
    const nodes = root.querySelectorAll
      ? root.querySelectorAll('.article-body [style*="color"], .title-input[style*="color"], .subtitle-input[style*="color"], #title[style*="color"], #subtitle[style*="color"]')
      : [];
    if (!nodes.length) return;
    if (articleObserver) articleObserver.disconnect();
    nodes.forEach((el) => {
      let orig = el.dataset.articleOrigColor;
      if (!orig) {
        const norm = normalizeColor(el.style.color);
        if (!norm || !ARTICLE_COLOR_LIGHT_TO_DARK[norm]) return; // 不是已知色票，不動它
        orig = norm;
        el.dataset.articleOrigColor = orig;
      }
      el.style.color = dark ? ARTICLE_COLOR_LIGHT_TO_DARK[orig] : orig;
    });
    if (articleObserver) articleObserver.observe(document.body, { childList: true, subtree: true });
  }
  window.themeArticleColors = themeArticleColors;

  // 給色票 UI 用：回傳某個色票原色在目前主題下「實際會套用」的顏色
  // （例如撰寫頁色票列表要用這個決定 swatch 本身要顯示黑還是白）
  function themedSwatchColor(hex) {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    const norm = normalizeColor(hex);
    if (!norm) return hex;
    return dark ? (ARTICLE_COLOR_LIGHT_TO_DARK[norm] || norm) : norm;
  }
  window.themedSwatchColor = themedSwatchColor;

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const icon = document.getElementById('themeIcon');
    if (icon) icon.className = theme === 'dark' ? 'ti ti-sun' : 'ti ti-moon';
    document.querySelectorAll('.theme-toggle-icon').forEach((el) => {
      el.className = 'theme-toggle-icon ti ' + (theme === 'dark' ? 'ti-sun' : 'ti-moon');
    });
    // 標籤顯示「切換後會變成的模式」，而不是目前所在的模式
    document.querySelectorAll('.theme-toggle-label').forEach((el) => {
      el.textContent = theme === 'dark' ? '淺色模式' : '深色模式';
    });
    themeArticleColors();
    document.dispatchEvent(new CustomEvent('schooltheme:change', { detail: { theme } }));
  }

  // Apply immediately to avoid flash
  applyTheme(resolveTheme());

  // 使用者尚未手動選過時，跟隨系統偏好即時切換
  media.addEventListener('change', (e) => {
    if (!storedTheme()) applyTheme(e.matches ? 'dark' : 'light');
  });

  document.addEventListener('DOMContentLoaded', () => {
    // 頁面載入當下就存在的文章內文（靜態內容、或先於此腳本註冊前就插入的內容）
    themeArticleColors();

    // 之後才動態塞進來的內文（後端抓文章、編輯器打字/貼上/套色）也要跟著換色
    articleObserver = new MutationObserver(() => themeArticleColors());
    articleObserver.observe(document.body, { childList: true, subtree: true });

    function bindToggle(btn) {
      if (!btn) return;
      btn.addEventListener('click', () => {
        const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        localStorage.setItem(KEY, next);
        applyTheme(next);
      });
    }
    // nav 外層的主按鈕（登出狀態）＋ 藏在頭像下拉選單裡的按鈕（登入狀態，由 school-new.js 動態插入）
    bindToggle(document.getElementById('themeToggle'));
    bindToggle(document.getElementById('themeToggleAvatar'));
  });
})();
