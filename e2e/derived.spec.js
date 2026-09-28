/**
 * 衍生形（查詞根找加綴變化）：由建置時的衍生關係圖找到，包括辭典沒有另立條目、只出現在例句裡的詞；
 * 例句的結果也和詞條一樣標出怎麼找到的（自動拆解、衍生形、模糊對齊）。
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

test('查 sungut（橋）：例句中的 pausunguday（將要造橋）標為衍生形，說明經過 pusungut', async ({ page }, info) => {
  await page.goto('./#/?q=sungut')
  await page.getByRole('tab', { name: /例句/ }).click()
  const sentence = sentenceWith(page, 'ini haw isia pausunguday')
  await expect(sentence).toBeVisible({ timeout: 30_000 })
  const tag = sentence.getByRole('button', { name: /衍生形/ })
  await expect(tag).toBeVisible()
  await tag.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText('pausunguday → pusungut')).toBeVisible()
  await expect(dialog.getByText('「pusungut」本身是「sungut」的衍生形：')).toBeVisible()
  await expect(dialog.getByText(/pusungut ＝ pu- \+ sungut/)).toBeVisible()
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
  await sentence.getByRole('button', { name: /衍生形/ }).click()
  await expect(page.getByRole('dialog').getByText(/查詢「sugut」與詞庫中的「sungut」寫法相近/)).toBeVisible()
})

test('例句的模糊命中也標出對齊（≈ 與規則），與詞條相同', async ({ page }) => {
  await page.goto('./#/?q=sungud')
  await page.getByRole('tab', { name: /例句/ }).click()
  const sentence = sentenceWith(page, 'sungut')
  await expect(sentence).toBeVisible({ timeout: 30_000 })
  await expect(sentence.getByRole('button', { name: /相近拼寫/ })).toBeVisible()
})
