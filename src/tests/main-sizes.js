const ROOT = require('path').resolve(__dirname, '../..');   // корень репозитория
const {open} = require('./helper.js');
(async()=>{
  for (const [W, H] of [[375, 667], [440, 956]]){
  const {b,p,errs} = await open(ROOT + '/index.html');
  await p.setViewportSize({width: W, height: H});
  await p.click('#btnStart'); await p.waitForTimeout(1200);
  for (const [n, ms, prep] of [[2, 33000, null], [3, 2500, null], [4, 9000, null], [6, 23500, null]]){
    await p.evaluate(n => { for (let i=1;i<n;i++) S.stars[i] = 1; startLevel(LEVELS[n-1]); }, n); await p.waitForTimeout(900);
    if (n === 4) await p.screenshot({path: __dirname + `/sm-${W}-intro4.png`});
    await p.click('.overlay .go'); await p.waitForTimeout(ms);
    await p.screenshot({path: __dirname + `/sm-${W}-${n}.png`}); await p.evaluate(() => exitLevel()); await p.waitForTimeout(700);
  }
  console.log(W, 'ERRORS', errs.join('\n') || 'none'); await b.close(); }
})();
