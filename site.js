/* athari.dev — a living ripple. Native canvas, no dependencies or network calls. */
(() => {
  'use strict';
  const year = document.querySelector('#year');
  if (year) year.textContent = new Date().getFullYear();
  const stage = document.querySelector('.art-stage, .gateway-art');
  const artwork = document.querySelector('.artwork, .gateway-art');
  const toggle = document.querySelector('#motion-toggle');
  if (!stage || !artwork || !toggle) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const canvas = document.createElement('canvas');
  canvas.className = 'living-ripple';
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return; // The original SVG remains visible without canvas.
  stage.append(canvas);
  let paused = false, visible = true, suspended = false, frame = 0, last = 0;
  let width = 0, height = 0, dpr = 1, phase = .38;
  let x = 0, y = 0, targetX = 0, targetY = 0;
  const tau = Math.PI * 2;
  const rings = Array.from({ length: 56 }, (_, line) => {
    const u = line / 56 * tau;
    return Array.from({ length: 97 }, (_, step) => {
      const v = step / 96 * tau;
      const fold = .052 * Math.sin(3 * v + u * 2);
      const radius = 1 + .345 * Math.cos(v);
      return [radius * Math.cos(u + fold), radius * Math.sin(u + fold), .345 * Math.sin(v)];
    });
  });
  function draw() {
    if (!width || !height) return;
    ctx.clearRect(0, 0, width, height);
    const tilt = .91 + y * .065, yaw = phase + x * .12, turn = -.38;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), ct = Math.cos(tilt), st = Math.sin(tilt);
    const cr = Math.cos(turn), sr = Math.sin(turn), scale = Math.min(width, height) * .31;
    const paths = rings.map(ring => {
      let depth = 0;
      const points = ring.map(([px, py, pz]) => {
        const a = px * cy + pz * sy, b = -px * sy + pz * cy;
        const c = py * ct - b * st, z = py * st + b * ct;
        const perspective = 4.4 / (4.4 + z);
        depth += z;
        return [width * .5 + (a * cr - c * sr) * scale * perspective,
          height * .5 + (a * sr + c * cr) * scale * perspective];
      });
      return { points, depth: depth / ring.length };
    }).sort((a, b) => b.depth - a.depth);
    for (const path of paths) {
      const light = Math.max(0, Math.min(1, .5 - path.depth * .45));
      ctx.beginPath();
      path.points.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py));
      ctx.strokeStyle = `rgba(${Math.round(157 + light * 55)},${Math.round(183 + light * 54)},${Math.round(123 + light * 56)},${.15 + light * .48})`;
      ctx.lineWidth = .72;
      ctx.stroke();
    }
    artwork.classList.add('is-rendered');
  }
  function tick(time) {
    frame = 0;
    if (paused || reduced.matches || document.hidden || !visible || suspended) return;
    if (time - last >= 42) {
      const elapsed = Math.min(time - last, 80);
      phase += elapsed * .000085;
      x += (targetX - x) * .055;
      y += (targetY - y) * .055;
      last = time;
      draw();
    }
    frame = requestAnimationFrame(tick);
  }
  function update() {
    cancelAnimationFrame(frame); frame = 0; last = performance.now();
    const still = paused || reduced.matches;
    artwork.toggleAttribute('data-paused', still || document.hidden || suspended);
    document.documentElement.toggleAttribute('data-motion-paused', still || document.hidden || suspended);
    toggle.hidden = reduced.matches;
    toggle.setAttribute('aria-pressed', String(still));
    const label = (still ? toggle.dataset.playLabel : toggle.dataset.pauseLabel) ||
      (document.documentElement.lang === 'ar' ? (still ? 'تشغيل حركة العمل الفني' : 'إيقاف حركة العمل الفني') :
        (still ? 'Play artwork motion' : 'Pause artwork motion'));
    toggle.setAttribute('aria-label', label); toggle.title = label;
    draw();
    if (!still && !document.hidden && visible && !suspended) frame = requestAnimationFrame(tick);
  }
  function resize() {
    const rect = stage.getBoundingClientRect();
    width = rect.width; height = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    update();
  }
  toggle.addEventListener('click', () => { paused = !paused; update(); });
  reduced.addEventListener('change', update);
  document.addEventListener('visibilitychange', update);
  // Mouse parallax stays local to the artwork; scrolling and touch remain native.
  stage.addEventListener('pointermove', event => {
    if (!pointer.matches || event.pointerType !== 'mouse' || paused || reduced.matches) return;
    const rect = stage.getBoundingClientRect();
    targetX = (event.clientX - rect.left) / rect.width * 2 - 1;
    targetY = (event.clientY - rect.top) / rect.height * 2 - 1;
  }, { passive: true });
  stage.addEventListener('pointerleave', () => { targetX = targetY = 0; });
  window.addEventListener('blur', () => { targetX = targetY = 0; });
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
  else window.addEventListener('resize', resize, { passive: true });
  if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    document.documentElement.toggleAttribute('data-art-offscreen', !visible);
    update();
  }).observe(stage);
  window.addEventListener('pagehide', () => { suspended = true; cancelAnimationFrame(frame); frame = 0; });
  window.addEventListener('pageshow', () => { suspended = false; resize(); });
  resize();
})();
