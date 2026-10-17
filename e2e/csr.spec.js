/**
 * 對應組檢索（實驗性，babizu 的 docs/csr.md）：在右上角的設定選單切換模糊搜尋的核心演算法，選擇會記住。
 * 搜尋條件、命中方式的標籤都與方言規則相同；點開說明才看得到對應組檢索自己的說明（假設的方言、詞綴、每個不同處的對應與成本）。
 */

import { expect, test } from '@playwright/test'

/** 在設定選單選一種模糊搜尋 @param {import('@playwright/test').Page} page @param {string} name */
async function chooseAlgorithm(page, name) {
  await page.getByRole('button', { name: /^設定/ }).click()
  await page.getByRole('dialog').getByText(name, { exact: true }).click()
  await page.keyboard.press('Escape')
}

test('查 turu：設定選單換成對應組檢索，重新整理後仍記得；噶哈巫的 tuu 附學到的對應 r→∅', async ({ page }) => {
  await page.goto('./#/?q=turu&f=native&tab=entries')
  await expect(page.locator('article').first()).toBeVisible({ timeout: 30_000 })
  await chooseAlgorithm(page, '對應組檢索')
  await page.reload()
  const row = page.locator('article').filter({ hasText: /\btuu\b/ }).first()
  await expect(row).toBeVisible({ timeout: 30_000 })
  await row.getByRole('button', { name: /^相近拼寫，距離/ }).first().click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText('對應組檢索（實驗）')).toBeVisible()
  await expect(dialog.getByText('把查詢當成巴宰的詞，比對噶哈巫的詞。')).toBeVisible()
  await expect(dialog.getByText('r→∅', { exact: true }).first()).toBeVisible()
})

test('對應組檢索時搜尋條件不變：搜尋方法照常，排除「自動」之後沒有自動拆解、派生、同根；換回方言規則也照常', async ({ page }) => {
  await page.goto('./#/?q=turu&f=native')
  await expect(page.locator('article').first()).toBeVisible({ timeout: 30_000 })
  await chooseAlgorithm(page, '對應組檢索')
  await page.goto('./#/?q=turu&f=native&x=lemma,derived,sibling&tab=entries')
  await expect(page.locator('article').first()).toBeVisible({ timeout: 30_000 })
  await expect(page.getByRole('button', { name: /^自動(拆解|派生|同根)/ })).toHaveCount(0)
  await chooseAlgorithm(page, '方言規則')
  await expect(page.locator('article').first()).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})
