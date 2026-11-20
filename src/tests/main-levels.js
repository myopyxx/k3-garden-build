const ROOT = require('path').resolve(__dirname, '../..');   // корень репозитория
// боты для переделанных уровней 2, 3, 4, 6. Аргумент: список уровней, режим perfect|human
const {open} = require('./helper.js');
const SP = __dirname + '/';
const only = (process.argv[2] || '2,3,4,6').split(',').map(Number), mode = process.argv[3] || 'perfect';
(async()=>{
  const {b,p,errs} = await open(ROOT + '/index.html');
  await p.setViewportSize({width: 393, height: 852});
  await p.click('#btnStart'); await p.waitForTimeout(1300);
  const run = async n => { await p.evaluate(n => { for (let i=1;i<n;i++) S.stars[i] = Math.max(S.stars[i]||0, 1); save(); startLevel(LEVELS[n-1]); }, n); await p.waitForTimeout(900);
    await p.screenshot({path: SP + `lv${n}-intro.png`}); await p.click('.overlay .go'); await p.waitForTimeout(400); };
  const result = async (n, ms) => { const skip = p.getByRole('button', {name: 'К результату'});
    const result = p.locator('#result.on');
    await skip.or(result).first().waitFor({timeout: ms});
    if (await skip.isVisible()) await skip.click();
    await result.waitFor(); await p.waitForTimeout(2600); const t = await p.textContent('#rTitle'), x = await p.textContent('#rText'); console.log(`L${n} [${mode}]:`, t, '|', x); await p.screenshot({path: SP + `lv${n}-result-${mode}.png`}); };
  const shotAt = (n, ms, name) => setTimeout(() => p.screenshot({path: SP + `lv${n}-${name}.png`}).catch(() => {}), ms);
  if (only.includes(2)){
    await run(2); shotAt(2, 2600, 'show'); shotAt(2, 30000, 'four');
    let rounds = 0, wrongLeft = mode === 'human' ? 2 : 0;
    while (rounds < 7){
      await p.waitForFunction(() => { const s = document.querySelector('#garea').__shell; return s && (s.state === 'pick' || s.state === 'end'); }, null, {timeout: 30000});
      if (await p.evaluate(() => document.querySelector('#garea').__shell.state) === 'end') break;
      if (rounds === 5) await p.screenshot({path: SP + 'lv2-pick.png'});
      const idx = await p.evaluate(w => { const g = document.querySelector('#garea').__shell.gobs; let i = g.findIndex(x => x.ring); if (w) i = (i + 1) % g.length; return i; }, wrongLeft > 0 && rounds % 3 === 1);
      if (wrongLeft > 0 && rounds % 3 === 1) wrongLeft--;
      await p.click(`.gob >> nth=${idx}`); rounds++;
      await p.waitForTimeout(600);
    }
    await result(2, 20000);
  }
  if (only.includes(3)){
    await run(3); shotAt(3, 1500, 'play');
    const t0 = Date.now(); let shots = 0;
    while (Date.now() - t0 < 75000){
      const st = await p.evaluate(() => { const a = document.querySelector('#garea').__astral; if (!a) return null; return {alive: a.alive, found: a.found, x: a.ali.x - a.pan, y: a.ali.y, W: a.W, H: a.H, pan: a.pan, max: a.view.querySelector('.aroom').offsetWidth - a.W}; });
      if (!st || !st.alive) break;
      const react = mode === 'human' ? 700 : 150;
      if ((st.x < st.W*.22 && st.pan > 2) || (st.x > st.W*.78 && st.pan < st.max - 2)){ /* светим к краю, чтобы комната поехала */
        await p.evaluate(x => document.querySelector('#garea').__astral.aim(x, 400), st.x < st.W*.22 ? 8 : st.W - 8); await p.waitForTimeout(120); continue; }
      await p.evaluate(([x, y]) => document.querySelector('#garea').__astral.aim(x, y + 6), [st.x, st.y]);
      if (shots === 0){ await p.waitForTimeout(250); await p.screenshot({path: SP + 'lv3-lit.png'}); shots++; }
      await p.waitForTimeout(react);
      const box = await p.evaluate(() => { const r = document.querySelector('#garea .apeek.ali').getBoundingClientRect(); return [r.left + r.width/2, r.top + r.height*.35]; });
      await p.mouse.click(box[0], box[1]); await p.waitForTimeout(250);
      if (st.found === 1 && shots === 1){ await p.waitForTimeout(500); await p.screenshot({path: SP + 'lv3-surge.png'}); shots++; }
    }
    await result(3, 15000);
  }
  if (only.includes(4)){
    await run(4); shotAt(4, 4000, 'play'); shotAt(4, 35000, 'swap');
    /* человек иногда ошибается и реагирует не мгновенно */
    await p.evaluate(m => { const s = document.querySelector('#garea').__sort; let k = 0; window.__sb = setInterval(() => { if (!s.alive) return; const it = s.items.filter(i => !i.gone).sort((a, b) => b.y - a.y)[0]; if (!it) return;
      const H = document.querySelector('#garea').clientHeight; if (m === 'human' && it.y < H*.38) return; k++; const wrong = m === 'human' && k % 9 === 4; s.toss(wrong ? !it.d[2] : it.d[2]); }, m === 'human' ? 650 : 250); }, mode);
    await p.waitForTimeout(3000);
    /* проверка свайпа пальцем: смахнуть вправо */
    await result(4, 90000); await p.evaluate(() => clearInterval(window.__sb));
  }
  if (only.includes(6)){
    await run(6); shotAt(6, 6000, 'day'); shotAt(6, 14500, 'hold'); shotAt(6, 24500, 'night');
    await p.evaluate(m => { const G = document.querySelector('#garea').__garden; const seen = new WeakMap();
      window.__gb = setInterval(() => { if (!G.alive) return; const now = performance.now();
        G.thieves.forEach(t => { if (t.done) return; if (!seen.has(t)) seen.set(t, now); if (now - seen.get(t) > (m === 'human' ? 700 : 200) && !(m === 'human' && Math.random() < .3)) t.el.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true})); });
        G.bushes.forEach(b => { const o = b.item; if (!o || o.kind === 'bat') return; if (!seen.has(o)) seen.set(o, now); if (now - seen.get(o) < (m === 'human' ? 420 : 120)) return; if (m === 'human' && Math.random() < .015) return;
          if (o.kind === 'hold'){ if (!o.__h){ o.__h = 1; o.el.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true})); setTimeout(() => dispatchEvent(new PointerEvent('pointerup')), 700); } }
          else o.el.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true})); });
      }, 60); }, mode);
    await result(6, 70000); await p.evaluate(() => clearInterval(window.__gb));
  }
  console.log('ERRORS', errs.length ? errs.join('\n') : 'none'); await b.close();
})();
