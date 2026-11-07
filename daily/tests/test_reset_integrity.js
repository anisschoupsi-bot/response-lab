'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets/app.js'),'utf8');
const pack=JSON.parse(fs.readFileSync(path.join(root,'seance_2026-11-07.json'),'utf8'));
const V1='response-lab-daily-state-v1',V2='response-lab-daily-state-v2';
function harness(store={}){
 let clock=Date.UTC(2026,10,7,20,0,0), timerSeq=0, failWrites=false, denyDownload=false;
 const blobs=[],downloadNames=[], confirms=[], handlers={}, intervals=new Map(),app={innerHTML:''},status={textContent:''};
 class DateMock extends Date{constructor(...args){super(...(args.length?args:[clock]));}static now(){return clock;}}
 class Rec{start(){this.onstart?.()}stop(){this.onend?.()}}
 const document={getElementById(id){if(id==='app')return app;if(id==='live-status')return status;if(id==='time-number')return {textContent:'',classList:{toggle(){}}};if(id==='time-progress')return {style:{}};return null;},addEventListener(k,v){handlers[k]=v},createElement(){return {download:'',click(){if(denyDownload)throw Error('download blocked');downloadNames.push(this.download)},remove(){}}},body:{appendChild(){}}};
 const window={SpeechRecognition:Rec,addEventListener(){},confirm(t){confirms.push(t);return accepts.shift()??false;}},accepts=[];
 const ctx={window,document,console:{...console,error(){}},localStorage:{getItem(k){return store[k]||null},setItem(k,v){if(failWrites)throw Error('QuotaExceeded');store[k]=v}},Date:DateMock,navigator:{},location:{protocol:'file:'},setInterval(fn){const n=++timerSeq;intervals.set(n,fn);return n},clearInterval(id){intervals.delete(id)},setTimeout(){},Blob,URL:{createObjectURL(b){blobs.push(b);return 'blob:test'},revokeObjectURL(){}},fetch:async()=>({ok:true,json:async()=>pack})};
 vm.runInNewContext(source,ctx,{filename:'app.js'});
 async function click(action, extra={}){handlers.click({target:{closest:()=>({dataset:{action,...extra},disabled:false})}});for(let i=0;i<12;i++)await Promise.resolve();}
 function change(id,value){handlers.change({target:{id,value,classList:{contains(){return false}},dataset:{},files:[]}});}
 async function uploadPack(data){handlers.change({target:{id:'session-upload',files:[{size:JSON.stringify(data).length,text:async()=>JSON.stringify(data)}],value:'x'}});for(let i=0;i<12;i++)await Promise.resolve();}
 async function uploadBackup(data){handlers.change({target:{id:'backup-upload',files:[{size:JSON.stringify(data).length,text:async()=>JSON.stringify(data)}],value:'x'}});for(let i=0;i<12;i++)await Promise.resolve();}
 return {ctx,window,store,app,status,blobs,downloadNames,confirms,accepts,click,change,uploadPack,uploadBackup,setFailWrites(v){failWrites=v},setDenyDownload(v){denyDownload=v},state(){return window.ResponseLabDaily.getState()},tick(ms){clock+=ms;for(const fn of [...intervals.values()])fn()}};
}
(async()=>{
 let checks=0;
 const check=(v,desc)=>{assert.ok(v,desc);checks++};
 const original={pack:structuredClone(pack),cursor:11,phase:'finished',timer:null,answers:{'J1-Q1':{selectedIndex:1,correct:true}},grades:{'J1-Q1':4},coachNotes:{'J1-Q1':'ancien'},createdAt:'2026-11-07T10:00:00Z',finishedAt:'2026-11-07T10:09:00Z'};
 const store={[V1]:JSON.stringify({version:1,activeId:null,sessions:{[pack.session_id]:original}})};
 const h=harness(store),id=pack.session_id;
 check(h.state().sessions[id].migratedFromV1,'legacy flag accurately migrated');
 check(h.app.innerHTML.includes('Réinitialiser le progrès'),'global reset button visible');
 await h.uploadPack(pack);
 check(h.state().sessions[id].phase==='finished','same id retains old attempt, no silent erasure');
 check(h.app.innerHTML.includes('même identifiant'),'duplicate session explains conflict visibly');
 check(h.app.innerHTML.includes('ancien essai'),'legacy warning describes recorded attempt');
 check(h.app.innerHTML.includes('Recommencer cette séance'),'per-session restart visible');
 h.accepts.push(false);await h.click('restart-session');
 check(h.state().sessions[id].phase==='finished','cancel leaves session unchanged');
 check(h.blobs.length===0,'cancel creates no backup');
 h.accepts.push(true,false);await h.click('restart-session');
 check(h.state().sessions[id].phase==='finished','failed backup confirmation leaves progress');
 check(h.blobs.length===1,'safety backup generated before erase');
 let backup=JSON.parse(await h.blobs.at(-1).text());
 check(backup.sessions[id].grades['J1-Q1']===undefined&&backup.sessions[id].legacyGrades['J1-Q1']===4,'safety backup preserves old grade');
 h.accepts.push(true,true);await h.click('restart-session');
 let s=h.state().sessions[id];
 check(s.cursor===0&&s.phase==='ready','restart resets step and stage');
 check(Object.keys(s.answers).length===0&&Object.keys(s.grades).length===0,'restart resets responses and notes');
 check(!s.migratedFromV1&&!s.legacyGrades,'restart clears legacy flag and archive from active session');
 check(s.pack.session_id===id,'restart preserves imported pack');
 check(store[V1]!==undefined&&store[V2]!==undefined,'old storage preserved and fresh v2 prevents reimport');
 // New pack with duplicate ID must be available upon explicitly restarting.
 const revised=structuredClone(pack);revised.quiz[0].question='Question du nouveau fichier importé';
 await h.uploadPack(revised);
 check(h.state().sessions[id].pack.quiz[0].question===revised.quiz[0].question,'a still untouched imported pack can be safely updated');
 await h.click('quiz-start');
 const changed=structuredClone(revised);changed.quiz[0].question='Encore un autre texte de question';
 await h.uploadPack(changed);
 check(h.state().sessions[id].pack.quiz[0].question===revised.quiz[0].question,'a running session pack cannot be overwritten silently');
 h.accepts.push(true,true);await h.click('home');await h.click('open',{id});await h.click('restart-session');
 check(h.state().sessions[id].pack.quiz[0].question===revised.quiz[0].question,'pending import is cleared if user leaves the session to avoid accidental cross-file reset');
 // Grade and progress, then reset all with safety copy.
 const second=structuredClone(pack);second.session_id='RL-D-2026-11-08';
 await h.uploadPack(second);await h.click('quiz-start');h.tick(2000);await h.click('quiz-choose',{index:'0'});
 check(h.state().sessions[second.session_id].phase==='review','can complete quiz');
 h.accepts.push(true,false);await h.click('home');await h.click('reset-progress');
 check(h.state().sessions[second.session_id].phase==='review','declined second confirmation keeps results');
 h.accepts.push(true,true);await h.click('reset-progress');
 const now=h.state(),saved=JSON.parse(await h.blobs.at(-1).text());
 check(Object.keys(now.sessions).length===2,'global reset retains both imported packs');
 check(now.activeId===null&&Object.values(now.sessions).every(s=>s.cursor===0&&s.phase==='ready'&&Object.keys(s.answers).length===0),'global reset clears only progress');
 check(!h.app.innerHTML.includes('1 séance terminée'),'history reset no completed sessions');
 const reload=harness({...h.store});
 check(reload.state().sessions[id].cursor===0,'restart persisted across reload');
 check(!reload.state().sessions[id].migratedFromV1,'old v1 data not unexpectedly remigrated after reset');
 check(Object.keys(reload.state().sessions).length===2,'all imported packs still present after reload');
 check(saved.sessions[second.session_id].answers[second.quiz[0].id]!==undefined,'global safety backup preserves answers');
 // Restore that safety backup into existing imported sessions: ask to REPLACE, not silently skip.
 h.accepts.push(false);await h.uploadBackup(saved);
 check(h.state().sessions[second.session_id].phase==='ready','restore-cancel leaves fresh state');
 h.accepts.push(true);await h.uploadBackup(saved);
 check(h.state().sessions[second.session_id].phase==='review','restore rehydrates overwritten existing session');
 check(h.state().sessions[second.session_id].answers[second.quiz[0].id].elapsedSec!==undefined,'restored answers intact');
 // Transaction rollback on exhausted browser storage
 await h.click('home');h.setFailWrites(true);h.accepts.push(true,true);await h.click('reset-progress');
 check(h.state().sessions[second.session_id].phase==='review','storage quota error cannot destroy in-memory progress');
 h.setFailWrites(false);
 // No erase if download fails.
 h.setDenyDownload(true);h.accepts.push(true);await h.click('reset-progress');
 check(h.state().sessions[second.session_id].phase==='review','download failure cannot erase progress');
 h.setDenyDownload(false);
 // Progress mode must lock after first exercise; timed-out 2x QCM records 80s.
 const e=harness({});await e.uploadPack(pack);e.change('time-mode','2');
 check(e.state().sessions[id].timerMultiplier===2,'set 2x before start');
 await e.click('quiz-start');e.tick(81000);
 check(e.state().sessions[id].answers[pack.quiz[0].id].elapsedSec===80,'timeout reports effective limit, not 40s when 2x');
 await e.click('next');e.change('time-mode','1');
 check(e.state().sessions[id].timerMultiplier===2,'timing mode locked mid-session for honest trends');
 check(e.app.innerHTML.includes('Durée verrouillée'),'UI explains timing lock');
 // More than 250 existing valid sessions must survive loading.
 const many={};for(let n=0;n<310;n++){const q=structuredClone(pack);q.session_id='RL-D-SAMPLE-'+n;many[q.session_id]={pack:q,cursor:0,phase:'ready',answers:{},grades:{},createdAt:'2026-11-07T00:00:00.000Z'};}
 const mass=harness({[V2]:JSON.stringify({version:2,activeId:null,sessions:many})});
 check(Object.keys(mass.state().sessions).length===310,'reload does not silently discard sessions beyond 250');
 console.log(`PASS ${checks} checks: session conflict, backup-first 2-step reset, restored overwrite, safe rollback, timing accuracy, 310-session history.`);
})().catch(e=>{console.error(e);process.exitCode=1});
