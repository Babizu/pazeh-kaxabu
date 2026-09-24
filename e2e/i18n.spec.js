/**
 * 介面語系：切換、記住選擇、族語缺字時回退中文，以及站台覆寫的字串。
 */

import { expect, test } from '@playwright/test'

const languageSelect = (/** @type {import('@playwright/test').Page} */ page) =>
  page.getByRole('combobox', { name: /介面語言|Interface language/ })

test('切換成英文：標題、選單與站台說明都換成英文，重新整理後仍記得', async ({ page }) => {
  await page.goto('./#/about')
  await languageSelect(page).selectOption('en')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('heading', { level: 1, name: 'About this dictionary' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Dialect labels' })).toBeVisible()
  await expect(page.getByText('Pazeh (Auran)').first()).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Dialect labels' })).toBeVisible()
  await page.goto('./#/')
  await expect(page.getByRole('heading', { level: 1, name: 'Pazeh–Kaxabu Digital Dictionary' })).toBeVisible()
  await expect(page.getByText(/[\d,]+ records and [\d,]+ word forms loaded/)).toBeVisible()
})

test('族語介面：尚未翻譯的字串以中文顯示', async ({ page }) => {
  await page.goto('./#/about')
  await languageSelect(page).selectOption('pzh')
  await expect(page.locator('html')).toHaveAttribute('lang', 'pzh')
  await expect(page.getByRole('heading', { name: '方言標記' })).toBeVisible()
})

test('站台覆寫的介面字串：模糊程度說明帶有巴宰語的例子', async ({ page }) => {
  await page.goto('./#/?q=bintul')
  if ((page.viewportSize()?.width ?? 0) < 1024) await page.getByRole('button', { name: '搜尋條件' }).click()
  await expect(page.getByText(/r 脫落、詞尾 l→n/).locator('visible=true').first()).toBeVisible()
})

test('瀏覽器偏好英文時預設使用英文', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'en-US' })
  const page = await context.newPage()
  await page.goto('./#/')
  await expect(page.getByRole('heading', { level: 1, name: 'Pazeh–Kaxabu Digital Dictionary' })).toBeVisible()
  await context.close()
})
