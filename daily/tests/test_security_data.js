'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'../assets/app.js'),'utf8'),pack=JSON.parse(fs.readFileSync(path.join(__dirname,'../seance_2026-11-07.json')));
let passes=0;const check=(condition,description)=>{assert.ok(condition,description);passes++};
const injected='<img src=x onerror="window.__pwned=1">';
const id=pack.session_id;const bad={pack,cursor:8,phase:'finished',timer:{endsAt:'now',seconds:'40',startedAt:'start',stepId:'WRONG'},
 answers:{[pack.oral[0].id]:{id:pack.oral[0].id,elapsedSec:injected,transcript:'A spoken answer',alternatives:{length:1,map:injected},capture:'browser-speech'},[pack.quiz[0].id]:{selectedIndex:500,correct:true}},
 grades:{[pack.quiz[0].id]:injected},legacyGrades:{[pack.quiz[0].id]:injected},coachNotes:{[pack.quiz[0].id]:injected},axes:{analyse:injected},axisNotes:{analyse:injected},coachSummary:injected,createdAt:'2026-11-07T00:00:00Z'};
const storage={'response-lab-daily-state-v2':JSON.stringify({version:2,activeId:id,sessions:{[id]:bad}})};
const dom={innerHTML:''},status={textContent:'',title:''},listeners={};
const ctx={console,localStorage:{getItem:k=>storage[k]??null,setItem:(k,v)=>storage[k]=v},document:{getElementById:x=>x==='app'?dom:x==='live-status'?status:null,addEventListener:(k,fn)=>listeners[k]=fn,createElement:()=>({click(){},remove(){}}),body:{appendChild(){}}},window:{addEventListener(){},SpeechRecognition:class{}},navigator:{},location:{protocol:'file:'},setInterval:()=>1,clearInterval(){},setTimeout(){},clearTimeout(){},Date,Blob,URL:{createObjectURL:()=>'',revokeObjectURL(){}}};
vm.runInNewContext(src,ctx);
const s=ctx.window.ResponseLabDaily.getState().sessions[id];
check(s.phase==='ready','invalid finished phase adjusted to match cursor');
check(s.timer===null,'invalid timer discarded');
check(s.answers[pack.oral[0].id].elapsedSec===null,'untrusted elapsed time removed');
check(Array.isArray(s.answers[pack.oral[0].id].alternatives),'malformed alternatives sanitized');
check(s.answers[pack.oral[0].id].transcript==='A spoken answer','real text preserved');
check(s.answers[pack.quiz[0].id].selectedIndex===null,'invalid quiz answer discarded');
check(s.answers[pack.quiz[0].id].correct===false,'forged quiz success recalculated');
check(!Object.hasOwn(s.grades,pack.quiz[0].id),'untrusted grade discarded');
check(!Object.hasOwn(s.legacyGrades,pack.quiz[0].id),'untrusted legacy grade discarded');
check(!Object.hasOwn(s.axes,'analyse'),'untrusted axis grade discarded');
check(!dom.innerHTML.includes('<img'),'escaped note cannot create HTML');
check(!dom.innerHTML.includes('onerror='),'untrusted metadata cannot add event handlers');
console.log(`PASS ${passes} security checks: corrupted backup data sanitized, transcript retained, XSS payload not rendered`);
