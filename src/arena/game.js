/* =================== БОЙЦЫ =================== */
/* дальность в клетках, урон за попадание, заряд супера = сколько урона нужно нанести */
const KINDS = {
  alisa:  {name: "Алиса",   cat: "alisa",  hp: 3200, speed: 158, r: 20, ammo: 3, reload: 1.45, atk: "fan",  dmg: 360,  range: 7.2, ps: 640, sup: "bite",   charge: 2300},
  lapula: {name: "Лапуля",  cat: "lapula", hp: 4900, speed: 170, r: 22, ammo: 3, reload: 1.05, atk: "claw", dmg: 1150, range: 2.3, sup: "pounce", charge: 2900},
  black:  {name: "Уголёк",  cat: "black",  hp: 3600, speed: 158, r: 20, ammo: 3, reload: 1.5,  atk: "shot", dmg: 900,  range: 8.2, ps: 760, sup: "volley", charge: 3000},
  hunter: {name: "Охотник", look: "hunter", hp: 3500, speed: 150, r: 21, ammo: 3, reload: 1.6,  atk: "shot", dmg: 740,  range: 8.4, ps: 720, sup: "volley", charge: 3200},
  herb:   {name: "Травница", look: "herb",  hp: 3000, speed: 150, r: 20, ammo: 3, reload: 1.7,  atk: "lob",  dmg: 860,  range: 6.8, ps: 430, sup: "bomb",   charge: 3000},
  brute:  {name: "Громила", look: "brute",  hp: 5800, speed: 158, r: 24, ammo: 3, reload: 1.15, atk: "claw", dmg: 1200, range: 2.2, sup: "charge", charge: 3200},
  bat:    {name: "Мышь",    look: "bat",    hp: 600,  speed: 205, r: 15, ammo: 1, reload: 1.05, atk: "bite", dmg: 230,  range: .75, fly: true},
  boss:   {name: "Старый охотник", look: "boss", hp: 44000, speed: 112, r: 34, ammo: 1, reload: 1.5, atk: "boss", dmg: 620, range: 9, ps: 560}
};
const SUPER_RANGE = {bite: 4.6, pounce: 5.6, volley: 7.5, bomb: 7, charge: 5};

let G = null;                 /* текущий матч */
let uid = 0;
function makeFighter(kind, team, x, y, extra = {}){
  const C = KINDS[kind];
  return Object.assign({id: ++uid, kind, C, team, x, y, sx: x, sy: y, vx: 0, vy: 0, r: C.r, hp: C.hp, maxHp: C.hp, ammo: C.ammo, ammoT: 0, cd: 0,
    sup: 0, face: team === 2 ? Math.PI/2 : -Math.PI/2, lastHurt: -9, lastAtk: -9, reveal: 0, stun: 0, dash: null, dead: false, respawn: 0,
    gems: 0, power: 0, flash: 0, walk: 0, dmgOut: 0, kos: 0, born: G ? G.t : 0, hpG: C.hp, run: 0, lean: 0, dirS: 0, sq: 0, sqv: 0, kx: 0, ky: 0, step: 0, emptyT: -9, popT: -9, healT: -9, ai: {t: 0, path: null, pathT: 0, strafe: Math.random() < .5 ? 1 : -1, wobble: Math.random()*9}}, extra);
}
const isCat = f => !!f.C.cat;

