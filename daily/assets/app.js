'use strict';
/* Response Lab Daily 2.4 multi-LLM: 110 s simultaneous written cases, configurable speech locale,
   0–5 manual coaching, historic progress, recoverable sessions and preserved v1 data.
   Timers use wall-clock deadlines. SpeechRecognition depends on the browser and may use remote services. */
(()=>{
const SCHEMA='response-lab-daily-session-v1';
const RESPONSE_SCHEMA='response-lab-daily-answers-v2';
const LEGACY_STORE='response-lab-daily-state-v1';
const STORE='response-lab-daily-state-v2';
const BACKUP_SCHEMA='response-lab-daily-backup-v2';
const QUIZ_SECONDS=40, CASE_SECONDS=110, ORAL_SECONDS=40;
const AXES=[['analyse','Compréhension et analyse'],['raisonnement','Qualité du raisonnement'],['decision','Prise de décision'],['expression','Réactivité et formulation'],['adaptation','Adaptation sous pression']];
const LOCALES={FR:[['fr-FR','Français (France)'],['fr-CA','Français (Canada)']],EN:[['en-US','English (US)'],['en-GB','English (UK)'],['en-AU','English (Australia)'],['en-IN','English (India)']]};
const ALL_LOCALES=[...LOCALES.FR,...LOCALES.EN];
const MAX_BYTES=500000;
const dom=document.getElementById('app');
const status=document.getElementById('live-status');
let db={version:2,activeId:null,sessions:{}};
let ticker=null, speech=null, testSpeech=null, testTranscript='', speechStatus='', duplicateNotice='', pendingPack=null;
let speechStopTimer=null, speechErrorTimer=null, speechAttempt=0;
const e=t=>String(t??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const byId=id=>document.getElementById(id);
const fmt=n=>`${Math.max(0,Math.ceil(n))} s`;
const stamp=()=>new Date().toISOString();
function notify(message){status.textContent=message;status.title=message;}
function isString(s,max=10000){return typeof s==='string'&&s.trim().length>0&&s.length<=max;}
function validDay(s){return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(new Date(`${s}T12:00:00Z`).getTime())&&new Date(`${s}T12:00:00Z`).toISOString().slice(0,10)===s;}
function validatePack(o){
 if(!o||o.schema!==SCHEMA)throw Error('Format de séance inconnu : response-lab-daily-session-v1 attendu.');
 if(!isString(o.session_id,80)||!/^[-A-Za-z0-9_]+$/.test(o.session_id)||['__proto__','constructor','prototype'].includes(o.session_id))throw Error('Identifiant de séance invalide.');
 if(!validDay(o.date)||!['FR','EN'].includes(o.language)||!isString(o.title,180))throw Error('Date, langue ou titre de séance invalide.');
 if(!Array.isArray(o.quiz)||o.quiz.length!==6||!Array.isArray(o.cases)||o.cases.length!==2||!Array.isArray(o.oral)||o.oral.length!==3)throw Error('Une séance doit contenir exactement 6 QCM, 2 cas écrits et 3 confrontations orales.');
 const ids=new Set();
 for(const [kind,arr] of [['QCM',o.quiz],['cas écrit',o.cases],['oral',o.oral]])for(const x of arr){
  if(!x||!isString(x.id,70)||!/^[-A-Za-z0-9_]+$/.test(x.id)||ids.has(x.id))throw Error(`Identifiant de ${kind} invalide ou en double.`);
  ids.add(x.id);
  if(!isString(x.skill,80))throw Error(`Compétence manquante dans ${x.id}.`);
  if(kind==='QCM'){
   if(!isString(x.question,1200)||!Array.isArray(x.options)||x.options.length!==4||x.options.some(v=>!isString(v,500))||!Number.isInteger(x.correct_index)||x.correct_index<0||x.correct_index>3||!isString(x.explanation,2000))throw Error(`QCM invalide : ${x.id}.`);
   if(x.option_explanations!==undefined&&(!Array.isArray(x.option_explanations)||x.option_explanations.length!==4||x.option_explanations.some(v=>!isString(v,1100))))throw Error(`Explications des choix invalides : ${x.id}.`);
  }else if(kind==='cas écrit'){
   if(!isString(x.title,160)||!isString(x.context,4000)||!isString(x.task,1100))throw Error(`Cas écrit invalide : ${x.id}.`);
  }else if(!isString(x.context,2500)||!isString(x.confrontation,1400))throw Error(`Confrontation invalide : ${x.id}.`);
 }
 return JSON.parse(JSON.stringify(o));
}
// Imported backups/localStorage are untrusted. Never interpolate raw record metadata into HTML.
function sanitizeSavedContent(s){
 const items=steps(s.pack),known=new Map(items.map(item=>[item.id,item]));
 const saved=Object.create(null);
 for(const [id,raw] of Object.entries(s.answers||{})){
  const item=known.get(id);if(!item||!raw||typeof raw!=='object'||Array.isArray(raw))continue;
  const a={id,kind:item.kind};
  if(typeof raw.startedAt==='string')a.startedAt=raw.startedAt.slice(0,80);
  if(typeof raw.finishedAt==='string')a.finishedAt=raw.finishedAt.slice(0,80);
  a.elapsedSec=typeof raw.elapsedSec==='number'&&Number.isFinite(raw.elapsedSec)&&raw.elapsedSec>=0&&raw.elapsedSec<=1100?raw.elapsedSec:null;
  a.timedOut=raw.timedOut===true;
  if(item.kind==='quiz'){
   a.selectedIndex=Number.isInteger(raw.selectedIndex)&&raw.selectedIndex>=0&&raw.selectedIndex<4?raw.selectedIndex:null;
   a.correct=a.selectedIndex!==null&&a.selectedIndex===item.correct_index&&!a.timedOut;
  }
  for(const field of ['text','transcript','finalTranscript','editedTranscript','interim'])
   if(typeof raw[field]==='string')a[field]=raw[field].slice(0,9000);
  a.transcriptEdited=raw.transcriptEdited===true;
  if(['manual','browser-speech'].includes(raw.capture))a.capture=raw.capture;
  a.alternatives=Array.isArray(raw.alternatives)?raw.alternatives.filter(v=>typeof v==='string').slice(0,6).map(v=>v.slice(0,1000)):[];
  a.stressReported=Number.isInteger(raw.stressReported)&&raw.stressReported>=0&&raw.stressReported<=10?raw.stressReported:null;
  saved[id]=a;
 }
 s.answers=saved;
 const gradeIds=new Set(items.map(i=>i.id));
 s.grades=Object.fromEntries(Object.entries(s.grades||{}).filter(([id,n])=>gradeIds.has(id)&&Number.isInteger(n)&&n>=0&&n<=5));
 s.legacyGrades=Object.fromEntries(Object.entries(s.legacyGrades||{}).filter(([id,n])=>gradeIds.has(id)&&Number.isInteger(n)&&n>=0&&n<=4));
 s.coachNotes=Object.fromEntries(Object.entries(s.coachNotes||{}).filter(([id,v])=>gradeIds.has(id)&&typeof v==='string').map(([id,v])=>[id,v.slice(0,1800)]));
 const axesKeys=new Set(AXES.map(([id])=>id));
 s.axes=Object.fromEntries(Object.entries(s.axes||{}).filter(([id,n])=>axesKeys.has(id)&&Number.isInteger(n)&&n>=0&&n<=5));
 s.axisNotes=Object.fromEntries(Object.entries(s.axisNotes||{}).filter(([id,v])=>axesKeys.has(id)&&typeof v==='string').map(([id,v])=>[id,v.slice(0,1200)]));
 s.coachSummary=typeof s.coachSummary==='string'?s.coachSummary.slice(0,2500):'';
 return s;
}
function adaptSession(s,legacy=false){
 if(!s||!s.pack)return null;
 validatePack(s.pack);
 if(!s.answers||typeof s.answers!=='object')s.answers={};
 if(!s.coachNotes||typeof s.coachNotes!=='object')s.coachNotes={};
 if(!s.grades||typeof s.grades!=='object')s.grades={};
 if(legacy){
  const oldGrades=Object.fromEntries(Object.entries(s.grades).filter(([,n])=>Number.isInteger(n)&&n>=0&&n<=4));
  s.legacyGrades=oldGrades; // Les notes 0–4 restent archivées, jamais converties automatiquement.
  s.grades={};
  s.migratedFromV1=true;
  if(s.phase==='reading'||(s.phase==='writing'&&s.timer?.seconds===60)){s.phase='ready';s.timer=null;s.migrationNotice='Ancien cas en cours : réponse partielle conservée, redémarre ce cas avec 110 secondes communes.';}
 }
 if(!s.axes||typeof s.axes!=='object')s.axes={};
 if(!s.axisNotes||typeof s.axisNotes!=='object')s.axisNotes={};
 if(!s.coachSummary||typeof s.coachSummary!=='string')s.coachSummary='';
 if(![1,2,10].includes(s.timerMultiplier))s.timerMultiplier=1;
 if(!ALL_LOCALES.some(([code])=>code===s.speechLocale))s.speechLocale=s.pack.language==='EN'?'en-US':'fr-FR';
 // Restore invalid or corrupted session metadata without interpreting arbitrary values as valid states.
 if(!Number.isInteger(s.cursor)||s.cursor<0||s.cursor>11)s.cursor=0;
 const phases=['ready','running','reading','writing','arming','speaking','closing','review','finished'];
 if(!phases.includes(s.phase))s.phase='ready';
 if(s.timer && (!Number.isFinite(s.timer.endsAt)||!Number.isFinite(s.timer.startedAt)||
    !Number.isFinite(s.timer.seconds)||s.timer.seconds<=0||s.timer.seconds>1100||
    typeof s.timer.stepId!=='string'||s.timer.stepId!==steps(s.pack)[s.cursor]?.id))s.timer=null;
 if(['running','writing','speaking'].includes(s.phase)&&!s.timer){s.phase='ready';s.recoveryNotice='Exercice interrompu : les réponses partielles ont été conservées.';}
 if(s.cursor===11)s.phase='finished';
 else if(s.phase==='finished'){s.phase='ready';s.recoveryNotice='Données de progression incohérentes : les réponses présentes restent conservées.';}
 return sanitizeSavedContent(s);
}
function load(){
 let obj=null,legacy=false;
 try{
  const raw=localStorage.getItem(STORE);
  if(raw){const found=JSON.parse(raw);if(found?.version===2&&found.sessions&&typeof found.sessions==='object')obj=found;}
  if(!obj){const old=localStorage.getItem(LEGACY_STORE);if(old){const found=JSON.parse(old);if(found?.version===1&&found.sessions&&typeof found.sessions==='object'){obj=found;legacy=true;}}}
  if(!obj)return;
  const safe=Object.create(null);let invalid=0;
  for(const [id,s] of Object.entries(obj.sessions).slice(-500))try{
   if(s&&s.pack?.session_id===id&&/^[-A-Za-z0-9_]+$/.test(id))safe[id]=adaptSession(s,legacy);
  }catch(err){invalid++;console.warn('Séance ignorée, données invalides',id,err);}
  if(invalid)notify(invalid+' séance(s) invalides ignorées. Restaure une sauvegarde si nécessaire.');
  db={version:2,activeId:safe[obj.activeId]?obj.activeId:null,sessions:safe};
  if(legacy){save();notify('Anciennes séances préservées. Les notes sur 0–4 sont archivées séparément.');}
 }catch(err){console.warn('Sauvegarde illisible',err);notify('Sauvegarde illisible : les fichiers existants n’ont pas été supprimés.');}
}
function save(){
 try{localStorage.setItem(STORE,JSON.stringify(db));return true}
 catch(err){notify('Enregistrement local impossible (stockage saturé ou désactivé). Exporte tes réponses.');console.error(err);return false;}
}
// Les actions destructives sont atomiques : on écrit le nouvel état avant de remplacer l'ancien en mémoire.
function commitState(next){
 try{localStorage.setItem(STORE,JSON.stringify(next));db=next;return true;}
 catch(err){notify('Réinitialisation ou restauration impossible : sauvegarde locale indisponible. Rien n’a été effacé.');console.error(err);return false;}
}
function freshSession(pack, previous=null){return {pack,cursor:0,phase:'ready',timer:null,answers:{},grades:{},coachNotes:{},axes:{},axisNotes:{},coachSummary:'',speechLocale:previous?.speechLocale&&ALL_LOCALES.some(([code])=>code===previous.speechLocale)?previous.speechLocale:(pack.language==='EN'?'en-US':'fr-FR'),timerMultiplier:1,createdAt:stamp(),finishedAt:null};}
function modeLocked(s){return s.cursor>0||s.phase!=='ready'||Object.values(s.answers||{}).some(r=>r?.startedAt||r?.timedOut||r?.selectedIndex!==undefined);}
function backupSnapshot(sessions=db.sessions){return {schema:BACKUP_SCHEMA,exported_at:stamp(),version:2,sessions};}
function exportSafetyCopy(label){downloadFile('Response_Lab_Sauvegarde_avant_'+label+'_'+new Date().toISOString().slice(0,10)+'.json',backupSnapshot());}
function stopAllActivity(){
 if(speech)endSpeech(true);
 stopSpeechTest();clearTick();
 if(speechStopTimer!==null){if(typeof clearTimeout==='function')clearTimeout(speechStopTimer);speechStopTimer=null;}
 if(speechErrorTimer!==null){if(typeof clearTimeout==='function')clearTimeout(speechErrorTimer);speechErrorTimer=null;}
 speechAttempt=0;testTranscript='';speechStatus='';duplicateNotice='';pendingPack=null;
}
// Never clear the entire origin: older Response Lab products share this GitHub Pages domain.
function storedKeys(storage,prefix='response-lab-daily-'){
 try{
  if(!storage||typeof storage.length!=='number'||typeof storage.key!=='function')return [];
  const keys=[];for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key?.startsWith(prefix))keys.push(key);}return keys;
 }catch{return [];} // Private browsing and sandboxed pages may deny storage access.
}
function eraseOwnedStoredData(){
 const failures=[];let session=null;
 try{session=typeof sessionStorage==='undefined'?null:sessionStorage;}catch{}
 for(const storage of [localStorage,session]){
  for(const key of storedKeys(storage)){if(storage===localStorage&&key===STORE)continue;try{storage.removeItem(key);}catch(err){failures.push('stockage '+key);}}
 }
 // Keep a v2 empty tombstone, preventing deleted v1 sessions from being migrated again on reload.
 return failures;
}
async function clearOwnedOfflineData(){
 const warnings=[];
 // Opaque origins (about:/data:) cannot use persistent CacheStorage or IndexedDB reliably.
 if(['about:','data:'].includes(location.protocol))return ['cache indisponible sur cette origine temporaire'];
 if(typeof caches!=='undefined'&&caches?.keys){
  try{for(const key of await caches.keys())if(key.startsWith('response-lab-daily-'))await caches.delete(key)}
  catch(err){warnings.push('cache hors ligne non effacé');}
 }
 if(typeof indexedDB!=='undefined'&&indexedDB?.databases){
  try{const databases=await indexedDB.databases();
   for(const entry of databases||[])if(entry?.name?.startsWith('response-lab-daily-')){
    await new Promise((resolve,reject)=>{const req=indexedDB.deleteDatabase(entry.name);req.onsuccess=()=>resolve();req.onerror=()=>reject(req.error||Error('IndexedDB'));req.onblocked=()=>reject(Error('IndexedDB verrouillé'));});
   }
  }catch(err){warnings.push('base IndexedDB locale non effacée');}
 }
 return warnings;
}
function confirmDeletion(primary,second,backupName){
 if(!window.confirm(primary))return false;
 try{exportSafetyCopy(backupName);}catch(err){notify('Suppression annulée : impossible de préparer la sauvegarde. '+err.message);return false;}
 return window.confirm(second+' Vérifie la présence du fichier de sauvegarde avant de confirmer.');
}
function deleteSession(id){
 const target=db.sessions[id];if(!target)return;
 if(!confirmDeletion('SUPPRIMER cette séance et ses réponses ? Les autres séances seront conservées.',
  'Confirmer la suppression définitive de la séance '+target.pack.date+' ?', 'suppression_session'))return;
 const nextSessions=Object.assign(Object.create(null),db.sessions);delete nextSessions[id];
 const next={...db,sessions:nextSessions,activeId:db.activeId===id?null:db.activeId};
 if(!commitState(next))return;
 stopAllActivity();render();notify('Séance supprimée : '+id+'. Les autres séances sont intactes.');
}
function deleteAllSessions(){
 const total=Object.keys(db.sessions).length;
 if(!total){notify('Aucune séance à supprimer.');return;}
 if(!confirmDeletion('SUPPRIMER les '+total+' séances importées, toutes leurs réponses et notes ?',
  'Confirmer la suppression de TOUTES les séances ?', 'suppression_toutes_sessions'))return;
 if(!commitState({version:2,activeId:null,sessions:Object.create(null)}))return;
 stopAllActivity();const warning=eraseOwnedStoredData();render();
 notify('Toutes les séances ont été supprimées.'+(warning.length?' Nettoyage partiel : '+warning.join(', '):''));
}
async function resetApplication(){
 if(!confirmDeletion('RÉINITIALISER complètement Response Lab Daily sur cet appareil ? Cela efface les séances, progrès, notes, réglages et cache hors ligne de CETTE application.',
  'Dernière confirmation : réinitialiser toutes les données Response Lab Daily ?', 'reinitialisation_application'))return;
 if(!commitState({version:2,activeId:null,sessions:Object.create(null)}))return;
 stopAllActivity();const warnings=[...eraseOwnedStoredData(),...await clearOwnedOfflineData()];render();
 notify('Response Lab Daily a été réinitialisée.'+(warnings.length?' Attention : '+warnings.join(', ')+'.':''));
}
function restartSession(){
 const s=active();if(!s)return;
 if(!window.confirm('Recommencer cette séance ? Toutes ses réponses, ses notes et son avancement seront effacés. Une sauvegarde complète sera téléchargée avant la remise à zéro.'))return;
 try{exportSafetyCopy('recommencement');}catch(err){notify('Impossible de préparer la sauvegarde : '+err.message);return;}
 if(!window.confirm('La sauvegarde a été proposée au téléchargement. Vérifie qu’elle est bien enregistrée sur ton appareil avant de confirmer la suppression de cet essai.'))return;
 const key=s.pack.session_id,pack=pendingPack?.session_id===key?pendingPack:s.pack;const next={...db,sessions:{...db.sessions,[key]:freshSession(pack,s)},activeId:key};
 if(!commitState(next))return;
 stopAllActivity();render();notify('Séance remise à zéro. Les exercices du fichier importé sont prêts.');
}
function resetProgress(){
 const total=Object.keys(db.sessions).length;
 if(!total){notify('Aucun progrès à réinitialiser.');return;}
 if(!window.confirm('RÉINITIALISER LE PROGRÈS DES '+total+' SÉANCES ? Toutes les réponses, notes et statistiques seront effacées. Les fichiers de séances resteront disponibles. Une sauvegarde complète sera téléchargée avant.'))return;
 try{exportSafetyCopy('reinitialisation');}catch(err){notify('Sauvegarde impossible : aucune donnée effacée. '+err.message);return;}
 if(!window.confirm('La sauvegarde a été proposée au téléchargement. AS-TU VÉRIFIÉ LE FICHIER ? Confirme uniquement si tu es prêt à perdre les réponses et notes de toutes les séances.'))return;
 const nextSessions=Object.create(null);
 for(const [key,s] of Object.entries(db.sessions))nextSessions[key]=freshSession(s.pack,s);
 const next={version:2,activeId:null,sessions:nextSessions};
 if(!commitState(next))return;
 stopAllActivity();render();notify('Progrès des '+total+' séances réinitialisés. Les fichiers de séances sont conservés.');
}
function active(){return db.activeId?db.sessions[db.activeId]:null;}
function steps(pack){return [...pack.quiz.map((x,i)=>({kind:'quiz',number:i+1,...x})),...pack.cases.map((x,i)=>({kind:'case',number:i+1,...x})),...pack.oral.map((x,i)=>({kind:'oral',number:i+1,...x}))];}
function current(s){return steps(s.pack)[s.cursor]||null;}
function result(s,item){return s.answers[item.id]||(s.answers[item.id]={id:item.id,kind:item.kind,startedAt:null,elapsedSec:null,timedOut:false});}
function stopSpeechTest(){if(!testSpeech)return;const rec=testSpeech;testSpeech=null;try{rec.stop();}catch{};}
function moveTo(id){if(speech)endSpeech(true);stopSpeechTest();duplicateNotice='';pendingPack=null;db.activeId=id;save();render();}
function create(pack){
 const validated=validatePack(pack),id=validated.session_id;
 if(db.sessions[id]){
  const existing=db.sessions[id];
  const untouched=existing.cursor===0&&existing.phase==='ready'&&Object.values(existing.answers||{}).every(r=>!r?.startedAt&&!r?.timedOut&&r?.selectedIndex===undefined&&!r?.text&&!r?.transcript);
  if(untouched){
   // Un fichier réimporté peut remplacer une bibliothèque vierge, sans effacer de résultats.
   existing.pack=validated;moveTo(id);notify('Séance déjà importée, encore vierge. Tu peux la commencer normalement.');return;
  }
  moveTo(id);pendingPack=validated;
  duplicateNotice='Ce fichier porte le même identifiant qu’une tentative déjà enregistrée. C’est cette tentative qui est affichée, pas un nouvel entraînement. Pour refaire la séance, utilise « Recommencer cette séance » après sauvegarde.';
  render();notify(duplicateNotice);return;
 }
 if(Object.keys(db.sessions).length>=500)throw Error('500 séances atteintes : utilise « Exporter ma sauvegarde », puis archive tes séances.');
 db.sessions[id]=freshSession(validated);db.activeId=id;duplicateNotice='';pendingPack=null;save();render();notify('Séance importée : 11 exercices prêts.');
}
async function importFile(file){
 if(!file)return;
 if(file.size>MAX_BYTES)throw Error('Fichier trop volumineux (maximum 500 Ko).');
 let pack;try{pack=JSON.parse(await file.text())}catch{throw Error('Le fichier ne contient pas de JSON valide.');}
 create(pack);
}
function progress(s){return s.cursor===11?11:s.cursor+(s.phase==='review'?1:0)}
function clearTick(){if(ticker!==null){clearInterval(ticker);ticker=null;}}
function beginTimed(s,phase,baseSeconds,startAt=Date.now()){clearTick();const secs=baseSeconds*(s.timerMultiplier||1);s.phase=phase;s.timer={phase,seconds:secs,startedAt:startAt,endsAt:startAt+secs*1000,stepId:current(s)?.id};save();render();runTick();}
function runTick(){clearTick();ticker=setInterval(tick,200);tick();}
function timeRemaining(s){return s.timer?Math.max(0,(s.timer.endsAt-Date.now())/1000):0;}
function tick(){
 const s=active();if(!s||!s.timer){clearTick();return;}
 if(s.timer.endsAt<=Date.now()){expire();return;}
 const n=byId('time-number');if(n){n.textContent=fmt(timeRemaining(s));n.classList.toggle('low',timeRemaining(s)<=10);}
 const bar=byId('time-progress');if(bar)bar.style.width=`${Math.max(0,Math.min(100,100*timeRemaining(s)/s.timer.seconds))}%`;
}
function stopTimer(){clearTick();const s=active();if(s)s.timer=null;}
function elapsed(s){return s.timer?Math.min(s.timer.seconds,Math.max(0,(Date.now()-s.timer.startedAt)/1000)):null;}
function expire(){
 const s=active();if(!s||!s.timer)return;const item=current(s);if(!item||s.timer.stepId!==item.id){stopTimer();return;}
 if(s.phase==='running'&&item.kind==='quiz'){const r=result(s,item);r.selectedIndex=null;r.correct=false;r.timedOut=true;r.elapsedSec=s.timer.seconds;stopTimer();s.phase='review';save();render();notify('Temps écoulé : correction affichée.');return;}
  if(s.phase==='writing'&&item.kind==='case'){finishCase(true);return;}
 if(s.phase==='speaking'&&item.kind==='oral'){finishOral(true);return;}
 stopTimer();
}
function chooseQuiz(index){
 const s=active(),item=s&&current(s);if(!s||item?.kind!=='quiz'||s.phase!=='running'||!s.timer||!Number.isInteger(index)||index<0||index>3)return;
 if(timeRemaining(s)<=0){expire();return;}
 const r=result(s,item);r.selectedIndex=index;r.correct=index===item.correct_index;r.timedOut=false;r.elapsedSec=Math.round(elapsed(s)*10)/10;stopTimer();s.phase='review';save();render();notify(r.correct?'Bonne réponse.':'Correction disponible.');
}
function finishCase(timeout=false){const s=active(),item=s&&current(s);if(!s||item?.kind!=='case'||s.phase!=='writing')return;
 if(!timeout&&s.timer&&timeRemaining(s)<=0){expire();return;}
 const r=result(s,item),el=byId('case-answer');if(el)r.text=el.value.slice(0,9000);
 r.elapsedSec=timeout?(s.timer?.seconds??CASE_SECONDS):Math.round(elapsed(s)*10)/10;r.timedOut=timeout;r.finishedAt=stamp();stopTimer();s.phase='review';save();render();notify('Réponse écrite enregistrée localement.');
}
function finishOral(timeout=false){const s=active(),item=s&&current(s);if(!s||item?.kind!=='oral'||s.phase!=='speaking')return;
 if(!timeout&&s.timer&&timeRemaining(s)<=0){expire();return;}
 const r=result(s,item),inp=byId('manual-draft');if(inp)r.transcript=inp.value.slice(0,9000);
 r.elapsedSec=timeout?(s.timer?.seconds??ORAL_SECONDS):Math.round(elapsed(s)*10)/10;r.timedOut=timeout;r.finishedAt=stamp();stopTimer();s.phase='closing';save();render();
 if(speech){endSpeech(false,()=>finalizeOral(s,item));}else finalizeOral(s,item);
}
function finalizeOral(s,item){if(active()!==s||current(s)?.id!==item.id)return;
 s.phase='review';s.timer=null;save();render();notify('Réponse orale enregistrée en texte. Vérifie la transcription avant de continuer.');}
function next(){const s=active();if(!s||s.phase!=='review')return;endSpeech(true);speechStatus='';speechAttempt=0;s.cursor+=1;s.timer=null;s.phase=s.cursor>=11?'finished':'ready';if(s.cursor>=11)s.finishedAt=stamp();save();render();}
function saveEditedTranscript(text){const s=active(),item=s&&current(s);if(!s||item?.kind!=='oral'||s.phase!=='review')return;
 const r=result(s,item);r.editedTranscript=String(text).slice(0,9000);r.transcriptEdited=r.editedTranscript.trim()!==String(r.transcript||'').trim();save();}
function speechErrorMessage(code){
 const messages={
  'phrases-not-supported':'Ce moteur vocal ne prend pas en charge les indices de vocabulaire. Nouvel essai sans option expérimentale, puis mode sans micro si nécessaire.',
  'language-not-supported':'Cette langue de dictée n’est pas prise en charge ici. Choisis une autre variante française ou anglaise et réessaie.',
  'no-speech':'Aucune parole détectée. Vérifie le micro, parle plus près et relance la dictée.',
  'audio-capture':'Aucun son reçu. Vérifie le micro branché, son accès et le périphérique sélectionné dans le navigateur.',
  'not-allowed':'Accès refusé. Autorise le microphone dans les permissions du site, puis relance ; sinon utilise le mode sans micro.',
  'service-not-allowed':'Le navigateur interdit ce service de transcription. Essaie Chrome/Edge compatible ou le mode sans micro.',
  'network':'Service vocal inaccessible. Vérifie Internet ou utilise le mode sans micro : la dictée peut dépendre d’un fournisseur distant.',
  'aborted':'La dictée a été interrompue. Réessaie si tu ne l’as pas annulée, ou continue sans micro.',
  'language-unavailable':'Pack de langue indisponible. Choisis un autre accent ou utilise le mode sans micro.'
 };
 return messages[code]||'Erreur de reconnaissance ('+code+'). Vérifie les permissions, la langue et le navigateur, ou passe en mode sans micro.';
}
function microphoneWarning(){
 if(window.isSecureContext===false && location.protocol==='http:' && !['localhost','127.0.0.1'].includes(location.hostname))return 'Le microphone nécessite un contexte sécurisé HTTPS ou localhost. Ouvre le site sur GitHub Pages.';
 // file:// may be permitted by some browsers, but its reliability is not guaranteed.
 return '';
}
function prepareSpeechTest(){
 const s=active(),item=s&&current(s);
 if(!s||item?.kind!=='oral'||s.phase!=='ready'||testSpeech||speech)return;
 const warning=microphoneWarning();if(warning){speechStatus=warning;render();return;}
 const Factory=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Factory){speechStatus='Test indisponible : reconnaissance vocale non prise en charge ici. Mode sans micro disponible.';render();return;}
 let rec;
 try{rec=new Factory();rec.lang=s.speechLocale;rec.continuous=false;rec.interimResults=true;rec.maxAlternatives=2;}
 catch(err){speechStatus='Impossible de préparer le test : '+String(err?.message||err);render();return;}
 testSpeech=rec;testTranscript='';speechStatus='Test de dictée : autorise le microphone et dis une courte phrase.';render();
 rec.onstart=()=>{if(testSpeech!==rec)return;speechStatus='Test micro actif : parle dans la langue sélectionnée.';render();};
 rec.onresult=event=>{if(testSpeech!==rec)return;const values=[];for(let i=0;i<event.results.length;i++){
  const r=event.results[i];if(r?.[0]?.transcript)values.push(r[0].transcript.trim());
 }testTranscript=values.join(' ').slice(0,500);speechStatus=testTranscript?'Test reconnu : '+testTranscript:'En attente de paroles…';render();};
 rec.onerror=event=>{if(testSpeech!==rec)return;testSpeech=null;speechStatus=speechErrorMessage(String(event?.error||'unknown'));render();};
 rec.onend=()=>{if(testSpeech!==rec)return;testSpeech=null;speechStatus=testTranscript?'Test terminé. Vérifie la transcription.':'Test terminé sans texte ; réessaie ou utilise le mode sans micro.';render();};
 try{rec.start();}catch(err){testSpeech=null;speechStatus='Test impossible : '+String(err?.message||err);render();}
}
function prepareSpeech(restart=false,recovery=false){
 const s=active(),item=s&&current(s);
 if(!s||item?.kind!=='oral'||testSpeech||speech||(!restart&&s.phase!=='ready')||(restart&&(s.phase!=='speaking'||timeRemaining(s)<=0)))return;
 const warning=microphoneWarning();if(warning){speechStatus=warning;render();return;}
 const Factory=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Factory){speechStatus='La reconnaissance vocale n’est pas disponible sur ce navigateur. Utilise le mode sans micro.';render();return;}
 let rec;try{rec=new Factory()}catch{speechStatus='Impossible de préparer la dictée : essaie un navigateur compatible.';render();return;}
 const itemId=item.id,record=result(s,item);
 const capture={rec,itemId,started:false,closing:false,onDone:null,base:restart?(record.transcript||record.finalTranscript||''):'',error:null,recovery};
 speech=capture;if(!restart)s.phase='arming';
 speechStatus=recovery?'Tentative automatique sans option expérimentale…':restart?'Relance du micro sans remettre le chrono à zéro…':'Autorisation du microphone en cours…';
 save();render();
 rec.lang=s.speechLocale|| (s.pack.language==='EN'?'en-US':'fr-FR');
 rec.continuous=true;rec.interimResults=true;rec.maxAlternatives=2;
 // No recognition.phrases, grammars, or processLocally. These experimental options can reject start() asynchronously.
 rec.onstart=()=>{if(speech!==capture||active()!==s||current(s)?.id!==itemId)return;
  capture.started=true;record.capture='browser-speech';if(!restart)record.startedAt=stamp();
  speechStatus='Micro actif · la dictée commence';
  if(restart){save();render();}else beginTimed(s,'speaking',ORAL_SECONDS);
 };
 rec.onresult=ev=>{if(speech!==capture||active()!==s||current(s)?.id!==itemId)return;
  const finals=[],parts=[];
  for(let i=0;i<ev.results.length;i++){
   const piece=ev.results[i]?.[0]?.transcript?.trim();if(!piece)continue;
   (ev.results[i].isFinal?finals:parts).push(piece);
  }
  record.transcript=[capture.base,...finals,...parts].filter(Boolean).join(' ').slice(0,9000);
  record.finalTranscript=[capture.base,...finals].filter(Boolean).join(' ').slice(0,9000);
  record.interim=parts.join(' ');record.alternatives=[];
  for(let j=0;j<ev.results.length;j++){const entry=ev.results[j];if(!entry||entry.length<2)continue;
   for(let k=1;k<Math.min(entry.length,3);k++){const alt=entry[k]?.transcript?.trim();if(alt&&!record.alternatives.includes(alt))record.alternatives.push(alt);}
  }record.alternatives=record.alternatives.slice(0,6);
  save();const el=byId('live-transcript');if(el)el.textContent=record.transcript||'Transcription en cours…';
 };
 rec.onerror=ev=>{if(speech!==capture)return;
  capture.error=String(ev?.error||'unknown');
  speechStatus=speechErrorMessage(capture.error);
  if(!capture.started&&!restart){s.phase='ready';save();}
  // Some implementations omit onend after an early asynchronous error; unblock the UI.
  if(speechErrorTimer!==null){if(typeof clearTimeout==='function')clearTimeout(speechErrorTimer);speechErrorTimer=null;}
  speechErrorTimer=setTimeout(()=>{speechErrorTimer=null;if(speech===capture&&!capture.closing)rec.onend?.();},1200);
  // Wait for onend before retrying; browsers reject concurrent start().
  render();
 };
 rec.onend=()=>{
  if(speech!==capture)return;
  if(speechStopTimer!==null){if(typeof clearTimeout==='function')clearTimeout(speechStopTimer);speechStopTimer=null;}
  if(speechErrorTimer!==null){if(typeof clearTimeout==='function')clearTimeout(speechErrorTimer);speechErrorTimer=null;}
  const done=capture.onDone;
  if(capture.closing){speech=null;save();if(done)done();return;}
  speech=null;
  // Retry at most once, with no hints and without resetting an already-running timer.
  if(capture.error && !recovery && speechAttempt===0 &&
     ['phrases-not-supported','no-speech','language-not-supported'].includes(capture.error)){
   speechAttempt=1;
   if(capture.error==='language-not-supported'){
    const fallback=s.speechLocale.startsWith('en')?'en-US':'fr-FR';
    if(s.speechLocale!==fallback){s.speechLocale=fallback;save();}else{
     speechStatus=speechErrorMessage(capture.error);render();return;
    }
   }
   if(active()===s&&current(s)?.id===itemId&&(!capture.started||s.phase==='speaking'&&timeRemaining(s)>3)){
    if(!capture.started)s.phase='ready';
    prepareSpeech(capture.started,true);
    return;
   }
  }
  if(!capture.started&&s.phase==='arming')s.phase='ready';
  if(!capture.error && s.phase==='speaking')speechStatus='Le micro s’est arrêté. Le chronomètre continue ; relance-le ou utilise la saisie manuelle.';
  save();render();
 };
 try{rec.start()}catch(err){
  speech=null;if(!restart)s.phase='ready';
  const code=err?.name==='NotAllowedError'?'not-allowed':err?.name==='SecurityError'?'service-not-allowed':'unknown';
  speechStatus=speechErrorMessage(code)+' '+String(err?.message||'');save();render();
 }
}
function endSpeech(immediate=false,done){
 if(!speech){if(done)done();return;}
 const capture=speech;capture.closing=true;capture.onDone=done||null;
 if(speechStopTimer!==null){if(typeof clearTimeout==='function')clearTimeout(speechStopTimer);speechStopTimer=null;}
 try{capture.rec.stop();}catch{speech=null;if(done)done();return;}
 if(immediate){speech=null;if(done)done();return;}
 if(speech===capture)speechStopTimer=setTimeout(()=>{speechStopTimer=null;if(speech===capture){speech=null;speechStatus='La finalisation a pris trop de temps. Vérifie la transcription conservée.';if(done)done();}},2000);
}

