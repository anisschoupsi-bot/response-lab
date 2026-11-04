from pathlib import Path
from playwright.sync_api import sync_playwright
import json, datetime
ROOT=Path(__file__).resolve().parent.parent
HTML=(ROOT/'index.html').read_text().replace('<link rel="stylesheet" href="assets/app.css">', '<style>'+(ROOT/'assets/app.css').read_text()+'</style>').replace('<script defer src="assets/app.js"></script>','<script>'+(ROOT/'assets/app.js').read_text()+'</script>')
KEY='response-lab-state-v1'

def fresh(browser, seed=None, viewport=None):
 p=browser.new_page(viewport=viewport or {'width':1440,'height':900});err=[];p.on('pageerror',lambda e:err.append(str(e)))
 p.goto('about:blank')
 p.evaluate('''(seed) => {const data={};if(seed)data['response-lab-state-v1']=JSON.stringify(seed);Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>data[k]??null,setItem:(k,v)=>data[k]=v,removeItem:k=>delete data[k]}})}''',seed)
 p.set_default_timeout(5000)
 p.set_content(HTML)
 assert not err,err
 return p,err

def state(page):return page.evaluate(f"JSON.parse(localStorage.getItem('{KEY}'))")
def act(page,name):page.locator(f'button[data-action="{name}"]:visible').first.click()
def view(page,name):page.locator(f'button[data-view="{name}"]:visible').first.click()
def reply(page,stress='5',blocked='no',scores=True,mode='oral'):
 act(page,'begin-challenge')
 if mode=='oral':act(page,'mark-onset')
 else:page.locator('#response-text').fill('Je propose une expérimentation mesurable.')
 act(page,'submit-challenge')
 if mode=='oral':page.locator('#review-transcript').fill('Je propose une expérimentation mesurable.')
 page.locator('#stress-select').select_option(stress)
 page.locator('#blocked-select').select_option(blocked)
 act(page,'save-challenge')

