# 社群連結怎麼加 UTM

給貼文、個人檔案與 LINE 官方帳號用的網址。改的人不必會寫程式。統計後台要等 `docs/analytics.md` 的 GoatCounter 網站代碼填上之後才看得到數字。

`utm_medium` 一律寫 `social`。不要改成 `profile` 或 `post`。個人檔案、貼文、圖文選單的差別放在 `utm_campaign`。

## 三個欄位

網址後面這三段請保持英文，不要空格，不要加姓名、電話或日期長串。

| 欄位 | 填什麼 | 這次怎麼填 |
| --- | --- | --- |
| `utm_source` | 哪個平台 | `facebook`、`instagram`、`threads`、`tiktok`、`youtube`、`line`。一個平台一個字 |
| `utm_medium` | 固定 | 永遠是 `social` |
| `utm_campaign` | 活動、位置、文案列、版位 | 見下一節 |

YouTube 目前沒有放在網站頁尾，仍然可以拿這裡的連結去貼影片說明。

語言頁本身已經帶國家：繁中 `country=TW`、越南文 `country=VN`、英文 `country=all`、印尼文 `country=ID`、泰文 `country=TH`、菲律賓文 `country=PH`。請整段複製，不要删掉 `country`。

## 活動名稱

格式：

`repositioning-2026-12-{profile|post|menu}[-列號][-版位][-素材]`

| 片段 | 意思 | 例子 |
| --- | --- | --- |
| `profile` | 個人檔案或自我介紹 | `repositioning-2026-12-profile` |
| `post` | 單篇貼文 | 後面再加列號與版位 |
| `menu` | LINE 圖文選單 | `repositioning-2026-12-menu` |
| `r列號` | 每日文案那個分頁的列 | `r143`、`r170` |
| `ri列號` | IG 內容那個分頁的列 | `ri12` |
| `rt列號` | Threads 內容那個分頁的列 | `rt12` |
| `b1` `b2` `b3` `b4` | Facebook / TikTok 當日版位 | `b1` |
| `i1` | Instagram 版位 | `i1` |
| `t1` `t2` `t3` | Threads 版位 | `t1` |
| 最後的英文 | 素材種類，可省略 | `reel` |

對過的例子：

- 每日文案、Facebook 或 TikTok 的 b1：`repositioning-2026-12-post-r143-b1`
- 每日文案、b4、短片：`repositioning-2026-12-post-r170-b4-reel`
- IG 內容第 12 列：`repositioning-2026-12-post-ri12-i1`
- Threads 內容第 12 列的 t1：`repositioning-2026-12-post-rt12-t1`
- 個人檔案：`repositioning-2026-12-profile`
- LINE 圖文選單：`repositioning-2026-12-menu`

換列只改數字：每日文案第 144 列的 b2 是 `repositioning-2026-12-post-r144-b2`。Threads 的 t2、t3 是 `repositioning-2026-12-post-rt12-t2`、`repositioning-2026-12-post-rt12-t3`。

YouTube 影片若對得到每日文案的某一列，活動名稱用 `repositioning-2026-12-post-r{列號}-b{版位}`。`{列號}`、`{版位}` 要換成那支影片的列和版位，不要整批貼同一組。例如第 143 列、版位 b4 是 `repositioning-2026-12-post-r143-b4`。對不到列的影片不要用沒有列號的 `post`，改用 `repositioning-2026-12-profile`。`utm_medium` 仍是 `social`。

不要把日期或電話寫成連續 6 位以上的數字。`20261201`、`r100000` 會被網站拿掉，GoatCounter 就看不到這次活動。`2026-12` 中間有減號，可以使用。`r143`、`ri12`、`rt12` 的位數都少於 6，可以使用。

下一檔活動只改最前面的英文短名與年月，例如 `new-year-2027-01-post-r1-b1`。不要用中文。

## 個人檔案

活動名稱都是 `repositioning-2026-12-profile`。`utm_medium` 都是 `social`。

### 繁體中文 `/zh/`

