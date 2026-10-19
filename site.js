(() => {
  'use strict';
  document.querySelector('#year').textContent = new Date().getFullYear();
  const artwork = document.querySelector('.artwork');
  const stage = document.querySelector('.art-stage');
  const toggle = document.querySelector('#motion-toggle');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  let paused = reduced.matches;
  let frame = 0;
  const renderState = () => {
    toggle.hidden = reduced.matches;
    artwork.toggleAttribute('data-paused', paused || document.hidden);
    document.documentElement.toggleAttribute('data-motion-paused', paused || document.hidden);
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute('aria-label', document.documentElement.lang === 'ar'
      ? (paused ? 'تشغيل حركة العمل الفني' : 'إيقاف حركة العمل الفني')
      : (paused ? 'Play artwork motion' : 'Pause artwork motion'));
  };
  renderState();
  toggle.addEventListener('click', () => { paused = !paused; renderState(); });
  reduced.addEventListener('change', event => { paused = event.matches; renderState(); });
  document.addEventListener('visibilitychange', renderState);
  stage.addEventListener('pointermove', event => {
    if (paused || reduced.matches || !pointer.matches || frame) return;
    const bounds = stage.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - .5;
    const y = (event.clientY - bounds.top) / bounds.height - .5;
    frame = requestAnimationFrame(() => {
      stage.style.setProperty('--rx', `${-y * 9}deg`);
      stage.style.setProperty('--ry', `${x * 9}deg`);
      frame = 0;
    });
  });
  stage.addEventListener('pointerleave', () => {
    cancelAnimationFrame(frame); frame = 0;
    stage.style.setProperty('--rx', '0deg');
    stage.style.setProperty('--ry', '0deg');
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      artwork.toggleAttribute('data-offscreen', !entries[0].isIntersecting);
      document.documentElement.toggleAttribute('data-art-offscreen', !entries[0].isIntersecting);
    }).observe(artwork);
  }
})();
