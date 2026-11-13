const ROOT = require('path').resolve(__dirname, '../..');   // корень репозитория
// награды: переворот карточки, видимость сторон
const {open} = require('./helper.js');
(async()=>{
  const st = {v4:1,v5:1,v9:1,lastDay:new Date().toDateString(),lastSeen:Date.now(),songSeen:1,salvJoke:1,giftDay:new Date().toISOString().slice(0,10),pets:120,petA:60,petL:60,ach:{pet1:Date.now(),both:Date.now(),pet100:Date.now()},achSeen:{pet1:1,both:1,pet100:1}};
  const {b,p,errs} = await open(ROOT + '/index.html', {state: JSON.stringify(st)});
  await p.setViewportSize({width:393, height:852});
  await p.click('#btnStart'); await p.waitForTimeout(1200);
  await p.evaluate(() => showView('v-awards')); await p.waitForTimeout(1800);
  await p.click('.acard.got >> nth=0'); 
  for (const ms of [40, 160, 900]){ await p.waitForTimeout(ms === 40 ? 40 : ms - 40);
    console.log(ms, await p.evaluate(() => { const c = document.querySelector('.acard.flip'); return c ? [getComputedStyle(c.querySelector('.front')).visibility, getComputedStyle(c.querySelector('.back')).visibility].join('/') : 'no flip'; })); }
  const r = await p.evaluate(() => { const c = document.querySelector('.acard.flip').getBoundingClientRect(); return [c.left, c.top, c.width, c.height]; });
  await p.screenshot({path: __dirname + '/aw-flip.png', clip: {x: r[0] - 10, y: r[1] - 10, width: r[2] + 20, height: r[3] + 20}});
  console.log('ERRORS', errs.join('\n') || 'none'); await b.close();
})();
