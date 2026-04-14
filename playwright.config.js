import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 20_000,
  retries: 1,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],

  use: {
    baseURL: 'http://localhost:5500',
    // 攔截 console errors 供測試使用
    trace: 'on-first-retry',
  },

  // 啟動 dev server 後再跑測試
  webServer: {
    command: 'node server.js',
    url: 'http://localhost:5500',
    reuseExistingServer: true,
    timeout: 10_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
  ],
});
