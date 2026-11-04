"""Browser-level tests for speech-first Response Lab 2.3 (mock SpeechRecognition, not a live microphone test)."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text().replace('<link rel="stylesheet" href="assets/app.css">','<style>'+(ROOT/'assets/app.css').read_text()+'</style>').replace('<script defer src="assets/app.js"></script>','<script>'+(ROOT/'assets/app.js').read_text()+'</script>')
KEY='response-lab-state-v1'

mock='''() => {
window.__micInstances=[]; window.__speechMode='normal';
class MockRecognition {
 constructor(){this.lang='';this.started=false;this.stopped=false;window.__micInstances.push(this)}
 start(){this.started=true;if(window.__speechMode==='denied'){setTimeout(()=>{this.onerror?.({error:'not-allowed'});this.onend?.()},0);return}
    if(window.__speechMode!=='hold')setTimeout(()=>this.onstart?.(),0)}
 stop(){this.stopped=true;setTimeout(()=>this.onend?.(),0)}
 abort(){this.stopped=true;setTimeout(()=>this.onend?.(),0)}
 emitSpeech(){this.onspeechstart?.()}
 emitResult(txt,final=true){this.onresult?.({results:[{isFinal:final,0:{transcript:txt}}]})}
 end(){this.onend?.()}
}
window.SpeechRecognition=MockRecognition;window.webkitSpeechRecognition=MockRecognition;
}'''

def page(browser,speech='normal',mobile=False):
 p=browser.new_page(viewport={'width':390,'height':844} if mobile else {'width':1180,'height':900})
 errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.goto('about:blank')
 p.evaluate('''() => {const data={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>data[k]??null,setItem:(k,v)=>data[k]=v,removeItem:k=>delete data[k]}})}''')
 if speech!='unsupported':p.evaluate(mock);p.evaluate('(mode) => window.__speechMode=mode',speech)
 else:p.evaluate('''() => {window.SpeechRecognition=undefined;window.webkitSpeechRecognition=undefined}''')
 p.set_content(HTML);p.set_default_timeout(6000)
 assert not errors,errors
 return p,errors

def state(p):return json.loads(p.evaluate(f'localStorage.getItem("{KEY}")'))
def act(p,n):p.locator(f'button[data-action="{n}"]:visible').first.click()
def view(p,n):p.locator(f'button[data-view="{n}"]:visible').first.click()
def mic(p):return p.evaluate('window.__micInstances.length-1')
def emit(p,method,*args):p.evaluate('''({method,args}) => {const m=window.__micInstances.at(-1);m[method](...args)}''',{'method':method,'args':list(args)})

with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 # R17: Consent/activation doesn't consume countdown, before mic is actually ready.
 p,errors=page(browser,'hold');view(p,'drill');act(p,'new-drill')
 assert p.locator('[data-mode="speech"].chosen').count()==1
 assert 'service' in p.locator('.privacy-note').inner_text().lower() or 'fournisseur' in p.locator('.privacy-note').inner_text().lower()
 act(p,'begin-challenge');assert state(p)['pending']['ongoing']['stage']=='arming'
 assert not p.locator('.challenge-quote').count()
 emit(p,'onstart') if False else p.evaluate('window.__micInstances.at(-1).onstart()')
 assert state(p)['pending']['ongoing']['stage']=='active'
 assert p.locator('.challenge-quote').count()==1
 assert p.locator('#voice-final').count()==1
 print('PASS R17: microphone starts timer only once ready')

 # R18: partial and final transcript, detected speech onset, no manual click required.
 emit(p,'emitSpeech');emit(p,'emitResult','Je propose un test',False)
 assert 'Je propose un test' in p.locator('#voice-final').inner_text()
 emit(p,'emitResult','Je propose un test limité',True)
 assert state(p)['pending']['ongoing']['firstInputMethod']=='speech-event'
 act(p,'submit-challenge');p.wait_for_selector('#review-transcript')
 assert 'Je propose un test limité' in p.locator('#review-transcript').input_value()
 assert 'Je propose un test Je propose' not in p.locator('#review-transcript').input_value()
 assert state(p)['pending']['ongoing']['speechUsed'] is True
 print('PASS R18: transcript and acoustic marker captured without manual button')

 # R19: user correction is persisted; no quality scores fabricated.
 p.locator('#review-transcript').fill('Je propose un test mesurable limité.')
 p.locator('#stress-select').select_option('3');p.locator('#blocked-select').select_option('no')
 act(p,'save-and-copy');record=state(p)['records'][0]
 assert record['response']=='Je propose un test mesurable limité.'
 assert record['transcriptSource']=='browser-speech' and record['transcriptEdited'] is True
 assert record['firstInputMethod']=='speech-event' and record['coachScores'] is None
 assert record['relevance'] is None
 print('PASS R19: review correction + AI-first metadata + local persistence')
 p.close()

 # R20: rejected permission => no phantom timing, switch to manual and keep exercising.
 p,errors=page(browser,'denied');view(p,'drill');act(p,'new-drill');act(p,'begin-challenge')
 p.wait_for_function('''() => document.querySelector('[data-mode="manual"].chosen') !== null''')
 assert state(p)['pending']['ongoing']['stage']=='ready'
 assert state(p)['pending']['ongoing']['start'] is None
 assert 'refusée' in p.locator('#drill-content').inner_text().lower()
 act(p,'begin-challenge');act(p,'mark-onset');act(p,'submit-challenge')
 p.locator('#review-transcript').fill('Je propose une option mesurable.');act(p,'save-challenge')
 assert state(p)['records'][0]['firstInputMethod']=='manual-button'
 print('PASS R20: permission denied falls back without fake mic timestamps')
 p.close()

 # R21: early recognition end permits restart; append without erasing the earlier transcript.
 p,errors=page(browser);view(p,'drill');act(p,'new-drill');act(p,'begin-challenge');p.wait_for_selector('#voice-final')
 emit(p,'emitResult','Première idée',True);emit(p,'end')
 p.wait_for_selector('button[data-action="restart-recognition"]')
 act(p,'restart-recognition');p.wait_for_selector('#voice-status')
 emit(p,'emitResult','je propose une étape de contrôle',True)
 act(p,'submit-challenge');p.wait_for_selector('#review-transcript')
 assert 'Première idée je propose une étape de contrôle' in p.locator('#review-transcript').input_value()
 print('PASS R21: interruption/reconnect keeps previous recognized words')
 p.close()

 # R22: navigating away stops mic; incomplete transcript becomes a non-comparable draft instead of vanishing.
 p,errors=page(browser);view(p,'drill');act(p,'new-drill');act(p,'begin-challenge');p.wait_for_selector('#voice-final')
 emit(p,'emitResult','Ma réponse partielle',True);view(p,'history')
 assert p.evaluate('window.__micInstances.at(-1).stopped') is True
 assert state(p)['pending']['ongoing']['condition']=='interrupted'
 assert 'Ma réponse partielle' in state(p)['pending']['ongoing']['response']
 view(p,'drill');assert p.locator('#review-transcript').count()==1
 act(p,'save-challenge');assert state(p)['records'][0]['condition']=='interrupted'
 print('PASS R22: leaving exercise stops microphone and preserves interrupted draft')
 p.close()

 # R23: unsupported browser gets an explicit manual oral mode and no microphone activation.
 p,errors=page(browser,'unsupported');view(p,'drill');act(p,'new-drill')
 assert p.locator('[data-mode="manual"].chosen').count()==1
 assert p.locator('[data-mode="speech"]').is_disabled()
 act(p,'begin-challenge');assert p.locator('[data-action="mark-onset"]').count()==1
 print('PASS R23: unsupported-browser fallback remains functional')
 p.close()

 # R24: speech is the default in a new guided session and mobile stays within viewport.
 p,errors=page(browser,mobile=True);act(p,'start-session')
 assert state(p)['session'] and state(p)['pending']['ongoing']['condition']=='warmup'
 assert p.locator('[data-mode="speech"].chosen').count()==1
 assert p.evaluate('document.documentElement.scrollWidth-innerWidth')<=1
 act(p,'begin-challenge');p.wait_for_selector('.voice-panel')
 assert p.evaluate('document.documentElement.scrollWidth-innerWidth')<=1
 print('PASS R24: guided oral-first session and mobile layout')
 p.close();browser.close()
print('ALL SPEECH-FIRST BROWSER TESTS PASSED')
