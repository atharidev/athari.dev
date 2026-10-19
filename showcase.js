/* Local illustrative demos. No appointments, records or messages are submitted here. */
(() => {
  'use strict';
  const root = document.querySelector('#showcase');
  if (!root) return;
  const arabic = document.documentElement.lang === 'ar';
  const copy = arabic ? {
    choose: 'اختر وقتًا لتجربة خطوات الحجز.',
    selected: time => `الموعد المختار: ${time}. يمكنك الآن تجربة التأكيد.`,
    booking: (service, time) => `اختيار تجريبي: ${service}، الساعة ${time}. لم يتم إنشاء حجز فعلي.`,
    stages: { new: 'جديد', active: 'قيد العمل', done: 'مكتمل' },
    actions: { new: 'ابدأ', active: 'أكمل', done: 'تمّ' },
    updated: (name, stage) => `${name}، ${stage}.`, reset: 'أُعيدت الطلبات التجريبية إلى حالتها الأولى.'
  } : {
    choose: 'Select a time to try the booking flow.',
    selected: time => `Selected: ${time}. You can now preview the confirmation.`,
    booking: (service, time) => `Demo selection: ${service} at ${time}. No appointment has been created.`,
    stages: { new: 'New', active: 'In progress', done: 'Complete' },
    actions: { new: 'Start', active: 'Complete', done: 'Done' },
    updated: (name, stage) => `${name}: ${stage}.`, reset: 'Demo requests restored to their initial state.'
  };
  const tabs = [...root.querySelectorAll('[data-demo-tab]')];
  const panels = [...root.querySelectorAll('.demo-panel')];
  const activate = (index, focus = false) => {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
    if (focus) tabs[index].focus();
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(index));
    tab.addEventListener('keydown', event => {
      const next = arabic ? 'ArrowLeft' : 'ArrowRight';
      const previous = arabic ? 'ArrowRight' : 'ArrowLeft';
      let target;
      if (event.key === next) target = (index + 1) % tabs.length;
      if (event.key === previous) target = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') target = 0;
      if (event.key === 'End') target = tabs.length - 1;
      if (target === undefined) return;
      event.preventDefault(); activate(target, true);
    });
  });
  activate(0);
  root.querySelector('.demo-tabs').hidden = false;

  const slots = [...root.querySelectorAll('[data-demo-slot]')];
  const service = root.querySelector('#demo-service');
  const confirm = root.querySelector('#demo-booking-confirm');
  const bookingStatus = root.querySelector('#demo-booking-status');
  const bookingResult = root.querySelector('#demo-booking-result');
  const bookingReset = root.querySelector('#demo-booking-reset');
  let selectedTime = '';
  slots.forEach(slot => {
    slot.disabled = false;
    slot.addEventListener('click', () => {
      selectedTime = slot.dataset.demoSlot;
      slots.forEach(other => other.setAttribute('aria-pressed', String(other === slot)));
      bookingStatus.textContent = copy.selected(selectedTime);
      bookingResult.hidden = true; confirm.disabled = false;
    });
  });
  service.addEventListener('change', () => {
    bookingResult.hidden = true;
    bookingStatus.textContent = selectedTime ? copy.selected(selectedTime) : copy.choose;
    confirm.disabled = !selectedTime;
  });
  confirm.addEventListener('click', () => {
    if (!selectedTime) return;
    const serviceName = service.options[service.selectedIndex].textContent;
    bookingStatus.textContent = copy.booking(serviceName, selectedTime);
    bookingResult.hidden = false; confirm.disabled = true;
  });
  bookingReset.disabled = false;
  bookingReset.addEventListener('click', () => {
    selectedTime = ''; service.selectedIndex = 0;
    slots.forEach(slot => slot.setAttribute('aria-pressed', 'false'));
    bookingStatus.textContent = copy.choose; bookingResult.hidden = true; confirm.disabled = true;
  });

  const requests = [...root.querySelectorAll('[data-demo-request]')];
  const filters = [...root.querySelectorAll('[data-demo-filter]')];
  const boardStatus = root.querySelector('.demo-board-status');
  let filter = 'all';
  const renderBoard = () => {
    for (const stage of ['new', 'active', 'done']) {
      root.querySelector(`[data-demo-count="${stage}"]`).textContent = String(requests.filter(row => row.dataset.status === stage).length);
    }
    requests.forEach(row => {
      const stage = row.dataset.status;
      row.hidden = (filter === 'open' && stage === 'done') || (filter === 'done' && stage !== 'done');
      row.querySelector('[data-demo-request-status]').textContent = copy.stages[stage];
      const action = row.querySelector('[data-demo-advance]');
      action.textContent = copy.actions[stage]; action.disabled = stage === 'done';
    });
    root.querySelector('.demo-board-empty').hidden = requests.some(row => !row.hidden);
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.demoFilter === filter)));
  };
  requests.forEach(row => row.querySelector('[data-demo-advance]').addEventListener('click', () => {
    if (row.dataset.status === 'done') return;
    row.dataset.status = row.dataset.status === 'new' ? 'active' : 'done';
    renderBoard();
    boardStatus.textContent = copy.updated(row.querySelector('strong').textContent, copy.stages[row.dataset.status]);
    if (row.hidden || row.dataset.status === 'done') {
      const next = requests.find(item => !item.hidden && item.dataset.status !== 'done');
      const target = next ? next.querySelector('[data-demo-advance]') : filters.find(button => button.dataset.demoFilter === filter);
      target.focus({ preventScroll: true });
    }
  }));
  filters.forEach(button => button.addEventListener('click', () => { filter = button.dataset.demoFilter; renderBoard(); }));
  root.querySelector('.demo-board-filters').hidden = false;
  const boardReset = root.querySelector('#demo-board-reset');
  boardReset.disabled = false;
  boardReset.addEventListener('click', () => {
    requests.forEach(row => { row.dataset.status = row.dataset.initialStatus; });
    filter = 'all'; renderBoard(); boardStatus.textContent = copy.reset;
  });
  renderBoard();

  root.querySelectorAll('[data-demo-enquiry]').forEach(link => link.addEventListener('click', () => {
    const message = document.querySelector('#contact-message');
    const business = document.querySelector('#collaboration-form input[value="Business"]');
    const email = document.querySelector('#contact-email');
    if (message && !message.value.trim()) message.value = link.dataset.demoEnquiry;
    if (business) business.checked = true;
    if (email) email.focus({ preventScroll: true });
  }));
})();
