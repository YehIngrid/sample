/**
 * 聊天室功能測試
 * 主要驗證近期修復的行為：Enter 鍵、Shift+Enter 換行、時間選擇器
 */
import { test, expect } from '@playwright/test';

test.describe('聊天室 UI 元素', () => {

  test('頁面核心元素存在', async ({ page }) => {
    await page.goto('/chatroom/chatroom.html');
    // 輸入框
    await expect(page.locator('#messageInput')).toBeVisible();
    // 送出按鈕（form submit）
    await expect(page.locator('#messageForm button[type="submit"]')).toBeVisible();
    // 圖片、時間、地點按鈕
    await expect(page.locator('#send-image-btn')).toBeVisible();
    await expect(page.locator('#time-picker-btn')).toBeVisible();
    await expect(page.locator('#location-picker-btn')).toBeVisible();
  });

  test('時間選擇器面板 — 開關', async ({ page }) => {
    await page.goto('/chatroom/chatroom.html');
    const panel = page.locator('#timePicker');
    await expect(panel).toBeHidden();

    await page.locator('#time-picker-btn').click();
    await expect(panel).toBeVisible();

    // 再點一次應關閉
    await page.locator('#time-picker-btn').click();
    await expect(panel).toBeHidden();
  });

  test('時間選擇器 — 確切時間輸入框存在', async ({ page }) => {
    await page.goto('/chatroom/chatroom.html');
    await page.locator('#time-picker-btn').click();
    await expect(page.locator('#timePickerExact')).toBeVisible();
    await expect(page.locator('#timePickerExactClear')).toBeVisible();
  });

  test('時間選擇器 — 選時段後填確切時間，時段自動取消選取', async ({ page }) => {
    await page.goto('/chatroom/chatroom.html');
    await page.locator('#time-picker-btn').click();

    // 先選「下午」chip
    await page.locator('#timePickerSlots .picker-chip[data-val="下午"]').click();
    await expect(
      page.locator('#timePickerSlots .picker-chip[data-val="下午"]')
    ).toHaveClass(/selected/);

    // 填入確切時間
    await page.locator('#timePickerExact').fill('15:30');

    // 時段 chip 應取消選取
    await expect(
      page.locator('#timePickerSlots .picker-chip[data-val="下午"]')
    ).not.toHaveClass(/selected/);
  });

  test('時間選擇器 — 確切時間插入訊息', async ({ page }) => {
    await page.goto('/chatroom/chatroom.html');
    await page.locator('#time-picker-btn').click();

    // 選日期
    await page.locator('#timePickerDays .picker-chip[data-val="明天"]').click();
    // 填確切時間
    await page.locator('#timePickerExact').fill('14:00');
    // 確認
    await page.locator('#timePickerConfirm').click();

    const inputVal = await page.locator('#messageInput').inputValue();
    expect(inputVal).toContain('明天');
    expect(inputVal).toContain('14:00');
  });

  test('時間選擇器 — 清除按鈕清空時間', async ({ page }) => {
    await page.goto('/chatroom/chatroom.html');
    await page.locator('#time-picker-btn').click();
    await page.locator('#timePickerExact').fill('09:00');
    await page.locator('#timePickerExactClear').click();
    await expect(page.locator('#timePickerExact')).toHaveValue('');
  });

  test('地點選擇器面板 — 開關', async ({ page }) => {
    await page.goto('/chatroom/chatroom.html');
    const panel = page.locator('#locationPicker');
    await expect(panel).toBeHidden();
    await page.locator('#location-picker-btn').click();
    await expect(panel).toBeVisible();
  });

});

test.describe('聊天室 Enter 鍵行為（桌機）', () => {

  test('Shift+Enter 應換行而非送出', async ({ page }) => {
    await page.goto('/chatroom/chatroom.html');
    const input = page.locator('#messageInput');
    await input.click();
    await input.type('第一行');
    await input.press('Shift+Enter');
    await input.type('第二行');

    const val = await input.inputValue();
    expect(val).toContain('\n');
    expect(val).toContain('第一行');
    expect(val).toContain('第二行');
  });

});