| 平台 | 連結 |
| --- | --- |
| Facebook | https://crossing-proxy-taiwan.github.io/zh/?country=TW&utm_source=facebook&utm_medium=social&utm_campaign=repositioning-2026-12-profile |
| Instagram | https://crossing-proxy-taiwan.github.io/zh/?country=TW&utm_source=instagram&utm_medium=social&utm_campaign=repositioning-2026-12-profile |
| Threads | https://crossing-proxy-taiwan.github.io/zh/?country=TW&utm_source=threads&utm_medium=social&utm_campaign=repositioning-2026-12-profile |
| TikTok | https://crossing-proxy-taiwan.github.io/zh/?country=TW&utm_source=tiktok&utm_medium=social&utm_campaign=repositioning-2026-12-profile |
| YouTube | https://crossing-proxy-taiwan.github.io/zh/?country=TW&utm_source=youtube&utm_medium=social&utm_campaign=repositioning-2026-12-profile |
| LINE 官方帳號 | https://crossing-proxy-taiwan.github.io/zh/?country=TW&utm_source=line&utm_medium=social&utm_campaign=repositioning-2026-12-profile |

### Tiếng Việt `/vi/`

| 平台 | 連結 |
| --- | --- |
| Facebook | https://crossing-proxy-taiwan.github.io/vi/?country=VN&utm_source=facebook&utm_medium=social&utm_campaign=repositioning-2026-12-profile |
| Instagram | https://crossing-proxy-taiwan.github.io/vi/?country=VN&utm_source=instagram&utm_medium=social&utm_campaign=repositioning-2026-12-profile |
| Threads | https://crossing-proxy-taiwan.github.io/vi/?country=VN&utm_source=threads&utm_medium=social&utm_campaign=repositioning-2026-12-profile |
| TikTok | https://crossing-proxy-taiwan.github.io/vi/?country=VN&utm_source=tiktok&utm_medium=social&utm_campaign=repositioning-2026-12-profile |
| YouTube | https://crossing-proxy-taiwan.github.io/vi/?country=VN&utm_source=youtube&utm_medium=social&utm_campaign=repositioning-2026-12-profile |
| LINE 官方帳號 | https://crossing-proxy-taiwan.github.io/vi/?country=VN&utm_source=line&utm_medium=social&utm_campaign=repositioning-2026-12-profile |

### English `/en/`

| 平台 | 連結 |
| --- | --- |
| Facebook | https://crossing-proxy-taiwan.github.io/en/?country=all&utm_source=facebook&utm_medium=social&utm_campaign=repositioning-2026-12-profile |
| Instagram | https://crossing-proxy-taiwan.github.io/en/?country=all&utm_source=instagram&utm_medium=social&utm_campaign=repositioning-2026-12-profile |
| Threads | https://crossing-proxy-taiwan.github.io/en/?country=all&utm_source=threads&utm_medium=social&utm_campaign=repositioning-2026-12-profile |
| TikTok | https://crossing-proxy-taiwan.github.io/en/?country=all&utm_source=tiktok&utm_medium=social&utm_campaign=repositioning-2026-12-profile |
| YouTube | https://crossing-proxy-taiwan.github.io/en/?country=all&utm_source=youtube&utm_medium=social&utm_campaign=repositioning-2026-12-profile |
| LINE 官方帳號 | https://crossing-proxy-taiwan.github.io/en/?country=all&utm_source=line&utm_medium=social&utm_campaign=repositioning-2026-12-profile |

### Bahasa Indonesia `/id/`

