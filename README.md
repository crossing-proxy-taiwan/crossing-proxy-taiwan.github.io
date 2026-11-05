# CROSSING PROXY｜越境代辦

在台外籍人士的一頁式生活服務網站。六個語言各是一個可直接開啟的靜態頁：`/zh/`、`/en/`、`/vi/`、`/id/`、`/th/`、`/fil/`。

```bash
npm run build
npm run check
```

沒有第三方套件。`npm run build` 會依 `data/` 產生六語 HTML、`sitemap.xml`、`robots.txt` 與語言選擇頁。GitHub Pages 直接提供這些檔案。

這次是遷入新儲存庫的可部署版本，不是從已停權的 `crossing-proxy` 帳號拉下來的舊分支。舊站 `https://crossing-proxy.github.io/` 與舊倉庫都已無法讀取。原雲端代理 `bc-f2343c38-2ce5-5ce8-87fb-e26414bf15f0` 的保存工作區也沒有授權給這次工作階段。因此頁面依 JAS 的 13 節規格與已確認的品牌資料重做，缺的經營者資料留白。細節見 `docs/pending-from-jas.md`。

公開網址要等這個分支合併進 `main` 之後才會更新。見 `docs/pages.md`。
