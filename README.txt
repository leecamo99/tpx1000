上傳說明
========

請把以下兩個檔案一起上傳到網站原本 index.html 所在的同一層：

1. index.html
2. question-explanations.js

本次修改
--------
- 一般測驗答題後顯示「答案解析」卡片。
- 解析會依題型（英翻中、中翻英、聽力、拼字、例句填空）自動整理。
- 解析內容只使用現有單字資料：單字、中文意思、詞性、例句、翻譯與原書補充，不另外杜撰內容。
- 完整檢討頁會保留每題解析。
- 匯入 JSON 題庫後，作答時會顯示正確選項、原題解析與題目翻譯。
- 不需要建置工具，也不需要安裝套件。

注意
----
- question-explanations.js 必須與 index.html 放在同一層，檔名不要更改。
- 原網站既有的 books.js、books/、audio/、icons/、manifest.webmanifest 與 sw.js 請保留。
- 若網站有 CDN 或 Service Worker 快取，上傳後請清除快取或更新版本再測試。
