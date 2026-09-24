/**
 * 構詞分析（語言設定檔的 morphology）：查衍生詞找到詞根、查詞根找到衍生形，並顯示構詞說明。
 */

import { expect, test } from '@playwright/test'

async function expectNoHorizontalOverflow(/** @type {import('@playwright/test').Page} */ page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))
  expect(scrollWidth, '頁面出現水平捲軸（跑版）').toBeLessThanOrEqual(innerWidth + 1)
}

test('查詞根 dalum：找到構詞分析推定的衍生形 mudalum，並說明構詞', async ({ page }, info) => {
  await page.goto('./#/?q=dalum')
  // 構詞分析找到的衍生形排在詞根與已標註的衍生詞之後，要到「詞條」分頁才看得到全部
  await page.getByRole('tab', { name: /^詞條/ }).click()
  const button = page.getByRole('button', { name: /衍生形：mu- \+ dalum/ }).first()
  await expect(button).toBeVisible()
  await button.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText('構詞分析')).toBeVisible()
  await expect(dialog.getByText('「mudalum」是「dalum」加上詞綴。')).toBeVisible()
  await expect(dialog.getByText('前綴 · 主事焦點')).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await page.screenshot({ path: `test-results/screenshots/${info.project.name}-morphology-derived.png`, fullPage: true })
})

test('查詞根 baket：例句中的衍生形（pabaket）也列出，標為衍生形', async ({ page }) => {
  await page.goto('./#/?q=baket')
  await page.getByRole('tab', { name: /例句/ }).click()
  const sentence = page.locator('article').filter({ hasText: 'pabaket mu' }).first()
  await expect(sentence).toBeVisible()
  await expect(sentence.getByText('衍生形')).toBeVisible()
})

test('查衍生詞 minubaket：找到詞根 baket，標為詞根相符', async ({ page }) => {
  await page.goto('./#/?q=minubaket')
  const row = page.locator('article').filter({ has: page.getByRole('link', { name: 'baket', exact: true }) }).first()
  await expect(row).toBeVisible()
  await expect(row.getByRole('button', { name: /詞根相符：.*baket/ })).toBeVisible()
  await expectNoHorizontalOverflow(page)
})

test('精確模式不做構詞比對', async ({ page }) => {
  await page.goto('./#/?q=minubaket&fz=exact')
  await expect(page.locator('article').first()).toBeVisible()
  await expect(page.getByRole('button', { name: /詞根相符/ })).toHaveCount(0)
})

test('英文介面的構詞說明', async ({ page }) => {
  await page.goto('./#/?q=dalum')
  await page.getByRole('combobox', { name: /介面語言|Interface language/ }).selectOption('en')
  await page.getByRole('tab', { name: /^Entries/ }).click()
  await expect(page.getByRole('button', { name: /Derived form: mu- \+ dalum/ }).first()).toBeVisible()
})