/* =================== КЛЕТКИ И СТОЛКНОВЕНИЯ =================== */
const cellAt = (x, y) => { const m = G.map, cx = Math.floor(x/T), cy = Math.floor(y/T); if (cx < 0 || cy < 0 || cx >= m.W || cy >= m.H) return "#"; return m.g[cy][cx]; };
const solidWalk = c => c === "#" || c === "x" || c === "w";
const solidShot = c => c === "#" || c === "x";
function hitsSolid(x, y, r, test){
  const x0 = Math.floor((x - r)/T), x1 = Math.floor((x + r)/T), y0 = Math.floor((y - r)/T), y1 = Math.floor((y + r)/T);
  for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++){
    const c = (cx < 0 || cy < 0 || cx >= G.map.W || cy >= G.map.H) ? "#" : G.map.g[cy][cx]; if (!test(c)) continue;
    const nx = clamp(x, cx*T, cx*T + T), ny = clamp(y, cy*T, cy*T + T); if ((x - nx)**2 + (y - ny)**2 < r*r) return true; }
  return false;
}
/* шаг с проскальзыванием вдоль стен */
function moveBody(f, dx, dy){
  const test = f.C.fly ? (c => c === "#" && false) : solidWalk, r = f.r*.8;
  const bx = hitsSolid(f.x + dx, f.y, r, test), by = hitsSolid(f.x, f.y + dy, r, test);
  if (!bx) f.x += dx;
  if (!by) f.y += dy;
  /* упёрся в угол краем: если чуть в сторону свободно, съезжаем туда, а не стоим */
  if (!f.C.fly && (bx || by)){ const len = Math.hypot(dx, dy) || 1, nudge = r*.75, step = len*.9;
    if (bx && Math.abs(dy) < len*.3) for (const s of [1, -1]) if (!hitsSolid(f.x + dx, f.y + s*nudge, r, test) && !hitsSolid(f.x, f.y + s*step, r, test)){ f.y += s*step; break; }
    if (by && Math.abs(dx) < len*.3) for (const s of [1, -1]) if (!hitsSolid(f.x + s*nudge, f.y + dy, r, test) && !hitsSolid(f.x + s*step, f.y, r, test)){ f.x += s*step; break; } }
  f.x = clamp(f.x, r, G.map.pw - r); f.y = clamp(f.y, r, G.map.ph - r);
}
function freeSpot(x, y, r){
  if (!hitsSolid(x, y, r, solidWalk)) return {x, y};
  for (let k = 1; k < 8; k++) for (let a = 0; a < 16; a++){ const nx = x + Math.cos(a/16*6.283)*k*T*.5, ny = y + Math.sin(a/16*6.283)*k*T*.5;
    if (nx > r && ny > r && nx < G.map.pw - r && ny < G.map.ph - r && !hitsSolid(nx, ny, r, solidWalk)) return {x: nx, y: ny}; }
  return {x, y};
}
function los(a, b){
  const d = Math.hypot(b.x - a.x, b.y - a.y), n = Math.ceil(d/(T/4));
  for (let i = 1; i < n; i++){ const k = i/n; if (solidShot(cellAt(a.x + (b.x - a.x)*k, a.y + (b.y - a.y)*k))) return false; }
  return true;
}
const inBush = f => cellAt(f.x, f.y) === "b";
/* видит ли команда team бойца f: в кусте виден только вблизи или после выстрела */
function visibleTo(f, team){
  if (f.dead) return false; if (!inBush(f) || f.reveal > 0) return true;
  return G.fighters.some(o => !o.dead && o.team === team && o !== f && dist(o, f) < T*2.3);
}

/* =================== ПУТЬ (поиск в ширину по клеткам) =================== */
function pathTo(f, gx, gy){
  const m = G.map, sx = clamp(Math.floor(f.x/T), 0, m.W - 1), sy = clamp(Math.floor(f.y/T), 0, m.H - 1);
  let tx = clamp(Math.floor(gx/T), 0, m.W - 1), ty = clamp(Math.floor(gy/T), 0, m.H - 1);
  if (solidWalk(m.g[ty][tx])){ const p = freeSpot(gx, gy, 10); tx = clamp(Math.floor(p.x/T), 0, m.W - 1); ty = clamp(Math.floor(p.y/T), 0, m.H - 1); }
  const prev = new Int32Array(m.W*m.H).fill(-1), q = [sy*m.W + sx]; prev[q[0]] = q[0]; let found = false;
  for (let h = 0; h < q.length; h++){ const c = q[h]; if (c === ty*m.W + tx){ found = true; break; }
    const cx = c % m.W, cy = (c - cx)/m.W;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]){
      const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= m.W || ny >= m.H) continue;
      if (solidWalk(m.g[ny][nx])) continue; if (dx && dy && (solidWalk(m.g[cy][nx]) || solidWalk(m.g[ny][cx]))) continue;
      const n = ny*m.W + nx; if (prev[n] !== -1) continue; prev[n] = c; q.push(n); } }
  if (!found) return null;
  const out = []; let c = ty*m.W + tx; while (c !== prev[c]){ out.push({x: (c % m.W + .5)*T, y: (Math.floor(c/m.W) + .5)*T}); c = prev[c]; }
  return out.reverse();
}

