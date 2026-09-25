/**
 * 演算法實驗室的構詞（BCDP）分頁：預設例子、逐步播放、找不到的例子，以及從搜尋結果連進來。
 */

import { expect, test } from '@playwright/test'

async function expectNoHorizontalOverflow(/** @type {import('@playwright/test').Page} */ page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))
  expect(scrollWidth, '頁面出現水平捲軸（跑版）').toBeLessThanOrEqual(innerWidth + 1)
}

test('預設例子：minubaket 的詞根 baket，四個面板與分析', async ({ page }, info) => {
  await page.goto('./#/lab?tab=bcdp')
  await expect(page.getByRole('tab', { name: '構詞 BCDP' })).toHaveAttribute('data-state', 'active')
  await expect(page.getByLabel('查詢（衍生詞）')).toHaveValue('minubaket')
  const analysis = page.getByRole('region', { name: '④ 分析' })
  await expect(analysis.getByText('minu-', { exact: true })).toBeVisible()
  await expect(analysis.getByText('≈ baket')).toBeVisible()
  await expect(page.getByRole('region', { name: '① 詞綴圖表' })).toBeVisible()
  // 還原變體以刪除線標出拿掉的中綴
  const variants = page.getByRole('region', { name: '② 還原變體與詞圖走訪' })
  await expect(variants.locator('del', { hasText: 'in' }).first()).toBeVisible()
  await variants.screenshot({ path: `test-results/screenshots/${info.project.name}-lab-bcdp-variants.png` })
  await expect(page.getByRole('region', { name: '③ 計價：baket' })).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await page.screenshot({ path: `test-results/screenshots/${info.project.name}-lab-bcdp-light.png`, fullPage: true })
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.screenshot({ path: `test-results/screenshots/${info.project.name}-lab-bcdp-dark.png`, fullPage: true })
})

test('逐步播放：從頭開始，第一步是詞綴圖表；鍵盤前進；網址記下步驟', async ({ page }) => {
  await page.goto('./#/lab?tab=bcdp')
  await expect(page.getByRole('region', { name: '④ 分析' }).getByText('≈ baket')).toBeVisible()
  await page.getByRole('button', { name: '回到開頭' }).click()
  await expect(page.getByText(/按「播放」/)).toBeVisible()
  await page.getByRole('button', { name: '下一步' }).click()
  await expect(page.getByText(/^前綴圖表 P\[\d+\] ＝/)).toBeVisible()
  await page.getByRole('heading', { level: 1 }).click()
  await page.keyboard.press('ArrowRight')
  await expect(page).toHaveURL(/step=1/)
  await page.keyboard.press('End')
  await expect(page.getByText(/「baket」的最佳分析/)).toBeVisible()
  await expectNoHorizontalOverflow(page)
})

test('找不到的例子：說明原因', async ({ page }) => {
  await page.goto('./#/lab?tab=bcdp')
  await page.getByRole('button', { name: 'maxapux ↛ apux' }).click()
  await expect(page.getByRole('region', { name: '④ 分析' }).getByText(/不是候選/)).toBeVisible()
})

test('從搜尋結果的構詞說明連到構詞分頁', async ({ page }) => {
  await page.goto('./#/?q=minubaket')
  await page.getByRole('tab', { name: /^詞條/ }).click()
  const row = page.locator('article').filter({ has: page.getByRole('link', { name: 'baket-', exact: true }) }).first()
  await row.getByRole('button', { name: /詞根相符/ }).click()
  await page.getByRole('dialog').getByRole('link', { name: /在演算法實驗室逐步觀察/ }).click()
  await expect(page).toHaveURL(/tab=bcdp/)
  await expect(page.getByLabel('查詢（衍生詞）')).toHaveValue('minubaket')
  await expect(page.getByLabel('詞根')).toHaveValue(/baket/)
})
