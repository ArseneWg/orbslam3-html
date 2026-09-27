"""Actual HTTP regression for visual-first lessons and expanded source reference.
Tests UI, deterministic arithmetic and anchor bounds, not C++ SLAM accuracy.
"""
from pathlib import Path
import functools, http.server, threading, json, os, sys, shutil, subprocess, traceback
from urllib.parse import urlparse, unquote
from urllib.request import Request, urlopen
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts'/'curriculum';OUT.mkdir(parents=True,exist_ok=True)
BASE='4452a3c4ab75b1cde34e5505a36ec3f9edcdc4c4'
report={'mode':'actual loopback HTTP with app.js','routes':[],'stories':[],'errors':[],'references':[],'status':'running'}
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass

def main():
 for file in (ROOT/'assets').rglob('*.js'):subprocess.run(['node','--check',str(file)],check=True,capture_output=True)
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
 threading.Thread(target=server.serve_forever,daemon=True).start();origin=f'http://127.0.0.1:{server.server_port}'
 refs=[]
 try:
  with sync_playwright() as pw:
   opts={'headless':True};exe=os.getenv('CHROMIUM_EXECUTABLE') or shutil.which('chromium')
   if exe:opts['executable_path']=exe
   browser=pw.chromium.launch(**opts);page=browser.new_page(viewport={'width':1440,'height':1000})
   page.on('pageerror',lambda e:report['errors'].append(str(e)))
   page.on('response',lambda r:report['errors'].append(f'HTTP {r.status}: {r.url}') if r.status>=400 and r.url.startswith(origin) else None)
   def visit(path,width=1440,reference=False):
    page.set_viewport_size({'width':width,'height':1000})
    page.goto(origin+'/'+path+('?reference=1' if reference else ''),wait_until='networkidle')
    page.wait_for_function('window.ORB_READER_READY===true && !!window.ORB_STORY')
    assert page.locator('h1').count()==1,path
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1'),(path,width,'page overflow')
   visit('index.html');book=page.evaluate('({chapters:ORB_BOOK.chapters,aliases:ORB_BOOK.aliases})')
   assert len(book['chapters'])==14
   report['section_count']=sum(len(c['sections']) for c in book['chapters'])
   for c in book['chapters']:
    assert c['revision']=='principles-2026-09-27'
    assert len(c['sections'])>=7
    for s in c['sections']:refs.extend(s.get('refs',[]))
   for path in book['aliases']:
    visit(path,reference=True);assert page.locator('.book-section').count()>=7
    report['routes'].append(path)
    links=page.locator('a[href]').evaluate_all('(xs)=>xs.map(a=>new URL(a.getAttribute("href"),document.baseURI).href)')
    for href in links:
     if href.startswith(origin+'/'):assert (ROOT/(unquote(urlparse(href).path).lstrip('/') or 'index.html')).exists(),href
   for c in book['chapters']:
    path=c['path'];visit(path)
    if page.locator('.st-lesson').count():
     assert not page.locator('.st-reference').get_attribute('open')
     story=page.evaluate('(id)=>ORB_STORY.chapters[id]',c['id'])
     for l in story['lessons']:
      assert len(l['steps'])>=3 and l['terms'] and l['refs']
      refs.extend({'file':f,'start':a,'end':b} for f,a,b in l['refs'])
     for lesson in page.locator('.st-lesson').all():
      assert lesson.locator('svg').count()>0
      for step in lesson.locator('[data-step]').all():
       step.click();assert step.get_attribute('aria-pressed')=='true'
      for slider in lesson.locator('input[type=range]').all():
       slider.evaluate('e=>{e.value=e.max;e.dispatchEvent(new Event("input",{bubbles:true}))}')
       assert 'NaN' not in lesson.locator('.st-readout').inner_text()
      for select in lesson.locator('select').all():
       for option in select.locator('option').all():select.select_option(option.get_attribute('value'))
      lesson.locator('[data-reset]').click()
      if lesson.locator('[data-action]').count():lesson.locator('[data-action]').click()
      lesson.locator('[data-enlarge]').click();assert page.locator('dialog[open]').count()==1
      page.keyboard.press('Escape');assert page.locator('dialog[open]').count()==0
      for detail in lesson.locator('details').all():
       detail.locator('summary').click();assert detail.get_attribute('open') is not None
     report['stories'].append({'id':c['id'],'lessons':len(story['lessons'])})
     page.locator('.st-lesson').first.screenshot(path=str(OUT/(c['id']+'-story-desktop.png')))
    visit(path,390)
    page.screenshot(path=str(OUT/(c['id']+'-mobile.png')))
    page.locator('[data-menu]').click();page.wait_for_function('document.querySelector(".sidebar").getBoundingClientRect().x>=-1')
    page.keyboard.press('Escape');assert page.locator('[data-menu]').get_attribute('aria-expanded')=='false'
   visit('foundations.html');page.locator('[data-font]').click();size=page.locator('html').evaluate('e=>getComputedStyle(e).getPropertyValue("--read-size")')
   if page.locator('[data-finish]').get_attribute('aria-pressed')=='true':page.locator('[data-finish]').click()
   page.locator('[data-finish]').click();visit('imu.html');visit('foundations.html')
   assert page.locator('[data-finish]').get_attribute('aria-pressed')=='true'
   assert page.locator('html').evaluate('e=>getComputedStyle(e).getPropertyValue("--read-size")')==size
   report['storage']='passed'
   arithmetic=page.evaluate('''()=>{
    const s=ORB_STORY;let x={x:0,yaw:0};const cost=v=>s.poseResidual(v.x,v.yaw).reduce((a,b)=>a+b*b,0);const before=cost(x);
    for(let i=0;i<8;i++)x=s.fitPose(x);
    return {before,after:cost(x),pose:x,ray:s.project([1,0,4],{x:0})[0],zero:s.renderers.depth({b:0,z:4},0,{}).metrics,integrate:s.renderers.integrate({a:1,bias:0,steps:2},0,{}).metrics,cull:s.renderers.cull({age:3,obs:3,ratio:.7},0,{}).metrics,medoid:s.renderers.medoid({},0,{}).metrics};
   }''')
   assert arithmetic['ray']==400 and arithmetic['after']<1e-4 and arithmetic['before']>1
   assert arithmetic['zero']['d']==0 and abs(arithmetic['integrate']['p']-.02)<1e-10
   assert arithmetic['cull']=={'bad':False,'recent':False}
   assert arithmetic['medoid']['medians']==[2,1,2,2,6]
   report['arithmetic']=arithmetic
   browser.close()
  if '--verify-sources' in sys.argv:
   files={}
   for r in refs:files.setdefault(r['file'],set()).add((r['start'],r['end']))
   for name,ranges in sorted(files.items()):
    req=Request(f'https://raw.githubusercontent.com/UZ-SLAMLab/ORB_SLAM3/{BASE}/{name}',headers={'User-Agent':'orb-source-story-check'})
    with urlopen(req,timeout=45) as response:lines=response.read().decode().splitlines()
    for a,b in ranges:assert 1<=a<=b<=len(lines),(name,a,b,len(lines))
    report['references'].append({'file':name,'ranges':len(ranges),'lines':len(lines)})
  assert not report['errors'],report['errors']
  report['status']='passed'
 finally:server.shutdown();server.server_close()

if __name__=='__main__':
 code=0
 try:main()
 except Exception as e:code=1;report['status']='failed';report['failure']=str(e);traceback.print_exc()
 finally:
  (OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
  print(json.dumps({'status':report['status'],'routes':len(report['routes']),'stories':len(report['stories'])}))
 sys.exit(code)
