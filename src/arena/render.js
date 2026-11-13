/* =================== РИСОВАНИЕ =================== */
const cv = $("#cv"), g = cv.getContext("2d", {alpha: false, desynchronized: true});
let VW = 0, VH = 0, DPR = 1, SC = 1;                     /* размер экрана и масштаб мира */
let SAB = 0;                          /* нижний вырез экрана (полоса «домой»), px */
const spriteCache = new Map();         /* капли, нарисованные заранее под текущий масштаб */
function resize(){
  DPR = Math.min(2, devicePixelRatio || 1); VW = innerWidth; VH = innerHeight;
  const sb = document.getElementById("sab"); SAB = sb ? Math.min(40, parseFloat(getComputedStyle(sb).paddingBottom) || 0) : 0;
  cv.width = Math.round(VW*DPR); cv.height = Math.round(VH*DPR);
  SC = Math.min(VW/(T*8.4), VH/(T*13)); if (G) G.mapDirty = true; spriteCache.clear();
}
addEventListener("resize", resize); resize();

/* пол, вода и тени стен один раз в отдельный холст */
let mapCv = null;
function paintMap(){
  const m = G.map, k = SC*DPR; mapCv = mapCv || document.createElement("canvas");
  mapCv.width = Math.ceil(m.pw*k); mapCv.height = Math.ceil(m.ph*k); const c = mapCv.getContext("2d"); c.setTransform(k, 0, 0, k, 0, 0);
  let seed = 7; const rnd = () => (seed = (seed*16807) % 2147483647)/2147483647;
  for (let y = 0; y < m.H; y++) for (let x = 0; x < m.W; x++){
    const ch = m.g[y][x], px = x*T, py = y*T;
    c.fillStyle = (x + y) % 2 ? "#2b2038" : "#2f2340"; c.fillRect(px, py, T, T);
    c.fillStyle = "rgba(255,255,255,.025)"; for (let i = 0; i < 3; i++) c.fillRect(px + rnd()*T, py + rnd()*T, 2 + rnd()*3, 2);
    if (ch === "w"){ c.fillStyle = "#1a2a4a"; c.fillRect(px, py, T, T); c.fillStyle = "rgba(140,190,255,.18)"; c.fillRect(px + 6, py + 12, T*.5, 2); c.fillRect(px + T*.3, py + T*.6, T*.45, 2); }
  }
  /* тень под стенами и коробками */
  c.fillStyle = "rgba(0,0,0,.28)";
  for (let y = 0; y < m.H; y++) for (let x = 0; x < m.W; x++) if (m.g[y][x] === "#" || m.g[y][x] === "x") c.fillRect(x*T + 4, y*T + T - 4, T, 10);
  if (G.map.spots.G.length){ const f = G.map.spots.G[0]; c.fillStyle = "#3d2a4a"; c.beginPath(); c.arc(f.x, f.y, T*.62, 0, 6.283); c.fill(); c.strokeStyle = "#5c4470"; c.lineWidth = 4; c.stroke(); }
  c.strokeStyle = "rgba(243,210,122,.25)"; c.lineWidth = 3; c.strokeRect(1.5, 1.5, m.pw - 3, m.ph - 3);
  G.mapDirty = false;
}

