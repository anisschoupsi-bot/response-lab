'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const get=p=>fs.readFileSync(path.join(root,p),'utf8');
let count=0;function check(v,msg){assert.ok(v,msg);count++;}
const html=get('index.html'),css=get('assets/styles.css'),app=get('assets/app.js'),sw=get('sw.js'),pack=JSON.parse(get('seance_2026-11-07.json'));
const regex=/<(?:link|script)\b[^>]*(?:href|src)="([^"]+)"/g;let m;
while((m=regex.exec(html))){const v=m[1];if(v.startsWith('http'))continue;check(fs.existsSync(path.join(root,v.split('?')[0])),'asset exists: '+v)}
check(html.includes('DAILY TRAINING / 2.0'),'version shown');
check(html.includes('assets/app.js?v=2.0.0'),'cache bust for JS');
check(html.includes('assets/styles.css?v=2.0.0'),'cache bust for CSS');
check(sw.includes('response-lab-daily-v2-'),'cache versioned');
check(sw.includes('./assets/app.js?v=2.0.0')&&sw.includes('./assets/styles.css?v=2.0.0'),'cache includes versioned resources');
check(sw.includes("req.mode==='navigate'")&&sw.includes('fetch(req)'), 'page navigation fetches freshest version');
check(css.includes('right:max(16px')&&css.includes('.timer-dock{position:fixed;top:14px'),'timer fixed top right desktop');
check(css.includes('top:76px;right:12px')&&css.includes('font-size:2.8rem'),'mobile timer fixed top right');
check(css.includes('.case-layout{display:grid')&&css.includes('case-write-pane textarea'),'simultaneous context/text layout');
check(app.includes('CASE_SECONDS=110')&&!app.includes("beginTimed(s,'reading'"),'single combined case phase');
check(app.includes('option_explanations')&&app.includes('speech-locale'),'QCM distractor feedback and accent selection');
check(app.includes('speech-test')&&app.includes('speech-test-stop'),'mic rehearsal control');
check(app.includes('legacyGrades')&&app.includes('state-v2'),'notes migration without mixing scales');
check(app.includes('scoreRange')&&app.includes('done.slice(0,30)'),'30-session history');
check(app.includes('exportBackup')&&app.includes('importBackup'),'full backup and restore');
check(pack.schema==='response-lab-daily-session-v1'&&pack.quiz.length===6&&pack.cases.length===2&&pack.oral.length===3,'11 exercises in pack');
check(pack.quiz.every(q=>q.option_explanations?.length===4),'all example quiz distractors explained');
check(pack.oral.every(x=>x.keywords?.length>=3),'oral vocabulary hints in example pack');
check(get('PROMPT_GENERATION_SEANCE.md').includes('110 secondes')&&get('PROMPT_CORRECTION.md').includes('0–5'),'documentation matches session and score rules');
console.log(`PASS ${count} checks: source links, offline resource cache, large top-right timer, case layout, schema, scoring and prompts.`);
