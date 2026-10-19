/* Static locale documents; preference stays only in this browser. */
(() => {
  'use strict';
  const key = 'athari-language';
  const locale = document.documentElement.lang;
  const valid = value => value === 'ar' || value === 'en';
  const remember = value => { try { localStorage.setItem(key, value); } catch {} };
  if (valid(locale)) remember(locale);
  const links = document.querySelectorAll('[data-language]');
  const updateLinks = () => links.forEach(link => {
    link.setAttribute('href', '/' + link.dataset.language + '/' + location.hash);
  });
  updateLinks();
  window.addEventListener('hashchange', updateLinks);
  links.forEach(link => link.addEventListener('click', () => remember(link.dataset.language)));
})();
