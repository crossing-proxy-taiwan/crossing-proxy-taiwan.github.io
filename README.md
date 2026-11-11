# CROSSING PROXY｜越境代辦

在台外籍人士的生活服務網站。七個語言各有一組靜態頁：`/zh/`、`/en/`、`/vi/`、`/id/`、`/th/`、`/fil/`、`/hi/`。第一次開啟 `/` 會先選擇語言，選擇記在這台裝置的 `localStorage`。

```bash
npm run build
npm run check
python3 -m http.server 4173
```

然後打開 `http://127.0.0.1:4173/`。沒有第三方套件。`npm run build` 會依 `data/catalog.json` 與 `data/locales/*.json` 產生 HTML、`sitemap.xml`、`robots.txt` 與圖示。

這份改版在合併到 `main` 之前不會變成公開網站。不要改 GitHub Pages 的來源分支。見 `docs/pages.md`。
