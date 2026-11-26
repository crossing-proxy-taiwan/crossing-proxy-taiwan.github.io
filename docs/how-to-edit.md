# 怎麼改語言、國家與服務

結構在 `data/catalog.json`。六語文字在 `data/locales/zh.json`、`en.json`、`vi.json`、`id.json`、`th.json`、`fil.json`。六個語檔的鍵必須一致。

新增服務：

1. 在 `catalog.json` 的 `services` 加一筆。`status` 只能是 `open`、`referral`、`planned`、`paused`。未正式開通用 `planned`。
2. `countries` 用 `["*"]` 表示不限國家，或用 `VN`、`ID`、`TH`、`PH`。
3. `inquiry` 用現有的 `general`、`shipping`、`moto`、`rental`、`sim`、`documents`、`translate`、`pickup`、`enterprise`、`driving`。
4. 在六個語檔的 `services` 補上同一組欄位：`title`、`summary`、`audience`、`scope`、`documents`、`pricing`、`steps`、`limits`。
5. 執行 `npm run build` 與 `npm run check`，把產生的 HTML 一起提交。

新增國家：在 `catalog.json` 的 `countries` 加入代碼，並在每個語檔的 `countries` 加上原生名稱。然後把對應服務的 `countries` 指到新代碼。不要複製整站。

新增介面語言：在 `catalog.json` 的 `langs` 加一筆，新增 `data/locales/<id>.json`，並在 `scripts/build.mjs` 的 `skipText` 補上「跳到內容」的譯文。

## 規劃中的服務

`data/catalog.json` 的 `showPlannedServices` 目前是 `true`。籌備中的服務顯示在 `#planned`，狀態維持 `planned`。不要把狀態改成 `open`。

若要再隱藏：把 `showPlannedServices` 改成 `false`，然後執行 `npm run build` 與 `npm run check`。卡片仍會留在 HTML 裡，只是不顯示，導覽也不會指過去。

語言與國家是分開的。語言由網址 `/zh/`、`/en/`、`/vi/`、`/id/`、`/th/`、`/fil/` 決定，選單只顯示各語言的原生名稱，不加國旗。國家由頁面上的國旗按鈕決定，並記在 `localStorage` 的 `cp-country` 與 `?country=`。選項是 `all`、`TW`、`VN`、`ID`、`TH`、`PH`。選國旗不會切換語言。問句內容不會放進網址。

國旗圖檔在 `assets/flags/`，建置時會內嵌。新增國家時要補一張 SVG，並把代碼加進 `catalog.json` 的 `countryChoices`。服務適用國家仍用 `countries` 陣列，`*` 代表不限國家。

服務分組在 `catalog.json` 的 `groups`。同一項服務可以出現在兩個分組，頁面只建立一筆完整卡片，第二處是連到同一筆的入口。駕照文件代辦的 id 是 `driving-license-assistance`，詢問表單用 `driving`。表單只在瀏覽器裡組成文字。所在縣市是台灣 22 個縣市加上「其他」，只記住選項代碼，不保存自由輸入。複製或開啟 LINE 前要勾選確認，而且連續數字若像證件號碼會被擋住。一般日期與 LINE 帳號 `@681ydjcz` 不會被當成證件號碼。

分析預設關閉。`data/analytics.json` 的 `enabled` 維持 `false`，直到有已審查的收集端點。事件只會送語言、服務 ID、國家代碼與渠道名稱，不送表單內文。
