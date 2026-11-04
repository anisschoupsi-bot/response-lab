"""Targeted tests for the Response Lab v2.2 AI-first post-attempt flow."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json

root = Path(__file__).resolve().parents[1]
html = (root / 'index.html').read_text().replace('<link rel="stylesheet" href="assets/app.css">', '<style>'+(root / 'assets/app.css').read_text()+'</style>').replace('<script defer src="assets/app.js"></script>', '<script>'+(root / 'assets/app.js').read_text()+'</script>')
key='response-lab-state-v1'

def page(browser, seed=None):
    p=browser.new_page(viewport={'width':390,'height':844})
    p.set_default_timeout(4000)
    errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
    p.goto('about:blank')
    p.evaluate('''(seed) => {const data={}; if(seed)data['response-lab-state-v1']=JSON.stringify(seed); Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>data[k]??null,setItem:(k,v)=>data[k]=v,removeItem:k=>delete data[k]}})}''',seed)
    p.set_content(html)
    assert errors==[],errors
    return p

def state(p):return json.loads(p.evaluate(f"localStorage.getItem('{key}')"))
def action(p,v):p.locator(f'button[data-action="{v}"]:visible').first.click()
def view(p,v):p.locator(f'button[data-view="{v}"]:visible').first.click()
def report(records):return json.dumps({'schema':'cognitive-response-v1','language':'FR','session_id':'response-lab-local','attempts':[{'attempt_id':r['id'],'challenge_id':r['challengeId'],'relevance_0_4':3,'reasoning_0_4':4,'strategy_0_4':3,'feedback_note':'Proposer une preuve concrète.'}for r in records]})

with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    # R11: text answer produces no local quality scores, even when stress is rated.
    p=page(browser);view(p,'drill');action(p,'new-drill')
    p.locator('button[data-action="set-mode"][data-mode="text"]').click()
    action(p,'begin-challenge');p.locator('#response-text').fill('Nous pouvons piloter un essai mesurable.');action(p,'submit-challenge')
    assert not p.locator('[data-score]').count()
    assert 'aucune note de qualité' in p.locator('#drill-content').inner_text()
    p.locator('#stress-select').select_option('4');p.locator('#blocked-select').select_option('no')
    action(p,'save-challenge');s=state(p);assert s['records'][0]['relevance'] is None and s['levels']['FR']==1
    assert 'non évaluée' in p.locator('#drill-content').inner_text()
    print('PASS R11: unscored written answer and clear status');p.close()

    # R12: direct JSON paste enriches existing attempt and retains source timestamps.
    p=page(browser,seed=s);view(p,'history');assert p.locator('#coach-json-history').count()==1
    p.locator('#coach-json-history').fill('```json\n'+report(s['records'])+'\n```')
    action(p,'paste-coach');after=state(p);assert len(after['records'])==1
    assert after['records'][0]['coachScores']=={'relevance':3,'reasoning':4,'strategy':3}
    assert after['records'][0]['relevance'] is None
    assert not p.locator('#coach-json-history').input_value()
    print('PASS R12: direct paste, no duplicate, existing notes unchanged');p.close()

    # R13: no promotion for legacy self-scores; only 3 independently coded coach-quality ratings can promote.
    recs=[]
    for i in range(3):
        recs.append({'id':f'TEST-COACH-{i}','timestamp':'2026-11-04T10:00:00Z','source':'local','lang':'FR','mode':'timed_objection','responseMode':'text','condition':'timed','challengeId':f'EX-{i}','level':1,'deadlineSec':30,'firstInputSec':2,'responseTimeSec':10,'stress':4,'blocked':False,'response':'Je réponds avec une justification concise.', 'relevance':4,'reasoning':4,'strategy':4,'coachScores':None,'coachFeedback':''})
    seed={'version':3,'lang':'FR','levels':{'FR':1,'EN':1},'records':recs,'completedSessions':[],'practiceMode':'text'}
    p=page(browser,seed);view(p,'history')
    assert state(p)['levels']['FR']==1
    p.locator('#coach-json-history').fill(report(recs[:2]));action(p,'paste-coach');assert state(p)['levels']['FR']==1
    p.locator('#coach-json-history').fill(report(recs[2:]));action(p,'paste-coach');assert state(p)['levels']['FR']==2
    assert len(state(p)['records'])==3
    print('PASS R13: exactly three independent scored objections promote after import');p.close()

    # R14: no promotion if stress not known, even with full coach scores.
    missing=[dict(r,stress=None,coachScores=None) for r in recs]
    p=page(browser,dict(seed,records=missing));view(p,'history')
    p.locator('#coach-json-history').fill(report(missing));action(p,'paste-coach');assert state(p)['levels']['FR']==1
    print('PASS R14: unknown stress prevents an unsupported promotion');p.close()

    # R15: oral exercise without transcription cannot receive invented text-quality notes.
    missing=[dict(recs[0],response='',relevance=None,reasoning=None,strategy=None,coachScores=None)]
    p=page(browser,dict(seed,records=missing));view(p,'history')
    p.locator('#coach-json-history').fill(report(missing));action(p,'paste-coach')
    assert state(p)['records'][0]['coachScores'] is None
    print('PASS R15: no content score without a transcript');p.close()

    # R16: mismatched challenge_id is kept for manual association, never silently attached.
    p=page(browser,dict(seed,records=recs[:1]));view(p,'history')
    payload=json.loads(report(recs[:1]));payload['attempts'][0]['challenge_id']='OTHER-CHALLENGE'
    p.locator('#coach-json-history').fill(json.dumps(payload));action(p,'paste-coach')
    assert state(p)['records'][0]['coachScores'] is None
    assert len(state(p)['coachInbox'])==1
    print('PASS R16: mismatched challenge is quarantined');p.close()
    browser.close()
print('ALL AI-FIRST TESTS PASSED')