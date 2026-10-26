// Teste r9 pentru Akasha: indicator persistent „modificări nesalvate”, ștergere cu confirmare inline (fără confirm()), service worker offline.
// Rulare: node tests/r9-unsaved-sw.test.mjs   (Playwright din /opt/node-tools; rețea externă blocată)
import {createRequire} from 'module';
import fs from 'fs';
import http from 'http';
import path from 'path';
import {fileURLToPath} from 'url';
const require = createRequire(process.env.PW_ROOT || import.meta.url);
const {chromium} = require('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '..');
let ok = 0, bad = 0;
function t(name, cond, extra) { if (cond) { ok++; console.log('  ok  ' + name); } else { bad++; console.log('  FAIL ' + name + (extra ? ' :: ' + JSON.stringify(extra) : '')); } }
const MIME = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png'};
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('no'); }
  res.writeHead(200, {'Content-Type': MIME[path.extname(f)] || 'application/octet-stream'}); fs.createReadStream(f).pipe(res);
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + srv.address().port + '/';
const b = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox']});

for (const L of ['en', 'ro', 'de', 'hu']) {
  const ctx = await b.newContext({viewport: {width: 1000, height: 800}, serviceWorkers: 'block', locale: L, acceptDownloads: true});
  const p = await ctx.newPage(); const errs = []; let dialogs = 0;
  p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => { dialogs++; d.dismiss(); });
  await p.goto(BASE); await p.waitForTimeout(1500);
  t(L + ': indicatorul e ascuns la început', await p.evaluate(() => document.getElementById('unsavedChip').hidden === true));
  await p.evaluate(() => { const A = window.__akasha; A.getState().records.push({id: 'r9x', title: 'Test', cat: 'gand', res: 3, tags: [], created: new Date().toISOString(), updated: new Date().toISOString(), body: 'x'}); A.markDirty(); });
  const vis = await p.evaluate(() => { const c = document.getElementById('unsavedChip'); const r = c.getBoundingClientRect(); return {hidden: c.hidden, w: r.width, txt: c.textContent.trim().slice(0, 60)}; });
  t(L + ': indicator persistent vizibil după modificare', vis.hidden === false && vis.w > 100, vis);
  await p.evaluate(() => window.__akasha.del('r9x', false)); await p.waitForTimeout(300);
  const box = await p.evaluate(() => { const bx = document.querySelector('.ffui-box'); return bx ? [...bx.querySelectorAll('button')].map((x) => x.textContent) : null; });
  t(L + ': confirmare inline la ștergere', Array.isArray(box) && box.length === 2, box);
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  t(L + ': Esc anulează ștergerea', await p.evaluate(() => !document.querySelector('.ffui-box') && window.__akasha.getState().records.some((r) => r.id === 'r9x')));
  await p.evaluate(() => window.__akasha.del('r9x', false)); await p.waitForTimeout(200);
  await p.click('.ffui-ok'); await p.waitForTimeout(300);
  t(L + ': confirmarea șterge înregistrarea', await p.evaluate(() => !window.__akasha.getState().records.some((r) => r.id === 'r9x')));
  const dl = p.waitForEvent('download', {timeout: 5000});
  await p.click('#unsavedBtn'); await dl;
  t(L + ': „Reîncarnează” din indicator salvează și ascunde indicatorul', await p.evaluate(() => document.getElementById('unsavedChip').hidden === true));
  t(L + ': fără confirm() nativ, fără erori', dialogs === 0 && errs.length === 0, {dialogs, errs});
  await ctx.close();
}
// service worker
{
  const ctx = await b.newContext({viewport: {width: 1000, height: 800}});
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(BASE); await p.waitForTimeout(1500);
  const reg = await p.evaluate(async () => { const r = await navigator.serviceWorker.ready; for (let i = 0; i < 50 && r.active && r.active.state !== 'activated'; i++) await new Promise((x) => setTimeout(x, 100)); return r.active && r.active.state; });
  t('service worker activ', reg === 'activated', reg);
  await ctx.setOffline(true); await p.reload(); await p.waitForTimeout(2000);
  t('repornire offline', await p.evaluate(() => !!document.getElementById('app-version') && document.querySelectorAll('.card, .rec, [data-id]').length >= 0) && errs.length === 0, errs);
  await ctx.close();
}
await b.close(); srv.close();
console.log('\n' + ok + ' reușite, ' + bad + ' eșuate'); process.exit(bad ? 1 : 0);
