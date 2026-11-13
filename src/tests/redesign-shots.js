const ROOT = require('path').resolve(__dirname, '../..');   // корень репозитория
// образец 2: заставка, главный экран, поглаживание, главы
const {chromium} = require('playwright');
(async () => {
  const W = +(process.argv[2] || 393), H = +(process.argv[3] || 852), tag = process.argv[4] || W;
  const b = await chromium.launch(), p = await (await b.newContext({viewport: {width: W, height: H}, deviceScaleFactor: 2})).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + ROOT + '/src/redesign/sample.html'); await p.waitForTimeout(1800);
  await p.screenshot({path: `${__dirname}/v3-splash-${tag}.png`});
  await p.click('#start'); await p.waitForTimeout(1800); await p.screenshot({path: `${__dirname}/v3-home-${tag}.png`});
  const a = await p.locator('#catA').boundingBox(); await p.mouse.click(a.x + a.width*.44, a.y + a.height*.35); await p.waitForTimeout(600);
  const l = await p.locator('#catL').boundingBox(); await p.mouse.move(l.x + l.width*.2, l.y + l.height*.5); await p.mouse.down(); for (let i = 0; i < 8; i++){ await p.mouse.move(l.x + l.width*(i % 2 ? .2 : .5), l.y + l.height*.5 + i*2, {steps: 4}); }
  await p.waitForTimeout(120); await p.screenshot({path: `${__dirname}/v3-pet-${tag}.png`}); await p.mouse.up();
  console.log('purr', await p.textContent('#purrN'));
  await p.click('.tab[data-v="v-map"]'); await p.waitForTimeout(1200); await p.screenshot({path: `${__dirname}/v3-map-${tag}.png`});
  console.log('ERR', errs.join('|') || 'none'); await b.close();
})();