/* ---------- персонажи ---------- */
function drawCat(c, f, x, y, r, t){
  const P = CATS[f.C.cat], face = f.moveFace ?? f.face, dir = f.dirS || (Math.cos(face) < 0 ? -1 : 1), bob = Math.sin(f.walk)*1.2*(f.run ?? 1), ang = f.face;
  /* хвост */
  c.strokeStyle = P.fur; c.lineWidth = r*.28; c.lineCap = "round"; c.beginPath();
  const tx = x - dir*r*.7, ty = y + r*.35, w = Math.sin(t*3 + f.id)*r*.25;
  c.moveTo(tx, ty); c.quadraticCurveTo(tx - dir*r*.7, ty - r*.1 + w, tx - dir*r*.55, ty - r*.75 + w); c.stroke();
  /* плащ Алисы / шарфик Лапули / ошейник Уголька */
  if (f.C.cat === "alisa"){ c.fillStyle = P.acc; c.beginPath(); c.moveTo(x - r*.75, y - r*.25); c.quadraticCurveTo(x, y + r*1.15, x + r*.75, y - r*.25); c.closePath(); c.fill(); }
  /* тело */
  c.fillStyle = P.fur; c.beginPath(); c.ellipse(x, y + r*.2 + bob*.3, r*.82, r*.68, 0, 0, 6.283); c.fill();
  c.fillStyle = P.shade; c.beginPath(); c.ellipse(x - r*.35, y + r*.72, r*.22, r*.14, 0, 0, 6.283); c.ellipse(x + r*.35, y + r*.72, r*.22, r*.14, 0, 0, 6.283); c.fill();
  /* голова */
  const hy = y - r*.42 + bob;
  c.fillStyle = P.fur; c.beginPath();
  c.moveTo(x - r*.72, hy - r*.1); c.lineTo(x - r*.62, hy - r*.92); c.lineTo(x - r*.18, hy - r*.55); c.lineTo(x + r*.18, hy - r*.55); c.lineTo(x + r*.62, hy - r*.92); c.lineTo(x + r*.72, hy - r*.1); c.closePath(); c.fill();
  c.beginPath(); c.ellipse(x, hy, r*.78, r*.62, 0, 0, 6.283); c.fill();
  c.fillStyle = "#c98f9b"; c.globalAlpha = .55; c.beginPath(); c.moveTo(x - r*.56, hy - r*.35); c.lineTo(x - r*.52, hy - r*.78); c.lineTo(x - r*.28, hy - r*.5); c.fill();
  c.beginPath(); c.moveTo(x + r*.56, hy - r*.35); c.lineTo(x + r*.52, hy - r*.78); c.lineTo(x + r*.28, hy - r*.5); c.fill(); c.globalAlpha = 1;
  if (f.C.cat === "lapula"){ c.fillStyle = P.acc; c.beginPath(); c.ellipse(x, hy + r*.52, r*.55, r*.13, 0, 0, 6.283); c.fill(); }
  if (f.C.cat === "black"){ c.fillStyle = P.acc; c.beginPath(); c.ellipse(x, hy + r*.5, r*.48, r*.1, 0, 0, 6.283); c.fill(); c.fillStyle = "#f3d27a"; c.beginPath(); c.arc(x, hy + r*.62, r*.09, 0, 6.283); c.fill(); }
  /* глаза смотрят туда, куда целится */
  const ex = Math.cos(ang)*r*.07, ey = Math.sin(ang)*r*.06, blink = (Math.sin(t*.9 + f.id*2) > .985) ? .15 : 1;
  for (const s of [-1, 1]){ c.fillStyle = P.eyes; c.beginPath(); c.ellipse(x + s*r*.3, hy - r*.04, r*.17, r*.19*blink, 0, 0, 6.283); c.fill();
    if (blink > .5){ c.fillStyle = "#141014"; c.beginPath(); c.ellipse(x + s*r*.3 + ex, hy - r*.04 + ey, r*.055, r*.14, 0, 0, 6.283); c.fill(); } }
  c.fillStyle = P.nose; c.beginPath(); c.moveTo(x - r*.08, hy + r*.18); c.lineTo(x + r*.08, hy + r*.18); c.lineTo(x, hy + r*.27); c.fill();
}
function drawHunter(c, f, x, y, r, t){
  const L = f.C.look, cloak = {hunter: "#3f2c25", herb: "#2f3d2b", brute: "#4a2626", boss: "#2a1a24"}[L], a = f.face, bob = Math.sin(f.walk)*1.4;
  /* оружие под плащом */
  c.save(); c.translate(x, y + bob*.3); c.rotate(a);
  if (L === "brute"){ c.fillStyle = "#6b5640"; c.fillRect(r*.2, -3, r*1.25, 6); c.fillStyle = "#cfd3da"; c.beginPath(); c.moveTo(r*1.25, -r*.55); c.quadraticCurveTo(r*1.75, 0, r*1.25, r*.55); c.lineTo(r*1.1, 0); c.fill(); }
  else if (L === "herb"){ c.fillStyle = "#e9eedb"; c.beginPath(); c.arc(r*1.05, 0, r*.28, 0, 6.283); c.fill(); c.strokeStyle = "#7da35a"; c.lineWidth = 2; c.beginPath(); c.moveTo(r*1.05, -r*.28); c.lineTo(r*1.1, -r*.5); c.stroke(); }
  else { c.strokeStyle = "#8a6b4a"; c.lineWidth = L === "boss" ? 6 : 4; c.beginPath(); c.moveTo(r*.2, 0); c.lineTo(r*1.35, 0); c.stroke();
    c.strokeStyle = "#c9b28c"; c.lineWidth = 3; c.beginPath(); c.arc(r*1.05, 0, r*.5, -1.2, 1.2); c.stroke(); if (L === "boss"){ c.beginPath(); c.arc(r*1.25, 0, r*.5, -1.2, 1.2); c.stroke(); } }
  c.restore();
  /* плащ и голова */
  c.fillStyle = cloak; c.beginPath(); c.ellipse(x, y + r*.15 + bob*.3, r*.88, r*.78, 0, 0, 6.283); c.fill();
  if (L === "boss"){ c.strokeStyle = "#8f1f38"; c.lineWidth = 4; c.stroke(); }
  if (L === "herb"){ c.fillStyle = "#f1f3e6"; for (let i = -2; i <= 2; i++){ c.beginPath(); c.arc(x + i*r*.22, y - r*.1 + Math.abs(i)*r*.07, r*.1, 0, 6.283); c.fill(); } }
  const hy = y - r*.38 + bob;
  c.fillStyle = "#e3c4a3"; c.beginPath(); c.arc(x + Math.cos(a)*r*.12, hy + Math.max(0, Math.sin(a))*r*.08, r*.38, 0, 6.283); c.fill();
  c.fillStyle = "#241a16"; c.beginPath(); c.ellipse(x, hy - r*.18, r*(L === "boss" ? 1.05 : .82), r*.3, 0, 0, 6.283); c.fill();
  c.beginPath(); c.ellipse(x, hy - r*.32, r*.42, r*.3, 0, 0, 6.283); c.fill();
  c.fillStyle = L === "boss" ? "#8f1f38" : "#6b4a2a"; c.fillRect(x - r*.42, hy - r*.32, r*.84, r*.08);
  if (L === "boss"){ c.strokeStyle = "#e9e2d0"; c.lineWidth = 3; c.beginPath(); c.moveTo(x + r*.35, hy - r*.4); c.quadraticCurveTo(x + r*.9, hy - r*1.1, x + r*1.15, hy - r*.95); c.stroke(); }
}
function drawBat(c, f, x, y, r, t){
  const fl = Math.sin(t*22 + f.id)*.5 + .5;
  c.fillStyle = "#3b2547";
  for (const s of [-1, 1]){ c.beginPath(); c.moveTo(x, y); c.lineTo(x + s*r*1.6, y - r*(.2 + fl*.9)); c.lineTo(x + s*r*1.2, y + r*.3); c.lineTo(x + s*r*.8, y + r*.05); c.lineTo(x + s*r*.5, y + r*.4); c.closePath(); c.fill(); }
  c.beginPath(); c.ellipse(x, y, r*.55, r*.65, 0, 0, 6.283); c.fill();
  c.beginPath(); c.moveTo(x - r*.4, y - r*.4); c.lineTo(x - r*.3, y - r*.95); c.lineTo(x - r*.05, y - r*.5); c.moveTo(x + r*.4, y - r*.4); c.lineTo(x + r*.3, y - r*.95); c.lineTo(x + r*.05, y - r*.5); c.fill();
  c.fillStyle = "#ff3b55"; c.beginPath(); c.arc(x - r*.2, y - r*.2, r*.11, 0, 6.283); c.arc(x + r*.2, y - r*.2, r*.11, 0, 6.283); c.fill();
}
/* вспышка попадания: боец рисуется в маленький холст и заливается белым только по своим пикселям.
   canvas filter давал рывки кадра по 100 мс, а в части версий Safari не работает вовсе */
