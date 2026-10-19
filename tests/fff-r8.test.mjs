// Teste R8 pentru Akasha 1.1.0: citire cu voce tare, cod QR pentru înregistrări, accesibilitate.
import {createRequire} from 'module';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
const require = createRequire('/opt/node-tools/package.json');
const {chromium} = require('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const FILE = 'file://' + path.resolve(here, '..', 'index.html');
const AXE = process.env.FFF_AXE || '/tmp/claude-0/-home-claude/78529928-3825-51c3-b9bd-0e81655ab6bc/scratchpad/sweep/node_modules/axe-core/axe.min.js';
let ok = 0, bad = 0;
function t(name, cond, extra) { if (cond) { ok++; console.log('  ok  ' + name); } else { bad++; console.log('  FAIL ' + name + (extra ? ' :: ' + extra : '')); } }
const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
async function open(w, h, init, file) {
  const ctx = await b.newContext({viewport: {width: w, height: h}, acceptDownloads: true});
  let net = 0; await ctx.route(/^https?:/, (r) => { net++; r.abort(); });
  if (init) await ctx.addInitScript(init);
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push('pageerror ' + e.message));
  p.on('console', (m) => { if (/Content Security|Refused/i.test(m.text())) errs.push('csp ' + m.text().slice(0, 120)); });
  await p.goto(file || FILE); await p.waitForTimeout(3600);
  return {ctx, p, errs, net: () => net};
}
async function axe(w, h, prep, label) {
  const ctx = await b.newContext({viewport: {width: w, height: h}, bypassCSP: true}); await ctx.route(/^https?:/, (r) => r.abort());
  const p = await ctx.newPage(); await p.goto(FILE); await p.waitForTimeout(3600);
  await p.addScriptTag({content: fs.readFileSync(AXE, 'utf8')});
  if (prep) await prep(p);
  const v = await p.evaluate(async () => (await axe.run(document)).violations.map((x) => x.id + ':' + x.nodes.length + ' ' + x.nodes.slice(0, 2).map((n) => n.target.join()).join('|')));
  t('axe 0 violări ' + label + ' ' + w + 'px', v.length === 0, v.join(' ; '));
  await ctx.close();
}
const mockTts = () => {
  const spoken = []; window.__spoken = spoken; window.__cancels = 0; window.__hold = false;
  class U { constructor(t) { this.text = t; } }
  const voices = [{name: 'T-ro', lang: 'ro-RO', localService: true, voiceURI: 'ro'}, {name: 'T-en', lang: 'en-US', localService: true, voiceURI: 'en'}];
  const synth = {speaking: false, paused: false, getVoices: () => voices, addEventListener() {}, removeEventListener() {}, cancel() { window.__cancels++; }, pause() {}, resume() {},
    speak(u) { spoken.push({text: u.text, lang: u.lang}); setTimeout(() => u.onstart && u.onstart(), 0); if (!window.__hold) setTimeout(() => u.onend && u.onend(), 30); }};
  Object.defineProperty(window, 'speechSynthesis', {value: synth, configurable: true});
  window.SpeechSynthesisUtterance = U;
};
const detail = (p, id) => p.evaluate((id) => window.__akasha.openDetail(id), id);
async function rec(p, r) { await p.evaluate((r) => { const s = window.__akasha.getState(); s.records.push(Object.assign({id: 'x' + Math.random().toString(36).slice(2), cat: 'gand', res: 2, tags: [], created: new Date().toISOString(), updated: new Date().toISOString()}, r)); window.__akasha.setState(s); }, r); }
async function qrPng(p) {
  return p.evaluate(async () => {
    const svg = document.querySelector('.r8-qrbox svg').outerHTML;
    const url = URL.createObjectURL(new Blob([svg], {type: 'image/svg+xml'}));
    const img = new Image(); await new Promise((r, j) => { img.onload = r; img.onerror = j; img.src = url; });
    const c = document.createElement('canvas'); c.width = 640; c.height = 640; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 640, 640); g.drawImage(img, 0, 0, 640, 640);
    const blob = await new Promise((r) => c.toBlob(r, 'image/png')); return Array.from(new Uint8Array(await blob.arrayBuffer()));
  });
}
async function importQr(p, png) {
  const fcP = p.waitForEvent('filechooser');
  await p.click('#menuBtn'); await p.click('[data-act=qrImport]');
  const fc = await fcP; await fc.setFiles({name: 'q.png', mimeType: 'image/png', buffer: Buffer.from(png)});
  await p.waitForTimeout(900);
}

