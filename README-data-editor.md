# TPX1000 資料編輯版

## 這版修正什麼

較新的單檔版 `index.html` 原本把 kin1000 資料內嵌在頁面中，且書籍設定的 `file` 是空字串，所以修改 `books/kin1000.js` 不會反映在 App。

本版將 `books/kin1000.js` 設為 kin1000 的主要資料來源，載入時加入 cache-bust；只有外部檔案無法載入時才退回內嵌備援資料。

## 使用編輯模式

1. 點右下角「工具」。
2. 在「資料編輯」按「啟用」。
3. 開啟要修正的單字或「我的收藏」閃卡。
4. 按「編輯這筆資料」。
5. 可直接修改主要英文例句及繁體中文翻譯。
6. 若該條目有多個義項，編輯器會逐一列出每個義項的詞性、意思、英文例句與繁中翻譯。
7. 修改後按「儲存並覆寫 GitHub」。

## GitHub 設定

先點上方雲朵設定：

- Repository owner
- Repository name
- Branch（通常是 `main`）
- Fine-grained Token，該 repository 權限需為 **Contents: Read and write**

Token 僅保存在目前瀏覽器的 localStorage，不會寫進專案檔。

## 高亮與無損寫入

- 寫入時不再 `JSON.stringify` 整個題庫陣列，只定位並替換目前編輯的單一條目。
- 指定條目以外的原始檔內容逐位元保持不變。
- 高亮所需欄位在 PUT 前會做結構檢查；若格式不正確，儲存會中止。
- 英文高亮仍由 `word` 對應 `en`／`senses[n].en`；中文高亮仍由 `mean` 對應 `ja`，或由 `senses[n].mean` 對應 `senses[n].zh`。

## 寫入方式

- 一般書籍：先讀取 GitHub 最新檔案與 SHA，只合併相同 `id` 的可編輯欄位，再 PUT 回對應 JS 檔。
- 主要例句寫回 `en` / `ja`；多義例句逐項寫回 `senses[n].en` / `senses[n].zh`。
- 條目的 `level`、`source` 等未編輯欄位，以及每個 sense 內的額外 metadata 都會保留。若 GitHub 上的義項數量已改變，儲存會中止並要求重新開啟編輯器。
- 我的收藏：更新收藏資料，再立即呼叫既有的 GitHub 學習紀錄同步。
- 寫入前會顯示確認；若 GitHub 回傳 409，系統不會覆蓋其他人的更新。
- 成功後目前畫面立即更新，並清除該書資料快取。

## 部署

至少更新：

- `index.html`
- `books/kin1000.js`

如果網站有啟用外部 Service Worker，也一併更新 `sw.js`。
