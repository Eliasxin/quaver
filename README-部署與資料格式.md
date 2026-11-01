# 《八分音符｜Quaver》網站初版

**網站名稱**：八分音符（Quaver）
**40 題系列**：Quatre Mains — 40 Pieces for Four Hands
**原著**：《四手聯彈，兩首奏鳴曲》（Four Hands, Two Sonatas）
**視覺**：鋼琴與四手演奏特寫，無人物臉部。

## 檔案說明

- `index.html`：首頁、五個樂章、閱讀目錄、曲目索引與作品資訊。
- `styles.css`：響應式桌機與手機排版。
- `app.js`：公開章節篩選、直接進入文章、18+ 確認、上一／下一篇。
- `data/chapters.json`：**公開故事資料**，初始為空陣列 `[]`。
- `data/acts.json`：五個樂章分類與編排。
- `data/repertoire.json`：經典曲目參考。
- `assets/piano-hands.webp`：依照你要求的雙人演奏四隻手與鋼琴圖片。

## 隱私與公開規則

這份「網站發布包」**沒有收錄四十題的未公開標題、文章正文或 Notion Token**。原先寫作記錄中的四十題另放在私人規劃 ZIP，請勿把該私人檔案上傳公開網站。

只有章節資料中同時符合以下條件才會顯示：

1. `published` 為 `true`
2. `status` 為 `已發布` 或 `已發佈`
3. `title` 和 `content` 都有內容
4. `order` 為 1 到 40 間的整數

網站的「40」表示題庫的四十題設計，**不是已發布四十篇**。

## 新增文章：data/chapters.json

加入已經完成而且你確定要公開的作品，例如：

```json
[
  {
    "id": "piece-01",
    "order": 1,
    "act": 1,
    "title": "此處放已公開篇名",
    "content": "此處放你已經決定公開的正文。\n\n第二段文字。",
    "rating": "一般",
    "cp": [],
    "published": true,
    "status": "已發布"
  }
]
```

可以直接開啟 `/#/read/piece-01` 讀取該篇。如果文章標成 `18+`，需先經過年齡確認。僅限前端提醒，不構成身分驗證。

## GitHub + Cloudflare Pages 部署

1. 建立自己的新 GitHub repo（例如 `quaver-archive`），**只上傳本網站發布包內的檔案**。
2. 在 Cloudflare Pages 新增專案，連結 GitHub repo，使用靜態網站設定（無 build command，輸出目錄 `/`）。
3. 部署後即可看到網站骨架與五個樂章，但尚未有公開正文，這是刻意設計。
4. 等 Notion 的章節資料庫準備好後，再補上與現有站點相同的 Notion → GitHub Actions → Cloudflare Pages 同步工作流程。

此初版**尚未直接連接 Notion**，也沒有設定／觸碰你既有網站的 Secrets。正式同步時應以新站專屬章節資料庫或明確識別條件進行篩選；僅匯出公開文章。

## 下一步可能的 Notion 欄位

建議延用你其他小說站的欄位：`篇名`、`作品識別碼`（Quaver）、`章節排序`、`樂章`（1–5）、`正文`、`CP／配對`、`分級`（一般／18+）、`狀態`（已發布）、`網站公開`（勾選）、`相關古典曲目`（選填）、`簡介`（選填，暫不串接）。

## 本機預覽

若你有電腦，可在網站目錄執行：`python -m http.server 8000`，瀏覽 `http://localhost:8000/`。直接雙擊 HTML 時，部分瀏覽器不允許讀取同層 JSON，屬本機檔案限制。