const tintCv = document.createElement("canvas"), tintC = tintCv.getContext("2d");
function drawTinted(c, draw, x, y, R, col, a){
  const M = c.getTransform(), s = M.a, S = Math.ceil(R*2*s) + 4;
  if (tintCv.width < S){ tintCv.width = tintCv.height = S; }
  tintC.setTransform(1, 0, 0, 1, 0, 0); tintC.clearRect(0, 0, S, S); tintC.globalAlpha = 1; tintC.globalCompositeOperation = "source-over";
  tintC.setTransform(s, 0, 0, s, S/2 - s*x, S/2 - s*y); draw(tintC);
  tintC.setTransform(1, 0, 0, 1, 0, 0); tintC.globalCompositeOperation = "source-atop"; tintC.globalAlpha = a; tintC.fillStyle = col; tintC.fillRect(0, 0, S, S);
  tintC.globalCompositeOperation = "source-over"; tintC.globalAlpha = 1;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(tintCv, 0, 0, S, S, Math.round(M.a*x + M.e - S/2), Math.round(M.d*y + M.f - S/2), S, S); c.restore();
}
const popEase = k => k >= 1 ? 1 : 1 + 2.2*Math.pow(k - 1, 3) + 1.2*Math.pow(k - 1, 2);   /* выскакивает с перелётом ~10 % */
function bodyDraw(c, f, x, y, r, t, extra = 1){
  const run = f.run || 0, gait = f.C.fly ? 0 : Math.abs(Math.sin(f.walk || 0))*3.2*run, fy = y + r*.7;
  const sp = (f.born !== undefined && G ? popEase(clamp((G.t - f.born)/.42, 0, 1)) : 1)*extra;
  const sx = (1 + (f.sq || 0) - .03*gait/3.2)*sp, sy = (1 - (f.sq || 0) + .05*gait/3.2)*sp;
  c.save(); c.translate(x + (f.kx || 0), fy + (f.ky || 0)*.6 - gait); c.rotate(f.lean || 0); c.scale(sx, sy); c.translate(-x, -fy);
  if (f.C.cat) drawCat(c, f, x, y, r, t); else if (f.kind === "bat") drawBat(c, f, x, y, r, t); else drawHunter(c, f, x, y, r, t);
  c.restore();
}
function drawFighter(c, f, t){
  if (f.dead) return;
  const hidden = inBush(f) && f.reveal <= 0, mine = f.team === G.me.team || (G.mode === "surv" && f === G.me);
  if (hidden && !mine && !visibleTo(f, G.me.team)) return;
  const r = f.r, x = f.x, y = f.y - (f.hop || 0) - (f.C.fly ? 6 + Math.sin(t*3 + f.id)*3 : 0);
  c.globalAlpha = hidden ? .55 : 1;
  /* тень и кольцо команды */
  c.fillStyle = "rgba(0,0,0,.35)"; c.beginPath(); c.ellipse(f.x, f.y + r*.62, r*(1 - (f.hop || 0)/80), r*.42, 0, 0, 6.283); c.fill();
  const team = f === G.me ? "#f3d27a" : (G.mode === "surv" ? "#ff4d6d" : f.team === G.me.team ? "#5aa9ff" : "#ff4d6d");
  c.strokeStyle = team; c.lineWidth = f === G.me ? 3.5 : 2.5; c.beginPath(); c.ellipse(f.x, f.y + r*.62, r*1.05, r*.45, 0, 0, 6.283); c.stroke();
  if (f.spawnShield > 0){ c.strokeStyle = "rgba(160,220,255,.6)"; c.lineWidth = 2; c.beginPath(); c.arc(x, y, r*1.35, 0, 6.283); c.stroke(); }
  /* готовый супер: золотое кольцо под ногами пульсирует */
  if (f === G.me && f.sup >= 1){ c.strokeStyle = `rgba(243,210,122,${.35 + .3*Math.sin(t*6)})`; c.lineWidth = 5; c.beginPath(); c.ellipse(f.x, f.y + r*.62, r*1.3, r*.58, 0, 0, 6.283); c.stroke(); }
  if (f.flash > 0) drawTinted(c, cc => bodyDraw(cc, f, x, y, r, t), x, y, r*2.4, "#fff", .55 + f.flash*3.5);
  else bodyDraw(c, f, x, y, r, t);
  if (f.stun > 0){ c.fillStyle = "#ffe08a"; for (let i = 0; i < 3; i++){ const a = t*5 + i*2.1; c.beginPath(); c.arc(x + Math.cos(a)*r*.7, y - r*1.25 + Math.sin(a)*r*.2, 3, 0, 6.283); c.fill(); } }
  c.globalAlpha = 1;
  /* полоска здоровья */
  const bw = f.kind === "boss" ? 84 : 50, by = y - r*1.55 - (f.C.cat ? 6 : 0);
  c.fillStyle = "rgba(10,6,16,.75)"; rr(c, x - bw/2 - 2, by - 2, bw + 4, 10, 5); c.fill();
  const hk = clamp(f.hp/f.maxHp, 0, 1), gk = clamp((f.hpG ?? f.hp)/f.maxHp, 0, 1);
  if (gk > hk + .002){ c.fillStyle = "rgba(255,240,230,.85)"; rr(c, x - bw/2, by, bw*gk, 6, 3); c.fill(); }
  c.fillStyle = f === G.me ? "#7dde72" : team === "#5aa9ff" ? "#5aa9ff" : "#ff4d6d"; if (hk > 0){ rr(c, x - bw/2, by, Math.max(6, bw*hk), 6, 3); c.fill(); }
  const hl = G.t - (f.healT ?? -9); if (hl < .35){ c.strokeStyle = `rgba(125,255,154,${1 - hl/.35})`; c.lineWidth = 2; rr(c, x - bw/2 - 2, by - 2, bw + 4, 10, 5); c.stroke(); }
  if (f === G.me){ c.font = "600 11px Unbounded, sans-serif"; c.textAlign = "center"; c.fillStyle = "#fff"; c.fillText(Math.ceil(f.hp), x, by - 5); }
  if (f.gems > 0){ c.font = "600 12px Unbounded, sans-serif"; c.textAlign = "center"; c.fillStyle = "#ff8a9e"; c.fillText("🩸" + f.gems, x, by - (f === G.me ? 19 : 5)); }
  if (G.mode === "surv" && f.power > 0 && f !== G.me){ c.font = "600 10px Unbounded, sans-serif"; c.fillStyle = "#d6a8ff"; c.textAlign = "center"; c.fillText("⚡" + f.power, x, by - 5); }
  /* патроны игрока под ногами */
  if (f === G.me){ const sw = 15, et = G.t - f.emptyT, shake = et < .28 && !reduced() ? Math.sin(et*70)*3*(1 - et/.28) : 0, pt = G.t - f.popT;
    for (let i = 0; i < f.C.ammo; i++){ const sx = x - (sw*f.C.ammo + 3*(f.C.ammo - 1))/2 + i*(sw + 3) + shake, sy = f.y + r*1.15;
      const popI = pt < .18 && i === f.ammo - 1, gr = popI ? 1 + .5*Math.sin(pt/.18*Math.PI) : 1;
      c.fillStyle = et < .28 ? "rgba(255,77,109,.55)" : "rgba(10,6,16,.7)"; rr(c, sx, sy - (gr - 1)*2.5, sw, 5*gr, 2.5*gr); c.fill(); const k = i < f.ammo ? 1 : i === Math.floor(f.ammo) ? f.ammoT : 0;
      c.fillStyle = popI ? "#fff1c9" : i < f.ammo ? "#ffb347" : "rgba(255,179,71,.5)"; if (k > 0){ rr(c, sx, sy - (gr - 1)*2.5, sw*k, 5*gr, 2.5*gr); c.fill(); } } }
}
function rr(c, x, y, w, h, r){ c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

/* ---------- стены, коробки, кусты ---------- */
const WH = 18;      /* высота стены */
function drawBlock(c, cx, cy, kind){
  const x = cx*T, y = cy*T;
  if (kind === "#"){ c.fillStyle = "#3a2d4c"; c.fillRect(x, y + T - WH, T, WH); c.fillStyle = "#56466e"; c.fillRect(x, y - WH, T, T);
    c.strokeStyle = "rgba(0,0,0,.25)"; c.lineWidth = 1.5; c.strokeRect(x + .75, y - WH + .75, T - 1.5, T - 1.5); c.fillStyle = "rgba(255,255,255,.05)"; c.fillRect(x + 6, y - WH + 6, T - 12, 4); }
  else { const hp = G.map.boxHp[cx + "," + cy] ?? 3200, k = hp/3200;
    c.fillStyle = "#8a6440"; c.fillRect(x + 3, y + T - WH, T - 6, WH - 2); c.fillStyle = "#b98a5c"; c.fillRect(x + 3, y - WH + 4, T - 6, T - 6);
    c.fillStyle = "#d8b98a"; c.fillRect(x + T/2 - 4, y - WH + 4, 8, T - 6);
    if (k < .66){ c.strokeStyle = "#5e3f22"; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 10, y - WH + 10); c.lineTo(x + 18, y - WH + 20); c.lineTo(x + 14, y - WH + 28); c.stroke(); }
    if (k < .33){ c.beginPath(); c.moveTo(x + T - 10, y - WH + 12); c.lineTo(x + T - 20, y - WH + 22); c.stroke(); } }
}
function drawBush(c, cx, cy, t, near, rus){
  const x = cx*T, y = cy*T; c.globalAlpha = near ? .5 : 1;
  for (let i = 0; i < 5; i++){ const ox = [12, 34, 22, 8, 38][i], oy = [14, 12, 28, 34, 34][i], rr2 = [13, 12, 15, 11, 11][i], sw = Math.sin(t*1.6 + cx + cy*1.7 + i)*1.2 + (rus ? Math.sin(t*28 + i*1.9)*3.2*rus : 0);
    c.fillStyle = i % 2 ? "#3c5a3a" : "#456b42"; c.beginPath(); c.arc(x + ox + sw, y + oy - 6, rr2, 0, 6.283); c.fill(); }
  c.fillStyle = "rgba(216,86,111,.55)"; c.beginPath(); c.arc(x + 30, y + 10, 2.2, 0, 6.283); c.arc(x + 14, y + 26, 2, 0, 6.283); c.fill();
  c.globalAlpha = 1;
}

