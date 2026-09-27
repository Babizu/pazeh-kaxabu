/**
 * 巴宰–噶哈巫語數位辭典的站台設定（欄位說明見 babizu 框架的 docs/site-config.md）。
 *
 * 資料集 data/ 由私有的 pazeh-kaxabu-minubizu 匯出，不要手動修改；
 * 語言設定檔 language/pazeh-kaxabu.json 決定搜尋時的正規化與方言語音對應。
 */

import { defineSite } from 'babizu'

export default defineSite({
  id: 'pazeh-kaxabu',
  // pzh：巴宰語的 ISO 639-3 代碼。族語介面字串尚待翻譯，缺的字串自動以中文顯示（`npx babizu locales` 列出待譯清單）
  locales: ['zh-TW', 'en', 'pzh'],
  defaultLocale: 'zh-TW',
  localeNames: { pzh: '族語' },
  title: { 'zh-TW': '巴宰–噶哈巫語數位辭典', en: 'Pazeh–Kaxabu Digital Dictionary' },
  shortTitle: { 'zh-TW': '巴宰–噶哈巫辭典', en: 'Pazeh–Kaxabu' },
  description: {
    'zh-TW': '巴宰–噶哈巫語數位辭典：整合多部辭典、詞表與錄音語料，支援跨方言模糊搜尋與出處溯源。',
    en: 'A Pazeh–Kaxabu digital dictionary combining several dictionaries, word lists and recorded texts, with cross-dialect fuzzy search and full source citations.',
  },
  language: 'language/pazeh-kaxabu.json',
  data: 'data',
  icon: 'icon.jpg',
  themeColor: '#2f3f7a',
  varieties: [
    {
      code: 'pazeh',
      label: { 'zh-TW': '巴宰', en: 'Pazeh' },
      colors: {
        light: { fg: 'oklch(0.47 0.1 52)', bg: 'oklch(0.955 0.03 62)' },
        dark: { fg: 'oklch(0.82 0.09 62)', bg: 'oklch(0.31 0.04 55)' },
      },
    },
    {
      code: 'kaxabu',
      label: { 'zh-TW': '噶哈巫', en: 'Kaxabu' },
      colors: {
        light: { fg: 'oklch(0.44 0.08 175)', bg: 'oklch(0.95 0.028 175)' },
        dark: { fg: 'oklch(0.82 0.08 175)', bg: 'oklch(0.3 0.04 175)' },
      },
    },
    // 愛蘭是巴宰語的地方變體：篩選「巴宰」時一併出現（只勾愛蘭則只看愛蘭）。
    {
      code: 'auran',
      parent: 'pazeh',
      label: { 'zh-TW': '巴宰（愛蘭）', en: 'Pazeh (Auran)' },
      colors: {
        light: { fg: 'oklch(0.5 0.045 52)', bg: 'oklch(0.955 0.014 62)' },
        dark: { fg: 'oklch(0.8 0.035 62)', bg: 'oklch(0.3 0.016 55)' },
      },
    },
  ],
  writingSystems: {
    'pan-yongli': { 'zh-TW': '潘永歷標記法', en: 'Pan Yong-li orthography' },
  },
  specialChars: ['é'],
  examples: [
    { q: 'maturay', note: { 'zh-TW': '以族語搜尋', en: 'search in Pazeh or Kaxabu' } },
    { q: '火', note: { 'zh-TW': '以中文釋義搜尋', en: 'search Chinese meanings' } },
    { q: 'fire', note: { 'zh-TW': '以英文釋義搜尋', en: 'search English meanings' } },
  ],
  about: { 'zh-TW': 'content/about.zh-TW.md', en: 'content/about.en.md' },
  footer: {
    'zh-TW': '巴宰–噶哈巫語數位辭典 · 資料版權屬各原始來源，引用時請註明出處（每筆詞條皆附「出處」資訊）。',
    en: 'Pazeh–Kaxabu Digital Dictionary · All content belongs to the original sources; please cite them (every entry lists its source).',
  },
  lab: {
    pairs: [
      ['semer', 'semee'],
      ['bintul', 'bintun'],
      ['raulu', 'laulu'],
      ['rapay', 'apay'],
      ['aruk', 'awk'],
      ['alaw', 'anaw'],
      ['baruzakbinayu', 'baruzak binayu'],
    ],
    words: 'bintun bintul atun alaw anaw laulu raulu rapay apay semer semee seme tamako tamaku baruzak bauzak say tshay xay punu',
    // 構詞（BCDP）分頁的例子：[查詢, 詞根]，各示範一種構詞（前綴、方言寫法的前綴、重疊、中綴、詞幹交替）
    morph: {
      examples: [
        ['minubaket', 'baket'],
        ['modaux', 'daux'],
        ['kiikita', 'kita'],
        ['binaket', 'baket'],
        ['bitudun', 'bitut'],
        ['maakudungkudung', 'kudung'],
        // 音變跨越詞素交界：交界上的喉塞音（tau- ＋ alaw ＋ -an）、元音合併（maxa- ＋ apux 的 a｜a）
        ["tau'alawan", 'alaw'],
        ['maxapux', 'apux'],
        // 環綴 ta-…-aw（勸說）算一個步驟，加上 a｜a 的元音合併
        ['takitaw', 'kita'],
        // 構詞文法的組合規則 m<a>-…-ay（主事焦點・非實現）：usa｜ay 的 a｜a 合併
        ['mausay', 'usa'],
      ],
      // 詞根比最短長度（minStem 3）還短：a- ＋ di 不做構詞分析
      failures: [['aidi', 'di']],
    },
  },
})
