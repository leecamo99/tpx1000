TPX1000 V4.1 iPad Scroll Fixed
================================

本版已將修正直接合併進 index.html，不需要額外補丁檔。

修正：
1. 左側、中央、右側為三個獨立滾動區。
2. body 不再滾動，避免 iPad Safari 到底後整個介面脫離。
3. 中央保留至少 760px 實用寬度，不再把 AI 教練卡片壓成直排。
4. 可用寬度不足時，右欄自動改為滑出式工具抽屜。
5. 使用 100dvh 與 overscroll-behavior: contain。
6. Service Worker 更新為 kin-shell-v25。