/* ---------- кадр ---------- */
const cam = {x: 0, y: 0};
function render(t){
  const c = g; c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = "#140e1c"; c.fillRect(0, 0, cv.width, cv.height);
  if (!G) return;
  if (G.mapDirty || !mapCv) paintMap();
  const m = G.map, me = G.me, viewW = VW/SC, viewH = VH/SC;
  const dt = clamp(t - (cam.t || t), 0, .05); cam.t = t;
  const red = reduced() ? .35 : 1, aiming = G.input && G.input.aiming && !me.dead;
  const lx = me.dead ? 0 : (clamp(me.vx*.14, -T, T) + (aiming ? Math.cos(me.face)*T*.9 : 0))*red, ly = me.dead ? 0 : (clamp(me.vy*.14, -T, T) + (aiming ? Math.sin(me.face)*T*.9 : 0))*red;
  if (cam.reset){ cam.reset = false; cam.bx = me.x; cam.by = me.y; cam.lx = cam.ly = 0; cam.x = cam.y = 0; }
  const kb = 1 - Math.exp(-24*dt), kl = 1 - Math.exp(-5*dt);
  cam.bx = lerp(cam.bx ?? me.x, me.x, kb); cam.by = lerp(cam.by ?? me.y, me.y, kb); cam.lx = lerp(cam.lx || 0, lx, kl); cam.ly = lerp(cam.ly || 0, ly, kl);
  cam.x = clamp(cam.bx + cam.lx, viewW/2 - T*1.5, m.pw - viewW/2 + T*1.5); cam.y = clamp(cam.by + cam.ly + T*.6, viewH/2 - T*1.5, m.ph - viewH/2 + T*2.4);   /* внизу запас под пальцы: кошка не прячется под джойстиком */
  if (m.pw < viewW) cam.x = m.pw/2;
  const vx0 = cam.x - viewW/2 - T, vx1 = cam.x + viewW/2 + T, vy0 = cam.y - viewH/2 - T*1.5, vy1 = cam.y + viewH/2 + T*1.5;   /* что видно: остальное не рисуем */
  const inView = (x, y) => x > vx0 && x < vx1 && y > vy0 && y < vy1;
  const sh = reduced() ? 0 : G.shake*G.shake*9, shx = Math.sin(t*47.3)*sh, shy = Math.sin(t*41.1)*sh;
  const ox = VW/2 - cam.x*SC + shx, oy = VH/2 - cam.y*SC + shy;
  c.setTransform(DPR, 0, 0, DPR, 0, 0);
  /* снаружи арены: тёмная ночь со звёздами */
  c.fillStyle = "rgba(243,227,176,.35)"; for (let i = 0; i < 40; i++){ const sx = ((i*97.3 + cam.x*.2*SC) % VW + VW) % VW, sy = ((i*53.1 + cam.y*.2*SC) % VH + VH) % VH; c.fillRect(sx, sy, 1.5, 1.5); }
  { const k = SC*DPR, wx0 = clamp(-ox/SC, 0, m.pw), wy0 = clamp(-oy/SC, 0, m.ph), wx1 = clamp((VW - ox)/SC, 0, m.pw), wy1 = clamp((VH - oy)/SC, 0, m.ph);
    if (wx1 > wx0 && wy1 > wy0) c.drawImage(mapCv, wx0*k, wy0*k, (wx1 - wx0)*k, (wy1 - wy0)*k, ox + wx0*SC, oy + wy0*SC, (wx1 - wx0)*SC, (wy1 - wy0)*SC); }
  c.setTransform(DPR*SC, 0, 0, DPR*SC, ox*DPR, oy*DPR);
  /* подсказки на полу: фонтан, предупреждения о появлении, цели навесных снарядов */
  if (m.spots.G.length){ const f = m.spots.G[0], p = .5 + .5*Math.sin(t*3); c.fillStyle = `rgba(255,60,90,${.25 + p*.25})`; c.beginPath(); c.arc(f.x, f.y, T*.42, 0, 6.283); c.fill(); }
  for (const e of G.fx) if (e.k === "warn"){ const k = e.t/e.T; c.strokeStyle = `rgba(255,77,109,${.4 + .5*Math.sin(t*14)})`; c.lineWidth = 3; c.beginPath(); c.arc(e.x, e.y, T*.6*(1.2 - k*.4), 0, 6.283); c.stroke(); }
  for (const L of G.lobs){ c.fillStyle = L.team === me.team ? "rgba(90,169,255,.18)" : "rgba(255,77,109,.2)"; c.beginPath(); c.arc(L.x1, L.y1, L.rad, 0, 6.283); c.fill(); }
  aimPreview(c, t);
  /* подбираемое */
  for (const p of G.picks){ if (!inView(p.x, p.y)) continue; const b = Math.sin(t*4 + p.x)*3;
    if (p.k === "gem"){ c.fillStyle = "rgba(255,60,90,.25)"; c.beginPath(); c.arc(p.x, p.y + 8, 10, 0, 6.283); c.fill(); drawDrop(c, p.x, p.y - 4 + b, 11); }
    else { c.fillStyle = "rgba(190,140,255,.3)"; c.beginPath(); c.arc(p.x, p.y, 15 + b, 0, 6.283); c.fill(); c.fillStyle = "#b98aff"; rr(c, p.x - 9, p.y - 12 + b, 18, 20, 6); c.fill(); c.fillStyle = "#fff"; c.font = "700 13px Unbounded, sans-serif"; c.textAlign = "center"; c.fillText("⚡", p.x, p.y + 4 + b); } }
  /* стены, коробки и бойцы по глубине */
  const list = [];
  const cx0 = Math.max(0, Math.floor(vx0/T)), cx1 = Math.min(m.W - 1, Math.ceil(vx1/T)), cy0 = Math.max(0, Math.floor(vy0/T)), cy1 = Math.min(m.H - 1, Math.ceil(vy1/T));
  for (let y = cy0; y <= cy1; y++) for (let x = cx0; x <= cx1; x++){ const ch = m.g[y][x]; if (ch === "#" || ch === "x") list.push({y: (y + 1)*T - 1, k: 0, x, cy: y, ch}); }
  for (const f of G.fighters) if (!f.dead && inView(f.x, f.y)) list.push({y: f.y + f.r*.6, k: 1, f});
  list.sort((a, b) => a.y - b.y);
  for (const it of list){ if (it.k === 0) drawBlock(c, it.x, it.cy, it.ch); else drawFighter(c, it.f, t); }
  /* кусты поверх: бойцы в них спрятаны */
  for (let y = cy0; y <= cy1; y++) for (let x = cx0; x <= cx1; x++) if (m.g[y][x] === "b"){ const near = Math.abs((x + .5)*T - me.x) < T*1.3 && Math.abs((y + .5)*T - me.y) < T*1.3, ru = G.t - (G.rustle[x + "," + y] ?? -9);
    drawBush(c, x, y, t, near, ru < .45 && !reduced() ? 1 - ru/.45 : 0); }
  /* снаряды */
  for (const s of G.shots){ if (!inView(s.x, s.y)) continue;
    if (s.look === "drop"){ c.strokeStyle = "rgba(216,30,69,.32)"; c.lineWidth = 6; c.lineCap = "round"; c.beginPath(); c.moveTo(s.x - s.vx*.045, s.y - s.vy*.045); c.lineTo(s.x, s.y); c.stroke(); drawDrop(c, s.x, s.y, 8, Math.atan2(s.vy, s.vx) + Math.PI/2); }
    else if (s.look === "spark"){ c.fillStyle = "#8fd0ff"; c.beginPath(); c.arc(s.x, s.y, 6, 0, 6.283); c.fill(); c.fillStyle = "rgba(143,208,255,.3)"; c.beginPath(); c.arc(s.x - s.vx*.02, s.y - s.vy*.02, 9, 0, 6.283); c.fill(); }
    else { const a = Math.atan2(s.vy, s.vx), L = s.look === "stake" ? 22 : 18; c.strokeStyle = s.look === "stake" ? "#b8875a" : "#e9dcc4"; c.lineWidth = s.look === "stake" ? 5 : 3; c.beginPath(); c.moveTo(s.x - Math.cos(a)*L, s.y - Math.sin(a)*L); c.lineTo(s.x, s.y); c.stroke();
      c.fillStyle = s.team === me.team ? "#8fd0ff" : "#ff6b7f"; c.beginPath(); c.arc(s.x, s.y, 3.5, 0, 6.283); c.fill(); } }
  for (const L of G.lobs){ const k = L.t/L.T, x = lerp(L.x0, L.x1, k), y = lerp(L.y0, L.y1, k) - Math.sin(k*Math.PI)*T*1.6;
    c.fillStyle = "#f1f3e6"; c.beginPath(); c.arc(x, y, L.look === "bomb" ? 13 : 9, 0, 6.283); c.fill(); c.strokeStyle = "#7da35a"; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y - 9); c.lineTo(x + 2, y - 15); c.stroke(); }
  /* вспышки, кольца, частицы */
  for (const e of G.fx){ const k = e.t/e.T;
    if (e.k === "slash"){ c.strokeStyle = e.col; c.globalAlpha = 1 - k; c.lineWidth = 7*(1 - k) + 1; c.beginPath(); c.arc(e.x, e.y, e.R*(.6 + k*.4), e.ang - .8, e.ang + .8); c.stroke(); c.globalAlpha = 1; }
    else if (e.k === "ring"){ c.strokeStyle = e.col; c.globalAlpha = 1 - k; c.lineWidth = 5*(1 - k) + 1; c.beginPath(); c.arc(e.x, e.y, e.R*(.3 + k*.7), 0, 6.283); c.stroke(); c.globalAlpha = 1; }
    else if (e.k === "spark" || e.k === "chip"){ c.fillStyle = e.k === "chip" ? "#d8b98a" : "#fff3c4"; c.globalAlpha = 1 - k; c.beginPath(); c.arc(e.x, e.y, (e.hit ? 5 : 3) + k*(e.hit ? 12 : 8), 0, 6.283); c.fill(); c.globalAlpha = 1; }
    else if (e.k === "muzzle"){ c.fillStyle = e.col; c.globalAlpha = 1 - k; c.beginPath(); c.arc(e.x, e.y, 9*(1 - k*.5), 0, 6.283); c.fill(); c.globalAlpha = 1; }
    else if (e.k === "fizz"){ c.strokeStyle = e.col; c.globalAlpha = .7*(1 - k); c.lineWidth = 2; c.beginPath(); c.arc(e.x, e.y, 3 + k*7, 0, 6.283); c.stroke(); c.globalAlpha = 1; }
    else if (e.k === "ghost" && inView(e.x, e.y)){ const f = e.f, e2 = 1 - Math.pow(1 - k, 2); c.globalAlpha = 1 - k;
      drawTinted(c, cc => { cc.save(); cc.translate(0, -e2*22); bodyDraw(cc, f, e.x, e.y, f.r, t, 1 + e2*.3); cc.restore(); }, e.x, e.y - 11, f.r*2.8, "#fff", .4 + k*.5); c.globalAlpha = 1; } }
  for (const p of G.parts){ if (!inView(p.x, p.y)) continue; const k = p.t/p.T; c.globalAlpha = (1 - k)*(p.puff ? .5 : 1); c.fillStyle = p.col;
    if (p.plus){ const a = p.s; c.fillRect(p.x - a*1.6, p.y - a*.5, a*3.2, a); c.fillRect(p.x - a*.5, p.y - a*1.6, a, a*3.2); }
    else { c.beginPath(); c.arc(p.x, p.y, p.s*(p.puff ? 1 + k : 1 - k*.5), 0, 6.283); c.fill(); } }
  c.globalAlpha = 1;
  /* туман в одиночном режиме */
  if (G.safeR && G.safeR.k > 0){ const s = G.safeR; c.fillStyle = `rgba(90,200,120,${.22 + .05*Math.sin(t*2)})`;
    c.fillRect(0, 0, m.pw, s.y0); c.fillRect(0, s.y1, m.pw, m.ph - s.y1); c.fillRect(0, s.y0, s.x0, s.y1 - s.y0); c.fillRect(s.x1, s.y0, m.pw - s.x1, s.y1 - s.y0);
    c.strokeStyle = "rgba(140,255,170,.5)"; c.lineWidth = 3; c.strokeRect(s.x0, s.y0, s.x1 - s.x0, s.y1 - s.y0); }
  /* числа урона */
  c.textAlign = "center";
  for (const n of G.nums){ if (!inView(n.x, n.y)) continue; const k = n.t/.8, pk = clamp(n.t/.14, 0, 1), sc = n.pop && !reduced() ? 1 + .45*(1 - pk)*(1 - pk) : 1;
    c.globalAlpha = k > .7 ? (1 - k)/.3 : 1; c.font = `700 ${n.s.length > 4 ? 13 : 15}px Unbounded, sans-serif`;
    c.save(); c.translate(n.x, n.y - k*26); c.scale(sc, sc);
    c.lineWidth = 3; c.strokeStyle = "rgba(10,6,16,.8)"; c.strokeText(n.s, 0, 0); c.fillStyle = n.col; c.fillText(n.s, 0, 0); c.restore(); }
  c.globalAlpha = 1;
  /* стрелки к невидимым на экране союзникам и врагам */
  c.setTransform(DPR, 0, 0, DPR, 0, 0);
  for (const f of G.fighters){ if (f.dead || f === me || (inBush(f) && f.reveal <= 0 && f.team !== me.team)) continue;
    const sx = ox + f.x*SC, sy = oy + f.y*SC; if (sx > 0 && sx < VW && sy > 70 && sy < VH) continue;
    const a = Math.atan2(sy - VH/2, sx - VW/2), px = clamp(sx, 18, VW - 18), py = clamp(sy, 84, VH - 18);
    c.save(); c.translate(px, py); c.rotate(a); c.fillStyle = G.mode !== "surv" && f.team === me.team ? "#5aa9ff" : "#ff4d6d"; c.globalAlpha = .8; c.beginPath(); c.moveTo(9, 0); c.lineTo(-6, -7); c.lineTo(-6, 7); c.fill(); c.restore(); }
  /* игрок выбыл: экран чуть темнеет, по центру обратный отсчёт до возвращения */
  if (me.dead && !G.over && me.respawn > 0){ const n = Math.ceil(me.respawn), fr = me.respawn - Math.floor(me.respawn), cx = VW/2, cy = VH*.4;
    c.fillStyle = "rgba(10,6,16,.38)"; c.fillRect(0, 0, VW, VH);
    c.fillStyle = "rgba(20,14,28,.8)"; c.beginPath(); c.arc(cx, cy, 44, 0, 6.283); c.fill();
    c.strokeStyle = "#f3d27a"; c.lineWidth = 4; c.beginPath(); c.arc(cx, cy, 40, -Math.PI/2, -Math.PI/2 + fr*6.283); c.stroke();
    c.textAlign = "center"; c.fillStyle = "#fff4ec"; c.font = "800 34px Unbounded, sans-serif"; c.fillText(String(n), cx, cy + 12);
    c.font = "600 13px Unbounded, sans-serif"; c.fillStyle = "rgba(255,244,236,.75)"; c.fillText("Вернёшься через", cx, cy - 58); }
  if (!me.dead) drawControls(c, t);
  G.cam = {ox, oy};
}
function drawDrop(c, x, y, s, rot = 0){
  const k = c.getTransform().a, key = s + "|" + k.toFixed(3); let spr = spriteCache.get(key);
  if (!spr){ const n = Math.ceil(s*2.8*k); spr = document.createElement("canvas"); spr.width = spr.height = n; const sc = spr.getContext("2d"); sc.setTransform(k, 0, 0, k, n/2, n/2); dropShape(sc, 0, 0, s, 0); spriteCache.set(key, spr); }
  c.save(); c.translate(x, y); c.rotate(rot); c.drawImage(spr, -s*1.4, -s*1.4, s*2.8, s*2.8); c.restore();
}
function dropShape(c, x, y, s, rot){
  c.save(); c.translate(x, y); c.rotate(rot); const gr = c.createRadialGradient(-s*.25, s*.1, 1, 0, s*.3, s*1.1); gr.addColorStop(0, "#ff8fa3"); gr.addColorStop(.5, "#d81e45"); gr.addColorStop(1, "#7a0a22");
  c.fillStyle = gr; c.beginPath(); c.moveTo(0, -s*1.1); c.bezierCurveTo(s*.2, -s*.6, s*.85, -s*.05, s*.85, s*.35); c.arc(0, s*.35, s*.85, 0, Math.PI); c.bezierCurveTo(-s*.85, -s*.05, -s*.2, -s*.6, 0, -s*1.1); c.fill();
  c.fillStyle = "rgba(255,255,255,.55)"; c.beginPath(); c.ellipse(-s*.3, s*.2, s*.15, s*.25, -.4, 0, 6.283); c.fill(); c.restore();
}
