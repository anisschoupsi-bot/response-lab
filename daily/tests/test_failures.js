'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');const pack=JSON.parse(fs.readFileSync(path.join(root,'seance_2026-11-07.json')));const source=fs.readFileSync(path.join(root,'assets/app.js'),'utf8');
function harness(){
 let time=Date.now(),intervals=new Map(),timerSeq=0;const listeners={},storage={};let rec=null;
 const app={innerHTML:''};const status={textContent:''};
 class DateMock extends Date{constructor(...args){super(...(args.length?args:[time]))}static now(){return time}}
 class Rec{constructor(){rec=this;this.released=false}start(){}stop(){this.released=true;this.onend?.()}accept(){this.onstart?.()}deny(){this.onerror?.({error:'not-allowed'});this.onend?.()}}
 const document={getElementById(id){return id==='app'?app:id==='live-status'?status:id==='time-number'?{textContent:'',classList:{toggle(){}}}:id==='time-progress'?{style:{}}:null},addEventListener(name,fn){listeners[name]=fn},createElement(){return{click(){},remove(){}}},body:{appendChild(){}}};
 const window={SpeechRecognition:Rec,addEventListener(){}};
 const ctx={window,document,localStorage:{getItem(k){return storage[k]},setItem(k,v){storage[k]=v}},location:{protocol:'file:'},navigator:{},Blob,Date:DateMock,URL:{createObjectURL:()=>'',revokeObjectURL(){}},setInterval(f){let n=++timerSeq;intervals.set(n,f);return n},clearInterval(n){intervals.delete(n)},setTimeout(){},fetch:async()=>({ok:true,json:async()=>pack}),console};
 vm.runInNewContext(source,ctx);
 async function click(action,extra){listeners.click({target:{closest:()=>({dataset:{action,...extra}})}});for(let i=0;i<6;i++)await Promise.resolve()}
 async function jump(ms){time+=ms;for(let j=0;j<3;j++)for(const f of [...intervals.values()])f();await Promise.resolve()}
 return {app,window,click,jump,rec:()=>rec,session:()=>window.ResponseLabDaily.getState().sessions[pack.session_id]};
}
async function run(){let total=0;const check=(v,msg)=>{assert.ok(v,msg);total++};
 const h=harness();await h.click('demo');const st=h.session();
 await h.click('quiz-start');check(st.timer&&st.phase==='running','quiz clock running');await h.click('home');check(st.timer&&st.phase==='running','home does not erase timed quiz');await h.jump(45000);await h.click('open',{id:pack.session_id});check(st.phase==='review'&&st.answers['J1-Q1'].timedOut,'timed quiz resolves after return');
 for(let i=1;i<=6;i++){await h.click('next');if(i===6)break;await h.click('quiz-start');await h.click('quiz-choose',{index:String(pack.quiz[i].correct_index)})}
 check(st.cursor===6&&st.phase==='ready','two-stage case next');
 await h.click('case-start');check(st.phase==='reading','read timer');await h.click('home');await h.jump(125000);await h.click('open',{id:pack.session_id});check(st.phase==='review'&&st.answers['J1-E1'].timedOut,'expired read+write does not give extra time');
 await h.click('next');await h.click('case-start');await h.jump(50000);check(st.phase==='writing','second case writing');await h.jump(60000);check(st.phase==='review','second case ended');await h.click('next');
 check(st.cursor===8&&st.phase==='ready','oral ready');
 await h.click('speech-start');check(st.phase==='arming'&&!st.timer,'no clock before mic actually starts');h.rec().deny();check(st.phase==='ready'&&!st.timer,'permission denied no clock');
 await h.click('speech-start');check(st.phase==='arming','can try again');h.rec().accept();check(st.phase==='speaking'&&!!st.timer,'starts only on mic event');
 h.rec().onresult({results:[{isFinal:true,0:{transcript:'Ma réponse orale.'}}]});
 h.rec().stop();check(st.phase==='speaking','premature mic stop keeps timer and result');
 check(h.app.innerHTML.includes('Relancer le micro'),'mic recovery button');
 await h.click('speech-resume');check(st.phase==='speaking'&&!!st.timer,'restart preserves timer');h.rec().accept();check(st.timer?.seconds===40,'restart does not reset duration');
 h.rec().onresult({results:[{isFinal:true,0:{transcript:'Je propose une alternative.'}}]});
 await h.click('oral-finish');check(st.phase==='review','oral finishes');check(st.answers['J1-O1'].transcript.includes('Ma réponse orale.')&&st.answers['J1-O1'].transcript.includes('alternative'),'micro restart merges words');
 const invalid=JSON.parse(JSON.stringify(pack));invalid.session_id='__proto__';assert.throws(()=>h.window.ResponseLabDaily.validatePack(invalid),/invalide/);total++;
 const injection=JSON.parse(JSON.stringify(pack));injection.title='<img src=x onerror=alert(1)>';injection.session_id='safe-injected';h.window.ResponseLabDaily.validatePack(injection);total++;
 console.log(`PASS ${total} checks: background timer, elapsed writing, denied mic, permission start, speech restart, input safety.`);
}
run().catch(e=>{console.error(e);process.exitCode=1});
