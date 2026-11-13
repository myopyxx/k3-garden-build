"use strict";
/* =================== ОБЩЕЕ =================== */
const $ = s => document.querySelector(s);
const T = 48;                                   /* размер клетки в единицах мира */
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, k) => a + (b - a)*k;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const angTo = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
const rand = (a, b) => a + Math.random()*(b - a);
const pick = a => a[Math.floor(Math.random()*a.length)];
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const AUTO = /[?&]auto=1/.test(location.search);           /* тест: игроком управляет бот */

const KEY = "night-arena-v1";
const S = (() => { let s = {}; try { s = JSON.parse(localStorage.getItem(KEY)) || {}; } catch(e){}
  return Object.assign({cat: "alisa", cups: 0, sfx: true, hap: true, how: false, rec: {gems: {w: 0, l: 0, d: 0}, surv: {best: 0, wins: 0}, waves: {best: 0, wins: 0}}}, s); })();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){} };

/* цвета кошек как в «Дневниках» */
const CATS = {
  alisa:  {fur: "#7f8591", shade: "#636a77", nose: "#4b4c54", eyes: "#d6ce5e", acc: "#8f1f38"},
  lapula: {fur: "#6f7178", shade: "#56585f", nose: "#3d3e45", eyes: "#e0a03a", acc: "#b58adf"},
  black:  {fur: "#26222c", shade: "#18151d", nose: "#3a3440", eyes: "#9be36a", acc: "#5aa9ff"}
};

/* =================== ЗВУК (Web Audio, без файлов) =================== */
const AC = window.AudioContext || window.webkitAudioContext;
let ctx, sfxBus, revSend, noiseBuf;
function initAudio(){
  if (ctx || !AC) return ctx;
  ctx = new AC({latencyHint: "interactive"});
  const glue = ctx.createDynamicsCompressor(); glue.threshold.value = -18; glue.knee.value = 12; glue.ratio.value = 3; glue.attack.value = .005; glue.release.value = .15;
  const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -3; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = .001; lim.release.value = .08;
  const master = ctx.createGain(); master.gain.value = .8; glue.connect(lim).connect(master).connect(ctx.destination);
  sfxBus = ctx.createGain(); sfxBus.gain.value = .9; sfxBus.connect(glue);
  const len = Math.floor(ctx.sampleRate*1.4), ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++){ const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random()*2 - 1)*Math.pow(1 - i/len, 2.6); }
  const conv = ctx.createConvolver(); conv.buffer = ir; const wlp = ctx.createBiquadFilter(); wlp.type = "lowpass"; wlp.frequency.value = 5000;
  revSend = ctx.createGain(); revSend.connect(conv).connect(wlp).connect(glue);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random()*2 - 1;
  return ctx;
}
let silentDone = false;
function unlock(){ initAudio(); if (!ctx) return; if (ctx.state !== "running") ctx.resume().catch(() => {});
  if (!silentDone){ silentDone = true; const s = ctx.createBufferSource(); s.buffer = ctx.createBuffer(1, 1, ctx.sampleRate); s.connect(ctx.destination); s.start(0); } }
["pointerdown", "pointerup", "touchend", "click", "keydown"].forEach(ev => addEventListener(ev, unlock, {capture: true, passive: true}));
document.addEventListener("visibilitychange", () => { if (!ctx) return; if (document.hidden) ctx.suspend().catch(() => {}); else ctx.resume().catch(() => {}); });
let lastT = -1; setInterval(() => { if (!ctx || document.hidden || ctx.state !== "running") return; if (ctx.currentTime === lastT){ setTimeout(() => ctx.suspend().catch(() => {}), 250); setTimeout(() => ctx.resume().catch(() => {}), 500); } lastT = ctx.currentTime; }, 2000);
const ok = () => { if (!ctx || !S.sfx) return false; if (ctx.state === "suspended" || ctx.state === "interrupted") ctx.resume().catch(() => {}); return ctx.state === "running"; };
const lastPlay = {};
const can = (id, ms = 40) => { if (!ok()) return false; const n = performance.now(); if (n - (lastPlay[id] || 0) < ms) return false; lastPlay[id] = n; return true; };
function env(t, {a = .005, d = .15, peak = .3, sus = 0, hold = 0, r = .08} = {}){
  const g = ctx.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a);
  if (sus > 0){ g.gain.setTargetAtTime(peak*sus, t + a, d/3); g.gain.setTargetAtTime(.0001, t + a + d + hold, r/4); } else g.gain.exponentialRampToValueAtTime(.0001, t + a + d);
  return g; }
