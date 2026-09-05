# 金のフレーズ 全集合 App

TOEIC《金のフレーズ》改訂版單字 App，含 1817 筆單字與 3267 個逐句音檔。

## 本地測試

因為瀏覽器的 CORS 限制，**直接雙擊 index.html 會無法播放音檔**，必須用本機伺服器：

```bash
python serve.py
```

然後開啟 http://localhost:8000

上傳前可先自檢：

```bash
python check.py
```

## 部署到 GitHub Pages

```bash
git init
git add .
git commit -m "init"
git branch -M main
git remote add origin https://github.com/<你的帳號>/<repo>.git
git push -u origin main
```

推上去後到 repo 的 **Settings → Pages**，Source 選 `main` / `root`，等一兩分鐘即可透過
`https://<你的帳號>.github.io/<repo>/` 開啟。

`.nojekyll` 已包含在內，避免 GitHub Pages 的 Jekyll 略過某些檔案。

## 內容

| 單元 | 筆數 | 音檔來源 |
|---|---|---|
| 本編 1000 語 | 1000 | en01–04, 09–11, 15, 16, 18 |
| Supplement 1 題幹・選項用語 | 30 | en05 |
| Supplement 2 Part 1 頻出語 | 150 | en06 |
| Supplement 3 部門・職業名 | 130 | en12 |
| Supplement 4 前置詞・接續詞 | 49 | en13 |
| Supplement 5 頻出複合名詞 | 54 | en14 |
| Supplement 6 多義語 | 109 | en17 |
| Supplement 7 頻出表現 | 150 | en19 |
| Column 1 Part 1 總結單字 | 68 | en07 |
| Column 2 日常單字 | 77 | en08 |

## 音檔命名

```
001_w.mp3       本編第 1 個單字的發音
001_p1.mp3      該單字的例句
S6-071_w.mp3    Supplement 6 第 71 個單字
S6-071_p1.mp3   該單字的第 1 個語意例句
S6-071_p2.mp3   第 2 個語意例句（多義語會有多個）
C1-001_w.mp3    Column 1 第 1 個
C-001_w.mp3     Column 2 第 1 個
```

## 對位方式

原始 App 的音檔時間軸是用時間估算的，Supplement 與 Column 大量脫軌。
本版改以錄音的實際結構重建：

- 錄音規律為「單字唸 1 次 + 每個例句唸 2 次」，條目間靜音約 1.5 秒、條目內約 1.2 秒
- 以靜音偵測切出段落，用 1.4 秒門檻切分條目
- 純單字表（Column、Supplement 3/4/7）中含「/」的並列詞會唸兩次，另行處理

驗證結果（例句字元數與實際音長的相關係數）：
本編 0.93、Supplement 1 0.91、Supplement 5 0.87、Supplement 2 0.83、Supplement 6 0.82。
