# TPX1000 資料編輯版

## 這版修正什麼

較新的單檔版 `index.html` 原本把 kin1000 資料內嵌在頁面中，且書籍設定的 `file` 是空字串，所以修改 `books/kin1000.js` 不會反映在 App。

本版將 `books/kin1000.js` 設為 kin1000 的主要資料來源，載入時加入 cache-bust；只有外部檔案無法載入時才退回內嵌備援資料。

## 使用編輯模式

1. 點右下角「工具」。
2. 在「資料編輯」按「啟用」。
3. 開啟要修正的單字或「我的收藏」閃卡。
4. 按「編輯這筆資料」。
5. 修改後按「儲存並覆寫 GitHub」。

## GitHub 設定

先點上方雲朵設定：

- Repository owner
- Repository name
- Branch（通常是 `main`）
- Fine-grained Token，該 repository 權限需為 **Contents: Read and write**

Token 僅保存在目前瀏覽器的 localStorage，不會寫進專案檔。

## 寫入方式

- 一般書籍：先讀取 GitHub 最新檔案與 SHA，只替換相同 `id` 的資料，再 PUT 回對應 JS 檔。
- 我的收藏：更新收藏資料，再立即呼叫既有的 GitHub 學習紀錄同步。
- 寫入前會顯示確認；若 GitHub 回傳 409，系統不會覆蓋其他人的更新。
- 成功後目前畫面立即更新，並清除該書資料快取。

## 部署

至少更新：

- `index.html`
- `books/kin1000.js`

如果網站有啟用外部 Service Worker，也一併更新 `sw.js`。