/* =================== АТАКИ =================== */
function revealAtk(f){ f.lastAtk = G.t; f.reveal = .9; }
function fire(f, ang, aimPt){
  if (f.dead || f.stun > 0 || f.dash || f.ammo < 1 || f.cd > 0) return false;
  f.ammo -= 1; f.cd = f.C.atk === "claw" ? .38 : .3; f.face = ang; revealAtk(f);
  const C = f.C, mine = f === G.me, vol = mine ? 1 : .45, R = C.range*T;
  kick(f, ang, C.atk === "claw" ? 6 : -4);   /* когти: выпад вперёд, выстрел: отдача назад */ f.sqv += C.atk === "claw" ? -1.6 : 1.8;
  if (C.atk !== "claw") G.fx.push({k: "muzzle", x: f.x + Math.cos(ang)*f.r*.9, y: f.y + Math.sin(ang)*f.r*.9 - 4, ang, t: 0, T: .09, col: C.atk === "fan" ? "#ff8fa3" : C.atk === "lob" ? "#e9f2d0" : "#fff3c4"});
  if (C.atk === "fan"){ [-.17, 0, .17].forEach(d => shoot(f, ang + d, C.dmg, R, C.ps, "drop")); snd.drop(vol); }
  else if (C.atk === "shot"){ shoot(f, ang, C.dmg, R, C.ps, f.kind === "black" ? "spark" : "bolt"); snd.bolt(vol); }
  else if (C.atk === "claw"){ slash(f, ang, C.dmg, R); snd.claw(vol); }
  else if (C.atk === "lob"){ const d = aimPt ? Math.min(R, dist(f, aimPt)) : R*.8; lob(f, f.x + Math.cos(ang)*d, f.y + Math.sin(ang)*d, C.dmg, T*1.25, "garlic"); snd.lob(vol); }
  return true;
}
function shoot(f, ang, dmg, range, speed, look, extra = {}){
  G.shots.push(Object.assign({x: f.x + Math.cos(ang)*f.r*.7, y: f.y + Math.sin(ang)*f.r*.7, vx: Math.cos(ang)*speed, vy: Math.sin(ang)*speed,
    left: range, dmg, team: f.team, owner: f, look, r: look === "drop" ? 9 : 8, ang}, extra));
}
function lob(f, tx, ty, dmg, rad, look){
  const d = Math.hypot(tx - f.x, ty - f.y); G.lobs.push({x0: f.x, y0: f.y, x1: tx, y1: ty, t: 0, T: Math.max(.45, d/(f.C.ps || 430)), dmg, rad, team: f.team, owner: f, look});
}
/* удар когтями или топором: дуга перед бойцом */
function slash(f, ang, dmg, R){
  G.fx.push({k: "slash", x: f.x, y: f.y, ang, R: R + 6, t: 0, T: .22, col: isCat(f) ? "#ffd6e0" : "#d9c6a8"});
  for (const o of G.fighters){ if (o.dead || o.team === f.team) continue; const d = dist(f, o);
    if (d < R + o.r && Math.abs(angDiff(angTo(f, o), ang)) < .75) hurt(o, dmg, f); }
  hitBoxesArc(f, ang, R, dmg);
}
const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= 6.2832; while (d < -Math.PI) d += 6.2832; return d; };
function hitBoxesArc(f, ang, R, dmg){
  const m = G.map; for (const k in m.boxHp){ const [cx, cy] = k.split(",").map(Number), bx = (cx + .5)*T, by = (cy + .5)*T;
    if (Math.hypot(bx - f.x, by - f.y) < R + T*.5 && Math.abs(angDiff(Math.atan2(by - f.y, bx - f.x), ang)) < .8) hurtBox(cx, cy, dmg, f); }
}
function hurtBox(cx, cy, dmg, by){
  const m = G.map, k = cx + "," + cy; if (!(k in m.boxHp)) return;
  m.boxHp[k] -= dmg; G.fx.push({k: "chip", x: (cx + .5)*T, y: (cy + .5)*T, t: 0, T: .3});
  if (by === G.me) snd.box();
  if (m.boxHp[k] <= 0){ delete m.boxHp[k]; m.g[cy][cx] = "."; G.mapDirty = true; puff((cx + .5)*T, (cy + .5)*T, "#b98a5c", 14);
    G.picks.push({k: "power", x: (cx + .5)*T, y: (cy + .5)*T, t: 0}); }
}
/* суперудары */
function castSuper(f, ang, d){
  if (f.dead || f.sup < 1 || f.stun > 0 || f.dash) return false;
  f.sup = 0; f.face = ang; revealAtk(f); const C = f.C, maxD = SUPER_RANGE[C.sup]*T; d = clamp(d ?? maxD, T, maxD);
  if (f === G.me) snd.superGo();
  if (C.sup === "bite"){ f.dash = {k: "bite", vx: Math.cos(ang)*d/.28, vy: Math.sin(ang)*d/.28, t: .28}; }
  else if (C.sup === "pounce"){ f.dash = {k: "pounce", x0: f.x, y0: f.y, x1: f.x + Math.cos(ang)*d, y1: f.y + Math.sin(ang)*d, t: 0, T: .45}; }
  else if (C.sup === "charge"){ f.dash = {k: "charge", vx: Math.cos(ang)*maxD/.42, vy: Math.sin(ang)*maxD/.42, t: .42, hit: new Set()}; }
  else if (C.sup === "volley"){ for (let i = 0; i < 7; i++) shoot(f, ang + (i - 3)*.09, C.dmg*.62, C.range*T*1.05, C.ps*1.05, f.kind === "black" ? "spark" : "bolt"); snd.bolt(f === G.me ? 1 : .5); }
  else if (C.sup === "bomb"){ lob(f, f.x + Math.cos(ang)*d, f.y + Math.sin(ang)*d, 1500, T*2.1, "bomb"); snd.lob(); }
  return true;
}
function dashEnd(f){
  const D = f.dash; f.dash = null;
  if (D.k === "bite"){ G.fx.push({k: "ring", x: f.x, y: f.y, R: T*1.35, t: 0, T: .35, col: "#ff5d7a"}); let any = false;
    for (const o of G.fighters) if (!o.dead && o.team !== f.team && dist(o, f) < T*1.35 + o.r){ hurt(o, 1300, f); any = true; }
    heal(f, 1300); burst(f.x, f.y - 10, "#ff4d6d", 16); f.sq = -.2; if (f === G.me || any) snd.hit(); }
  if (D.k === "pounce"){ const p = freeSpot(f.x, f.y, f.r*.8); f.x = p.x; f.y = p.y; shakeAt(f, .35); f.sq = -.26; f.sqv = 0;
    G.fx.push({k: "ring", x: f.x, y: f.y, R: T*1.8, t: 0, T: .4, col: "#ffd27a"});
    for (const o of G.fighters) if (!o.dead && o.team !== f.team && dist(o, f) < T*1.8 + o.r){ hurt(o, 1000, f); o.stun = Math.max(o.stun, 1.3); }
    puff(f.x, f.y + 10, "#cdb9d8", 12); snd.boom(f === G.me ? 1 : .5); }
}
function heal(f, n){ if (f.dead) return; const h = Math.min(n, f.maxHp - f.hp); if (h <= 0) return; f.hp += h; f.hpG = Math.max(f.hpG, f.hp); f.healT = G.t; G.nums.push({x: f.x, y: f.y - f.r*1.6, s: "+" + Math.round(h), t: 0, col: "#7dff9a"}); }

