# 怎麼改語言、國家、服務與價格

結構在 `data/catalog.json`。七語文字在 `data/locales/zh.json`、`en.json`、`vi.json`、`id.json`、`th.json`、`fil.json`、`hi.json`。七個語檔的鍵必須一致。語言名稱永遠用母語原名：繁體中文、English、Tiếng Việt、Bahasa Indonesia、ไทย、Filipino、हिन्दी。

改完後執行：

```bash
npm run build
npm run check
```

把產生的 HTML 一起提交。

## 價格

`data/catalog.json` 的 `prices` 每一筆都有 `published` 與 `items`。每一列有 `basePrice`、`currency`、`unit`、`surcharges`、`note`。

- `published` 不是 `true`，或 `basePrice` 是 `null`：公開頁只顯示服務名稱，以及該語言的「免費初步諮詢，確認需求後提供正式報價。」
- 未來真的要公告價格時，把 `published` 設為 `true`，填入 `basePrice`（數字）、`unit`、`surcharges`、`note`，再重新建置。價目表會改成五欄：服務名稱、基本價格、計價單位、附加費、備註。不要填估計或範例數字。

服務名稱的譯文在各語檔的 `price.items`。

## 車輛列表（尚未啟用）

`vehicles.enabled` 必須維持 `false`，`items` 維持空陣列。欄位只定義在 `vehicles.fields`：`id`、`mode`（`sale` 或 `rental`）、`brand`、`model`、`displacementCc`、`year`、`mileageKm`、`region`、`priceId`、`rentalTerms`、`photos`、`status`（`available`、`reserved` 或 `closed`）、`updatedAt`。

不要放範例車輛。`enabled` 改成 `true` 之前，要先在 `scripts/build.mjs` 的 `listingsPage()` 寫好列表頁，否則建置會停止。列表頁預計路徑是 `/{lang}/motorcycle/listings/`。

## 國際寄件試算（尚未啟用）

`shippingEstimator.enabled` 必須維持 `false`。啟用後，`scripts/build.mjs` 的 `estimateSlot()` 會在國際寄件頁輸出 `#estimate`。現在不輸出任何試算器。

## 語言與國家

語言由網址決定。國家記在 `localStorage` 的 `cp-country`，也可以用 `?country=VN`。對應是：繁體中文與 English 為全部國家，Tiếng Việt 為越南，Bahasa Indonesia 為印尼，ไทย 為泰國，Filipino 為菲律賓，हिन्दी 為印度。使用者改過的國家會保留。國家只調整寄件目的國的預設與翻譯方向的排序，不隱藏其他服務。

服務地區在 `areaSets`。新竹同時包含新竹市與新竹縣。

## 不要放進網站的東西

不要填假價格、假案例、假評價、假車輛、假統計或未公開的合作單位名稱。不要寫「認證合作夥伴」。不要加回詢問表單。家具與生活用品租賃不要出現。

分析維持關閉。`data/analytics.json` 的 `enabled` 維持 `false`，直到有已審查的收集端點。
