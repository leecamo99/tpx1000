# Shiko600 整合說明

## 已完成

- `index.html` 會依序載入 `books.js` 與 `shiko600.js`，並把題庫轉成原 App 可使用的書籍資料。
- `books.js` 新增 `shiko600` 書籍項目，共 600 題。
- `sw.js` 快取版本更新為 `kin-shell-v57-shiko600`，核心快取包含 `shiko600.js` 與 `books/kin1000.js`，並支援 JS、圖片與 MP3 Range 請求。
- TEST 1、TEST 2、TEST 3 各 200 題，可在「學習範圍」切換。
- 題目頁支援選項作答、檢查答案、系統語音朗讀，以及可選的圖片／MP3 欄位。

## Shiko600 媒體欄位

目前提供的 `shiko600.js` 沒有實際圖片或 MP3 路徑，因此視覺題會明確顯示「未提供圖檔路徑」，音訊區會顯示「未提供 MP3」，不會產生失敗的隱藏請求。

如要加入媒體，可在題目物件加入下列任一欄位；相對路徑會分別接在 `images/shiko600/` 與 `audio/shiko600/` 後面：

- 圖片：`image`、`imageSrc`、`imageFile` 或 `media.image`
- 音訊：`audio`、`audioSrc`、`audioFile` 或 `media.audio`

例如：

```js
{
  id: 'T1-Q001',
  image: 'T1/Q001.webp',
  audio: 'T1/Q001.mp3'
}
```

## 啟動

- 可直接以 `file://` 開啟 `index.html`；Shiko600 題庫與作答介面可正常使用。
- 若要使用 Service Worker、離線快取與 MP3 Range 請求，請透過 HTTP/HTTPS 靜態伺服器開啟。

## 資料編輯模式

- 從右下角「工具」啟用「資料編輯」，進入單字解說頁後按「編輯這筆資料」。
- 一般書籍會先讀取 GitHub 最新檔案與 SHA，只替換該筆 `data`，再提交到 `books/kin1000.js` 等對應來源檔。
- 「我的收藏」可直接修正中文、詞性、音標與例句，並沿用既有 GitHub 學習紀錄同步。
- GitHub Fine-grained Token 需有該 repository 的 **Contents: Read and write** 權限；Token 仍只儲存在目前瀏覽器的 localStorage。
- 書籍資料改為 network-first 並在載入時加版本參數，修正更新 `kin1000.js` 後仍看到舊快取的問題。
