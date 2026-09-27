"""Test the expanded 14-chapter curriculum through the real HTTP loader.

python -m pip install playwright
python -m playwright install chromium
python tests/test_curriculum.py [--verify-sources]

This checks the website, references and teaching arithmetic, not C++ SLAM accuracy.
"""
from __future__ import annotations
import functools
import http.server
import json
import os
from pathlib import Path
import shutil
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
    handler = functools.partial(QuietHandler, directory=str(ROOT))
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    origin = f'http://127.0.0.1:{server.server_port}'
    try:
        with sync_playwright() as pw:
            opts = {'headless': True}
            executable = os.environ.get('CHROMIUM_EXECUTABLE')
            if executable:
                opts['executable_path'] = executable
            browser = pw.chromium.launch(**opts)
            page = browser.new_page(viewport={'width': 1440, 'height': 1000})
            page.on('pageerror', lambda e: report['errors'].append(str(e)))
            page.on('response', lambda r: report['errors'].append(f'HTTP {r.status}: {r.url}')
                    if r.status >= 400 and r.url.startswith(origin) else None)

            def render(path: str, width: int = 1440) -> None:
                page.set_viewport_size({'width': width, 'height': 1000})
                page.goto(origin + '/' + path, wait_until='networkidle')
                page.wait_for_function('window.ORB_READER_READY === true && !!window.ORB_DEEP')
                page.wait_for_timeout(60)
                check(page.locator('h1').count() == 1, 'Must have one H1: ' + path)
                check(page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'),
                      f'Whole-page horizontal overflow at {width}px: {path}')

            render('index.html')
            book = page.evaluate('({chapters:ORB_BOOK.chapters,aliases:ORB_BOOK.aliases})')
            check(len(book['chapters']) == 14, 'Expected exactly 14 chapters')
            check(all(c.get('revision') == 'principles-2026-09-27' for c in book['chapters']),
                  'A placeholder or old chapter survived the real loader')
            for chapter in book['chapters']:
                check(len(chapter['sections']) >= 7, f"Too few sections: {chapter['id']}")
                for section in chapter['sections']:
                    check(len(section['body']) >= 100, f"Empty/short section: {section['title']}")
            report['chapters'] = [{'id': c['id'], 'path': c['path'],
                                    'title': c['title'], 'sections': len(c['sections'])}
                                   for c in book['chapters']]
            report['section_count'] = sum(len(c['sections']) for c in book['chapters'])

            for path in book['aliases']:
                check((ROOT / path).is_file(), 'Missing alias HTML: ' + path)
                render(path)
                count = page.locator('.book-section').count()
                report['routes'].append({'path': path, 'sections': count})
                check(count >= 7, 'Wrong/legacy body at ' + path)
                local_links = page.locator('a[href]').evaluate_all('(links)=>links.map(a=>a.href)')
                for href in local_links:
                    if href.startswith(origin + '/'):
                        target = unquote(urlparse(href).path).lstrip('/') or 'index.html'
                        check((ROOT / target).exists(), f'Missing local target {target} in {path}')
                if path in ['index.html','overview.html','foundations.html','src_orb.html',
                            'init.html','imu.html','tracking.html','optimizer.html']:
                    page.screenshot(path=str(OUT / (Path(path).stem + '-desktop.png')), full_page=True)
                    figures = page.locator('.d-figure')
                    if figures.count():
                        figures.first.screenshot(path=str(OUT / (Path(path).stem + '-figure.png')))

            for chapter in book['chapters']:
                render(chapter['path'], 390)
                report['mobile'].append(chapter['path'])
                if chapter['id'] in ['start','basics','features','init','imu','tracking']:
                    page.screenshot(path=str(OUT / (chapter['id'] + '-mobile.png')), full_page=False)
                page.locator('[data-menu]').click()
                page.wait_for_function("document.querySelector('.sidebar').getBoundingClientRect().x >= -1")
                page.keyboard.press('Escape')
                check(page.locator('[data-menu]').get_attribute('aria-expanded') == 'false', 'Menu did not close')

            # Deterministic, explicitly simplified teaching calculations.
            expected = page.evaluate('''() => {
              const e=ORB_DEEP.evaluate;
              return {
                projection:e('projection',{f:320,x:1,z:4,c:320}),
                depth:e('depth',{f:320,b:0.2,z:4}),
                pnp:e('pnp',{c:0.5}),
                integration:e('integration',{a:1,bias:0.1,t:2}),
                robust:e('robust',{r:4,variance:1})
              };
            }''')
            check(abs(expected['projection']['u'] - 400) < 1e-6, 'Projection arithmetic')
            check(abs(expected['depth']['d'] - 16) < 1e-6, 'Triangulation arithmetic')
            check(abs(expected['pnp']['residual']) < 1e-6, 'Scalar pose residual minimum')
            check(abs(expected['integration']['dp'] - 1.8) < 1e-6, 'Bias-corrected acceleration arithmetic')
            check(expected['robust']['rho'] < expected['robust']['chi'], 'Huber loss behavior')
            report['teaching_arithmetic'] = expected

            interactive = []
            for chapter in book['chapters']:
                render(chapter['path'])
                for lab in page.locator('[data-deep-lab]').all():
                    first = lab.locator('input').first
                    before = lab.locator('.d-lab-result').inner_text()
                    first.evaluate("el=>{el.value=el.value===el.max?el.min:el.max;el.dispatchEvent(new Event('input',{bubbles:true}));}")
                    after = lab.locator('.d-lab-result').inner_text()
                    check(before != after, 'Non-responsive lab on ' + chapter['path'])
                    interactive.append({'chapter':chapter['id'],'kind':lab.get_attribute('data-deep-lab')})
            report['interactive_labs'] = interactive

            # Actual navigation, unlike an inlined DOM test, preserves origin/storage.
            render('foundations.html')
            page.locator('[data-font]').click()
            size = page.locator('html').evaluate('e=>getComputedStyle(e).getPropertyValue("--read-size")')
            page.locator('[data-finish]').click()
            render('imu.html'); render('foundations.html')
            check(page.locator('[data-finish]').get_attribute('aria-pressed') == 'true', 'Read marker not persisted')
            check(page.locator('html').evaluate('e=>getComputedStyle(e).getPropertyValue("--read-size")') == size,
                  'Font size not persisted')
            report['same_origin_persistence'] = 'passed'
            browser.close()

            if '--verify-sources' in sys.argv:
                ranges: dict[str,list[tuple[int,int]]] = {}
                for c in book['chapters']:
                    for section in c['sections']:
                        for ref in section.get('refs', []):
                            ranges.setdefault(ref['file'], []).append((ref['start'], ref['end']))
                for filename, pairs in sorted(ranges.items()):
                    url = f'https://raw.githubusercontent.com/UZ-SLAMLab/ORB_SLAM3/{BASELINE}/{filename}'
                    request = Request(url, headers={'User-Agent':'orbslam3-html-source-check'})
                    with urlopen(request, timeout=45) as response:
                        lines = response.read().decode('utf-8').splitlines()
                    for first, last in pairs:
                        check(1 <= first <= last <= len(lines), f'Out-of-range source anchor: {filename}:{first}-{last}')
                    report['references'].append({'file':filename,'line_count':len(lines),'anchors':len(pairs)})
            check(not report['errors'], str(report['errors']))
            report['status'] = 'passed'
    finally:
        server.shutdown()
        server.server_close()


if __name__ == '__main__':
    code = 0
    try:
        main()
    except Exception as exc:
        code = 1
        report['status'] = 'failed'
        report['failure'] = str(exc)
        traceback.print_exc()
    finally:
        (OUT / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
        print(json.dumps({'status': report['status'], 'report': str(OUT / 'report.json')}, ensure_ascii=False))
    sys.exit(code)
