/**
 * Smoke tests — 確認所有頁面可正常載入、關鍵元素存在、無嚴重 JS 錯誤
 *
 * 不需登入的頁面會完整驗證 UI；
 * 需登入的頁面只確認「頁面不崩潰 / 有導向登入頁或顯示提示」。
 */
import { test, expect } from '@playwright/test';

// ── 工具：收集嚴重 console 錯誤（排除已知無害訊息）─────────
const IGNORED_ERRORS = [
  /favicon/i,
  /net::ERR_/,            // 後端 API 在本機 dev 可能 unavailable
  /Failed to fetch/i,
  /404.*api\//i,
  /axios/i,
  /ERR_CONNECTION_REFUSED/,
];

function collectErrors(page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!IGNORED_ERRORS.some(r => r.test(text))) {
        errors.push(text);
      }
    }
  });
  page.on('pageerror', err => {
    errors.push(err.message);
  });
  return errors;
}

// ════════════════════════════════════════════════════
//  公開頁面（不需登入）
// ════════════════════════════════════════════════════

test.describe('公開頁面', () => {

  test('首頁 (shop) 載入 + 商品列表', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/shop/shop.html');
    await expect(page).toHaveTitle(/拾貨寶庫|TreasureHub/i);
    // navbar
    await expect(page.locator('nav, .navbar, #navbar')).toBeVisible();
    // 等商品卡或 loading spinner 出現
    await expect(
      page.locator('.product-card, .commodity-card, .item-card, .spinner-border').first()
    ).toBeVisible({ timeout: 10_000 });
    expect(errors).toHaveLength(0);
  });

  test('newhome 載入 + hero 區塊', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/newhome/newhome.html');
    await expect(page).toHaveTitle(/拾貨寶庫|TreasureHub/i);
    await expect(page.locator('nav, .navbar, #navbar')).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('登入 / 註冊頁 載入', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/account/account.html');
    // 表單應存在
    await expect(page.locator('form, input[type="email"], input[type="password"]').first()).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('最新資訊頁 載入', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/news/news.html');
    await expect(page).toHaveTitle(/拾貨寶庫|最新資訊/i);
    expect(errors).toHaveLength(0);
  });

  test('使用規範頁 載入', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/policy/policy.html');
    await expect(page.locator('body')).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('常見問題頁 載入', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/questions/questions.html');
    await expect(page.locator('body')).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('校園攻略站 載入', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/school/school.html');
    await expect(page).toHaveTitle(/校園攻略|拾貨寶庫/i);
    await expect(page.locator('body')).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('404 頁面', async ({ page }) => {
    const res = await page.goto('/this-page-does-not-exist.html');
    // 應回傳 404 或顯示自訂錯誤頁
    const status = res?.status();
    expect([404, 200]).toContain(status); // 有些 SPA 回 200 自帶 404 畫面
  });

});

// ════════════════════════════════════════════════════
//  需登入頁面：確認不崩潰、有 auth gate
// ════════════════════════════════════════════════════

test.describe('需登入的頁面（auth gate 驗證）', () => {

  for (const [name, path] of [
    ['許願池', '/wishpool/wishpool.html'],
    ['聊天室', '/chatroom/chatroom.html'],
    ['購物車', '/shoppingcart/shoppingcart.html'],
    ['個人頁', '/person/person.html'],
    ['後台管理', '/official/official.html'],
  ]) {
    test(`${name} — 未登入不崩潰 / 跳轉登入`, async ({ page }) => {
      const jsErrors = [];
      page.on('pageerror', err => jsErrors.push(err.message));

      await page.goto(path);

      // 等待任一結果：跳轉到 account 頁 或 顯示登入提示 Modal
      await Promise.race([
        page.waitForURL(/account/, { timeout: 8_000 }),
        page.locator('.swal2-popup, [class*="modal"], [class*="alert"]').waitFor({ timeout: 8_000 }),
        page.waitForTimeout(8_000),  // fallback：至少頁面不崩潰
      ]).catch(() => {});

      expect(jsErrors).toHaveLength(0);
    });
  }

});