| 平台 | 連結 |
| --- | --- |
| Facebook | https://crossing-proxy-taiwan.github.io/id/?country=ID&utm_source=facebook&utm_medium=social&utm_campaign=repositioning-2026-12-profile |
| Instagram | https://crossing-proxy-taiwan.github.io/id/?country=ID&utm_source=instagram&utm_medium=social&utm_campaign=repositioning-2026-12-profile |
| Threads | https://crossing-proxy-taiwan.github.io/id/?country=ID&utm_source=threads&utm_medium=social&utm_campaign=repositioning-2026-12-profile |
| TikTok | https://crossing-proxy-taiwan.github.io/id/?country=ID&utm_source=tiktok&utm_medium=social&utm_campaign=repositioning-2026-12-profile |
| YouTube | https://crossing-proxy-taiwan.github.io/id/?country=ID&utm_source=youtube&utm_medium=social&utm_campaign=repositioning-2026-12-profile |
| LINE 官方帳號 | https://crossing-proxy-taiwan.github.io/id/?country=ID&utm_source=line&utm_medium=social&utm_campaign=repositioning-2026-12-profile |

### ไทย `/th/`

| 平台 | 連結 |
| --- | --- |
| Facebook | https://crossing-proxy-taiwan.github.io/th/?country=TH&utm_source=facebook&utm_medium=social&utm_campaign=repositioning-2026-12-profile |
| Instagram | https://crossing-proxy-taiwan.github.io/th/?country=TH&utm_source=instagram&utm_medium=social&utm_campaign=repositioning-2026-12-profile |
| Threads | https://crossing-proxy-taiwan.github.io/th/?country=TH&utm_source=threads&utm_medium=social&utm_campaign=repositioning-2026-12-profile |
| TikTok | https://crossing-proxy-taiwan.github.io/th/?country=TH&utm_source=tiktok&utm_medium=social&utm_campaign=repositioning-2026-12-profile |
| YouTube | https://crossing-proxy-taiwan.github.io/th/?country=TH&utm_source=youtube&utm_medium=social&utm_campaign=repositioning-2026-12-profile |
| LINE 官方帳號 | https://crossing-proxy-taiwan.github.io/th/?country=TH&utm_source=line&utm_medium=social&utm_campaign=repositioning-2026-12-profile |

### Filipino `/fil/`

| 平台 | 連結 |
| --- | --- |
| Facebook | https://crossing-proxy-taiwan.github.io/fil/?country=PH&utm_source=facebook&utm_medium=social&utm_campaign=repositioning-2026-12-profile |
| Instagram | https://crossing-proxy-taiwan.github.io/fil/?country=PH&utm_source=instagram&utm_medium=social&utm_campaign=repositioning-2026-12-profile |
| Threads | https://crossing-proxy-taiwan.github.io/fil/?country=PH&utm_source=threads&utm_medium=social&utm_campaign=repositioning-2026-12-profile |
| TikTok | https://crossing-proxy-taiwan.github.io/fil/?country=PH&utm_source=tiktok&utm_medium=social&utm_campaign=repositioning-2026-12-profile |
| YouTube | https://crossing-proxy-taiwan.github.io/fil/?country=PH&utm_source=youtube&utm_medium=social&utm_campaign=repositioning-2026-12-profile |
| LINE 官方帳號 | https://crossing-proxy-taiwan.github.io/fil/?country=PH&utm_source=line&utm_medium=social&utm_campaign=repositioning-2026-12-profile |

## 貼文與 LINE 圖文選單

每個平台一條可直接貼的例子。`utm_medium` 仍是 `social`。Facebook 用每日文案 `r143` 的 `b1`。Instagram 用 IG 內容 `ri12` 的 `i1`。Threads 用 Threads 內容 `rt12` 的 `t1`。TikTok 用每日文案 `r170` 的 `b4` 短片。YouTube 的 `r143-b4` 只是占位：它代表「對得到每日文案第 143 列、版位 b4」的那一支影片，其他影片要改列號與版位。對不到列的 YouTube 影片改用上一節的個人檔案連結。LINE 用圖文選單 `menu`。

### 繁體中文 `/zh/`

