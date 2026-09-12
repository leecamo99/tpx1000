TPX1000 V3.6 SMART ROUTING
===========================

此版把 ListModels 資料真正轉成 Key × 模型 × 功能路由。

功能路由：
- 閃卡短句：優先 Flash / Flash-Lite
- AI 記憶輔助：優先 Flash / Flash-Lite
- AI 教練：優先 Flash，再 Pro
- 錯題分析：優先 Pro，再 Flash
- 助記圖片：只選圖片模型

狀態：
- ✅ 實際成功
- ⏳ 429 暫時限流
- 🔒 403 無權限
- ❌ 404 模型不可用
- ○ 目錄可見但尚未實測

ListModels 只建立候選清單。每次真正呼叫後，系統記錄對應 Key × 模型 × 功能的結果；下次優先使用實際成功的組合。文字 429 不會鎖住圖片模型。

本路由模組刻意放在 index.html 最後一個 script，避免再被舊版 KIN_GM 覆蓋。
Service Worker: kin-shell-v21。