/* =================== УРОН =================== */
function hurt(o, dmg, src){
  if (o.dead || G.over) return;
  dmg = Math.round(dmg*(1 + .1*(src.power || 0))*(src.dmgMul || 1)*(o.armor || 1));
  o.hp -= dmg; o.lastHurt = G.t; o.flash = .1; o.reveal = Math.max(o.reveal, .6);
  if (src && src !== o){ kick(o, angTo(src, o), Math.min(7, 3 + dmg/300)); o.sqv -= 2.2;
    src.dmgOut += dmg; if (src.C.charge && src.sup < 1){ src.sup = Math.min(1, src.sup + dmg/src.C.charge); if (src.sup >= 1 && src === G.me){ snd.superReady(); G.supFullT = G.t; } } }
  /* три капли веера по одной цели дают одно число, а не три */
  const same = G.nums.find(n => n.o === o && n.src === src && n.t < .16 && n.v);
  if (same){ same.v += dmg; same.s = String(same.v); same.t = 0; same.pop = 1; }
  else G.nums.push({x: o.x + rand(-8, 8), y: o.y - o.r*1.5, s: String(dmg), v: dmg, o, src, t: 0, pop: 1, col: o === G.me ? "#ff8a9e" : src === G.me ? "#fff" : "rgba(255,255,255,.7)"});
  if (o === G.me){ snd.hurt(); shakeAt(o, .3); hurtFlash(); } else if (src === G.me) snd.hit();
  if (o.hp <= 0) ko(o, src);
}
function ko(o, src){
  o.hp = 0; o.dead = true; o.dash = null; if (src && src !== o) src.kos++;
  G.fx.push({k: "ghost", f: Object.assign({}, o, {dead: false, flash: 0, sq: 0, kx: 0, ky: 0, hop: 0}), x: o.x, y: o.y, t: 0, T: .5});
  burst(o.x, o.y, o.C.cat ? "#c9c3d6" : o.kind === "bat" ? "#5b3a6e" : "#a07a5a", 22);
  if (o.team === G.me.team) { if (o === G.me) snd.ko(); } else snd.koEnemy();
  /* капли и сила высыпаются */
  for (let i = 0; i < o.gems; i++){ const a = rand(0, 6.28), d = rand(T*.4, T*1.4), p = freeSpot(o.x + Math.cos(a)*d, o.y + Math.sin(a)*d, 10); G.picks.push({k: "gem", x: o.x, y: o.y, tx: p.x, ty: p.y, t: 0}); }
  o.gems = 0;
  if (G.mode === "surv"){ for (let i = 0; i < 1 + Math.floor(o.power/2); i++){ const p = freeSpot(o.x + rand(-T*.6, T*.6), o.y + rand(-T*.6, T*.6), 10); G.picks.push({k: "power", x: p.x, y: p.y, t: 0}); } }
  MODES[G.mode].onKo && MODES[G.mode].onKo(o, src);
}
function respawnAt(f, p){ const q = freeSpot(p.x, p.y, f.r*.8); Object.assign(f, {x: q.x, y: q.y, hp: f.maxHp, dead: false, ammo: f.C.ammo, stun: 0, dash: null, reveal: 0, lastHurt: -9}); f.spawnShield = 1.6; f.born = G.t; f.hpG = f.hp; f.kx = f.ky = f.sq = f.sqv = 0; G.fx.push({k: "ring", x: f.x, y: f.y, R: T*.9, t: 0, T: .5, col: f.team === G.me.team ? "#8fd0ff" : "#ff9db0"}); }

