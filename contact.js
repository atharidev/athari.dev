/* Collaboration form. No client secrets or local storage. */
(() => {
  'use strict';
  const form = document.querySelector('#collaboration-form');
  if (!form || !window.fetch || !window.AbortController) return;
  const button = form.querySelector('button[type="submit"]');
  const label = button.querySelector('.contact-submit-label');
  const status = document.querySelector('#contact-status');
  const success = document.querySelector('#contact-success');
  let pending = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || !form.reportValidity()) return;
    // A filled honeypot is ignored without sending a notification.
    if (form.elements._honey.value) return;
    const fields = new FormData(form);
    fields.set('email', String(fields.get('email')).trim());
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    pending = true;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    label.textContent = 'Sending…';
    status.removeAttribute('data-error');
    status.textContent = 'Sending your enquiry securely…';
    try {
      const response = await fetch('https://formsubmit.co/ajax/adam@athari.dev', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: fields,
        signal: controller.signal,
        credentials: 'omit'
      });
      const result = await response.json();
      if (!response.ok || ![true, 'true'].includes(result.success) || /activat/i.test(result.message || '')) {
        throw new Error('Delivery not confirmed');
      }
      form.hidden = true;
      success.hidden = false;
      success.querySelector('h3').focus({ preventScroll: true });
    } catch {
      status.dataset.error = '';
      status.textContent = 'Couldn’t confirm delivery. Your details are still here. Try again, or email adam@athari.dev directly.';
    } finally {
      clearTimeout(timer);
      pending = false;
      button.disabled = false;
      button.removeAttribute('aria-busy');
      label.textContent = 'Start a conversation';
    }
  });
})();
