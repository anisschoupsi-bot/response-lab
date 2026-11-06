'use strict';
const CACHE='response-lab-v3-1-1-boot-fix';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon.svg','./assets/style.css','./assets/app.js','./assets/app-core.js','./assets/app-runtime.js','./assets/attention.js','./assets/reasoning.js','./assets/decision.js','./assets/flexibility.js','./assets/pressure.js'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('response-lab-v3-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
 if(req.mode==='navigate'){
  event.respondWith(fetch(req).then(response=>{if(response.ok){const clone=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put('./index.html',clone)))}return response}).catch(()=>caches.match('./index.html')));
 }else{
  event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(response=>{if(response.ok){const clone=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(req,clone)))}return response})));
 }
});