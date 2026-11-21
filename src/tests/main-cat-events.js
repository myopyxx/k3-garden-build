// The love-event tails must stay attached to the moving cats, including after rotation.
const assert = require('node:assert/strict');
const {open} = require('./helper');
const root = require('node:path').resolve(__dirname, '../..');

(async () => {
  const {b,p,errs} = await open(root + '/index.html');
  try {
    await p.click('#btnStart');
    await p.waitForTimeout(1200);
    await p.evaluate(() => SPECIALS.find(s => s.id === 'love').run());
    await p.waitForSelector('.love-tail path[d]');
    for (const width of [320, 430]) {
      await p.setViewportSize({width,height:800});
      await p.waitForFunction(() => {
        const tails = [...document.querySelectorAll('.heart-tails .love-tail')];
        return tails.length === 2 && tails.every((tail,i) => {
          const who = i === 0 ? 'lapula' : 'alisa';
          const actual = new DOMPoint(145,199).matrixTransform(tail.getScreenCTM());
          const cat = document.querySelector('#duo [data-cat="'+who+'"] .tail');
          const joint = new DOMPoint(145,199).matrixTransform(cat.getScreenCTM());
          return Math.hypot(actual.x-joint.x,actual.y-joint.y) < 2.5;
        });
      },null,{timeout:2500});
    }
    await p.waitForSelector('.heart-tails',{state:'detached',timeout:8000});
    assert.equal(await p.locator('#duo .tail.curling').count(),0);
    assert.deepEqual(errs,[]);
    console.log('Heart tails follow both cats at 320 and 430 px and return to rest.');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode=1; });
