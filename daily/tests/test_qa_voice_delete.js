'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../assets/app.js'),'utf8');
const sample=JSON.parse(fs.readFileSync(path.join(__dirname,'../seance_2026-11-07.json'),'utf8'));
let assertions=0;function check(cond,msg){assert.ok(cond,msg);assertions++;}
function storage(seed={}){const obj={...seed};return {data:obj,getItem:k=>obj[k]??null,setItem:(k,v)=>{obj[k]=v},removeItem:k=>{delete obj[k]},get length(){return Object.keys(obj).length},key:i=>Object.keys(obj)[i]??null};}
function harness(){
 const local=storage({'another-product':'untouched'}),sess=storage({'response-lab-daily-tmp':'tmp','other-session':'kept'});
 const deletedCaches=[],deletedDb=[],notifications=[],confirmations=[],blobs=[],records=[];let now=Date.now(),current=0,timerId=0;
 const intervals=new Map(),timeouts=new Map(),handlers={},app={innerHTML:''},status={textContent:'',title:''};
 class Clock extends Date{constructor(...x){super(...(x.length?x:[now]));}static now(){return now}}
 class Rec{
  constructor(){this.phrasesAccessed=false;this.lang='';this.results=[];records.push(this)}
  set phrases(_){this.phrasesAccessed=true;throw new Error('phrases not supported')}
  get phrases(){return []}
  start(){this.startCalled=true; if(this.nextError){this.onerror?.({error:this.nextError});this.onend?.();return;}this.onstart?.()}
  stop(){this.onend?.()}
  emit(code){this.onerror?.({error:code});this.onend?.()}
  result(text,final=true){this.onresult?.({results:[{0:{transcript:text},length:1,isFinal:final}]})}
 }
 const ctx={console,Date:Clock,localStorage:local,sessionStorage:sess,
  indexedDB:{databases:async()=>[{name:'response-lab-daily-test'},{name:'other-db'}],deleteDatabase(n){deletedDb.push(n);const req={};queueMicrotask(()=>req.onsuccess?.());return req}},
  caches:{keys:async()=>['response-lab-daily-v2-1','another-product-cache'],delete:async k=>{deletedCaches.push(k);return true}},
  document:{getElementById(id){if(id==='app')return app;if(id==='live-status')return status;return null},
   addEventListener(n,fn){handlers[n]=fn},createElement(){return {download:'',click(){},remove(){}}},body:{appendChild(){}}},
  window:{SpeechRecognition:Rec,SpeechRecognitionPhrase:class{},confirm(str){confirmations.push(str);return this.accept.shift()??false},accept:[],addEventListener(){}},
  navigator:{},location:{protocol:'https:',hostname:'example.com'},
  Blob,URL:{createObjectURL(blob){blobs.push(blob);return 'blob:qa'},revokeObjectURL(){}},
  setInterval(fn){const n=++timerId;intervals.set(n,fn);return n},clearInterval(n){intervals.delete(n)},
  setTimeout(fn){const n=++timerId;timeouts.set(n,fn);return n},clearTimeout(n){timeouts.delete(n)},
  fetch:async()=>({ok:true,json:async()=>sample})};
 vm.runInNewContext(source,ctx,{filename:'daily/app.js'});
 async function click(action,extras={}){await handlers.click({target:{closest:()=>({dataset:{action,...extras},disabled:false})}});for(let i=0;i<60;i++)await Promise.resolve()}
 async function upload(pack){handlers.change({target:{id:'session-upload',files:[{size:JSON.stringify(pack).length,text:async()=>JSON.stringify(pack)}],value:'x'}});for(let i=0;i<8;i++)await Promise.resolve()}
 function change(id,value){handlers.change({target:{id,value,dataset:{},classList:{contains(){return false}}}})}
 function forward(ms){now+=ms;for(const fn of [...intervals.values()])fn()}
 return {local,sess,deletedCaches,deletedDb,notifications,confirmations,records,app,status,blobs,ctx,click,upload,change,forward,handlers,get state(){return ctx.window.ResponseLabDaily.getState()},timeouts};
}
async function advanceToOral(h){for(let i=0;i<6;i++){await h.click('quiz-start');await h.click('quiz-choose',{index:'0'});await h.click('next')}
 for(let i=0;i<2;i++){await h.click('case-start');await h.click('case-finish');await h.click('next')}
 check(h.state.sessions[h.state.activeId].cursor===8,'now in first oral')}
