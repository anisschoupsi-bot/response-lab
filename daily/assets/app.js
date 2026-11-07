'use strict';
/* Response Lab Daily 1.0: file-first sessions, local storage, browser transcription.
   Timers measure wall time, never inferred cognitive speed. No automatic grading of free text. */
(()=>{
const SCHEMA='response-lab-daily-session-v1';
const RESPONSE_SCHEMA='response-lab-daily-answers-v1';
const STORE='response-lab-daily-state-v1';
const QUIZ_SECONDS=40, READ_SECONDS=50, WRITE_SECONDS=60, ORAL_SECONDS=40;
const MAX_BYTES=500000;
const dom=document.getElementById('app');
const status=document.getElementById('live-status');
let db={version:1,activeId:null,sessions:{}};
let ticker=null, speech=null, speechStatus='';
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
  }else if(kind==='cas écrit'){
   if(!isString(x.title,160)||!isString(x.context,4000)||!isString(x.task,1100))throw Error(`Cas écrit invalide : ${x.id}.`);
  }else if(!isString(x.context,2500)||!isString(x.confrontation,1400))throw Error(`Confrontation invalide : ${x.id}.`);
 }
 return JSON.parse(JSON.stringify(o));
}
function load(){
 try{const raw=localStorage.getItem(STORE);if(!raw)return;const obj=JSON.parse(raw);if(!obj||obj.version!==1||typeof obj.sessions!=='object')return;
  const safe={};for(const [id,s] of Object.entries(obj.sessions).slice(-80))try{if(s&&s.pack&&s.pack.session_id===id){validatePack(s.pack);safe[id]=s;}}catch{}
  db={version:1,activeId:safe[obj.activeId]?obj.activeId:null,sessions:safe};
 }catch(err){console.warn('Sauvegarde illisible',err);notify('Sauvegarde existante illisible. Aucun fichier supprimé.');}
}
function save(){
 try{localStorage.setItem(STORE,JSON.stringify(db));return true}
 catch(err){notify('Enregistrement local impossible (stockage saturé ou désactivé). Exporte tes réponses.');console.error(err);return false;}
}
function active(){return db.activeId?db.sessions[db.activeId]:null;}
function steps(pack){return [...pack.quiz.map((x,i)=>({kind:'quiz',number:i+1,...x})),...pack.cases.map((x,i)=>({kind:'case',number:i+1,...x})),...pack.oral.map((x,i)=>({kind:'oral',number:i+1,...x}))];}
function current(s){return steps(s.pack)[s.cursor]||null;}
function result(s,item){return s.answers[item.id]||(s.answers[item.id]={id:item.id,kind:item.kind,startedAt:null,elapsedSec:null,timedOut:false});}
function moveTo(id){if(speech)endSpeech(true);db.activeId=id;save();render();}
function create(pack){
 const validated=validatePack(pack),id=validated.session_id;
 if(db.sessions[id]){moveTo(id);notify('Séance existante ouverte : progression conservée.');return;}
 if(Object.keys(db.sessions).length>=70)throw Error('Limite de 70 séances atteinte : exporte et archive tes anciennes séances avant d’en ajouter.');
 db.sessions[id]={pack:validated,cursor:0,phase:'ready',timer:null,answers:{},grades:{},coachNotes:{},createdAt:stamp(),finishedAt:null};db.activeId=id;save();render();notify('Séance importée : 11 exercices prêts.');
}
async function importFile(file){
 if(!file)return;
 if(file.size>MAX_BYTES)throw Error('Fichier trop volumineux (maximum 500 Ko).');
 let pack;try{pack=JSON.parse(await file.text())}catch{throw Error('Le fichier ne contient pas de JSON valide.');}
 create(pack);
}
function progress(s){return s.cursor===11?11:s.cursor+(s.phase==='review'?1:0)}
function clearTick(){if(ticker!==null){clearInterval(ticker);ticker=null;}}
function beginTimed(s,phase,secs,startAt=Date.now()){clearTick();s.phase=phase;s.timer={phase,seconds:secs,startedAt:startAt,endsAt:startAt+secs*1000,stepId:current(s)?.id};save();render();runTick();}
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
 if(s.phase==='running'&&item.kind==='quiz'){const r=result(s,item);r.selectedIndex=null;r.correct=false;r.timedOut=true;r.elapsedSec=QUIZ_SECONDS;stopTimer();s.phase='review';save();render();notify('Temps écoulé : correction affichée.');return;}
 if(s.phase==='reading'&&item.kind==='case'){const startWritingAt=s.timer.endsAt;stopTimer();beginTimed(s,'writing',WRITE_SECONDS,startWritingAt);notify('Lecture terminée : 60 secondes pour rédiger.');return;}
 if(s.phase==='writing'&&item.kind==='case'){finishCase(true);return;}
 if(s.phase==='speaking'&&item.kind==='oral'){finishOral(true);return;}
 stopTimer();
}
function chooseQuiz(index){
 const s=active(),item=s&&current(s);if(!s||item?.kind!=='quiz'||s.phase!=='running'||!s.timer)return;
 if(timeRemaining(s)<=0){expire();return;}
 const r=result(s,item);r.selectedIndex=index;r.correct=index===item.correct_index;r.timedOut=false;r.elapsedSec=Math.round(elapsed(s)*10)/10;stopTimer();s.phase='review';save();render();notify(r.correct?'Bonne réponse.':'Correction disponible.');
}
function finishCase(timeout=false){const s=active(),item=s&&current(s);if(!s||item?.kind!=='case'||s.phase!=='writing')return;
 const r=result(s,item),el=byId('case-answer');if(el)r.text=el.value.slice(0,9000);
 r.elapsedSec=timeout?WRITE_SECONDS:Math.round(elapsed(s)*10)/10;r.timedOut=timeout;r.finishedAt=stamp();stopTimer();s.phase='review';save();render();notify('Réponse écrite enregistrée localement.');
}
function finishOral(timeout=false){const s=active(),item=s&&current(s);if(!s||item?.kind!=='oral'||s.phase!=='speaking')return;
 const r=result(s,item),inp=byId('manual-draft');if(inp)r.transcript=inp.value.slice(0,9000);
 r.elapsedSec=timeout?ORAL_SECONDS:Math.round(elapsed(s)*10)/10;r.timedOut=timeout;r.finishedAt=stamp();stopTimer();s.phase='closing';save();render();
 if(speech){endSpeech(false,()=>finalizeOral(s,item));}else finalizeOral(s,item);
}
function finalizeOral(s,item){if(active()!==s||current(s)?.id!==item.id)return;
 s.phase='review';s.timer=null;save();render();notify('Réponse orale enregistrée en texte. Vérifie la transcription avant de continuer.');}