/* =================== ЭФФЕКТЫ =================== */
function burst(x, y, col, n){ if (reduced()) n = Math.min(n, 5); for (let i = 0; i < n; i++){ const a = rand(0, 6.28), v = rand(60, 260); G.parts.push({x, y, vx: Math.cos(a)*v, vy: Math.sin(a)*v, t: 0, T: rand(.35, .8), col, s: rand(2, 5)}); } }
function puff(x, y, col, n){ for (let i = 0; i < n; i++){ const a = rand(0, 6.28), v = rand(30, 120); G.parts.push({x, y, vx: Math.cos(a)*v, vy: Math.sin(a)*v - 30, t: 0, T: rand(.4, .9), col, s: rand(4, 9), puff: true}); } }
function kick(f, ang, px){ if (reduced()) px *= .4; f.kx += Math.cos(ang)*px; f.ky += Math.sin(ang)*px; }
function shakeAt(f, k){ if (f === G.me || dist(f, G.me) < T*5) G.shake = Math.min(1, G.shake + k*(f === G.me ? 1 : .5)); }
let hurtT = 0; function hurtFlash(){ const h = $("#hurt"); h.style.opacity = 1; clearTimeout(hurtT); hurtT = setTimeout(() => h.style.opacity = 0, 140); }
function banner(big, small, ms){ const b = $("#banner"); b.querySelector("b").textContent = big; b.querySelector("span").textContent = small || ""; b.classList.remove("on"); void b.offsetWidth; b.classList.add("on"); }

