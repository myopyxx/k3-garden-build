const ROOT = require('path').resolve(__dirname, '../..');   // корень репозитория
// второй спринт: док и значки на трёх размерах, камера по вкладкам, переключатель стекла, порыв в уровне 5, затвор в уровне 9
const {open} = require('./helper.js');
const SP = __dirname + '/';
(async () => {
  const today = new Date().toDateString();
  const st = {v4:1, v5:1, v9:1, lastDay: today, lastSeen: Date.now(), songSeen: 1, salvJoke: 1, giftDay: today, teamPicked: 1, pets: 60, drops: 500, stars: {1:3,2:3,3:3,4:3,5:2,6:3,7:2,8:2},
    owned: {bow:1,cape:1,ring:1,tiara:1,wreath:1,shades:1,mask:1}, giftBox: {0:{n:1,first:Date.now()},2:{n:2,first:Date.now()},4:{n:1,first:Date.now()},6:{n:1,first:Date.now()}}, seenPh: 9};
  for (const [W, H] of [[393, 852], [375, 667], [440, 956]]){
    const {b, p, errs} = await open(ROOT + '/index.html', {state: JSON.stringify(st)});
    await p.setViewportSize({width: W, height: H}); await p.click('#btnStart'); await p.waitForTimeout(1600);
    const geo = await p.evaluate(() => { const r = s => document.querySelector(s).getBoundingClientRect(), d = r('#dock'), m = r('#purr'), t = r('#tabs'), c = r('#duo');
      return {dock: Math.round(d.height), gapToTabs: Math.round(t.top - d.bottom), catsH: Math.round(c.height), btnMin: Math.min(...[...document.querySelectorAll('#dock .dk')].map(x => Math.round(x.getBoundingClientRect().height))), lowfx: app.classList.contains('lowfx'), rays: getComputedStyle(document.querySelector('#rays')).opacity}; });
    console.log(W + '×' + H, JSON.stringify(geo));
    await p.screenshot({path: SP + `s2-home-${W}.png`});
    if (W === 393){
      // камера: сдвиг слоёв на вкладках
      const cam = {}; for (const v of ['v-home', 'v-map', 'v-album', 'v-awards']){ await p.evaluate(v => showView(v), v); await p.waitForTimeout(1500); cam[v] = await p.evaluate(() => getComputedStyle(document.querySelector('#world .ridge.near')).translate); }
      console.log('камера (ближний план):', JSON.stringify(cam));
      await p.evaluate(() => showView('v-home')); await p.waitForTimeout(900);
      await p.click('#btnWardrobe'); await p.waitForTimeout(1000); await p.screenshot({path: SP + 's2-wardrobe.png'});
      console.log('значки гардероба:', await p.evaluate(() => document.querySelectorAll('.wit .e svg.icv').length), 'из 7'); await p.click('#sheetDone'); await p.waitForTimeout(700);
      // шкатулка подарков
      await p.evaluate(() => showView('v-album')); await p.waitForTimeout(900);
      await p.evaluate(() => { const li = [...document.querySelectorAll('#v-album .li')].find(x => /Шкатулка/.test(x.textContent)); li && li.click(); }); await p.waitForTimeout(1000);
      console.log('значки шкатулки:', await p.evaluate(() => document.querySelectorAll('.gslot .e svg.icv').length)); await p.screenshot({path: SP + 's2-giftbox.png'});
      await p.evaluate(() => closeSheet()); await p.waitForTimeout(600); await p.evaluate(() => showView('v-home')); await p.waitForTimeout(700);
      // переключатель стекла
      await p.click('#btnSettings'); await p.waitForTimeout(900);
      const sw = p.locator('[role=switch][aria-label="Упрощённые эффекты, экономия заряда"]'); await sw.scrollIntoViewIfNeeded(); await p.screenshot({path: SP + 's2-settings.png'});
      await sw.click(); await p.waitForTimeout(300); const off = await p.evaluate(() => ({lowfx: app.classList.contains('lowfx'), glass: S.glass}));
      await sw.click(); await p.waitForTimeout(300); console.log('стекло выкл:', JSON.stringify(off), '| снова вкл:', JSON.stringify(await p.evaluate(() => ({lowfx: app.classList.contains('lowfx'), glass: S.glass}))));
      await p.click('#sheetDone'); await p.waitForTimeout(600);
      // уровень 5: бот прыгает через брёвна и за рыбками
      await p.evaluate(() => startLevel(LEVELS[4])); await p.waitForTimeout(900); await p.click('.overlay .go'); await p.waitForTimeout(300);
      let shot = false, res = null; const t0 = Date.now();
      while (Date.now() - t0 < 45000){
        const r = await p.evaluate(() => { const a = document.querySelector('#garea'); const s = a && a.__run ? a.__run() : null; if (!s) return null;
          const dx = l => l.x - s.CX, air = s.speed*.72, log = s.logs.find(l => dx(l) > -30 && dx(l) <= s.speed*.36 - 14), clear = k => !s.logs.some(l => dx(l) > -40 && dx(l) < air*k + 70);
          const fishUp = s.fish.find(f => f.x - s.CX > s.speed*.2 && f.x - s.CX < s.speed*.4);
          if (s.onGround && (log || (fishUp && clear(1)))) a.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true}));
          else if (!s.onGround && s.gust === 1 && s.y > -60 && fishUp && clear(1.6)) a.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true}));
          return {gust: s.gust, got: s.got, lives: s.lives, run: s.running}; });
        if (!r || !r.run){ res = r; if (Date.now() - t0 > 3000) break; }
        if (r && r.gust === 1 && !shot){ shot = true; await p.waitForTimeout(1500); await p.screenshot({path: SP + 's2-gust.png'}); }
        await p.waitForTimeout(25); }
      console.log('уровень 5:', (await p.textContent('#rText')).replace(/\s+/g, ' ').trim().slice(0, 150));
      await p.evaluate(() => exitLevel()); await p.waitForTimeout(800);
      // уровень 9: один кадр, затвор
      await p.evaluate(() => startLevel(LEVELS[8])); await p.waitForTimeout(900); await p.click('.overlay .go'); await p.waitForTimeout(1200);
      const a = await p.locator('#garea').boundingBox(); await p.mouse.move(a.x + a.width/2, a.y + a.height*.8); await p.mouse.down(); await p.waitForTimeout(1600); await p.mouse.up();
      await p.waitForTimeout(600); console.log('уровень 9 идёт, ошибок пока:', errs.length); await p.evaluate(() => exitLevel()); await p.waitForTimeout(600);
    }
    console.log(W, 'ERRORS', errs.length ? errs.join('\n') : 'none'); await b.close();
  }
})();