function next(){const s=active();if(!s||s.phase!=='review')return;endSpeech(true);speechStatus='';s.cursor+=1;s.timer=null;s.phase=s.cursor>=11?'finished':'ready';if(s.cursor>=11)s.finishedAt=stamp();save();render();}
function saveEditedTranscript(text){const s=active(),item=s&&current(s);if(!s||item?.kind!=='oral'||s.phase!=='review')return;
 const r=result(s,item);r.editedTranscript=String(text).slice(0,9000);r.transcriptEdited=r.editedTranscript.trim()!==String(r.transcript||'').trim();save();}
function prepareSpeech(restart=false){
 const s=active(),item=s&&current(s);if(!s||item?.kind!=='oral'||(!restart&&s.phase!=='ready')||(restart&&(s.phase!=='speaking'||!!speech||timeRemaining(s)<=0)))return;
 const Factory=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Factory){speechStatus='La reconnaissance vocale n’est pas disponible dans ce navigateur. Utilise le mode sans micro.';render();return;}
 let rec;try{rec=new Factory()}catch{speechStatus='Impossible de préparer la reconnaissance vocale.';render();return;}
 if(speech)endSpeech(true);
 const sid=s.pack.session_id,itemId=item.id;
 const record=result(s,item);const capture={rec,sid,itemId,started:false,closing:false,onDone:null,base:restart?(record.transcript||''):'',version:0};speech=capture;
 if(!restart)s.phase='arming';speechStatus=restart?'Reconnexion du microphone en cours…':'Autorisation du microphone en cours…';save();render();
 rec.lang=s.pack.language==='EN'?'en-US':'fr-FR';rec.continuous=true;rec.interimResults=true;rec.maxAlternatives=1;
 rec.onstart=()=>{if(speech!==capture||active()!==s||current(s)?.id!==itemId)return;
  capture.started=true;record.capture='browser-speech';if(!restart)record.startedAt=stamp();record.transcript=record.transcript||'';speechStatus='Micro actif · tes paroles s’écrivent automatiquement';if(restart){save();render();}else beginTimed(s,'speaking',ORAL_SECONDS);};
 rec.onresult=ev=>{if(speech!==capture||active()!==s||current(s)?.id!==itemId)return;
  const finals=[],parts=[];
  for(let i=0;i<ev.results.length;i++){const piece=ev.results[i]?.[0]?.transcript?.trim();if(!piece)continue;(ev.results[i].isFinal?finals:parts).push(piece);}
  record.transcript=[capture.base,...finals,...parts].filter(Boolean).join(' ').slice(0,9000);record.finalTranscript=[capture.base,...finals].filter(Boolean).join(' ').slice(0,9000);
  record.interim=parts.join(' ');save();const el=byId('live-transcript');if(el)el.textContent=record.transcript||'Transcription en cours…';
 };
 rec.onerror=ev=>{if(speech!==capture)return;const name=String(ev?.error||'unknown');speechStatus=`Reconnaissance interrompue (${name}). ${capture.started?'Tu peux poursuivre sans micro.':'Choisis le mode sans micro.'}`;
  if(!capture.started){speech=null;if(!restart)s.phase='ready';save();render();}else{save();render();}
 };
 rec.onend=()=>{if(speech!==capture)return;const done=capture.onDone;
  if(capture.closing){speech=null;if(done)done();return;}
  speech=null;
  if(!capture.started&&(s.phase==='arming'||restart)){if(!restart)s.phase='ready';speechStatus='Le microphone n’a pas démarré. Choisis le mode sans micro ou réessaie.';save();render();return;}
  if(s.phase==='speaking'){speechStatus='Le micro s’est arrêté. Le chronomètre continue ; termine ta réponse ou utilise le mode manuel.';save();render();}
 };
 try{rec.start()}catch(err){speech=null;if(!restart)s.phase='ready';speechStatus='Microphone indisponible : '+String(err?.message||err);save();render();}
}
function endSpeech(immediate=false,done){if(!speech){if(done)done();return;}
 const capture=speech;capture.closing=true;capture.onDone=done||null;
 try{capture.rec.stop()}catch{speech=null;if(done)done();return;}
 if(immediate){speech=null;if(done)done();return;}
 setTimeout(()=>{if(speech===capture){speech=null;if(done)done();}},1100);
}
function startManualOral(){const s=active(),item=s&&current(s);if(!s||item?.kind!=='oral'||s.phase!=='ready')return;
 const r=result(s,item);r.capture='manual';r.transcript='';r.startedAt=stamp();speechStatus='Mode sans micro : parle à voix haute, puis saisis la réponse pour la correction.';beginTimed(s,'speaking',ORAL_SECONDS);
}
function buildTimer(s,desc){return `<div class="timer-box" role="timer" aria-label="Temps restant"><div id="time-number" class="timer-number">${fmt(timeRemaining(s))}</div><div><strong>${e(desc)}</strong><div class="timer-text">Le temps continue même si tu changes d’onglet.</div></div></div><div class="progressbar"><span id="time-progress" style="width:${Math.max(0,100*timeRemaining(s)/s.timer.seconds)}%"></span></div>`;}
function head(s,item){const stepsAll=steps(s.pack),idx=s.cursor;return `<div class="topline"><div><p class="eyebrow">${e(s.pack.date)} · ${e(s.pack.language)} · Séance quotidienne</p><h1>${e(s.pack.title)}</h1><p class="muted">${item?`Exercice ${idx+1}/11 · ${item.kind==='quiz'?'Quiz':item.kind==='case'?'Cas écrit':'Confrontation orale'} ${item.number}`:'Séance terminée'}</p></div><button class="btn ghost" data-action="home">Mes séances</button></div><div class="progressbar" aria-label="Avancement de la séance"><span style="width:${(progress(s)/11)*100}%"></span></div><div class="stepbar"><span class="step-label">${progress(s)} sur 11 exercices terminés</span><span class="tag">${item?e(item.skill):'Terminé'}</span></div>`;}
function renderQuiz(s,item){const r=result(s,item);let html=`<div class="panel"><div class="info-row"><span class="tag">QCM ${item.number}/6</span><span class="tag gray">40 secondes</span></div>`;
 if(s.phase==='ready')html+=`<h2 style="margin-top:16px">Question de raisonnement rapide</h2><p class="muted">La question apparaît au démarrage du chronomètre. Choisis une seule réponse ; la correction s’affiche immédiatement.</p><div class="actions"><button class="btn primary" data-action="quiz-start">Commencer la question · 40 s</button></div>`;
 else {html+=`<div class="question"><h2>${e(item.question)}</h2></div>`;
  if(s.phase==='running')html+=buildTimer(s,'Choisis une réponse')+`<div class="choice-grid">${item.options.map((opt,i)=>`<button class="choice" data-action="quiz-choose" data-index="${i}"><span class="letter">${'ABCD'[i]}</span>${e(opt)}</button>`).join('')}</div>`;
  if(s.phase==='review'){
   const isOk=r.correct===true;
   html+=`<div class="choice-grid">${item.options.map((opt,i)=>`<div class="choice ${i===item.correct_index?'correct':r.selectedIndex===i?'incorrect':''}"><span class="letter">${'ABCD'[i]}</span>${e(opt)}${i===item.correct_index?' ✓':''}${i===r.selectedIndex&&i!==item.correct_index?' · ton choix':''}</div>`).join('')}</div><div class="feedback ${isOk?'':'warn'}"><strong>${isOk?'Bonne réponse':r.timedOut?'Temps écoulé':'Réponse à corriger'}</strong><p>${e(item.explanation)}</p><span class="small">Réponse correcte : ${'ABCD'[item.correct_index]} · ${e(item.options[item.correct_index])}</span></div><div class="actions"><button class="btn primary" data-action="next">${s.cursor===10?'Voir le bilan':'Exercice suivant →'}</button></div>`;
  }
 }
 return html+'</div>';
}
function stressSelector(r){return `<div style="max-width:300px;margin:17px 0"><label class="field-label" for="stress-report">Pression ressentie (facultatif)</label><select id="stress-report" class="input"><option value="">Non renseignée</option>${Array.from({length:11},(_,n)=>`<option value="${n}" ${r.stressReported===n?'selected':''}>${n}/10</option>`).join('')}</select><p class="small muted">Ton ressenti est déclaré par toi, jamais déduit de la voix.</p></div>`;}
function renderCase(s,item){const r=result(s,item);let html=`<div class="panel"><div class="info-row"><span class="tag">Cas écrit ${item.number}/2</span><span class="tag gray">50 s lecture + 60 s réponse</span></div><h2 style="margin-top:16px">${e(item.title)}</h2>`;
 if(s.phase==='ready')html+=`<p class="muted">Lis le contexte pendant 50 secondes. Le champ de réponse s’ouvrira automatiquement à la fin de la lecture pour 60 secondes.</p><div class="actions"><button class="btn primary" data-action="case-start">Afficher le contexte et commencer la lecture</button></div>`;
 else{
  html+=`<div class="question"><p class="case-context">${e(item.context)}</p></div><div class="case-task"><strong>Consigne</strong><p>${e(item.task)}</p></div>`;
  if(s.phase==='reading')html+=buildTimer(s,'Lecture et analyse · rédaction verrouillée')+`<p class="notice">Le champ écrit apparaîtra automatiquement à la fin des 50 secondes.</p>`;
  if(s.phase==='writing')html+=buildTimer(s,'Réponse écrite · 60 secondes')+`<label class="field-label" for="case-answer">Ta réponse / posture</label><textarea id="case-answer" placeholder="Rédige ta réponse spontanée ici…" maxlength="9000">${e(r.text||'')}</textarea><div class="actions"><button class="btn primary" data-action="case-finish">Terminer et enregistrer</button></div>`;
  if(s.phase==='review')html+=`<div class="feedback"><strong>Réponse conservée</strong><p>Durée de rédaction : ${r.elapsedSec==null?'—':r.elapsedSec+' s'} · ${r.timedOut?'Temps écoulé':'Fin volontaire'}. La qualité sera corrigée après export vers ChatGPT.</p></div><div class="answer-text">${e(r.text?.trim()||'Aucune réponse écrite.')}</div>${stressSelector(r)}<div class="actions"><button class="btn primary" data-action="next">Exercice suivant →</button></div>`;
 }
 return html+'</div>';
}
function renderOral(s,item){const r=result(s,item);let html=`<div class="panel"><div class="info-row"><span class="tag">Confrontation ${item.number}/3</span><span class="tag gray">40 secondes de réponse</span></div><h2 style="margin-top:16px">Réactivité orale</h2><div class="question"><span class="eyebrow">Contexte</span><p>${e(item.context)}</p><span class="eyebrow">Interlocuteur</span><h3 style="margin-bottom:0">« ${e(item.confrontation)} »</h3></div>`;
 if(s.phase==='ready')html+=`<p class="muted">Lis la confrontation avant de commencer. Le chronomètre de 40 secondes démarre <strong>uniquement quand le microphone est activé</strong>.</p><div class="actions"><button class="btn primary" data-action="speech-start">🎙 Activer le micro et démarrer · 40 s</button><button class="btn ghost" data-action="manual-start">Mode sans micro</button></div><div class="notice amber small">La transcription automatique utilise la reconnaissance vocale du navigateur, qui peut contacter son fournisseur. Tes réponses sont enregistrées dans ce navigateur. Le mode sans micro reste possible.</div>${speechStatus?`<div class="status error" role="alert" style="margin-top:12px">${e(speechStatus)}</div>`:''}`;
 if(s.phase==='arming')html+=`<div class="status">Autorisation du microphone en attente… Aucun temps n’est encore comptabilisé.</div><div class="actions"><button class="btn ghost" data-action="speech-cancel">Annuler et choisir le mode sans micro</button></div>`;
 if(s.phase==='speaking'){
  html+=buildTimer(s,'Réponds à voix haute · temps restant')+`<div class="status ${speechStatus.includes('arrêt')?'error':''}" role="status">${e(speechStatus||'Réponse en cours')}</div>`;
  if(r.capture==='manual'||(!speech&&r.capture==='browser-speech'))html+=`<label class="field-label" for="manual-draft">${r.capture==='manual'?'Retranscription manuelle (mode secours)':'Micro interrompu : complète au besoin la transcription'}</label><textarea id="manual-draft" maxlength="9000" placeholder="Note la réponse prononcée, sans l’améliorer…">${e(r.transcript||'')}</textarea>`;
  else html+=`<label class="field-label">Transcription en direct</label><div class="transcript ${r.transcript?'':'pending'}" id="live-transcript" aria-live="polite">${e(r.transcript||'En attente de tes paroles…')}</div>`;
  html+=`<div class="actions">${!speech&&r.capture==='browser-speech'?'<button class="btn subtle" data-action="speech-resume">↻ Relancer le micro</button>':''}<button class="btn primary" data-action="oral-finish">Terminer ma réponse</button></div>`;
 }
 if(s.phase==='closing')html+=`<div class="status">Finalisation de la dictée…</div>`;
 if(s.phase==='review')html+=`<div class="feedback"><strong>Réponse terminée</strong><p>Durée : ${r.elapsedSec==null?'—':r.elapsedSec+' s'} · ${r.capture==='manual'?'Mode manuel':'Reconnaissance navigateur'}${r.timedOut?' · temps écoulé':''}.</p></div><label class="field-label" for="edited-transcript">Transcription obtenue — corrige uniquement les erreurs de reconnaissance</label><textarea id="edited-transcript" maxlength="9000">${e(r.editedTranscript??r.transcript??'')}</textarea><p class="small muted">Le texte brut reste conservé séparément. Si tu reformules ou embellis, l’évaluation devra toujours se baser sur ta réponse spontanée.</p>${stressSelector(r)}<div class="actions"><button class="btn primary" data-action="next">${s.cursor===10?'Voir mon bilan →':'Exercice suivant →'}</button></div>`;
 return html+'</div>';
}
function packHome(){const today=new Date().toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});
 const hist=Object.values(db.sessions).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
 return `<div class="topline"><div><p class="eyebrow">Entraînement cognitif et oral</p><h1>Ta séance, un jour à la fois.</h1><p class="lead">Un fichier pour 11 exercices. Analyse rapide, cas pratiques écrits, confrontations orales et correction finale avec ton coach.</p></div><span class="tag gray">${e(today)}</span></div><div class="grid grid3"><div class="feature"><strong>6 × 40 s</strong><span>Quiz · correction immédiate</span></div><div class="feature"><strong>2 cas</strong><span>50 s lecture + 60 s rédaction</span></div><div class="feature"><strong>3 × 40 s</strong><span>Confrontations · transcription vocale</span></div></div><div class="panel" style="margin-top:18px"><h2>Importer ta séance du jour</h2><p class="muted">Télécharge le fichier de séance fourni par ChatGPT, puis sélectionne-le ici. Un nouvel import ne supprime pas les séances précédentes.</p><label class="upload"><span aria-hidden="true" style="font-size:1.7rem">⇧</span><span style="flex:1"><strong>Choisir un fichier .json de séance</strong><small>Format : response-lab-daily-session-v1 · 6 QCM, 2 cas et 3 oraux</small><input id="session-upload" type="file" accept=".json,application/json" aria-label="Fichier de séance à importer"></span></label><div class="actions"><button class="btn subtle" data-action="demo">Essayer la séance modèle</button><a class="btn" href="seance_2026-11-07.json" download>Télécharger la séance modèle</a></div></div><div class="panel"><h2>Mes séances enregistrées</h2>${hist.length?`<div class="history-list">${hist.map(s=>`<div class="history-item"><div><strong>${e(s.pack.title)}</strong><p class="muted small" style="margin:0">${e(s.pack.date)} · ${e(s.pack.language)} · ${progress(s)}/11 exercices</p></div><button class="btn subtle" data-action="open" data-id="${e(s.pack.session_id)}">${s.phase==='finished'?'Bilan':'Reprendre'}</button></div>`).join('')}</div>`:`<p class="muted">Aucune séance importée pour l’instant.</p>`}</div><div class="notice small">Confidentialité : les réponses sont conservées dans le navigateur de cet appareil, sans synchronisation. L'export vers ChatGPT est volontaire. La reconnaissance vocale automatique peut nécessiter Internet selon le navigateur.</div>`;
}
function renderFinished(s){const items=steps(s.pack);const quizCorrect=items.filter(i=>i.kind==='quiz'&&s.answers[i.id]?.correct===true).length;
 const graded=Object.values(s.grades).filter(n=>Number.isInteger(n)&&n>=0&&n<=4),all=graded.length;
 let html=head(s,null)+`<div class="panel"><div class="info-row"><span class="tag green">11 exercices terminés</span><span class="tag">QCM : ${quizCorrect}/6 corrects</span></div><h2 style="margin-top:15px">Bilan de ta séance</h2><p class="muted">Tes choix QCM sont corrigés automatiquement. Pour les deux cas écrits et les trois oraux, exporte le fichier des réponses et joins-le à ChatGPT. Ensuite, <strong>saisis toi-même chaque note</strong> ci-dessous : aucune note subjective n’est inventée par l’application.</p><div class="actions"><button class="btn primary" data-action="export">↓ Télécharger le fichier de mes réponses</button><button class="btn ghost" data-action="home">Mes séances</button></div><div class="file-box small">Demande au coach de te fournir une correction avec une note de 0 à 4 pour chaque exercice, en conservant les identifiants. Tu recopies ensuite les notes et les conseils dans les champs de cette page.</div></div><div class="panel"><h2>Notes et corrections manuelles</h2><p class="muted small" id="grade-summary">${all}/11 notes renseignées${all?' · moyenne indicative '+(graded.reduce((a,b)=>a+b,0)/all).toFixed(1)+'/4':''}. Les bonnes réponses aux QCM restent distinguées de la notation manuelle.</p><div class="results-list">`;
 for(let n=0;n<items.length;n++){const i=items[n],r=s.answers[i.id]||{},note=s.coachNotes[i.id]||'',grade=s.grades[i.id];const isQuiz=i.kind==='quiz';let answer='';if(isQuiz){const chosen=r.selectedIndex==null?'Aucune réponse':'ABCD'[r.selectedIndex]+' · '+i.options[r.selectedIndex];answer=`<strong class="${r.correct?'notes-points':'muted'}">${r.correct?'Correct':'À corriger'}</strong> · ${e(chosen)}<p class="small muted">Bonne réponse : ${e(i.options[i.correct_index])}</p>`;}else if(i.kind==='case')answer=e(r.text||'Aucune réponse écrite.');else answer=e(r.editedTranscript??r.transcript??'Aucune transcription.');
  html+=`<section class="result-card"><div class="result-head"><div><span class="tag gray">${isQuiz?'QCM':i.kind==='case'?'Écrit':'Oral'} ${i.number}</span> <strong>${e(i.id)}</strong></div><span class="muted small">${r.elapsedSec==null?'—':r.elapsedSec+' s'}</span></div><div class="answer-text">${answer}</div><div class="grade-row"><div><label class="field-label" for="grade-${n}">Note du coach (0–4)</label><select class="input grade-field" id="grade-${n}" data-id="${e(i.id)}"><option value="">Non noté</option>${[0,1,2,3,4].map(v=>`<option value="${v}" ${grade===v?'selected':''}>${v}/4</option>`).join('')}</select></div><div><label class="field-label" for="note-${n}">Conseil du coach (facultatif)</label><textarea class="note-field" id="note-${n}" data-id="${e(i.id)}" rows="2" maxlength="1500" placeholder="Correction ou micro-consigne à appliquer…">${e(note)}</textarea></div></div></section>`;
 }
 html+=`</div><div class="actions"><button class="btn primary" data-action="export">↓ Exporter mes réponses</button><button class="btn ghost" data-action="home">Retour aux séances</button></div></div>`;return html;
}
function render(){clearTick();const s=active();if(!s){dom.innerHTML=packHome();return;}
 if(s.cursor>=11||s.phase==='finished'){dom.innerHTML=renderFinished(s);return;}
 const item=current(s);if(!item){dom.innerHTML=packHome();return;}
 dom.innerHTML=head(s,item)+(item.kind==='quiz'?renderQuiz(s,item):item.kind==='case'?renderCase(s,item):renderOral(s,item));
 if(s.timer)runTick();
}
function answersFile(s){
 const records=steps(s.pack).map(i=>{const r=s.answers[i.id]||{};const common={id:i.id,type:i.kind,skill:i.skill,elapsed_seconds:r.elapsedSec??null,timed_out:!!r.timedOut,manual_grade_0_4:Number.isInteger(s.grades[i.id])?s.grades[i.id]:null,coach_note_manually_entered:s.coachNotes[i.id]||'',stress_reported_0_10:Number.isInteger(r.stressReported)?r.stressReported:null};
  if(i.kind==='quiz')return {...common,question:i.question,options:i.options,chosen_index:r.selectedIndex??null,correct_index:i.correct_index,correct_answer:i.options[i.correct_index],correct:r.correct===true,explanation:i.explanation};
  if(i.kind==='case')return {...common,title:i.title,context:i.context,task:i.task,response:r.text||''};
  return {...common,context:i.context,confrontation:i.confrontation,transcript_raw:r.transcript||'',transcript_reviewed:r.editedTranscript??r.transcript??'',transcript_edited:!!r.transcriptEdited,capture_mode:r.capture||'unknown'};
 });
 return {schema:RESPONSE_SCHEMA,session_id:s.pack.session_id,date:s.pack.date,language:s.pack.language,title:s.pack.title,exported_at:stamp(),coach_instructions:'Évalue les réponses spontanées uniquement. Pour chaque exercice ID, donne une correction concrète et une note 0–4 justifiée ; pour les QCM, utilise la bonne réponse fournie. Pour les oraux, juge la transcription brute, sans inventer fluidité, stress ou vitesse cognitive. Si la réponse est absente, ne donne pas de note de qualité. Le participant saisira manuellement les notes dans Response Lab.',quiz_correct_count:records.filter(r=>r.type==='quiz'&&r.correct).length,answers:records};
}
function downloadFile(filename,payload){const blob=new Blob([JSON.stringify(payload,null,2)+'\n'],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);}
function exportAnswers(){const s=active();if(!s||s.phase!=='finished'){notify('Termine les 11 exercices pour exporter la séance.');return;}
 downloadFile(`Response_Lab_Reponses_${s.pack.session_id}.json`,answersFile(s));notify('Fichier de réponses téléchargé : joins-le au coach.');}
