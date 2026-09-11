TPX1000 分類選單動態重建修正版
================================

症狀
----
不論選擇哪一本書或「我的收藏」，分類彈窗都固定顯示金のフレーズ的
600 / 730 / 860 / 990 / Supplement 分類；在收藏畫面則全部顯示 0 字。

根因
----
分類彈窗與兩個 select 的 option 寫死在 index.html，換書時只替換 DATA，
沒有重新建立分類清單。計數使用新 DATA，標籤卻仍是上一本文字的固定分類。

修正
----
1. 每次套用書籍後，從目前 DATA 的 level / section 動態建立分類。
2. 顯示名稱取目前資料的 level_label / section_label。
3. 換書時清除上一本文字的分類選取，重設為「全部」。
4. 「我的收藏」只顯示全部與實際存在的收藏分類，不再顯示 0 字舊分類。
5. 開啟分類彈窗前重新計算一次，收藏增刪後數量能立即更新。
6. 學習頁彈窗、隱藏 select、一覽頁 select 共用同一份動態分類。
7. 0 字分類不建立、不顯示。
8. sw.js 快取版本升至 kin-shell-v7。
9. roadmap.json 已新增完成項目 bug-dynamic-range-menu。

部署
----
把 index.html、sw.js、roadmap.json 覆蓋到專案根目錄，commit 並 push。
GitHub Pages 更新後，iPhone Safari 請刪除該網站資料或重新開啟網站，
確保新的 Service Worker（kin-shell-v7）接管。

預期結果
--------
- 金のフレーズ：顯示該書真正存在的 600、730、860、990、Supplement、Column。
- 我的收藏：12 筆收藏時顯示「全部 12 字」，不再列出整頁 0 字分類。
- 其他書籍：顯示該書自己的分類名稱與數量。
- 書籍切換後不殘留前一本的選取。

驗證
----
- index.html 18 個 inline script 區塊語法：0 錯誤
- sw.js node --check：通過
- roadmap.json JSON 解析：通過
- 動態分類建立、換書掛鉤、開啟前重算、動態過濾：均存在且唯一
