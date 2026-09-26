"""DOM and interaction regression for the source reader; not a C++ SLAM test.

Install: python -m pip install playwright && python -m playwright install chromium
Optional: set CHROMIUM_EXECUTABLE to an installed Chromium binary.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, os, shutil, tempfile
R=Path(__file__).resolve().parents[1]
S=Path(tempfile.mkdtemp(prefix='orb-reader-tests-'))
css=(R/'assets/styles.css').read_text(encoding="utf-8")+'\n'+(R/'assets/source.css').read_text(encoding="utf-8")+'\n'+(R/'assets/book.css').read_text(encoding="utf-8")
js=(R/'assets/book-data.js').read_text(encoding="utf-8")+'\n'+(R/'assets/book-examples.js').read_text(encoding="utf-8");app=(R/'assets/book.js').read_text(encoding="utf-8")
book=None
results=[];errors=[]
with sync_playwright() as p:
 browser_path=os.environ.get('CHROMIUM_EXECUTABLE') or shutil.which('chromium') or shutil.which('chromium-browser')
 launch={'headless':True}
 if browser_path: launch['executable_path']=browser_path
 b=p.chromium.launch(**launch)
 page=b.new_page(viewport={'width':1440,'height':1000},device_scale_factor=1)
 page.on('pageerror',lambda e:errors.append(str(e)))
 def render(path,width=1440):
  page.set_viewport_size({'width':width,'height':1000})
  page.set_content('<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>'+css+'</style></head><body></body></html>')
  page.evaluate('(p)=>{window.BOOK_PAGE=p;window.ORB_READER_READY=false}',path)
  page.add_script_tag(content=js);page.add_script_tag(content=app)
  page.wait_for_function('window.ORB_READER_READY===true');page.wait_for_timeout(80)
 render('index.html')
 book=page.evaluate('({aliases:window.ORB_BOOK.aliases})')
 for path in book['aliases']:
  render(path)
  metrics=page.evaluate('({w:innerWidth,doc:document.documentElement.scrollWidth,h1:document.querySelectorAll("h1").length,sections:document.querySelectorAll(".book-section").length})')
  assert metrics['doc']<=metrics['w'],(path,metrics)
  assert metrics['h1']==1
  results.append({'route':path,**metrics})
  if path in ['index.html','imu.html','foundations.html','tracking.html','overview.html']:
   page.screenshot(path=str(S/('after-'+path.replace('.html','')+'.png')),full_page=False)
 for path in ['index.html','imu.html','foundations.html','tracking.html']:
  render(path,390)
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),path
  page.screenshot(path=str(S/('mobile-'+path.replace('.html','')+'.png')))
  page.locator('[data-menu]').click();page.wait_for_function("document.querySelector('.sidebar').getBoundingClientRect().x>=-1")
  page.keyboard.press('Escape');assert page.locator('[data-menu]').get_attribute('aria-expanded')=='false'
 # Geometry numerical behavior
 render('foundations.html')
 assert '80.0' in page.locator('[data-gout=d]').inner_text()
 page.locator('[name=scale]').fill('2');page.locator('[name=scale]').dispatch_event('input')
 assert '80.0' in page.locator('[data-gout=d]').inner_text()
 assert '8.0' in page.locator('[data-gout=z]').inner_text()
 page.locator('[name=baseline]').fill('0');page.locator('[name=baseline]').dispatch_event('input')
 assert '0.0' in page.locator('[data-gout=d]').inner_text()
 # glossary and type controls
 page.locator('[data-term=Pose]').click();assert page.locator('.glossary-pop').is_visible();page.keyboard.press('Escape');assert page.locator('.glossary-pop').is_hidden()
 page.locator('[data-font]').click();assert page.locator('html').evaluate('e=>e.style.getPropertyValue("--read-size")')=='19px'
 # Branch matrix
 render('tracking.html');q=lambda s:page.locator('.tracking-lab '+s)
 assert 'true' in q('.lab-output').inner_text();q('[name=recent]').check();assert 'false' in q('.lab-output').inner_text()
 q('[name=recent]').uncheck();q('[name=updated]').check();assert 'LastKeyFrame' in q('.lab-output').inner_text()
 q('[name=reset]').check();assert 'PoseOptimization' in q('.lab-output').inner_text()
 q('[name=reset]').uncheck();q('[name=inliers]').fill('11');q('[name=state]').select_option('RECENTLY_LOST');assert 'true' in q('.lab-output').inner_text()
 q('[name=inliers]').fill('10');assert 'false' in q('.lab-output').inner_text()
 # Bias and completion
 render('imu.html');assert page.locator('[data-bout=p]').inner_text()=='1.000 m'
 page.locator('[data-finish]').click();assert page.locator('[data-finish]').get_attribute('aria-pressed')=='true'
 # Search; focus
 page.locator('.book-search').fill('不存在的词123');assert page.locator('.no-results').is_visible()
 page.locator('.book-search').fill('尺度');assert page.locator('.no-results').is_hidden()
 page.locator('[data-focus]').click();assert page.locator('body').evaluate('x=>x.classList.contains("focus")')
 b.close()
assert not errors,errors
report={'mode':'Chromium DOM rendering with inlined repository resources; no hosted navigation or C++ execution','routes_checked':len(results),'desktop_width':1440,'mobile_width':390,'page_errors':errors,'routes':results,'checks':['single H1','no horizontal overflow (27 desktop + 4 mobile)','mobile drawer + Escape','source chapter search','glossary keyboard dismiss','text size control','tracking branch cases','geometry scale invariance + zero baseline','bias arithmetic','completion UI','focus mode']}
(S/'READER_TESTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'routes':len(results),'errors':errors,'screenshots':len(list(S.glob('after*'))),'output_dir':str(S)},ensure_ascii=False))
