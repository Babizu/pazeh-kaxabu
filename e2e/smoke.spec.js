/**
 * 端對端冒煙測試：主要使用流程在手機與桌面尺寸下都能完成，且頁面不會水平溢出（跑版）。
 * 每個測試都會截圖到 test-results/screenshots/，方便人工檢視版面。
 */

import { expect, test } from '@playwright/test'

/**
 * 頁面內容寬度不得超過視窗寬度（允許 1px 誤差）。
 * @param {import('@playwright/test').Page} page
 */
async function expectNoHorizontalOverflow(page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))
  expect(scrollWidth, '頁面出現水平捲軸（跑版）').toBeLessThanOrEqual(innerWidth + 1)
}

/** 側欄在 lg（1024px）以上才直接顯示，以下則收在「搜尋條件」抽屜裡 */
const hasFilterDrawer = (page) => (page.viewportSize()?.width ?? 0) < 1024

/** 需要用到篩選條件時，窄螢幕先把抽屜打開 */
async function openFilters(page) {
  if (hasFilterDrawer(page)) await page.getByRole('button', { name: '搜尋條件' }).click()
}

/** 讀取建置出來的來源清單（測試要跟實際資料對帳，不寫死數字） */
async function fetchSources(page) {
  if (!page.url().startsWith('http')) await page.goto('./')
  return page.evaluate(() => fetch('./data/sources.json').then((r) => r.json()))
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').TestInfo} info
 * @param {string} name
 */
async function snap(page, info, name) {
  await page.screenshot({ path: `test-results/screenshots/${info.project.name}-${name}.png`, fullPage: true })
}

test('首頁就是搜尋頁：說明、範例與載入狀態', async ({ page }, info) => {
  await page.goto('./')
  await expect(page.getByRole('heading', { level: 1, name: '巴宰–噶哈巫語數位辭典' })).toBeVisible()
  await expect(page.getByText(/已載入 [\d,]+ 筆記錄/)).toBeVisible()
  // 按下第一個範例就直接搜尋（範例內容可能調整，所以不寫死查詢字串）
  const example = page.getByRole('list').getByRole('button').first()
  const word = (await example.innerText()).split('\n')[0].trim()
  await example.click()
  await expect(page).toHaveURL(new RegExp(`q=${encodeURIComponent(word)}`))
  await expect(page.locator('article').first()).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await snap(page, info, 'home')
})

test('舊的 /search 網址連同查詢字串轉向首頁', async ({ page }) => {
  await page.goto('./#/search?q=bintul')
  await expect(page).toHaveURL(/#\/\?q=bintul/)
  await expect(page.locator('article').filter({ hasText: 'bintun' }).first()).toBeVisible()
})

test('跨方言模糊搜尋：bintul 找到 bintun，並說明詞尾 l→n', async ({ page }, info) => {
  await page.goto('./#/?q=bintul')
  const results = page.locator('article')
  await expect(results.filter({ hasText: 'bintun' }).first()).toBeVisible()
  await page.getByRole('tab', { name: /^詞條/ }).click()
  const explanation = page.getByRole('button', { name: /相近拼寫，距離 0\.1/ }).first()
  await expect(explanation).toContainText('l→n')
  await expect(explanation).toContainText('詞尾')
  await expectNoHorizontalOverflow(page)
  await snap(page, info, 'search-bintul')

  await explanation.click()
  await expect(page.getByText('為什麼算相近？')).toBeVisible()
  await snap(page, info, 'search-bintul-explain')
})

test('語料：tamako 出現在例句中，錄音可以播放', async ({ page }, info) => {
  await page.goto('./#/?q=tamako')
  await page.getByRole('tab', { name: /例句/ }).click()
  const sentence = page.locator('article').filter({ hasText: 'maakux haka haaput' }).first()
  await expect(sentence).toBeVisible()
  await expect(sentence.locator('mark')).toHaveText('tamako')

  const entry = page.getByRole('tab', { name: '全部' })
  await entry.click()
  const playButton = page.getByRole('button', { name: /播放：tamako/ }).first()
  const audioResponse = page.waitForResponse((res) => res.url().includes('/media/') && res.url().endsWith('.mp3'))
  await playButton.click()
  expect((await audioResponse).status()).toBeLessThan(400)
  await expectNoHorizontalOverflow(page)
  await snap(page, info, 'search-tamako')
})

test('中文釋義搜尋：豬', async ({ page }, info) => {
  await page.goto('./#/?q=豬')
  await expect(page.locator('article').filter({ hasText: 'baruzak' }).first()).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await snap(page, info, 'search-zh')
})

test('詞條頁：出處卡與原書掃描頁', async ({ page }, info) => {
  await page.goto('./#/r/pazih-dict/p085-01')
  await expect(page.getByRole('heading', { level: 1, name: 'baruzak' })).toBeVisible()
  // 分頁標題用詞形，分享與書籤才認得出是哪一筆
  await expect(page).toHaveTitle(/^baruzak｜/)
  await expect(page.getByText('《巴宰語詞典》p.85，baruzak 條').first()).toBeVisible()
  await expect(page.getByRole('heading', { name: '其他來源的相近詞形' })).toBeVisible()
  await expect(page.locator('li').filter({ hasText: 'bauzak' }).first()).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await snap(page, info, 'record')

  await page.getByRole('button', { name: '查看原書掃描頁' }).locator('visible=true').first().click()
  const image = page.getByRole('dialog').getByRole('img')
  await expect(image).toBeVisible()
  await expect.poll(() => image.evaluate((img) => /** @type {HTMLImageElement} */ (img).naturalWidth)).toBeGreaterThan(0)
  await snap(page, info, 'record-scan')
})

test('語料詞條頁：逐詞對譯與時間碼', async ({ page }, info) => {
  await page.goto('./#/r/pan-dexing-corpus/20200103-IMG_2659-03')
  await expect(page.getByRole('table', { name: '逐詞對譯' })).toContainText('狀態-久')
  await expect(page.getByText('01:28.67–01:31.69').first()).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await snap(page, info, 'record-corpus')
})

test('來源瀏覽：翻頁', async ({ page }, info) => {
  await page.goto('./#/sources/pazih-dict/p085')
  await expect(page.getByText('baruzak').first()).toBeVisible()
  await page.getByRole('button', { name: '下一頁' }).click()
  await expect(page).toHaveURL(/p086/)
  await expectNoHorizontalOverflow(page)
  await snap(page, info, 'browse')
})

test('演算法實驗室：semer／semee 距離 0.1（不在主選單，從網址或說明連入）', async ({ page }, info) => {
  await page.goto('./#/')
  await expect(page.getByRole('navigation', { name: '主選單' }).first().getByText('實驗室')).toHaveCount(0)
  await page.goto('./#/lab?a=semer&b=semee')
  await expect(page.getByRole('gridcell', { name: 'D(5, 5) = 0.1' })).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await snap(page, info, 'lab')

  await page.getByRole('tab', { name: '詞圖搜尋' }).click()
  await expect(page.getByLabel('詞圖走訪結果')).toContainText('剪枝')
  await expectNoHorizontalOverflow(page)
  await snap(page, info, 'lab-dawg')
})

test('前綴搜尋：pihi 找到 pihilut', async ({ page }, info) => {
  await page.goto('./#/?q=pihi')
  const hit = page.locator('article').filter({ hasText: 'pihilut' }).first()
  await expect(hit).toBeVisible()
  await expect(hit.getByText('開頭相符')).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await snap(page, info, 'search-prefix')
})

test('單一字母搜尋：k 列出含 k 的詞與句子', async ({ page }, info) => {
  await page.goto('./#/?q=k')
  await expect(page.getByText(/「k」共 [\d,]+ 筆/)).toBeVisible()
  await page.getByRole('tab', { name: /例句/ }).click()
  const sentences = page.locator('article')
  await expect(sentences.first()).toBeVisible()
  expect(await sentences.count()).toBeGreaterThan(5)
  await expectNoHorizontalOverflow(page)
  await snap(page, info, 'search-single-letter')
})

test('搜尋範圍：只搜釋義時不出現族語詞條', async ({ page }, info) => {
  await page.goto('./#/?q=star&f=gloss')
  await expect(page.getByRole('tab', { name: /釋義/ })).toBeVisible()
  await expect(page.getByRole('tab', { name: /^詞條/ })).toHaveCount(0)
  await expectNoHorizontalOverflow(page)
  await snap(page, info, 'search-fields')
})

test('資料來源：點統計數字看詞彙清單', async ({ page }, info) => {
  await page.goto('./#/sources')
  await page.getByRole('link', { name: /詞\s*5,363/ }).first().click()
  await expect(page).toHaveURL(/source.*list.*unit=word|list\?unit=word/)
  await expect(page.getByText(/共 5,363 筆（詞）/)).toBeVisible()
  await expect(page.locator('article').first()).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await snap(page, info, 'source-list')
})

test('林鴻瑞參考語法：例句、翻譯與錄音', async ({ page }, info) => {
  await page.goto('./#/r/lin-grammar/ch5-5.1')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('atun ohoni medeken')
  // 翻譯同時出現在釋義區與下方的同章脈絡清單，所以要指定釋義區
  await expect(page.getByRole('region', { name: '釋義' }).getByText('Atun 現在在撿我的拐杖。')).toBeVisible()
  await expect(page.getByText('林鴻瑞《噶哈巫語參考語法》CH5構詞', { exact: false }).first()).toBeVisible()

  const audioResponse = page.waitForResponse((res) => res.url().includes('/media/lin-grammar/') && res.url().endsWith('.mp3'))
  await page.getByRole('button', { name: /播放/ }).first().click()
  expect((await audioResponse).status()).toBeLessThan(400)
  await expectNoHorizontalOverflow(page)
  await snap(page, info, 'record-grammar')
})

test('校對狀態：只有有校對流程的來源才顯示', async ({ page }) => {
  await page.goto('./#/r/pazih-dict/p085-01')
  await expect(page.getByText('初步校對').first()).toBeVisible()
  // 分類辭典沒有校對流程，出處卡就不該有這一列
  await page.goto('./#/r/kaxabu-classified/01A-001')
  await expect(page.getByText('校對狀態')).toHaveCount(0)
})

test('資料來源與關於頁', async ({ page }, info) => {
  await page.goto('./#/sources')
  await expect(page.getByText('巴宰語詞典 Pazih Dictionary')).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await snap(page, info, 'sources')
  await page.goto('./#/about')
  await expect(page.getByRole('heading', { name: '方言標記' })).toBeVisible()
  await expectNoHorizontalOverflow(page)
})

test('窄螢幕：搜尋條件用文字按鈕開啟側欄', async ({ page }, info) => {
  await page.goto('./#/?q=bintul')
  const trigger = page.getByRole('button', { name: '搜尋條件' })
  if (!hasFilterDrawer(page)) {
    // 桌面版側欄直接顯示，不需要這個按鈕
    await expect(trigger).toBeHidden()
    return
  }
  await expect(trigger).toBeVisible()
  await trigger.click()
  await expect(page.getByRole('dialog').getByText('模糊程度', { exact: true })).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await snap(page, info, 'search-filters')
})

test('方言：巴宰包含愛蘭，且顯示為「巴宰（愛蘭）」', async ({ page }) => {
  // adadumut 原書標 [A]（愛蘭），限定方言為「巴宰」時仍應出現
  await page.goto('./#/r/pazih-dict/p060-11')
  await expect(page.getByText('巴宰（愛蘭）').first()).toBeVisible()

  // 限定「巴宰」時，這筆標為愛蘭的《巴宰語詞典》詞條仍要出現
  await page.goto('./#/?q=adadumut&dia=pazeh&f=native')
  await expect(page.locator('article').filter({ hasText: '巴宰語詞典' }).first()).toBeVisible()
  // 限定「噶哈巫」時就不該出現（同名的另一筆屬於噶哈巫語分類辭典，不受影響）
  await page.goto('./#/?q=adadumut&dia=kaxabu&f=native')
  await expect(page.locator('article').filter({ hasText: '巴宰語詞典' })).toHaveCount(0)
  await expect(page.locator('article').filter({ hasText: '噶哈巫語分類辭典' }).first()).toBeVisible()
})

test('資料來源：全部來源合計與實際資料相符', async ({ page }) => {
  await page.goto('./#/sources')
  const sources = await fetchSources(page)
  const records = sources.reduce((n, s) => n + (s.stats?.records ?? 0), 0)
  const totals = page.getByRole('region', { name: new RegExp(`全部 ${sources.length} 個來源合計`) })
  await expect(totals).toBeVisible()
  await expect(totals.getByText(records.toLocaleString('en-US'))).toBeVisible()
})

test('搜尋條件：方言順序、響應式欄數與模糊程度拉桿', async ({ page }, info) => {
  await page.goto('./#/?q=bintul')
  await openFilters(page)

  // 巴宰（愛蘭）緊接在巴宰後面，不在噶哈巫下面
  const dialects = page.getByRole('group').filter({ has: page.getByText('方言', { exact: true }) })
  const labels = await dialects.getByRole('checkbox').evaluateAll((els) =>
    els.map((el) => el.closest('label')?.textContent?.trim() ?? ''),
  )
  expect(labels).toEqual(['巴宰', '巴宰（愛蘭）', '噶哈巫', '未標方言'])

  // 同一列可以放得下多個選項（不是一個項目就換一行）
  const tops = await dialects.getByRole('checkbox').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top))
  expect(new Set(tops.map(Math.round)).size).toBeLessThan(tops.length)

  // 模糊程度是拉桿，拉到「寬鬆」會寫進網址
  const slider = page.getByRole('slider', { name: '模糊程度' })
  await expect(slider).toBeVisible()
  await slider.press('ArrowRight')
  await expect(page).toHaveURL(/fz=loose/)
  await expectNoHorizontalOverflow(page)
  await snap(page, info, 'filters')
})

test('關於頁：特色介紹', async ({ page }, info) => {
  await page.goto('./#/about')
  await expect(page.getByRole('heading', { name: '跨方言模糊搜尋', level: 3 })).toBeVisible()
  await expect(page.getByRole('heading', { name: '每筆資料都查得到出處', level: 3 })).toBeVisible()
  // 數字取自實際資料，不是寫死的
  await expect(page.getByText(/\d+ 個來源 · [\d,]+ 筆記錄/)).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await snap(page, info, 'about-features')
})
