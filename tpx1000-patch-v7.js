/* ===========================================================
   TPX1000 Patch v7
   -----------------------------------------------------------
   安裝：把本檔存成  tpx1000-patch-v7.js  放在 index.html 同層，
         然後在 index.html 的 </body> 前一行加入：

             <script src="tpx1000-patch-v7.js"></script>

   本檔不改動原有函式定義，只在其外層包裝（monkey patch），
   移除補丁 = 移除那一行 script 即可完全還原。

   四項修正：
     [1] 閃卡播放：TTS 快取搬到 IndexedDB，X- 卡也能唸單字+例句
     [2] AI 記憶輔助：產生文字的同時自動生成圖片
     [3] iPad A10X 三欄卡頓：偵測舊機並降級渲染
     [4] Gemini 變慢：跳過 models.list 探測、縮短逾時、黏著成功模型
   =========================================================== */

(function () {
  'use strict';

  var TAG = '[TPX-Patch v7]';
  function log() {
    console.log.apply(console, [TAG].concat([].slice.call(arguments)));
  }

  /* =========================================================
     共用：IndexedDB 極簡封裝
     ========================================================= */

  var IDB = (function () {
    var DB = 'tpx1000-cache', VER = 1, dbp = null;

    function open() {
      if (dbp) return dbp;
      dbp = new Promise(function (res, rej) {
        var q = indexedDB.open(DB, VER);
        q.onupgradeneeded = function () {
          var db = q.result;
          if (!db.objectStoreNames.contains('tts')) db.createObjectStore('tts');
          if (!db.objectStoreNames.contains('img')) db.createObjectStore('img');
        };
        q.onsuccess = function () { res(q.result); };
        q.onerror = function () { rej(q.error); };
      });
      return dbp;
    }

    function tx(store, mode) {
      return open().then(function (db) {
        return db.transaction(store, mode).objectStore(store);
      });
    }

    return {
      get: function (store, key) {
        return tx(store, 'readonly').then(function (os) {
          return new Promise(function (res) {
            var r = os.get(key);
            r.onsuccess = function () { res(r.result || null); };
            r.onerror = function () { res(null); };
          });
        }).catch(function () { return null; });
      },
      put: function (store, key, val) {
        return tx(store, 'readwrite').then(function (os) {
          return new Promise(function (res) {
            var r = os.put(val, key);
            r.onsuccess = function () { res(true); };
            r.onerror = function () { res(false); };
          });
        }).catch(function () { return false; });
      },
      keys: function (store) {
        return tx(store, 'readonly').then(function (os) {
          return new Promise(function (res) {
            var r = os.getAllKeys();
            r.onsuccess = function () { res(r.result || []); };
            r.onerror = function () { res([]); };
          });
        }).catch(function () { return []; });
      },
      del: function (store, key) {
        return tx(store, 'readwrite').then(function (os) {
          os.delete(key);
          return true;
        }).catch(function () { return false; });
      },
      clear: function (store) {
        return tx(store, 'readwrite').then(function (os) {
          os.clear();
          return true;
        }).catch(function () { return false; });
      }
    };
  })();

  window.TPX_IDB = IDB;


  /* =========================================================
     [1] 閃卡播放：TTS 快取改用 IndexedDB
     -----------------------------------------------------------
     原本 ttsCachePut 存在 localStorage，上限 60 筆。
     base64 MP3 每筆約 10~40KB，60 筆就逼近 localStorage 的
     5MB 上限，於是會不斷淘汰、不斷重新請求 Google TTS。

     這裡用 IndexedDB 做第二層（容量以百MB計），
     localStorage 那層維持不動當作 L1 熱快取。
     ========================================================= */

  (function patchTTS() {
    var origSpeak = window.kinSpeak;
    if (typeof origSpeak !== 'function') {
      log('找不到 kinSpeak，跳過 TTS 快取強化');
      return;
    }

    function voice() {
      try { return localStorage.getItem('kinVoice') || 'en-US-Neural2-C'; }
      catch (e) { return 'en-US'; }
    }
    function ck(text) {
      return voice() + '|' + String(text).toLowerCase().trim();
    }

    // 播放 base64 音訊（複製原本 ttsPlayB64 的行為，避免依賴內部變數）
    var patchAudio = null;
    function playB64(b64, onend, rate) {
      try {
        if (patchAudio) {
          patchAudio.onended = null;
          patchAudio.onerror = null;
          patchAudio.pause();
        }
      } catch (e) {}

      var a = new Audio('data:audio/mp3;base64,' + b64);
      patchAudio = a;
      try {
        a.playbackRate = rate || parseFloat(localStorage.getItem('kinSpeed')) || 1;
      } catch (e) {}

      a.onended = function () { if (typeof onend === 'function') onend(); };
      a.onerror = function () { if (typeof onend === 'function') onend(); };
      a.play().catch(function () { if (typeof onend === 'function') onend(); });
    }

    window.kinSpeak = function (text, onend) {
      if (!text) return false;

      var key = '';
      try { key = localStorage.getItem('kinTtsKey') || ''; } catch (e) {}
      var src = '';
      try { src = localStorage.getItem('kinVoiceSrc') || ''; } catch (e) {}

      // 沒金鑰或指定系統語音 → 交回原函式
      if (!key || src === 'system') return origSpeak(text, onend);

      var k = ck(text);

      // 先問 IndexedDB（L2）
      IDB.get('tts', k).then(function (hit) {
        if (hit && hit.b64) {
          playB64(hit.b64, onend);
          // 順手更新使用時間，供 LRU 淘汰
          IDB.put('tts', k, { b64: hit.b64, at: Date.now(), text: String(text) });
          return;
        }

        // L2 沒有 → 走原流程，並攔截結果寫入 L2
        var captured = false;
        var origFetch = window.fetch;

        window.fetch = function (url, opt) {
          var p = origFetch.apply(this, arguments);
          if (!captured && String(url).indexOf('texttospeech.googleapis.com') >= 0) {
            captured = true;
            window.fetch = origFetch; // 立刻還原，只攔這一次
            p.then(function (r) {
              return r.clone().json();
            }).then(function (j) {
              if (j && j.audioContent) {
                IDB.put('tts', k, {
                  b64: j.audioContent,
                  at: Date.now(),
                  text: String(text)
                });
              }
            }).catch(function () {});
          }
          return p;
        };

        // 保險：500ms 後無論如何都還原 fetch
        setTimeout(function () {
          if (window.fetch !== origFetch && !captured) window.fetch = origFetch;
        }, 500);

        origSpeak(text, onend);
      });

      return true;
    };

    /* ---- X- 收藏卡：補上例句欄位讓 speakEntry 能唸 ----
       收藏卡的例句存在 srcEx，但 speakEntry 讀的是 e.en。 */
    var origSpeakEntry = window.speakEntry;
    if (typeof origSpeakEntry === 'function') {
      window.speakEntry = function (e, times, onDone) {
        if (e && !e.en && e.srcEx) {
          e = Object.assign({}, e, { en: e.srcEx });
        }
        return origSpeakEntry(e, times, onDone);
      };
    }

    /* ---- LRU 淘汰：超過 600 筆時砍掉最舊的 150 筆 ---- */
    function sweepTTS() {
      IDB.keys('tts').then(function (ks) {
        if (ks.length < 600) return;
        var jobs = ks.map(function (k) {
          return IDB.get('tts', k).then(function (v) {
            return { k: k, at: (v && v.at) || 0 };
          });
        });
        Promise.all(jobs).then(function (all) {
          all.sort(function (a, b) { return a.at - b.at; });
          all.slice(0, 150).forEach(function (x) { IDB.del('tts', x.k); });
          log('TTS 快取淘汰 150 筆');
        });
      });
    }
    setTimeout(sweepTTS, 8000);

    log('[1] TTS 快取已接上 IndexedDB');
  })();


  /* =========================================================
     [2] AI 記憶輔助：文字生成完成後自動生成圖片
     -----------------------------------------------------------
     原本流程：按「AI 記憶輔助」→ 出文字 → 再手動按「生成圖片」
     改為：文字回來、拿到 image_prompt 後立刻自動觸發圖片。
     仍保留手動「重新生成圖片」按鈕。
     ========================================================= */

  (function patchMnemoImage() {
    var tries = 0;
    var timer = setInterval(function () {
      tries++;
      if (tries > 40) { clearInterval(timer); return; }

      if (!window.KIN_MNEMO || !window.KIN_MNEMO.set) return;
      if (!window.KIN_MNEMO_IMG || !window.KIN_MNEMO_IMG.gen) return;
      if (window.KIN_MNEMO.__autoImgPatched) return;

      clearInterval(timer);

      var origSet = window.KIN_MNEMO.set;
      var pending = {};

      window.KIN_MNEMO.set = function (id, data) {
        var r = origSet.apply(this, arguments);

        // 條件：有圖像描述、還沒有圖、且不在生成中
        if (data && data.image_prompt && !data.img && !pending[id]) {
          var on = false;
          try { on = localStorage.getItem('kinCfAiEnabled') === '1'; } catch (e) {}
          var url = '';
          try { url = (localStorage.getItem('kinCfAiWorkerUrl') || '').trim(); } catch (e) {}

          if (on && url) {
            pending[id] = true;
            log('[2] 自動生成圖片：', id);

            // 在面板上顯示進度
            var box = document.getElementById('uxMnemo');
            var m = box && box.querySelector('.mn-msg');
            if (m) { m.textContent = '助記已產生，圖片生成中…'; m.className = 'mn-msg'; }

            window.KIN_MNEMO_IMG.gen(data.image_prompt).then(function (src) {
              var cur = window.KIN_MNEMO.get(id) || data;
              cur.img = src;
              origSet.call(window.KIN_MNEMO, id, cur);

              // 觸發原本的 wire() 重繪（它每 600ms 掃一次）
              var b = box && box.querySelector('[data-act="img"]');
              if (b) b.textContent = '重新生成圖片';

              // 直接畫上去，不等輪詢
              var body = box && box.querySelector('.mn-body');
              if (body && !body.querySelector('.mn-img')) {
                var T = window.KIN_MNEMO_IMG.THUMB || 128;
                var w = document.createElement('div');
                w.className = 'mn-img';
                w.innerHTML = '<img src="' + src + '" alt="" width="' + T +
                  '" height="' + T + '" loading="lazy" decoding="async">';
                w.querySelector('img').addEventListener('click', function () {
                  w.classList.toggle('big');
                });
                body.insertBefore(w, body.querySelector('.mn-act') || null);
              }

              if (m) {
                m.textContent = '助記與圖片已完成';
                setTimeout(function () {
                  if (m.textContent === '助記與圖片已完成') m.textContent = '';
                }, 4000);
              }
            }).catch(function (err) {
              log('[2] 圖片生成失敗：', err.message);
              if (m) {
                m.textContent = '助記已產生（圖片失敗：' + err.message + '）';
                m.className = 'mn-msg err';
              }
            }).then(function () {
              delete pending[id];
            });
          }
        }
        return r;
      };

      window.KIN_MNEMO.__autoImgPatched = true;
      log('[2] AI 記憶輔助已改為文字+圖片同時生成');
    }, 300);
  })();


  /* =========================================================
     [3] iPad A10X 三欄卡頓
     -----------------------------------------------------------
     A10X 上最貴的是 backdrop-filter 與大量陰影，
     三欄同時存在時成本乘三。
     ========================================================= */

  (function patchIPad() {

    function isLegacyIPad() {
      var ua = navigator.userAgent;
      var iPad = /iPad/.test(ua) ||
                 (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
      if (!iPad) return false;

      var cores = navigator.hardwareConcurrency || 2;
      var w = Math.min(screen.width, screen.height);
      var h = Math.max(screen.width, screen.height);

      // 10.5" = 834x1112, 9.7" = 768x1024, 12.9" 一二代 = 1024x1366
      var oldSize = (w === 768 && h === 1024) ||
                    (w === 834 && h === 1112) ||
                    (w === 1024 && h === 1366);

      var gpu = '';
      try {
        var gl = document.createElement('canvas').getContext('webgl');
        var ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
        if (ext) gpu = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '';
      } catch (e) {}

      var oldGPU = /A9X|A10X|Apple A9|Apple A10/i.test(gpu);
      return oldGPU || (oldSize && cores <= 3);
    }

    var force = false;
    try { force = localStorage.getItem('tpxLegacyMode') === '1'; } catch (e) {}

    var legacy = force || isLegacyIPad();
    if (!legacy) {
      log('[3] 非舊款 iPad，未啟用降級');
      window.tpxForceLegacy = function (on) {
        try { localStorage.setItem('tpxLegacyMode', on === false ? '0' : '1'); } catch (e) {}
        location.reload();
      };
      return;
    }

    document.documentElement.classList.add('tpx-legacy');

    var css = document.createElement('style');
    css.id = 'tpxLegacyStyle';
    css.textContent = [
      /* 1. 移除毛玻璃：A10X 上每一幀都要重新合成整層背景 */
      '.tpx-legacy *{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}',
      '.tpx-legacy #ixLeft,.tpx-legacy #ixRight,.tpx-legacy #ixTop,',
      '.tpx-legacy .player-bar,.tpx-legacy .bottom-nav{background-color:#0d0d0d!important}',

      /* 2. 陰影簡化成單層邊框 */
      '.tpx-legacy .ix-card,.tpx-legacy .card,.tpx-legacy #nwBox,',
      '.tpx-legacy .mn-body{box-shadow:none!important;border:1px solid rgba(255,255,255,.08)}',

      /* 3. 三欄各自獨立繪製，捲動時不互相觸發重排 */
      '.tpx-legacy #ixLeft,.tpx-legacy #ixRight{contain:layout paint style;transform:translateZ(0)}',

      /* 4. 螢幕外的列表項不繪製 */
      '.tpx-legacy .ix-card,.tpx-legacy .ix-row,.tpx-legacy .gmr-row{content-visibility:auto;contain-intrinsic-size:auto 60px}',

      /* 5. 動畫只留 transform / opacity，並縮短時間 */
      '.tpx-legacy *{transition-property:transform,opacity,background-color,color!important;transition-duration:.12s!important}',
      '.tpx-legacy *{animation-duration:.2s!important}',

      /* 6. 大面積漸層改純色 */
      '.tpx-legacy [style*="gradient"]{background-image:none!important}',

      /* 7. 助記圖限制解碼尺寸 */
      '.tpx-legacy .mn-img img{max-width:128px;height:auto}',

      /* 8. 捲動容器隔離 */
      '.tpx-legacy #ixLeft,.tpx-legacy #ixRight,.tpx-legacy #ixWeakView,',
      '.tpx-legacy #ixDailyView{overscroll-behavior:contain;-webkit-overflow-scrolling:touch}'
    ].join('\n');
    document.head.appendChild(css);

    /* 捲動期間暫停非必要工作 */
    function wireScroll() {
      ['ixLeft', 'ixRight'].forEach(function (id) {
        var el = document.getElementById(id);
        if (!el || el.__tpxScroll) return;
        el.__tpxScroll = true;
        var t = null;
        el.addEventListener('scroll', function () {
          el.classList.add('is-scrolling');
          clearTimeout(t);
          t = setTimeout(function () { el.classList.remove('is-scrolling'); }, 140);
        }, { passive: true });
      });
    }
    setTimeout(wireScroll, 1500);

    /* 切到背景時停掉語音，避免 iOS 回前景後卡頓 */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {}
      }
    });

    /* 緊急模式：三欄降兩欄 */
    window.tpxTwoPane = function () {
      var r = document.getElementById('ixRight');
      if (r) r.style.display = 'none';
      log('[3] 已隱藏右欄');
    };

    window.tpxForceLegacy = function (on) {
      try { localStorage.setItem('tpxLegacyMode', on === false ? '0' : '1'); } catch (e) {}
      location.reload();
    };

    log('[3] 已啟用舊款 iPad 降級模式');
  })();


  /* =========================================================
     [4] Gemini 變慢
     -----------------------------------------------------------
     原因有三：
       a. 每次 call() 都先 discover()，快取失效時多一次往返
       b. request() 的逾時是 45 秒，掛住的模型會拖垮整輪
       c. FALLBACK 寫的是 gemini-3.6-flash（不存在的版號），
          探索失敗時會拿無效模型去打，必然 404 再重試
     ========================================================= */

  (function patchGemini() {
    var tries = 0;
    var timer = setInterval(function () {
      tries++;
      if (tries > 40) { clearInterval(timer); return; }
      if (!window.KIN_GM || !window.KIN_GM.call) return;

      clearInterval(timer);

      var STICKY = 'tpxGmSticky';
      var STICKY_MS = 30 * 60 * 1000;

      /* ---- 已知可用的模型優先序（手動維護，不做線上探索） ---- */
      var PREFERRED = [
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite',
        'gemini-1.5-flash',
        'gemini-1.5-flash-8b'
      ];

      function getSticky() {
        try {
          var s = JSON.parse(localStorage.getItem(STICKY) || 'null');
          if (s && s.at && Date.now() - s.at < STICKY_MS) return s.model;
        } catch (e) {}
        return '';
      }
      function setSticky(m) {
        try {
          localStorage.setItem(STICKY, JSON.stringify({ model: m, at: Date.now() }));
        } catch (e) {}
      }
      function clearSticky() {
        try { localStorage.removeItem(STICKY); } catch (e) {}
      }

      /* ---- 直呼單一模型，逾時 15 秒（原本 45 秒太長） ---- */
      function directCall(model, key, payload, timeoutMs) {
        var ctl = new AbortController();
        var t = setTimeout(function () { ctl.abort(); }, timeoutMs || 15000);
        var url = 'https://generativelanguage.googleapis.com/v1beta/models/' +
                  encodeURIComponent(model) + ':generateContent?key=' +
                  encodeURIComponent(key);

        return fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: ctl.signal
        }).then(function (r) {
          clearTimeout(t);
          return r.text().then(function (txt) {
            var j = {};
            try { j = JSON.parse(txt); } catch (e) {}
            if (r.ok) return j;
            var err = new Error((j.error && j.error.message) || ('HTTP ' + r.status));
            err.status = r.status;
            throw err;
          });
        }, function (e) {
          clearTimeout(t);
          var err = new Error(e && e.name === 'AbortError' ? 'Gemini 逾時（15秒）' : (e.message || '網路錯誤'));
          err.net = true;
          throw err;
        });
      }

      function keys() {
        try {
          var a = JSON.parse(localStorage.getItem('kinGeminiKeys') || '[]');
          if (Array.isArray(a) && a.length) {
            return a.map(function (k) { return String(k || '').trim(); }).filter(Boolean);
          }
        } catch (e) {}
        var k = '';
        try { k = (localStorage.getItem('kinGeminiKey') || '').trim(); } catch (e) {}
        return k ? [k] : [];
      }

      var origCall = window.KIN_GM.call;

      window.KIN_GM.call = function (payload, opts) {
        var ks = keys();
        if (!ks.length) return origCall(payload, opts);

        // 短輸出關掉 thinking，2.0 flash 上差距明顯
        try {
          if (payload && payload.generationConfig &&
              (payload.generationConfig.maxOutputTokens || 0) <= 1024) {
            payload.generationConfig.thinkingConfig = { thinkingBudget: 0 };
          }
        } catch (e) {}

        var t0 = Date.now();
        var sticky = getSticky();
        var order = PREFERRED.slice();
        if (sticky) {
          var i = order.indexOf(sticky);
          if (i > 0) { order.splice(i, 1); order.unshift(sticky); }
          else if (i < 0) order.unshift(sticky);
        }

        var ki = 0;
        var mi = 0;
        var notes = [];

        function attempt() {
          if (mi >= order.length) {
            // 快速路徑全滅 → 回退到原本的完整路由（含 models.list 探索）
            log('[4] 快速路徑失敗，回退原路由：', notes.join(' / '));
            return origCall(payload, opts);
          }

          var model = order[mi];
          var key = ks[ki % ks.length];

          return directCall(model, key, payload, 15000).then(function (j) {
            setSticky(model);
            log('[4] ' + model + ' 成功 ' + (Date.now() - t0) + 'ms');
            return j;
          }, function (err) {
            notes.push(model + ' ' + (err.status || 'net'));

            if (err.status === 404) {
              // 模型不存在 → 換下一個模型
              if (getSticky() === model) clearSticky();
              mi++;
              return attempt();
            }
            if (err.status === 429 || err.status === 403) {
              // 配額或權限 → 先換金鑰，金鑰用完才換模型
              ki++;
              if (ki < ks.length) return attempt();
              ki = 0; mi++;
              return attempt();
            }
            if (err.status === 503 || err.status === 500 || err.net) {
              // 暫時性 → 換模型（不重試同一個，避免又等 15 秒）
              mi++;
              return attempt();
            }
            if (err.status === 400) {
              // 請求本身有問題，重試無意義
              throw err;
            }
            mi++;
            return attempt();
          });
        }

        return attempt();
      };

      /* ---- 診斷：實測各模型延遲，只在手動呼叫時執行 ---- */
      window.tpxGmProbe = function () {
        var ks = keys();
        if (!ks.length) { console.warn('尚未設定金鑰'); return; }
        var payload = {
          contents: [{ parts: [{ text: 'Say OK.' }] }],
          generationConfig: { maxOutputTokens: 8, thinkingConfig: { thinkingBudget: 0 } }
        };
        var rows = [];
        var chain = Promise.resolve();

        PREFERRED.forEach(function (m) {
          chain = chain.then(function () {
            var t = Date.now();
            return directCall(m, ks[0], payload, 12000).then(function () {
              rows.push({ 模型: m, 可用: '✓', 延遲: (Date.now() - t) + 'ms' });
            }, function (e) {
              rows.push({ 模型: m, 可用: '✗', 延遲: (Date.now() - t) + 'ms', 錯誤: (e.message || '').slice(0, 50) });
            });
          });
        });

        return chain.then(function () {
          console.table(rows);
          var ok = rows.filter(function (r) { return r.可用 === '✓'; })
                       .sort(function (a, b) { return parseInt(a.延遲) - parseInt(b.延遲); })[0];
          if (ok) { setSticky(ok.模型); log('已鎖定最快模型：', ok.模型); }
          return rows;
        });
      };

      window.tpxGmStatus = function () {
        console.table({
          '目前偏好模型': getSticky() || '（無，照預設順序）',
          '金鑰數': keys().length,
          '逾時設定': '15 秒（原 45 秒）',
          '模型順序': PREFERRED.join(' → ')
        });
      };

      window.tpxGmReset = function () {
        clearSticky();
        log('已清除模型偏好');
      };

      log('[4] Gemini 路由已加速（跳過探索、逾時 45s→15s）');
    }, 300);
  })();


  /* =========================================================
     診斷工具
     ========================================================= */

  window.tpxDiag = function () {
    var out = {};
    out['補丁版本'] = 'v7';
    out['裝置'] = document.documentElement.classList.contains('tpx-legacy')
      ? '舊款 iPad（已降級）' : '一般裝置';
    out['螢幕'] = screen.width + ' x ' + screen.height + ' @' + (window.devicePixelRatio || 1) + 'x';
    out['核心數'] = navigator.hardwareConcurrency || '未知';
    out['DOM 節點'] = document.getElementsByTagName('*').length;

    var blur = 0;
    var all = document.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var s = getComputedStyle(all[i]);
      if (s.backdropFilter && s.backdropFilter !== 'none') blur++;
    }
    out['backdrop-filter'] = blur + (blur ? ' ⚠' : ' ✓');

    out['Gemini 偏好'] = (function () {
      try {
        var s = JSON.parse(localStorage.getItem('tpxGmSticky') || 'null');
        return s ? s.model : '（無）';
      } catch (e) { return '（無）'; }
    })();

    console.table(out);

    IDB.keys('tts').then(function (ks) {
      console.log(TAG, 'TTS 快取（IndexedDB）：' + ks.length + ' 筆');
    });

    return out;
  };

  window.tpxFps = function (sec) {
    sec = sec || 3;
    var n = 0, t0 = performance.now();
    return new Promise(function (res) {
      (function tick() {
        n++;
        if (performance.now() - t0 < sec * 1000) requestAnimationFrame(tick);
        else {
          var fps = (n / sec).toFixed(1);
          console.log(TAG, 'FPS ' + fps + ' — ' +
            (fps >= 55 ? '順暢' : fps >= 40 ? '可接受' : '明顯卡頓'));
          res(parseFloat(fps));
        }
      })();
    });
  };

  window.tpxClearCache = function () {
    IDB.clear('tts');
    IDB.clear('img');
    log('已清除補丁快取');
  };

  log('載入完成。輸入 tpxDiag() 查看狀態。');
})();
