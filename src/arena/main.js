/* =================== УПРАВЛЕНИЕ =================== */
/* левая половина: бег; правая: потянуть и отпустить — выстрел, тап — в ближайшего; круглая кнопка: супер */
const IN = {move: null, aim: null, sup: null, keys: {}, mouse: null, buf: null, fades: [], used: {}};
const SUPER_BTN = () => ({x: VW - 70, y: VH - 200 - SAB*.6, r: 36});
const DEAD = 16, MAXD = 70;
function stickVec(p){ const dx = p.x - p.bx, dy = p.y - p.by, d = Math.hypot(dx, dy); return {dx, dy, d, a: Math.atan2(dy, dx)}; }
cv.addEventListener("pointerdown", e => {
  if (!G || G.over || G.paused) return; e.preventDefault();
  const p = {id: e.pointerId, bx: e.clientX, by: e.clientY, x: e.clientX, y: e.clientY, t0: performance.now(), max: 0};
  try { cv.setPointerCapture(e.pointerId); } catch(_){}
  const sb = SUPER_BTN();
  if (Math.hypot(e.clientX - sb.x, e.clientY - sb.y) < sb.r + 14 && !IN.sup){ p.bx = sb.x; p.by = sb.y; IN.sup = p; if (G.me.sup >= 1) haptic(6); return; }
  if (e.clientX < VW/2){ if (!IN.move){ IN.move = p; IN.used.move = true; } return; }
  if (!IN.aim){ IN.aim = p; IN.used.aim = true; }
}, {passive: false});
addEventListener("pointermove", e => {
  for (const k of ["move", "aim", "sup"]){ const p = IN[k]; if (!p || p.id !== e.pointerId) continue; p.x = e.clientX; p.y = e.clientY;
    const v = stickVec(p); p.max = Math.max(p.max, v.d);
    /* джойстик бега едет за пальцем, если тянуть далеко */
    if (k === "move" && v.d > MAXD){ p.bx = p.x - Math.cos(v.a)*MAXD; p.by = p.y - Math.sin(v.a)*MAXD; } }
}, {passive: true});
function releasePtr(e){
  for (const k of ["move", "aim", "sup"]){ const p = IN[k]; if (!p || p.id !== e.pointerId) continue; IN[k] = null;
    if (k !== "sup"){ const v0 = stickVec(p), d0 = Math.min(MAXD*.8, v0.d); IN.fades.push({k, bx: p.bx, by: p.by, kx: p.bx + Math.cos(v0.a)*d0, ky: p.by + Math.sin(v0.a)*d0, t0: performance.now()}); }
    if (e.type === "pointercancel" || !G || G.over || G.paused || G.me.dead) continue;
    const v = stickVec(p), me = G.me;
    if (k === "aim"){
      if (v.d >= DEAD){ const k2 = me.C.range*T*Math.min(1, v.d/MAXD), a = v.a; tryFire(() => fire(G.me, a, {x: G.me.x + Math.cos(a)*k2, y: G.me.y + Math.sin(a)*k2})); }
      else if (p.max < DEAD) tryFire(tapFire);
    }
    if (k === "sup"){
      if (me.sup < 1){ if (p.max < DEAD) haptic(4); continue; }
      const maxD = SUPER_RANGE[me.C.sup]*T;
      if (v.d >= DEAD) castSuper(me, v.a, maxD*Math.min(1, v.d/MAXD));
      else if (p.max < DEAD){ const t = autoTarget(me) || nearest(me, enemiesOf(me)); if (t) castSuper(me, angTo(me, t), dist(me, t)); else castSuper(me, me.face, maxD*.6); }
      haptic(12);
    } }
}
addEventListener("pointerup", releasePtr); addEventListener("pointercancel", releasePtr);
function tapFire(){
  const me = G.me, t = autoTarget(me);
  if (t){ const lead = me.C.atk === "claw" ? 0 : dist(me, t)/(me.C.ps || 600), px = t.x + (t.vx || 0)*lead*.8, py = t.y + (t.vy || 0)*lead*.8; return fire(me, Math.atan2(py - me.y, px - me.x), {x: px, y: py}); }
  return fire(me, me.moveFace ?? me.face, null);
}
/* выстрел во время перезарядки удара не теряется: ждёт до 0,3 с */
function tryFire(fn){ if (fn()) { IN.buf = null; return; } const me = G.me; if (me.dead || me.stun > 0 || me.dash) return;
  if (me.ammo >= 1 && me.cd > 0 && me.cd < .3) IN.buf = {fn, t: G.t + me.cd + .01};
  else if (me.ammo < 1){ me.emptyT = G.t; snd.empty(); haptic(4); }
}
/* все пальцы отпущены: при сворачивании, звонке, системном жесте */
function dropInputs(){ IN.move = IN.aim = IN.sup = null; IN.buf = null; IN.keys = {}; }
addEventListener("blur", dropInputs); addEventListener("pagehide", dropInputs);
/* iOS не слушает user-scalable=no: щипок и двойной тап гасим сами, пока идёт матч */
["gesturestart", "gesturechange", "gestureend"].forEach(ev => document.addEventListener(ev, e => e.preventDefault(), {passive: false}));
cv.addEventListener("touchstart", e => { if (G && !G.over) e.preventDefault(); }, {passive: false});
cv.addEventListener("touchmove", e => e.preventDefault(), {passive: false});
cv.addEventListener("contextmenu", e => e.preventDefault());
/* клавиатура и мышь для проверки на компьютере */
addEventListener("keydown", e => { IN.keys[e.code] = true; if (!G || G.over) return;
  if (e.code === "Space") tryFire(tapFire);
  if (e.code === "KeyE" && IN.mouse){ const w = toWorld(IN.mouse); castSuper(G.me, angTo(G.me, w), dist(G.me, w)); }
  if (e.code === "Escape") togglePause(true); });