function startManualOral(){const s=active(),item=s&&current(s);if(!s||item?.kind!=='oral'||s.phase!=='ready')return;
 const r=result(s,item);r.capture='manual';r.transcript='';r.startedAt=stamp();speechStatus='Mode sans micro : parle à voix haute, puis saisis la réponse pour la correction.';beginTimed(s,'speaking',ORAL_SECONDS);
}
function buildTimer(s,desc){const r=s.timer;return `<div class="timer-box" role="timer" aria-label="Temps restant, ${fmt(timeRemaining(s))}"><span class="timer-label">${e(desc)}</span><strong id="time-number" class="timer-number">${fmt(timeRemaining(s))}</strong><div class="timer-track"><span id="time-progress" style="width:${Math.max(0,100*timeRemaining(s)/r.seconds)}%"></span></div></div>`;}
function timerDock(s,item){if(!s.timer)return '';return `<div class="timer-dock" aria-label="Chronomètre en haut à droite">${buildTimer(s,item.kind==='quiz'?'QCM':item.kind==='case'?'Cas écrit':'Réponse orale')}</div>`;}
function head(s,item){const idx=s.cursor;return `${item?timerDock(s,item):''}${duplicateNotice?`<div class="notice amber" role="status">${e(duplicateNotice)}</div>`:''}${s.recoveryNotice?`<div class="notice amber" role="status">${e(s.recoveryNotice)}</div>`:''}<div class="topline"><div><p class="eyebrow">${e(s.pack.date)} · ${e(s.pack.language)} · Séance quotidienne</p><h1>${e(s.pack.title)}</h1><p class="muted">${item?`Exercice ${idx+1}/11 · ${item.kind==='quiz'?'Quiz':item.kind==='case'?'Cas écrit':'Confrontation orale'} ${item.number}`:'Séance terminée'}</p></div><div class="head-actions"><button class="btn ghost" data-action="export">↓ Réponses</button><button class="btn ghost" data-action="home">Mes séances</button></div></div><div class="progressbar" aria-label="Avancement de la séance"><span style="width:${(progress(s)/11)*100}%"></span></div><div class="stepbar"><span class="step-label">${progress(s)} sur 11 exercices terminés</span><span class="tag">${item?e(item.skill):'Terminé'}</span></div>${s.phase==='ready'?`<div class="prep-settings"><label>Aménagement du temps <select id="time-mode" class="input" ${modeLocked(s)?'disabled':''}><option value="1" ${s.timerMultiplier===1?'selected':''}>Standard · temps prévu</option><option value="2" ${s.timerMultiplier===2?'selected':''}>×2 · entraînement adapté</option><option value="10" ${s.timerMultiplier===10?'selected':''}>×10 · accessibilité</option></select></label>${modeLocked(s)?'<p class="small muted">Durée verrouillée après le premier exercice pour permettre un suivi comparable.</p>':''}</div>`:''}`;}
function quizOrder(item){const position=(item.number-1)%4;const indices=[0,1,2,3].filter(i=>i!==item.correct_index);indices.splice(position,0,item.correct_index);return indices;}
function renderQuiz(s,item){const r=s.answers[item.id]||{};let html=`<div class="panel"><div class="info-row"><span class="tag">QCM ${item.number}/6</span><span class="tag gray">40 secondes</span></div>`;
 if(s.phase==='ready')html+=`<h2 style="margin-top:16px">Question de raisonnement rapide</h2><p class="muted">La question apparaît au démarrage du chronomètre. Choisis une seule réponse ; la correction s’affiche immédiatement.</p><div class="actions"><button class="btn primary" data-action="quiz-start">Commencer la question · 40 s</button></div>`;
 else {html+=`<div class="question"><h2>${e(item.question)}</h2></div>`;
  if(s.phase==='running')html+=`<div class="choice-grid">${quizOrder(item).map((original,i)=>`<button class="choice" data-action="quiz-choose" data-index="${original}"><span class="letter">${'ABCD'[i]}</span>${e(item.options[original])}</button>`).join('')}</div>`;
  if(s.phase==='review'){
   const isOk=r.correct===true;
   html+=`<div class="choice-grid">${quizOrder(item).map((original,i)=>`<div class="choice ${original===item.correct_index?'correct':r.selectedIndex===original?'incorrect':''}"><span class="letter">${'ABCD'[i]}</span>${e(item.options[original])}${original===item.correct_index?' ✓':''}${original===r.selectedIndex&&original!==item.correct_index?' · ton choix':''}</div>`).join('')}</div><div class="feedback ${isOk?'':'warn'}"><strong>${isOk?'Bonne réponse':r.timedOut?'Temps écoulé':'Réponse à corriger'}</strong>${r.selectedIndex!==null&&r.selectedIndex!==item.correct_index&&item.option_explanations?.[r.selectedIndex]?`<p><strong>Pourquoi ton choix ne convient pas :</strong> ${e(item.option_explanations[r.selectedIndex])}</p>`:''}<p>${e(item.explanation)}</p><span class="small">Réponse correcte : ${'ABCD'[(item.number-1)%4]} · ${e(item.options[item.correct_index])}</span></div><div class="actions"><button class="btn primary" data-action="next">${s.cursor===10?'Voir le bilan':'Exercice suivant →'}</button></div>`;
  }
 }
 return html+'</div>';
}
function stressSelector(r){return `<div style="max-width:300px;margin:17px 0"><label class="field-label" for="stress-report">Pression ressentie (facultatif)</label><select id="stress-report" class="input"><option value="">Non renseignée</option>${Array.from({length:11},(_,n)=>`<option value="${n}" ${r.stressReported===n?'selected':''}>${n}/10</option>`).join('')}</select><p class="small muted">Ton ressenti est déclaré par toi, jamais déduit de la voix.</p></div>`;}
function renderCase(s,item){
 const r=s.answers[item.id]||{};
 let html=`<div class="panel case-panel"><div class="info-row"><span class="tag">Cas écrit ${item.number}/2</span><span class="tag gray">110 s · contexte et réponse simultanés</span></div><h2>${e(item.title)}</h2>`;
 if(s.phase==='ready')html+=`<p class="muted">Le contexte et l'écriture restent accessibles ensemble pendant ${CASE_SECONDS*(s.timerMultiplier||1)} secondes. Tu peux rédiger dès la première seconde.</p><div class="actions"><button class="btn primary" data-action="case-start">Commencer le cas · ${CASE_SECONDS*(s.timerMultiplier||1)} s</button></div>`;
 if(s.phase==='writing'){
  html+=`<div class="case-layout"><section class="case-context-pane"><span class="eyebrow">Contexte et consigne</span><p class="case-context">${e(item.context)}</p><div class="case-task"><strong>Ta mission</strong><p>${e(item.task)}</p></div></section>`;
  html+=`<section class="case-write-pane"><label class="field-label" for="case-answer">Ta réponse ou ta posture</label><textarea id="case-answer" placeholder="Écris ta réponse spontanée…" maxlength="9000" spellcheck="true">${e(r.text||'')}</textarea><div class="save-hint">● Sauvegarde locale à chaque saisie</div><div class="actions"><button class="btn primary" data-action="case-finish">Terminer et enregistrer</button></div></section>`;
  html+='</div>';
 }
 if(s.phase==='review')html+=`<div class="feedback"><strong>Réponse conservée</strong><p>Durée utilisée : ${r.elapsedSec==null?'—':e(r.elapsedSec)+' s'} · ${r.timedOut?'Temps écoulé':'Fin volontaire'}. Correction détaillée après export vers ton assistant IA.</p></div><div class="answer-text">${e(r.text?.trim()||'Aucune réponse écrite.')}</div>${stressSelector(r)}<div class="actions"><button class="btn primary" data-action="next">Exercice suivant →</button></div>`;
 return html+'</div>';
}
function renderOral(s,item){const r=s.answers[item.id]||{};let html=`<div class="panel"><div class="info-row"><span class="tag">Confrontation ${item.number}/3</span><span class="tag gray">40 secondes de réponse</span></div><h2 style="margin-top:16px">Réactivité orale</h2><div class="question"><span class="eyebrow">Contexte</span><p>${e(item.context)}</p><span class="eyebrow">Interlocuteur</span><h3 style="margin-bottom:0">« ${e(item.confrontation)} »</h3></div>`;
 if(s.phase==='ready')html+=`<p class="muted">Lis la confrontation avant de commencer. Les ${ORAL_SECONDS*(s.timerMultiplier||1)} secondes ne démarrent qu’après l'activation effective de la reconnaissance vocale.</p><div class="speech-pref"><label class="field-label" for="speech-locale">Langue et accent de transcription</label><select id="speech-locale" class="input">${ALL_LOCALES.map(([code,label])=>`<option value="${code}" ${s.speechLocale===code?'selected':''}>${e(label)}</option>`).join('')}</select><span class="small muted">Français et anglais disponibles pour toutes les séances. La langue sélectionnée est appliquée à la dictée. Pour de meilleurs résultats, utilise la langue parlée.</span><div class="actions"><button class="btn subtle" data-action="${testSpeech?'speech-test-stop':'speech-test'}">${testSpeech?'■ Arrêter le test':'🎙 Tester la dictée (sans chronomètre)'}</button></div>${testTranscript?`<p class="small"><strong>Résultat du test :</strong> ${e(testTranscript)}</p>`:''}</div><div class="actions"><button class="btn primary" data-action="speech-start" ${testSpeech?'disabled':''}>🎙 Activer le micro et démarrer · ${ORAL_SECONDS*(s.timerMultiplier||1)} s</button><button class="btn ghost" data-action="manual-start">Mode sans micro</button></div><div class="notice amber small">La dictée dépend de ton navigateur et peut utiliser un service distant. Une transcription n'est pas une note de prononciation. Le texte brut sera conservé.</div>${speechStatus?`<div class="status error" role="alert" style="margin-top:12px">${e(speechStatus)}</div>`:''}`;
 if(s.phase==='arming')html+=`<div class="status">${e(speechStatus||'Autorisation du microphone en attente… Aucun temps n’est encore comptabilisé.')}</div><div class="actions"><button class="btn ghost" data-action="speech-cancel">Annuler et choisir le mode sans micro</button></div>`;
 if(s.phase==='speaking'){
  html+=`<div class="status ${speechStatus.includes('arrêt')?'error':''}" role="status">${e(speechStatus||'Réponse en cours')}</div>`;
  if(r.capture==='manual'||(!speech&&r.capture==='browser-speech'))html+=`<label class="field-label" for="manual-draft">${r.capture==='manual'?'Retranscription manuelle (mode secours)':'Micro interrompu : complète au besoin la transcription'}</label><textarea id="manual-draft" maxlength="9000" placeholder="Note la réponse prononcée, sans l’améliorer…">${e(r.transcript||'')}</textarea>`;
  else html+=`<label class="field-label">Transcription en direct</label><div class="transcript ${r.transcript?'':'pending'}" id="live-transcript" aria-live="polite">${e(r.transcript||'En attente de tes paroles…')}</div>`;
  html+=`<div class="actions">${!speech&&r.capture==='browser-speech'?'<button class="btn subtle" data-action="speech-resume">↻ Relancer le micro</button>':''}<button class="btn primary" data-action="oral-finish">Terminer ma réponse</button></div>`;
 }
 if(s.phase==='closing')html+=`<div class="status">Finalisation de la dictée…</div>`;
 if(s.phase==='review')html+=`<div class="feedback"><strong>Réponse terminée</strong><p>Durée : ${r.elapsedSec==null?'—':e(r.elapsedSec)+' s'} · ${r.capture==='manual'?'Mode manuel':'Reconnaissance navigateur'}${r.timedOut?' · temps écoulé':''}.</p></div><label class="field-label" for="edited-transcript">Transcription obtenue — corrige uniquement les erreurs de reconnaissance</label><textarea id="edited-transcript" maxlength="9000">${e(r.editedTranscript??r.transcript??'')}</textarea>${r.alternatives?.length?`<details class="alt-transcripts"><summary>Autres hypothèses reconnues (${r.alternatives.length})</summary><p class="small muted">Le navigateur a proposé d'autres mots pour certaines parties de ta réponse. Ces suggestions ne sont pas une correction certaine.</p><ul>${r.alternatives.map(a=>`<li>${e(a)}</li>`).join('')}</ul></details>`:''}<p class="small muted">Le texte brut reste conservé séparément. Ne change que les erreurs de dictée : l'évaluation porte sur la réponse prononcée.</p>${stressSelector(r)}<div class="actions"><button class="btn primary" data-action="next">${s.cursor===10?'Voir mon bilan →':'Exercice suivant →'}</button></div>`;
 return html+'</div>';
}
function doneSessions(){return Object.values(db.sessions).filter(s=>s.phase==='finished'||s.cursor>=11).sort((a,b)=>String(b.finishedAt||b.pack.date).localeCompare(String(a.finishedAt||a.pack.date)));}
function axisScore(s,key){const n=s.axes?.[key];return Number.isInteger(n)&&n>=0&&n<=5?n:null;}
function mean(values){return values.length?values.reduce((a,b)=>a+b,0)/values.length:null;}
function meanLabel(values){const n=mean(values);return n===null?'—':n.toFixed(1)+'/5';}
function quizScore(s){return steps(s.pack).filter(i=>i.kind==='quiz'&&s.answers[i.id]?.correct===true).length;}
function sessionAxisMean(s){const scores=AXES.map(([key])=>axisScore(s,key)).filter(x=>x!==null);return scores.length===AXES.length?mean(scores):null;}
function scoreRange(sessions,axis){return sessions.map(s=>axisScore(s,axis)).filter(x=>x!==null);}
function trendRows(done){return AXES.map(([key,name])=>{
 const scores=scoreRange(done,key);
 const recent=scoreRange(done.slice(0,7),key);
 const previous=scoreRange(done.slice(7,14),key);
 const delta=recent.length&&previous.length?mean(recent)-mean(previous):null;
 return `<tr><th scope="row">${e(name)}</th><td>${meanLabel(recent)}</td><td>${meanLabel(scoreRange(done.slice(0,14),key))}</td><td>${meanLabel(scoreRange(done.slice(0,30),key))}</td><td>${delta===null?'—':(delta>0?'+':'')+delta.toFixed(1)}</td></tr>`;
 }).join('');}
function renderHistoryLanguage(language){
 const done=doneSessions().filter(s=>s.pack.language===language),comparable=done.filter(s=>s.timerMultiplier===1);
 const languageName=language==='FR'?'Français':'Anglais';
 return `<section class="panel history-dashboard" id="progres"><div class="section-heading"><div><span class="eyebrow">Mes performances</span><h2>Historique et progression · ${languageName}</h2></div><span class="tag gray">${done.length} séance${done.length>1?'s':''} terminée${done.length>1?'s':''}</span></div>
 <div class="grid grid3 stats-grid"><div class="stat"><strong>${done.length}</strong><span>Séances terminées</span></div><div class="stat"><strong>${comparable.length?mean(comparable.slice(0,7).map(quizScore)).toFixed(1)+'/6':'—'}</strong><span>QCM · 7 dernières séances standard</span></div><div class="stat"><strong>${meanLabel(comparable.slice(0,7).map(sessionAxisMean).filter(x=>x!==null))}</strong><span>5 repères complets · 7 séances standard</span></div></div>
 <h3>Évolution des 5 repères sur 0–5</h3><p class="small muted">Moyennes par compétence sur les 7, 14 et 30 dernières séances <strong>terminées au temps standard</strong>. Les modes ×2 et ×10 restent archivés, sans être mélangés aux moyennes. « — » signifie qu'aucune note n'a été saisie ; les anciennes notes sur 0–4 restent archivées et sont exclues de ces moyennes. La variation compare les 7 dernières séances aux 7 précédentes.</p>
 <div class="table-scroll"><table class="score-table"><thead><tr><th>Compétence</th><th>7 séances</th><th>14 séances</th><th>30 séances</th><th>Variation</th></tr></thead><tbody>${trendRows(comparable)}</tbody></table></div>
 ${done.length?`<div class="mini-history" role="list">${done.slice(0,30).map(x=>{const grade=sessionAxisMean(x);return `<div class="history-line" role="listitem"><span><strong>${e(x.pack.date)}</strong><small>${e(x.pack.title)} · ${e(x.pack.language)}${x.timerMultiplier!==1?' · temps ×'+x.timerMultiplier:''}</small></span><span>QCM ${quizScore(x)}/6</span><span>${grade===null?'Repères incomplets':grade.toFixed(1)+'/5'}</span><button class="btn subtle" data-action="open" data-id="${e(x.pack.session_id)}">Consulter</button></div>`;}).join('')}</div>`:'<p class="muted">Les résultats apparaîtront ici après ta première séance terminée.</p>'}
 <div class="actions"><button class="btn subtle" data-action="backup">↓ Sauvegarder toutes mes séances</button><label class="btn subtle backup-label">↥ Restaurer une sauvegarde<input type="file" id="backup-upload" accept=".json,application/json" aria-label="Restaurer une sauvegarde JSON"></label><button class="btn warn" data-action="reset-progress">↻ Réinitialiser le progrès</button><button class="btn warn" data-action="delete-all">Supprimer toutes les séances</button><button class="btn warn" data-action="reset-app">Réinitialiser l’application</button></div><p class="small muted">La réinitialisation efface réponses et notes, mais garde les fichiers de séances. Elle demande confirmation et télécharge une sauvegarde. Une restauration peut remplacer les progrès existants uniquement avec ton accord.</p></section>`;
}
function renderHistory(){return '<h2 class="language-heading">Historique et progression par langue</h2>'+['FR','EN'].map(renderHistoryLanguage).join('');}
function packHome(){
 const today=new Date().toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});
 const hist=Object.values(db.sessions).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
 return `<div class="topline"><div><p class="eyebrow">Entraînement cognitif et oral · quotidien</p><h1>Entraîne ton analyse. Construis ta réponse.</h1><p class="lead">Une séance par fichier, trois formats d'exercices, un retour du coach et cinq repères de progression.</p></div><span class="tag gray">${e(today)}</span></div>
 <div class="grid grid3 intro-features"><div class="feature"><strong>6 × 40 s</strong><span>QCM · correction immédiate</span></div><div class="feature"><strong>2 × 110 s</strong><span>Cas · lire et écrire simultanément</span></div><div class="feature"><strong>3 × 40 s</strong><span>Oral · dictée FR/EN</span></div></div>
 <section class="panel import-panel"><div class="section-heading"><div><span class="eyebrow">Préparer sa séance</span><h2>Importer le fichier du jour</h2></div><span class="tag green">Format validé</span></div><p class="muted">Le fichier contient 6 QCM, 2 cas écrits et 3 confrontations orales. Un import ne supprime jamais les séances précédentes.</p>
 <label class="upload"><span aria-hidden="true" class="upload-symbol">⇧</span><span class="upload-text"><strong>Choisir un fichier JSON de séance</strong><small>Fichier JSON créé par le LLM de ton choix</small><input id="session-upload" type="file" accept=".json,application/json" aria-label="Fichier de séance à importer"></span></label>
 <div class="actions"><button class="btn primary" data-action="demo">Essayer la séance modèle</button><a class="btn" href="seance_2026-11-07.json" download>Télécharger la séance modèle</a></div></section>
 ${['FR','EN'].map(language=>{const sessions=hist.filter(s=>s.pack.language===language);return `<section class="panel" data-language="${language}"><div class="section-heading"><h2>Mes séances · ${language==='FR'?'Français':'Anglais'}</h2><span class="tag gray">${sessions.length} enregistrée${sessions.length>1?'s':''}</span></div>${sessions.length?`<div class="history-list">${sessions.map(s=>`<div class="history-item"><div><strong>${e(s.pack.title)}</strong><p class="muted small">${e(s.pack.date)} · ${e(s.pack.language)} · ${progress(s)}/11 exercices ${s.phase==='finished'?'· terminée':'· en cours'}</p></div><button class="btn subtle" data-action="open" data-id="${e(s.pack.session_id)}">${s.phase==='finished'?'Voir le bilan':'Reprendre'}</button><button class="btn warn" data-action="delete-session" data-id="${e(s.pack.session_id)}">Supprimer</button></div>`).join('')}</div>`:'<p class="muted">Aucune séance dans cette langue.</p>'}</section>`}).join('')}
 ${renderHistory()}<div class="privacy-note">Tes textes et notes sont enregistrés localement, sans synchronisation automatique. La dictée vocale du navigateur peut utiliser un service distant. L'envoi des réponses à un service d'IA externe reste volontaire.</div>`;
}
function renderFinished(s){
 const items=steps(s.pack);
 const axisGraded=AXES.map(([key])=>axisScore(s,key)).filter(n=>n!==null);
 let html=head(s,null)+`<section class="panel completed-hero"><div class="info-row"><span class="tag green">11 exercices terminés</span><span class="tag">QCM · ${quizScore(s)}/6 corrects</span></div><h2>Bilan de ta séance</h2><p class="muted">Télécharge les 11 réponses et transmets-les au LLM de ton choix pour recevoir la correction détaillée. Dans l'application, reporte uniquement les <strong>cinq axes d’amélioration notés sur 0 à 5</strong>, leurs conseils et la priorité pour demain.</p>
 <div class="actions"><button class="btn primary" data-action="export">↓ Exporter les 11 réponses</button><button class="btn ghost" data-action="home">Mes séances et progrès</button><button class="btn warn" data-action="restart-session">↻ Recommencer cette séance</button><button class="btn warn" data-action="delete-session" data-id="${e(s.pack.session_id)}">Supprimer cette séance</button></div><div class="file-box small"><strong>Format à demander au coach :</strong> correction détaillée dans le chat, cinq axes d’amélioration notés sur 0–5, conseils concrets et une priorité pour demain.</div>
 ${s.migratedFromV1?`<div class="notice amber">Cet <strong>essai enregistré localement</strong> a commencé avec Daily 1.0. Importer un nouveau fichier portant le même identifiant rouvre cet ancien essai. ${Object.keys(s.legacyGrades||{}).length?'Les notes historiques sur 0–4 sont archivées séparément.':'Aucune ancienne note sur 0–4 n’était renseignée.'} Pour refaire les exercices selon les règles actuelles, choisis « Recommencer cette séance ».</div>`:''}</section>
 <section class="panel coaching-panel"><div class="section-heading"><div><span class="eyebrow">Retour du coach</span><h2>Mes cinq repères d'amélioration</h2></div><span class="tag">Échelle 0–5</span></div><p class="muted small" id="axis-summary">${axisGraded.length}/5 repères notés${axisGraded.length?' · moyenne '+meanLabel(axisGraded):''}. Les valeurs non renseignées ne comptent pas dans les moyennes.</p><div class="axis-grid">`;
 for(let n=0;n<AXES.length;n++){
  const [key,title]=AXES[n],rating=axisScore(s,key),comment=s.axisNotes?.[key]||'';
  html+=`<div class="axis-card"><div class="axis-top"><span class="axis-index">${String(n+1).padStart(2,'0')}</span><strong>${e(title)}</strong></div><div class="axis-fields"><div><label class="field-label" for="axis-grade-${n}">Note /5</label><select class="input axis-grade" id="axis-grade-${n}" data-axis="${key}"><option value="">—</option>${[0,1,2,3,4,5].map(v=>`<option value="${v}" ${rating===v?'selected':''}>${v}/5</option>`).join('')}</select></div><div><label class="field-label" for="axis-note-${n}">Repère concret à travailler</label><textarea class="axis-note" id="axis-note-${n}" rows="2" maxlength="1200" data-axis="${key}" placeholder="Une observation et une action précise…">${e(comment)}</textarea></div></div></div>`;
 }
 html+=`</div><label class="field-label" for="coach-summary">Synthèse et priorité de la prochaine séance</label><textarea id="coach-summary" rows="3" maxlength="2500" placeholder="Résume les 4–5 axes prioritaires et la consigne à appliquer demain…">${e(s.coachSummary||'')}</textarea><div class="save-hint">● Notes sauvegardées automatiquement dans ce navigateur</div></section>
 <!-- Détails par exercice réservés à la correction dans le chat. -->`;
 return html;
}
function render(){clearTick();const s=active();if(!s){dom.innerHTML=packHome();return;}
 if(s.cursor>=11||s.phase==='finished'){dom.innerHTML=renderFinished(s);return;}
 const item=current(s);if(!item){dom.innerHTML=packHome();return;}
 dom.innerHTML=head(s,item)+(item.kind==='quiz'?renderQuiz(s,item):item.kind==='case'?renderCase(s,item):renderOral(s,item));
 if(s.timer)runTick();
}
function answersFile(s){
 const records=steps(s.pack).map(i=>{
  const r=s.answers[i.id]||{};
  const common={id:i.id,type:i.kind,skill:i.skill,elapsed_seconds:r.elapsedSec??null,timed_out:!!r.timedOut,manual_grade_0_5:Number.isInteger(s.grades?.[i.id])?s.grades[i.id]:null,coach_note_manually_entered:s.coachNotes?.[i.id]||'',stress_reported_0_10:Number.isInteger(r.stressReported)?r.stressReported:null};
  if(i.kind==='quiz'){
   const order=quizOrder(i),chosen=r.selectedIndex??null;
   return {...common,question:i.question,options:i.options,chosen_index:chosen,chosen_answer:chosen===null?null:i.options[chosen],correct_index:i.correct_index,correct_answer:i.options[i.correct_index],displayed_options:order.map(index=>i.options[index]),displayed_chosen_letter:chosen===null?null:'ABCD'[order.indexOf(chosen)],displayed_correct_letter:'ABCD'[order.indexOf(i.correct_index)],correct:r.correct===true,explanation:i.explanation,option_explanations:i.option_explanations||null};
  }
  if(i.kind==='case')return {...common,title:i.title,context:i.context,task:i.task,response:r.text||''};
  return {...common,context:i.context,confrontation:i.confrontation,transcript_raw:r.transcript||'',transcript_reviewed:r.editedTranscript??r.transcript??'',transcript_edited:!!r.transcriptEdited,capture_mode:r.capture||'unknown',speech_locale:s.speechLocale};
 });
 return {schema:'response-lab-daily-answers-v2',session_id:s.pack.session_id,date:s.pack.date,language:s.pack.language,title:s.pack.title,completed:s.phase==='finished'||s.cursor>=11,exported_at:stamp(),timing_mode:`x${s.timerMultiplier||1}`,quiz_correct_count:records.filter(r=>r.type==='quiz'&&r.correct).length,
 coach_instructions:'Corrige dans le chat chaque exercice par son ID. QCM : utilise chosen_index et correct_index pour l’évaluation ; les lettres affichées sont dans displayed_chosen_letter et displayed_correct_letter. Explique le mauvais choix et l’indice manqué (sans inventer de réponse si le choix est absent). Cas écrits : critique les faits, le raisonnement et la posture ; propose une correction texte. Oral : analyse le texte brut spontané, puis propose une formulation plus pertinente ; ne déduis jamais la prononciation, la confiance ni le stress à partir de la transcription. Si la réponse est absente, marque non évaluable. Donne enfin CINQ notes 0 à 5 : analyse, raisonnement, décision, expression, adaptation ; justifie chaque note par des faits observables et donne 4–5 axes concrets de travail. Les notes seront saisies manuellement dans Response Lab.',
 coach_axes:AXES.map(([id,label])=>({id,label,grade_0_5:axisScore(s,id),coaching_note:s.axisNotes?.[id]||''})),coach_summary_entered:s.coachSummary||'',answers:records};
}
function downloadFile(filename,payload){const blob=new Blob([JSON.stringify(payload,null,2)+'\n'],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);}
function exportAnswers(){const s=active();if(!s){notify('Aucune séance active à exporter.');return;}
 downloadFile(`Response_Lab_Reponses_${s.pack.session_id}.json`,answersFile(s));notify(s.phase==='finished'?'Fichier de réponses téléchargé : joins-le au coach.':'Export de secours téléchargé : séance incomplète clairement signalée.');}