function resumeTimers(){const s=active();if(!s)return;
 // A microphone permission dialog cannot be resumed after reload; keep the step ready instead of counting imagined time.
 if(s.phase==='arming'){s.phase='ready';s.timer=null;speechStatus='Micro interrompu par le rechargement. Recommence quand tu es prêt.';save();}
 if(s.phase==='closing'){s.phase='review';s.timer=null;save();}
 if(s.phase==='speaking'&&s.answers[current(s)?.id]?.capture==='browser-speech'&&!speech)speechStatus='Microphone interrompu pendant la navigation : texte partiel conservé. Le chronomètre continue.';
 if(s.timer&&s.timer.endsAt<=Date.now())expire();
}
async function handleAction(btn){const a=btn.dataset.action,s=active();
 if(a==='home'){if(speech)endSpeech(true);clearTick();db.activeId=null;save();render();return;}
 if(a==='demo'){try{const r=await fetch('seance_2026-11-07.json');if(!r.ok)throw Error('Séance modèle introuvable.');create(await r.json())}catch(err){notify('Impossible de charger la séance modèle : '+err.message)}return;}
 if(a==='open'){moveTo(btn.dataset.id);resumeTimers();render();return;}
 if(!s)return;
 if(a==='quiz-start'&&s.phase==='ready'&&current(s).kind==='quiz'){result(s,current(s)).startedAt=stamp();beginTimed(s,'running',QUIZ_SECONDS);return;}
 if(a==='quiz-choose'){chooseQuiz(Number(btn.dataset.index));return;}
 if(a==='case-start'&&s.phase==='ready'&&current(s).kind==='case'){result(s,current(s)).startedAt=stamp();beginTimed(s,'reading',READ_SECONDS);return;}
 if(a==='case-finish'){finishCase(false);return;}
 if(a==='speech-start'){speechStatus='';prepareSpeech();return;}
 if(a==='speech-cancel'&&s.phase==='arming'){endSpeech(true);s.phase='ready';s.timer=null;speechStatus='Autorisation annulée. Tu peux réessayer ou choisir le mode sans micro.';save();render();return;}
 if(a==='speech-resume'){prepareSpeech(true);return;}
 if(a==='manual-start'){startManualOral();return;}
 if(a==='oral-finish'){finishOral(false);return;}
 if(a==='next'){next();return;}
 if(a==='export'){exportAnswers();return;}
}
function bind(){
 document.addEventListener('click',ev=>{const button=ev.target.closest('button[data-action]');if(!button||button.disabled)return;handleAction(button).catch(err=>{notify('Action impossible : '+err.message);console.error(err)})});
 document.addEventListener('change',ev=>{const el=ev.target;
  if(el?.id==='session-upload'){importFile(el.files?.[0]).catch(err=>notify('Import refusé : '+err.message)).finally(()=>{el.value=''});return;}
  const s=active();if(!s)return;
  if(el.id==='stress-report'&&s.phase==='review'){result(s,current(s)).stressReported=el.value===''?null:Number(el.value);save();return;}
  if(s.phase!=='finished')return;
  if(el.classList.contains('grade-field')){s.grades[el.dataset.id]=el.value===''?null:Number(el.value);save();const gr=Object.values(s.grades).filter(n=>Number.isInteger(n)&&n>=0&&n<=4),sum=byId('grade-summary');if(sum)sum.textContent=gr.length+'/11 notes renseignées'+(gr.length?' · moyenne indicative '+(gr.reduce((a,b)=>a+b,0)/gr.length).toFixed(1)+'/4':'')+'. Les bonnes réponses QCM restent distinctes de la notation manuelle.';notify('Note enregistrée : '+el.dataset.id);}
 });
 document.addEventListener('input',ev=>{const s=active();if(!s)return;const el=ev.target;
  if(el?.id==='case-answer'&&s.phase==='writing'){const r=result(s,current(s));r.text=el.value.slice(0,9000);save();return;}
  if(el?.id==='manual-draft'&&s.phase==='speaking'){const r=result(s,current(s));r.transcript=el.value.slice(0,9000);save();return;}
  if(el?.id==='edited-transcript'&&s.phase==='review'){saveEditedTranscript(el.value);return;}
  if(el.classList?.contains('note-field')&&s.phase==='finished'){s.coachNotes[el.dataset.id]=el.value.slice(0,1500);save();return;}
 });
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')tick();});
 window.addEventListener('pagehide',()=>{if(speech)endSpeech(true);save();clearTick();});
 window.addEventListener('keydown',ev=>{if(ev.altKey||ev.ctrlKey||ev.metaKey||ev.target?.matches('input,textarea,select,button'))return;const s=active();if(!s||s.phase!=='running'||current(s)?.kind!=='quiz')return;const n=Number(ev.key);if(n>=1&&n<=4){chooseQuiz(n-1);ev.preventDefault();}});
}
function init(){load();bind();resumeTimers();render();if('serviceWorker' in navigator&&(['https:','http:'].includes(location.protocol)))navigator.serviceWorker.register('./sw.js').catch(()=>{});}
window.ResponseLabDaily={validatePack,answersFile,getState:()=>db,init};
init();
})();
