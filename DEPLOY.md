# 部署到 GitHub Pages

## 步驟

1. 在 GitHub 建立 repository（例如 `tpx1000`）。
2. 把「本資料夾內的所有內容」推上去（注意：是資料夾裡面的檔案，不是連同 tpx1000-main 這層一起推）。

   ```bash
   cd tpx1000-main
   git init
   git add .
   git commit -m "TPX1000 v2.1"
   git branch -M main
   git remote add origin https://github.com/<你的帳號>/<repo名稱>.git
   git push -u origin main
   ```

   音檔約 46 MB、共 3,267 個檔案，第一次 push 會比較久，屬正常。

3. 到 repo 的 **Settings → Pages**，Source 選 **Deploy from a branch**，
   Branch 選 **main** / **/ (root)**，按 Save。

4. 等 1 到 3 分鐘，開啟 `https://<你的帳號>.github.io/<repo名稱>/`。

## 注意事項

- 必須用 **https** 開啟，Service Worker 與 PWA 安裝才會生效。
  用本機 `file://` 直接點開 index.html 可以看單字，但離線快取與安裝功能不會啟動。
- `.nojekyll` 已附上，避免 GitHub Pages 的 Jekyll 略過特殊檔名。
- 更新版本時，請把 `sw.js` 第 6 行的 `VER` 往上加（目前為 `kin-shell-v3`），
  否則舊的 Service Worker 會繼續提供快取中的舊版 index.html。

## 手機安裝

用 Safari 或 Chrome 開啟網址後，選「加入主畫面」即可像 App 一樣全螢幕使用。
首次上線後，可到「使用者專區 → 互動體驗與離線」把音檔下載到裝置，之後即可離線使用。

## 個人資料

`data/` 內是 GitHub 同步用的學習紀錄。若不想公開自己的進度，
可改用 private repository（Pages 需 GitHub Pro），或先刪掉 `data/` 再推。
程式在找不到該資料夾時會自動從空白開始，不影響功能。
