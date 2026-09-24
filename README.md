# 巴宰–噶哈巫語數位辭典

整合多部辭典、詞表與錄音語料的巴宰語（Pazeh）與噶哈巫語（Kaxabu）數位辭典。

**網站：https://babizu.github.io/pazeh-kaxabu/**

- **跨方言模糊搜尋**：依巴宰、噶哈巫方言的語音對應計算距離，例如 `bintul ≈ bintun`、`raulu ≈ laulu`、`semer ≈ semee`；
  也支援前綴與包含比對，以及中文、英文釋義搜尋。
- **溯源**：每筆資料都標出處（辭典頁碼、詞表列號、影片時間碼）；《巴宰語詞典》可以直接對照原書掃描頁。
- **語音**：有錄音的句子可以直接播放，並附逐詞對譯。
- **介面語系**：中文、English、族語（族語介面翻譯中，未翻譯的部分以中文顯示）。

網站以 [Babizu 辭典框架](https://github.com/Babizu/babizu)建置。這個 repo 只有**巴宰–噶哈巫語專屬的設定**與**轉換好的標準格式資料**，
不含原始語料；原始語料與轉接器在私有 repo `pazeh-kaxabu-minubizu`。

## 內容

```
├── babizu.config.js            站台設定：名稱、介面語系、方言（巴宰、噶哈巫、巴宰（愛蘭））、搜尋範例…
├── language/pazeh-kaxabu.json  語言設定檔：正規化、體例符號、57 條方言語音對應規則
├── data/                       標準格式資料集（由 minubizu 匯出，請勿手動修改）
│   ├── dataset.json、sources.json
│   ├── records/<來源>/<分片>.json
│   ├── media/                  錄音
│   └── scans/                  《巴宰語詞典》原書掃描頁（WebP）
├── content/                    「關於」頁（中文、英文）
├── locales/                    介面字串覆寫（zh-TW、en）與族語介面（pzh）
├── public/icon.jpg             站徽
├── e2e/                        端對端測試（320px／手機／桌面、語系切換、子路徑部署）
└── .github/workflows/deploy.yml  push 到 main 自動部署到 GitHub Pages
```

## 建置

需要 Node.js 20.19 以上。

```bash
npm ci
npx babizu dev        # 開發伺服器
npx babizu build      # 建置到 dist/
npx babizu preview    # 預覽 http://localhost:4173/
npx babizu check      # 檢查設定、語言設定檔與資料集
npx babizu locales    # 列出族語介面還缺哪些字串
```

端對端測試（先 build）：

```bash
npx playwright install chromium   # 或 PLAYWRIGHT_CHANNEL=msedge 使用本機的 Edge
npx playwright test
```

## 常見修改

| 想改的東西 | 改哪裡 |
|---|---|
| 網站名稱、搜尋範例、方言名稱與顏色 | `babizu.config.js` |
| 模糊搜尋的方言對應規則 | `language/pazeh-kaxabu.json`（權重與語意見框架的 docs/language-profile.md） |
| 「關於」頁 | `content/about.zh-TW.md`、`content/about.en.md` |
| 族語介面翻譯 | `locales/pzh.json`（格式同框架的 `locales/zh-TW.json`，只要寫已翻譯的鍵） |
| 辭典資料 | **不要直接改 `data/`**：在 minubizu 改轉接器或原始資料，再 `npm run export` |
| 框架版本 | `package.json` 的 `babizu` 依賴（`github:Babizu/babizu#vX.Y.Z`） |

## 資料來源與授權

資料的版權與學術貢獻屬於各原始來源；各來源的說明、處理方式與已知限制見網站的「資料來源」頁。
引用時請以原始來源為準（每筆詞條頁都有出處與「複製引用」）。
