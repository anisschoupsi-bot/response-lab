"""Real browser regression checks: microphone permission, recording, persistence, mobile and offline."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
URL=f'http://127.0.0.1:{server.server_port}/'
errors=[]

def launch(page):
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(URL,wait_until='networkidle')
    assert page.locator('.stat .big').first.inner_text()=='100'
    page.locator('[data-action="start"]').click()
    page.locator('[data-action="begin"]').click()

def to_oral1(page):
    for _ in range(2):
        page.locator('[data-choice="0"]').click()
        page.locator('[data-action="advance"]').click()
    assert page.locator('[data-action="start-oral"]').count()==1

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream'])
    ctx=browser.new_context(viewport={'width':1365,'height':900},permissions=['microphone'],accept_downloads=True)
    page=ctx.new_page()
    launch(page)
    to_oral1(page)
    # The timer doesn't start until media permission and recorder start event.
    assert page.evaluate('session.oralStarted===null')
    page.locator('[data-action="start-oral"]').click()
    page.wait_for_function('session && session.oralStarted !== null')
    assert page.locator('[data-action="enable-mic"]').count()==0
    assert page.evaluate('voice?.recorder?.state')=='recording'
    page.wait_for_timeout(1000)
    page.locator('[data-action="finish-oral"]').click()
    page.wait_for_function('session && !!session.oral.oral1 && !oralBusy')
    assert page.evaluate('session.audioBlobs.oral1?.size > 0')
    assert page.locator('#audio-inline audio').count()==1
    page.locator('#transcript-edit').fill('Je vérifie la contrainte, puis je propose une étape réalisable.')
    page.locator('[data-action="advance"]').click()
    page.locator('[data-choice="0"]').click()
    page.locator('[data-action="advance"]').click()
    assert page.locator('[data-action="start-oral"]').count()==1
    page.locator('[data-action="start-oral"]').click()
    page.wait_for_function('session && session.oralStarted !== null')
    page.wait_for_timeout(650)
    page.locator('[data-action="finish-oral"]').click()
    page.wait_for_function('session && !!session.oral.oral2 && !oralBusy')
    assert page.evaluate('session.audioBlobs.oral2?.size > 0')
    page.locator('#transcript-edit').fill('Je réévalue le plan et je précise l’action.')
    page.locator('[data-action="advance"]').click()
    assert page.locator('#audio-review audio').count()==2
    page.screenshot(path='/mnt/data/Response_Lab_3_1_Review_Desktop.png',full_page=True)
    page.locator('[data-action="save-review"]').click()
    page.wait_for_function('session===null && state.attempts.length===1')
    assert page.locator('h1').inner_text()=='Progrès'
    assert page.evaluate('state.attempts[0].audioPhases.length')==2
    assert page.evaluate("state.attempts[0].transcripts.oral1.includes('contrainte')")
    # True IndexedDB persistence, after reload.
    page.reload(wait_until='networkidle')
    assert page.evaluate('state.attempts.length')==1
    assert page.locator('[data-action="play-history"]').count()==2
    page.locator('[data-action="play-history"]').first.click()
    page.wait_for_selector('.historic-audio audio')
    size=page.evaluate("(async()=>{const id=state.attempts[0].id;const clip=await readAudioClip(id+'|oral1');return clip?.size||0})()")
    assert size>0,size
    print('PASS: one-click microphone + recorder + timer, 2 audio clips, transcript notes, IndexedDB playback after reload',size)
    # Screenshot home/mobile
    page.locator('[data-tab="home"]').click()
    page.screenshot(path='/mnt/data/Response_Lab_3_1_Desktop.png',full_page=True)
    mobilectx=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    mobile=mobilectx.new_page();mobile.on('pageerror',lambda e:errors.append(str(e)))
    mobile.goto(URL,wait_until='networkidle')
    mobile.screenshot(path='/mnt/data/Response_Lab_3_1_Mobile.png',full_page=True)
    assert not mobile.evaluate('document.documentElement.scrollWidth > innerWidth'), 'mobile overflow'
    # Refused permission leaves timer off; explicit fallback allowed.
    deny=browser.new_context(viewport={'width':390,'height':844},permissions=[])
    page2=deny.new_page();page2.on('pageerror',lambda e:errors.append(str(e)))
    deny.grant_permissions([],origin=URL[:-1])
    launch(page2);to_oral1(page2)
    page2.evaluate("navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('Denied','NotAllowedError')}")
    page2.locator('[data-action="start-oral"]').click()
    page2.wait_for_function("session.oralPreparing === false && session.oralError !== ''")
    assert page2.evaluate('session.oralStarted===null')
    assert page2.locator('[data-action="manual-oral"]').is_visible()
    page2.locator('[data-action="manual-oral"]').click()
    assert page2.evaluate('session.oralStarted !== null')
    print('PASS: microphone denied -> no timer until explicit manual start, mobile no overflow')
    assert not errors,errors
    browser.close()
server.shutdown()
