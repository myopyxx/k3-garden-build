/* 1 нокаут, 2 нокаута, 5 нокаутов */
function plural(n, a, b, c){ n = Math.abs(n) % 100; const k = n % 10; return n > 10 && n < 20 ? c : k === 1 ? a : k >= 2 && k <= 4 ? b : c; }
/* =================== РЕЖИМЫ =================== */
const fmtT = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s/60) + ":" + String(s % 60).padStart(2, "0"); };
const teamGems = team => G.fighters.reduce((n, f) => n + (f.team === team && !f.dead ? f.gems : 0), 0);

const MODES = {
  /* ---------- Капли 3×3: держать 10 капель 15 секунд ---------- */
  gems: {
    title: "Капли 3×3", map: "gems", time: 150,
    setup(){
      const m = G.map, other = S.cat === "alisa" ? "lapula" : "alisa";
      const us = [[S.cat, 1], [other, 0], ["black", 2]], them = ["hunter", "herb", "brute"];
      us.forEach(([k, i]) => { const p = m.spots[1][i]; const f = makeFighter(k, 1, p.x, p.y); G.fighters.push(f); if (k === S.cat) G.me = f; });
      them.forEach((k, i) => { const p = m.spots[2][i]; G.fighters.push(makeFighter(k, 2, p.x, p.y)); });
      G.gemT = 4; G.hold = 0; G.holder = 0; G.fount = m.spots.G[0];
      banner("Капли 3×3", "Собери 10 капель и продержись 15 секунд");
    },
    step(dt){
      G.gemT -= dt; if (G.gemT <= 0 && G.picks.filter(p => p.k === "gem").length + teamGems(1) + teamGems(2) < 29){ G.gemT = 6.5;
        const a = rand(0, 6.28), d = rand(T*.7, T*1.5), p = freeSpot(G.fount.x + Math.cos(a)*d, G.fount.y + Math.sin(a)*d, 10);
        G.picks.push({k: "gem", x: G.fount.x, y: G.fount.y, tx: p.x, ty: p.y, t: 0}); G.fx.push({k: "ring", x: G.fount.x, y: G.fount.y, R: T*.8, t: 0, T: .5, col: "#ff4d6d"}); }
      for (const f of G.fighters) if (f.dead){ f.respawn -= dt; if (f.respawn <= 0) respawnAt(f, G.map.spots[f.team][f.slot ?? 0] || G.map.spots[f.team][0]); }
      const a = teamGems(1), b = teamGems(2), lead = a >= 10 && a > b ? 1 : b >= 10 && b > a ? 2 : 0;
      if (lead !== G.holder){ G.holder = lead; G.hold = 15; if (lead) banner(lead === 1 ? "Держим!" : "Отбирай капли", lead === 1 ? "15 секунд до победы" : "У охотников 10 капель", 1800); }
      if (G.holder){ const prev = Math.ceil(G.hold); G.hold -= dt; if (Math.ceil(G.hold) !== prev && G.hold > 0) snd.tick(G.hold < 5.5); if (G.hold <= 0) return endMatch(G.holder === 1 ? "win" : "lose"); }
      G.left -= dt; if (G.left <= 0){ return endMatch(a > b ? "win" : b > a ? "lose" : "draw"); }
    },
    onKo(o){ o.respawn = 4; o.slot = G.map.spots[o.team].length > 1 ? G.fighters.filter(f => f.team === o.team).indexOf(o) : 0; },
    goal(f, tgt){
      const mine = teamGems(f.team), theirs = teamGems(3 - f.team), home = G.map.spots[f.team][1] || G.map.spots[f.team][0];
      /* выигрываем по каплям: тот, кто несёт, отходит к своим */
      if (mine >= 10 && mine > theirs && f.gems > 0) return tgt && dist(f, tgt) < T*4 ? engagePoint(f, tgt) : home;
      const gems = G.picks.filter(p => p.k === "gem" && p.tx === undefined);
      const g = nearest(f, gems);
      if (g && (!tgt || dist(f, tgt) > T*4.5 || dist(f, g) < T*1.5)) return g;
      if (tgt) return engagePoint(f, tgt);
      return {x: G.fount.x + (f.team === 1 ? 0 : 0), y: G.fount.y + (f.team === 1 ? T*2 : -T*2)};
    },
    hud(){
      const a = teamGems(1), b = teamGems(2);
      $("#scMain").innerHTML = `<span class="us">🩸 ${a}</span><span class="tm">${fmtT(G.left)}</span><span class="them">${b} 🩸</span>`;
      const n = $("#scNote"); if (G.holder){ n.textContent = (G.holder === 1 ? "победа через " : "поражение через ") + Math.max(0, Math.ceil(G.hold)); n.classList.add("on"); } else n.classList.remove("on");
    },
    result(r){
      const d = r === "win" ? 8 : r === "draw" ? 1 : -4; S.rec.gems[r === "win" ? "w" : r === "draw" ? "d" : "l"]++;
      return {cups: d, title: r === "win" ? "Победа" : r === "draw" ? "Ничья" : "Поражение",
        text: r === "win" ? "Капли наши. Охотники ушли ни с чем." : r === "draw" ? "Капель поровну. Время вышло." : "Охотники унесли капли. Реванш?",
        stats: [[G.me.kos, plural(G.me.kos, "нокаут", "нокаута", "нокаутов")], [Math.round(G.me.dmgOut/100)/10 + "к", "урона"], [G.myGems || 0, plural(G.myGems || 0, "капля", "капли", "капель")]]};
    }
  },

  /* ---------- Последняя на арене: шестеро, туман, коробки с силой ---------- */
  surv: {
    title: "Последняя на арене", map: "surv", time: 999,
    setup(){
      const sp = G.map.spots.S.slice().sort(() => Math.random() - .5), kinds = ["hunter", "herb", "brute", "hunter", "brute"];
      G.me = makeFighter(S.cat, 1, sp[0].x, sp[0].y); G.fighters.push(G.me);
      kinds.forEach((k, i) => G.fighters.push(makeFighter(k, 10 + i, sp[i + 1].x, sp[i + 1].y)));
      G.fogStart = 35; G.fogEnd = 135; G.fog = 0; G.place = 0;
      banner("Последняя на арене", "Ломай коробки, собирай силу, держись подальше от тумана");
    },
    safe(){ const m = G.map, k = clamp((G.el - G.fogStart)/(G.fogEnd - G.fogStart), 0, 1), half = lerp(m.W/2, 2.6, k)*T; return {x0: m.pw/2 - half, y0: m.ph/2 - half, x1: m.pw/2 + half, y1: m.ph/2 + half, k}; },
    step(dt){
      const s = MODES.surv.safe(); G.safeR = s;
      if (G.el > G.fogStart - 5 && !G.fogSaid){ G.fogSaid = true; banner("Туман идёт", "Держись ближе к центру", 1800); }
      G.fogTick = (G.fogTick || 0) - dt;
      if (G.fogTick <= 0){ G.fogTick = .5; for (const f of G.fighters) if (!f.dead && s.k > 0 && (f.x < s.x0 || f.x > s.x1 || f.y < s.y0 || f.y > s.y1)) hurt(f, 450, {power: 0, dmgOut: 0, C: {}}); }
      const alive = G.fighters.filter(f => !f.dead);
      if (G.me.dead) return endMatch("place", alive.length + 1);
      if (alive.length === 1) return endMatch("place", 1);
    },
    goal(f, tgt){
      const s = G.safeR || MODES.surv.safe(), c = {x: G.map.pw/2, y: G.map.ph/2}, m = T*1.2;
      if (s.k > 0 && (f.x < s.x0 + m || f.x > s.x1 - m || f.y < s.y0 + m || f.y > s.y1 - m)) return c;
      if (tgt && (dist(f, tgt) < T*7 || f.power >= tgt.power)) return engagePoint(f, tgt);
      const p = nearest(f, G.picks.filter(p => p.k === "power")); if (p && dist(f, p) < T*8) return p;
      let best = null, bd = 1e9; for (const k in G.map.boxHp){ const [cx, cy] = k.split(",").map(Number), b = {x: (cx + .5)*T, y: (cy + .5)*T}, d = dist(f, b); if (d < bd){ bd = d; best = b; } }
      if (best){ f.ai.box = best; if (bd < f.C.range*T*.9 && f.ammo >= 1 && f.cd <= 0 && Math.random() < .25) fire(f, angTo(f, best), best); return bd < f.C.range*T*.7 ? {x: f.x, y: f.y} : best; }
      return tgt ? engagePoint(f, tgt) : c;
    },
    hud(){
      const alive = G.fighters.filter(f => !f.dead).length, s = G.safeR || {k: 0};
      $("#scMain").innerHTML = `<span>🐾 осталось ${alive}</span><span class="tm">⚡ ${G.me.power}</span>`;
      const n = $("#scNote"); if (s.k > 0 && s.k < 1){ n.textContent = "туман сжимается"; n.classList.add("on"); } else if (G.el < G.fogStart && G.el > G.fogStart - 10){ n.textContent = "туман через " + Math.ceil(G.fogStart - G.el); n.classList.add("on"); } else n.classList.remove("on");
    },
    result(r, place){
      const d = [0, 10, 6, 3, 0, -2, -4][place]; S.rec.surv.best = S.rec.surv.best ? Math.min(S.rec.surv.best, place) : place; if (place === 1) S.rec.surv.wins++;
      return {cups: d, title: place === 1 ? "Последняя!" : place + "-е место", text: place === 1 ? "Арена твоя. Охотники разбежались по домам." : place <= 3 ? "Почти. До победы было близко." : "Охотники в этот раз сильнее. Собирай силу из коробок.",
        stats: [[G.me.kos, plural(G.me.kos, "нокаут", "нокаута", "нокаутов")], [Math.round(G.me.dmgOut/100)/10 + "к", "урона"], [G.me.power, plural(G.me.power, "усиление", "усиления", "усилений")]]};
    }
  },

  /* ---------- Волны и босс: вдвоём против волн, в конце Старый охотник ---------- */
  waves: {
    title: "Волны и босс", map: "waves", time: 999,
    W: [["bat", "bat", "bat", "bat"], ["hunter", "hunter", "bat", "bat", "bat"], ["herb", "herb", "hunter", "hunter"],
        ["brute", "bat", "bat", "bat", "bat", "hunter"], ["hunter", "herb", "brute", "bat", "bat"], ["boss"]],
    setup(){
      const c = G.map.spots.P[0], other = S.cat === "alisa" ? "lapula" : "alisa";
      G.me = makeFighter(S.cat, 1, c.x - T*.7, c.y); G.fighters.push(G.me); G.fighters.push(makeFighter(other, 1, c.x + T*.7, c.y));
      G.wave = 0; G.lives = 3; G.pause = 2.5; G.spawnQ = [];
      const qw = location.search.match(/[?&]wave=(\d)/); if (qw) G.wave = clamp(+qw[1] - 1, 0, 5);   /* для проверки: начать с нужной волны */
      banner("Волны и босс", "Шесть волн. В конце Старый охотник");
    },
    spawnWave(){
      const list = MODES.waves.W[G.wave], m = G.map; G.wave++; snd.wave();
      banner(G.wave === 6 ? "Старый охотник" : "Волна " + G.wave, G.wave === 6 ? "Последняя волна" : list.length + " " + (list.length < 5 ? "врага" : "врагов"), 1800);
      list.forEach((k, i) => { let p, n = 0; do { const edge = Math.floor(Math.random()*4); p = {x: edge < 2 ? rand(T, m.pw - T) : edge === 2 ? T*.8 : m.pw - T*.8, y: edge === 0 ? T*.8 : edge === 1 ? m.ph - T*.8 : rand(T, m.ph - T)}; n++; }
        while (n < 30 && (hitsSolid(p.x, p.y, 20, solidWalk) || G.fighters.some(f => !f.dead && f.team === 1 && dist(f, p) < T*5)));
        if (k === "boss") p = {x: m.pw/2, y: T*1.5};
        G.spawnQ.push({k, x: p.x, y: p.y, t: .9 + i*.25}); G.fx.push({k: "warn", x: p.x, y: p.y, t: 0, T: .9 + i*.25}); });
    },
    step(dt){
      for (let i = G.spawnQ.length - 1; i >= 0; i--){ const q = G.spawnQ[i]; q.t -= dt; if (q.t > 0) continue; G.spawnQ.splice(i, 1);
        const f = makeFighter(q.k, 2, q.x, q.y); if (q.k === "boss"){ f.bossT = {volley: 2, ring: 7, bats: 0}; } G.fighters.push(f); puff(q.x, q.y, "#6a4a8a", 10); }
      const foes = G.fighters.filter(f => f.team === 2 && !f.dead);
      if (!foes.length && !G.spawnQ.length){ if (G.wave >= 6) return endMatch("win");
        if (G.pause <= 0){ G.pause = 3.2; if (G.wave > 0){ const extra = (G.wave === 3 || G.wave === 5) && G.lives < 3; if (extra) G.lives++;
          banner("Волна пройдена", extra ? "Передышка и +1 жизнь" : "Передышка", 1500); G.fighters.forEach(f => { if (f.team === 1 && !f.dead) heal(f, f.maxHp*.35); }); } }
        G.pause -= dt; if (G.pause <= 0){ G.fighters = G.fighters.filter(f => f.team === 1); MODES.waves.spawnWave(); } }
      for (const f of G.fighters) if (f.team === 1 && f.dead){ f.respawn -= dt; if (f.respawn <= 0){ const c = G.map.spots.P[0]; respawnAt(f, c); } }
      const boss = foes.find(f => f.kind === "boss"); if (boss) bossAct(boss, dt);
    },
    onKo(o){
      if (o.team !== 1) return;
      /* жизни тратит только игрок, напарница возвращается сама */
      if (o !== G.me){ o.respawn = 6; return; }
      if (G.lives <= 0) return endMatch("lose");
      G.lives--; o.respawn = 5; banner("Нокаут", G.lives ? "Вернёшься через 5 секунд" : "Это последняя жизнь", 1600);
    },
    goal(f, tgt){
      if (f.team === 1 && f !== G.me && !tgt){ return dist(f, G.me) > T*2.5 && !G.me.dead ? {x: G.me.x + T, y: G.me.y} : null; }
      if (f.kind === "bat" && tgt) return tgt;
      if (f.team === 2 && !tgt){ const t = nearest(f, G.fighters.filter(o => o.team === 1 && !o.dead)); return t ? {x: t.x, y: t.y} : null; }
      return null;
    },
    hud(){
      const foes = G.fighters.filter(f => f.team === 2 && !f.dead).length, boss = G.fighters.find(f => f.kind === "boss" && !f.dead);
      $("#scMain").innerHTML = `<span>волна ${Math.max(1, G.wave)}/6</span><span class="tm">❤️ ${G.lives}</span><span class="them">👤 ${foes}</span>`;
      const n = $("#scNote"); if (boss){ n.textContent = "Старый охотник " + Math.ceil(boss.hp/boss.maxHp*100) + "%"; n.classList.add("on"); } else n.classList.remove("on");
    },
    result(r){
      const cleared = r === "win" ? 6 : Math.max(0, G.wave - 1), d = cleared*2 + (r === "win" ? 6 : 0) - (r === "win" ? 0 : 2);
      S.rec.waves.best = Math.max(S.rec.waves.best, cleared); if (r === "win") S.rec.waves.wins++;
      return {cups: d, title: r === "win" ? "Победа" : "Поражение", text: r === "win" ? "Старый охотник ушёл на пенсию." : `Пройдено волн: ${cleared} из 6.`,
        stats: [[G.me.kos, plural(G.me.kos, "нокаут", "нокаута", "нокаутов")], [Math.round(G.me.dmgOut/100)/10 + "к", "урона"], [cleared + "/6", "волн пройдено"]]};
    }
  }
};
/* Старый охотник: веер болтов, кольцо кольев, на половине здоровья зовёт мышей, после трети злее */
function bossAct(b, dt){
  const B = b.bossT, rage = b.hp < b.maxHp*.33, tgt = nearest(b, G.fighters.filter(o => o.team === 1 && !o.dead)); if (!tgt) return;
  B.volley -= dt*(rage ? 1.35 : 1); B.ring -= dt;
  if (B.volley <= 0){ B.volley = 1.7; const a = angTo(b, tgt); for (let i = -2; i <= 2; i++) shoot(b, a + i*.13, 620, T*9.5, 560, "bolt"); snd.bolt(.6); b.face = a; revealAtk(b); }
  if (B.ring <= 0){ B.ring = rage ? 5.5 : 8; for (let i = 0; i < 18; i++) shoot(b, i/18*6.283 + G.t, 520, T*8, 420, "stake"); G.fx.push({k: "ring", x: b.x, y: b.y, R: T*1.5, t: 0, T: .4, col: "#ffb36b"}); snd.boom(.6); }
  if (!B.bats && b.hp < b.maxHp*.5){ B.bats = 1; banner("Мыши!", "Старый охотник зовёт подмогу", 1400); for (let i = 0; i < 4; i++){ const a = i/4*6.283; G.spawnQ.push({k: "bat", x: b.x + Math.cos(a)*T*2, y: b.y + Math.sin(a)*T*2, t: .4 + i*.15}); } }
}