/* =================== ИИ =================== */
/* думает 4–5 раз в секунду: выбирает цель и точку, куда идти; стреляет каждый кадр, если цель в прицеле */
function enemiesOf(f){ return G.fighters.filter(o => !o.dead && o.team !== f.team && visibleTo(o, f.team)); }
function nearest(f, list){ let best = null, bd = 1e9; for (const o of list){ const d = dist(f, o); if (d < bd){ bd = d; best = o; } } return best; }
function aiThink(f){
  const ai = f.ai, foes = enemiesOf(f); let tgt = nearest(f, foes);
  if (tgt && dist(f, tgt) > T*11) tgt = null;
  ai.tgt = tgt; ai.goal = MODES[G.mode].goal(f, tgt) || (tgt ? engagePoint(f, tgt) : {x: f.x, y: f.y});
}
function engagePoint(f, tgt){
  const R = f.C.range*T, melee = f.C.range < 3, low = f.hp < f.maxHp*.33 && !melee && f.kind !== "bat";
  const a = angTo(tgt, f), want = low ? R*1.4 : melee ? 0 : R*.68;
  const side = f.ai.strafe*Math.sin(G.t*1.3 + f.ai.wobble)*T*1.4;
  return {x: tgt.x + Math.cos(a)*want - Math.sin(a)*side, y: tgt.y + Math.sin(a)*want + Math.cos(a)*side};
}
function aiAct(f, dt){
  const ai = f.ai; ai.t -= dt; if (ai.t <= 0){ ai.t = .2 + Math.random()*.1; aiThink(f); }
  /* движение: напрямую, если видно, иначе по клеткам */
  let mx = 0, my = 0; const goal = ai.goal;
  if (goal){
    const d = Math.hypot(goal.x - f.x, goal.y - f.y);
    if (d > 10){
      let wp = goal;
      if (!f.C.fly && !los(f, goal)){ ai.pathT -= dt; if (!ai.path || ai.pathT <= 0 || !ai.pathGoal || Math.hypot(ai.pathGoal.x - goal.x, ai.pathGoal.y - goal.y) > T){ ai.path = pathTo(f, goal.x, goal.y); ai.pathT = .5; ai.pathGoal = goal; }
        if (ai.path){ while (ai.path.length > 1 && Math.hypot(ai.path[0].x - f.x, ai.path[0].y - f.y) < T*.45) ai.path.shift(); if (ai.path.length) wp = ai.path[0]; } }
      const dd = Math.hypot(wp.x - f.x, wp.y - f.y) || 1; mx = (wp.x - f.x)/dd; my = (wp.y - f.y)/dd;
    }
  }
  ai.mx = mx; ai.my = my;
  /* стрельба */
  const tgt = ai.tgt; if (!tgt || tgt.dead) return; const d = dist(f, tgt), C = f.C;
  if (f.sup >= 1 && C.sup && d < SUPER_RANGE[C.sup]*T*(C.sup === "pounce" || C.sup === "bite" ? .9 : .85) && (C.sup === "pounce" || C.sup === "bomb" || los(f, tgt)) && Math.random() < .5*dt*8){
    castSuper(f, angTo(f, tgt), d); return; }
  if (C.atk === "boss") return;
  if (C.atk === "bite"){ if (d < f.r + tgt.r + C.range*T && f.cd <= 0){ f.cd = C.reload; hurt(tgt, C.dmg, f); f.face = angTo(f, tgt); } return; }
  const inR = C.atk === "claw" ? d < C.range*T + tgt.r*.8 : d < C.range*T*.95;
  const foe = f.team !== G.me.team || G.mode === "surv", aggr = foe ? G.aggrFoe : G.aggrAlly, aimErr = foe ? G.errFoe : G.errAlly;
  if (inR && (C.atk === "lob" || los(f, tgt)) && f.ammo >= 1 && f.cd <= 0 && Math.random() < aggr*dt*10){
    const lead = C.atk === "claw" ? 0 : d/(C.ps || 600)*(Math.random() < .65 ? 1 : 0);
    const px = tgt.x + tgt.vx*lead, py = tgt.y + tgt.vy*lead, err = aimErr*(Math.random()*2 - 1);
    fire(f, Math.atan2(py - f.y, px - f.x) + err, {x: px, y: py});
  }
}
/* ближайший враг для автоприцела игрока; в одиночном режиме можно бить и коробки */
function autoTarget(f){
  const foes = enemiesOf(f).filter(o => dist(f, o) < f.C.range*T*1.15 + o.r);
  const t = nearest(f, f.C.atk === "lob" ? foes : foes.filter(o => los(f, o))) || nearest(f, foes); if (t) return t;
  if (G.mode === "surv"){ let best = null, bd = f.C.range*T*1.1; for (const k in G.map.boxHp){ const [cx, cy] = k.split(",").map(Number), b = {x: (cx + .5)*T, y: (cy + .5)*T}, dd = dist(f, b); if (dd < bd){ bd = dd; best = b; } } return best; }
  return null;
}

