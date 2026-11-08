'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const pack=JSON.parse(fs.readFileSync(path.join(root,'seance_2026-11-07.json'),'utf8'));
const src=fs.readFileSync(path.join(root,'assets/app.js'),'utf8');
let clock=Date.now();
const handlers={};let saved={},intervals=new Map(),nextInterval=1,lastBlob=null,downloads=[];
const app={innerHTML:'',textContent:'Initialisation de Response Lab'};
const status={textContent:''};
const timerEl={textContent:'',classList:{toggle(){}},style:{}};
const barEl={style:{}};
let textDraft='';
const document={
 getElementById(id){if(id==='app')return app;if(id==='live-status')return status;if(id==='time-number')return timerEl;if(id==='time-progress')return barEl;if(id==='case-answer')return app.innerHTML.includes('id="case-answer"')?{value:textDraft}:null;if(id==='manual-draft')return app.innerHTML.includes('id="manual-draft"')?{value:textDraft}:null;if(id==='grade-summary')return {textContent:''};if(id==='live-transcript')return {textContent:''};return null;},
 addEventListener(type,fn){handlers[type]=fn;},
 createElement(type){if(type==='a')return {href:'',download:'',click(){downloads.push(this.download)},remove(){}};return {style:{},remove(){}};},
 body:{appendChild(){}},
};
class DateMock extends Date{constructor(...a){super(...(a.length?a:[clock]))}static now(){return clock}}
const fakeStorage={getItem(k){return saved[k]||null},setItem(k,v){saved[k]=v}};
class Recognition{
 constructor(){Recognition.instances.push(this);this.results=[];this.started=false;}
 start(){this.started=true;this.onstart?.()}
 stop(){this.started=false;this.onend?.()}
 emit(txt){this.onresult?.({results:[{isFinal:true,0:{transcript:txt}}]})}
}
Recognition.instances=[];
const window={SpeechRecognition:Recognition,addEventListener(){}};
const ctx={window,document,localStorage:fakeStorage,console,navigator:{},location:{protocol:'file:'},Date:DateMock,JSON,Number,Math,Array,Object,String,Set,Map,Blob,URL:{createObjectURL(blob){lastBlob=blob;return 'blob:test'},revokeObjectURL(){}},setInterval(fn){const id=nextInterval++;intervals.set(id,fn);return id},clearInterval(id){intervals.delete(id)},setTimeout(fn){return 0},fetch:async()=>({ok:true,json:async()=>pack})};
vm.runInNewContext(src,ctx,{filename:'app.js'});
const api=window.ResponseLabDaily;
const state=()=>api.getState().sessions[pack.session_id];
const click=async(action,extra={})=>{handlers.click({target:{closest:()=>({disabled:false,dataset:{action,...extra}})}});for(let i=0;i<5;i++)await Promise.resolve();};
const advance=async(ms)=>{clock+=ms;for(let k=0;k<5;k++){for(const fn of [...intervals.values()])fn();await Promise.resolve();}};
const input=(id,value,extra={})=>{textDraft=value;handlers.input({target:{id,value,...extra,classList:{contains:cls=>cls==='note-field'&&extra.type==='note'}}});};
const change=(id,value,extra={})=>handlers.change({target:{id,value,classList:{contains:cls=>(cls==='grade-field'&&extra.type==='grade')||(cls==='axis-grade'&&extra.type==='axis-grade')},dataset:extra.dataset||{}}});
async function run(){
 let tests=0;const check=(cond,msg)=>{assert.ok(cond,msg);tests++};
 check(api.validatePack(pack).quiz.length===6,'6 QCM');
 check(api.validatePack(pack).cases.length===2,'2 cas');
 check(api.validatePack(pack).oral.length===3,'3 oraux');
 const duplicate=JSON.parse(JSON.stringify(pack));duplicate.quiz[1].id=duplicate.quiz[0].id;
 assert.throws(()=>api.validatePack(duplicate),/double/);tests++;
 const invalid=JSON.parse(JSON.stringify(pack));invalid.quiz[0].correct_index=4;
 assert.throws(()=>api.validatePack(invalid),/QCM invalide/);tests++;
 check(app.innerHTML.includes('Importer le fichier du jour'), 'home renders');
 await click('demo');
 check(state().cursor===0,'loaded');
 check(app.innerHTML.includes('Question de raisonnement rapide')&&!app.innerHTML.includes(pack.quiz[0].question),'quiz hidden until started');
 for(let k=0;k<6;k++){
  await click('quiz-start');check(state().phase==='running','quiz running '+k);
  check(app.innerHTML.includes(pack.quiz[k].question),'quiz visible '+k);
  if(k===0){await advance(40100);check(state().answers['J1-Q1'].timedOut,'timeout first QCM');}
  else{await click('quiz-choose',{index:String(pack.quiz[k].correct_index)});check(state().answers[pack.quiz[k].id].correct===true,'immediate correct '+k);}
  check(state().phase==='review'&&app.innerHTML.includes('Réponse correcte'),'quiz feedback '+k);
  await click('next');
 }
 check(state().cursor===6,'quiz finished');
 for(let k=0;k<2;k++){
  check(!app.innerHTML.includes(pack.cases[k].context),'case context concealed until timed start '+k);
  await click('case-start');check(state().phase==='writing'&&state().timer?.seconds===110&&app.innerHTML.includes('case-answer')&&app.innerHTML.includes('case-context-pane')&&app.innerHTML.includes(pack.cases[k].context),'simultaneous reading and writing '+k);
  check(app.innerHTML.includes('timer-dock')&&app.innerHTML.includes('time-number'),'large timer dock present '+k);
  input('case-answer','Ma réponse de cas numéro '+(k+1)+'.');
  if(k===0)await advance(110010);else await click('case-finish');
  check(state().phase==='review'&&state().answers[pack.cases[k].id].text.includes('Ma réponse'),'draft stored '+k);
  await click('next');
 }
 check(state().cursor===8,'case complete');
 for(let k=0;k<3;k++){
  check(app.innerHTML.includes(pack.oral[k].confrontation),'oral confrontation preview '+k);
  check(state().phase==='ready'&&!state().timer,'oral clock not started '+k);
  await click('speech-start');
  check(state().phase==='speaking'&&state().timer?.seconds===40,'speech timer synchronised '+k);
  Recognition.instances.at(-1).emit('Je clarifie le point important pour avancer.');
  if(k===0)await advance(40100);else await click('oral-finish');
  check(state().phase==='review','oral review '+k);
  check(state().answers[pack.oral[k].id].transcript.includes('Je clarifie'),'oral transcription saved '+k);
  if(k===0)input('edited-transcript','Je clarifie le point important pour avancer.');
  await click('next');
 }
 check(state().phase==='finished'&&state().cursor===11,'finished after 11');
 check(app.innerHTML.includes('Mes cinq repères d'amélioration'),'manual notes screen');
 for(let n=0;n<11;n++)change('grade-'+n,String(n%6),{type:'grade',dataset:{id:[...pack.quiz,...pack.cases,...pack.oral][n].id}});
 check(Object.values(state().grades).filter(n=>Number.isInteger(n)).length===11,'all 11 manual 0–5 grades saved');
 for(const axis of ['analyse','raisonnement','decision','expression','adaptation'])change('axis-grade-'+axis,'5',{type:'axis-grade',dataset:{axis}});
 check(Object.values(state().axes).filter(n=>n===5).length===5,'five axes scored 0–5');
 await click('export');
 check(downloads.length===1&&downloads[0].includes('RL-D-2026-11-07'),'file downloaded');
 const exported=JSON.parse(await lastBlob.text());
 check(exported.schema==='response-lab-daily-answers-v2','export schema');
 check(exported.answers.length===11,'all 11 answers exported');
 check(exported.coach_axes?.length===5,'five coach axes in export');
 check(exported.answers.some(x=>x.manual_grade_0_5===5),'grading scale 0 to 5 exported');
 check(app.innerHTML.includes('Mes cinq repères d'), 'rubric shown');
 check(exported.answers.filter(x=>x.type==='oral').every(x=>x.transcript_raw.length>0),'transcripts exported');
 check(exported.answers.filter(x=>x.type==='quiz').length===6,'qcm answers exported');
 for(const q of exported.answers.filter(x=>x.type==='quiz')){
  check(q.displayed_options?.length===4,'four displayed QCM choices exported');
  check(q.displayed_options['ABCD'.indexOf(q.displayed_correct_letter)]===q.correct_answer,'correct displayed letter maps to exported answer');
  if(q.chosen_index!==null)check(q.displayed_options['ABCD'.indexOf(q.displayed_chosen_letter)]===q.chosen_answer,'chosen displayed letter maps to chosen answer');
 }
 check(!app.innerHTML.includes('<script>alert(1)</script>'),'safely rendered');
 await click('home');check(state().phase==='finished','history preserved on home');
 await click('open',{id:pack.session_id});check(app.innerHTML.includes('Mes cinq repères d'amélioration'),'history resume after completion');
 console.log(`PASS ${tests} checks: import, validation, 6 timed QCM, 2 cases, 3 speech transcriptions, 11 manual grades, export, persistence.`);
}
run().catch(e=>{console.error(e);process.exitCode=1});
