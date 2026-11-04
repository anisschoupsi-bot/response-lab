const CACHE='response-lab-v2-1-shell';
const SHELL=['./','./index.html','./assets/app.js','./assets/app.css','./manifest.webmanifest','./icons/icon.svg','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('response-lab-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith((async()=>{try{const response=await fetch(e.request);if(response.ok){const cache=await caches.open(CACHE);cache.put(e.request,response.clone()).catch(()=>{});}return response;}catch(err){return await caches.match(e.request)||await caches.match('./index.html')||Response.error();}})());});