function exportBackup(){downloadFile('Response_Lab_Daily_Sauvegarde_'+new Date().toISOString().slice(0,10)+'.json',backupSnapshot());notify('Sauvegarde complète exportée. Conserve ce fichier en lieu sûr.');}
async function importBackup(file){
 if(!file)return;
 if(file.size>10000000)throw Error('Sauvegarde trop volumineuse (maximum 10 Mo).');
 let data;try{data=JSON.parse(await file.text())}catch{throw Error('Fichier JSON invalide.');}
 if(data?.schema!==BACKUP_SCHEMA||data.version!==2||!data.sessions||typeof data.sessions!=='object'||Array.isArray(data.sessions))throw Error('Format de sauvegarde invalide.');
 const incoming=Object.create(null);
 for(const [id,raw] of Object.entries(data.sessions)){
  if(!/^[-A-Za-z0-9_]+$/.test(id)||['__proto__','constructor','prototype'].includes(id)||raw?.pack?.session_id!==id)throw Error('Identifiant de sauvegarde invalide : '+id);
  incoming[id]=adaptSession(JSON.parse(JSON.stringify(raw)));
 }
 const conflicts=Object.keys(incoming).filter(id=>Boolean(db.sessions[id]));
 if(conflicts.length&&!window.confirm(conflicts.length+' séance(s) déjà présentes. Remplacer leurs résultats par la sauvegarde ? Les modifications actuelles seront écrasées pour ces séances. Annuler pour tout conserver.')){notify('Restauration annulée. Aucune donnée modifiée.');return;}
 const sessions=Object.assign(Object.create(null),db.sessions,incoming);
 if(Object.keys(sessions).length>500)throw Error('La sauvegarde dépasserait la limite de 500 séances.');
 const next={...db,sessions};
 if(!commitState(next))return;
 stopAllActivity();render();notify(Object.keys(incoming).length+' séance(s) restaurée(s), dont '+conflicts.length+' remplacée(s) avec accord.');
}
function resumeTimers(){const s=active();if(!s)return;
 // A microphone permission dialog cannot be resumed after reload; keep the step ready instead of counting imagined time.
 if(s.phase==='arming'){s.phase='ready';s.timer=null;speechStatus='Micro interrompu par le rechargement. Recommence quand tu es prêt.';save();}
 if(s.phase==='reading'){s.phase='ready';s.timer=null;save();notify('Ancien mode lecture interrompu : recommence le cas en 110 secondes communes.');}
 if(s.phase==='closing'){s.phase='review';s.timer=null;save();}
 if(s.phase==='speaking'&&s.answers[current(s)?.id]?.capture==='browser-speech'&&!speech)speechStatus='Microphone interrompu pendant la navigation : texte partiel conservé. Le chronomètre continue.';
 if(s.timer&&s.timer.endsAt<=Date.now())expire();
}
async function handleAction(btn){const a=btn.dataset.action,s=active();
 if(a==='home'){if(speech)endSpeech(true);stopSpeechTest();clearTick();db.activeId=null;save();render();return;}
 if(a==='backup'){exportBackup();return;}
 if(a==='reset-progress'){resetProgress();return;}
 if(a==='delete-session'){deleteSession(btn.dataset.id||s?.pack?.session_id);return;}
 if(a==='delete-all'){deleteAllSessions();return;}
 if(a==='reset-app'){await resetApplication();return;}
 if(a==='restart-session'){restartSession();return;}
 if(a==='export'){exportAnswers();return;}
 if(a==='demo'){try{const r=await fetch('seance_2026-11-07.json?v=2.0.0');if(!r.ok)throw Error('Séance modèle introuvable.');create(await r.json())}catch(err){notify('Impossible de charger la séance modèle : '+err.message)}return;}
 if(a==='open'){moveTo(btn.dataset.id);resumeTimers();render();return;}
 if(!s)return;
 if(a==='quiz-start'&&s.phase==='ready'&&current(s).kind==='quiz'){result(s,current(s)).startedAt=stamp();beginTimed(s,'running',QUIZ_SECONDS);return;}
 if(a==='quiz-choose'){chooseQuiz(Number(btn.dataset.index));return;}
 if(a==='case-start'&&s.phase==='ready'&&current(s).kind==='case'){result(s,current(s)).startedAt=stamp();beginTimed(s,'writing',CASE_SECONDS);return;}
 if(a==='case-finish'){finishCase(false);return;}
 if(a==='speech-test'){prepareSpeechTest();return;}
 if(a==='speech-test-stop'){stopSpeechTest();speechStatus='Test de dictée arrêté. Tu peux maintenant démarrer ta réponse.';render();return;}
 if(a==='speech-start'){speechStatus='';speechAttempt=0;prepareSpeech();return;}
 if(a==='speech-cancel'&&s.phase==='arming'){endSpeech(true);s.phase='ready';s.timer=null;speechStatus='Autorisation annulée. Tu peux réessayer ou choisir le mode sans micro.';save();render();return;}
 if(a==='speech-resume'){speechAttempt=0;prepareSpeech(true);return;}
 if(a==='manual-start'){startManualOral();return;}
 if(a==='oral-finish'){finishOral(false);return;}
 if(a==='next'){next();return;}
 }
