"""Real HTTP reader, source links and deterministic teaching examples, not C++ SLAM.

Run: python tests/test_curriculum.py --verify-sources
Requires: playwright, a Playwright Chromium installation, and node.
"""
from __future__ import annotations
import functools
import http.server
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import threading
import traceback
from urllib.parse import urlparse, unquote
from urllib.request import Request, urlopen
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'artifacts' / 'curriculum'
OUT.mkdir(parents=True, exist_ok=True)
BASELINE = '4452a3c4ab75b1cde34e5505a36ec3f9edcdc4c4'
report = {'baseline': BASELINE, 'mode': 'real loopback HTTP; actual app.js loader',
          'routes': [], 'mobile': [], 'errors': [], 'references': [], 'status': 'running'}

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass

def check(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)

def main() -> None:
    for script in (ROOT / 'assets').rglob('*.js'):
        subprocess.run(['node', '--check', str(script)], check=True, capture_output=True)
    report['javascript_syntax'] = 'passed'
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0),
        functools.partial(QuietHandler, directory=str(ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    origin = f'http://127.0.0.1:{server.server_port}'
    source_links: set[str] = set()
    try:
        with sync_playwright() as pw:
            opts = {'headless': True}
            if os.environ.get('CHROMIUM_EXECUTABLE'):
                opts['executable_path'] = os.environ['CHROMIUM_EXECUTABLE']
            browser = pw.chromium.launch(**opts)
            page = browser.new_page(viewport={'width': 1440, 'height': 1000})
            page.on('pageerror', lambda e: report['errors'].append(str(e)))
            page.on('response', lambda r: report['errors'].append(f'HTTP {r.status}: {r.url}')
                    if r.status >= 400 and r.url.startswith(origin) else None)

            def render(path: str, width: int = 1440) -> None:
                page.set_viewport_size({'width': width, 'height': 1000})
                page.goto(origin + '/' + path, wait_until='networkidle')
                page.wait_for_function('window.ORB_READER_READY === true && !!window.ORB_DEEP && window.ORB_VISUALS_READY === true')
                check(page.locator('h1').count() == 1, 'Must have one H1: ' + path)
                check(page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'),
                      f'Whole-page horizontal overflow at {width}px: {path}')

            render('index.html')
            book = page.evaluate('({chapters:ORB_BOOK.chapters,aliases:ORB_BOOK.aliases})')
            check(len(book['chapters']) == 14, 'Expected exactly 14 chapters')
            for c in book['chapters']:
                check(c.get('revision') == 'principles-2026-09-27', 'Legacy chapter: ' + c['id'])
                check(len(c['sections']) >= 7, 'Too few sections: ' + c['id'])
                for s in c['sections']:
                    check(len(s['body']) >= 100, 'Empty/short section: ' + s['title'])
            report['chapters'] = [{'id':c['id'],'path':c['path'],'sections':len(c['sections'])} for c in book['chapters']]
            report['section_count'] = sum(len(c['sections']) for c in book['chapters'])
            report['visual_supplements'] = page.evaluate('ORB_VISUALS.lessons.map(l=>({id:l.id,chapter:l.chapterId,title:l.title}))')

            for path in book['aliases']:
                check((ROOT / path).is_file(), 'Missing alias HTML: ' + path)
                render(path)
                count = page.locator('.book-section').count()
                check(count >= 7, 'Wrong/legacy body at ' + path)
                report['routes'].append({'path':path,'sections':count,'visuals':page.locator('.v-lesson').count()})
                # SVGAnchorElement.href is SVGAnimatedString, not a Python string.
                links = page.locator('a[href]').evaluate_all("links=>links.map(a=>new URL(a.getAttribute('href'),document.baseURI).href)")
                for href in links:
                    check(isinstance(href, str), 'Non-string link: ' + path)
                    if href.startswith(origin + '/'):
                        target = unquote(urlparse(href).path).lstrip('/') or 'index.html'
                        check((ROOT / target).exists(), f'Missing local target {target} in {path}')
                    if '/UZ-SLAMLab/ORB_SLAM3/blob/' in href:
                        source_links.add(href)
                if path in ['index.html','overview.html','foundations.html','src_orb.html','init.html','imu.html','tracking.html','optimizer.html']:
                    page.screenshot(path=str(OUT / (Path(path).stem + '-desktop.png')), full_page=True)
                    figures = page.locator('.v-figure, .d-figure')
                    if figures.count():
                        figures.first.screenshot(path=str(OUT / (Path(path).stem + '-figure.png')))
                if page.locator('.v-enlarge').count():
                    page.locator('.v-enlarge').first.click()
                    check(page.locator('dialog.v-dialog').is_visible(), 'Diagram modal: ' + path)
                    page.keyboard.press('Escape')
                    page.locator('dialog.v-dialog').wait_for(state='detached')

            for c in book['chapters']:
                render(c['path'], 390)
                report['mobile'].append(c['path'])
                if page.locator('.v-transcript').count():
                    check(page.locator('.v-transcript[open]').count() == page.locator('.v-transcript').count(), 'Mobile diagram transcripts')
                if c['id'] in ['start','basics','features','init','imu','tracking']:
                    page.screenshot(path=str(OUT / (c['id'] + '-mobile.png')), full_page=False)
                page.locator('[data-menu]').click()
                page.wait_for_function("document.querySelector('.sidebar').getBoundingClientRect().x >= -1")
                page.keyboard.press('Escape')
                check(page.locator('[data-menu]').get_attribute('aria-expanded') == 'false', 'Menu did not close')

            expected = page.evaluate('''() => {
              const e=ORB_DEEP.evaluate, v=ORB_VISUALS.evaluate;
              return {
                projection:e('projection',{f:320,x:1,z:4,c:320}),
                depth:e('depth',{f:320,b:0.2,z:4}),pnp:e('pnp',{c:0.5}),
                integration:e('integration',{a:1,bias:0.1,t:2}),robust:e('robust',{r:4,variance:1}),
                visualPose:v('pnp',{C:0.5}),visualPoseWrong:v('pnp',{C:0}),
                zeroBaseline:v('depth',{f:320,b:0,Z:4,err:1}),
                stationaryImu:v('imu',{measure:9.81,bias:0,gravity:-9.81,t:1}),
                biasImu:v('imu',{measure:9.83,bias:0,gravity:-9.81,t:10}),
                hamming:v('hamming',{code:162}),weight:v('weight',{error:4,sigma:1})
              };
            }''')
            check(abs(expected['projection']['u']-400)<1e-6, 'Projection arithmetic')
            check(abs(expected['depth']['d']-16)<1e-6, 'Triangulation arithmetic')
            check(abs(expected['pnp']['residual'])<1e-6, 'Scalar pose residual minimum')
            check(abs(expected['integration']['dp']-1.8)<1e-6, 'Bias-corrected integration')
            check(expected['robust']['rho']<expected['robust']['chi'], 'Huber loss')
            check(expected['visualPose']['cost']==0 and expected['visualPoseWrong']['cost']==3600, 'Multi-landmark pose cost')
            check(expected['zeroBaseline']['depth'] is None, 'Zero baseline must not invent depth')
            check(abs(expected['stationaryImu']['p'])<1e-9, 'Specific force and gravity cancellation')
            check(abs(expected['biasImu']['p']-1)<1e-8, 'Bias drift example')
            check(expected['hamming']['distance']==1, 'XOR/Hamming example')
            check(expected['weight']['rho']<expected['weight']['chi'], 'Visual Huber model')
            report['teaching_arithmetic'] = expected

            interactive = []
            for c in book['chapters']:
                render(c['path'])
                for selector, result_sel, attr in [('[data-deep-lab]','.d-lab-result','data-deep-lab'),('[data-visual-lab]','.v-lab-result','data-visual-lab')]:
                    for lab in page.locator(selector).all():
                        first=lab.locator('input').first
                        before=lab.locator(result_sel).inner_text()
                        first.evaluate("el=>{el.value=el.value===el.max?el.min:el.max;el.dispatchEvent(new Event('input',{bubbles:true}));}")
                        check(before != lab.locator(result_sel).inner_text(), 'Non-responsive lab: '+c['path'])
                        interactive.append({'chapter':c['id'],'kind':lab.get_attribute(attr)})
            report['interactive_labs'] = interactive

            render('foundations.html')
            page.locator('[data-font]').click()
            size=page.locator('html').evaluate('e=>getComputedStyle(e).getPropertyValue("--read-size")')
            page.locator('[data-finish]').click()
            render('imu.html'); render('foundations.html')
            check(page.locator('[data-finish]').get_attribute('aria-pressed')=='true', 'Read marker not persisted')
            check(page.locator('html').evaluate('e=>getComputedStyle(e).getPropertyValue("--read-size")')==size, 'Font size not persisted')
            report['same_origin_persistence'] = 'passed'
            browser.close()

            if '--verify-sources' in sys.argv:
                ranges: dict[str,set[tuple[int,int]]] = {}
                for c in book['chapters']:
                    for section in c['sections']:
                        for ref in section.get('refs', []):
                            ranges.setdefault(ref['file'],set()).add((ref['start'],ref['end']))
                for href in source_links:
                    match = re.search(r'/blob/([a-f0-9]{40})/([^#]+)#L(\d+)-L(\d+)$',href)
                    if match:
                        check(match[1]==BASELINE, 'Source baseline drift: '+href)
                        ranges.setdefault(match[2],set()).add((int(match[3]),int(match[4])))
                for filename, pairs in sorted(ranges.items()):
                    request=Request(f'https://raw.githubusercontent.com/UZ-SLAMLab/ORB_SLAM3/{BASELINE}/{filename}',headers={'User-Agent':'orbslam3-html-source-check'})
                    with urlopen(request, timeout=45) as response:
                        lines=response.read().decode('utf-8').splitlines()
                    for first,last in pairs:
                        check(1<=first<=last<=len(lines),f'Out-of-range source anchor: {filename}:{first}-{last}')
                    report['references'].append({'file':filename,'line_count':len(lines),'anchors':len(pairs)})
            check(not report['errors'],str(report['errors']))
            report['status']='passed'
    finally:
        server.shutdown();server.server_close()

if __name__=='__main__':
    code=0
    try:
        main()
    except Exception as exc:
        code=1;report['status']='failed';report['failure']=str(exc);traceback.print_exc()
    finally:
        (OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
        print(json.dumps({'status':report['status'],'routes':len(report['routes']),'mobile':len(report['mobile']),'visuals':len(report.get('visual_supplements',[])),'report':str(OUT/'report.json')},ensure_ascii=False))
    sys.exit(code)
