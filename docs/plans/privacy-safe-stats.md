# 計畫：不含個資的服務點擊與 LINE 轉換統計

這個計畫已改成 GoatCounter，說明在 `docs/analytics.md`。`data/analytics.json` 的 `site` 是經營者註冊的 `crossingproxy`。改回空字串就不會載入任何統計程式。

可以送出的只有事件名稱。名稱裡有語言代碼、服務 id，以及允許的平台來源，例如 `service-open:zh:documents:facebook`、`inquiry-open:vi:sim:direct`、`line-click:en:none:line`。來源只會是 facebook、instagram、threads、tiktok、youtube、line 或 direct。頁面瀏覽另計路徑、參照網址與 `utm_source` / `utm_campaign`。

不可以送出詢問草稿、姓名、國籍全文、縣市、電話、證件號碼、LINE 使用者識別，或任何可以還原到特定人的內容。
