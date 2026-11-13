const ROOT = require('path').resolve(__dirname, '../..');   // корень репозитория
// арена: бот играет за игрока в каждом режиме до итога
const {chromium} = require('playwright');
(async () => {
  const modes = (process.argv[2] || 'gems,surv,waves').split(','), W = +(process.argv[3] || 393), H = +(process.argv[4] || 852);
  const b = await chromium.launch();
  for (const mode of modes){
    const ctx = await b.newContext({viewport: {width: W, height: H}, deviceScaleFactor: 2, hasTouch: true, isMobile: true});
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
    await p.goto(`file://${ROOT}/arena/index.html?auto=1&mode=${mode}${process.env.Q || ""}`);
    const t0 = Date.now(); let shot = 0;
    while (Date.now() - t0 < 260000){
      await p.waitForTimeout(2000);
      if (shot < 2 && Date.now() - t0 > (shot ? 25000 : 7000)){ await p.screenshot({path: __dirname + `/ar-${mode}-${shot}-${W}.png`}); shot++; }
      const over = await p.evaluate(() => document.querySelector('#resOv').classList.contains('on'));
      if (over) break;
    }
    const res = await p.evaluate(() => ({t: Math.round(G.t), title: $('#resT').textContent, text: $('#resP').textContent, cups: $('#resCups').textContent,
      stats: [...document.querySelectorAll('#resStats div')].map(d => d.textContent).join(' | '), over: G.over, me: {hp: Math.round(G.me.hp), kos: G.me.kos, dmg: G.me.dmgOut},
      extra: G.mode === 'gems' ? teamGems(1) + ':' + teamGems(2) : G.mode === 'waves' ? 'wave ' + G.wave + ' lives ' + G.lives : 'alive ' + G.fighters.filter(f => !f.dead).length}));
    await p.screenshot({path: __dirname + `/ar-${mode}-end-${W}.png`});
    console.log(mode, JSON.stringify(res)); console.log('ERRORS', errs.length ? errs.slice(0, 5).join('\n') : 'none');
    await ctx.close();
  }
  await b.close();
})();
