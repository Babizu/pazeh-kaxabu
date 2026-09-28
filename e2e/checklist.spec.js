/**
 * 檢查清單（/checklist）：不在主選單，由資料來源頁的說明連入。
 * 例句中沒有詞條的詞並列辭典中最接近的詞條，捲動時一頁一頁載入；完全相同的詞條可以篩選。
 */

import { expect, test } from '@playwright/test'

async function expectNoHorizontalOverflow(/** @type {import('@playwright/test').Page} */ page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))
  expect(scrollWidth, '頁面出現水平捲軸（跑版）').toBeLessThanOrEqual(innerWidth + 1)
}

test('由資料來源頁進入；例句中沒有詞條的詞並列辭典中最接近的詞條，捲動載入下一頁', async ({ page }, info) => {
  await page.goto('./#/sources')
  // 不在主選單，只從資料來源頁的說明連入
  await expect(page.getByRole('navigation').getByRole('link', { name: '檢查清單' })).toHaveCount(0)
  await page.getByRole('main').getByRole('link', { name: '檢查清單' }).click()
  await expect(page).toHaveURL(/#\/checklist$/)
  await expect(page.getByRole('heading', { level: 1, name: '檢查清單' })).toBeVisible()

  const panel = page.locator('#panel-tokens')
  const rows = panel.locator(':scope > ol > li')
  await expect(rows.first()).toBeVisible({ timeout: 30_000 })
  // 出現最多次、沒有辭典條目的詞排第一，右欄是它在辭典中最接近的詞條
  await expect(rows.first().getByRole('heading', { level: 3 })).toHaveText('akhéhén')
  await expect(rows.first().getByText('出現在 28 句')).toBeVisible()
  await expect(rows.first().getByText('像加綴派生')).toBeVisible()
  const first = await rows.count()

  // 捲到底：載入下一頁
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await expect.poll(() => rows.count(), { timeout: 20_000 }).toBeGreaterThan(first)
  await expectNoHorizontalOverflow(page)

  // 依類別篩選：網址記下篩選，列出的都是這一類
  await page.evaluate(() => window.scrollTo(0, 0))
  await panel.getByRole('button', { name: /像方言變體/ }).click()
  await expect(page).toHaveURL(/kind=variant/)
  await expect(rows.first().getByText('像方言變體')).toBeVisible({ timeout: 30_000 })
  await expect(panel.locator(':scope > ol > li').filter({ hasText: '像加綴派生' })).toHaveCount(0)

  // 右欄的說明標籤與搜尋結果相同，可以點開看比對
  await rows.first().getByRole('button', { name: /相近拼寫|自動拆解/ }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await page.screenshot({ path: `test-results/screenshots/${info.project.name}-checklist-tokens.png`, fullPage: false })
})

test('完全相同的詞條：同一來源內釋義也相同的標為疑似重複登錄', async ({ page }, info) => {
  await page.goto('./#/checklist?tab=duplicates&filter=repeated')
  const panel = page.locator('#panel-duplicates')
  const groups = panel.locator(':scope > ol > li')
  await expect(groups.first()).toBeVisible({ timeout: 30_000 })
  await expect(page.getByRole('tab', { name: /完全相同的詞條/ })).toHaveAttribute('aria-selected', 'true')
  await expect(panel.getByRole('button', { name: /疑似重複登錄/ })).toHaveAttribute('aria-pressed', 'true')
  const aalep = groups.filter({ has: page.getByRole('heading', { level: 3, name: 'aalep' }) })
  await expect(aalep).toHaveCount(1)
  await expect(aalep.getByText('釋義相同')).toHaveCount(2)
  await expectNoHorizontalOverflow(page)
  await page.screenshot({ path: `test-results/screenshots/${info.project.name}-checklist-duplicates.png`, fullPage: false })
})
