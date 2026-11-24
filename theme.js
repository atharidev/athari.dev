/* Before first paint: the visitor's saved theme, otherwise the device's. Storage failure falls back quietly. */
(() => {
  'use strict';
  const root = document.documentElement;
  let theme = null;
  try { theme = localStorage.getItem('athari-theme'); } catch {}
  if (theme !== 'light' && theme !== 'dark') theme = window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  root.dataset.theme = theme;
  root.setAttribute('data-js', '');
})();
