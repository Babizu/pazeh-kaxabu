/**
 * 搜尋方法的篩選：四組（拼寫、部分符合、確定、自動），可以整組或個別顯示、排除；每組與每個方法旁邊是找得到的筆數。
 * 個別的方法收在組底下，預設收合；一開始就部分排除的組展開。
 * 排除記在網址上（x=），被排除的方法不會壓在其他方法底下（一筆記錄改用剩下的方法中最好的命中）。
 */

import { expect, test } from '@playwright/test'

/** 桌面有側欄，窄螢幕要先打開「搜尋條件」抽屜 @param {import('@playwright/test').Page} page */
async function openFilters(page) {
  const trigger = page.getByRole('button', { name: /^搜尋條件/ })
  if (await trigger.isVisible()) await trigger.click()
  return page.locator('fieldset').filter({ hasText: '搜尋方法' }).locator('visible=true').first()
}

test('查 usa：排除整組「自動」後，結果中沒有自動拆解、派生、同根；網址記下排除的方法，可以一鍵全部顯示', async ({ page }, info) => {
  await page.goto('./#/?q=usa')
  const panel = await openFilters(page)
  await expect(panel).toBeVisible({ timeout: 30_000 })
  // 個別的方法預設收合；每組旁邊有筆數，展開後每個方法旁邊也有（數字，不受排除影響）
  await expect(panel.getByText('完全相符')).toBeHidden()
  await expect(panel.locator('label', { has: page.getByRole('checkbox', { name: '整組：拼寫' }) })).toContainText(/\d/)
  const expand = panel.getByRole('button', { name: '拼寫的個別方法' })
  await expect(expand).toHaveAttribute('aria-expanded', 'false')
  await expand.click()
  await expect(expand).toHaveAttribute('aria-expanded', 'true')
  await expect(panel.getByText('完全相符')).toBeVisible()
  await expect(panel.locator('label', { hasText: '完全相符' })).toContainText(/\d/)
  await page.screenshot({ path: `test-results/screenshots/${info.project.name}-methods.png`, fullPage: false })
  await panel.getByRole('checkbox', { name: '整組：自動（演算法推定）' }).click()
  await expect(page).toHaveURL(/x=lemma%2Cderived%2Csibling|x=lemma,derived,sibling/)
  await page.keyboard.press('Escape')
  await page.getByRole('tab', { name: /^例句/ }).click()
  await expect(page.locator('article').first()).toBeVisible()
  await expect(page.getByRole('button', { name: /^自動(拆解|派生|同根)/ })).toHaveCount(0)
  // 確定派生（辭典列在 usa 條下的 mukusa）照樣在
  const more = page.getByRole('button', { name: /顯示更多/ })
  const tag = page.getByText('確定派生').first()
  while (!(await tag.isVisible()) && (await more.isVisible())) await more.click()
  await expect(tag).toBeVisible()
  // 全部顯示
  const again = await openFilters(page)
  await again.getByRole('button', { name: '全部顯示' }).click()
  await expect(page).not.toHaveURL(/x=/)
})

test('查 pinakita：辭典的上層是確定拆解、同一個上層的其他詞是確定同根；只排除確定同根時，確定拆解還在', async ({ page }) => {
  await page.goto('./#/?q=pinakita&x=dictSibling')
  await page.getByRole('tab', { name: /^詞條/ }).click()
  const row = page.locator('[data-entry-group]').first()
  await expect(row).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText('確定拆解').first()).toBeVisible()
  await expect(page.getByText('確定同根')).toHaveCount(0)
})

test('網址帶部分排除（x=prefix）時，部分符合一組展開、開頭未勾選；收合後組名下寫出排除了哪些', async ({ page }) => {
  await page.goto('./#/?q=usa&x=prefix')
  const panel = await openFilters(page)
  await expect(panel).toBeVisible({ timeout: 30_000 })
  const expand = panel.getByRole('button', { name: '部分符合的個別方法' })
  await expect(expand).toHaveAttribute('aria-expanded', 'true')
  await expect(panel.getByRole('checkbox', { name: '開頭' })).not.toBeChecked()
  await expect(panel.getByRole('checkbox', { name: '整組：部分符合' })).toHaveAttribute('data-state', 'indeterminate')
  await expand.click()
  await expect(panel.getByText('不含 開頭')).toBeVisible()
  // 收合時個別選項不能用鍵盤進入（inert）
  await expect(panel.getByRole('checkbox', { name: '開頭' })).toBeHidden()
})