addEventListener("keyup", e => { IN.keys[e.code] = false; });
cv.addEventListener("mousemove", e => { IN.mouse = {x: e.clientX, y: e.clientY}; });
const toWorld = p => ({x: (p.x - G.cam.ox)/SC, y: (p.y - G.cam.oy)/SC});
function readInput(){
  let mx = 0, my = 0;
  if (IN.move){ const v = stickVec(IN.move); if (v.d > 4){ const k0 = Math.min(1, (v.d - 4)/22), k = k0*(2 - k0); mx = Math.cos(v.a)*k; my = Math.sin(v.a)*k; } }
  const K = IN.keys; if (K.KeyA || K.ArrowLeft) mx -= 1; if (K.KeyD || K.ArrowRight) mx += 1; if (K.KeyW || K.ArrowUp) my -= 1; if (K.KeyS || K.ArrowDown) my += 1;
  const d = Math.hypot(mx, my); if (d > 1){ mx /= d; my /= d; }
  G.input.mx = mx; G.input.my = my;
  G.input.aiming = !!(IN.aim && stickVec(IN.aim).d >= DEAD) || !!(IN.sup && stickVec(IN.sup).d >= DEAD);
  if (G.input.aiming){ const p = IN.sup && stickVec(IN.sup).d >= DEAD ? IN.sup : IN.aim; G.me.face = stickVec(p).a; }
}
/* прицел на полу: куда полетит выстрел или супер */
function aimPreview(c, t){
  const me = G.me; if (me.dead) return;
  const sup = IN.sup && stickVec(IN.sup).d >= DEAD, p = sup ? IN.sup : IN.aim; if (!p) return; const v = stickVec(p); if (v.d < DEAD) return;
  const a = v.a, k = Math.min(1, v.d/MAXD), C = me.C;
  c.save(); c.globalAlpha = .9;
  if (sup){ const maxD = SUPER_RANGE[C.sup]*T, d = maxD*k, x = me.x + Math.cos(a)*d, y = me.y + Math.sin(a)*d; c.fillStyle = me.sup >= 1 ? "rgba(243,210,122,.22)" : "rgba(255,255,255,.08)";
    c.strokeStyle = "rgba(243,210,122,.8)"; c.lineWidth = 3; c.setLineDash([10, 8]); c.beginPath(); c.moveTo(me.x, me.y); c.lineTo(x, y); c.stroke(); c.setLineDash([]);
    c.beginPath(); c.arc(x, y, C.sup === "pounce" ? T*1.8 : C.sup === "bite" ? T*1.35 : T*.6, 0, 6.283); c.fill(); c.stroke(); }
  else if (C.atk === "claw"){ c.fillStyle = "rgba(255,255,255,.16)"; c.beginPath(); c.moveTo(me.x, me.y); c.arc(me.x, me.y, C.range*T, a - .75, a + .75); c.closePath(); c.fill(); }
  else if (C.atk === "lob"){ const d = C.range*T*k; c.fillStyle = "rgba(255,255,255,.16)"; c.beginPath(); c.arc(me.x + Math.cos(a)*d, me.y + Math.sin(a)*d, T*1.25, 0, 6.283); c.fill(); }
  else { /* дорожка каждого снаряда обрывается у стены или коробки: видно, куда долетит */
    const R = C.range*T, offs = C.atk === "fan" ? [-.17, 0, .17] : [0], w = C.atk === "fan" ? 4.5 : 6;
    for (const d of offs){ const aa = a + d, L = rayLen(me.x, me.y, aa, R), nx = -Math.sin(aa)*w, ny = Math.cos(aa)*w, ex = me.x + Math.cos(aa)*L, ey = me.y + Math.sin(aa)*L;
      c.fillStyle = "rgba(255,255,255,.17)"; c.beginPath(); c.moveTo(me.x + nx, me.y + ny); c.lineTo(ex + nx, ey + ny); c.lineTo(ex - nx, ey - ny); c.lineTo(me.x - nx, me.y - ny); c.closePath(); c.fill();
      if (L < R - 2){ c.fillStyle = "rgba(255,120,140,.55)"; c.beginPath(); c.arc(ex, ey, w + 1.5, 0, 6.283); c.fill(); } } }
  c.restore();
}
/* сколько пролетит снаряд до первой стены или коробки */
function rayLen(x, y, a, R){ const st = T/6, cx = Math.cos(a), cy = Math.sin(a); for (let d = st; d < R; d += st) if (solidShot(cellAt(x + cx*d, y + cy*d))) return Math.max(0, d - st*.5); return R; }
function drawControls(c, t){
  if (G.over || AUTO) return;
  const me = G.me;
  /* джойстики: подсказка в покое, кольцо и шар под пальцем */
  /* подсказки в покое видны, пока игрок не попробовал оба пальца */
  const ghost = [[IN.move, 92, VH - 150 - SAB*.6, "move"], [IN.aim, VW - 150, VH - 112 - SAB*.6, "aim"]], now = performance.now();
  ghost.forEach(([p, gx, gy, k], i) => {
    if (!p && IN.fades.some(f => f.k === k)) return;
    const bx = p ? p.bx : gx, by = p ? p.by : gy, v = p ? stickVec(p) : null, cancel = p && i && p.max >= DEAD && v.d < DEAD;
    c.globalAlpha = p ? .9 : IN.used.move && IN.used.aim ? .12 : .28;
    c.strokeStyle = "rgba(255,255,255,.5)"; c.fillStyle = "rgba(20,14,28,.35)"; c.lineWidth = 2; c.beginPath(); c.arc(bx, by, 56, 0, 6.283); c.fill(); c.stroke();
    if (p && i && !cancel && v.d >= DEAD){ c.strokeStyle = "rgba(255,179,71,.55)"; c.lineWidth = 4; c.beginPath(); c.arc(bx, by, 56, v.a - .5, v.a + .5); c.stroke(); }
    let kx = bx, ky = by; if (p){ const d = Math.min(MAXD*.8, v.d); kx = bx + Math.cos(v.a)*d; ky = by + Math.sin(v.a)*d; }
    c.fillStyle = cancel ? "rgba(160,150,170,.9)" : i ? "rgba(255,179,71,.9)" : "rgba(255,255,255,.85)"; c.beginPath(); c.arc(kx, ky, p ? 26 : 24, 0, 6.283); c.fill();
    if (cancel){ c.strokeStyle = "#2a1f33"; c.lineWidth = 3.5; c.lineCap = "round"; c.beginPath(); c.moveTo(kx - 7, ky - 7); c.lineTo(kx + 7, ky + 7); c.moveTo(kx + 7, ky - 7); c.lineTo(kx - 7, ky + 7); c.stroke(); } });
  /* отпущенный джойстик: шар пружиной возвращается в центр, кольцо гаснет за 0,16 с */
  IN.fades = IN.fades.filter(f => now - f.t0 < 160);
  for (const f of IN.fades){ const k = (now - f.t0)/160, e = 1 - (1 - k)*(1 - k), kx = lerp(f.kx, f.bx, e), ky = lerp(f.ky, f.by, e);
    c.globalAlpha = .9*(1 - k); c.strokeStyle = "rgba(255,255,255,.5)"; c.fillStyle = "rgba(20,14,28,.35)"; c.lineWidth = 2; c.beginPath(); c.arc(f.bx, f.by, 56, 0, 6.283); c.fill(); c.stroke();
    c.fillStyle = f.k === "aim" ? "rgba(255,179,71,.9)" : "rgba(255,255,255,.85)"; c.beginPath(); c.arc(kx, ky, 26 - k*2, 0, 6.283); c.fill(); }
  c.globalAlpha = 1;
  /* кнопка супера: кольцо заряда; при полном заряде выскакивает и светится; под пальцем вдавлена */
  const sb = SUPER_BTN(), full = me.sup >= 1, sx = IN.sup ? IN.sup.x : sb.x, sy = IN.sup ? IN.sup.y : sb.y;
  const pk = clamp((G.t - (G.supFullT ?? -9))/.5, 0, 1), pop = full && pk < 1 && !reduced() ? Math.sin(pk*Math.PI)*.28*(1 - pk*.5) : 0, sc = (IN.sup ? .9 : 1) + pop;
  c.save(); c.translate(sb.x, sb.y); c.scale(sc, sc);
  if (IN.sup){ c.fillStyle = full ? "rgba(255,236,170,.35)" : "rgba(255,255,255,.12)"; c.beginPath(); c.arc(0, 0, sb.r + 14, 0, 6.283); c.fill(); }
  c.fillStyle = full ? "rgba(243,210,122,.95)" : "rgba(20,14,28,.6)"; c.beginPath(); c.arc(0, 0, sb.r, 0, 6.283); c.fill();
  if (full){ c.strokeStyle = `rgba(243,210,122,${.4 + .4*Math.sin(t*6)})`; c.lineWidth = 6; c.beginPath(); c.arc(0, 0, sb.r + 7, 0, 6.283); c.stroke(); }
  c.strokeStyle = "#f3d27a"; c.lineWidth = 5; c.beginPath(); c.arc(0, 0, sb.r - 3, -Math.PI/2, -Math.PI/2 + me.sup*6.283); c.stroke();
  c.fillStyle = full ? "#3a1630" : "rgba(243,210,122,.7)"; c.beginPath(); c.moveTo(3, -16); c.lineTo(-9, 3); c.lineTo(-1, 3); c.lineTo(-4, 16); c.lineTo(9, -3); c.lineTo(1, -3); c.closePath(); c.fill();
  c.restore();
  if (IN.sup && full){ const v = stickVec(IN.sup), cancel = IN.sup.max >= DEAD && v.d < DEAD; c.fillStyle = cancel ? "rgba(160,150,170,.9)" : "rgba(243,210,122,.9)"; c.beginPath(); c.arc(sx, sy, 16, 0, 6.283); c.fill(); }
}

