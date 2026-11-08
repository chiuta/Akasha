// Akasha: data ultimei reîncarnări (cheie localStorage + text lângă indicatorul „nesalvat”). Rulare: node tests/lastreinc.test.mjs
import {createRequire} from 'module';
import path from 'path';
import {fileURLToPath} from 'url';
const require = createRequire(process.env.PW_ROOT || import.meta.url);
const {chromium} = require('playwright');
const INDEX = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'index.html');
let ok = 0, bad = 0;
const t = (n, c, x) => { if (c) { ok++; console.log('  ok  ' + n); } else { bad++; console.log('  FAIL ' + n + (x ? ' :: ' + JSON.stringify(x) : '')); } };
const b = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox']});
for (const [L, label] of [['en', 'Last reincarnation:'], ['ro', 'Ultima reîncarnare:'], ['hu', 'Utolsó reinkarnáció:']]) {
  const ctx = await b.newContext({viewport: {width: 1000, height: 800}, serviceWorkers: 'block', locale: L, acceptDownloads: true});
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.route(/^https?:/, (r) => r.abort());
  await p.goto('file://' + INDEX); await p.waitForTimeout(1200);
  await p.selectOption('#langSel', L); await p.waitForTimeout(300);
  t(L + ': fără dată înainte de prima reîncarnare', await p.evaluate(() => document.getElementById('lastReinc').textContent === ''));
  await p.evaluate(() => { window.__akasha.getState().records.push({id: 'lr1', title: 'T', cat: 'gand', res: 3, tags: [], created: new Date().toISOString(), updated: new Date().toISOString(), body: 'x'}); });
  const dl = p.waitForEvent('download', {timeout: 5000});
  await p.evaluate(() => document.getElementById('dlBtn').click()); await dl;
  const r = await p.evaluate(() => ({k: localStorage.getItem('akasha:lastreinc:v1'), txt: document.getElementById('lastReinc').textContent}));
  t(L + ': cheia ISO salvată', /^\d{4}-\d\d-\d\dT/.test(r.k || ''), r);
  t(L + ': text „' + label + ' <dată>” (lang=' + L + ')', r.txt.startsWith(label + ' ') && r.txt.length > label.length + 4, r);
  t(L + ': fără erori', errs.length === 0, errs);
  await ctx.close();
}
await b.close();
console.log(`\n${ok} reușite, ${bad} eșuate`); process.exit(bad ? 1 : 0);
