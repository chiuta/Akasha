// Teste r10 pentru Akasha 1.1.8: restaurare sigură din autosave, import cu conținut ostil, versiune coerentă.
// Rulare: node tests/r10-audit.test.mjs   (Playwright din /opt/node-tools; rețea externă blocată)
import {createRequire} from 'module';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {fileURLToPath} from 'url';
const require = createRequire('/opt/node-tools/package.json');
const {chromium} = require('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const FILE = 'file://' + path.resolve(here, '..', 'index.html');
let ok = 0, bad = 0;
function t(name, cond, extra) { if (cond) { ok++; console.log('  ok  ' + name); } else { bad++; console.log('  FAIL ' + name + (extra ? ' :: ' + JSON.stringify(extra) : '')); } }
const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
async function open(init) {
  const ctx = await b.newContext({viewport: {width: 390, height: 800}});
  await ctx.route(/^https?:/, (r) => r.abort());
  if (init) await ctx.addInitScript(init);
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(FILE); await p.waitForTimeout(3600);
  return {ctx, p, errs};
}
const XSS = '<img src=x onerror=window.__x=1>';

console.log('Versiune coerentă');
{
  const {ctx, p, errs} = await open();
  const v = await p.evaluate(() => ({meta: document.querySelector('meta[name=application-version]').content, shown: document.getElementById('app-version').textContent}));
  const info = JSON.parse(fs.readFileSync(path.resolve(here, '..', 'app.json'), 'utf8'));
  t('versiunea afișată la rulare = meta = app.json', v.shown.indexOf('v ' + v.meta + ' · ' + info.updated) === 0 && info.version === v.meta, {v, info: info.version});
  t('0 pageerror', errs.length === 0, errs);
  await ctx.close();
}

console.log('Restaurare din autosave corupt/ostil');
{
  const bad_ = {t: 1, state: {records: [
    {id: 'x1', title: {a: 1}, cat: 5, tags: 'a b', body: {z: 1}, created: 'zz'}, null, 7, 'str',
    {id: '__proto__', title: 'p'}, {id: 'dup', title: 'prima'}, {id: 'dup', title: 'a doua'},
    {id: 'x2', title: XSS, body: '[[' + XSS + ']] [a](https://e.com/"onmouseover="window.__x=1) **' + XSS + '**', tags: [XSS], cat: 'gand'}
  ], meta: {lang: '__proto__', stars: 'nu'}}};
  const {ctx, p, errs} = await open(`try{localStorage.setItem('akasha:autosave:v1',${JSON.stringify(JSON.stringify(bad_))})}catch(e){}`);
  t('bannerul de restaurare apare', await p.evaluate(() => document.getElementById('banner').classList.contains('show')));
  await p.click('#restoreYes'); await p.waitForTimeout(600);
  t('fără pageerror după restaurare', errs.length === 0, errs);
  const s = await p.evaluate(() => window.__akasha.getState());
  t('înregistrările sunt normalizate (cat valid, tags listă, body șir)', s.records.every((r) => typeof r.title === 'string' && typeof r.body === 'string' && Array.isArray(r.tags) && ['gand','eveniment','cunoastere','amintire','viziune','intrebare'].includes(r.cat)), s.records.map((r) => [r.id, r.cat]));
  t('duplicatele de id se unifică (rămâne ultima)', s.records.filter((r) => r.id === 'dup').length === 1 && s.records.find((r) => r.id === 'dup').title === 'a doua');
  t('meta.stars implicit boolean, limba __proto__ ignorată', s.meta.stars === true && await p.evaluate(() => document.documentElement.lang !== '__proto__'));
  await p.waitForTimeout(300);
  t('niciun cod din înregistrări nu rulează', await p.evaluate(() => window.__x === undefined));
  await ctx.close();
}

console.log('Import JSON ostil');
{
  const {ctx, p, errs} = await open();
  const f = path.join(os.tmpdir(), 'akasha-r10-import.json');
  fs.writeFileSync(f, JSON.stringify({records: [
    {id: '__proto__', title: 'pp'}, {id: 'n1', title: XSS, body: '[[' + XSS + ']] [b](javascript:alert(1)) `' + XSS + '`', tags: [XSS], cat: 'zzz', res: '99'},
    {id: 'n2', title: 'T'.repeat(200000), body: 'B'.repeat(1000000)}
  ]}));
  await p.click('#menuBtn');
  const fc = p.waitForEvent('filechooser');
  await p.click('[data-act=importJson]');
  await (await fc).setFiles(f); await p.waitForTimeout(800);
  const s = await p.evaluate(() => window.__akasha.getState());
  const n1 = s.records.find((r) => r.id === 'n1');
  t('import: cat necunoscută → gand, resonanță limitată la 5', n1 && n1.cat === 'gand' && n1.res === 5, n1 && [n1.cat, n1.res]);
  t('import: titlul este tăiat la 500 de caractere', s.records.find((r) => r.id === 'n2').title.length === 500);
  await p.waitForTimeout(300);
  t('import: niciun cod nu rulează, fără pageerror', await p.evaluate(() => window.__x === undefined) && errs.length === 0, errs);
  await p.evaluate(() => document.querySelector('[data-id="n1"]')?.click());
  await p.waitForTimeout(300);
  t('detaliu: linkurile javascript: nu devin href', await p.evaluate(() => ![...document.querySelectorAll('a')].some((a) => /^javascript:/i.test(a.getAttribute('href') || ''))));
  await ctx.close();
}
await b.close();
console.log('\n' + ok + ' reușite, ' + bad + ' eșuate'); process.exit(bad ? 1 : 0);