/* =================== МАТЧ =================== */
function startMatch(mode){
  uid = 0;
  G = {mode, map: loadMap(MODES[mode].map), fighters: [], shots: [], lobs: [], picks: [], fx: [], parts: [], nums: [], t: 0, el: 0, left: MODES[mode].time, shake: 0,
    input: {mx: 0, my: 0}, aggrAlly: .55, errAlly: .1, aggrFoe: .4 + Math.min(.15, S.cups/1500), errFoe: .2 - Math.min(.08, S.cups/1250), mapDirty: true, over: false, paused: false, myGems: 0, rustle: {}, supFullT: -9};
  MODES[mode].setup();
  G.fighters.forEach(f => { f.ai.t = 1 + Math.random()*.4; });
  cam.x = G.me.x; cam.y = G.me.y;
  dropInputs(); IN.fades = []; IN.used = {}; cam.reset = true;
  document.querySelectorAll(".screen,.ovl").forEach(s => s.classList.remove("on")); $("#stage").classList.add("playing");
  hudT = 0;
}
function endMatch(r, place){
  if (G.over) return; G.over = true;
  const res = MODES[G.mode].result(r, place), good = r === "win" || (r === "place" && place <= 2);
  S.cups = Math.max(0, S.cups + res.cups); save();
  setTimeout(() => { good ? snd.win() : snd.lose(); haptic(good ? [12, 40, 18] : 20); }, 300);
  setTimeout(() => {
    $("#resT").textContent = res.title; $("#resP").textContent = res.text;
    const c = $("#resCups"), fmt = v => "🏆 " + (v === 0 ? "" : res.cups >= 0 ? "+" : "−") + Math.abs(v); c.className = "big " + (res.cups >= 0 ? "up" : "down");
    if (reduced() || !res.cups) c.textContent = fmt(res.cups); else { const t0 = performance.now() + 250, D = 650; c.textContent = fmt(0);
      const tick = () => { const k = clamp((performance.now() - t0)/D, 0, 1), e = 1 - Math.pow(1 - k, 3); c.textContent = fmt(Math.round(res.cups*e)); if (k < 1 && $("#resOv").classList.contains("on")) requestAnimationFrame(tick); else c.textContent = fmt(res.cups); };
      requestAnimationFrame(tick); }
    $("#resStats").innerHTML = res.stats.map(([v, l]) => `<div><b>${v}</b><small>${l}</small></div>`).join("");
    $("#resOv").classList.add("on"); $("#stage").classList.remove("lowhp");
  }, 1300);
}
function togglePause(on){ if (!G || G.over) return; G.paused = on; if (on) dropInputs(); $("#pauseOv").classList.toggle("on", on); }
$("#pauseBtn").addEventListener("click", () => { snd.tap(); togglePause(true); });
$("#resume").addEventListener("click", () => { snd.tap(); togglePause(false); });
$("#quit").addEventListener("click", () => { snd.tap(); $("#pauseOv").classList.remove("on"); G.paused = false; endMatch(G.mode === "surv" ? "place" : "lose", G.fighters.filter(f => !f.dead).length); });
$("#again").addEventListener("click", () => { snd.tap(); startMatch(G.mode); });
$("#toMenu").addEventListener("click", () => { snd.tap(); showMenu(); });
document.addEventListener("visibilitychange", () => { if (!document.hidden) return; dropInputs(); if (G && !G.over) togglePause(true); });

