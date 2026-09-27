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
  await expect(analysis.getByText('baket', { exact: true })).toBeVisible()
  const levels = page.getByRole('region', { name: '① 詞綴各層與交界狀態' })
  await expect(levels.getByRole('rowheader', { name: '前綴合併（詞幹起點）' })).toBeVisible()
  // 通道：拿掉中綴 <in> 的還原變體
  const channels = page.getByRole('region', { name: '② 通道與詞圖走訪' })
  await expect(channels.getByText('拿掉中綴 <in>').first()).toBeVisible()
  await channels.screenshot({ path: `test-results/screenshots/${info.project.name}-lab-bcdp-channels.png` })
  await expect(page.getByRole('region', { name: '③ 整個詞的對齊：baket' })).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await page.screenshot({ path: `test-results/screenshots/${info.project.name}-lab-bcdp-light.png`, fullPage: true })
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.screenshot({ path: `test-results/screenshots/${info.project.name}-lab-bcdp-dark.png`, fullPage: true })
})

test('逐步播放：從頭開始，第一步是前綴第 1 層；鍵盤前進；網址記下步驟', async ({ page }) => {
  await page.goto('./#/lab?tab=bcdp')
  await expect(page.getByRole('region', { name: '④ 分析' }).getByText('baket', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '回到開頭' }).click()
  await expect(page.getByText(/按「播放」/)).toBeVisible()
  await page.getByRole('button', { name: '下一步' }).click()
  await expect(page.getByText(/^前綴第 1 層：/)).toBeVisible()
  await page.getByRole('heading', { level: 1 }).click()
  await page.keyboard.press('ArrowRight')
  await expect(page).toHaveURL(/step=1/)
  await page.keyboard.press('End')
  await expect(page.getByText(/「baket」的最佳分析/)).toBeVisible()
  await expectNoHorizontalOverflow(page)
})

test("音變跨越詞素交界：tau'alawan 找到 alaw，對齊中標出交界", async ({ page }) => {
  await page.goto('./#/lab?tab=bcdp')
  await page.getByRole('button', { name: "tau'alawan → alaw" }).click()
  const analysis = page.getByRole('region', { name: '④ 分析' })
  await expect(analysis.getByText('tau-', { exact: true })).toBeVisible()
  await expect(analysis.getByText('-an', { exact: true })).toBeVisible()
  const alignment = page.getByRole('region', { name: '③ 整個詞的對齊：alaw' })
  await expect(alignment.getByText('｜').first()).toBeVisible()
  await expectNoHorizontalOverflow(page)
})

test('找不到的例子：說明原因', async ({ page }) => {
  await page.goto('./#/lab?tab=bcdp')
  await page.getByRole('button', { name: 'aidi ↛ di' }).click()
  await expect(page.getByRole('region', { name: '④ 分析' }).getByText(/比詞根的最短長度還短/)).toBeVisible()
})

test('環綴：takitaw 找到 kita，分析是一個環綴 ta-…-aw', async ({ page }) => {
  await page.goto('./#/lab?tab=bcdp')
  await page.getByRole('button', { name: 'takitaw → kita' }).click()
  const analysis = page.getByRole('region', { name: '④ 分析' })
  await expect(analysis.getByText('ta-…-aw', { exact: true })).toBeVisible()
  await expect(analysis.getByText('kita', { exact: true })).toBeVisible()
  await expect(page.getByRole('region', { name: '② 通道與詞圖走訪' }).getByText(/^環綴 /).first()).toBeVisible()
})

test('從搜尋結果的構詞說明連到構詞分頁', async ({ page }) => {
  await page.goto('./#/?q=minubaket')
  await page.getByRole('tab', { name: /^詞條/ }).click()
  const row = page.locator('article').filter({ has: page.getByRole('link', { name: 'baket-', exact: true }) }).first()
  await row.getByRole('button', { name: /自動拆解/ }).click()
  await page.getByRole('dialog').getByRole('link', { name: /查看演算法運作方式/ }).click()
  await expect(page).toHaveURL(/tab=bcdp/)
  await expect(page.getByLabel('查詢（衍生詞）')).toHaveValue('minubaket')
  await expect(page.getByLabel('詞根')).toHaveValue(/baket/)
})
