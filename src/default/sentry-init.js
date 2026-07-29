import * as Sentry from '@sentry/browser';

const DSN = 'https://8603e73bd47744aacaac70ee0977a3cd@o4511592734130176.ingest.us.sentry.io/4511779060842496';
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

// 手動回報：try/catch 接住但想讓 Sentry 知道的錯誤呼叫這個
export function captureException(error, context) {
  Sentry.captureException(error, context);
}

// 兩種環境都用 npm 套件直接打包進自己的 JS 檔，不再透過外部 CDN Loader Script 於執行期動態抓取 SDK
// （CDN Loader 方式在 2026-07 發現會不穩定地載入失敗，導致正式環境完全收不到錯誤回報）
Sentry.init({
  dsn: DSN,
  release: RELEASE,
  environment: import.meta.env.DEV ? 'development' : 'production',
  integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
  tracesSampleRate: import.meta.env.DEV ? 1.0 : 0.2,
  tracePropagationTargets: ['localhost', /^https:\/\/treasurehub\.tw/],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  beforeSend,
});
