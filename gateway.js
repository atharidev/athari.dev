/* Run before paint. An explicit ?choose=1 always reopens language selection. */
(() => {
  'use strict';
  if (new URLSearchParams(location.search).has('choose')) return;
  try {
    const language = localStorage.getItem('athari-language');
    if (language === 'ar' || language === 'en') location.replace('/' + language + '/' + location.hash);
  } catch {}
})();