(async()=>{
 const h=harness();const id=sample.session_id;
 await h.upload(sample);check(Object.keys(h.state.sessions).length===1,'import succeeded');
 await h.click('home');check(h.app.innerHTML.includes('data-action="delete-session"'),'delete button available on home');await h.click('open',{id});
 await advanceToOral(h);
 check(h.app.innerHTML.includes('en-GB'),'English UK available in French session');
 check(h.app.innerHTML.includes('en-US'),'English US available in French session');
 check(h.app.innerHTML.includes('fr-FR'),'French available');
 h.change('speech-locale','en-GB');check(h.state.sessions[id].speechLocale==='en-GB','English selection saved');
 await h.click('speech-start');
 let rec=h.records.at(-1);check(rec.lang==='en-GB','English passed to SpeechRecognition.lang');
 check(!rec.phrasesAccessed,'dangerous phrases property not assigned');
 check(h.state.sessions[id].phase==='speaking','started speech timer');
 rec.result('Hello, I will clarify the key risk first.',true);
 check(h.state.sessions[id].answers[sample.oral[0].id].transcript.includes('Hello'),'live speech saved');
 rec.emit('network');check(h.status.textContent!=='','status exists');
 check(h.app.innerHTML.includes('Service vocal inaccessible'),'distinct network error');
 check(h.app.innerHTML.includes('manual-draft'),'manual fallback available after an error');
 await h.click('oral-finish');await h.click('next');
 // Trigger phrases-not-supported before the timer started and ensure exactly one fallback.
 h.change('speech-locale','en-US');
 // Force an asynchronous error right after the starter creates recognizer, before onstart.
 const oldStart=h.ctx.window.SpeechRecognition.prototype.start;
 let rejectedOnce=false;h.ctx.window.SpeechRecognition.prototype.start=function(){if(!rejectedOnce){rejectedOnce=true;this.onerror?.({error:'phrases-not-supported'});this.onend?.();} /* second attempt waits for an explicit mic event */ };
 await h.click('speech-start');
 check(h.records.length>=3,'automatic fallback created a second recognizer');
 check(h.state.sessions[id].phase==='arming','clock not started while first recognizer rejected');
 const replacement=h.records.at(-1);check(!replacement.phrasesAccessed,'fallback also has no experimental options');
 check(h.app.innerHTML.includes('Tentative automatique')||h.app.innerHTML.includes('Nouvel essai'),'retry status visible');
 replacement.onerror?.({error:'phrases-not-supported'});replacement.onend?.();
 check(h.state.sessions[id].phase==='ready','failure after one fallback returns to ready');
 check(h.app.innerHTML.includes('ne prend pas en charge'),'helpful second failure message');
 h.ctx.window.SpeechRecognition.prototype.start=oldStart;
 await h.click('manual-start');check(h.state.sessions[id].phase==='speaking','manual fallback starts timer');
 await h.click('oral-finish');await h.click('next');
 await h.click('manual-start');await h.click('oral-finish');await h.click('next');
 check(h.state.sessions[id].phase==='finished','session finished');
 // Remove an individual finished session; cancellation must preserve it.
 h.ctx.window.accept.push(false);await h.click('delete-session',{id});check(Boolean(h.state.sessions[id]),'cancel deletion preserves session');
 h.ctx.window.accept.push(true,true);await h.click('delete-session',{id});
 check(Object.keys(h.state.sessions).length===0,'delete single session removes it');
 check(h.local.data['another-product']==='untouched','foreign app localStorage untouched');
 // Delete all and do not allow the v1 migration to re-import deleted data.
 const a=structuredClone(sample),b=structuredClone(sample);b.session_id='RL-D-2026-11-08';
 await h.upload(a);await h.upload(b);
 h.local.setItem('response-lab-daily-state-v1','{ "version": 1, "sessions": {}}');
 h.ctx.window.accept.push(true,true);await h.click('delete-all');
 check(Object.keys(h.state.sessions).length===0,'delete-all removes all sessions');
 check(h.local.getItem('response-lab-daily-state-v1')===null,'old v1 data removed');
 check(h.local.getItem('response-lab-daily-state-v2')!==null,'v2 tombstone prevents re-migration');
 // Reset app cleans only namespaced caches/IndexedDB/sessionStorage.
 await h.upload(sample);h.ctx.window.accept.push(true,true);await h.click('reset-app');
 check(Object.keys(h.state.sessions).length===0,'app reset emptied memory');
 check(h.sess.getItem('response-lab-daily-tmp')===null&&h.sess.getItem('other-session')==='kept','sessionStorage cleanup scoped');
 check(h.deletedCaches.length===1&&h.deletedCaches[0].startsWith('response-lab-daily'),'only owned caches removed');
 check(h.deletedDb.length===1&&h.deletedDb[0].startsWith('response-lab-daily'),'only owned databases removed');
 check(h.local.getItem('another-product')==='untouched','other apps survive reset');
 check(h.blobs.length>=3,'safety backups generated');
 console.log(`PASS ${assertions} additional QA assertions: FR/EN locale, safe recognition fallback, oral recovery, individual/all/app deletion and scoped storage cleanup.`);
})().catch(e=>{console.error(e);process.exitCode=1});
