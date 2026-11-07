"""Supplemental real Chromium DOM QA, with a mock SpeechRecognition service, not a physical microphone."""
import json
from playwright.sync_api import sync_playwright
from test_browser_ui import boot, PACK

def test():
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  ctx=browser.new_context(viewport={'width':390,'height':844},accept_downloads=True,is_mobile=True,has_touch=True)
  page=ctx.new_page();errors=[];stage=['boot'];page.on('pageerror',lambda error:errors.append({'at':stage[0],'message':str(error),'name':getattr(error,'name',''),'stack':getattr(error,'stack',None)}))
  boot(page)
  # Main path: upload a French pack, go to oral and verify English choices in the real DOM.
  stage[0]='import';page.locator('#session-upload').set_input_files({'name':'seance.json','mimeType':'application/json','buffer':PACK})
  page.wait_for_function('window.ResponseLabDaily.getState().activeId!==null')
  assert page.locator('#app').is_visible()
  page.locator('[data-action="home"]').first.click()
  assert page.locator('[data-action="delete-session"]').count()==1,'per-session delete action'
  assert page.locator('[data-action="delete-all"]').count()==1,'delete-all action'
  assert page.locator('[data-action="reset-app"]').count()==1,'reset-app action'
  # Double-click and immediate cancellation must not alter anything.
  page.evaluate('window.__confirmQueue=[false]')
  page.locator('[data-action="delete-session"]').first.click()
  assert len(page.evaluate('Object.keys(ResponseLabDaily.getState().sessions)'))==1,'cancelled deletion intact'
  # After confirmation, download a safety backup and remove only this session.
  stage[0]='delete';page.evaluate('window.__confirmQueue=[true,true]')
  with page.expect_download() as event:page.locator('[data-action="delete-session"]').first.click()
  assert event.value.suggested_filename.endswith('.json'),'safety backup downloaded'
  assert len(page.evaluate('Object.keys(ResponseLabDaily.getState().sessions)'))==0,'session removed'
  stage[0]='reimport';# Restore a French pack then verify English language selection on the oral screen.
  page.locator('#session-upload').set_input_files({'name':'seance.json','mimeType':'application/json','buffer':PACK})
  page.wait_for_function('window.ResponseLabDaily.getState().activeId!==null')
  for _ in range(6):
   page.locator('[data-action="quiz-start"]').click()
   page.locator('[data-action="quiz-choose"]').first.click()
   page.locator('[data-action="next"]').click()
  for _ in range(2):
   page.locator('[data-action="case-start"]').click()
   page.locator('#case-answer').fill('Je commence par clarifier le fait le plus important.')
   page.locator('[data-action="case-finish"]').click()
   page.locator('[data-action="next"]').click()
  opts=page.locator('#speech-locale option').all_text_contents()
  assert any('English (US)' in x for x in opts) and any('English (UK)' in x for x in opts),'EN options in French session'
  page.locator('#speech-locale').select_option('en-GB')
  page.locator('[data-action="speech-start"]').click()
  assert page.evaluate('window.__recordings.at(-1).lang')=='en-GB','lang set on recognizer'
  assert page.locator('.timer-dock').count()==1,'timer on after speech start'
  stage[0]='reset';# Full reset: check storage failure under about:blank is handled instead of JS crashing.
  page.locator('[data-action="home"]').first.click()
  page.evaluate('window.__confirmQueue=[true,true]')
  with page.expect_download():page.locator('[data-action="reset-app"]').click()
  page.wait_for_function('Object.keys(ResponseLabDaily.getState().sessions).length===0')
  assert page.locator('h1').count()>0
  print('Browser errors:',errors);assert not errors,'browser JS errors: '+str(errors)
  geom=page.evaluate('({viewport:innerWidth,content:document.documentElement.scrollWidth})')
  assert geom['content']<=geom['viewport']+3,'mobile horizontal overflow: '+str(geom)
  print('PASS browser QA: delete cancel/confirm/download, EN recognition in FR pack, reset, mobile layout, no JS errors')
  ctx.close();browser.close()
if __name__=='__main__':test()
