'use strict';
function beginOral(){return prepareOral(true)}
function manualOral(){return prepareOral(false)}
function beginOralClock(s,phase){if(session!==s||s.stage!==phase)return;s.oralStarted=now();s.onset=undefined;s.onsetMethod=null;s.oralPreparing=false;s.oralError='';render()}
async function prepareOral(withMic){
 stopBreath();const s=session;
 if(!s||!['oral1','oral2'].includes(s.stage)||s.oralStarted!==null||s.oralPreparing||oralBusy)return;
 const phase=s.stage;
 if(!withMic){beginOralClock(s,phase);return}
 s.oralPreparing=true;s.oralError='';render();
 let stream=null,recorder=null;
 try{
  if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder)throw Error(s.lang==='fr'?'Enregistrement audio non pris en charge par ce navigateur.':'Audio recording is not supported by this browser.');
  stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});
  if(session!==s||s.stage!==phase){stream.getTracks().forEach(x=>x.stop());return}
  recorder=new MediaRecorder(stream);
  let started=false;
  const chunks=[];
  const ready=new Promise((resolve,reject)=>{
   const fail=e=>{if(!started)reject(e instanceof Error?e:Error('Enregistreur indisponible'));};
   recorder.addEventListener('start',()=>{started=true;resolve()}, {once:true});
   recorder.addEventListener('error',fail,{once:true});
  });
  recorder.ondataavailable=e=>{if(e.data&&e.data.size>0)chunks.push(e.data)};
  const done=new Promise(resolve=>recorder.addEventListener('stop',()=>{let blob=chunks.length?new Blob(chunks,{type:recorder.mimeType||chunks[0].type||'audio/webm'}):null;if(blob&&blob.size>0&&session===s)s.audioBlobs[phase]=blob;resolve(blob)},{once:true}));
  recorder.start(250);
  await Promise.race([ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('Délai du micro dépassé')),6000))]);
  if(session!==s||s.stage!==phase){try{recorder.stop()}catch{}stream.getTracks().forEach(x=>x.stop());return}
  voice={stream,recorder,done,phase,session:s,poll:null,audioCtx:null,recognition:null};
  try{
   const Ac=window.AudioContext||window.webkitAudioContext;
   if(Ac){let audioCtx=new Ac(),source=audioCtx.createMediaStreamSource(stream),analyser=audioCtx.createAnalyser();analyser.fftSize=512;source.connect(analyser);voice.audioCtx=audioCtx;const samples=new Uint8Array(analyser.fftSize);let sustained=0;voice.poll=setInterval(()=>{if(session!==s||s.stage!==phase||s.oral[phase])return;analyser.getByteTimeDomainData(samples);let sum=0;for(const sample of samples){const v=(sample-128)/128;sum+=v*v}const rms=Math.sqrt(sum/samples.length);sustained=rms>.07?sustained+1:0;if(sustained>=3&&s.onset===undefined)markOnset('mic')},100)}
  }catch(e){console.warn('Sound onset meter not available',e)}
  beginOralClock(s,phase);
  s.transcriptionStatus[phase]=s.lang==='fr'?'Audio local en cours. Dictée locale : vérification…':'Local audio recording. Checking on-device dictation…';
  updateOralStatus(s,phase);
  startLocalDictation(s,phase,voice).catch(e=>{s.transcriptionStatus[phase]=s.lang==='fr'?'Audio conservé, dictée locale indisponible.':'Audio kept, local dictation unavailable.';updateOralStatus(s,phase);console.warn(e)});
 }catch(err){
  if(recorder&&recorder.state==='recording')try{recorder.stop()}catch{}
  if(stream)stream.getTracks().forEach(t=>t.stop());
  if(session!==s||s.stage!==phase)return;
  s.oralPreparing=false;s.oralError=(s.lang==='fr'?'Micro non activé : ':'Micro not started: ')+(err.name==='NotAllowedError'?(s.lang==='fr'?'autorisation refusée.':'permission denied.'):(err.message||String(err)))+' '+(s.lang==='fr'?'Tu peux démarrer sans micro.':'You can start without mic.');
  render();
 }
}
function updateOralStatus(s,phase){if(session!==s||s.stage!==phase)return;const el=$('mic-status');if(el)el.textContent=s.transcriptionStatus[phase]||t('micOn');const live=$('transcript-live');if(live)live.textContent=s.transcripts[phase]||''}
async function startLocalDictation(s,phase,v){
 const Factory=window.SpeechRecognition||window.webkitSpeechRecognition;
 const lng=s.lang==='en'?'en-US':'fr-FR';
 if(!Factory||typeof Factory.available!=='function'){
  s.transcriptionStatus[phase]=s.lang==='fr'?'Audio enregistré localement ; dictée locale non disponible dans ce navigateur. Saisie manuelle possible après.':'Audio recorded locally; on-device dictation unavailable here. You can type after.';updateOralStatus(s,phase);return;
 }
 let availability;
 try{availability=await Factory.available({langs:[lng],processLocally:true})}catch(e){availability='unavailable'}
 if(session!==s||s.stage!==phase||voice!==v)return;
 if(availability!=='available'){
  s.transcriptionStatus[phase]=s.lang==='fr'?'Audio local actif ; pack de dictée locale absent. Aucun service vocal distant utilisé.':'Local audio active; on-device dictation pack missing. No cloud speech service used.';updateOralStatus(s,phase);return;
 }
 const recognition=new Factory();recognition.lang=lng;if(!('processLocally' in recognition)){s.transcriptionStatus[phase]=s.lang==='fr'?'Dictée strictement locale non garantie par ce navigateur. Enregistrement audio uniquement.':'Browser cannot guarantee on-device dictation. Recording audio only.';updateOralStatus(s,phase);return}recognition.processLocally=true;recognition.continuous=true;recognition.interimResults=true;
 v.recognition=recognition;
 recognition.onresult=e=>{if(session!==s||s.stage!==phase||voice!==v||s.oral[phase])return;const finals=[],interims=[];for(let i=0;i<e.results.length;i++){let item=e.results[i];let str=item?.[0]?.transcript?.trim();if(str)(item.isFinal?finals:interims).push(str)}s.transcripts[phase]=[...finals,...interims].join(' ').trim();updateOralStatus(s,phase)};
 recognition.onerror=e=>{s.transcriptionStatus[phase]=s.lang==='fr'?'Dictée locale interrompue ; audio toujours enregistré.':'Local dictation stopped; audio still recorded.';updateOralStatus(s,phase)};
 recognition.onend=()=>{if(voice===v&&session===s&&s.stage===phase)updateOralStatus(s,phase)};
 try{recognition.start();s.transcriptionStatus[phase]=s.lang==='fr'?'Micro et chronomètre actifs · transcription locale en direct.':'Mic and timer active · on-device live transcription.';updateOralStatus(s,phase)}catch(e){s.transcriptionStatus[phase]=s.lang==='fr'?'Audio actif ; dictée locale inaccessible.':'Audio active; local dictation unavailable.';updateOralStatus(s,phase)}
}
async function installLocalDictation(){
 const Factory=window.SpeechRecognition||window.webkitSpeechRecognition;
 const lang=state.lang==='fr'?'fr-FR':'en-US';
 if(!Factory||typeof Factory.available!=='function'){
  dictationMessage=state.lang==='fr'?'Ce navigateur ne fournit pas de dictée locale vérifiable. L’enregistrement audio reste disponible.':'This browser has no verifiable on-device speech-to-text. Audio recording still works.';renderHome();return
 }
 dictationMessage=state.lang==='fr'?'Vérification de la langue locale…':'Checking local language pack…';renderHome();
 try{
  const availability=await Factory.available({langs:[lang],processLocally:true});
  if(availability==='available')dictationMessage=state.lang==='fr'?'Dictée locale prête pour '+lang+'.':'Local dictation ready for '+lang+'.';
  else if(['downloadable','downloading'].includes(availability)&&typeof Factory.install==='function'){
   dictationMessage=state.lang==='fr'?'Téléchargement du pack depuis le fournisseur du navigateur (une fois), sans envoyer ta voix.':'Downloading the browser language pack once, without uploading your voice.';renderHome();
   const installed=await Factory.install({langs:[lang],processLocally:true});
   dictationMessage=installed?(state.lang==='fr'?'Pack local installé, tu peux commencer.':'Local pack installed; ready to practice.'):(state.lang==='fr'?'Installation du pack impossible. Audio et notes manuelles disponibles.':'Language pack install failed. Audio and manual notes are available.');
  }else dictationMessage=state.lang==='fr'?'Pack vocal local indisponible pour '+lang+'. Enregistre l’audio ou écris tes notes.':'On-device language pack unavailable for '+lang+'. Record audio or type notes.';
 }catch(e){dictationMessage=state.lang==='fr'?'Dictée locale indisponible : '+(e.message||e):'Local dictation unavailable: '+(e.message||e)}
 if(!session)renderHome()
}
function markOnset(method){const s=session;if(!s||!['oral1','oral2'].includes(s.stage)||s.oralStarted===null||s.onset!==undefined)return;s.onset=Math.max(0,now()-s.oralStarted)/1000;s.onsetMethod=method;const b=document.querySelector('[data-action=mark]');if(b)b.disabled=true}
async function stopCapture(){if(!voice)return null;const v=voice;voice=null;clearInterval(v.poll);if(v.recognition)try{v.recognition.stop()}catch{}if(v.recorder?.state==='recording'||v.recorder?.state==='paused')try{v.recorder.stop()}catch{}v.stream.getTracks().forEach(x=>x.stop());if(v.audioCtx)try{await v.audioCtx.close()}catch{}return await v.done}
async function finishOral(){
 const s=session;if(!s||!['oral1','oral2'].includes(s.stage)||s.oralStarted===null||s.oral[s.stage]||oralBusy)return;
 oralBusy=true;const key=s.stage;
 s.oral[key]={elapsed:Math.max(0,(now()-s.oralStarted)/1000),onset:s.onset??null,method:s.onsetMethod||null,recorded:false};
 stopTicker();try{await stopCapture();if(session===s){s.oral[key].recorded=!!s.audioBlobs[key];render()}}finally{oralBusy=false}
}
function getAudioUrl(phase){if(!session)return null;if(!session.clips[phase]&&session.audioBlobs[phase])session.clips[phase]=URL.createObjectURL(session.audioBlobs[phase]);return session.clips[phase]||null}
function renderInlineAudio(phase){const el=$('audio-inline');if(!el)return;const url=getAudioUrl(phase);if(!url)return;const audio=document.createElement('audio');audio.controls=true;audio.preload='metadata';audio.src=url;el.append(audio)}
function renderAudioReview(){const el=$('audio-review');if(!el||!session)return;el.innerHTML='';for(const key of ['oral1','oral2']){const url=getAudioUrl(key);if(!url)continue;const title=document.createElement('p');title.textContent=t('recording')+' '+(key==='oral1'?'1':'2');el.append(title);const audio=document.createElement('audio');audio.controls=true;audio.src=url;el.append(audio);const button=document.createElement('button');button.className='btn secondary';button.textContent=session.lang==='fr'?'↓ Télécharger l’audio':'↓ Download audio';button.dataset.action='download-current-audio';button.dataset.phase=key;el.append(button)}const h=document.createElement('p');h.className='hint';h.textContent=t('voicePrivacy');el.append(h)}
function openAudioDB(){return new Promise((resolve,reject)=>{if(!window.indexedDB)return reject(Error('IndexedDB unavailable'));const req=indexedDB.open(AUDIO_DB,1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('clips'))req.result.createObjectStore('clips',{keyPath:'key'})};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error('Audio storage error'))})}
async function saveAudioClip(key,blob){const db=await openAudioDB();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('clips','readwrite');tx.objectStore('clips').put({key,blob,size:blob.size,type:blob.type,when:Date.now()});tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error||Error('Cannot save audio'));tx.onabort=()=>reject(tx.error||Error('Audio save aborted'))})}finally{db.close()}}
async function readAudioClip(key){const db=await openAudioDB();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('clips','readonly');const req=tx.objectStore('clips').get(key);req.onsuccess=()=>resolve(req.result?.blob||null);req.onerror=()=>reject(req.error||Error('Cannot load audio'))})}finally{db.close()}}
function downloadAudioBlob(blob,filename){if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}
async function playHistoricAudio(id,phase,button){if(!['oral1','oral2'].includes(phase))return;const host=button.closest('.library-row')||button.parentElement;let holder=host.querySelector('.historic-audio');if(!holder){holder=document.createElement('div');holder.className='historic-audio';host.append(holder)}holder.textContent=state.lang==='fr'?'Chargement audio local…':'Loading local audio…';try{const blob=await readAudioClip(id+'|'+phase);if(!blob){holder.textContent=state.lang==='fr'?'Audio absent sur cet appareil.':'No audio on this device.';return}const url=URL.createObjectURL(blob);const audio=document.createElement('audio');audio.controls=true;audio.src=url;audio.onended=()=>URL.revokeObjectURL(url);holder.textContent='';holder.append(audio);const dl=document.createElement('button');dl.className='btn secondary';dl.textContent='↓ Audio';dl.onclick=()=>downloadAudioBlob(blob,'response-lab-'+id+'-'+phase+'.'+(blob.type.includes('mp4')?'m4a':'webm'));holder.append(dl)}catch(e){holder.textContent=state.lang==='fr'?'Stockage audio inaccessible.':'Audio storage unavailable.';console.warn(e)}}
async function finalize(withoutAudio=false){
 const s=session;if(!s||s.stage!=='review'||oralBusy)return;
 oralBusy=true;
 const a={id:(s.recordId||(s.recordId='L3-'+Date.now()+'-'+Math.random().toString(36).slice(2,6))),scenarioId:s.scenario.id,domain:s.scenario.domain,title:loc(s.scenario).title,lang:s.lang,pressure:s.pressure,when:new Date().toISOString(),correct:['analysis','decision','adapt'].filter(k=>s.answers[k]?.chosen===0).length,choices:{...s.answers},oral:JSON.parse(JSON.stringify(s.oral)),transcripts:{...s.transcripts},stressBefore:s.stressBefore,stressAfter:s.stressAfter,checks:s.checks.slice(),audioPhases:[]};
 try{
  if(!withoutAudio){for(const phase of ['oral1','oral2']){if(s.audioBlobs[phase]?.size){await saveAudioClip(a.id+'|'+phase,s.audioBlobs[phase]);a.audioPhases.push(phase)}}}
  state.attempts.push(a);if(state.attempts.length>3000)state.attempts=state.attempts.slice(-3000);
  const pressureNote=adaptPressure(a);saveState();if(navigator.storage?.persist){navigator.storage.persist().catch(()=>{});}releaseClips();session=null;stopTicker();tab='progress';render();setStatus(t('saved')+(pressureNote?' · '+pressureNote:''))
 }catch(e){s.saveError=state.lang==='fr'?'Impossible de conserver l’audio local : '+(e.message||e)+'. Télécharge l’audio ou enregistre sans audio.':'Could not store local audio: '+(e.message||e)+'. Download the audio or save without it.';render();setStatus(s.saveError)}finally{oralBusy=false}
}
function adaptPressure(a){const last=state.attempts.filter(x=>x.lang===a.lang&&x.domain===a.domain&&x.pressure===a.pressure).slice(-3);if(last.length===3&&new Set(last.map(x=>x.scenarioId)).size===3&&last.every(x=>x.correct===3&&Object.values(x.choices).every(q=>q.ms<=cognitiveTarget(x.pressure)*1000))&&state.pressure<4){state.pressure++;return state.lang==='fr'?'Objectif atteint trois fois : pression proposée '+state.pressure+'/4':'Three successful trials: suggested pressure '+state.pressure+'/4'}const two=last.slice(-2);if(two.length===2&&new Set(two.map(x=>x.scenarioId)).size===2&&two.every(x=>x.correct<=1)&&state.pressure>1){state.pressure--;return state.lang==='fr'?'Deux difficultés : pression réduite à '+state.pressure+'/4':'Two difficult trials: pressure lowered to '+state.pressure+'/4'}return ''}
function releaseClips(){if(session?.clips)Object.values(session.clips).forEach(url=>{try{URL.revokeObjectURL(url)}catch{}})}
function download(filename,text,type='application/json'){const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}
function validText(v){return typeof v==='string'&&v.trim().length>2&&v.length<=600}
function validateScenario(input){if(!input||typeof input!=='object'||!DOMAINS.includes(input.domain)||typeof input.id!=='string'||!/^[A-Za-z0-9][A-Za-z0-9_-]{2,63}$/.test(input.id))throw Error('Invalid id or domain');const out={id:input.id,domain:input.domain};for(const lng of ['fr','en'])if(input[lng]){const val=input[lng],fields=['title','cue','focus','distractor1','distractor2','twist'];if(!fields.every(k=>validText(val[k])))throw Error('Invalid scenario '+input.id+' / '+lng);out[lng]=Object.fromEntries(fields.map(k=>[k,val[k].trim()]))}if(!out.fr&&!out.en)throw Error('Missing language');return out}
function parseTxt(text){const lines=text.replace(/\r/g,'').split('\n').map(x=>x.trim()).filter(x=>x&&!x.startsWith('#'));if(!lines.length)throw Error('Empty TXT');if(lines.length>300)throw Error('Too many rows');const out=[];for(const line of lines){const row=line.split('|').map(x=>x.trim());if(row.length!==6)throw Error('TXT: six columns required');const selected=$('pack-domain')?.value;const obj={id:'USER-'+hash(line).toString(36).toUpperCase(),domain:DOMAINS.includes(selected)?selected:'reasoning',[state.lang]:Object.fromEntries(['title','cue','focus','distractor1','distractor2','twist'].map((k,i)=>[k,row[i]]))};out.push(validateScenario(obj))}return out}
async function importPack(file){if(!file)throw Error('Select a file');if(file.size>1_500_000)throw Error('Maximum 1.5 MB');const text=await file.text();let fresh;if(file.name.toLowerCase().endsWith('.txt'))fresh=parseTxt(text);else{const data=JSON.parse(text);if(data.schema!=='response-lab-scenario-pack-v1'||!Array.isArray(data.scenarios)||data.scenarios.length>300)throw Error('Invalid scenario pack');fresh=data.scenarios.map(validateScenario)}if(state.custom.length+fresh.length>1000)throw Error('Maximum 1000 personal scenarios');const used=new Set([...scenarios,...state.custom].map(x=>x.id));let added=0;for(const obj of fresh)if(!used.has(obj.id)){state.custom.push(obj);used.add(obj.id);added++}saveState();importMessage=`${added} scénario(s) ajouté(s), ${fresh.length-added} doublon(s) ignoré(s).`;return added}
function backup(){download('response-lab-v3-backup-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify({schema:'response-lab-v3-backup-v1',exportedAt:new Date().toISOString(),data:state},null,2))}
async function restoreBackup(file){if(!file||file.size>4_000_000)throw Error('Backup too large / missing');const data=JSON.parse(await file.text());if(data.schema!=='response-lab-v3-backup-v1'||!data.data||!Array.isArray(data.data.attempts)||!Array.isArray(data.data.custom))throw Error('Incorrect backup schema');if(data.data.custom.length>1000||data.data.attempts.length>3000)throw Error('Backup contains too many records');const clean=data.data.custom.map(validateScenario);const existing=new Set(state.custom.map(x=>x.id));for(const sc of clean){if(state.custom.length>=1000)break;if(!existing.has(sc.id)){state.custom.push(sc);existing.add(sc.id)}}const seen=new Set(state.attempts.map(x=>x.id));for(const a of data.data.attempts){if(!a||typeof a.id!=='string'||a.id.length>100||typeof a.scenarioId!=='string'||a.scenarioId.length>100||!['fr','en'].includes(a.lang)||!DOMAINS.includes(a.domain)||seen.has(a.id)||!Number.isInteger(a.correct)||a.correct<0||a.correct>3||!Number.isFinite(a.stressBefore)||!Number.isFinite(a.stressAfter)||a.stressBefore<0||a.stressBefore>10||a.stressAfter<0||a.stressAfter>10||!Number.isInteger(a.pressure)||a.pressure<1||a.pressure>4||!Number.isFinite(Date.parse(a.when)))continue;state.attempts.push({...a,title:String(a.title||'').slice(0,100)});seen.add(a.id)}state.attempts=state.attempts.slice(-3000);saveState()}
function cancelSession(){stopBreath();stopTicker();stopCapture();releaseClips();session=null;render()}
function bind(){document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{if(session){if(!confirm(state.lang==='fr'?'Quitter le défi ? La tentative inachevée ne sera pas enregistrée.':'Leave the challenge? Unfinished work will not be saved.'))return;cancelSession()}tab=b.dataset.tab;render()}));$('lang').addEventListener('change',e=>{if(session)return;state.lang=e.target.value;saveState();render()});
 $('app').addEventListener('click',async e=>{const button=e.target.closest('button');if(!button)return;
 if(button.dataset.playDomain){state.domain=button.dataset.playDomain;saveState();startScenario();return}
 if(button.dataset.play){startScenario(button.dataset.play);return}
 if(button.dataset.choice!==undefined){answerChoice(Number(button.dataset.choice));return}
 const action=button.dataset.action;
 if(action==='start')startScenario();
 if(action==='begin'){session.stressBefore=Number($('stress-pre').value);changeStage('analysis')}
 if(action==='advance')advance();
 if(action==='start-oral')beginOral();
 if(action==='manual-oral')manualOral();
 if(action==='breath')startBreath();
 if(action==='mark')markOnset('manual');
 if(action==='download-current-audio'){const phase=button.dataset.phase;if(session?.audioBlobs[phase])downloadAudioBlob(session.audioBlobs[phase],'response-lab-'+session.scenario.id+'-'+phase+'.'+(session.audioBlobs[phase].type.includes('mp4')?'m4a':'webm'));}
 if(action==='finish-oral')finishOral();
 if(action==='save-review'||action==='save-without-audio'){session.stressAfter=Number($('stress-post').value);session.checks=[$('check1').checked,$('check2').checked];await finalize(action==='save-without-audio')}
 if(action==='import-pack'){try{const n=await importPack($('pack-file').files[0]);renderImport();setStatus(n+' scenarios imported')}catch(err){importMessage=String(err.message);const x=$('import-feedback');if(x)x.textContent=importMessage;setStatus(importMessage)}}
 if(action==='template-json')download('response-lab-v3-pack-example.json',JSON.stringify(packTemplate(),null,2));
 if(action==='template-txt')download('response-lab-v3-pack-example.txt','# Une ligne = titre | situation | point clé | distraction 1 | distraction 2 | nouvelle information\n'+(state.lang==='fr'?'Réunion urgente|Le directeur exige une décision, mais un chiffre manque.|Vérifier le chiffre décisif|Choisir selon la présentation|Ignorer le délai|Un chiffre provisoire arrive.':'Urgent meeting|The director needs a decision but a figure is missing.|Verify the decisive figure|Decide from the slides|Ignore the deadline|A provisional figure arrives.')+'\n','text/plain;charset=utf-8');
 if(action==='backup')backup();
 if(action==='install-dictation')installLocalDictation();
 if(action==='play-history')await playHistoricAudio(button.dataset.id,button.dataset.phase,button);
 if(action==='restore'){try{await restoreBackup($('backup-file').files[0]);renderImport();setStatus('Backup imported')}catch(err){setStatus(err.message)}}
 });
 $('app').addEventListener('input',e=>{if(e.target.id==='stress-pre'){session.stressBefore=Number(e.target.value);$('stress-pre-val').textContent=e.target.value+'/10'}if(e.target.id==='stress-post'){session.stressAfter=Number(e.target.value);$('stress-post-val').textContent=e.target.value+'/10'}if(e.target.id==='pressure'){state.pressure=Number(e.target.value);saveState();renderHome()}if(e.target.id==='domain'){state.domain=e.target.value;saveState()}if(e.target.id==='library-filter')renderLibraryRows(e.target.value);if(e.target.id==='transcript-edit'&&session)session.transcripts[session.stage]=e.target.value.slice(0,8000);if(e.target.id==='check1')session.checks[0]=e.target.checked;if(e.target.id==='check2')session.checks[1]=e.target.checked});
 document.addEventListener('keydown',e=>{if(e.target.closest('input,select,textarea'))return;if(session&&['analysis','decision','adapt'].includes(session.stage)&&['1','2','3'].includes(e.key)){const opts=[...document.querySelectorAll('[data-choice]')];const chosen=opts[Number(e.key)-1];if(chosen&&!chosen.disabled){chosen.click();e.preventDefault()}}});
 window.addEventListener('pagehide',()=>{stopCapture();stopTicker()});
}
async function init(){loadState();try{scenarios=(window.RL3_SCENARIOS||[]).map(validateScenario);if(scenarios.length!==100||new Set(scenarios.map(s=>s.id)).size!==100)throw Error('Expected 100 unique scenarios');bind();render();if('serviceWorker' in navigator&&location.protocol==='https:'||location.hostname==='localhost'){navigator.serviceWorker?.register('./sw.js').catch(e=>console.warn('Offline cache unavailable',e))}}catch(e){$('app').innerHTML=`<div class="notice error">${esc(UI[state.lang].errors)} : ${esc(e.message)}</div>`;console.error(e)}}
init();
