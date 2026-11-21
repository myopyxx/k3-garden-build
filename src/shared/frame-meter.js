// Только по ссылке ?fps=1. Частота вызовов requestAnimationFrame за последнюю секунду.
if (new URLSearchParams(location.search).get("fps") === "1"){
  const badge = document.createElement("span");
  badge.style.cssText = "position:fixed;top:max(2px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);z-index:9999;pointer-events:none;padding:2px 6px;border-radius:6px;background:#21192eee;color:white;font:11px/1.3 system-ui;font-variant-numeric:tabular-nums";
  document.body.appendChild(badge);
  let start, frames = 0, frameId;
  function sample(now){
    if (start === undefined) start = now;
    else frames++;
    if (now - start >= 1000){
      badge.textContent = Math.round(frames*1000/(now - start)) + " FPS";
      frames = 0; start = now;
    }
    frameId = requestAnimationFrame(sample);
  }
  function reset(){
    cancelAnimationFrame(frameId);
    start = undefined; frames = 0; badge.textContent = "";
    if (!document.hidden) frameId = requestAnimationFrame(sample);
  }
  document.addEventListener("visibilitychange", reset);
  reset();
}
