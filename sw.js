/* Trivia PWA service worker — bump CACHE version on every deploy of index/questions */
const CACHE='trivia-v10';
const SHELL=['./','./index.html','./questions.js','./manifest.webmanifest','./icon-192.png','./icon-512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  const isShell=req.mode==='navigate'||url.pathname.endsWith('/index.html')||url.pathname.endsWith('/questions.js');
  if(isShell&&url.origin===location.origin){
    /* network-first: updates land immediately when online, cache keeps it working offline */
    e.respondWith(
      fetch(req).then(res=>{
        const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));return res;
      }).catch(()=>caches.match(req).then(r=>r||caches.match('./index.html')))
    );
    return;
  }
  /* everything else (fonts, wikimedia images, icons): cache-first, fill cache on the way */
  e.respondWith(
    caches.match(req).then(hit=>hit||fetch(req).then(res=>{
      if(res&&(res.ok||res.type==='opaque')){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));}
      return res;
    }).catch(()=>hit))
  );
});
