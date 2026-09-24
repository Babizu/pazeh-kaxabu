/**
 * @file 端對端測試：以正式建置結果在 320px、手機與桌面三種尺寸下測試，另外測子路徑部署。
 * 執行前需先 `npm run build`。
 *
 * 瀏覽器：預設使用 Playwright 內建的 Chromium（需先 `npx playwright install chromium`）；
 * 也可以用環境變數指定本機已安裝的瀏覽器，例如 `PLAYWRIGHT_CHANNEL=msedge`。
 */

import { defineConfig, devices } from '@playwright/test'

const channel = process.env.PLAYWRIGHT_CHANNEL || undefined

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  reporter: [['list']],
  webServer: [
    { command: 'npx babizu preview --port 4173', port: 4173, reuseExistingServer: !process.env.CI },
    { command: 'node scripts/serve-subpath.mjs 4174', port: 4174, reuseExistingServer: !process.env.CI },
  ],
  use: { baseURL: 'http://localhost:4173/', locale: 'zh-TW', channel },
  projects: [
    // 320px 是實務上會遇到的最窄螢幕（小型 Android、iPhone SE 直向）。
    // 只測 Pixel 7 會漏掉「元件收縮不下去」這類問題，所以另外跑一個窄的。
    {
      name: 'narrow',
      testIgnore: /subpath.spec/,
      use: { ...devices['Pixel 7'], viewport: { width: 320, height: 658 }, channel },
    },
    { name: 'mobile', testIgnore: /subpath.spec/, use: { ...devices['Pixel 7'], channel } },
    {
      name: 'desktop',
      testIgnore: /subpath.spec/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 }, channel },
    },
    {
      name: 'subpath',
      testMatch: /subpath.spec/,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:4174/pazeh-kaxabu/', channel },
    },
  ],
})
