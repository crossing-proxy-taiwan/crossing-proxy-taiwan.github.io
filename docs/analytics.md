# 網站統計

決定用 **GoatCounter 託管版**（goatcounter.com）。比較依據是 2026-11-27 讀到的官方說明，費用與條款之後可能改，啟用前請再看一次原頁。

經營者已在 2026-11-27 註冊 GoatCounter。後台是 <https://crossingproxy.goatcounter.com/>。`data/analytics.json` 的 `site` 是公開網站代碼 `crossingproxy`，不是 API 金鑰。把 `site` 改回空字串就不會載入任何統計程式。

## 為什麼是 GoatCounter

這個站是 GitHub Pages 上的靜態頁，沒有自己的伺服器。要免費、預設不放 cookie、不建立個人檔案，同時看得到頁面瀏覽、參照網址、`utm_source`、`utm_campaign`，以及服務說明、詢問表、LINE 官方帳號的點擊。

GoatCounter 預設只存彙總次數。IP 與瀏覽器標頭只在伺服器記憶體裡最多約 8 小時，用來判斷是不是同一次瀏覽，不寫進資料庫。單次瀏覽明細預設關閉。事件沒有自由欄位，只能送我們寫死的事件名稱，表單內容沒有地方可塞。

Cloudflare Web Analytics 也免費且不放 cookie，但不能記自訂點擊，也不記 UTM。Umami Cloud 的免費方案做得到 UTM 與事件，但會把每次事件連同工作階段雜湊存下來，比較接近個別紀錄。對照這次「不要持久識別碼、不要個人檔案」的條件，GoatCounter 較接近。

## 比較

| | GoatCounter 託管 | Cloudflare Web Analytics | Umami Cloud Hobby | 自架 GoatCounter 或 Umami |
| --- | --- | --- | --- | --- |
| 費用 | 合理的公開使用免費，含小型與中型商業網站。一天數百萬次瀏覽不適合。可自願贊助。 | 免費，含商業網站 | 0 元。1 個網站、每月 10 萬次事件、保留 6 個月。條款允許商業用途 | 軟體免費，但要自己的伺服器 |
| Cookie | 訪客端不放。後台登入 cookie 只給經營者 | 不放 | 訪客端不放 | 視設定 |
| 持久識別碼 / 個人檔案 | 預設沒有。記憶體裡的 IP 與 User-Agent 最多約 8 小時後丟棄。只有打開「個別瀏覽」才會存工作階段編號，本站要求維持關閉 | 不建立個人檔案 | 伺服器端工作階段雜湊，事件逐筆保存。另有 `identify` 可綁識別碼；本站不會呼叫，但產品做得到 | 視設定 |
| 實際保存的資料 | 依路徑與小時彙總的瀏覽與參照；每日彙總的瀏覽器、作業系統、國家、語言、螢幕寬度，後台可以逐項關閉。活動名稱來自 `utm_campaign`，來源來自 `utm_source`（沒有時用參照網址）。事件只存名稱與次數 | 頁面瀏覽、參照、效能。官方 FAQ：查詢字串不記錄，所以沒有 UTM；自訂事件尚未支援。約保留 6 個月 | 頁面網址、參照、UTM、瀏覽器、裝置、大致地點、自訂事件與屬性。註冊時選美國或歐盟。Hobby 保留 6 個月 | 自己決定保留期限 |
| 要不要帳號 | 要。註冊 goatcounter.com，自己取網站代碼 | 要。Cloudflare 帳號，加入主機名稱，複製 beacon token。token 是公開的，不是密鑰 | 要。註冊後建立網站，複製 website id（公開 UUID） | 要自己維運 |
| 自訂事件 | 可以。只有名稱，沒有屬性袋 | 不行 | 可以，含屬性。每個屬性另計一次事件額度 | 可以 |
| 參照與 UTM | 參照網址可以。`utm_campaign` 與 `utm_source` 會進 Campaigns。`utm_medium` 不會單獨成一欄 | 參照可以。UTM 不行 | UTM 的 source、medium、campaign 都有報表 | 視產品 |
| 資料位置 | Hetzner，芬蘭與德國。營運者在愛爾蘭 | Cloudflare 網路 | 註冊時選美國或歐盟 | 自己的機器 |
| 這次為何不選 | 選這個 | 記不了服務點擊、LINE 點擊與 UTM | 免費且功能更全，但預設更接近逐筆紀錄與工作階段識別 | 這個儲存庫只有 GitHub Pages，沒有收集端伺服器 |

