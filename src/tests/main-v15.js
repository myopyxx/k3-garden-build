const ROOT = require('path').resolve(__dirname, '../..');   // корень репозитория
// v15: подсказка первого поглаживания, копилка сезона 2, парные сценки по часу и погоде, розовый шум дождя, тембры шкатулки
const {open} = require('./helper.js');
(async () => {
  const today = new Date(), T = Date.now();
  const base = {v4:1, v5:1, v9:1, lastDay: today.toDateString(), lastSeen: T, songSeen: 1, salvJoke: 1, giftDay: today.toDateString(), teamPicked: 1, diary: {}, seenPh: 9, owned: {}, wearA: {}, wearL: {}};
  let fail = 0; const ok = (name, cond, info = '') => { if (!cond) fail++; console.log((cond ? 'ok  ' : 'FAIL') + ' ' + name + (info ? '  ' + info : '')); };
  const start = async p => { await p.setViewportSize({width: 393, height: 852}); await p.waitForTimeout(1200); await p.click('#btnStart'); await p.waitForTimeout(1500); };
  const calm = p => p.evaluate(() => { if (typeof busyAct !== 'undefined' && busyAct) endBusy(); try { sessionStorage.removeItem('alisa-enc'); } catch(e){} });

  // 1. Новый игрок: у Алисы дышит кольцо, первое поглаживание его гасит и запоминается
  {
    const {b, p, errs} = await open(ROOT + '/index.html', {state: JSON.stringify(Object.assign({}, base, {pets: 0, drops: 0, stars: {}}))});
    await start(p);
    const h = await p.evaluate(() => { const e = document.querySelector('#duo .onb-halo'); return e && {par: e.parentElement.dataset.cat, anim: getComputedStyle(e).animationName, txt: e.textContent, pe: getComputedStyle(e).pointerEvents}; });
    ok('новому игроку у Алисы есть кольцо без текста', h && h.par === 'alisa' && h.anim === 'onbBreath' && h.txt === '' && h.pe === 'none', JSON.stringify(h));
    await p.screenshot({path: __dirname + '/v15-halo.png'});
    ok('флаг ещё не выставлен', await p.evaluate(() => S.seenFirstPet === false));
    await calm(p);
    await p.click('#duo .pet[data-cat="alisa"]'); await p.waitForTimeout(700);
    ok('после первого поглаживания кольцо убрано', await p.evaluate(() => !document.querySelector('#duo .onb-halo')));
    ok('флаг сохранён', await p.evaluate(() => S.seenFirstPet === true && JSON.parse(localStorage.getItem('alisa-diaries-v3')).seenFirstPet === true));
    ok('без ошибок (1)', errs.length === 0, errs.join(' | '));
    await b.close();
  }
  // 2. У тех, кто уже играл, кольца нет: по поглаживаниям, по каплям и по звёздам
  for (const [name, add] of [['поглаживания', {pets: 12, drops: 0, stars: {}}], ['капли', {pets: 0, drops: 5, stars: {}}], ['звёзды', {pets: 0, drops: 0, stars: {1: 2}}]]){
    const {b, p} = await open(ROOT + '/index.html', {state: JSON.stringify(Object.assign({}, base, add))});
    await start(p);
    ok('есть прогресс (' + name + '): кольца нет, флаг true', await p.evaluate(() => !document.querySelector('#duo .onb-halo') && S.seenFirstPet === true));
    await b.close();
  }

  // 3. Копилка сезона 2
  {
    const {b, p, errs} = await open(ROOT + '/index.html', {state: JSON.stringify(Object.assign({}, base, {pets: 300, drops: 40, stars: {1:3, 2:3, 3:3, 4:3, 5:3, 6:3, 7:3, 8:3, 9:3}, epi: 1}))});
    await start(p); await calm(p);
    ok('миграция: эпилог виден, значит первый сезон закрыт', await p.evaluate(() => S.season1Done === true && S.season2Jar === 0 && S.soundPreset === 'auto'));
    ok('пока есть что купить, капли идут в баланс', await p.evaluate(() => { const d = S.drops; earn(3); return S.drops === d + 3 && S.season2Jar === 0 && !jarMode(); }));
    await p.evaluate(() => { CONFIG.shop.forEach(it => S.bought[it.id] = 1); WEAR.forEach(w => { if (w.price) S.owned[w.id] = 1; }); save(); hud(); });
    const r = await p.evaluate(() => { const d = S.drops; earn(7); return {drops: S.drops - d, jar: S.season2Jar, mode: jarMode(), wallet: wallet()}; });
    ok('всё куплено: новые капли в копилке, баланс не растёт', r.drops === 0 && r.jar === 7 && r.mode && r.wallet === 7, JSON.stringify(r));
    await p.evaluate(() => hud()); await p.waitForTimeout(300);
    const chip = await p.evaluate(() => { const c = document.querySelector('#chipDrops'); return {jar: c.classList.contains('jar'), e: c.querySelector('.he').textContent, n: document.querySelector('#hDrops').textContent, role: c.getAttribute('role')}; });
    ok('чип в HUD показывает 💎 и 7', chip.jar && chip.e === '💎' && chip.n === '7' && chip.role === 'button', JSON.stringify(chip));
    await p.click('#chipDrops'); await p.waitForTimeout(900);
    const sh = await p.evaluate(() => { const s = document.querySelector('.sheet'); return s && {t: s.textContent, card: !!s.querySelector('.jarcard .n'), n: s.querySelector('.jarcard .n') && s.querySelector('.jarcard .n').textContent, say: !!s.querySelector('.jarsay span')}; });
    ok('нажатие на чип открывает карточку копилки', sh && /Копилка сезона 2/.test(sh.t) && sh.card && sh.n === '7' && sh.say, JSON.stringify(sh && {n: sh.n, say: sh.say}));
    await p.screenshot({path: __dirname + '/v15-jar.png'});
    await p.click('#sheetDone'); await p.waitForTimeout(800);
    await p.click('#btnShop'); await p.waitForTimeout(900);
    const row = await p.evaluate(() => { const s = document.querySelector('.sheet'); return s && /Копилка сезона 2/.test(s.textContent) && /7 капель/.test(s.textContent); });
    ok('в лавке есть строка копилки', !!row);
    await p.click('#sheetDone'); await p.waitForTimeout(800);
    await p.evaluate(() => { S.owned.bow = 0; delete S.owned.bow; hud(true); });
    ok('вернули покупку в список: капли снова идут в баланс', await p.evaluate(() => { const d = S.drops; earn(2); return S.drops === d + 2 && S.season2Jar === 7 && !jarMode(); }));
    ok('без ошибок (3)', errs.length === 0, errs.join(' | '));
    await b.close();
  }

  // 4. Парные сценки: правила по часу и погоде, защита от частых смен, запись в дневник
  {
    const {b, p, errs} = await open(ROOT + '/index.html', {state: JSON.stringify(Object.assign({}, base, {pets: 300, drops: 10, stars: {1:3, 2:3, 3:3}, epi: 0}))});
    await start(p); await calm(p);
    const run = (hour, rain, snow, rnd) => p.evaluate(([hour, rain, snow, rnd]) => {
      if (busyAct) endBusy(); specialBusy = false; try { sessionStorage.removeItem('alisa-enc'); } catch(e){}
      const RD = Date, RM = Math.random; window.Date = class extends RD { getHours(){ return hour; } }; Math.random = () => rnd;
      app.classList.toggle('rainy', rain); app.classList.toggle('snowy', snow);
      const res = pickTerraceEncounter(), kind = busyAct && busyAct.kind; window.Date = RD; Math.random = RM; return {res, kind}; }, [hour, rain, snow, rnd]);
    let r = await run(14, true, false, .9); ok('дождь днём: сцена «rain»', r.res && r.kind === 'rain', JSON.stringify(r));
    ok('у дождя падает капля, коты сдвинуты друг к другу', await p.evaluate(() => !!document.querySelector('#duo .vg-drop') && app.classList.contains('vg-lean')));
    await p.waitForTimeout(700);
    ok('взгляд котов идёт за каплей', await p.evaluate(() => [...document.querySelectorAll('#duo .cat')].every(c => c.style.getPropertyValue('--gy') !== '')));
    ok('повторный вызов в пределах 5 минут отказывает', await p.evaluate(() => { const was = busyAct.kind; return pickTerraceEncounter() === false && busyAct.kind === was; }));
    await p.evaluate(() => endBusy()); await p.waitForTimeout(1100);
    ok('сцена убирается: капли и наклона нет', await p.evaluate(() => !document.querySelector('#duo .vg-drop') && !app.classList.contains('vg-lean')));
    r = await run(22, false, false, .9); ok('ночью без осадков: светлячок «fly»', r.res && r.kind === 'fly', JSON.stringify(r));
    ok('светлячок на террасе', await p.evaluate(() => !!document.querySelector('#duo .vg-fly')));
    r = await run(3, false, true, .9); ok('ночью в снегопад сцены нет', !r.res && !r.kind, JSON.stringify(r));
    r = await run(12, false, false, .1); ok('днём при броске 35%: коробка на двоих', r.res && r.kind === 'boxduet', JSON.stringify(r));
    ok('коробка и обе кошки «content»', await p.evaluate(() => !!document.querySelector('#duo .vg-box svg') && [...document.querySelectorAll('#duo .cat')].every(c => c.classList.contains('content'))));
    await p.screenshot({path: __dirname + '/v15-boxduet.png'});
    await p.evaluate(() => endBusy()); await p.waitForTimeout(1100);
    ok('коробка убрана', await p.evaluate(() => !document.querySelector('#duo .vg-box') && ![...document.querySelectorAll('#duo .cat')].some(c => c.classList.contains('content'))));
    r = await run(12, false, false, .6); ok('днём при броске 60%: сцены нет', !r.res, JSON.stringify(r));
    r = await run(19, false, false, .1); ok('вечером без дождя: сцены нет', !r.res, JSON.stringify(r));
    // касание прерывает сцену
    await run(14, true, false, .9); await p.waitForTimeout(500);
    await p.click('#duo .pet[data-cat="lapula"]'); await p.waitForTimeout(900);
    ok('поглаживание заканчивает сцену', await p.evaluate(() => !busyAct));
    // дневник: в запись дня попадают две первые сцены, поэтому перед проверкой список очищаем
    await p.evaluate(() => { dayNote().vg = []; });
    await run(12, false, false, .1); await p.evaluate(() => endBusy()); await run(14, true, false, .9); await p.evaluate(() => endBusy());
    const dv = await p.evaluate(() => { const e = dayNote(); return {vg: e.vg, a: diaryLines(e).map(x => x.k), ln: LNOTES.vg_rain + '|' + LNOTES.vg_boxduet}; });
    ok('в дневник записаны обе сцены', dv.vg && dv.vg.includes('rain') && dv.vg.includes('boxduet') && dv.a.includes('vg_rain') && dv.a.includes('vg_boxduet'), JSON.stringify(dv));
    ok('без ошибок (4)', errs.length === 0, errs.join(' | '));
    await b.close();
  }

  // 5. Звук: розовый шум для дождя и тембры шкатулки
  {
    const {b, p, errs} = await open(ROOT + '/index.html', {state: JSON.stringify(Object.assign({}, base, {pets: 300, drops: 10, stars: {1:3}, epi: 0}))});
    await start(p); await calm(p);
    const a = await p.evaluate(() => { initAudio(); const buf = makePink(3), d = buf.getChannelData(0); let pk = 0, step = 0; for (let i = 1; i < d.length; i++){ pk = Math.max(pk, Math.abs(d[i])); step += Math.abs(d[i] - d[i-1]); }
      return {sec: buf.duration, n: d.length, sr: ctx.sampleRate, pk, seam: Math.abs(d[0] - d[d.length - 1]), avgStep: step/d.length}; });
    ok('буфер розового шума 3 с, пик ≤ 0,9', Math.abs(a.sec - 3) < .01 && a.pk > .6 && a.pk <= .9001, JSON.stringify(a));
    ok('стык петли не громче обычного шага', a.seam < Math.max(.12, a.avgStep*6), 'seam ' + a.seam.toFixed(4) + ' avg ' + a.avgStep.toFixed(4));
    const rn = await p.evaluate(() => { S.sound = true; ctx.resume(); rainSound(true); return {state: ctx.state, node: !!rainNode, buf: rainNode ? rainNode.src.buffer === pinkBuf : null}; });
    ok('дождь использует розовый шум', rn.node ? rn.buf === true : rn.state !== 'running', JSON.stringify(rn));
    await p.evaluate(() => rainSound(false));
    const pr = await p.evaluate(() => { const R = {}, RD = Date, set = h => { window.Date = class extends RD { getHours(){ return h; } }; };
      S.soundPreset = 'celesta'; R.c = activePreset(); S.soundPreset = 'felt'; R.f = activePreset(); S.soundPreset = 'auto';
      [5, 6, 12, 21, 22, 23].forEach(h => { set(h); R['h' + h] = activePreset(); }); window.Date = RD; return R; });
    ok('«авто»: ночь 22–5 фетр, день 6–21 челеста', pr.c === 'celesta' && pr.f === 'felt' && pr.h5 === 'felt' && pr.h6 === 'celesta' && pr.h12 === 'celesta' && pr.h21 === 'celesta' && pr.h22 === 'felt' && pr.h23 === 'felt', JSON.stringify(pr));
    // ноты обоих тембров играют без ошибок
    await p.evaluate(async () => { S.sound = true; S.music = true; for (const k of ['celesta', 'felt']){ S.soundPreset = k; Music.start(3); await new Promise(r => setTimeout(r, 1800)); Music.stop(); } S.soundPreset = 'auto'; });
    await p.click('#btnSettings'); await p.waitForTimeout(900);
    const lab = () => p.evaluate(() => { const b = [...document.querySelectorAll('.sheet button')].find(x => /Тембр шкатулки/.test(x.getAttribute('aria-label') || '')); return b && b.textContent; });
    ok('в настройках тембр «Авто»', (await lab()) === 'Авто');
    await p.click('.sheet button[aria-label^="Тембр шкатулки"]'); await p.waitForTimeout(300);
    ok('нажатие: «День», сохранено', (await lab()) === 'День' && await p.evaluate(() => S.soundPreset === 'celesta'));
    await p.click('.sheet button[aria-label^="Тембр шкатулки"]'); await p.waitForTimeout(300);
    ok('ещё раз: «Ночь»', (await lab()) === 'Ночь' && await p.evaluate(() => S.soundPreset === 'felt'));
    await p.click('.sheet button[aria-label^="Тембр шкатулки"]'); await p.waitForTimeout(300);
    ok('и по кругу: «Авто»', (await lab()) === 'Авто' && await p.evaluate(() => S.soundPreset === 'auto'));
    await p.screenshot({path: __dirname + '/v15-settings.png'});
    ok('без ошибок (5)', errs.length === 0, errs.join(' | '));
    await b.close();
  }
  // 6. «Играть» ведёт к текущему эпизоду, даже если карту оставили прокрученной вниз; шторки без белых полос
  {
    const {b, p, errs} = await open(ROOT + '/index.html', {state: JSON.stringify(Object.assign({}, base, {pets: 50, drops: 10, stars: {1: 3, 2: 2}}))});
    await start(p); await calm(p);
    await p.click('.tab[data-v="v-map"]'); await p.waitForTimeout(900);
    await p.evaluate(() => { document.querySelector('#v-map').scrollTop = 99999; }); await p.waitForTimeout(300);
    await p.click('.tab[data-v="v-home"]'); await p.waitForTimeout(900);
    await p.click('#btnPlay'); await p.waitForTimeout(1600);
    const r = await p.evaluate(() => { const c = document.querySelector('#map .node.current').getBoundingClientRect(); return {top: c.top, bottom: c.bottom, h: innerHeight, sb: getComputedStyle(document.querySelector('#v-map')).scrollbarWidth}; });
    ok('«Играть»: текущий эпизод виден на экране', r.top > 60 && r.bottom < r.h - 90, JSON.stringify(r));
    ok('полосы прокрутки скрыты', r.sb === 'none');
    ok('без ошибок (6)', errs.length === 0, errs.join(' | '));
    await b.close();
  }
  // 7. ручной переключатель «Упрощённые эффекты» в настройках
  {
    const {b, p, errs} = await open(ROOT + '/index.html', {state: JSON.stringify(Object.assign({}, base, {pets: 50, drops: 10, stars: {1: 3}}))});
    await start(p); await calm(p);
    await p.click('#btnSettings'); await p.waitForTimeout(900);
    const sw = p.locator('[role=switch][aria-label="Упрощённые эффекты, экономия заряда"]');
    const st = () => p.evaluate(() => ({lowfx: app.classList.contains('lowfx'), glass: S.glass, sw: document.querySelector('[role=switch][aria-label="Упрощённые эффекты, экономия заряда"]').getAttribute('aria-checked')}));
    ok('по умолчанию выключено: стекло работает', JSON.stringify(await st()) === JSON.stringify({lowfx: false, glass: undefined, sw: 'false'}), JSON.stringify(await st()));
    await sw.click(); await p.waitForTimeout(300);
    const on = await st(); ok('включили: lowfx и S.glass=false', on.lowfx && on.glass === false && on.sw === 'true', JSON.stringify(on));
    ok('выбор сохранён в localStorage', await p.evaluate(() => JSON.parse(localStorage.getItem('alisa-diaries-v3')).glass === false));
    await sw.click(); await p.waitForTimeout(300);
    const off = await st(); ok('выключили: lowfx снят, S.glass=true', !off.lowfx && off.glass === true && off.sw === 'false', JSON.stringify(off));
    ok('без ошибок (7)', errs.length === 0, errs.join(' | '));
    await b.close();
  }
  // 8. лунная рябь, сдвиг котов под шторками, «Кровавая луна» в Эпизоде 1
  {
    const {b, p, errs} = await open(ROOT + '/index.html', {state: JSON.stringify(Object.assign({}, base, {pets: 50, drops: 10, stars: {1: 3}}))});
    await start(p); await calm(p);
    await p.mouse.click(120, 300); await p.waitForTimeout(60);
    ok('касание оставляет лунное кольцо', await p.evaluate(() => !!document.querySelector('.tap-ring')));
    await p.waitForTimeout(900);
    ok('кольцо убирается само', await p.evaluate(() => !document.querySelector('.tap-ring')));
    await p.evaluate(() => openWardrobe()); await p.waitForTimeout(900);
    const lift = await p.evaluate(() => { const d = document.querySelector('#duo'); return {v: d.style.getPropertyValue('--lift'), h: d.offsetHeight}; });
    ok('гардероб поднимает котов на ~20% высоты', lift.v && parseInt(lift.v) < 0 && Math.abs(parseInt(lift.v) + lift.h * .2) <= 1, JSON.stringify(lift));
    await p.evaluate(() => closeSheet()); await p.waitForTimeout(900);
    ok('после закрытия котики на месте', await p.evaluate(() => document.querySelector('#duo').style.getPropertyValue('--lift') === '0px'));
    await p.evaluate(() => startLevel(LEVELS[0])); await p.waitForTimeout(900); await p.click('.overlay .go'); await p.waitForTimeout(1500);
    ok('в начале уровня луны ещё нет', await p.evaluate(() => !document.querySelector('.garea.bloodmoon')));
    await p.waitForTimeout(23000);
    ok('за 12 секунд до конца: «Кровавая луна» и отсвет по краям', await p.evaluate(() => !!document.querySelector('.garea.bloodmoon')));
    ok('без ошибок (8)', errs.length === 0, errs.join(' | '));
    await b.close();
  }
  console.log('провалов:', fail); process.exit(fail ? 1 : 0);
})();