const endT = (t, o) => t + (o.a ?? .005) + (o.d ?? .15) + (o.hold ?? 0) + (o.r ?? .08) + .05;
function voice({type = "sine", f = 440, f2 = null, glide = .05, t = ctx.currentTime, e = {}, send = 0, lp = null, vol = 1}){
  const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + glide);
  const g = env(t, Object.assign({}, e, {peak: (e.peak ?? .3)*vol})); let n = o;
  if (lp){ const fl = ctx.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.value = lp; o.connect(fl); n = fl; }
  n.connect(g).connect(sfxBus); if (send){ const s = ctx.createGain(); s.gain.value = send; g.connect(s).connect(revSend); }
  o.start(t); o.stop(endT(t, e)); o.onended = () => g.disconnect(); return o; }
function noise({t = ctx.currentTime, type = "bandpass", freq = 3000, f2 = null, Q = 1, e = {}, vol = 1}){
  const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
  const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(freq, t); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + (e.d ?? .15)); fl.Q.value = Q;
  const g = env(t, Object.assign({}, e, {peak: (e.peak ?? .3)*vol})); s.connect(fl).connect(g).connect(sfxBus);
  s.start(t, Math.random()*.5); s.stop(endT(t, e)); s.onended = () => g.disconnect(); }
function bell({f, t = ctx.currentTime, ratio = 3.5, index = 2, dur = .6, peak = .15, send = .2}){
  const c = ctx.createOscillator(), m = ctx.createOscillator(), mg = ctx.createGain(); c.frequency.value = f; m.frequency.value = f*ratio;
  mg.gain.setValueAtTime(f*index, t); mg.gain.exponentialRampToValueAtTime(f*.05, t + dur*.6); m.connect(mg).connect(c.frequency);
  const o = {a: .002, d: dur, peak}, g = env(t, o); c.connect(g).connect(sfxBus);
  if (send){ const s = ctx.createGain(); s.gain.value = send; g.connect(s).connect(revSend); }
  c.start(t); m.start(t); c.stop(endT(t, o)); m.stop(endT(t, o)); c.onended = () => { g.disconnect(); mg.disconnect(); }; }
