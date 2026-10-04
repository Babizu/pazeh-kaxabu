/**
 * 句型搜尋（babizu/pattern；docs/pattern-query.md）在巴宰–噶哈巫語的資料上：
 * 維護者的兩個例子、構詞樣式（同位詞素組、中綴寫在哪裡都一樣、詞綴從最外層算起、次佳的拆法、改寫的提示）、
 * 記錄的分區、詞族、對照與頻率。
 */

import { expect, test } from '@playwright/test'

/**
 * 句型搜尋，等結果出來。每次重新載入頁面：只改網址的 # 部分不會重新載入，
 * 讀到的可能還是上一個查詢的結果。
 * @param {import('@playwright/test').Page} page @param {string} q @param {string} [extra]
 */
async function search(page, q, extra = '') {
  await page.goto('about:blank')
  await page.goto(`./#/?q=${encodeURIComponent(q)}${extra}`)
  await expect(page.getByText('以句型搜尋')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText(/^共 [\d,]+ 筆記錄|^沒有符合這個句型的記錄/)).toBeVisible()
}
/** 結果摘要中的記錄數 @param {import('@playwright/test').Page} page */
async function total(page) {
  const text = await page.getByText(/^共 [\d,]+ 筆記錄/).innerText()
  return Number(/** @type {RegExpMatchArray} */ (text.match(/共 ([\d,]+) 筆/))[1].replace(/,/g, ''))
}

test('pa-… ki _：找到 paputiuk ki hapuy，paputiuk 標「自動拆解」', async ({ page }) => {
  await search(page, 'pa-… ki _')
  const row = page.locator('article').filter({ hasText: 'paputiuk ki hapuy' })
  await expect(row).toBeVisible()
  await expect(row.locator('mark')).toHaveText(['paputiuk', 'ki', 'hapuy'])
  await expect(row.getByRole('button', { name: /^自動拆解/ })).toBeVisible()
})

test('yaku ka _* isiw：中間隔任意幾個詞', async ({ page }) => {
  await search(page, 'yaku ka _* isiw')
  await expect(page.locator('article').filter({ hasText: 'yaku ka maha isiw usa humak' })).toBeVisible()
})

test('中綴寫在哪裡都一樣、同位詞素組等價：m<in>u-… ＝ m-<in>…；mu-… ＝ mi-…', async ({ page }) => {
  await search(page, 'm<in>u-…')
  const a = await total(page)
  await search(page, 'm-<in>…')
  expect(await total(page)).toBe(a)
  await search(page, 'mu-…')
  const b = await total(page)
  await search(page, 'mi-…')
  expect(await total(page)).toBe(b)
  expect(a).toBeGreaterThan(0)
})

test('詞綴從最外層算起：mara mu-… a 找不到 imini（i-mini、i-m-ini）；…-mu-… 找到，標「自動拆解 · 次佳」', async ({ page }) => {
  await search(page, 'mara mu-… a')
  await expect(page.locator('article').filter({ hasText: 'mara imini a mamais' })).toHaveCount(0)
  await search(page, 'mara …-mu-… a')
  const row = page.locator('article').filter({ hasText: 'mara imini a mamais' })
  await expect(row).toBeVisible()
  await expect(row.getByRole('button', { name: /^自動拆解 · 次佳/ })).toBeVisible()
})

test('mu-… 提示另有詞形的 mu- 在內層；點「改查」改用 …-mu-…，記錄變多', async ({ page }) => {
  await search(page, 'mu-…')
  const before = await total(page)
  await page.getByRole('link', { name: /改查/ }).click()
  await expect(page).toHaveURL(new RegExp(`q=${encodeURIComponent('…-mu-…')}`))
  await expect.poll(() => total(page)).toBeGreaterThan(before)
})

test('記錄依語言單位分區：pa-… 有詞條、片語與句子；分區標籤可以只看一區', async ({ page }) => {
  await search(page, 'pa-…')
  for (const name of [/^詞條/, /^片語/, /^句子/]) await expect(page.getByRole('heading', { name })).toBeVisible()
  await page.getByRole('button', { name: /^詞條/ }).click()
  await expect(page.getByRole('heading', { name: /^句子/ })).toHaveCount(0)
  // 詞條區：每一列的主要文字是一個詞（詞或詞綴的條目），不是句子
  const first = page.locator('article').first().getByRole('link').first()
  await expect(first).toBeVisible()
  expect((await first.innerText()).trim()).not.toContain(' ')
})

test('@kita：辭典標註的派生（確定派生）與自動派生都在', async ({ page }) => {
  await search(page, '@kita')
  const more = page.getByRole('button', { name: /顯示更多/ }).first()
  const rows = page.locator('article')
  for (const tag of [rows.getByText('確定派生').first(), rows.getByRole('button', { name: /^自動派生/ }).first()]) {
    while (!(await tag.isVisible()) && (await more.isVisible())) await more.click()
    await expect(tag).toBeVisible()
  }
})

test('ini _：頻率列出 ini 後面的詞，點一個詞形篩選句子；對照可以依右邊的詞排序', async ({ page }) => {
  await search(page, 'ini _', '&tab=frequency')
  await expect(page.getByText('都是')).toBeVisible()
  const first = page.locator('section ol button').first()
  const form = (await first.locator('span').first().innerText()).split('\n')[0]
  await first.click()
  await page.getByRole('tab', { name: /^記錄/ }).click()
  await expect(page.getByRole('button', { name: '取消篩選' })).toBeVisible()
  for (const row of await page.locator('article').all()) await expect(row).toContainText(form)
  await page.getByRole('tab', { name: /^對照/ }).click()
  await page.getByRole('button', { name: '右邊的詞' }).click()
  await expect(page).toHaveURL(/ks=right/)
})

test('不認得的詞綴：標出位置並列出最接近的', async ({ page }) => {
  await page.goto(`./#/?q=${encodeURIComponent('b-… ki')}`)
  const alert = page.getByRole('alert')
  await expect(alert).toBeVisible({ timeout: 30_000 })
  await expect(alert).toContainText('「b-」不是構詞規格中的詞綴')
  await expect(alert).toContainText('pa-')
})