function bind(){
 document.addEventListener('click',ev=>{const button=ev.target.closest('button[data-action]');if(!button||button.disabled)return;handleAction(button).catch(err=>{notify('Action impossible : '+err.message);console.error(err)})});
 document.addEventListener('change',ev=>{const el=ev.target;
  if(el?.id==='session-upload'){importFile(el.files?.[0]).catch(err=>notify('Import refusé : '+err.message)).finally(()=>{el.value=''});return;}
  if(el?.id==='backup-upload'){importBackup(el.files?.[0]).catch(err=>notify('Restauration refusée : '+err.message)).finally(()=>{el.value=''});return;}
  const s=active();if(!s)return;
  if(el.id==='stress-report'&&s.phase==='review'){result(s,current(s)).stressReported=el.value===''?null:Number(el.value);save();return;}
  if(el?.id==='time-mode'&&s.phase==='ready'&&!modeLocked(s)){const v=Number(el.value);if([1,2,10].includes(v)){s.timerMultiplier=v;save();render();}return;}
  if(el?.id==='speech-locale'&&s.phase==='ready'){if(ALL_LOCALES.some(([code])=>code===el.value)){s.speechLocale=el.value;save();}return;}
  if(s.phase!=='finished')return;
  if(el.classList.contains('grade-field')){const v=el.value===''?null:Number(el.value);if(v!==null&&(!Number.isInteger(v)||v<0||v>5))return;s.grades[el.dataset.id]=v;save();const gr=Object.values(s.grades).filter(n=>Number.isInteger(n)&&n>=0&&n<=5),sum=byId('grade-summary');if(sum)sum.textContent=gr.length+'/11 notes renseignées'+(gr.length?' · moyenne indicative '+meanLabel(gr):'')+'. Les bonnes réponses QCM restent distinctes.';notify('Note enregistrée : '+el.dataset.id);return;}
  if(el.classList.contains('axis-grade')){const key=el.dataset.axis,v=el.value===''?null:Number(el.value);if(!AXES.some(([id])=>id===key)||(v!==null&&(!Number.isInteger(v)||v<0||v>5)))return;s.axes[key]=v;save();const scores=AXES.map(([id])=>axisScore(s,id)).filter(x=>x!==null),summary=byId('axis-summary');if(summary)summary.textContent=scores.length+'/5 repères notés'+(scores.length?' · moyenne '+meanLabel(scores):'')+'. Les valeurs non renseignées ne comptent pas.';notify('Repère enregistré : '+key);return;}
 });
 document.addEventListener('input',ev=>{const s=active();if(!s)return;const el=ev.target;
  if(el?.id==='case-answer'&&s.phase==='writing'){if(s.timer&&timeRemaining(s)<=0){expire();return;}const r=result(s,current(s));r.text=el.value.slice(0,9000);save();return;}
  if(el?.id==='manual-draft'&&s.phase==='speaking'){if(s.timer&&timeRemaining(s)<=0){expire();return;}const r=result(s,current(s));r.transcript=el.value.slice(0,9000);save();return;}
  if(el?.id==='edited-transcript'&&s.phase==='review'){saveEditedTranscript(el.value);return;}
  if(el.classList?.contains('note-field')&&s.phase==='finished'){s.coachNotes[el.dataset.id]=el.value.slice(0,1800);save();return;}
  if(el.classList?.contains('axis-note')&&s.phase==='finished'&&AXES.some(([key])=>key===el.dataset.axis)){s.axisNotes[el.dataset.axis]=el.value.slice(0,1200);save();return;}
  if(el.id==='coach-summary'&&s.phase==='finished'){s.coachSummary=el.value.slice(0,2500);save();return;}
 });
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')tick();});
 window.addEventListener('pagehide',()=>{if(speech)endSpeech(true);stopSpeechTest();save();clearTick();});
 window.addEventListener('keydown',ev=>{if(ev.altKey||ev.ctrlKey||ev.metaKey||ev.target?.matches('input,textarea,select,button'))return;const s=active();if(!s||s.phase!=='running'||current(s)?.kind!=='quiz')return;const n=Number(ev.key);if(n>=1&&n<=4){chooseQuiz(n-1);ev.preventDefault();}});
}
function init(){load();bind();resumeTimers();render();if('serviceWorker' in navigator&&(['https:','http:'].includes(location.protocol)))navigator.serviceWorker.register('./sw.js').catch(()=>{});}
window.ResponseLabDaily={validatePack,answersFile,getState:()=>db,init};
init();
})();
