TPX1000 V3.6 REBUILT
======================

此包以使用者現存的 V3.3 為基線，重新合併 V3.4 至 V3.6。

修復：
1. 移除不存在 books/test001.js 的 test001 假書。
2. 閃卡補充、金鑰測試、AI 教練、AI 錯題分析全部走多金鑰層。
3. 學習範圍依目前 DATA 動態產生，並以 kinLevels:<使用者>:<書籍> 分開保存。
4. 配額冷卻改為 API Key × 模型，文字模型配額不再鎖住圖片。
5. 金鑰管理新增 ListModels 偵測，顯示每支金鑰實際可用的文字/圖片模型。
6. 偵測結果會重排模型優先順序，不只顯示。
7. Service Worker 版本為 kin-shell-v20。

驗證：全部 inline JavaScript 已執行 node --check；ZIP 完整性已驗證。
