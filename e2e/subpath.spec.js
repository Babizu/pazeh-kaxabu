/**
 * 子路徑部署（GitHub Pages 的 https://<帳號>.github.io/pazeh-kaxabu/）：
 * 所有資源都要用相對網址，否則在子路徑下會 404。
 */

import { expect, test } from '@playwright/test'

test('在 /pazeh-kaxabu/ 底下可以搜尋、看詞條與原書掃描頁', async ({ page }) => {
  const failed = []
  page.on('response', (res) => {
    if (res.status() >= 400) failed.push(`${res.status()} ${res.url()}`)
  })
  await page.goto('./#/?q=bintul')
  await expect(page.locator('article').filter({ hasText: 'bintun' }).first()).toBeVisible()
  await page.goto('./#/r/pazih-dict/p085-01')
  await expect(page.getByRole('heading', { level: 1, name: 'baruzak' })).toBeVisible()
  await page.getByRole('button', { name: '查看原書掃描頁' }).locator('visible=true').first().click()
  const image = page.getByRole('dialog').getByRole('img')
  await expect.poll(() => image.evaluate((img) => /** @type {HTMLImageElement} */ (img).naturalWidth)).toBeGreaterThan(0)
  expect(failed).toEqual([])
})
