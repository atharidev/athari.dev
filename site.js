/* athari.dev — "Traces". A woven ring that is always being drawn: two families of threads wind
   around it in opposite directions, and on each a moving head leaves a fading trail, the way a
   أثر (trace) is left behind. Native canvas, no dependencies or network calls. */
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

  // ---------- geometry, built once ----------
  const tau = Math.PI * 2;
  const compact = Math.min(screen.width, screen.height) < 700;
  const PER = compact ? 22 : 30;       // threads in each family
  const STEPS = compact ? 220 : 300;   // samples along one lap
  const WRAP = 3;                      // turns around the tube per lap
  const TUBE = .36, TRAIL = .42;       // tube radius; trail length as a share of the lap
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const threads = [];
  for (const family of [1, -1]) {
    for (let k = 0; k < PER; k++) {
      const v0 = (k + (family < 0 ? .5 : 0)) / PER * tau;
      const base = new Float32Array(STEPS * 7); // cos u, sin u, cos v, sin v, sin 3u, cos 3u, u
      for (let i = 0; i < STEPS; i++) {
        const u = i / STEPS * tau, v = v0 + family * WRAP * u;
        base.set([Math.cos(u), Math.sin(u), Math.cos(v), Math.sin(v), Math.sin(3 * u + v0), Math.cos(3 * u + v0), u], i * 7);
      }
      threads.push({ base, family, offset: rand(), lap: 15 + rand() * 9, x: new Float32Array(STEPS), y: new Float32Array(STEPS), z: new Float32Array(STEPS) });
    }
  }

  // ---------- state ----------
  let paused = false, visible = true, suspended = false, frame = 0, last = 0;
  let width = 0, height = 0, dpr = 1, clock = 0, grow = 0, scrollTurn = 0;
  let x = 0, y = 0, targetX = 0, targetY = 0;
  const palette = () => document.documentElement.dataset.theme === 'light'
    ? { ink: '23,24,26', brass: '138,108,58', ghost: .085, trail: .62 }
    : { ink: '236,235,230', brass: '206,184,142', ghost: .06, trail: .7 };

  function project() {
    const breath = Math.sin(clock * .00042) * .5 + .5;
    const wave = clock * .00055;
    const cw = Math.cos(wave), sw = Math.sin(wave), amp = .05 + breath * .035;
    const tilt = .93 + y * .07 + Math.sin(clock * .00017) * .03;
    const yaw = clock * .000075 + x * .14 + scrollTurn, turn = -.36;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), ct = Math.cos(tilt), st = Math.sin(tilt);
    const cr = Math.cos(turn), sr = Math.sin(turn), scale = Math.min(width, height) * .305;
    const ox = width * .5, oy = height * .5;
    for (const t of threads) {
      const b = t.base;
      for (let i = 0; i < STEPS; i++) {
        const j = i * 7;
        // The tube swells and settles in a slow wave that travels around the ring.
        const rad = TUBE * (1 + amp * (b[j + 4] * cw + b[j + 5] * sw));
        const ring = 1 + rad * b[j + 2];
        const px = ring * b[j], py = ring * b[j + 1], pz = rad * b[j + 3];
        const a = px * cy + pz * sy, bb = -px * sy + pz * cy;
        const c = py * ct - bb * st, z = py * st + bb * ct;
        const p = 4.6 / (4.6 + z);
        t.x[i] = ox + (a * cr - c * sr) * scale * p;
        t.y[i] = oy + (a * sr + c * cr) * scale * p;
        t.z[i] = z;
      }
    }
  }

  function draw() {
    if (!width || !height) return;
    project();
    ctx.clearRect(0, 0, width, height);
    const { ink, brass, ghost, trail } = palette();
    const ease = 1 - Math.pow(1 - grow, 3);
    // The whole weave, faint, so the form always reads.
    ctx.lineWidth = .55;
    ctx.strokeStyle = `rgba(${ink},${ghost * ease})`;
    ctx.beginPath();
    for (const t of threads) {
      ctx.moveTo(t.x[0], t.y[0]);
      for (let i = 1; i < STEPS; i++) ctx.lineTo(t.x[i], t.y[i]);
      ctx.closePath();
    }
    ctx.stroke();
    // The traces: brighter toward the head, nearer threads heavier than far ones.
    const span = Math.max(2, Math.floor(STEPS * TRAIL * ease));
    const CHUNK = 6;
    for (const t of threads) {
      const head = Math.floor((((t.offset + clock / 1000 / t.lap) % 1) + 1) % 1 * STEPS);
      for (let s = 0; s < span; s += CHUNK) {
        const from = (head - span + s + STEPS * 2) % STEPS;
        const i0 = from, i1 = (from + Math.min(CHUNK, span - s)) % STEPS;
        const depth = Math.max(.12, Math.min(1, .58 - t.z[i0] * .42));
        const along = (s + CHUNK) / span;
        ctx.strokeStyle = `rgba(${ink},${trail * Math.pow(along, 1.6) * depth})`;
        ctx.lineWidth = .45 + depth * .75;
        ctx.beginPath();
        ctx.moveTo(t.x[i0], t.y[i0]);
        for (let i = i0; i !== i1; ) { i = (i + 1) % STEPS; ctx.lineTo(t.x[i], t.y[i]); }
        ctx.stroke();
      }
      // The point still drawing: a small brass mark.
      const depth = Math.max(.15, Math.min(1, .6 - t.z[head] * .45));
      ctx.fillStyle = `rgba(${brass},${(.25 + depth * .7) * ease})`;
      ctx.beginPath();
      ctx.arc(t.x[head], t.y[head], .7 + depth * .9, 0, tau);
      ctx.fill();
    }
    artwork.classList.add('is-rendered');
  }

  function tick(time) {
    frame = 0;
    if (paused || reduced.matches || document.hidden || !visible || suspended) return;
    if (time - last >= 33) {
      const elapsed = Math.min(time - last, 66);
      clock += elapsed;
      grow = Math.min(1, grow + elapsed / 2400);
      x += (targetX - x) * .05;
      y += (targetY - y) * .05;
      last = time;
      draw();
    }
    frame = requestAnimationFrame(tick);
  }

  function update() {
    cancelAnimationFrame(frame); frame = 0; last = performance.now();
    const still = paused || reduced.matches;
    // A still page shows the finished weave mid-trace, not an empty ring.
    if (reduced.matches) { grow = 1; if (!clock) clock = 9000; }
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
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    update();
  }

  toggle.addEventListener('click', () => { paused = !paused; if (paused) grow = 1; update(); });
  window.addEventListener('athari-theme', draw);
  reduced.addEventListener('change', update);
  document.addEventListener('visibilitychange', update);
  // The ring turns a little as the page scrolls past it.
  window.addEventListener('scroll', () => {
    scrollTurn = Math.min(window.scrollY, 1200) * .00045;
    if (paused || reduced.matches) draw();
  }, { passive: true });
  // Mouse parallax stays local to the artwork; scrolling and touch remain native.
  window.addEventListener('pointermove', event => {
    if (!pointer.matches || event.pointerType !== 'mouse' || paused || reduced.matches) return;
    const rect = stage.getBoundingClientRect();
    targetX = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
    targetY = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
  }, { passive: true });
  document.addEventListener('pointerleave', () => { targetX = targetY = 0; });
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
