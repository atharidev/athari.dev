/* Permanent, locally generated QR codes. Recipient selection never rewrites the owner's site language. */
(() => {
  'use strict';
  const body = document.body;
  const choices = [...document.querySelectorAll('[data-recipient]')];
  const codes = [...document.querySelectorAll('[data-code]')];
  const destination = document.querySelector('#qr-destination');
  const destinationNote = document.querySelector('#qr-destination-note');
  const save = document.querySelector('#qr-save');
  const status = document.querySelector('#qr-status');
  const share = document.querySelector('#qr-share');
  const present = document.querySelector('#qr-present');
  const motion = document.querySelector('#qr-motion');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const supported = ['en', 'ar', 'he', 'ru', 'es', 'zh', 'fr', 'tr'];
  const extra = document.querySelector('#qr-other-language');
  const valid = value => supported.includes(value);
  const urls = Object.fromEntries(supported.map(language => [language, 'https://athari.dev/' + language + '/']));
  const names = { en: { he:'Hebrew',ru:'Russian',es:'Spanish',zh:'Chinese',fr:'French',tr:'Turkish' }, ar: { he:'العبرية',ru:'الروسية',es:'الإسبانية',zh:'الصينية',fr:'الفرنسية',tr:'التركية' } };
  const normalize = value => value;
  const words = {
    en: {
      other: 'Other languages…', edition: 'A LIVING BUSINESS CARD', eyebrow: 'AN IDEA. A CONVERSATION. A BEGINNING.',
      title: 'Let’s', titleArt: 'connect.', subtitle: 'Scan. Connect. Build something useful.',
      choose: 'Choose their language', present: 'Present', exit: 'Exit view', share: 'Share', save: 'Save QR',
      footer: 'Small beginnings. Lasting impact.',
      destination: { en: 'Opens the English website', ar: 'Opens the Arabic website' },
      open: { en: 'Open the English website', ar: 'Open the Arabic website' },
      code: { en: 'Scan this QR code to open the English website at athari.dev', ar: 'Scan this QR code to open the Arabic website at athari.dev' },
      pause: 'Pause artwork motion', play: 'Resume artwork motion',
      copied: 'Website link copied.', manual: 'Press and hold athari.dev above to copy the website link.',
      shareText: 'Let’s build something useful together.', presenting: 'Hold steady. Let them scan.'
    },
    ar: {
      other: 'لغات أخرى…', edition: 'بطاقة تواصل حيّة', eyebrow: 'فكرة. حديث. بداية.',
      title: 'تواصلٌ', titleArt: 'يترك أثرًا.', subtitle: 'امسح الرمز، ولنبنِ شيئًا نافعًا.',
      choose: 'اختر لغة من تقابله', present: 'عرض أكبر', exit: 'رجوع', share: 'مشاركة', save: 'حفظ الرمز',
      footer: 'بدايات صغيرة. أثر يدوم.',
      destination: { en: 'يفتح الموقع بالإنجليزية', ar: 'يفتح الموقع بالعربية' },
      open: { en: 'افتح الموقع بالإنجليزية', ar: 'افتح الموقع بالعربية' },
      code: { en: 'امسح الرمز لفتح موقع athari.dev بالإنجليزية', ar: 'امسح الرمز لفتح موقع athari.dev بالعربية' },
      pause: 'إيقاف حركة العمل الفني', play: 'تشغيل حركة العمل الفني',
      copied: 'نُسخ رابط الموقع.', manual: 'اضغط مطوّلًا على athari.dev أعلاه لنسخ رابط الموقع.',
      shareText: 'لنبنِ شيئًا نافعًا معًا.', presenting: 'ثبّت الهاتف ليتمكّن الآخر من مسح الرمز.'
    }
  };
  let uiLocale = 'en', selected = 'en', presenting = false, paused = reduced.matches, fullscreenOwned = false;
  let wake = null, wakePending = false;
  const copy = () => words[uiLocale];
  const renderMotion = () => {
    body.toggleAttribute('data-motion-paused', paused || reduced.matches || document.hidden);
    motion.hidden = reduced.matches;
    motion.setAttribute('aria-pressed', String(paused || reduced.matches));
    motion.setAttribute('aria-label', paused ? copy().play : copy().pause);
  };
  const languageText = (language, kind) => {
    if (copy()[kind][language]) return copy()[kind][language];
    const name = names[uiLocale][language];
    if (uiLocale === 'ar') return kind === 'destination' ? 'يفتح الموقع ب' + name : kind === 'open' ? 'افتح الموقع ب' + name : 'امسح الرمز لفتح موقع athari.dev ب' + name;
    return kind === 'destination' ? 'Opens the ' + name + ' website' : kind === 'open' ? 'Open the ' + name + ' website' : 'Scan to open athari.dev in ' + name;
  };
  const render = () => {
    document.documentElement.lang = uiLocale; document.documentElement.dir = uiLocale === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-i18n]').forEach(node => {
      const key = node.dataset.i18n;
      node.textContent = key === 'present' && presenting ? copy().exit : copy()[key];
    });
    if (extra) { extra.value = selected === 'en' || selected === 'ar' ? '' : selected; extra.disabled = false; extra.setAttribute('aria-label', copy().other); }
    choices.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.recipient === selected)));
    codes.forEach(node => {
      node.hidden = node.dataset.code !== selected;
      node.querySelector('title').textContent = languageText(node.dataset.code, 'code');
    });
    destination.href = urls[selected]; destination.setAttribute('aria-label', languageText(selected, 'open'));
    destinationNote.textContent = languageText(selected, 'destination');
    save.href = '/qr/athari-qr-' + selected + '.png'; save.download = 'athari-qr-' + selected + '.png';
    present.setAttribute('aria-pressed', String(presenting));
    renderMotion();
  };
  try {
    const requested = normalize(new URLSearchParams(location.search).get('for'));
    const remembered = normalize(sessionStorage.getItem('athari-qr-recipient'));
    const siteLocale = localStorage.getItem('athari-language');
    uiLocale = siteLocale === 'ar' ? 'ar' : 'en';
    selected = valid(requested) ? requested : valid(remembered) ? remembered : siteLocale === 'ar' ? 'ar' : 'en';
  } catch {
    const requested = normalize(new URLSearchParams(location.search).get('for'));
    if (valid(requested)) selected = requested;
  }
  choices.forEach(button => {
    button.disabled = false;
    button.addEventListener('click', () => {
      if (selected === button.dataset.recipient) return;
      selected = button.dataset.recipient;
      try { sessionStorage.setItem('athari-qr-recipient', selected); } catch {}
      status.textContent = ''; render();
    });
  });
  extra?.addEventListener('change', () => {
    if (!valid(extra.value)) { render(); return; }
    selected = extra.value;
    try { sessionStorage.setItem('athari-qr-recipient', selected); } catch {}
    status.textContent = ''; render();
  });
  motion.addEventListener('click', () => { paused = !paused; renderMotion(); });
  reduced.addEventListener('change', event => { paused = event.matches; renderMotion(); });

  const releaseWake = () => { if (wake) { const previous = wake; wake = null; void previous.release().catch(() => {}); } };
  const keepAwake = async () => {
    if (!presenting || document.hidden || wake || wakePending || !navigator.wakeLock) return;
    wakePending = true;
    try {
      const lock = await navigator.wakeLock.request('screen');
      if (!presenting || document.hidden) { await lock.release(); return; }
      wake = lock;
      lock.addEventListener('release', () => { if (wake === lock) wake = null; });
    } catch {} finally { wakePending = false; }
  };
  const setPresenting = async enabled => {
    presenting = enabled; body.toggleAttribute('data-presenting', enabled);
    status.textContent = enabled ? copy().presenting : ''; render();
    if (enabled) {
      void keepAwake();
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen(); fullscreenOwned = true;
          if (!presenting && document.fullscreenElement && document.exitFullscreen) {
            await document.exitFullscreen(); fullscreenOwned = false;
          }
        }
      } catch {} // The larger CSS view remains usable when fullscreen is unavailable.
    } else {
      releaseWake();
      try { if (fullscreenOwned && document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen(); } catch {}
      fullscreenOwned = false;
    }
  };
  present.disabled = false;
  present.addEventListener('click', () => { void setPresenting(!presenting); });
  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) fullscreenOwned = true;
    else if (fullscreenOwned) { fullscreenOwned = false; void setPresenting(false); }
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && presenting) void setPresenting(false); });
  document.addEventListener('visibilitychange', () => {
    renderMotion();
    if (document.hidden) releaseWake(); else void keepAwake();
  });
  share.disabled = false;
  share.addEventListener('click', async () => {
    const url = urls[selected];
    status.textContent = '';
    if (navigator.share) {
      try { await navigator.share({ title: 'athari.dev', text: copy().shareText, url }); return; }
      catch (error) { if (error.name === 'AbortError') return; }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try { await navigator.clipboard.writeText(url); status.textContent = copy().copied; return; } catch {}
    }
    status.textContent = copy().manual;
  });
  render();
})();

