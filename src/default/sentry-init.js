const DSN = 'https://8603e73bd47744aacaac70ee0977a3cd@o4511592734130176.ingest.us.sentry.io/4511779060842496';
const SENTRY_LOADER_URL = 'https://js.sentry-cdn.com/8603e73bd47744aacaac70ee0977a3cd.min.js';
const RELEASE = `treasurehub@${import.meta.env.VITE_APP_VERSION}+${import.meta.env.VITE_GIT_COMMIT}`;

// 帳號相關 API 會用到的敏感欄位/header 名稱，送出前一律過濾掉
const SENSITIVE_KEYS = ['password', 'newpassword', 'currentpassword', 'token', 'idtoken', 'authorization', 'cookie'];

function isSensitiveKey(key) {
  const lower = key.toLowerCase();
  return SENSITIVE_KEYS.some(k => lower.includes(k));
}

function scrub(value, depth = 0) {
  if (depth > 5 || value === null || typeof value !== 'object') return value;
  const clone = Array.isArray(value) ? [] : {};
  for (const key in value) {
    clone[key] = isSensitiveKey(key) ? '[Filtered]' : scrub(value[key], depth + 1);
  }
  return clone;
}

function beforeSend(event) {
  if (event.request) {
    if (event.request.data) event.request.data = scrub(event.request.data);
    if (event.request.headers) event.request.headers = scrub(event.request.headers);
    if (event.request.cookies) event.request.cookies = '[Filtered]';
  }
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map(b => (b.data ? { ...b, data: scrub(b.data) } : b));
  }
  return event;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.crossOrigin = 'anonymous';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function initSentry() {
  if (import.meta.env.DEV) {
    // 開發環境：npm 套件 + ESM import
    const Sentry = await import('@sentry/browser');
    Sentry.init({
      dsn: DSN,
      release: RELEASE,
      environment: 'development',
      integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
      tracesSampleRate: 1.0,
      tracePropagationTargets: ['localhost', /^https:\/\/treasurehub\.tw/],
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      beforeSend,
    });
  } else {
    // 正式環境：CDN Loader Script（功能開關在 Sentry 後台 Project Settings 設定）
    await loadScript(SENTRY_LOADER_URL);
    window.Sentry.onLoad(function () {
      window.Sentry.init({
        release: RELEASE,
        environment: 'production',
        beforeSend,
      });
    });
  }
}

initSentry();