| 平台 | 連結 |
| --- | --- |
| Facebook | https://crossing-proxy-taiwan.github.io/zh/?country=TW&utm_source=facebook&utm_medium=social&utm_campaign=repositioning-2026-12-post-r143-b1 |
| Instagram | https://crossing-proxy-taiwan.github.io/zh/?country=TW&utm_source=instagram&utm_medium=social&utm_campaign=repositioning-2026-12-post-ri12-i1 |
| Threads | https://crossing-proxy-taiwan.github.io/zh/?country=TW&utm_source=threads&utm_medium=social&utm_campaign=repositioning-2026-12-post-rt12-t1 |
| TikTok | https://crossing-proxy-taiwan.github.io/zh/?country=TW&utm_source=tiktok&utm_medium=social&utm_campaign=repositioning-2026-12-post-r170-b4-reel |
| YouTube | https://crossing-proxy-taiwan.github.io/zh/?country=TW&utm_source=youtube&utm_medium=social&utm_campaign=repositioning-2026-12-post-r143-b4 |
| LINE 圖文選單 | https://crossing-proxy-taiwan.github.io/zh/?country=TW&utm_source=line&utm_medium=social&utm_campaign=repositioning-2026-12-menu |

### Tiếng Việt `/vi/`

| 平台 | 連結 |
| --- | --- |
| Facebook | https://crossing-proxy-taiwan.github.io/vi/?country=VN&utm_source=facebook&utm_medium=social&utm_campaign=repositioning-2026-12-post-r143-b1 |
| Instagram | https://crossing-proxy-taiwan.github.io/vi/?country=VN&utm_source=instagram&utm_medium=social&utm_campaign=repositioning-2026-12-post-ri12-i1 |
| Threads | https://crossing-proxy-taiwan.github.io/vi/?country=VN&utm_source=threads&utm_medium=social&utm_campaign=repositioning-2026-12-post-rt12-t1 |
| TikTok | https://crossing-proxy-taiwan.github.io/vi/?country=VN&utm_source=tiktok&utm_medium=social&utm_campaign=repositioning-2026-12-post-r170-b4-reel |
| YouTube | https://crossing-proxy-taiwan.github.io/vi/?country=VN&utm_source=youtube&utm_medium=social&utm_campaign=repositioning-2026-12-post-r143-b4 |
| LINE 圖文選單 | https://crossing-proxy-taiwan.github.io/vi/?country=VN&utm_source=line&utm_medium=social&utm_campaign=repositioning-2026-12-menu |

### English `/en/`

| 平台 | 連結 |
| --- | --- |
| Facebook | https://crossing-proxy-taiwan.github.io/en/?country=all&utm_source=facebook&utm_medium=social&utm_campaign=repositioning-2026-12-post-r143-b1 |
| Instagram | https://crossing-proxy-taiwan.github.io/en/?country=all&utm_source=instagram&utm_medium=social&utm_campaign=repositioning-2026-12-post-ri12-i1 |
| Threads | https://crossing-proxy-taiwan.github.io/en/?country=all&utm_source=threads&utm_medium=social&utm_campaign=repositioning-2026-12-post-rt12-t1 |
| TikTok | https://crossing-proxy-taiwan.github.io/en/?country=all&utm_source=tiktok&utm_medium=social&utm_campaign=repositioning-2026-12-post-r170-b4-reel |
| YouTube | https://crossing-proxy-taiwan.github.io/en/?country=all&utm_source=youtube&utm_medium=social&utm_campaign=repositioning-2026-12-post-r143-b4 |
| LINE 圖文選單 | https://crossing-proxy-taiwan.github.io/en/?country=all&utm_source=line&utm_medium=social&utm_campaign=repositioning-2026-12-menu |

### Bahasa Indonesia `/id/`

