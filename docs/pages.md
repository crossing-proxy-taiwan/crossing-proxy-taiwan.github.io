# GitHub Pages

這個儲存庫是 `crossing-proxy-taiwan.github.io`。Pages 的來源應維持預設分支 `main` 的根目錄，建置類型是 legacy。公開網址是：

https://crossing-proxy-taiwan.github.io/

`.nojekyll` 讓 Pages 直接提供 HTML、CSS 與 JS。

工作分支上的頁面在 JAS 再次確認並合併到 `main` 之前，不應變成公開網站。不要把 Pages 的來源改到工作分支，也不要從這個分支發布。

本機預覽：

```bash
npm run build
python3 -m http.server 4173
```

打開 http://127.0.0.1:4173/ 。若要重看語言選擇頁，先清掉瀏覽器裡這個網址的 `localStorage`（`cp-lang`、`cp-country`）。

合併之後可用這支指令確認來源仍是 `main` 根目錄：

```bash
gh api repos/crossing-proxy-taiwan/crossing-proxy-taiwan.github.io/pages
```

預期：`source.branch` 為 `main`，`source.path` 為 `/`，`build_type` 為 `legacy`。
