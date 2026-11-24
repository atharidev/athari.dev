/* athari.dev — header controls and ink reveals, in the same hand as Sabab. No dependencies or network calls. */
(() => {
  'use strict';
  const root = document.documentElement;
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('[data-header]');

  // ---------- light / dark ----------
  const mode = document.querySelector('[data-mode]');
  const meta = document.querySelector('meta[name="theme-color"]');
  const device = window.matchMedia('(prefers-color-scheme: light)');
  let chosen = null;
  try { chosen = localStorage.getItem('athari-theme'); } catch {}
  const apply = theme => {
    root.dataset.theme = theme;
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f4f2ed' : '#0f1012');
    if (mode) mode.setAttribute('aria-label', theme === 'light' ? mode.dataset.labelDark : mode.dataset.labelLight);
    window.dispatchEvent(new CustomEvent('athari-theme', { detail: theme }));
  };
  apply(root.dataset.theme === 'light' ? 'light' : 'dark');
  if (mode) mode.addEventListener('click', () => {
    chosen = root.dataset.theme === 'light' ? 'dark' : 'light';
    try { localStorage.setItem('athari-theme', chosen); } catch {}
    apply(chosen);
  });
  // Until a visitor chooses, the page follows the device.
  device.addEventListener('change', event => { if (chosen !== 'light' && chosen !== 'dark') apply(event.matches ? 'light' : 'dark'); });

  // ---------- language globe ----------
  // A round globe that opens into the languages and folds back. It turns a quarter turn as the page
  // arrives, as it opens and as it answers (two meridians narrow and widen); nothing loops.
  const globe = document.querySelector('[data-globe]');
  const globeBtn = document.querySelector('[data-globe-btn]');
  if (globe && globeBtn) {
    const R = 8.4, QUARTER = Math.PI / 2, OFFSETS = [0.45, 0.45 + QUARTER];
    const meridians = globe.querySelectorAll('.mer');
    const links = globe.querySelectorAll('.globe-names a');
    let phase = 0, target = 0, from = 0, start = 0, raf = 0, open = false;
    const draw = p => meridians.forEach((m, k) => m.setAttribute('rx', Math.max(0.01, R * Math.abs(Math.sin(p + OFFSETS[k]))).toFixed(2)));
    const step = now => {
      const t = Math.min(1, (now - start) / 900);
      phase = from + (target - from) * (1 - Math.pow(1 - t, 3));
      draw(phase);
      raf = t < 1 ? requestAnimationFrame(step) : 0;
    };
    const turn = () => {
      target += QUARTER;
      if (still) { phase = target; draw(phase); return; }
      from = phase; start = performance.now();
      if (!raf) raf = requestAnimationFrame(step);
    };
    const fit = () => { globe.style.width = open ? (globe.querySelector('.globe-row').scrollWidth + 2) + 'px' : ''; };
    const setOpen = next => {
      if (next === open) return;
      open = next;
      globe.classList.toggle('open', open);
      if (header) header.classList.toggle('globe-open', open);
      globeBtn.setAttribute('aria-expanded', String(open));
      links.forEach(link => { link.tabIndex = open ? 0 : -1; });
      fit(); turn();
    };
    links.forEach(link => {
      link.tabIndex = -1;
      link.addEventListener('click', event => {
        if (link.getAttribute('aria-current') === 'true') { event.preventDefault(); setOpen(false); globeBtn.focus(); return; }
        if (still || event.metaKey || event.ctrlKey || event.shiftKey || event.button) return;
        // Let the answer be seen for a beat, then go.
        event.preventDefault();
        links.forEach(l => l.classList.toggle('chosen', l === link));
        turn();
        setTimeout(() => { location.href = link.href; }, 260);
      });
    });
    globeBtn.addEventListener('click', () => setOpen(!open));
    document.addEventListener('click', event => { if (open && !globe.contains(event.target)) setOpen(false); });
    document.addEventListener('keydown', event => { if (open && event.key === 'Escape') { setOpen(false); globeBtn.focus(); } });
    window.addEventListener('resize', fit, { passive: true });
    // Coming back from the other language restores a closed globe.
    window.addEventListener('pageshow', () => { links.forEach(l => l.classList.remove('chosen')); setOpen(false); });
    setTimeout(turn, 250);
  }

  // ---------- header ----------
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---------- ventures rail ----------
  // On narrow windows the cards become a sideways row. Touch swipes natively; a mouse gets arrows and drag.
  const rail = document.querySelector('.venture-grid');
  const nav = document.querySelector('.rail-nav');
  if (rail && nav) {
    const fine = window.matchMedia('(any-pointer: fine)');
    const buttons = nav.querySelectorAll('[data-rail]');
    const rtl = () => getComputedStyle(rail).direction === 'rtl';
    const sync = () => {
      const max = rail.scrollWidth - rail.clientWidth;
      nav.hidden = !(fine.matches && max > 4);
      const at = Math.abs(rail.scrollLeft);
      buttons.forEach(b => { b.disabled = b.dataset.rail === '-1' ? at < 4 : at > max - 4; });
    };
    const card = () => (rail.firstElementChild ? rail.firstElementChild.getBoundingClientRect().width + 12 : rail.clientWidth * .8);
    buttons.forEach(b => b.addEventListener('click', () => {
      const step = Number(b.dataset.rail) * card() * (rtl() ? -1 : 1);
      rail.scrollBy({ left: step, behavior: still ? 'auto' : 'smooth' });
    }));
    // Drag with the mouse; a drag never counts as a click on the card under it.
    let down = null, moved = false;
    rail.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0 || rail.scrollWidth <= rail.clientWidth) return;
      down = { x: e.clientX, left: rail.scrollLeft }; moved = false;
    });
    window.addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - down.x;
      if (!moved && Math.abs(dx) > 5) { moved = true; rail.classList.add('dragging'); }
      if (moved) rail.scrollLeft = down.left - dx;
    });
    const release = () => {
      if (!down) return;
      down = null;
      if (moved) requestAnimationFrame(() => rail.classList.remove('dragging'));
    };
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    rail.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    rail.addEventListener('dragstart', e => e.preventDefault());
    rail.addEventListener('scroll', sync, { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(sync).observe(rail); else window.addEventListener('resize', sync, { passive: true });
    fine.addEventListener('change', sync);
    sync();
  }

  // The open seat leads to the form as a business enquiry, without touching anything already chosen.
  document.querySelectorAll('[data-enquire]').forEach(link => link.addEventListener('click', () => {
    const form = document.querySelector('#collaboration-form');
    const business = form && form.querySelector('input[value="Business"]');
    if (business && !form.querySelector('input[name="collaboration"]:checked')) business.checked = true;
  }));

  // ---------- ink: drawn once as each part arrives, then still ----------
  const inks = document.querySelectorAll('[data-ink]');
  if (still || !('IntersectionObserver' in window)) { inks.forEach(el => el.classList.add('inked')); return; }
  root.setAttribute('data-ink-ready', '');
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('inked');
    observer.unobserve(entry.target);
  }), { threshold: 0.25, rootMargin: '0px 0px -8% 0px' });
  inks.forEach(el => observer.observe(el));
})();
