# CLAUDE.md

巴宰–噶哈巫語數位辭典的**公開網站 repo**：站台設定＋語言設定檔＋標準格式資料集，以 babizu 框架建置。
線上：https://babizu.github.io/pazeh-kaxabu/ （push 到 `main` 由 `.github/workflows/deploy.yml` 自動部署）。
三個 repo 的關係與日常流程見 `../pazeh-kaxabu-minubizu/WORKSPACE.md`。

使用者以繁體中文溝通；註解、文件、commit 訊息一律用繁體中文。

## 指令

```bash
npx babizu build && PLAYWRIGHT_CHANNEL=msedge npx playwright test   # 建置後跑端對端（151 個）
npx babizu check                                                     # 設定＋資料集檢查
```

- 端對端測試跑建置結果，**改了設定、資料或框架都要先重新 build**；先確認 4173／4174 埠上沒有別的 preview 伺服器。
- 本機開發時 `babizu` 依賴可能指向 `file:../babizu`（`npm run framework:local` 在 minubizu 切換）；push 前必須是 GitHub 標籤。

## 慣例

- **`data/` 由私有 repo 匯出，不要手動改**：資料問題在 `../pazeh-kaxabu-minubizu` 的轉接器修，再 `npm run export`。
- **這是公開 repo**：不得出現未取得公開授權的資料（詞形、釋義、來源檔）；受限來源的轉接器在私有 repo 且 `enabled: false`，清單見私有 repo 的 `docs/data-decisions.md`。
- 方言代碼 `pazeh`、`kaxabu`、`auran`（愛蘭 ⊂ 巴宰）只在 `babizu.config.js` 定義；匯出與建置都以它驗證。
- 族語介面 `pzh` 尚待翻譯；`npx babizu locales` 列出缺的字串。顯示名稱「族語」是暫定的。