with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 # R1: stress and retry
 p,err=fresh(browser,{'version':2,'lang':'FR','levels':{'FR':2,'EN':1},'records':[],'session':None,'practiceMode':'oral'})
 view(p,'drill');act(p,'new-drill');reply(p,stress='8')
 assert state(p)['levels']['FR']==1,'stress reduction failed'
 act(p,'retry')
 assert '30 SECONDES' in p.locator('#drill-content').inner_text(),p.locator('#drill-content').inner_text()[:400]
 assert 'NIVEAU 1 / 5' in p.locator('#drill-content').inner_text();print('PASS R1: softened retry 30s at level1')
 p.close()
 # R2 coach merges, not duplicates
 p,err=fresh(browser);view(p,'drill');act(p,'new-drill');reply(p)
 s=state(p);r=s['records'][0];report={'schema':'cognitive-response-v1','session_id':'local-app','language':'FR','attempts':[{'attempt_id':r['id'],'challenge_id':r['challengeId'],'deadline_sec':r['deadlineSec'],'relevance_0_4':4,'reasoning_0_4':3,'strategy_0_4':4,'feedback_note':'Bien joué'}]}
 view(p,'history');p.locator('#import-file').set_input_files({'name':'coach.json','mimeType':'application/json','buffer':json.dumps(report).encode()})
 s=state(p);assert len(s['records'])==1,s['records']; assert s['records'][0]['relevance'] is None;assert s['records'][0]['coachScores']['relevance']==4
 p.locator('#import-file').set_input_files({'name':'coach.json','mimeType':'application/json','buffer':json.dumps(report).encode()});assert len(state(p)['records'])==1
 print('PASS R2: coach report merges with unscored local attempt, reimport idempotent')
 # R3 unlinked report inbox
 report['attempts'][0]['attempt_id']='unmatched-id';p.locator('#import-file').set_input_files({'name':'missing.json','mimeType':'application/json','buffer':json.dumps(report).encode()})
 assert len(state(p)['records'])==1;assert len(state(p)['coachInbox'])==1
 print('PASS R3: unmatched report kept aside, no false record')
 # R4 edit and delete individual
 act(p,'edit-record');p.locator('#edit-stress').select_option('7');p.locator('#commit-edit').click();assert state(p)['records'][0]['stress']==7
 act(p,'remove-record');p.locator('#confirm-dialog').click();assert len(state(p)['records'])==0
 print('PASS R4: edit/delete individual records')
 p.close()
 # R5 old calendar date no auto advance
 p,err=fresh(browser,{'version':2,'lang':'FR','levels':{'FR':1,'EN':1},'records':[],'session':None,'programStart':'2020-01-01T00:00:00Z','practiceMode':'oral'})
 assert p.locator('#program-day').inner_text()=='01',p.locator('#program-day').inner_text();print('PASS R5: program day is completion-based')
 p.close()
 # R6 negotiation not automatically promoting the level
 p,err=fresh(browser);view(p,'negotiation');act(p,'start-neg')
 for i in range(3):
  reply(p)
  if i<2:act(p,'next-challenge')
 assert state(p)['levels']['FR']==1;print('PASS R6: scripted negotiation does not promote objection level')
 p.close()
 # R7 completion requires activities and time
 seed={'version':2,'lang':'FR','levels':{'FR':1,'EN':1},'records':[],'practiceMode':'oral','session':{'id':'SESSION-TEST','elapsedMs':1200000,'completed':False,'runningSince':None,'date':'2026-11-04T00:00:00Z'}}
 p,err=fresh(browser,seed)
 act(p,'finish-session');assert state(p)['completedSessions']==[]
 now='2026-11-04T10:00:00Z'
 def rec(t,condition):return {'id':t,'timestamp':now,'lang':'FR','sessionId':'SESSION-TEST','source':'local','mode':'negotiation' if t=='n' else 'timed_objection','condition':condition,'challengeId':t,'deadlineSec':20,'responseTimeSec':15,'blocked':False,'stress':3}
 s=state(p);s['records']=[rec('w','warmup'),rec('t','timed'),rec('n','timed')]
 p.close()
 p,err=fresh(browser,s);act(p,'finish-session');st=state(p)
 assert len(st['completedSessions'])==1,st['completedSessions'];assert p.locator('#program-day').inner_text()=='02';print('PASS R7: session validates requirements and advances program')
 p.close()
 # R8 assessment pairs, scores compared only within mode
 p,err=fresh(browser)
 view(p,'drill');act(p,'assessment');reply(p);act(p,'next-challenge');reply(p)
 st=state(p);rows=st['records'];assert len(rows)==2;assert len(set(r['assessmentPair'] for r in rows))==1
 assert all(r['relevance'] is None for r in rows)
 view(p,'progress');assert '0 PAIRE(S)' in p.locator('#progress-content').inner_text()
 view(p,'history')
 report={'schema':'cognitive-response-v1','session_id':'response-lab-local','language':'FR','attempts':[{'attempt_id':r['id'],'challenge_id':r['challengeId'],'relevance_0_4':3,'reasoning_0_4':3,'strategy_0_4':3,'feedback_note':'Analyse.'} for r in rows]}
 p.locator('#coach-json-history').fill(json.dumps(report));act(p,'paste-coach')
 view(p,'progress');assert '1 PAIRE(S)' in p.locator('#progress-content').inner_text();print('PASS R8: pairs require two coach evaluations')
 p.close()
 # R9 interrupted challenge restored without deadline claim
 p,err=fresh(browser);view(p,'drill');act(p,'new-drill');act(p,'begin-challenge')
 saved=state(p);p.close();p,err=fresh(browser,saved);view(p,'drill')
 assert 'Exercice interrompu retrouvé' in p.locator('#drill-content').inner_text(),p.locator('#drill-content').inner_text()[:350]
 print('PASS R9: interrupted challenge restarted safely')
 p.close()
 # R10 mobile no overflow
 p,err=fresh(browser,viewport={'width':390,'height':844});ex=p.evaluate('document.documentElement.scrollWidth-innerWidth');assert ex <=1,ex
 view(p,'progress');ex=p.evaluate('document.documentElement.scrollWidth-innerWidth');assert ex<=1,ex
 print('PASS R10: no mobile overflow');p.close()
 browser.close()
print('ALL REGRESSIONS PASSED')