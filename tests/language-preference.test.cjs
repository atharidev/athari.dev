const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const gateway = fs.readFileSync(path.join(__dirname, '../gateway.js'), 'utf8');
const language = fs.readFileSync(path.join(__dirname, '../language.js'), 'utf8');
function route(value, search = '', blocked = false) {
  let destination;
  vm.runInNewContext(gateway, { URLSearchParams, location: { search, hash: '#connect', replace: value => destination = value }, localStorage: { getItem() { if (blocked) throw new Error('blocked'); return value; } } });
  return destination;
}
test('first visit and invalid preferences stay at the language choice', () => {
  assert.equal(route(null), undefined); assert.equal(route('https://example.com'), undefined);
});
test('returning visitors go to their language with their section preserved', () => {
  assert.equal(route('ar'), '/ar/#connect'); assert.equal(route('en'), '/en/#connect');
});
test('explicit chooser and unavailable local storage keep entrance usable', () => {
  assert.equal(route('ar', '?choose=1'), undefined); assert.equal(route(null, '', true), undefined);
});
test('locale page remembers explicit choice and language switch preserves section', () => {
  const values = {}, listeners = {}, link = { dataset: { language: 'en' }, setAttribute(k,v) { this[k] = v; }, addEventListener(k,v) { listeners[k] = v; } };
  vm.runInNewContext(language, {
    document: { documentElement: { lang: 'ar' }, querySelectorAll: () => [link] }, location: { hash: '#perspective' },
    window: { addEventListener() {} }, localStorage: { setItem: (k,v) => values[k] = v }
  });
  assert.equal(values['athari-language'], 'ar'); assert.equal(link.href, '/en/#perspective');
  listeners.click(); assert.equal(values['athari-language'], 'en');
});
