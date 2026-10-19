const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm'), fs = require('node:fs'), path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../contact.js'), 'utf8');
async function setup({ ready = true, fail = false, lang = 'en' } = {}) {
  const calls = [], fields = { email: 'visitor@example.com', collaboration: 'Business', message: 'Please help with an idea.', website: '' };
  const label = {}, status = { dataset: {}, removeAttribute() {} }, heading = { focus() { this.focused = true; } }, success = { hidden: true, querySelector: () => heading };
  const button = { disabled: true, querySelector: () => label, setAttribute() {}, removeAttribute() {} };
  const form = { dataset: { endpoint: 'https://contact.athari.dev/api/contact' }, hidden: false, elements: { website: { value: '' } },
    querySelector: () => button, reportValidity: () => true, addEventListener(_, callback) { this.submit = callback; } };
  const fetch = async (url, options) => {
    calls.push({ url, options });
    if (options.method === 'GET') return { ok: true, json: async () => ({ ready, token: ready ? 'test-token' : null, minWaitMs: 1500 }) };
    return { ok: !fail, status: fail ? 502 : 200, json: async () => ({ success: !fail }) };
  };
  const context = { document: { documentElement: { lang }, querySelector: key => ({ '#collaboration-form': form, '#contact-status': status, '#contact-success': success })[key] },
    window: { fetch, AbortController }, fetch, AbortController, Date, FormData: class { get(key) { return fields[key]; } },
    setTimeout(callback, delay) { if (delay <= 2500) queueMicrotask(callback); return 1; }, clearTimeout() {} };
  vm.runInNewContext(source, context);
  await new Promise(resolve => setImmediate(resolve));
  return { form, fields, button, status, success, calls, submit: () => form.submit({ preventDefault() {} }) };
}
test('unconfigured API disables form and offers direct contact', async () => {
  const s = await setup({ ready: false }); assert.equal(s.button.disabled, true); assert.match(s.status.textContent, /email adam@athari.dev directly/);
  await s.submit(); assert.equal(s.calls.filter(x => x.options.method === 'POST').length, 0); assert.equal(s.success.hidden, true);
});
test('ready API sends only to the owned endpoint and shows success after acceptance', async () => {
  const s = await setup(); assert.equal(s.button.disabled, false); await s.submit();
  assert.equal(s.form.hidden, true); assert.equal(s.success.hidden, false);
  const post = s.calls.find(x => x.options.method === 'POST'); assert.equal(post.url, 'https://contact.athari.dev/api/contact');
  assert.equal(post.options.credentials, 'omit'); assert.equal(JSON.parse(post.options.body).email, 'visitor@example.com');
});
test('failed SMTP response keeps entered data and never shows success', async () => {
  const s = await setup({ fail: true }); await s.submit(); assert.equal(s.form.hidden, false); assert.equal(s.success.hidden, true);
  assert.equal(s.fields.message, 'Please help with an idea.'); assert.match(s.status.textContent, /details are still here/); assert.equal(s.button.disabled, false);
});

test('Arabic form submits the existing API values and shows success only after acceptance', async () => {
  const s = await setup({ lang: 'ar' }); await s.submit();
  assert.equal(s.success.hidden, false);
  const post = s.calls.find(x => x.options.method === 'POST');
  assert.equal(JSON.parse(post.options.body).collaboration, 'Business');
});
test('Arabic form failures preserve entered text and show Arabic recovery instructions', async () => {
  const s = await setup({ lang: 'ar', fail: true }); await s.submit();
  assert.equal(s.form.hidden, false); assert.equal(s.success.hidden, true);
  assert.match(s.status.textContent, /لم نتمكّن من تأكيد الإرسال/);
  assert.equal(s.fields.message, 'Please help with an idea.');
});
test('Arabic unavailable service disables sending with direct email in Arabic', async () => {
  const s = await setup({ lang: 'ar', ready: false });
  assert.equal(s.button.disabled, true); assert.match(s.status.textContent, /خدمة الإرسال غير متاحة/);
  assert.match(s.status.textContent, /adam@athari.dev/);
});
