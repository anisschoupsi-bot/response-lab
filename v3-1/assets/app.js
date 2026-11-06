'use strict';
// Compatibility entrypoint for older cached v3.1 HTML.
(function(){
 const files=['assets/app-core.js','assets/app-runtime.js'];
 const failure=()=>{const el=document.getElementById('app');if(el)el.innerHTML='<div class="notice error" role="alert">Échec du chargement. Vérifiez votre connexion et actualisez la page. / Loading failed. Reconnect and refresh.</div>'};
 let index=0;
 const next=()=>{
  if(index>=files.length)return;
  const el=document.createElement('script');
  el.src=files[index++];el.async=false;el.onload=next;el.onerror=failure;document.head.appendChild(el);
 };
 next();
})();