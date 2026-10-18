/* Owned contact endpoint: Vercel -> existing Google Workspace SMTP. */
(() => {
  'use strict';
  const form = document.querySelector('#collaboration-form');
  if (!form || !window.fetch || !window.AbortController) return;
  const endpoint = form.dataset.endpoint;
  const button = form.querySelector('button[type="submit"]');
  const label = button.querySelector('.contact-submit-label');
  const status = document.querySelector('#contact-status');
  const success = document.querySelector('#contact-success');
  let pending = false, ready = false, token = '', issued = 0, initialized = false;
  const unavailable = 'The form is being connected. Please email adam@athari.dev directly for now.';
  async function request(options) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 22000);
    try {
      const response = await fetch(endpoint, { ...options, credentials: 'omit', cache: 'no-store', signal: controller.signal });
      const result = await response.json();
      return { response, result };
    } finally { clearTimeout(timer); }
  }
  async function challenge() {
    const { response, result } = await request({ method: 'GET', headers: { Accept: 'application/json' } });
    if (!response.ok || result.ready !== true || !result.token) throw new Error('unavailable');
    token = result.token; issued = Date.now();
    await new Promise(resolve => setTimeout(resolve, Math.min(2500, Math.max(1500, result.minWaitMs || 1500))));
  }
  async function initialize() {
    if (initialized) return; initialized = true;
    status.textContent = 'Connecting secure email delivery…';
    try { await challenge(); ready = true; button.disabled = false; status.textContent = ''; }
    catch { status.textContent = unavailable; button.disabled = true; }
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); void initialize(); }
    }, { rootMargin: '250px' }); observer.observe(form);
  } else { void initialize(); }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || !ready || !form.reportValidity() || form.elements.website.value) return;
    pending = true; button.disabled = true; button.setAttribute('aria-busy', 'true');
    label.textContent = 'Sending…'; status.removeAttribute('data-error'); status.textContent = 'Sending your enquiry securely…';
    try {
      if (!token || Date.now() - issued > 14 * 60 * 1000) await challenge();
      const fields = new FormData(form);
      const { response, result } = await request({ method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: String(fields.get('email')).trim(), collaboration: fields.get('collaboration'),
          message: String(fields.get('message') || ''), website: fields.get('website') || '', token }) });
      token = '';
      if (!response.ok || result.success !== true) {
        if (response.status === 503) { ready = false; throw new Error('unavailable'); }
        if (response.status === 429) throw new Error('rate_limited');
        throw new Error('unconfirmed');
      }
      form.hidden = true; success.hidden = false; success.querySelector('h3').focus({ preventScroll: true });
    } catch (error) {
      token = ''; status.dataset.error = '';
      status.textContent = error.message === 'unavailable' ? unavailable : error.message === 'rate_limited'
        ? 'Please wait a few minutes before trying again, or email adam@athari.dev directly.'
        : 'Couldn’t confirm delivery. Your details are still here. Try again, or email adam@athari.dev directly.';
    } finally {
      pending = false; button.disabled = !ready; button.removeAttribute('aria-busy'); label.textContent = 'Start a conversation';
    }
  });
})();
