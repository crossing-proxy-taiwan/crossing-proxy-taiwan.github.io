# 回復正式站並重新發布

這份說明只在需要把公開網站退回 V2.0 之前時使用。現在的 V2.0 還在審核分支，還沒有合併，也還沒有取代正式站。

正式站來源是 GitHub Pages 的 `main` 根目錄，建置類型是 legacy。公開網址是 https://crossing-proxy-taiwan.github.io/ 。

備份標籤：`v1-before-v2.0`  
對應提交：`1d640b9cf55a0381c74841ab4f476e55202b7c4f`

## 還沒合併時

不要把 Pages 的來源改到 `cursor/website-v2-0-fd3c` 或其他工作分支。正式站會繼續提供 `main`。若要放棄這次審核，不合併 pull request 即可。

## 已經合併、要退回舊版

用一個新的提交把 `main` 的檔案樹恢復成標籤內容。不要 force-push。

```bash
git fetch origin --tags
git checkout main
git pull origin main
git checkout v1-before-v2.0 -- .
git status
git commit -m "Restore the public site to v1-before-v2.0"
git push origin main
```

推上 `main` 之後，GitHub Pages 會用 legacy 模式從根目錄重新發布。可用這支指令再要求一次建置：

```bash
gh api --method POST repos/crossing-proxy-taiwan/crossing-proxy-taiwan.github.io/pages/builds
```

## 發布後要核對的事

1. Pages 來源仍是 `main` 根目錄：

```bash
gh api repos/crossing-proxy-taiwan/crossing-proxy-taiwan.github.io/pages
```

預期：`source.branch` 是 `main`，`source.path` 是 `/`，`build_type` 是 `legacy`。

2. 等 Pages 建置完成後打開 https://crossing-proxy-taiwan.github.io/zh/ 。V2.0 的國旗選擇器與「駕照文件代辦」不應再出現在正式站。

3. 標籤本身不要刪。它仍指向合併前的那個提交：

```bash
git rev-parse v1-before-v2.0
```

預期輸出是 `1d640b9cf55a0381c74841ab4f476e55202b7c4f`。

## 不要做的事

- 不要在尚未核准時把 Pages 來源改到審核分支。
- 不要用 `git push --force` 改寫 `main`。
- 不要在回復時順便改服務狀態、價格或聯絡資料。