const rv = x => 1 + (Math.random()*2 - 1)*x;
/* громкость эффектов чужих бойцов тише: vol */
const snd = {
  tap(){ if (!can("tap", 30)) return; voice({f: 900*rv(.03), f2: 450, glide: .04, e: {a: .002, d: .06, peak: .16}}); },
  drop(vol = 1){ if (!can("drop", 50)) return; const t = ctx.currentTime, k = rv(.05);
    [0, .03, .06].forEach((dt, i) => voice({type: "triangle", f: (880 + i*220)*k, f2: (520 + i*120)*k, glide: .08, t: t + dt, lp: 4000, e: {a: .002, d: .09, peak: .1}, vol})); },
  claw(vol = 1){ if (!can("claw", 60)) return; noise({type: "bandpass", freq: 3200*rv(.1), f2: 700, Q: 1.4, e: {a: .004, d: .16, peak: .22}, vol}); },
  bolt(vol = 1){ if (!can("bolt", 50)) return; const t = ctx.currentTime; noise({t, type: "highpass", freq: 2500, Q: .8, e: {a: .002, d: .05, peak: .12}, vol});
    voice({f: 640*rv(.05), f2: 260, glide: .09, t, e: {a: .002, d: .1, peak: .12}, vol}); },
  lob(vol = 1){ if (!can("lob", 60)) return; noise({type: "bandpass", freq: 500, f2: 900, Q: 1, e: {a: .03, d: .25, peak: .1}, vol}); },
  boom(vol = 1){ if (!can("boom", 70)) return; const t = ctx.currentTime; noise({t, type: "lowpass", freq: 1200, f2: 200, Q: .7, e: {a: .003, d: .35, peak: .3}, vol});
    voice({f: 140, f2: 45, glide: .25, t, e: {a: .002, d: .3, peak: .3}, vol}); },
  hit(){ if (!can("hit", 45)) return; const t = ctx.currentTime; voice({f: 300*rv(.08), f2: 120, glide: .06, t, e: {a: .001, d: .07, peak: .2}}); noise({t, freq: 1800, Q: 1, e: {a: .001, d: .03, peak: .06}}); },
  hurt(){ if (!can("hurt", 90)) return; const t = ctx.currentTime; voice({type: "triangle", f: 220, f2: 90, glide: .12, t, lp: 1400, e: {a: .002, d: .14, peak: .24}}); noise({t, type: "lowpass", freq: 900, Q: .7, e: {a: .002, d: .08, peak: .1}}); },
  ko(){ if (!can("ko", 200)) return; const t = ctx.currentTime; [659.25, 523.25, 392, 261.63].forEach((f, i) => voice({type: "triangle", f, t: t + i*.07, lp: 2500, send: .15, e: {a: .004, d: .14, peak: .13}})); },
  koEnemy(){ if (!can("koE", 150)) return; const t = ctx.currentTime; [784, 1046.5, 1318.5].forEach((f, i) => bell({f, t: t + i*.05, ratio: 2, index: 1.2, dur: .3, peak: .12, send: .2})); },
  superReady(){ if (!can("sready", 800)) return; const t = ctx.currentTime; [1046.5, 1318.5, 1568, 2093].forEach((f, i) => bell({f, t: t + i*.06, dur: .5, peak: .1, send: .3})); },
  superGo(){ if (!can("sgo", 200)) return; const t = ctx.currentTime; noise({t, type: "bandpass", freq: 400, f2: 4000, Q: 2, e: {a: .02, d: .3, peak: .18}}); bell({f: 1568, t: t + .12, dur: .7, peak: .14, send: .4}); },
  gem(){ if (!can("gem", 50)) return; const t = ctx.currentTime, k = rv(.02); [1046.5, 1318.5, 1568].forEach((f, i) => bell({f: f*k, t: t + i*.035, index: 1.5, dur: .25, peak: .12, send: .15})); },
  power(){ if (!can("pow", 100)) return; const t = ctx.currentTime; [523.25, 784, 1046.5, 1568].forEach((f, i) => voice({type: "triangle", f, t: t + i*.05, lp: 5000, send: .2, e: {a: .003, d: .12, peak: .1}})); },
  /* выстрел без патронов: сухой щелчок, чтобы было понятно, почему ничего не вылетело */
  empty(){ if (!can("empty", 120)) return; const t = ctx.currentTime; noise({t, type: "highpass", freq: 3800, Q: .7, e: {a: .001, d: .025, peak: .09}}); voice({type: "square", f: 140, f2: 110, glide: .03, t, lp: 900, e: {a: .001, d: .04, peak: .05}}); },
  box(){ if (!can("box", 60)) return; noise({type: "lowpass", freq: 900, Q: .8, e: {a: .002, d: .12, peak: .22}}); },
  tick(hi){ if (!can("tick", 200)) return; voice({f: hi ? 1318.5 : 880, e: {a: .002, d: .08, peak: .12}}); },
  wave(){ if (!can("wave", 500)) return; const t = ctx.currentTime; [392, 523.25, 659.25].forEach((f, i) => voice({type: "triangle", f, t: t + i*.1, lp: 3000, send: .25, e: {a: .01, d: .25, peak: .1}})); },
  win(){ if (!can("win", 1500)) return; const t = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => { voice({type: "triangle", f, t: t + i*.09, send: .2, e: {a: .004, d: .22, peak: .1}}); voice({f: f*2, t: t + i*.09, e: {a: .004, d: .22, peak: .03}}); });
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach(f => voice({type: "triangle", f, t: t + .38, send: .3, lp: 4000, e: {a: .015, d: .12, sus: .6, hold: .5, r: .6, peak: .1}})); },
  lose(){ if (!can("lose", 1500)) return; const t = ctx.currentTime; [[392, 0], [329.63, .16], [261.63, .32]].forEach(([f, dt]) => voice({type: "triangle", f, f2: f*.97, glide: .2, t: t + dt, lp: 1500, e: {a: .006, d: .22, peak: .14}})); }
};

/* =================== ХАПТИКА =================== */
/* на iPhone navigator.vibrate нет; единственный путь — клик по скрытому <input switch> (Safari 17.4+), только из жеста */
let hapLabel = null;
function haptic(ms = 10){
  if (S.hap === false) return;
  if (navigator.vibrate){ try { navigator.vibrate(ms); } catch(e){} return; }
  if (!hapLabel){ const i = document.createElement("input"); i.type = "checkbox"; i.id = "hx"; i.setAttribute("switch", "");
    hapLabel = document.createElement("label"); hapLabel.htmlFor = "hx";
    [i, hapLabel].forEach(el => Object.assign(el.style, {position: "fixed", left: "-9999px", opacity: 0, pointerEvents: "none"})); document.body.append(i, hapLabel); }
  hapLabel.click();
}