Plausible 是付費產品，不符合這次「免費工具」的條件，所以沒有採用。Google Analytics 會使用 cookie 與用戶識別碼，也不採用。

## GDPR 與台灣個資法

以下不是法律意見。

GoatCounter 自己的說明認為，因為只存彙總、不存可識別個人的資料，再加上網站經營者有了解訪客人數的正當利益，大概不需要 GDPR 同意橫幅。他們同時寫明：GDPR 在各國執行並不一致、其他國家法律仍可能適用、作者不是律師。見 [GDPR consent notices](https://www.goatcounter.com/help/gdpr) 與 [隱私權說明](https://www.goatcounter.com/help/privacy)（該說明標註 2025-06-08）。

台灣個人資料保護法是另一套規則。頁尾已經用平實句子說明：有填網站代碼才會載入、統計什麼、不放 cookie、不建個人檔案、IP 不寫入資料庫、資料在歐盟（德國與芬蘭）、表單與證件不會送出。若從嚴把短暫處理的 IP 或國家層級彙總看成個人資料，是否還需要另行同意，要由經營者與律師判斷。這個變更只補事實告知，沒有宣稱「符合 GDPR」或「符合個資法」。

## 啟用後實際送出什麼

六個語言頁（`/zh/`、`/en/`、`/vi/`、`/id/`、`/th/`、`/fil/`）在 `site` 通過檢查後才會載入 `https://gc.zgo.at/count.js`，並把計數送到 `https://網站代碼.goatcounter.com/count`。語言選擇頁 `/` 與 404 沒有這支程式，不算進統計。

頁面路徑用既有的 canonical，所以 `/zh/` 不會因為 `?country=` 或 UTM 被拆成很多條。GoatCounter 另讀網址上的查詢字串，從中取出 `utm_campaign` 與 `utm_source`。有 `utm_source` 時，報表上的來源會顯示這個值，而不是原本的參照網址。沒有 UTM 時，來源是參照網址。

載入前會把查詢字串收成只留 `country` 與五個 utm 欄位（`utm_source`、`utm_medium`、`utm_campaign`、`utm_content`、`utm_term`）。utm 的值只允許短的英文、數字、`.`、`_`、`~`、`-`，連續 6 位以上數字會被拿掉，避免證件號或電話被送進計數請求。`country` 是這個語言頁的服務篩選（`TW`、`VN`、`ID`、`TH`、`PH` 或 `all`），不是詢問表裡填的國籍。GoatCounter 的原始查詢字串欄位不寫入資料庫；頁面上的 `strict-origin-when-cross-origin` 讓跨站請求的 Referer 只帶網站來源，不帶路徑與查詢字串。

自訂事件用 GoatCounter 的 `count({ event: true })`。名稱只有下面三種，沒有表單欄位。最後一段是進站平台，用來在後台把同一個服務的點擊拆開。平台只允許 `facebook`、`instagram`、`threads`、`tiktok`、`youtube`、`line`。網址沒有 `utm_source`，或 `utm_source` 不是這六個字時，用 `direct`。不會送空白，也不會把其他來源字串接進事件名稱，所以事件集合停在「語言 × 服務 × 這七個來源」。

| 事件路徑 | 何時送出 |
| --- | --- |
| `service-open:語言:服務id:來源` | 打開服務說明，或點進同一服務的第二張入口卡 |
| `inquiry-open:語言:服務id:來源` | 打開 LINE 詢問表。只送服務 id 與來源，不送草稿 |
| `line-click:語言:服務id或none:來源` | 點已經寫在頁面上的 LINE 官方帳號 `https://lin.ee/SQbAREU`（`@681ydjcz`）。點擊落在某張服務卡裡，或落在該服務的詢問表的 LINE 按鈕，服務 id 就是那張卡。頁首、主視覺、頁尾、浮動按鈕與手機底欄沒有對應服務，用 `none`。社群群組連結不算 |

語言只會是 `zh`、`en`、`vi`、`id`、`th`、`fil`。服務 id 必須是頁面設定裡既有的 id。複製詢問草稿不會另送事件。

統計有打開時，進站網址若帶著通過檢查的 `utm_source`（必須是上面六個平台之一）與 `utm_campaign`，會寫進這個分頁的 `sessionStorage`（鍵名 `cp-utm-source`、`cp-utm-campaign`）。不寫 cookie，不寫 `localStorage`，不造訪客編號。分頁關掉就沒有了。同一個分頁之後若開了沒有 UTM 的語言頁，點擊事件仍用這組來源。若後來開到的網址帶了不在這六個平台裡的 `utm_source`，這一頁記成 `direct`，並清掉先前存的來源與活動名稱，再往後沒有 UTM 的頁面也是 `direct`。`utm_campaign` 只留在這個分頁，不接進事件名稱；GoatCounter 的頁面瀏覽仍從當下網址讀活動名稱。`site` 是空的時，這兩個鍵都不會寫。

## 經營者要貼上的值

1. 打開 <https://www.goatcounter.com/signup>，用電子郵件註冊。這是經營者的後台帳號。
2. 建立網站。網站代碼是你取的小寫代號，成為 `https://代號.goatcounter.com`。代號只能用小寫英數與連字號，最長 30 字，不要用一長串十六進位。
3. 到 Settings → Data collection，確認沒有打開個別瀏覽（individual pageviews）。預設是關的，請維持關閉。瀏覽器、國家、語言、螢幕寬度可以在同一頁逐項關閉。
4. 複製網站代碼本身。不要複製 API 金鑰或密碼。GoatCounter 給這個站的腳本位址是公開的，不是密鑰。
5. 貼到 `data/analytics.json` 的 `site`。`provider` 維持 `goatcounter`。經營者已貼上 `crossingproxy`：

```json
{
  "provider": "goatcounter",
  "site": "crossingproxy"
}
```

6. 合併到 `main` 之後，GitHub Pages 才會把這份設定發到正式站。不要把 Pages 的來源改到工作分支。
7. 用沒有擋廣告的瀏覽器打開正式站，到 GoatCounter 後台確認有瀏覽。擋廣告的瀏覽器常會擋住 `gc.zgo.at`，數字會少於實際人數。本機預覽不會送出。
8. 若不希望把自己的瀏覽算進去，在正式站網址加上 `#toggle-goatcounter` 再開一次。這只寫入那個瀏覽器的 localStorage。

`npm run check` 會拒絕網址、大寫、過長，以及 16 字以上的純十六進位代碼，避免把 token 貼進 `site`。

## 頁面文字

六個語言的頁尾「法規與個資」各加了一段，只描述上面這些事實。

**英文、越南文、印尼文、泰文、菲律賓文尚未經母語者校對。** 頁面既有的 `cp-translation-review` 仍是 `not-yet-native-reviewed`。合併前建議給母語者看過那一段。繁體中文是這次撰寫的原文。

## 限制

- `utm_medium` 固定為 `social`。個人檔案、貼文與 LINE 圖文選單的差別寫在 `utm_campaign`，不寫在 medium。GoatCounter 的 Campaigns 看得到活動名稱與 `utm_source`，不會單獨畫出 medium。連結做法見 `docs/utm-links.md`。
- 同一個路徑在約 8 小時內不會重複計成新的瀏覽。點擊事件有設成每次都計。
- 機器人：GoatCounter 預設不把 bot 算進彙總。`count.js` 在送出前會把 PhantomJS、Nightmare、Selenium，以及帶 `navigator.webdriver` 的無頭瀏覽器標成 bot，註解寫明伺服器還會再過濾。標成 bot 的請求不會寫進彙總統計。這是計數程式的預設行為，不是這個站另外打開的開關。它沒有保證擋下每一種機器人。
- 廣告阻擋會少算。GoatCounter 入門說明寫明，擋廣告的瀏覽器常會擋住 `goatcounter.com` 或 `gc.zgo.at`。被擋住的人不會出現在後台，所以人數低於實際開頁人數。請用沒有擋廣告的瀏覽器做啟用後的第一次確認。
- 沒有填 `site` 時，程式不會請求 GoatCounter，也不會把 UTM 寫進 `sessionStorage`。

## 這次讀過的頁面

- <https://www.goatcounter.com/>
- <https://www.goatcounter.com/help/privacy>
- <https://www.goatcounter.com/help/gdpr>
- <https://www.goatcounter.com/help/campaigns>
- <https://www.goatcounter.com/help/events>
- <https://www.goatcounter.com/help/sessions>
- <https://www.goatcounter.com/help>（入門頁寫明廣告阻擋會讓瀏覽看不到）
- <https://github.com/arp242/goatcounter/blob/main/public/count.js>（2026-11-27：無頭瀏覽器標成 bot，並註明伺服器還會再過濾）
- <https://developers.cloudflare.com/web-analytics/faq/>
- <https://developers.cloudflare.com/web-analytics/get-started/>
- <https://umami.is/pricing>
- <https://umami.is/terms>
- <https://docs.umami.is/docs/tracker-functions>
- <https://docs.umami.is/docs/tracker-configuration>
