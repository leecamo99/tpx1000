/* ===== 金のフレーズ 單字 App - Service Worker ===== */
var VER = 'kin-shell-v22';
var AUDIO = 'kin-audio-v1';
var CORE = ['./', './index.html', './books.js', './manifest.webmanifest', './roadmap.html', './roadmap.json', './devtools.html'];

self.addEventListener('install', function(ev){
  ev.waitUntil(caches.open(VER).then(function(c){
    return Promise.all(CORE.map(function(u){ return c.add(u).catch(function(){}); }));
  }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(ev){
  ev.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){ if(k !== VER && k !== AUDIO) return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
function isAudio(url){ return /\.mp3(\?.*)?$/i.test(url.pathname); }
function isBookData(url){ return /\/books\/[^\/]+\.js$/i.test(url.pathname) || /\/books\.js$/i.test(url.pathname); }
function isPage(req, url){ return req.mode === 'navigate' || /\/(index\.html)?$/i.test(url.pathname) || (req.headers.get('accept')||'').indexOf('text/html') >= 0; }
function rangeResponse(req, full){
  var range = req.headers.get('range');
  if(!range) return Promise.resolve(full);
  return full.arrayBuffer().then(function(buf){
    var total=buf.byteLength, m=/bytes=(\d*)-(\d*)/.exec(range);
    var start=m&&m[1]?parseInt(m[1],10):0;
    var end=m&&m[2]?Math.min(parseInt(m[2],10),total-1):total-1;
    if(start>=total) return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+total}});
    var slice=buf.slice(start,end+1), h=new Headers();
    h.set('Content-Type',full.headers.get('Content-Type')||'audio/mpeg');
    h.set('Content-Range','bytes '+start+'-'+end+'/'+total);
    h.set('Content-Length',String(slice.byteLength)); h.set('Accept-Ranges','bytes');
    return new Response(slice,{status:206,statusText:'Partial Content',headers:h});
  });
}
self.addEventListener('fetch', function(ev){
  var req=ev.request; if(req.method!=='GET') return;
  var url; try{url=new URL(req.url);}catch(e){return;}
  if(url.origin!==self.location.origin) return;
  if(isAudio(url)){
    ev.respondWith(caches.open(AUDIO).then(function(cache){
      var key=new Request(url.href);
      return cache.match(key).then(function(hit){
        if(hit) return rangeResponse(req,hit.clone());
        return fetch(new Request(url.href,{cache:'no-store'})).then(function(res){
          if(res&&res.ok&&res.status===200){cache.put(key,res.clone()).catch(function(){});return rangeResponse(req,res);}
          return res;
        }).catch(function(){return new Response('',{status:504});});
      });
    })); return;
  }
  if(isPage(req,url)){
    ev.respondWith(fetch(req).then(function(res){
      if(res&&res.ok){var copy=res.clone();caches.open(VER).then(function(c){c.put('./index.html',copy).catch(function(){});});}
      return res;
    }).catch(function(){return caches.match('./index.html').then(function(r){return r||new Response('離線中，且尚未快取頁面。',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});});}));
    return;
  }
  if(isBookData(url)||/\.(js|css|webmanifest|png|svg|json)(\?.*)?$/i.test(url.pathname)){
    ev.respondWith(caches.open(VER).then(function(cache){
      return cache.match(req).then(function(hit){
        var net=fetch(req).then(function(res){if(res&&res.ok)cache.put(req,res.clone()).catch(function(){});return res;}).catch(function(){return hit;});
        return hit||net;
      });
    }));
  }
});
self.addEventListener('message', function(ev){ if(ev.data==='skipWaiting') self.skipWaiting(); });