| 平台 | 連結 |
| --- | --- |
| Facebook | https://crossing-proxy-taiwan.github.io/id/?country=ID&utm_source=facebook&utm_medium=social&utm_campaign=repositioning-2026-12-post-r143-b1 |
| Instagram | https://crossing-proxy-taiwan.github.io/id/?country=ID&utm_source=instagram&utm_medium=social&utm_campaign=repositioning-2026-12-post-ri12-i1 |
| Threads | https://crossing-proxy-taiwan.github.io/id/?country=ID&utm_source=threads&utm_medium=social&utm_campaign=repositioning-2026-12-post-rt12-t1 |
| TikTok | https://crossing-proxy-taiwan.github.io/id/?country=ID&utm_source=tiktok&utm_medium=social&utm_campaign=repositioning-2026-12-post-r170-b4-reel |
| YouTube | https://crossing-proxy-taiwan.github.io/id/?country=ID&utm_source=youtube&utm_medium=social&utm_campaign=repositioning-2026-12-post-r143-b4 |
| LINE 圖文選單 | https://crossing-proxy-taiwan.github.io/id/?country=ID&utm_source=line&utm_medium=social&utm_campaign=repositioning-2026-12-menu |

### ไทย `/th/`

| 平台 | 連結 |
| --- | --- |
| Facebook | https://crossing-proxy-taiwan.github.io/th/?country=TH&utm_source=facebook&utm_medium=social&utm_campaign=repositioning-2026-12-post-r143-b1 |
| Instagram | https://crossing-proxy-taiwan.github.io/th/?country=TH&utm_source=instagram&utm_medium=social&utm_campaign=repositioning-2026-12-post-ri12-i1 |
| Threads | https://crossing-proxy-taiwan.github.io/th/?country=TH&utm_source=threads&utm_medium=social&utm_campaign=repositioning-2026-12-post-rt12-t1 |
| TikTok | https://crossing-proxy-taiwan.github.io/th/?country=TH&utm_source=tiktok&utm_medium=social&utm_campaign=repositioning-2026-12-post-r170-b4-reel |
| YouTube | https://crossing-proxy-taiwan.github.io/th/?country=TH&utm_source=youtube&utm_medium=social&utm_campaign=repositioning-2026-12-post-r143-b4 |
| LINE 圖文選單 | https://crossing-proxy-taiwan.github.io/th/?country=TH&utm_source=line&utm_medium=social&utm_campaign=repositioning-2026-12-menu |

### Filipino `/fil/`

| 平台 | 連結 |
| --- | --- |
| Facebook | https://crossing-proxy-taiwan.github.io/fil/?country=PH&utm_source=facebook&utm_medium=social&utm_campaign=repositioning-2026-12-post-r143-b1 |
| Instagram | https://crossing-proxy-taiwan.github.io/fil/?country=PH&utm_source=instagram&utm_medium=social&utm_campaign=repositioning-2026-12-post-ri12-i1 |
| Threads | https://crossing-proxy-taiwan.github.io/fil/?country=PH&utm_source=threads&utm_medium=social&utm_campaign=repositioning-2026-12-post-rt12-t1 |
| TikTok | https://crossing-proxy-taiwan.github.io/fil/?country=PH&utm_source=tiktok&utm_medium=social&utm_campaign=repositioning-2026-12-post-r170-b4-reel |
| YouTube | https://crossing-proxy-taiwan.github.io/fil/?country=PH&utm_source=youtube&utm_medium=social&utm_campaign=repositioning-2026-12-post-r143-b4 |
| LINE 圖文選單 | https://crossing-proxy-taiwan.github.io/fil/?country=PH&utm_source=line&utm_medium=social&utm_campaign=repositioning-2026-12-menu |

其他版位沿用同一條，只改結尾。繁中 Facebook 的 b2、b3，以及 Threads 的 t2、t3：

- b2：https://crossing-proxy-taiwan.github.io/zh/?country=TW&utm_source=facebook&utm_medium=social&utm_campaign=repositioning-2026-12-post-r143-b2
- b3：https://crossing-proxy-taiwan.github.io/zh/?country=TW&utm_source=facebook&utm_medium=social&utm_campaign=repositioning-2026-12-post-r143-b3
- t2：https://crossing-proxy-taiwan.github.io/zh/?country=TW&utm_source=threads&utm_medium=social&utm_campaign=repositioning-2026-12-post-rt12-t2
- t3：https://crossing-proxy-taiwan.github.io/zh/?country=TW&utm_source=threads&utm_medium=social&utm_campaign=repositioning-2026-12-post-rt12-t3
