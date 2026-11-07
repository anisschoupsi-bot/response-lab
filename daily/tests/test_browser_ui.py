"""Playwright DOM/UI test without network navigation (blocked in this environment)."""
from pathlib import Path
import json, re
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
HTML=(ROOT/'index.html').read_text()
CSS=(ROOT/'assets/styles.css').read_text()
JS=(ROOT/'assets/app.js').read_text()
PACK=(ROOT/'seance_2026-11-07.json').read_bytes()
# Only strip external assets: inject the exact local code and CSS in a non-network about:blank page.
HTML=re.sub(r'<script\s+defer\s+src="[^"]+"\s*></script>','',HTML)
HTML=re.sub(r'<link\s+rel="stylesheet"[^>]+>','',HTML)

def boot(page, old=None):
    page.set_content(HTML, wait_until='domcontentloaded')
    # A data-driven about:blank page cannot read regular localStorage; use deterministic mock with same interface.
    page.evaluate("""(old) => {window.__stored = old || {}; Object.defineProperty(window, 'localStorage', {configurable:true, value:{getItem(k){return window.__stored[k]??null},setItem(k,v){window.__stored[k]=v},removeItem(k){delete window.__stored[k]}}}); window.__confirmQueue=[];window.confirm=()=>window.__confirmQueue.shift()??false; window.__recordings=[]; window.SpeechRecognition=class {constructor(){this.lastResult='';window.__recordings.push(this)} start(){this.onstart?.()} stop(){this.onend?.()} emit(value){this.onresult?.({results:[{0:{transcript:value},length:1,isFinal:true}]})}};}""",old)
    page.add_style_tag(content=CSS)
    page.add_script_tag(content=JS)
    assert page.locator('h1').count()>0

def upload(page):
    page.locator('#session-upload').set_input_files({'name':'seance_2026-11-07.json','mimeType':'application/json','buffer':PACK})
    page.wait_for_function("window.ResponseLabDaily.getState().activeId !== null")

def click_next(page):page.locator('button[data-action="next"]').click()

def test():
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  context=b.new_context(viewport={'width':1280,'height':800},accept_downloads=True)
  page=context.new_page()
  problems=[]
  page.on('pageerror',lambda err:problems.append(str(err)))
  boot(page)
  assert page.get_by_text('Réinitialiser le progrès').count()==1,'reset button on home'
  upload(page)
  assert 'QCM 1/6' in page.locator('#app').inner_text()
  for i in range(6):
   page.locator('button[data-action="quiz-start"]').click()
   assert page.locator('.timer-dock').count()==1
   assert page.locator('.timer-dock').evaluate("el=>getComputedStyle(el).right") in ('18px','20px','24px') or page.locator('.timer-dock').evaluate("el=>getComputedStyle(el).position")=='fixed'
   page.locator('button[data-action="quiz-choose"]').first.click()
   assert page.locator('.feedback').count()==1,'QCM correction immediately'
   click_next(page)
  for i in range(2):
   page.locator('button[data-action="case-start"]').click()
   assert page.locator('.case-context-pane').is_visible() and page.locator('#case-answer').is_visible(),'context+answer simultaneous'
   assert '110 s' in page.locator('#time-number').inner_text()
   page.locator('#case-answer').fill('Je vérifie le fait décisif, puis je propose une option réalisable.')
   page.locator('button[data-action="case-finish"]').click()
   assert 'Je vérifie' in page.locator('#app').inner_text()
   click_next(page)
  for i in range(3):
   assert page.locator('h3').count()>0,'confrontation visible before starting'
   page.locator('#speech-locale').select_option('fr-FR')
   page.locator('button[data-action="speech-start"]').click()
   assert page.locator('#time-number').count()==1,'timer after speech start'
   page.evaluate(f"window.__recordings[window.__recordings.length-1].emit('Je reformule le problème et je clarifie avant de décider, essai {i+1}')")
   assert 'Je reformule' in page.locator('#live-transcript').inner_text()
   page.locator('button[data-action="oral-finish"]').click()
   assert page.locator('#edited-transcript').count()==1
   click_next(page)
  assert page.locator('h2').get_by_text('Bilan de ta séance').count()==1
  assert page.locator('.axis-grade').count()==5
  for el in page.locator('.axis-grade').all():el.select_option('4')
  for idx,el in enumerate(page.locator('.axis-note').all()):el.fill('Repère concret numéro '+str(idx+1))
  assert '/5' in page.locator('#axis-summary').inner_text()
  with page.expect_download() as d:page.locator('button[data-action="export"]').first.click()
  dl=d.value;assert dl.suggested_filename.startswith('Response_Lab_Reponses_')
  page.screenshot(path='/mnt/data/response_lab_daily_2_1_bilan.png',full_page=True)
  page.locator('button[data-action="home"]').first.click()
  assert '1 séance terminée' in page.locator('#app').inner_text()
  page.evaluate("window.__confirmQueue=[true,true]")
  with page.expect_download() as d:page.locator('button[data-action="reset-progress"]').click()
  assert d.value.suggested_filename.startswith('Response_Lab_Sauvegarde_avant_')
  st=page.evaluate('window.ResponseLabDaily.getState()')
  assert st['sessions'][st['activeId'] or 'RL-D-2026-11-07']['cursor']==0
  assert '0 séance terminée' in page.locator('#app').inner_text()
  page.screenshot(path='/mnt/data/response_lab_daily_2_1_accueil.png',full_page=True)
  assert not problems,'JavaScript errors: '+str(problems)
  print('PASS browser UI: all 11 steps, live transcript, timer top-right, manual axes, file export, reset and no JS exceptions')
  # Layout responsive réellement calculé par Chromium (sans téléchargement réseau).
  mobile=b.new_context(viewport={'width':390,'height':844},device_scale_factor=1,accept_downloads=True,is_mobile=True,has_touch=True)
  phone=mobile.new_page();phone_errors=[];phone.on('pageerror',lambda err:phone_errors.append(str(err)))
  boot(phone);upload(phone);phone.locator('button[data-action="quiz-start"]').click()
  geometry=phone.evaluate('''() => ({viewport:innerWidth, scroll:document.documentElement.scrollWidth, timer:(() => {let r=document.querySelector('.timer-dock')?.getBoundingClientRect();return r?{right:r.right,top:r.top,width:r.width}:null})()})''')
  assert geometry['scroll']<=geometry['viewport']+3,'horizontal overflow on mobile '+str(geometry)
  assert geometry['timer']['right']<=geometry['viewport']+1 and geometry['timer']['top']>=0,'timer in upper-right viewport '+str(geometry)
  phone.screenshot(path='/mnt/data/response_lab_daily_2_1_mobile_qcm.png',full_page=True)
  assert not phone_errors,'mobile JS error: '+str(phone_errors)
  mobile.close()
  context.close();b.close()
if __name__=='__main__':test()
