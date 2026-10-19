const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../showcase.js'), 'utf8');
function element(values = {}) {
  return { hidden: false, disabled: false, dataset: {}, attrs: {}, events: {}, textContent: '', value: '',
    setAttribute(k,v) { this.attrs[k] = v; }, addEventListener(k,fn) { this.events[k] = fn; },
    focus() { this.focused = true; }, querySelector(key) { return this.children[key]; }, ...values };
}
function setup(lang = 'en', draft = '') {
  const tabs = ['web','app','tool'].map(value => element({ dataset: { demoTab: value } }));
  const panels = tabs.map(() => element());
  const slots = ['10:00','12:30','15:00'].map(value => element({ dataset: { demoSlot: value } }));
  const service = element({ selectedIndex: 0, options: [{ textContent: lang === 'ar' ? 'مناقشة فكرة مشروع' : 'Project discovery' }, { textContent: 'Business consultation' }] });
  const requests = ['new','active','new'].map((status,i) => element({ dataset: { status, initialStatus: status }, children: {
    '[data-demo-request-status]': element(), '[data-demo-advance]': element(), strong: element({ textContent: 'Request '+(i+1) })
  } }));
  const filters = ['all','open','done'].map(value => element({ dataset: { demoFilter: value } }));
  const enquiry = element({ dataset: { demoEnquiry: 'I would like a website like this demo.' } });
  const local = { '.demo-tabs': element(), '#demo-service': service, '#demo-booking-confirm': element({ disabled: true }),
    '#demo-booking-status': element(), '#demo-booking-result': element({ hidden: true }), '#demo-booking-reset': element(),
    '.demo-board-status': element(), '.demo-board-empty': element(), '.demo-board-filters': element(), '#demo-board-reset': element(),
    '[data-demo-count="new"]': element(), '[data-demo-count="active"]': element(), '[data-demo-count="done"]': element() };
  const groups = { '[data-demo-tab]': tabs, '.demo-panel': panels, '[data-demo-slot]': slots,
    '[data-demo-request]': requests, '[data-demo-filter]': filters, '[data-demo-enquiry]': [enquiry] };
  const root = { querySelector: k => local[k], querySelectorAll: k => groups[k] };
  const message = element({ value: draft }), business = element(), email = element();
  const document = { documentElement: { lang }, querySelector: k => ({ '#showcase': root, '#contact-message': message,
    '#collaboration-form input[value="Business"]': business, '#contact-email': email })[k] };
  let networkCalls = 0;
  vm.runInNewContext(source, { document, fetch() { networkCalls++; throw Error('Demo must stay local'); } });
  return { tabs, panels, slots, service, requests, filters, enquiry, local, message, business, email, networkCalls: () => networkCalls };
}
const click = el => el.events.click();
test('demo tabs expose one panel and support RTL keyboard navigation', () => {
  const s = setup('ar'); assert.deepEqual(s.panels.map(p => p.hidden), [false,true,true]);
  let prevented = false;
  s.tabs[0].events.keydown({ key: 'ArrowLeft', preventDefault() { prevented = true; } });
  assert.equal(prevented, true); assert.deepEqual(s.panels.map(p => p.hidden), [true,false,true]);
  assert.equal(s.tabs[1].focused, true); assert.equal(s.tabs[1].attrs['aria-selected'], 'true');
  click(s.tabs[2]); assert.deepEqual(s.panels.map(p => p.hidden), [true,true,false]);
});
test('booking preview requires a slot, confirms locally, and resets', () => {
  const s = setup(); const confirm = s.local['#demo-booking-confirm'];
  assert.equal(confirm.disabled, true); click(confirm); assert.equal(confirm.disabled, true);
  click(s.slots[1]); assert.equal(confirm.disabled, false); click(confirm);
  assert.match(s.local['#demo-booking-status'].textContent, /Project discovery at 12:30/);
  assert.match(s.local['#demo-booking-status'].textContent, /No appointment has been created/);
  assert.equal(s.local['#demo-booking-result'].hidden, false); assert.equal(s.networkCalls(), 0);
  click(s.local['#demo-booking-reset']); assert.equal(confirm.disabled, true);
  assert.equal(s.local['#demo-booking-result'].hidden, true);
  assert.ok(s.slots.every(slot => slot.attrs['aria-pressed'] === 'false'));
});
test('Arabic booking confirmation explains that no real appointment was created', () => {
  const s = setup('ar'); click(s.slots[0]); click(s.local['#demo-booking-confirm']);
  assert.match(s.local['#demo-booking-status'].textContent, /اختيار تجريبي: مناقشة فكرة مشروع/);
  assert.match(s.local['#demo-booking-status'].textContent, /لم يتم إنشاء حجز فعلي/);
});
test('request transitions, filters and reset keep demo counts consistent', () => {
  const s = setup(), count = stage => s.local[`[data-demo-count="${stage}"]`].textContent;
  assert.equal(count('new'), '2'); assert.equal(count('active'), '1'); assert.equal(count('done'), '0');
  const first = s.requests[0]; click(first.children['[data-demo-advance]']);
  assert.equal(count('new'), '1'); assert.equal(count('active'), '2');
  click(first.children['[data-demo-advance]']); assert.equal(count('done'), '1');
  click(s.filters[1]); assert.equal(first.hidden, true);
  click(s.filters[2]); assert.deepEqual(s.requests.map(row => row.hidden), [false,true,true]);
  click(s.local['#demo-board-reset']); assert.equal(count('new'), '2'); assert.equal(count('done'), '0');
  assert.ok(s.requests.every(row => !row.hidden)); assert.equal(s.networkCalls(), 0);
});
test('demo enquiry links preserve visitor drafts and only prefill an empty form', () => {
  const s = setup('en', 'My existing draft'); click(s.enquiry);
  assert.equal(s.message.value, 'My existing draft'); assert.equal(s.business.checked, true);
  s.message.value = ''; click(s.enquiry); assert.equal(s.message.value, s.enquiry.dataset.demoEnquiry);
  assert.equal(s.email.focused, true); assert.equal(s.networkCalls(), 0);
});