console.log('Pornire și versiune');
{
  const {ctx, p, errs, net} = await open(1280, 800);
  t('0 pageerror/CSP', errs.length === 0, errs.join('|'));
  t('0 cereri de rețea', net() === 0);
  t('versiune 1.1.2 (meta + #app-version + constantă)', await p.evaluate(() => document.querySelector('meta[name=application-version]').content === '1.1.2' && /v 1\.1\.2 · 2026-10-19/.test(document.getElementById('app-version').textContent)));
  t('kit prezent', await p.evaluate(() => !!(window.FFF && FFF.label && FFF.bundle && FFF.qr && FFF.tts)));
  await ctx.close();
}

console.log('Citire cu voce tare');
{
  const {ctx, p, errs} = await open(1280, 800, mockTts);
  await detail(p, 'seed-1');
  const btns = await p.locator('.pfoot button').allTextContents();
  t('butoane noi în subsolul detaliului (voce, QR) înaintea celor vechi', /Read aloud/.test(btns[0]) && /QR code/.test(btns[1]) && /Duplicate/.test(btns[2]), btns.join('|'));
  await p.evaluate(() => { window.__hold = true; });
  await p.click('.pfoot button:has-text("Read aloud")');
  await p.waitForTimeout(500);
  const sp = await p.evaluate(() => window.__spoken);
  const title = await p.textContent('.phead h2');
  t('rostește titlul urmat de text', sp.length >= 1 && sp[0].text.startsWith(title), JSON.stringify(sp).slice(0, 200));
  t('buton comutat pe „Stop reading”, aria-pressed=true', /Stop reading/.test(await p.textContent('.pfoot button:first-child')) && (await p.getAttribute('.pfoot button:first-child', 'aria-pressed')) === 'true');
  const c0 = await p.evaluate(() => window.__cancels);
  await p.click('.pfoot button:first-child'); await p.waitForTimeout(300);
  t('al doilea clic oprește (cancel) și readuce etichetele', (await p.evaluate(() => window.__cancels)) > c0 && /Read aloud/.test(await p.textContent('.pfoot button:first-child')));
  // închiderea panoului oprește vocea
  await p.click('.pfoot button:first-child'); await p.waitForTimeout(200);
  const c1 = await p.evaluate(() => window.__cancels);
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  t('închiderea panoului oprește vocea', (await p.evaluate(() => window.__cancels)) > c1);
  // limba română
  await p.selectOption('#langSel', 'ro'); await detail(p, 'seed-1');
  t('română: etichete traduse', (await p.locator('.pfoot button').allTextContents()).slice(0, 2).join('|').includes('Citește cu voce tare') );
  await p.evaluate(() => { window.__hold = false; window.__spoken.length = 0; });
  await p.click('.pfoot button:first-child'); await p.waitForTimeout(500);
  t('limba vocii urmează limba interfeței (ro)', (await p.evaluate(() => window.__spoken)).every((x) => /^ro/.test(x.lang)) && (await p.evaluate(() => window.__spoken.length)) >= 1);
  // fără voce pentru limba
  await p.keyboard.press('Escape'); await p.selectOption('#langSel', 'fr'); await detail(p, 'seed-1');
  await p.evaluate(() => { window.__spoken.length = 0; });
  await p.click('.pfoot button:first-child'); await p.waitForTimeout(900);
  t('fără voce fr: toast de avertizare, nimic rostit', /voix|voice/i.test(await p.textContent('#toasts')) && (await p.evaluate(() => window.__spoken.length)) === 0, await p.textContent('#toasts'));
  t('0 erori', errs.length === 0, errs.join('|'));
  await ctx.close();
}
{
  const {ctx, p} = await open(1280, 800, () => { Object.defineProperty(window, 'speechSynthesis', {value: undefined, configurable: true}); });
  await detail(p, 'seed-1'); await p.click('.pfoot button:first-child'); await p.waitForTimeout(400);
  t('fără sinteză vocală: mesaj de indisponibilitate', /no speech synthesis/.test(await p.textContent('#toasts')));
  await ctx.close();
}

