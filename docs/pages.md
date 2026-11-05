# GitHub Pages

這個儲存庫是 `crossing-proxy-taiwan.github.io`。Pages 已啟用，來源是預設分支 `main` 的根目錄，建置類型是 legacy。公開網址會是：

https://crossing-proxy-taiwan.github.io/

`.nojekyll` 讓 Pages 直接提供 HTML、CSS 與 JS，不經過 Jekyll。

工作分支上的 2.0 頁面在合併到 `main` 之前不會變成公開網站。請不要把 Pages 的來源改到這個工作分支，否則會在合併前就公開。

合併之後，GitHub 會從 `main` 重新發布。可用這支指令確認來源仍是 `main` 根目錄：

```bash
gh api repos/crossing-proxy-taiwan/crossing-proxy-taiwan.github.io/pages
```

預期：`source.branch` 為 `main`，`source.path` 為 `/`，`build_type` 為 `legacy`。
