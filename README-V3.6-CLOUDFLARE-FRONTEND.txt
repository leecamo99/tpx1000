TPX1000 V3.6 CLOUDFLARE FRONTEND
================================

前端設定：使用者專區可輸入 Cloudflare Worker 公開 URL、開啟圖片功能、測試 /health、清除設定。
生成契約：POST {WORKER_URL}/image，JSON body: {prompt,width:512,height:512,steps:4}。
支援回應：直接 image/* Blob；或 JSON {base64,mimeType}；或 JSON {image:dataURL}；或 JSON {url}。
安全：前端不保存 Cloudflare Account ID / API Token。Token 應保存在 Worker Secret。
生成成功後仍縮成 96×96 WebP 品質 0.55，沿用原本單字助記快取。
Worker 必須提供 GET /health 並允許 GitHub Pages 網域 CORS。
Service Worker: kin-shell-v22。