/* =================== ЦИКЛ =================== */
let last = performance.now(), hudT = 0;
function frame(now){
  const dt = Math.min(1/30, (now - last)/1000); last = now; const t = now/1000;
  if (G && !G.paused){
    if (!G.over){
      G.t += dt; G.el += dt; readInput();
      MODES[G.mode].step(dt);
      for (const f of G.fighters) stepFighter(f, dt);
      if (IN.buf && G.t >= IN.buf.t){ const b = IN.buf; IN.buf = null; b.fn(); }
      stepShots(dt);
      hudT -= dt; if (hudT <= 0){ hudT = .2; MODES[G.mode].hud(); $("#stage").classList.toggle("lowhp", !G.me.dead && G.me.hp < G.me.maxHp*.3); }
    }
    stepFx(dt);
  }
  if (G) render(t);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* =================== МЕНЮ =================== */
const CAT_INFO = {
  alisa: {t: "Алиса", s: "Стреляет издалека тремя каплями веером. Супер: укус в прыжке, лечит её саму.", st: ["❤️ 3200", "🎯 дальняя"]},
  lapula: {t: "Лапуля", s: "Бьёт когтями вблизи и держит удар. Супер: прыжок через стены и оглушение.", st: ["❤️ 4900", "🐾 ближняя"]}
};
const MODE_INFO = [
  ["gems", "🩸", "Капли 3×3", "Алиса, Лапуля и Уголёк против трёх охотников. Из фонтана сыплются капли: собери 10 и продержись 15 секунд.", () => { const r = S.rec.gems; return r.w + r.l + r.d ? `побед ${r.w} · поражений ${r.l}` : ""; }],
  ["surv", "🌫️", "Последняя на арене", "Шесть бойцов, каждый сам за себя. Ломай коробки ради силы, туман сжимает арену.", () => S.rec.surv.best ? `лучшее место: ${S.rec.surv.best} · побед ${S.rec.surv.wins}` : ""],
  ["waves", "🦇", "Волны и босс", "Вдвоём против шести волн летучих мышей и охотников. В конце Старый охотник.", () => S.rec.waves.best ? `рекорд: ${S.rec.waves.best} из 6 волн` : ""]
];
const SND_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="#fff"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>';
const HAP_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="4" width="8" height="16" rx="2"/><path d="M4.5 9v6M19.5 9v6"/></svg>';
const HAP_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="4" width="8" height="16" rx="2"/><path d="M4 4l16 16"/></svg>';
const SND_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="#fff"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>';
function portrait(cnv, kind){
  const k = 2, c = cnv.getContext("2d"); cnv.width = 96*k; cnv.height = 96*k; c.scale(k, k);
  const fake = {C: KINDS[kind], id: kind === "alisa" ? 1 : 2, walk: 0, face: Math.PI/2, moveFace: kind === "alisa" ? 0 : Math.PI};
  c.fillStyle = "rgba(0,0,0,.3)"; c.beginPath(); c.ellipse(48, 76, 30, 10, 0, 0, 6.283); c.fill();
  drawCat(c, fake, 48, 58, 34, 0);
}
function showMenu(){
  G = null; $("#stage").classList.remove("playing", "lowhp"); document.querySelectorAll(".ovl").forEach(o => o.classList.remove("on")); $("#menu").classList.add("on");
  $("#cups").textContent = "🏆 " + S.cups; $("#sndBtn").innerHTML = S.sfx ? SND_ON : SND_OFF; $("#hapBtn").innerHTML = S.hap ? HAP_ON : HAP_OFF;
  const cats = $("#cats"); cats.innerHTML = "";
  for (const k of ["alisa", "lapula"]){ const I = CAT_INFO[k], b = document.createElement("button"); b.className = "catc" + (S.cat === k ? " on" : ""); b.setAttribute("aria-pressed", S.cat === k);
    b.innerHTML = `<canvas></canvas><b>${I.t}</b><small>${I.s}</small><div class="st">${I.st.map(s => `<span>${s}</span>`).join("")}</div>`;
    portrait(b.querySelector("canvas"), k); b.onclick = () => { S.cat = k; save(); snd.tap(); haptic(6); showMenu(); }; cats.appendChild(b); }
  const ms = $("#modes"); ms.innerHTML = "";
  for (const [id, ic, t, s, rec] of MODE_INFO){ const b = document.createElement("button"); b.className = "mode"; const r = rec();
    b.innerHTML = `<span class="ic">${ic}</span><span><b>${t}</b><small>${s}</small>${r ? `<span class="rec">${r}</span>` : ""}</span>`;
    b.onclick = () => { snd.tap(); haptic(8); if (!S.how && !AUTO){ $("#howOv").classList.add("on"); $("#howGo").onclick = () => { S.how = true; save(); startMatch(id); }; } else startMatch(id); }; ms.appendChild(b); }
}
$("#sndBtn").addEventListener("click", () => { S.sfx = !S.sfx; save(); $("#sndBtn").innerHTML = S.sfx ? SND_ON : SND_OFF; $("#sndBtn").setAttribute("aria-pressed", S.sfx); snd.tap(); });
$("#hapBtn").addEventListener("click", () => { S.hap = !S.hap; save(); $("#hapBtn").innerHTML = S.hap ? HAP_ON : HAP_OFF; $("#hapBtn").setAttribute("aria-pressed", S.hap); snd.tap(); haptic(10); });
/* лёгкое нажатие на карточки и кнопки */
document.addEventListener("pointerdown", e => { const b = e.target.closest(".catc,.mode,.btn"); if (b) b.classList.add("press"); }, {passive: true});
["pointerup", "pointercancel", "pointerleave"].forEach(ev => document.addEventListener(ev, () => document.querySelectorAll(".press").forEach(b => b.classList.remove("press")), {passive: true}));
showMenu();
const qm = location.search.match(/[?&]mode=(\w+)/); if (qm && MODES[qm[1]]) startMatch(qm[1]);
