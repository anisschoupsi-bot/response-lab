'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..');
const storage=new Map(),dbStore=new Map(),elements=new Map();
const el=id=>{if(!elements.has(id))elements.set(id,{id,innerHTML:'',textContent:'',value:'3',checked:false,disabled:false,classList:{add(){},remove(){},toggle(){}},append(){},style:{},addEventListener(){},querySelector(){return null},querySelectorAll(){return[]}});return elements.get(id)};
const tracks=[{stop(){this.stopped=true}}];
const stream={getTracks(){return tracks}};
let deferred=null;
function recEvent(self,type,data){for(const fn of self.listeners[type]||[])fn(data||{})}
class FakeMediaRecorder{
 constructor(str){assert.equal(str,stream);this.listeners={};this.mimeType='audio/webm';this.state='inactive'}
 addEventListener(k,cb){(this.listeners[k]??=[]).push(cb)}
 start(){this.state='recording';setTimeout(()=>recEvent(this,'start'),25)}
 stop(){this.state='inactive';setTimeout(()=>{this.ondataavailable({data:new Blob(['FAKE AUDIO CONTENT - TEST ONLY'],{type:'audio/webm'})});recEvent(this,'stop')},8)}
}
const indexedDB={open(){const req={result:null};setTimeout(()=>{const db={objectStoreNames:{contains:()=>true},createObjectStore(){},close(){},transaction(){const tx={};tx.objectStore=()=>({put(value){setTimeout(()=>{dbStore.set(value.key,value);tx.oncomplete?.()},4)},get(key){const request={result:null};setTimeout(()=>{request.result=dbStore.get(key);request.onsuccess?.()},4);return request}});return tx}};req.result=db;req.onsuccess?.()},3);return req}};
const fake={console,URL,Blob,Date,Math,JSON,Object,Array,Set,Map,Number,String,Boolean,Error,Promise,performance,setTimeout,clearTimeout,indexedDB,navigator:{mediaDevices:{getUserMedia(){return new Promise(resolve=>deferred=resolve)}}},location:{protocol:'file:',hostname:''},window:null,document:{getElementById:el,querySelectorAll(){return[]},querySelector(){return null},createElement(tag){return {...el('created-'+tag+'-'+Math.random()),dataset:{},append(){},textContent:'',controls:false,preload:'',src:''}},addEventListener(){},body:{append(){}}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},addEventListener(){},setInterval(){return 123},clearInterval(){},confirm(){return true}};
fake.window=fake;fake.MediaRecorder=FakeMediaRecorder;
const ctx=vm.createContext(fake);
for(const d of ['attention','reasoning','decision','flexibility','pressure'])vm.runInContext(fs.readFileSync(path.join(ROOT,'assets',d+'.js'),'utf8'),ctx);
for(const script of ['app-core.js','app-runtime.js'])vm.runInContext(fs.readFileSync(path.join(ROOT,'assets',script),'utf8'),ctx);
const run=src=>vm.runInContext(src,ctx);
async function main(){
 run("startScenario();changeStage('oral1')");
 const promise=run('beginOral()');
 assert.equal(run('session.oralStarted'),null,'timer must remain stopped before permission');
 assert.equal(run('session.oralPreparing'),true);
 deferred(stream);
 await promise;
 assert.equal(run('voice?.recorder?.state'),'recording');
 assert.equal(run('typeof session.oralStarted'),'number');
 assert.equal(run('session.oralPreparing'),false);
 // Simulated browser lacks guaranteed on-device dictation, so it must never invoke a cloud recognizer.
 assert.match(run('session.transcriptionStatus.oral1'),/Dictée locale|Audio local|on-device|audio/i);
 await run('finishOral()');
 assert.equal(run('session.oral.oral1.recorded'),true);
 assert.equal(run('session.audioBlobs.oral1.size')>0,true);
 assert.equal(tracks[0].stopped,true);
 run("session.transcripts.oral1='Ma réponse sans embellissement';changeStage('review')");
 await run('finalize()');
 assert.equal(run('state.attempts.length'),1);
 assert.equal(run('state.attempts[0].audioPhases.length'),1);
 assert.equal(run('state.attempts[0].transcripts.oral1'),'Ma réponse sans embellissement');
 const id=run('state.attempts[0].id');
 assert.equal((await run(`readAudioClip(${JSON.stringify(id+'|oral1')})`)).size>0,true);
 assert.equal(JSON.parse(storage.get('response-lab-v3-state-v1')).attempts.length,1);
 console.log('PASS: getUserMedia permission -> recorder ready -> timer -> stop -> IndexedDB -> persistent progress');
 // Rejection does not start clock or pretend recording succeeded.
 run("startScenario();changeStage('oral1')");
 fake.navigator.mediaDevices.getUserMedia=async()=>{const e=Error('Access denied');e.name='NotAllowedError';throw e};
 await run('beginOral()');
 assert.equal(run('session.oralStarted'),null);
 assert.equal(run('session.oralPreparing'),false);
 assert.match(run('session.oralError'),/refusée/);
 await run('manualOral()');
 assert.equal(run('typeof session.oralStarted'),'number');
 await run('finishOral()');
 assert.equal(run('session.oral.oral1.recorded'),false);
 console.log('PASS: permission denied -> timer remains stopped, manual fallback works');
 // Remote dictation is never used, even when a vendor SpeechRecognition exists without local guarantee.
 class UnsafeSpeech{static async available(){return 'available'};constructor(){this.lang='';this.start=function(){throw Error('Cloud recognizer must never start')};}}
 fake.SpeechRecognition=UnsafeSpeech;
 fake.navigator.mediaDevices.getUserMedia=async()=>stream;
 run("startScenario();changeStage('oral1')");
 await run('beginOral()');
 await new Promise(r=>setTimeout(r,30));
 assert.match(run('session.transcriptionStatus.oral1'),/strictement locale|on-device/i);
 await run('finishOral()');
 console.log('PASS: speech recognizer with no processLocally guarantee cannot start remote dictation');
}
main().catch(e=>{console.error(e);process.exitCode=1});
