'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets/app.js'),'utf8');
const pack=JSON.parse(fs.readFileSync(path.join(root,'seance_2026-11-07.json'),'utf8'));
function harness(store={}){
 let clock=Date.UTC(2026,10,7,20,0,0),blobs=[],activeRec=null,timerSeq=0;
 const handlers={},intervals=new Map(),app={innerHTML:''},status={textContent:''};
 class DateMock extends Date{constructor(...args){super(...(args.length?args:[clock]))} static now(){return clock;}}
 class Recognition{constructor(){activeRec=this}start(){this.onstart?.()}stop(){this.onend?.()}}
 const document={getElementById(id){if(id==='app')return app;if(id==='live-status')return status;
  if(id==='axis-summary'||id==='grade-summary')return {textContent:''};
  if(id==='time-number')return {textContent:'',classList:{toggle(){}}};
  if(id==='time-progress')return {style:{}};
  return null;},addEventListener(name,fn){handlers[name]=fn;},createElement(){return {click(){},remove(){}}},body:{appendChild(){}}};
 const window={SpeechRecognition:Recognition,addEventListener(){}};
 const ctx={window,document,console,localStorage:{getItem(k){return store[k]||null},setItem(k,v){store[k]=v}},Date:DateMock,navigator:{},location:{protocol:'file:'},setInterval(fn){let id=++timerSeq;intervals.set(id,fn);return id},clearInterval(id){intervals.delete(id)},setTimeout(){},Blob,URL:{createObjectURL(b){blobs.push(b);return 'blob:test'},revokeObjectURL(){}},fetch:async()=>({ok:true,json:async()=>pack})};
 vm.runInNewContext(source,ctx,{filename:'app.js'});
 async function click(action,extra={}){handlers.click({target:{closest:()=>({dataset:{action,...extra},disabled:false})}});for(let i=0;i<8;i++)await Promise.resolve();}
 function change(id,value,cls='',data={}){handlers.change({target:{id,value,classList:{contains:x=>x===cls},dataset:data}})}
 function input(id,value,cls='',data={}){handlers.input({target:{id,value,classList:{contains:x=>x===cls},dataset:data}})}
 return {store,app,status,window,blobs,click,change,input,handlers,rec:()=>activeRec,now:()=>clock,jump(ms){clock+=ms;for(const fn of intervals.values())fn();}};
}
(async()=>{
 let count=0;function check(cond,msg){assert.ok(cond,msg);count++}
 const oldPack={...pack};
 const oldSession={pack:oldPack,cursor:11,phase:'finished',timer:null,answers:{'J1-Q1':{selectedIndex:1,correct:true}},grades:{'J1-Q1':4},coachNotes:{'J1-Q1':'ancienne appréciation'},createdAt:'2026-11-07T10:00:00Z',finishedAt:'2026-11-07T10:09:00Z'};
 const v1='response-lab-daily-state-v1',v2='response-lab-daily-state-v2',store={[v1]:JSON.stringify({version:1,activeId:null,sessions:{[pack.session_id]:oldSession}})};
 const h=harness(store),db=h.window.ResponseLabDaily.getState();
 check(db.version===2,'migrated version 2');
 check(db.sessions[pack.session_id].legacyGrades['J1-Q1']===4,'old 4/4 grade retained distinctly');
 check(db.sessions[pack.session_id].grades['J1-Q1']===undefined,'old grades not falsely scaled');
 check(!!store[v1]&&!!store[v2],'original store never deleted');
 check(h.app.innerHTML.includes('Historique et progression'),'history visible on home');
 check(h.app.innerHTML.includes('7 séances')&&h.app.innerHTML.includes('30 séances'),'rolling history windows');
 await h.click('open',{id:pack.session_id});
 check(!h.app.innerHTML.includes('ancienne note 4/4'),'legacy detail hidden but preserved in backup');
 check(h.app.innerHTML.includes('Mes cinq repères'), 'five axes render');
 h.change('axis-grade-0','5','axis-grade',{axis:'analyse'});
 h.change('axis-grade-1','3','axis-grade',{axis:'raisonnement'});
 h.change('grade-0','5','grade-field',{id:'J1-Q1'});
 h.input('axis-note-0','Identifier d’abord les faits avant la décision.','axis-note',{axis:'analyse'});
 h.input('coach-summary','Rejouer demain des arbitrages sous contrainte.');
 check(db.sessions[pack.session_id].axes.analyse===5&&db.sessions[pack.session_id].axes.raisonnement===3,'new 0–5 axes saved');
 check(db.sessions[pack.session_id].grades['J1-Q1']===5,'new detailed 0–5 grade saved');
 check(db.sessions[pack.session_id].axisNotes.analyse.includes('faits'),'improvement note saved');
 check(db.sessions[pack.session_id].coachSummary.includes('demain'),'coach summary saved');
 await h.click('export');
 const exported=JSON.parse(await h.blobs.at(-1).text());
 check(exported.schema==='response-lab-daily-answers-v2','new export schema');
 check(exported.coach_axes.length===5&&exported.coach_axes[0].grade_0_5===5,'axes exported');
 check(exported.answers.length===11,'11 answers exported even legacy session');
 await h.click('home');check(h.app.innerHTML.includes('5.0/5')&&h.app.innerHTML.includes('3.0/5'),'history displays 0–5 entered grades');
 await h.click('backup');const backup=JSON.parse(await h.blobs.at(-1).text());
 check(backup.schema==='response-lab-daily-backup-v2','backup format');
 check(backup.sessions[pack.session_id].legacyGrades['J1-Q1']===4,'backup preserves legacy grade');
 const fresh=harness({});
 fresh.handlers.change({target:{id:'backup-upload',files:[{size:JSON.stringify(backup).length,text:async()=>JSON.stringify(backup)}],classList:{contains(){return false}},dataset:{},value:'x'}});
 for(let i=0;i<12;i++)await Promise.resolve();
 const restored=fresh.window.ResponseLabDaily.getState().sessions[pack.session_id];
 check(!!restored&&restored.axes.analyse===5,'backup import restores axes');
 check(restored.legacyGrades['J1-Q1']===4,'backup retains old 0–4 values');
 // Test locale selector and extended timer without needing a remote speech recognizer.
 const en={...JSON.parse(JSON.stringify(pack)),language:'EN',session_id:'RL-D-EN-TEST'};
 await fresh.click('home'); // no-op if home
 const safe=fresh.window.ResponseLabDaily.validatePack(en);
 check(safe.language==='EN','EN pack valid');
 // import from the same upload entrypoint to exercise validation and state updates
 fresh.handlers.change({target:{id:'session-upload',files:[{size:JSON.stringify(en).length,text:async()=>JSON.stringify(en)}],value:'x',classList:{contains(){return false}}}});
 for(let i=0;i<12;i++)await Promise.resolve();
 const enState=fresh.window.ResponseLabDaily.getState().sessions['RL-D-EN-TEST'];
 check(!!enState,'EN session imported');
 fresh.change('time-mode','10');
 check(enState.timerMultiplier===10,'time accommodation x10 saved');
 await fresh.click('quiz-start');
 check(enState.timer?.seconds===400,'40 seconds scales x10 in accessibility mode');
 await fresh.click('home');
 // Select 1x in ready oral stage and UK accent; the language setting must reach the recognizer.
 enState.cursor=8;enState.phase='ready';enState.timer=null;enState.timerMultiplier=1;
 await fresh.click('open',{id:'RL-D-EN-TEST'});
 check(fresh.app.innerHTML.includes('English (UK)'), 'English accents visible in oral setup');
 fresh.change('speech-locale','en-GB');
 check(enState.speechLocale==='en-GB','English UK locale saved');
 await fresh.click('speech-start');
 check(fresh.rec()?.lang==='en-GB','recognizer receives EN-GB locale');
 check(enState.phase==='speaking'&&enState.timer.seconds===40,'spoken timer only after recognition starts');
 console.log(`PASS ${count} checks: v1 migration, legacy 0–4 isolation, 0–5 axis notes, backup+restore, historical trends, extended time, en-GB speech.`);
})().catch(err=>{console.error(err);process.exitCode=1;});
