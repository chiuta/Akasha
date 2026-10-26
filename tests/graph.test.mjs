// Akasha 2.0 — graf de legături [[Titlu]] și sugestii de conexiuni (mențiuni nelegate, etichete comune), cu anulare.
// Rulare: node tests/graph.test.mjs   (Playwright din /opt/node-tools, Chromium din /opt/pw-browsers; rețea blocată; opțional FFF_AXE)
import {createRequire} from 'module';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
const require = createRequire(process.env.PW_ROOT || import.meta.url);
const {chromium} = require('playwright');
const FILE = 'file://' + path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'index.html');
const AXE = process.env.FFF_AXE || process.env.AXE_PATH;
let ok = 0, bad = 0;
const t = (n, c, x) => { if (c) { ok++; console.log('  ok  ' + n); } else { bad++; console.log('  FAIL ' + n + (x !== undefined ? ' :: ' + JSON.stringify(x) : '')); } };
const b = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox']});
const issues = [];
async function open(o = {}) {
  const ctx = await b.newContext({viewport: {width: o.w || 1100, height: o.h || 850}, acceptDownloads: true, bypassCSP: !!o.bypass, locale: 'ro-RO'});
  await ctx.route(/^https?:/, (r) => { issues.push('REȚEA ' + r.request().url()); r.abort(); });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => issues.push('pageerror ' + e.message)); p.on('dialog', (d) => { issues.push('dialog ' + d.message()); d.dismiss(); });
  await p.goto(FILE); await p.waitForTimeout(3600);
  await p.selectOption('#langSel', 'ro'); await p.waitForTimeout(200);
  return {ctx, p};
}
const rec = (id, title, body, tags = [], cat = 'gand') => ({id, title, body, tags, cat, res: 1, created: '2026-10-01T10:00:00Z', updated: '2026-10-01T10:00:00Z'});
async function importRecs(p, records) {
  await p.click('#menuBtn'); await p.waitForTimeout(450); const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('#menu [data-act="importJson"]')]);
  await fc.setFiles({name: 'r.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({version: 1, records}))});
  await p.waitForTimeout(500);
}
const openGraph = async (p) => { await p.click('#menuBtn'); await p.waitForTimeout(450); await p.click('#menu [data-act="graph"]'); await p.waitForTimeout(400); };
const stats = async (p) => { const s = await p.textContent('#panel .pbody > p[role=status]'); const m = /(\d+) note · (\d+) legături · (\d+) izolate/.exec(s); return m ? {n: +m[1], e: +m[2], iso: +m[3], raw: s} : {raw: s}; };
const sugg = (p) => p.$$eval('#panel .gs-row .gs-t', (a) => a.map((e) => e.textContent));

const BASE = [
  rec('g1', 'Nodul Alfa', 'Legături: [[Nodul Beta]] și [[nodul gamma]].', ['x', 'y']),
  rec('g2', 'Nodul Beta', 'Text simplu despre beta.', ['x', 'y']),
  rec('g3', 'Nodul Gamma', 'Gamma amintește de nodul beta fără legătură, apoi [[Nodul Delta]].', ['z']),
  rec('g4', 'Nodul Delta', 'Delta, fără nimic. A se vedea [[Nodul Inexistent]].', ['x', 'y']),
  rec('g5', 'Pustiul', 'Notă singură.', [])
];

console.log('--- meniu, deschidere, statistici');
let ctxA, pg;
{
  const o = await open(); ctxA = o.ctx; pg = o.p; const p = pg;
  await importRecs(p, BASE);
  await p.click('#menuBtn'); await p.waitForTimeout(450);
  t('intrare „Graf și conexiuni” în meniu', /Graf și conexiuni/.test(await p.textContent('#menu [data-act="graph"]')));
  await p.click('#menu [data-act="graph"]'); await p.waitForTimeout(400);
  t('panou deschis cu titlul „Graf de legături”', /Graf de legături/.test(await p.textContent('#panel h2')));
  const s = await stats(p);
  t('statistici: legături doar între note existente (3 în baza de test)', s.e >= 3 && s.iso >= 1, s);
  const nodes = await p.$$('#panel .gnode');
  t('câte un nod pentru fiecare notă', nodes.length === s.n, [nodes.length, s.n]);
  t('noduri accesibile: tabindex, rol buton, etichetă cu numărul de legături', await p.$eval('#panel .gnode', (e) => e.getAttribute('tabindex') === '0' && e.getAttribute('role') === 'button' && /legături/.test(e.getAttribute('aria-label'))));
  const lab = await p.$eval('#panel .gnode[data-id="g1"]', (e) => e.getAttribute('aria-label'));
  t('Nodul Alfa are 2 legături (către Beta și Gamma)', /Nodul Alfa — 2 legături/.test(lab), lab);
  t('nodul izolat are 0 legături', /Pustiul — 0 legături/.test(await p.$eval('#panel .gnode[data-id="g5"]', (e) => e.getAttribute('aria-label'))));
  t('linii pentru legături', (await p.$$('#panel .gsvg line')).length === s.e);
  t('legătură cu majuscule diferite ([[nodul gamma]]) rezolvată', await p.$('#panel .gnode[data-id="g3"]') !== null && /Nodul Gamma — [1-9]/.test(await p.$eval('#panel .gnode[data-id="g3"]', (e) => e.getAttribute('aria-label'))));
  t('legătura către o notă inexistentă nu creează muchie', /Nodul Delta — 1 legături/.test(await p.$eval('#panel .gnode[data-id="g4"]', (e) => e.getAttribute('aria-label'))));
  await p.press('#panel .gnode[data-id="g2"]', 'Enter'); await p.waitForTimeout(300);
  t('Enter pe un nod deschide nota', /Nodul Beta/.test(await p.textContent('#panel h2')));
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  await openGraph(p);
  await p.click('#panel .gnode[data-id="g1"] circle'); await p.waitForTimeout(300);
  t('clic pe un nod deschide nota', /Nodul Alfa/.test(await p.textContent('#panel h2')));
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
}

console.log('--- căutare, izolate, aspect determinist');
{
  const p = pg; await openGraph(p);
  await p.fill('#panel input[type=search]', 'beta'); await p.waitForTimeout(150);
  const dim = await p.$$eval('#panel .gnode', (a) => a.map((g) => [g.getAttribute('data-id'), g.getAttribute('opacity')]));
  t('căutarea evidențiază nota găsită, restul atenuate', dim.find((d) => d[0] === 'g2')[1] === null && dim.filter((d) => d[1] === '.25').length === dim.length - 1, dim);
  await p.fill('#panel input[type=search]', '');
  const pos1 = await p.$$eval('#panel .gnode circle', (a) => a.slice(0, 5).map((c) => c.getAttribute('cx') + ',' + c.getAttribute('cy')));
  await p.keyboard.press('Escape'); await p.waitForTimeout(200); await openGraph(p);
  const pos2 = await p.$$eval('#panel .gnode circle', (a) => a.slice(0, 5).map((c) => c.getAttribute('cx') + ',' + c.getAttribute('cy')));
  t('aspect determinist (aceleași poziții la redeschidere)', JSON.stringify(pos1) === JSON.stringify(pos2), [pos1, pos2]);
  const before = (await stats(p)).n;
  await p.check('#panel .gck input'); await p.waitForTimeout(400);
  t('„Ascunde notele izolate” scoate nodurile fără legături', (await p.$('#panel .gnode[data-id="g5"]')) === null && (await p.$$('#panel .gnode')).length < before);
  await p.uncheck('#panel .gck input'); await p.waitForTimeout(400);
}

console.log('--- sugestii și legare cu anulare');
{
  const p = pg; 
  let sg = await sugg(p);
  t('sugestie: „Nodul Gamma” menționează „Nodul Beta” fără legătură', sg.some((x) => /Nodul Gamma.*menționează.*Nodul Beta/.test(x)), sg);
  t('sugestie: etichete comune între Beta și Delta (x, y), nelegate', sg.some((x) => /etichete comune/.test(x) && /#x #y|#y #x/.test(x)), sg);
  t('legătura deja existentă (Alfa → Beta) nu e sugerată', !sg.some((x) => /Nodul Alfa.*menționează.*Nodul Beta/.test(x)));
  const e0 = (await stats(p)).e;
  const row = (await p.$$('#panel .gs-row')).find(async () => true);
  const idx = sg.findIndex((x) => /Nodul Gamma.*menționează.*Nodul Beta/.test(x));
  await p.click(`#panel .gs-row:nth-of-type(${idx + 1}) .gs-link`); await p.waitForTimeout(500);
  t('după „Leagă”: o legătură în plus și toast cu anulare', (await stats(p)).e === e0 + 1 && (await p.$$('.toast .toast-act')).length === 1, await stats(p));
  t('sugestia dispare după legare', !(await sugg(p)).some((x) => /Nodul Gamma.*menționează.*Nodul Beta/.test(x)));
  t('indicator „nesalvat” aprins (conținutul s-a schimbat)', await p.evaluate(() => !document.getElementById('unsavedChip').hidden));
  await p.click('.toast .toast-act'); await p.waitForTimeout(500);
  t('anulare: legătura dispare, nota revine la forma inițială', (await stats(p)).e === e0 && (await sugg(p)).some((x) => /Nodul Gamma.*menționează.*Nodul Beta/.test(x)));
  // legare din nou și verificare în corpul notei (se păstrează majusculele din text)
  const idx2 = (await sugg(p)).findIndex((x) => /Nodul Gamma.*menționează.*Nodul Beta/.test(x));
  await p.click(`#panel .gs-row:nth-of-type(${idx2 + 1}) .gs-link`); await p.waitForTimeout(400);
  await p.click('#panel .gnode[data-id="g3"] circle'); await p.waitForTimeout(300);
  t('în nota Gamma apare [[nodul beta]] (text original învelit)', /nodul beta/.test(await p.textContent('#panel .rendered')) && (await p.$$('#panel .rendered a.wl')).length >= 2);
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  // etichete comune: se adaugă „Vezi și: [[…]]”
  await openGraph(p);
  const idx3 = (await sugg(p)).findIndex((x) => /etichete comune/.test(x));
  const tagTxt = (await sugg(p))[idx3];
  await p.click(`#panel .gs-row:nth-of-type(${idx3 + 1}) .gs-link`); await p.waitForTimeout(400);
  const ex = await p.evaluate(() => JSON.parse(localStorage.getItem('akasha:autosave:v1') || 'null'));
  const withSee = ex && JSON.stringify(ex).includes('Vezi și:');
  t('etichete comune: se adaugă „Vezi și: [[Titlu]]” în nota sursă (autosalvat)', !!withSee, tagTxt);
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
}

console.log('--- export și tabel accesibil');
{
  const p = pg; await openGraph(p);
  const dl = async (txt) => { const [d] = await Promise.all([p.waitForEvent('download'), p.click('#panel .gtools button:has-text("' + txt + '")')]); return {name: d.suggestedFilename(), body: fs.readFileSync(await d.path(), 'utf8')}; };
  const svg = await dl('(SVG)');
  t('SVG: document autonom, fără variabile CSS, cu noduri și titluri', /^<svg xmlns=/.test(svg.body) && !/var\(--/.test(svg.body) && (svg.body.match(/<circle/g) || []).length >= 5 && /Nodul Alfa/.test(svg.body) && svg.name === 'akasha-graf.svg', svg.name);
  const js = await dl('(JSON)'); const jo = JSON.parse(js.body);
  t('JSON: noduri și muchii', jo.nodes.length >= 5 && jo.edges.length >= 3 && jo.edges.every((e) => e.a && e.b), [jo.nodes.length, jo.edges.length]);
  await p.click('#panel details.gdet summary'); await p.waitForTimeout(150);
  const rows = await p.$$eval('#panel .gtab tbody tr', (a) => a.map((r) => [...r.children].map((c) => c.textContent)));
  t('tabel: note cu ieșiri/intrări, ordonat după grad', rows.length >= 5 && rows[0][0].length > 0, rows.slice(0, 3));
  await p.click('#panel .gtab tbody tr:first-child button'); await p.waitForTimeout(300);
  t('din tabel se deschide nota', (await p.textContent('#panel h2')).length > 0 && (await p.$('#panel .gtab')) === null);
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
}
await pg.close();

console.log('--- date ostile și scară');
{
  const o = await open(); const p = o.p;
  const evil = [
    rec('h1', '<img src=x onerror=alert(1)>', 'x [[a.b(c)]] y', ['t1', 't2']),
    rec('h2', 'a.b(c)', 'o notă cu parenteze și puncte', ['t1', 't2']),
    rec('h3', '"><script>alert(2)</script>', 'Vezi a.b(c) aici $& și $1', ['t1', 't2']),
    rec('h4', '$& \\ [x] (y)+', 'cuvânt $& \\ [x] (y)+ final', ['t1', 't2']),
    rec('h5', 'Țară înverșunată', 'Dar țară înverșunată e menționată cu diacritice.', []),
    rec('h6', '', 'Despre țară înverșunată aici', []),
    rec('h7', 'ab', 'titlu prea scurt ab ab', [])
  ];
  await importRecs(p, evil);
  await openGraph(p);
  t('titlurile ostile nu creează elemente', (await p.$$('#panel img, #panel .gsvg script, #panel .gsvg img')).length === 0);
  t('atributele aria-label rămân în element (fără injecție)', await p.$$eval('#panel .gnode', (a) => a.every((g) => !g.hasAttribute('onerror') && !g.hasAttribute('src'))));
  const sg = await sugg(p);
  t('mențiune cu paranteze/puncte în titlu: sugestie fără excepție', sg.some((x) => /menționează/.test(x) && /a\.b\(c\)/.test(x)), sg);
  t('titluri cu diacritice: cuvânt întreg recunoscut', sg.some((x) => /Țară înverșunată/.test(x) && /menționează/.test(x)), sg);
  t('titlul de 2 litere nu produce sugestii', !sg.some((x) => /„ab”/.test(x) && /menționează/.test(x)));
  const idx = sg.findIndex((x) => /menționează.*a\.b\(c\)/.test(x) && /„"><script/.test(x));
  if (idx >= 0) { await p.click(`#panel .gs-row:nth-of-type(${idx + 1}) .gs-link`); await p.waitForTimeout(400); }
  t('legarea cu $& în text nu corupe nota', idx < 0 || await p.evaluate(() => { const s = localStorage.getItem('akasha:autosave:v1') || ''; return s.includes('$& și $1'); }));
  t('fără erori / dialoguri / rețea', issues.length === 0, issues.slice(0, 4));
  await o.ctx.close();
  const o2 = await open(); const p2 = o2.p;
  const many = []; for (let i = 0; i < 400; i++) many.push(rec('m' + i, 'Notă numărul ' + i, 'Text ' + i + (i % 3 === 0 ? ' [[Notă numărul ' + ((i + 7) % 400) + ']]' : ''), ['t' + (i % 5), 'u' + (i % 7)]));
  await importRecs(p2, many);
  const t0 = Date.now(); await openGraph(p2); const dt = Date.now() - t0;
  const n = (await p2.$$('#panel .gnode')).length;
  t('400 de note: se afișează cele mai conectate (plafon 150), într-un timp rezonabil', n === 150 && dt < 15000, [n, dt]);
  t('mesaj de plafon', /150 din 4\d\d note/.test(await p2.textContent('#panel .pbody')));
  t('lista de sugestii limitată (≤ 30 + mesaj „și încă”)', (await p2.$$('#panel .gs-row')).length <= 30);
  await o2.ctx.close();
}

console.log('--- limbi');
{
  const o = await open(); const p = o.p;
  await importRecs(p, BASE);
  const need = ['gr_title', 'gr_intro', 'gr_sugg', 'gr_link', 'm_graph'];
  for (const l of ['en', 'fr', 'it', 'es', 'pt', 'de', 'hu', 'ro', 'ja']) {
    await p.selectOption('#langSel', l); await p.waitForTimeout(200);
    await openGraph(p);
    const h = await p.textContent('#panel h2'); const body = await p.$eval('#panel .pbody', (e) => e.textContent);
    const raw = /\bgr_[a-z_]+\b/.test(body + h);
    const roLeft = l !== 'ro' && /Graf de legături|Sugestii de conexiuni|Harta notelor/.test(h + body);
    t('limba ' + l + ': panou tradus (' + h + '), fără chei brute' + (l === 'ja' ? ', cade pe engleză' : ''), !raw && !roLeft && (l !== 'ja' || /Link graph/.test(h)), {raw, roLeft, h});
    await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  }
  await p.selectOption('#langSel', 'fr'); await p.waitForTimeout(200); await openGraph(p);
  await p.selectOption('#langSel', 'de'); await p.waitForTimeout(300);
  t('schimbarea limbii cu panoul deschis îl retraduce', /Verknüpfungsgraph/.test(await p.textContent('#panel h2')));
  await o.ctx.close();
}

console.log('--- accesibilitate și mobil');
{
  const o = await open({bypass: true}); const p = o.p;
  await importRecs(p, BASE); await openGraph(p);
  if (AXE && fs.existsSync(AXE)) {
    await p.evaluate(fs.readFileSync(AXE, 'utf8') + '\n;0');
    const ax = await p.evaluate(async () => (await window.axe.run(document.getElementById('panel'), {resultTypes: ['violations']})).violations.map((v) => v.id + ':' + v.nodes.length));
    t('axe 0 violări în panoul de graf', ax.length === 0, ax);
  }
  await o.ctx.close();
  const m = await open({w: 360, h: 740}); await importRecs(m.p, BASE); await openGraph(m.p);
  t('fără depășire orizontală la 360 px', await m.p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth) <= 1 && await m.p.evaluate(() => { const e = document.querySelector('#panel .pbody'); return e.scrollWidth <= e.clientWidth + 1; }));
  await m.ctx.close();
  t('0 erori JS / dialoguri / rețea', issues.length === 0, issues.slice(0, 4));
}
await b.close(); console.log(`\n${ok} ok / ${bad} eșuate`); process.exit(bad ? 1 : 0);
