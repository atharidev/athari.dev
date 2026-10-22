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

  // Three miniature website pages, without leaving the showcase.
  const sitePages = [...(root.querySelectorAll('[data-site-page]') || [])];
  const sitePanels = [...(root.querySelectorAll('[data-site-panel]') || [])];
  sitePages.forEach(button => button.addEventListener('click', () => {
    const page = button.dataset.sitePage;
    sitePages.forEach(item => item.setAttribute('aria-current', item === button ? 'page' : 'false'));
    sitePanels.forEach(panel => { panel.hidden = panel.dataset.sitePanel !== page; });
  }));
  const slots = [...root.querySelectorAll('[data-demo-slot]')];
  const service = root.querySelector('#demo-service');
  const confirm = root.querySelector('#demo-booking-confirm');
  const bookingStatus = root.querySelector('#demo-booking-status');
  const bookingResult = root.querySelector('#demo-booking-result');
  const bookingReset = root.querySelector('#demo-booking-reset');
  const days = [...(root.querySelectorAll('[data-demo-day]') || [])];
  const duration = root.querySelector('[data-demo-duration]');
  const summary = root.querySelector('[data-booking-summary]');
  let selectedDay = 0;
  const dates = [];
  for (let offset = 1; dates.length < 3; offset++) {
    const date = new Date(); date.setDate(date.getDate() + offset);
    dates.push(date);
  }
  const dateFormat = new Intl.DateTimeFormat(arabic ? 'ar' : 'en', { weekday: 'short', month: 'short', day: 'numeric' });
  const selectedDuration = () => service.options[service.selectedIndex].dataset?.duration || '30';
  const renderDuration = () => { if (duration) duration.textContent = selectedDuration() + (arabic ? ' دقيقة' : ' minutes'); };
  days.forEach((day, index) => {
    day.textContent = dateFormat.format(dates[index]); day.disabled = false;
    day.addEventListener('click', () => {
      selectedDay = index; selectedTime = '';
      days.forEach((item, i) => item.setAttribute('aria-pressed', String(i === index)));
      slots.forEach(slot => slot.setAttribute('aria-pressed', 'false'));
      bookingResult.hidden = true; confirm.disabled = true; bookingStatus.textContent = copy.choose;
    });
  });
  renderDuration();
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
    renderDuration();
    bookingResult.hidden = true;
    bookingStatus.textContent = selectedTime ? copy.selected(selectedTime) : copy.choose;
    confirm.disabled = !selectedTime;
  });
  confirm.addEventListener('click', () => {
    if (!selectedTime) return;
    const serviceName = service.options[service.selectedIndex].textContent;
    bookingStatus.textContent = copy.booking(serviceName, selectedTime);
    if (summary) summary.textContent = `${serviceName} · ${dateFormat.format(dates[selectedDay])} · ${selectedTime} · ${selectedDuration()} ${arabic ? 'دقيقة' : 'min'}`;
    bookingResult.hidden = false; confirm.disabled = true;
  });
  bookingReset.disabled = false;
  bookingReset.addEventListener('click', () => {
    selectedTime = ''; service.selectedIndex = 0; selectedDay = 0;
    days.forEach((day, i) => day.setAttribute('aria-pressed', String(i === 0)));
    renderDuration();
    slots.forEach(slot => slot.setAttribute('aria-pressed', 'false'));
    bookingStatus.textContent = copy.choose; bookingResult.hidden = true; confirm.disabled = true;
  });

  let requests = [...root.querySelectorAll('[data-demo-request]')];
  const filters = [...root.querySelectorAll('[data-demo-filter]')];
  const boardStatus = root.querySelector('.demo-board-status');
  const search = root.querySelector('#demo-search');
  const addForm = root.querySelector('#demo-add-form');
  const newRequest = root.querySelector('#demo-new-request');
  const progress = root.querySelector('[data-demo-progress]');
  let query = '', filter = 'all';
  const renderBoard = () => {
    for (const stage of ['new', 'active', 'done']) {
      root.querySelector(`[data-demo-count="${stage}"]`).textContent = String(requests.filter(row => row.dataset.status === stage).length);
    }
    requests.forEach(row => {
      const stage = row.dataset.status;
      row.hidden = (filter === 'open' && stage === 'done') || (filter === 'done' && stage !== 'done') || !row.querySelector('strong').textContent.toLocaleLowerCase().includes(query);
      row.querySelector('[data-demo-request-status]').textContent = copy.stages[stage];
      const action = row.querySelector('[data-demo-advance]');
      action.textContent = copy.actions[stage]; action.disabled = stage === 'done';
      action.setAttribute('aria-label', `${copy.actions[stage]}: ${row.querySelector('strong').textContent}`);
    });
    if (progress) progress.style.width = `${requests.length ? requests.filter(row => row.dataset.status === 'done').length / requests.length * 100 : 0}%`;
    root.querySelector('.demo-board-empty').hidden = requests.some(row => !row.hidden);
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.demoFilter === filter)));
  };
  const bindRequest = row => row.querySelector('[data-demo-advance]').addEventListener('click', () => {
    if (row.dataset.status === 'done') return;
    row.dataset.status = row.dataset.status === 'new' ? 'active' : 'done';
    renderBoard();
    boardStatus.textContent = copy.updated(row.querySelector('strong').textContent, copy.stages[row.dataset.status]);
    if (row.hidden || row.dataset.status === 'done') {
      const next = requests.find(item => !item.hidden && item.dataset.status !== 'done');
      const target = next ? next.querySelector('[data-demo-advance]') : filters.find(button => button.dataset.demoFilter === filter);
      target.focus({ preventScroll: true });
    }
  });
  requests.forEach(bindRequest);
  filters.forEach(button => button.addEventListener('click', () => { filter = button.dataset.demoFilter; renderBoard(); }));
  root.querySelector('.demo-board-filters').hidden = false;
  const boardReset = root.querySelector('#demo-board-reset');
  boardReset.disabled = false;
  boardReset.addEventListener('click', () => {
    requests.filter(row => row.dataset.created).forEach(row => row.remove());
    requests = requests.filter(row => !row.dataset.created);
    query = ''; if (search) search.value = ''; if (newRequest) newRequest.value = '';
    requests.forEach(row => { row.dataset.status = row.dataset.initialStatus; });
    filter = 'all'; renderBoard(); boardStatus.textContent = copy.reset;
  });
  if (search) search.addEventListener('input', () => { query = search.value.trim().toLocaleLowerCase(); renderBoard(); });
  if (addForm && newRequest) addForm.addEventListener('submit', event => {
    event.preventDefault();
    const title = newRequest.value.trim().slice(0, 80);
    if (!title) { newRequest.focus(); return; }
    if (requests.length >= 8) { boardStatus.textContent = arabic ? 'يمكن تجربة ثمانية طلبات. أعد النموذج للبدء من جديد.' : 'This demo supports eight requests. Reset to start again.'; return; }
    const row = document.createElement('div'); row.className = 'demo-request';
    row.dataset.demoRequest = ''; row.dataset.status = 'new'; row.dataset.initialStatus = 'new'; row.dataset.created = 'true';
    const index = document.createElement('span'); index.className = 'demo-request-index'; index.setAttribute('aria-hidden', 'true'); index.textContent = String(requests.length + 1).padStart(2, '0');
    const body = document.createElement('div'); body.className = 'demo-request-copy';
    const name = document.createElement('strong'); name.textContent = title;
    const status = document.createElement('span'); status.dataset.demoRequestStatus = '';
    const action = document.createElement('button'); action.type = 'button'; action.dataset.demoAdvance = '';
    body.append(name, status); row.append(index, body, action);
    root.querySelector('.demo-requests').append(row); requests.push(row); bindRequest(row);
    newRequest.value = ''; filter = 'all'; query = ''; if (search) search.value = '';
    renderBoard(); action.focus({ preventScroll: true });
    boardStatus.textContent = arabic ? 'أُضيف الطلب التجريبي.' : 'Demo request added.';
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