console.log('Cod QR pentru înregistrare');
{
  const {ctx, p, errs} = await open(1280, 800);
  await rec(p, {title: 'Țară și ființă ✦', body: 'Text cu diacritice: ăîșțâ, emoji 🌌 și **bold**.', tags: ['unu', 'doi'], cat: 'viziune', res: 4});
  const id = await p.evaluate(() => window.__akasha.getState().records.slice(-1)[0].id);
  await detail(p, id);
  await p.click('.pfoot button:has-text("QR code")');
  t('panou QR cu SVG', (await p.locator('.r8-qrbox svg').count()) === 1);
  const text = await p.inputValue('.r8-ta');
  t('conținut: prefix akasha1: + JSON', text.startsWith('akasha1:') && JSON.parse(text.slice(8)).t === 'Țară și ființă ✦');
  t('mai puțin de 1000 de octeți', Buffer.byteLength(text) <= 1000, String(Buffer.byteLength(text)));
  t('fără mesaj de trunchiere (textul încape)', (await p.locator('.r8-note').count()) === 1);
  const png = await qrPng(p);
  t('buton „Back” revine la detaliu', await (async () => { await p.click('.pfoot button:has-text("Back")'); return (await p.locator('.pfoot button:has-text("Duplicate")').count()) === 1; })());
  await p.keyboard.press('Escape');
  const n0 = await p.evaluate(() => window.__akasha.getState().records.length);
  await importQr(p, png);
  const st = await p.evaluate(() => window.__akasha.getState().records);
  const added = st[st.length - 1];
  t('citirea QR adaugă o înregistrare nouă (id diferit, aceleași câmpuri)', st.length === n0 + 1 && added.id !== id && added.title === 'Țară și ființă ✦' && added.cat === 'viziune' && added.res === 4 && added.tags.join() === 'unu,doi' && added.body.includes('🌌'), JSON.stringify(added).slice(0, 200));
  t('toast de confirmare', /Record added from the QR code/.test(await p.textContent('#toasts')));
  t('înregistrarea adăugată nu e marcată seed', added.seed !== true);
  // text lung → trunchiat onest
  await rec(p, {title: 'Lung', body: 'cuvânt '.repeat(900)});
  const id2 = await p.evaluate(() => window.__akasha.getState().records.slice(-1)[0].id);
  await detail(p, id2); await p.click('.pfoot button:has-text("QR code")');
  const t2 = await p.inputValue('.r8-ta');
  t('text lung: ≤ 1000 octeți', Buffer.byteLength(t2) <= 1000, String(Buffer.byteLength(t2)));
  t('text lung: avertizare cu cifre „X of 6300”', /cut to \d+ of 6300 characters/.test(await p.textContent('.pbody')));
  const png2 = await qrPng(p);
  const dec = await p.evaluate(async (arr) => FFF.qr.scan(new File([new Uint8Array(arr)], 'q.png', {type: 'image/png'})), png2);
  t('QR-ul lung se decodează identic', dec === t2);
  await p.keyboard.press('Escape');
  // coduri străine / stricate
  const bogus = await p.evaluate(async () => { const c = FFF.qr.canvas('akasha1:{nu e json', {scale: 6}); const blob = await new Promise((r) => c.toBlob(r, 'image/png')); return Array.from(new Uint8Array(await blob.arrayBuffer())); });
  const n1 = await p.evaluate(() => window.__akasha.getState().records.length);
  await importQr(p, bogus);
  t('JSON stricat respins', /does not contain an Akasha record/.test(await p.textContent('#toasts')) && (await p.evaluate(() => window.__akasha.getState().records.length)) === n1);
  const other = await p.evaluate(async () => { const c = FFF.qr.canvas('salut', {scale: 6}); const blob = await new Promise((r) => c.toBlob(r, 'image/png')); return Array.from(new Uint8Array(await blob.arrayBuffer())); });
  await importQr(p, other);
  t('QR străin respins', (await p.evaluate(() => window.__akasha.getState().records.length)) === n1);
  const blank = await p.evaluate(async () => { const c = document.createElement('canvas'); c.width = 200; c.height = 200; const blob = await new Promise((r) => c.toBlob(r, 'image/png')); return Array.from(new Uint8Array(await blob.arrayBuffer())); });
  await importQr(p, blank);
  t('imagine fără QR: mesaj', /No readable QR code/.test(await p.textContent('#toasts')));
  const xss = await p.evaluate(async () => { const c = FFF.qr.canvas('akasha1:' + JSON.stringify({t: '<img src=x onerror=alert(1)>', c: '__proto__', r: 99, g: ['<b>'], b: '<script>alert(1)</script>'}), {scale: 6}); const blob = await new Promise((r) => c.toBlob(r, 'image/png')); return Array.from(new Uint8Array(await blob.arrayBuffer())); });
  await importQr(p, xss);
  const last = await p.evaluate(() => window.__akasha.getState().records.slice(-1)[0]);
  t('conținut ostil: cat/res normalizate, fără injectare în DOM', last.cat === 'gand' && last.res === 5 && (await p.locator('#list img[src="x"], #list script').count()) === 0, JSON.stringify(last).slice(0, 160));
  t('0 erori', errs.length === 0, errs.join('|'));
  await ctx.close();
}

