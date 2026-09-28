/**
 * 同形詞組：不同來源寫法完全相同的詞在搜尋結果中合成一項，詞形只寫一次，底下每筆一列（釋義、方言、出處）。
 * 詞條家族（kita- 條）維持原樣；家族中同樣寫法的詞另外列一份進同形詞組。附加符號不同就不合併。
 */

import { expect, test } from '@playwright/test'

async function expectNoHorizontalOverflow(/** @type {import('@playwright/test').Page} */ page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))
  expect(scrollWidth, '頁面出現水平捲軸（跑版）').toBeLessThanOrEqual(innerWidth + 1)
}

/** @param {import('@playwright/test').Page} page @param {string} text */
const spellingSet = (page, text) => page.locator('[data-spelling-set]').filter({ has: page.getByRole('heading', { level: 3, name: text, exact: true }) })

test('查 mikita：三個來源的 mikita 合成一項，巴宰語詞典那一筆標明也在 kita- 條下；kita- 條照樣在', async ({ page }, info) => {
  await page.goto('./#/?q=mikita')
  await page.getByRole('tab', { name: /^詞條/ }).click()
  const set = spellingSet(page, 'mikita').first()
  await expect(set).toBeVisible({ timeout: 30_000 })
  await expect(set.getByRole('listitem')).toHaveCount(3)
  await expect(set.getByText('看，觀看')).toBeVisible()
  await expect(set.getByText('潘德興詞彙表').first()).toBeVisible()
  await expect(set.getByText('也列在 kita- 條下')).toBeVisible()
  // 家族本身不變
  await expect(page.locator('[data-entry-group]').filter({ has: page.getByRole('link', { name: 'kita-', exact: true }) }).first()).toBeVisible()
  // 每一列都連到那筆記錄
  await set.getByRole('link', { name: /潘德興詞彙表/ }).click()
  await expect(page).toHaveURL(/#\/r\/pan-dexing-wordlist\//)
  await page.goBack()
  await expectNoHorizontalOverflow(page)
  await page.screenshot({ path: `test-results/screenshots/${info.project.name}-spelling-mikita.png`, fullPage: false })
})

test('查 maturay：matoway、maturai 各合成一項，命中標籤只寫在詞形旁；附加符號不同的 mātūra͡i 單獨一項', async ({ page }, info) => {
  await page.goto('./#/?q=maturay')
  await page.getByRole('tab', { name: /^詞條/ }).click()
  const matoway = spellingSet(page, 'matoway')
  await expect(matoway).toBeVisible({ timeout: 30_000 })
  await expect(matoway.getByRole('listitem')).toHaveCount(2)
  // 兩筆的命中方式相同：≈ 標籤只有一個，在詞形旁
  await expect(matoway.getByRole('button', { name: /相近拼寫/ })).toHaveCount(1)
  await expect(spellingSet(page, 'maturai').getByRole('listitem')).toHaveCount(2)
  await expect(page.locator('[data-spelling-set]').filter({ hasText: 'mātūra͡i' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'mātūra͡i', exact: true })).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await page.screenshot({ path: `test-results/screenshots/${info.project.name}-spelling-maturay.png`, fullPage: false })
})
