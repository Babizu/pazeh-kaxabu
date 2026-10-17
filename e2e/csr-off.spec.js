/**
 * 網站目前不啟用對應組檢索（babizu.config.js 的 csr: false）：設定選單沒有「模糊搜尋」，網站資料也沒有模型。
 * 啟用時這個測試跳過，改由 csr.spec.js 測。
 */

import { expect, test } from '@playwright/test'
import config from '../babizu.config.js'

test.skip(!!config.csr, '網站啟用了對應組檢索')

test('沒有啟用對應組檢索：設定選單沒有「模糊搜尋」，也不提供模型', async ({ page }) => {
  await page.goto('./#/?q=turu&f=native')
  await expect(page.locator('article').first()).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: /^設定/ }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText('外觀', { exact: true }).first()).toBeVisible()
  await expect(dialog.getByText('模糊搜尋', { exact: true })).toHaveCount(0)
  await expect(dialog.getByText('對應組檢索', { exact: true })).toHaveCount(0)
  // 預覽伺服器對找不到的檔案回首頁，所以看內容：不是模型
  const res = await page.request.get('./data/search/csr.json')
  expect(await res.text()).not.toContain('babizu-csr-model')
})
