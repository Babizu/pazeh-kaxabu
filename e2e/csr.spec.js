/**
 * 對應組檢索（實驗性，babizu 的 docs/csr.md）：搜尋條件的「比對方式」切換到對應組檢索，網址記下 alg=csr；
 * 詞條改由學到的語音對應比對，每個結果附「對應組」的說明（假設的方言、詞綴、每個不同處的對應與成本）。
 */

import { expect, test } from '@playwright/test'

/** 桌面有側欄，窄螢幕要先打開「搜尋條件」抽屜 @param {import('@playwright/test').Page} page */
async function openFilters(page) {
  const trigger = page.getByRole('button', { name: /^搜尋條件/ })
  if (await trigger.isVisible()) await trigger.click()
}

test('查 turu：切換成對應組檢索，網址記下 alg=csr，搜尋方法的篩選收起來', async ({ page }) => {
  await page.goto('./#/?q=turu&f=native')
  await expect(page.locator('article').first()).toBeVisible({ timeout: 30_000 })
  await openFilters(page)
  await page.getByText('對應組檢索', { exact: true }).locator('visible=true').first().click()
  await expect(page).toHaveURL(/alg=csr/)
  await expect(page.getByText('對應組檢索不分搜尋方法；要依方法篩選，請改回「方言規則」。').locator('visible=true').first()).toBeVisible()
})

test('查 turu（對應組檢索）：噶哈巫的 tuu 附學到的對應 r→∅ 的說明', async ({ page }) => {
  await page.goto('./#/?q=turu&f=native&alg=csr&tab=entries')
  const row = page.locator('article').filter({ hasText: /\btuu\b/ }).first()
  await expect(row).toBeVisible({ timeout: 30_000 })
  const badge = row.getByRole('button', { name: /^對應組，分數/ }).first()
  await badge.click()
  await expect(page.getByText('對應組檢索的說明')).toBeVisible()
  await expect(page.getByText('把查詢當成巴宰的詞，比對噶哈巫的詞。')).toBeVisible()
  await expect(page.getByRole('dialog').getByText('r→∅', { exact: true }).first()).toBeVisible()
})
