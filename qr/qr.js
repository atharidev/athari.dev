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
  const valid = value => ['en', 'ar', 'he'].includes(value);
  const urls = { en: 'https://athari.dev/en/', ar: 'https://athari.dev/ar/', he: 'https://athari.dev/en/' };
  const words = {
    en: {
      edition: 'A LIVING BUSINESS CARD', eyebrow: 'AN IDEA. A CONVERSATION. A BEGINNING.',
      title: 'Let’s', titleArt: 'connect.', subtitle: 'Scan. Connect. Build something useful.',
      choose: 'Choose their language', present: 'Present', exit: 'Exit view', share: 'Share', save: 'Save QR',
      footer: 'Small beginnings. Lasting impact.', destination: 'Opens the English website',
      hebrew: 'For Hebrew speakers · opens the English website', open: 'Open the English website',
      code: 'Scan this QR code to open the English website at athari.dev',
      pause: 'Pause artwork motion', play: 'Resume artwork motion',
      copied: 'Website link copied.', manual: 'Press and hold athari.dev above to copy the website link.',
      shareText: 'Let’s build something useful together.', presenting: 'Hold steady. Let them scan.'
    },
    ar: {
      edition: 'بطاقة تواصل حيّة', eyebrow: 'فكرة. حديث. بداية.',
      title: 'تواصلٌ', titleArt: 'يترك أثرًا.', subtitle: 'امسح الرمز، ولنبنِ شيئًا نافعًا.',
      choose: 'اختر لغة من تقابله', present: 'عرض أكبر', exit: 'رجوع', share: 'مشاركة', save: 'حفظ الرمز',
      footer: 'بدايات صغيرة. أثر يدوم.', destination: 'يفتح الموقع بالعربية',
      hebrew: 'للمتحدّثين بالعبرية، يفتح الموقع بالإنجليزية', open: 'افتح الموقع بالعربية',
      code: 'امسح الرمز لفتح موقع athari.dev بالعربية',
      pause: 'إيقاف حركة العمل الفني', play: 'تشغيل حركة العمل الفني',
      copied: 'نُسخ رابط الموقع.', manual: 'اضغط مطوّلًا على athari.dev أعلاه لنسخ رابط الموقع.',
      shareText: 'لنبنِ شيئًا نافعًا معًا.', presenting: 'ثبّت الهاتف ليتمكّن الآخر من مسح الرمز.'
    }
  };
  let selected = 'en', presenting = false, paused = reduced.matches, fullscreenOwned = false;
  let wake = null, wakePending = false;
  const copy = () => words[selected === 'ar' ? 'ar' : 'en'];
  const renderMotion = () => {
    body.toggleAttribute('data-motion-paused', paused || reduced.matches || document.hidden);
    motion.hidden = reduced.matches;
    motion.setAttribute('aria-pressed', String(paused || reduced.matches));
    motion.setAttribute('aria-label', paused ? copy().play : copy().pause);
  };
  const render = () => {
    const locale = selected === 'ar' ? 'ar' : 'en';
    document.documentElement.lang = locale; document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-i18n]').forEach(node => {
      const key = node.dataset.i18n;
      node.textContent = key === 'present' && presenting ? copy().exit : copy()[key];
    });
    choices.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.recipient === selected)));
    codes.forEach(node => {
      node.hidden = node.dataset.code !== selected;
      node.querySelector('title').textContent = copy().code;
    });
    destination.href = urls[selected]; destination.setAttribute('aria-label', copy().open);
    destinationNote.textContent = selected === 'he' ? copy().hebrew : copy().destination;
    save.href = '/qr/athari-qr-' + selected + '.png'; save.download = 'athari-qr-' + selected + '.png';
    present.setAttribute('aria-pressed', String(presenting));
    renderMotion();
  };
  try {
    const requested = new URLSearchParams(location.search).get('for');
    const remembered = sessionStorage.getItem('athari-qr-recipient');
    const siteLocale = localStorage.getItem('athari-language');
    selected = valid(requested) ? requested : valid(remembered) ? remembered : siteLocale === 'ar' ? 'ar' : 'en';
  } catch {
    const requested = new URLSearchParams(location.search).get('for');
    if (valid(requested)) selected = requested;
  }
  choices.forEach(button => {
    button.disabled = false;
    button.addEventListener('click', () => {
      selected = button.dataset.recipient;
      try { sessionStorage.setItem('athari-qr-recipient', selected); } catch {}
      status.textContent = ''; render();
    });
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
