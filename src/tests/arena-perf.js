const ROOT = require('path').resolve(__dirname, '../..');   // корень репозитория
// гипотезы о рывках: HUD, размер холста, фильтр вспышки
const {chromium} = require('playwright');
(async () => {
  const mode = process.argv[2] || 'surv', variant = process.argv[3] || 'base', dsf = +(process.argv[4] || 2);
  const b = await chromium.launch(), ctx = await b.newContext({viewport: {width: 393, height: 852}, deviceScaleFactor: dsf});
  const p = await ctx.newPage(); await p.goto(`file://${ROOT}/arena/index.html?auto=1&mode=${mode}`); await p.waitForTimeout(1500);
  await p.evaluate(v => {
    if (v === 'nohud') MODES[G.mode].hud = () => {};
    if (v === 'nofilter'){ const D = window.drawFighter; window.drawFighter = function(c, f, t){ const fl = f.flash; f.flash = 0; D(c, f, t); f.flash = fl; }; }
    if (v === 'norender'){ window.render = () => {}; }
    if (v === 'nofx'){ setInterval(() => { G.parts.length = 0; G.nums.length = 0; }, 16); }
  }, variant);
  await p.waitForTimeout(800);
  const r = await p.evaluate(() => new Promise(res => { const ft = []; let last = performance.now(); const t0 = last;
    const loop = () => { const t = performance.now(); ft.push(t - last); last = t; if (t - t0 < 5000) requestAnimationFrame(loop); else { const s = ft.slice().sort((a, b) => a - b); res({fps: (ft.length/5).toFixed(1), p95: s[Math.floor(s.length*.95)].toFixed(0), long: ft.filter(x => x > 50).length}); } };
    requestAnimationFrame(loop); }));
  console.log(mode, variant, 'dsf' + dsf, JSON.stringify(r)); await b.close();
})();
