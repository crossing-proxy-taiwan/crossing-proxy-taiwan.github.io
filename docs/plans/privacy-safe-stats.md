# 計畫：不含個資的服務點擊與 LINE 轉換統計

這是計畫。`data/analytics.json` 的 `enabled` 維持 `false`，沒有接上任何外部統計工具。

## 可以收集的

只在經營者提供並審查過收集端點之後：

- 事件名稱：`page_view`、`service_open`、`inquiry_open`、`inquiry_copy`、`contact_channel`、`country_change`、`language_switch`
- 語言代碼
- 服務 id
- 國家篩選代碼
- 渠道名稱，例如 `line`

## 不可以收集的

詢問草稿、姓名、國籍全文、縣市、電話、證件號碼、LINE 使用者識別，以及任何可以還原到特定人的內容。現有程式的事件內容已依這個範圍設計，但端點未設定前不會送出。

## 啟用條件

1. JAS 書面同意收集目的與保存期限。
2. 端點由已審查的服務提供，不使用未經授權的第三方追蹤。
3. 把 `data/analytics.json` 的 `enabled` 設為 `true` 並填上端點，再重新建置與檢查。