/* =================== ШАГ СИМУЛЯЦИИ =================== */
function stepFighter(f, dt){
  if (f.dead) return;
  f.cd = Math.max(0, f.cd - dt); f.reveal = Math.max(0, f.reveal - dt); f.flash = Math.max(0, f.flash - dt); f.stun = Math.max(0, f.stun - dt); f.spawnShield = Math.max(0, (f.spawnShield || 0) - dt);
  if (f.ammo < f.C.ammo){ f.ammoT += dt/f.C.reload; if (f.ammoT >= 1){ f.ammoT = 0; f.ammo++; f.popT = G.t; } } else f.ammoT = 0;
  /* восстановление: 3 с без урона и 2,5 с без атак */
  if (G.t - f.lastHurt > 3 && G.t - f.lastAtk > 2.5 && f.hp < f.maxHp && f.kind !== "boss"){ f.hp = Math.min(f.maxHp, f.hp + f.maxHp*.14*dt);
    f.regT = (f.regT || 0) - dt; if (f.regT <= 0 && onScreen(f)){ f.regT = .35; G.parts.push({x: f.x + rand(-f.r*.6, f.r*.6), y: f.y - f.r*.4, vx: 0, vy: -55, t: 0, T: .6, col: "#7dff9a", s: 2.6, plus: true}); } }
  /* белая полоска на месте потерянного здоровья тает через 0,35 с */
  if (f.hpG < f.hp) f.hpG = f.hp; else if (G.t - f.lastHurt > .35) f.hpG = Math.max(f.hp, f.hpG - f.maxHp*1.1*dt);
  /* пружина сплющивания и отдача */
  f.sqv += (-300*f.sq - 17*f.sqv)*dt; f.sq = clamp(f.sq + f.sqv*dt, -.3, .3);
  const kd = Math.exp(-16*dt); f.kx *= kd; f.ky *= kd;
  const ox = f.x, oy = f.y;
  if (f.dash){ const D = f.dash;
    if (D.k === "pounce"){ D.t += dt; const k = Math.min(1, D.t/D.T); f.x = lerp(D.x0, D.x1, k); f.y = lerp(D.y0, D.y1, k); f.x = clamp(f.x, f.r, G.map.pw - f.r); f.y = clamp(f.y, f.r, G.map.ph - f.r); f.hop = Math.sin(k*Math.PI)*28; if (k >= 1){ f.hop = 0; dashEnd(f); } }
    else { moveBody(f, D.vx*dt, D.vy*dt); D.t -= dt;
      if (D.k === "charge") for (const o of G.fighters) if (!o.dead && o.team !== f.team && !D.hit.has(o) && dist(o, f) < f.r + o.r + 6){ D.hit.add(o); hurt(o, 1300, f); moveBody(o, Math.cos(f.face)*T*.9, Math.sin(f.face)*T*.9); o.stun = Math.max(o.stun, .5); }
      if (D.t <= 0){ if (D.k === "charge") f.dash = null; else dashEnd(f); } }
  } else if (f.stun <= 0){
    let mx, my;
    if (f === G.me && !AUTO){ mx = G.input.mx; my = G.input.my; } else { aiAct(f, dt); mx = f.ai.mx || 0; my = f.ai.my || 0; }
    const sp = f.C.speed*(f.slow ? .6 : 1); moveBody(f, mx*sp*dt, my*sp*dt);
    if (mx || my){ if (f !== G.me || !G.input.aiming) f.moveFace = Math.atan2(my, mx); }
  }
  f.vx = (f.x - ox)/Math.max(dt, .001); f.vy = (f.y - oy)/Math.max(dt, .001);
  /* шаг: скорость анимации от реальной скорости, наклон в сторону бега, плавный разворот хвоста */
  const spd = Math.hypot(f.vx, f.vy), runTo = f.dash ? 0 : clamp(spd/f.C.speed, 0, 1);
  f.run = lerp(f.run, runTo, 1 - Math.exp(-14*dt)); f.walk += dt*spd*.075;
  f.lean = lerp(f.lean, reduced() || f.dash ? 0 : clamp(f.vx/f.C.speed, -1, 1)*.11, 1 - Math.exp(-12*dt));
  const dirTo = Math.cos(f.moveFace ?? f.face) < 0 ? -1 : 1; f.dirS = f.dirS ? lerp(f.dirS, dirTo, 1 - Math.exp(-18*dt)) : dirTo;
  if (!f.C.fly && !f.dash && spd > 40){ f.step += spd*dt; if (f.step > 34){ f.step = 0; if (!reduced() && onScreen(f)) G.parts.push({x: f.x - f.vx*.04 + rand(-4, 4), y: f.y + f.r*.55, vx: -f.vx*.08, vy: -12, t: 0, T: .38, col: "rgba(214,198,232,.5)", s: rand(2.5, 4), puff: true}); }
    if (inBush(f) && seenByMe(f)) G.rustle[Math.floor(f.x/T) + "," + Math.floor(f.y/T)] = G.t; }
  /* подбор */
  for (let i = G.picks.length - 1; i >= 0; i--){ const p = G.picks[i]; if (p.tx !== undefined || p.t < .25) continue; if (Math.hypot(p.x - f.x, p.y - f.y) > f.r + 16) continue;
    if (p.k === "gem" && isTeamFighter(f)){ f.gems++; if (f === G.me) G.myGems = (G.myGems || 0) + 1; G.picks.splice(i, 1); if (f === G.me) snd.gem(); else if (f.team === G.me.team) snd.gem(); G.nums.push({x: f.x, y: f.y - f.r*2, s: "+1 🩸", t: 0, col: "#ff8a9e"}); }
    else if (p.k === "power" && G.mode === "surv" && f.kind !== "bat"){ f.power++; f.maxHp += 400; f.hp += 400; G.picks.splice(i, 1); if (f === G.me){ snd.power(); haptic(10); } G.nums.push({x: f.x, y: f.y - f.r*2, s: "сила +1", t: 0, col: "#d6a8ff"}); } }
}
const isTeamFighter = f => f.kind !== "bat" && f.kind !== "boss";
/* видит ли игрок этого бойца прямо сейчас: от этого зависят шорох куста и подсказки */
const seenByMe = f => f === G.me || (G.mode !== "surv" && f.team === G.me.team) || visibleTo(f, G.me.team);
const onScreen = f => Math.abs(f.x - G.me.x) < T*6 && Math.abs(f.y - G.me.y) < T*9;
function stepShots(dt){
  for (let i = G.shots.length - 1; i >= 0; i--){ const s = G.shots[i], step = Math.hypot(s.vx, s.vy)*dt, n = Math.max(1, Math.ceil(step/12)); let dead = false;
    for (let j = 0; j < n && !dead; j++){
      s.x += s.vx*dt/n; s.y += s.vy*dt/n; s.left -= step/n; if (s.left <= 0){ dead = true; G.fx.push({k: "fizz", x: s.x, y: s.y, t: 0, T: .18, col: s.look === "drop" ? "#ff8fa3" : "#e9dcc4"}); break; }
      const c = cellAt(s.x, s.y); if (solidShot(c)){ dead = true; if (c === "x") hurtBox(Math.floor(s.x/T), Math.floor(s.y/T), s.dmg, s.owner); G.fx.push({k: "spark", x: s.x - s.vx*dt/n, y: s.y - s.vy*dt/n, t: 0, T: .2}); break; }
      for (const o of G.fighters){ if (o.dead || o.team === s.team || (o.dash && o.dash.k === "pounce")) continue; if (Math.hypot(o.x - s.x, o.y - s.y) < o.r + s.r){ if (!o.spawnShield) hurt(o, s.dmg, s.owner); dead = true; G.fx.push({k: "spark", x: s.x, y: s.y, t: 0, T: .2, hit: true}); break; } } }
    if (dead) G.shots.splice(i, 1); }
  for (let i = G.lobs.length - 1; i >= 0; i--){ const L = G.lobs[i]; L.t += dt; if (L.t < L.T) continue;
    G.lobs.splice(i, 1); G.fx.push({k: "ring", x: L.x1, y: L.y1, R: L.rad, t: 0, T: .35, col: L.look === "bomb" ? "#f3f0d8" : "#e8f0c8"}); puff(L.x1, L.y1, "#e9f2d0", L.look === "bomb" ? 16 : 8);
    if (L.owner === G.me || dist(G.me, {x: L.x1, y: L.y1}) < T*6) snd.boom(L.owner === G.me ? .9 : .4);
    for (const o of G.fighters) if (!o.dead && o.team !== L.team && Math.hypot(o.x - L.x1, o.y - L.y1) < L.rad + o.r*.5 && !o.spawnShield) hurt(o, L.dmg, L.owner);
    const m = G.map; for (const k in m.boxHp){ const [cx, cy] = k.split(",").map(Number); if (Math.hypot((cx + .5)*T - L.x1, (cy + .5)*T - L.y1) < L.rad + T*.4) hurtBox(cx, cy, L.dmg, L.owner); } }
}
function stepFx(dt){
  for (const arr of [G.fx, G.nums]) for (let i = arr.length - 1; i >= 0; i--){ arr[i].t += dt; if (arr[i].t > (arr[i].T || .8)) arr.splice(i, 1); }
  for (let i = G.parts.length - 1; i >= 0; i--){ const p = G.parts[i]; p.t += dt; if (p.t > p.T){ G.parts.splice(i, 1); continue; } const dr = Math.pow(.9, dt*60); p.vx *= dr; p.vy *= dr; p.x += p.vx*dt; p.y += p.vy*dt; }
  for (const p of G.picks){ p.t += dt;
    if (p.tx === undefined && p.t > .25){ let best = null, bd = 1e9; for (const f of G.fighters){ if (f.dead || !isTeamFighter(f) || (p.k === "power" && G.mode !== "surv")) continue; const d = Math.hypot(p.x - f.x, p.y - f.y); if (d < f.r + 40 && d < bd){ bd = d; best = f; } }
      if (best){ const k = Math.min(1, 520*dt/Math.max(bd, 1)); p.x = lerp(p.x, best.x, k); p.y = lerp(p.y, best.y, k); } }
    if (p.tx !== undefined){ const k = Math.min(1, p.t/.45); p.x = lerp(p.x, p.tx, k*.35); p.y = lerp(p.y, p.ty, k*.35); if (k >= 1){ p.x = p.tx; p.y = p.ty; delete p.tx; delete p.ty; p.t = .3; } } }
  G.shake = Math.max(0, G.shake - dt*1.6);
}
