# 怎麼改語言、國家與服務

結構在 `data/catalog.json`。六語文字在 `data/locales/zh.json`、`en.json`、`vi.json`、`id.json`、`th.json`、`fil.json`。六個語檔的鍵必須一致。

新增服務：

1. 在 `catalog.json` 的 `services` 加一筆。`status` 只能是 `open`、`referral`、`planned`、`paused`。未正式開通用 `planned`。
2. `countries` 用 `["*"]` 表示不限國家，或用 `VN`、`ID`、`TH`、`PH`。
3. `inquiry` 用現有的 `general`、`shipping`、`moto`、`rental`、`sim`、`documents`、`translate`、`pickup`、`enterprise`。
4. 在六個語檔的 `services` 補上同一組欄位：`title`、`summary`、`audience`、`scope`、`documents`、`pricing`、`steps`、`limits`。
5. 執行 `npm run build` 與 `npm run check`，把產生的 HTML 一起提交。

新增國家：在 `catalog.json` 的 `countries` 加入代碼，並在每個語檔的 `countries` 加上原生名稱。然後把對應服務的 `countries` 指到新代碼。不要複製整站。

新增介面語言：在 `catalog.json` 的 `langs` 加一筆，新增 `data/locales/<id>.json`，並在 `scripts/build.mjs` 的 `skipText` 補上「跳到內容」的譯文。

## 規劃中的服務

`data/catalog.json` 的 `showPlannedServices` 目前是 `false`。六個語言頁面都不顯示規劃中的服務：篩選鈕、`#planned` 錨點、狀態為 `planned` 的卡片，以及卡片下方那句尚未開放的說明。這些內容仍留在產生的 HTML 裡，只是隱藏，也不會有導覽連結指過去。

要重新顯示：把 `showPlannedServices` 改成 `true`，然後執行 `npm run build` 與 `npm run check`，並提交產生的頁面。

語言與國家是分開的。語言由網址 `/zh/`、`/en/`、`/vi/`、`/id/`、`/th/`、`/fil/` 決定。國家由頁面上的選單決定，並記在 `localStorage` 的 `cp-country` 與 `?country=`。問句內容不會放進網址。

分析預設關閉。`data/analytics.json` 的 `enabled` 維持 `false`，直到有已審查的收集端點。事件只會送語言、服務 ID、國家代碼與渠道名稱，不送表單內文。
