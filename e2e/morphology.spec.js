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
  await expect(dialog.getByText('拆解說明')).toBeVisible()
  await expect(dialog.getByText('mudalum → dalum')).toBeVisible()
  await expect(dialog.getByText(/演算法自動去除詞綴/)).toBeVisible()
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

test('查衍生詞 minubaket：找到詞根 baket，標為自動拆解', async ({ page }) => {
  await page.goto('./#/?q=minubaket')
  const row = page.locator('article').filter({ has: page.getByRole('link', { name: 'baket', exact: true }) }).first()
  await expect(row).toBeVisible()
  await expect(row.getByRole('button', { name: /自動拆解：.*baket/ })).toBeVisible()
  await expectNoHorizontalOverflow(page)
})

test('精確模式不做構詞比對', async ({ page }) => {
  await page.goto('./#/?q=minubaket&fz=exact')
  await expect(page.locator('article').first()).toBeVisible()
  await expect(page.getByRole('button', { name: /自動拆解/ })).toHaveCount(0)
})

test('英文介面的構詞說明', async ({ page }) => {
  await page.goto('./#/?q=dalum')
  await page.getByRole('button', { name: /^設定/ }).click()
  await page.getByRole('dialog').locator('[lang="en"]').click()
  await page.keyboard.press('Escape')
  await page.getByRole('tab', { name: /^Entries/ }).click()
  await expect(page.getByRole('button', { name: /Derived form: mu- \+ dalum/ }).first()).toBeVisible()
})

test('查衍生詞 kinawas：詞根 kawas- 的詞條排第一，辭典列在底下的 mukawas、kinawas 縮排接在後面', async ({ page }) => {
  await page.goto('./#/?q=kinawas')
  await page.getByRole('tab', { name: /^詞條/ }).click()
  const family = page.locator('[data-entry-group]:visible').first()
  await expect(family.getByRole('link', { name: 'kawas-', exact: true })).toBeVisible()
  await expect(family.getByRole('button', { name: /自動拆解：.*kawas/ }).first()).toBeVisible()
  // kinawas 在辭典中列在 mukawas 底下
  const mukawas = family.getByRole('listitem').filter({ has: page.getByRole('link', { name: 'mukawas', exact: true }) })
  await expect(mukawas.getByRole('link', { name: 'kinawas', exact: true })).toBeVisible()
  await expectNoHorizontalOverflow(page)
})

test('查 pakita：kita- 條排第一，底下是完全相同的 pakita（併入另立條目）與 pinakita；其他辭典的詞另成一組', async ({ page }) => {
  await page.goto('./#/?q=pakita')
  await page.getByRole('tab', { name: /^詞條/ }).click()
  const groups = page.locator('[data-entry-group]:visible')
  const family = groups.first()
  await expect(family.getByRole('link', { name: 'kita-', exact: true })).toBeVisible()
  const pakita = family.getByRole('listitem').filter({ has: page.getByRole('link', { name: 'pakita', exact: true }) }).first()
  await expect(pakita.getByText('完全相符').first()).toBeVisible()
  await expect(pakita.getByRole('link', { name: '另立條目' }).first()).toBeVisible()
  await expect(pakita.getByRole('link', { name: 'pinakita', exact: true })).toBeVisible()
  // 同一個家族的詞形不會另外出現在別組
  await expect(groups.getByRole('link', { name: 'pinakita', exact: true })).toHaveCount(1)
  await expect(groups.nth(1).getByRole('link', { name: 'paakita', exact: true })).toBeVisible()
  // 衍生詞很多時收起來
  await family.getByRole('button', { name: /再顯示 \d+ 個相關項目/ }).click()
  await expect(family.getByRole('link', { name: 'mikita', exact: true })).toBeVisible()
  await expectNoHorizontalOverflow(page)
})

test('查 parazem：詞根 razem 以自動拆解列出（不被較差的模糊命中蓋掉），parazem 在它底下', async ({ page }) => {
  await page.goto('./#/?q=parazem')
  await page.getByRole('tab', { name: /^詞條/ }).click()
  const family = page.locator('[data-entry-group]:visible').first()
  await expect(family.getByRole('link', { name: 'razem', exact: true })).toBeVisible()
  await expect(family.getByRole('button', { name: /自動拆解：pa- \+ razem/ }).first()).toBeVisible()
  await expect(family.getByRole('link', { name: 'parazem', exact: true })).toBeVisible()
})

test('去詞綴支援音變：minudox 找到 daux-，說明 m<in>u-（主事焦點・完成）與詞幹 dox → daux', async ({ page }, info) => {
  await page.goto('./#/?q=minudox')
  await page.getByRole('tab', { name: /^詞條/ }).click()
  const row = page.locator('article').filter({ has: page.getByRole('link', { name: 'daux-', exact: true }) }).first()
  await expect(row).toBeVisible()
  const button = row.getByRole('button', { name: /自動拆解：m<in>u- \+ daux/ })
  await button.click()
  const dialog = page.getByRole('dialog')
  // 音變以整個詞一起比對，每一項標出落在哪個詞素
  await expect(dialog.getByText('音變（整個詞一起比對）')).toBeVisible()
  await expect(dialog.getByText('o→au')).toBeVisible()
  await expect(dialog.getByText(/· 詞幹$/)).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await page.screenshot({ path: `test-results/screenshots/${info.project.name}-morphology-dialect.png`, fullPage: true })
})

// 構詞規格依文法來源校訂後，mine-（m<in>e-）本身就是前綴，改用噶哈巫語的元音 o：mo- 對應 mu-
test('詞綴本身的音變：modaux 的 mo- 對應 mu-', async ({ page }) => {
  await page.goto('./#/?q=modaux')
  await page.getByRole('tab', { name: /^詞條/ }).click()
  const row = page.locator('article').filter({ has: page.getByRole('link', { name: 'daux-', exact: true }) }).first()
  await row.getByRole('button', { name: /自動拆解/ }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText('o→u')).toBeVisible()
  await expect(dialog.getByText(/· 前綴$/)).toBeVisible()
})

test('構詞文法：maudanay 拆成 m- <a> … -ay（主事焦點・非實現），說明列出每個詞素', async ({ page }) => {
  await page.goto('./#/?q=maudanay')
  await page.getByRole('tab', { name: /^詞條/ }).click()
  const button = page.getByRole('button', { name: /自動拆解：m<a>- \+ udan \+ -ay/ }).first()
  await button.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText('m<a>-…-ay', { exact: true })).toBeVisible()
  await expect(dialog.getByText(/組合規則 · 主事焦點・非實現/)).toBeVisible()
  await expect(dialog.getByText(/中綴 · 非完成貌/)).toBeVisible()
})

test('構詞文法：minubaket 是 m<in>u-（mu- 之後插入 <in>），mubinaket 是 mu- ＋ <in>（詞根上的中綴）', async ({ page }) => {
  await page.goto('./#/?q=minubaket')
  await page.getByRole('tab', { name: /^詞條/ }).click()
  await expect(page.getByRole('button', { name: /自動拆解：m<in>u- \+ baket/ }).first()).toBeVisible()
  await page.goto('./#/?q=mubinaket')
  await page.getByRole('tab', { name: /^詞條/ }).click()
  await expect(page.getByRole('button', { name: /自動拆解：mu- \+ baket \+ <in>/ }).first()).toBeVisible()
})