console.log('Accesibilitate');
{
  const {ctx, p, errs} = await open(1280, 800);
  const z0 = await p.evaluate(() => getComputedStyle(document.body).zoom);
  await p.click('#menuBtn'); await p.click('[data-act=a11y]');
  t('panou accesibilitate deschis (rol dialog)', (await p.getAttribute('#panel', 'role')) === 'dialog' && /Accessibility/.test(await p.textContent('#panel h2')));
  await p.check('#panel label:has-text("Larger text") input'); await p.check('#panel label:has-text("High contrast") input');
  t('clase aplicate pe <html>', await p.evaluate(() => document.documentElement.classList.contains('a11y-large') && document.documentElement.classList.contains('a11y-contrast')));
  t('text mai mare: zoom 1.2', (await p.evaluate(() => getComputedStyle(document.body).zoom)) === '1.2' && z0 === '1');
  t('contrast: text principal la contrast maxim (negru în tema luminoasă)', await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ink').trim()) === '#000');
  await p.keyboard.press('Escape');
  await p.reload(); await p.waitForTimeout(3600);
  t('preferințele se păstrează după reîncărcare', await p.evaluate(() => document.documentElement.classList.contains('a11y-large') && document.documentElement.classList.contains('a11y-contrast')));
  t('indexate de kit (copie de siguranță)', await p.evaluate(() => /a11y/.test(JSON.stringify(FFF.bundle.build().data))));
  // reîncarnare: fișierul salvat rămâne funcțional și nu conține clasele (sunt doar în localStorage)
  await p.evaluate(() => { const s = window.__akasha.getState(); s.records.push({id: 'zz1', title: 'Persist', cat: 'gand', res: 1, tags: [], created: new Date().toISOString(), updated: new Date().toISOString(), body: 'ok'}); window.__akasha.setState(s); });
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#dlBtn')]);
  const sp = '/tmp/akasha-r8-saved.html'; await dl.saveAs(sp);
  const html = fs.readFileSync(sp, 'utf8');
  t('copia reîncarnată: un singur bloc kit, versiunea 1.1.2, înregistrarea nouă', (html.match(/<!--fff:kit:start/g) || []).length === 1 && /content="1\.1\.2"/.test(html) && /Persist/.test(html));
  t('copia reîncarnată nu are clase a11y încorporate', !/<html[^>]*a11y-/.test(html));
  const c2 = await open(1280, 800, null, 'file://' + sp);
  t('copia reîncarnată pornește fără erori și păstrează înregistrarea', c2.errs.length === 0 && (await c2.p.evaluate(() => window.__akasha.getState().records.some((r) => r.id === 'zz1'))), c2.errs.join('|'));
  await c2.ctx.close(); fs.unlinkSync(sp);
  await p.selectOption('#langSel', 'hu'); await p.click('#menuBtn');
  t('maghiară: intrări de meniu traduse', /Kisegítő lehetőségek/.test(await p.textContent('[data-act=a11y]')) && /QR-kód olvasása/.test(await p.textContent('[data-act=qrImport]')));
  await p.selectOption('#langSel', 'de'); await p.click('#menuBtn');
  t('germană: intrări de meniu traduse', /Barrierefreiheit/.test(await p.textContent('[data-act=a11y]')));
  t('0 erori', errs.length === 0, errs.join('|'));
  await ctx.close();
}

console.log('Kit');
{
  const {ctx, p, errs} = await open(1280, 800);
  await p.click('#app-version'); await p.waitForTimeout(300);
  t('dialog „Transparență” se deschide', (await p.locator('dialog[open]').count()) === 1);
  t('avertizează că aplicația își modifică propriul fișier', /propria copie|own copy|SHA-256/i.test(await p.textContent('dialog[open]')) );
  await p.keyboard.press('Escape');
  t('0 erori', errs.length === 0, errs.join('|'));
  await ctx.close();
}

console.log('Accesibilitate (axe) și dimensiuni');
for (const [w, h] of [[1280, 800], [360, 740]]) {
  await axe(w, h, null, 'pagină');
  await axe(w, h, async (p) => { await detail(p, 'seed-1'); await p.waitForTimeout(1500); }, 'detaliu cu butoane noi');
  await axe(w, h, async (p) => { await detail(p, 'seed-1'); await p.click('.pfoot button:has-text("QR code")'); await p.waitForTimeout(1500); }, 'panou QR');
  await axe(w, h, async (p) => { await p.click('#menuBtn'); await p.click('[data-act=a11y]'); await p.waitForTimeout(1500); }, 'panou accesibilitate');
  await axe(w, h, async (p) => { await p.click('#menuBtn'); await p.waitForTimeout(1000); }, 'meniu deschis');
  await axe(w, h, async (p) => { await p.click('#menuBtn'); await p.click('[data-act=a11y]'); await p.check('#panel label:has-text("Larger text") input'); await p.check('#panel label:has-text("High contrast") input'); await p.keyboard.press('Escape'); await p.waitForTimeout(1500); }, 'contrast + text mare');
  await axe(w, h, async (p) => { await p.click('#app-version'); await p.waitForTimeout(1000); }, 'dialog Transparență');
  const {ctx, p} = await open(w, h);
  await p.click('#menuBtn'); await p.click('[data-act=a11y]'); await p.check('#panel label:has-text("Larger text") input'); await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  t('fără depășire orizontală ' + w + ' (text mărit)', await p.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), String(await p.evaluate(() => document.documentElement.scrollWidth + '/' + document.documentElement.clientWidth)));
  await ctx.close();
}
// import: meta.stars din fișier nu suprascrie preferința utilizatorului; înregistrările se îmbină
{
  const {ctx, p, errs} = await open(1280, 800);
  const starTxt = async () => { await p.click('#menuBtn'); const x = await p.textContent("[data-act='stars'] span"); await p.keyboard.press('Escape'); return x.trim(); };
  await p.click('#menuBtn'); await p.click("[data-act='stars']");           // opresc/pornesc: schimb preferința față de implicit
  const before = await starTxt();
  const stars = /oprite|off/i.test(before) ? true : false;                    // fișierul cere exact opusul
  const file = {name: 'imp.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({version: 1, meta: {created: '2026-10-18', stars}, records: [{id: 'imp-1', title: 'Import de test unic', cat: 'intrebare', res: 0, tags: ['t'], created: '2026-10-18T10:00:00.000Z', updated: '2026-10-18T10:00:00.000Z', body: 'corp'}]}))};
  await p.click('#menuBtn');
  const fc = p.waitForEvent('filechooser');
  await p.click("[data-act='importJson']"); (await fc).setFiles(file);
  await p.waitForTimeout(700);
  t('import: înregistrarea din fișier a fost adăugată', (await p.locator('text=Import de test unic').count()) > 0);
  t('import: meta.stars din fișier NU suprascrie preferința', (await starTxt()) === before, before + ' → ' + (await starTxt()));
  t('import: fără erori JS/CSP', errs.length === 0, errs.join(' | '));
  await ctx.close();
}
await b.close();
console.log(`\n${ok} reușite, ${bad} eșuate`); process.exit(bad ? 1 : 0);
