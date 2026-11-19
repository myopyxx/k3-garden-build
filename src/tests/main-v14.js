const ROOT = require('path').resolve(__dirname, '../..');   // корень репозитория
// v14: окно после уровней ссоры, у уровней ссоры только «На главную», выбор награды за загадку, подпись «Гардероб»
const {open} = require('./helper.js');
(async () => {
  const today = new Date(), T = Date.now();
  const st = {v4:1, v5:1, v9:1, lastDay: today.toDateString(), lastSeen: T, songSeen: 1, salvJoke: 1, giftDay: today.toDateString(), teamPicked: 1, pets: 300, drops: 100, purr: 0,
    stars: {1:3, 2:3, 3:3, 4:3, 5:3, 6:3, 7:3, 8:3, 9:3}, owned: {}, wearA: {}, wearL: {}, diary: {}, epi: 1, seenPh: 9};
  const {b, p, errs} = await open(ROOT + '/index.html', {state: JSON.stringify(st)});
  let fail = 0; const ok = (name, cond, info = '') => { if (!cond) fail++; console.log((cond ? 'ok  ' : 'FAIL') + ' ' + name + (info ? '  ' + info : '')); };
  await p.setViewportSize({width: 393, height: 852}); await p.waitForTimeout(1200);
  await p.click('#btnStart'); await p.waitForTimeout(1500);
  await p.evaluate(() => { if (typeof busyAct !== 'undefined' && busyAct) endBusy(); });
  const pop = () => p.evaluate(() => { const d = document.querySelector('.qpop'); if (!d) return null;
    return {h: d.querySelector('h4').textContent, body: d.querySelector('.qbody').textContent, btns: [...d.querySelectorAll('.qb .btn')].map(x => x.textContent)}; });
  const home = () => p.evaluate(() => document.querySelector('#v-home').classList.contains('on'));

  // 1. Выход из «Лазерной точки» по кнопке «назад» (до победы): на главной окно с двумя кнопками
  await p.evaluate(() => startLevel(LEVELS[9]));
  await p.waitForTimeout(900);
  await p.click('#gClose'); await p.waitForTimeout(1200);
  ok('после раннего выхода из уровня 10 главная', await home());
  await p.waitForTimeout(5200);
  const q1 = await pop();
  ok('окно «Они поссорились» с двумя кнопками', q1 && q1.h === 'Они поссорились' && q1.btns.join('|') === 'Продолжить|Как все исправить?', JSON.stringify(q1));
  ok('ссора включилась даже без победы', await p.evaluate(() => S.event === 'quarrel'));

  // 2. «Как все исправить?» → описание, «Назад» → окно, «Продолжить» → закрыто
  await p.click('.qpop .qb .btn:nth-child(2)'); await p.waitForTimeout(300);
  const q2 = await pop();
  ok('описание починки: причина и Гроза', q2 && q2.h === 'Как все исправить' && /Лазерной точке/.test(q2.body) && /«Грозу»/.test(q2.body), JSON.stringify(q2 && q2.body.slice(0, 120)));
  ok('в описании сказано про открытие «Грозы»', q2 && /Лазерная точка» будет пройдена/.test(q2.body) === ((await p.evaluate(() => S.stars[10] || 0)) === 0));
  await p.click('.qpop .qb .btn'); await p.waitForTimeout(300);
  ok('«Назад» возвращает первое окно', (await pop()).h === 'Они поссорились');
  await p.click('.qpop .qb .btn'); await p.waitForTimeout(500);
  ok('«Продолжить» закрывает окно', (await pop()) === null);

  // 3. Уровень 10 пройден: у результата только «На главную», после неё снова окно
  await p.evaluate(() => startLevel(LEVELS[9])); await p.waitForTimeout(900);
  await p.evaluate(() => finish(3, 'проверка'));
  await p.waitForTimeout(900);
  const solo = await p.evaluate(() => ({next: document.querySelector('#rNext').textContent, again: getComputedStyle(document.querySelector('#rAgain')).display, sub: getComputedStyle(document.querySelector('#rAgain').parentElement).display}));
  ok('у результата уровня ссоры только «На главную»', solo.next === 'На главную' && solo.sub === 'none', JSON.stringify(solo));
  await p.click('#rNext'); await p.waitForTimeout(1000);
  ok('кнопка ведёт на главную', await home());

  // 4. Уровень 11 покинут без победы: окно «Нить не дошла»
  await p.click('.qpop .qb .btn'); await p.waitForTimeout(500);
  await p.evaluate(() => startLevel(LEVELS[10])); await p.waitForTimeout(900);
  await p.click('#gClose'); await p.waitForTimeout(800);
  ok('после выхода из грозы главная', await home());
  await p.waitForTimeout(700);
  const q4 = await pop();
  ok('окно «Нить не дошла»', q4 && q4.h === 'Нить не дошла', JSON.stringify(q4));
  await p.click('.qpop .qb .btn'); await p.waitForTimeout(500);

  // 4б. Гроза пройдена: окно «Помирились» с одной кнопкой
  await p.evaluate(() => startLevel(LEVELS[10])); await p.waitForTimeout(900);
  await p.evaluate(() => finish(2, 'проверка'));
  await p.waitForTimeout(900); await p.click('#rNext'); await p.waitForTimeout(900);
  await p.waitForTimeout(5300);
  const q4b = await pop();
  ok('после победы в грозе окно «Помирились» с одной кнопкой', q4b && q4b.h === 'Помирились' && q4b.btns.join('|') === 'Продолжить', JSON.stringify(q4b));
  ok('ссора закончилась', await p.evaluate(() => S.event === null && S.quarrelOver === 1));
  await p.click('.qpop .qb .btn'); await p.waitForTimeout(500);

  // 5. Загадка дня: награда выбирается, ожидание переживает закрытие листа
  const drops0 = await p.evaluate(() => S.drops);
  await p.evaluate(() => openWord()); await p.waitForTimeout(500);
  const ans = await p.evaluate(() => wdToday().ans);
  for (const ch of ans){ await p.click(`.wk[data-k="${ch}"]`); await p.waitForTimeout(40); }
  await p.click('.wk[data-k="ENTER"]'); await p.waitForTimeout(1900);
  const pk = await p.evaluate(() => { const e = document.querySelector('.wpick'); return {shown: !!e && !e.hidden, kb: getComputedStyle(document.querySelector('.wkb')).display, opts: e ? [...e.querySelectorAll('.wpk')].map(x => x.dataset.k) : []}; });
  ok('после победы три варианта вместо клавиатуры', pk.shown && pk.kb === 'none' && pk.opts.join() === 'd,m,h', JSON.stringify(pk));
  ok('капли пока не начислены', (await p.evaluate(() => S.drops)) === drops0);
  await p.evaluate(() => closeSheet()); await p.waitForTimeout(700);
  await p.evaluate(() => openWord()); await p.waitForTimeout(700);
  ok('без выбора варианты ждут при повторном открытии', await p.evaluate(() => !document.querySelector('.wpick').hidden));
  await p.click('.wpk[data-k="d"]'); await p.waitForTimeout(400);
  ok('капли за выбор начислены один раз', (await p.evaluate(() => S.drops)) === drops0 + 15, `drops ${drops0} → ${await p.evaluate(() => S.drops)}`);
  ok('выбранный вариант не меняется', await p.evaluate(() => wdToday().pick === 'd'));
  await p.evaluate(() => closeSheet()); await p.waitForTimeout(600);

  // 6. Подпись «Гардероб»: 10 px, внутри капсулы
  const lab = await p.evaluate(() => { const b = document.querySelector('#btnWardrobe'), s = b.querySelector('span:nth-child(2)'), r = b.getBoundingClientRect(), t = s.getBoundingClientRect();
    return {fs: getComputedStyle(s).fontSize, inside: t.left - r.left, right: r.right - t.right}; });
  ok('подпись «Гардероб» 10 px и есть отступ по краям', lab.fs === '10px' && lab.inside >= 12 && lab.right >= 12, JSON.stringify(lab));

  ok('без ошибок в консоли', errs.length === 0, errs.join(' | '));
  console.log('провалов: ' + fail);
  await b.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
