/**
 * 查詞根找加綴變化：
 * - 自動派生：由建置時的自動派生圖找到（演算法推定），包括辭典沒有另立條目、只出現在例句裡的詞；
 * - 確定派生：句中的詞是辭典列在查詢詞條下的派生詞（辭典標註），排在自動派生之前。
 * 例句的結果也和詞條一樣標出怎麼找到的。
 */

import { expect, test } from '@playwright/test'

async function expectNoHorizontalOverflow(/** @type {import('@playwright/test').Page} */ page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))
  expect(scrollWidth, '頁面出現水平捲軸（跑版）').toBeLessThanOrEqual(innerWidth + 1)
}

/** @param {import('@playwright/test').Page} page */
const sentenceWith = (page, /** @type {string} */ text) => page.locator('article').filter({ hasText: text }).first()

test('查 sungut（橋）：例句中的 pausunguday（將要造橋）是自動派生的 p<a>u-…-ay（pu、<a>、-ay 一個組合規則），排在不相干的 kizenget 之前', async ({ page }, info) => {
  await page.goto('./#/?q=sungut')
  await page.getByRole('tab', { name: /例句/ }).click()
  const sentence = sentenceWith(page, 'ini haw isia pausunguday')
  await expect(sentence).toBeVisible({ timeout: 30_000 })
  // 排序：完全相同的 sungut 之後就是它；辭典列在相近寫法 zenget 條下的 kizenget 在後面
  const texts = await page.locator('article').allTextContents()
  const first = (/** @type {RegExp} */ re) => texts.findIndex((x) => re.test(x))
  expect(first(/pausunguday/)).toBeGreaterThanOrEqual(0)
  if (first(/kizeng/) >= 0) expect(first(/pausunguday/)).toBeLessThan(first(/kizeng/))
  const tag = sentence.getByRole('button', { name: /自動派生/ })
  await expect(tag).toBeVisible()
  await tag.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText('pausunguday → sungut')).toBeVisible()
  await expect(dialog.getByText('組合規則 · 鋪設・非實現')).toBeVisible()
  await expect(dialog.getByText('pu-', { exact: true })).toBeVisible()
  await expect(dialog.getByText('<a>', { exact: true })).toBeVisible()
  await expect(dialog.getByText('-ay', { exact: true })).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await page.screenshot({ path: `test-results/screenshots/${info.project.name}-derived-chain.png`, fullPage: false })
})

test('寬鬆查 sugut：由相近的 sungut 找到 pausunguday，說明寫法的差異', async ({ page }) => {
  await page.goto('./#/?q=sugut&fz=loose')
  await page.getByRole('tab', { name: /例句/ }).click()
  const sentence = sentenceWith(page, 'ini haw isia pausunguday')
  // 分數是兩段相加（sugut → sungut 0.8，再往下 0.65），排在比較後面：一頁一頁往下找
  const more = page.getByRole('button', { name: /顯示更多/ })
  await expect(more).toBeVisible({ timeout: 30_000 })
  while (!(await sentence.isVisible()) && (await more.isVisible())) await more.click()
  await expect(sentence).toBeVisible()
  await sentence.getByRole('button', { name: /自動派生/ }).click()
  await expect(page.getByRole('dialog').getByText(/查詢「sugut」與詞庫中的「sungut」寫法相近，由「sungut」自動派生/)).toBeVisible()
})

test('查 usa：辭典列在 usa 條下的 mukusa 所在的例句標「確定派生 usa」，排在只是含有 usa 的 dusa 之前', async ({ page }, info) => {
  await page.goto('./#/?q=usa')
  await page.getByRole('tab', { name: /例句/ }).click()
  const more = page.getByRole('button', { name: /顯示更多/ })
  const sentence = page.locator('article').filter({ has: page.locator('mark', { hasText: /^mukusa$/ }) }).first()
  await expect(more).toBeVisible({ timeout: 30_000 })
  while (!(await sentence.isVisible()) && (await more.isVisible())) await more.click()
  await expect(sentence.getByText('確定派生')).toBeVisible()
  await expect(sentence.getByText('確定派生')).toHaveAttribute('title', /不是演算法推定的/)
  const texts = await page.locator('article').allTextContents()
  const mukusa = texts.findIndex((x) => /確定派生/.test(x))
  const dusa = texts.findIndex((x) => /\bdusa\b/.test(x))
  if (dusa >= 0) expect(mukusa).toBeLessThan(dusa)
  await expectNoHorizontalOverflow(page)
  await page.screenshot({ path: `test-results/screenshots/${info.project.name}-derived-dictionary.png`, fullPage: false })
})

test('例句的模糊命中也標出對齊（≈ 與規則），與詞條相同', async ({ page }) => {
  await page.goto('./#/?q=sungud')
  await page.getByRole('tab', { name: /例句/ }).click()
  const sentence = sentenceWith(page, 'sungut')
  await expect(sentence).toBeVisible({ timeout: 30_000 })
  await expect(sentence.getByRole('button', { name: /相近拼寫/ })).toBeVisible()
})

test('查 binubuer（詞庫中沒有）：找到自動同根的 mabubuer，共同的詞根 bubuer 也不在詞庫中', async ({ page }, info) => {
  await page.goto('./#/?q=binubuer')
  await page.getByRole('tab', { name: /^詞條/ }).click()
  const tag = page.getByRole('button', { name: /自動同根：bubuer/ }).first()
  await expect(tag).toBeVisible({ timeout: 30_000 })
  await tag.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText('自動同根的說明')).toBeVisible()
  await expect(dialog.getByText(/這個詞根不在詞庫中/)).toBeVisible()
  await expect(dialog.getByText(/binubuer ＝ bubuer \+ <in>/)).toBeVisible()
  await expect(dialog.getByText('詞庫外的詞根')).toBeVisible()
  await expect(dialog.getByText(/演算法推定兩個詞來自同一個詞根/)).toBeVisible()
  await expect(dialog.getByRole('link', { name: /查看演算法運作方式/ })).toHaveCount(0)
  await expectNoHorizontalOverflow(page)
  await page.screenshot({ path: `test-results/screenshots/${info.project.name}-sibling.png`, fullPage: false })
})
