import { addDays, localDay, summarize } from './model.mjs';

const key = 'saldo.subscriptions.v1';
const get = id => document.getElementById(id);
const form = get('form');
const editor = get('editor');
const money = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' });
const dateFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const categories = ['Развлечения', 'Работа', 'Связь', 'Другое'];
const formatMoney = cents => money.format(cents / 100);
let editing = null;

function load() {
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) return JSON.parse(raw);
  } catch {
    get('status').textContent = 'Не удалось прочитать сохранённые подписки.';
  }
  return [
    { id: 'music', name: 'Музыка', category: 'Развлечения', cents: 29900, cycle: 'month', date: addDays(localDay(), 2) },
    { id: 'cloud', name: 'Облачное хранилище', category: 'Работа', cents: 19900, cycle: 'month', date: addDays(localDay(), 4) },
    { id: 'domain', name: 'Домен портфолио', category: 'Другое', cents: 149000, cycle: 'year', date: addDays(localDay(), 19) },
  ];
}

let subscriptions = load();

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function render() {
  const { monthly, yearly, upcoming, rows } = summarize(subscriptions, localDay());
  get('monthly').textContent = formatMoney(monthly);
  get('yearly').textContent = formatMoney(yearly);
  get('upcoming').textContent = formatMoney(upcoming);
  get('count').textContent = String(rows.length);
  const term = get('search').value.trim().toLocaleLowerCase('ru');
  const filtered = rows.filter(entry => entry.name.toLocaleLowerCase('ru').includes(term));

  get('rows').replaceChildren(...filtered.map(entry => {
    const row = element('tr');
    const service = element('td');
    const marker = element('span', [...entry.name][0].toLocaleUpperCase('ru'), 'marker');
    marker.dataset.category = categories.indexOf(entry.category);
    marker.setAttribute('aria-hidden', 'true');
    const identity = element('span', '', 'identity');
    identity.append(element('strong', entry.name), element('small', entry.category));
    service.append(marker, identity);
    const price = element('td', formatMoney(entry.cents));
    price.append(element('small', entry.cycle === 'month' ? 'В месяц' : 'В год'));
    const charge = element('td', dateFormat.format(new Date(entry.next)));
    const actions = element('td');
    const edit = element('button', 'Изменить');
    edit.setAttribute('aria-label', 'Изменить подписку «' + entry.name + '»');
    edit.addEventListener('click', () => openEditor(entry));
    actions.append(edit);
    row.append(service, price, charge, actions);
    return row;
  }));
  get('empty').hidden = filtered.length > 0;
  get('empty').textContent = rows.length ? 'По запросу ничего не найдено.' : 'Список пока пуст. Добавьте первую подписку.';
}

function openEditor(entry) {
  editing = entry?.id ?? null;
  form.reset();
  form.elements.name.value = entry?.name ?? '';
  form.elements.category.value = entry?.category ?? 'Другое';
  form.elements.price.value = entry ? entry.cents / 100 : '';
  form.elements.cycle.value = entry?.cycle ?? 'month';
  form.elements.date.value = entry?.date ?? localDay();
  get('form-title').textContent = entry ? 'Изменить подписку' : 'Новая подписка';
  get('remove').hidden = !entry;
  get('form-error').hidden = true;
  editor.showModal();
}

function save(next, message) {
  try {
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    get('form-error').textContent = 'Браузер не сохранил данные. Проверьте настройки хранилища.';
    get('form-error').hidden = false;
    return;
  }
  subscriptions = next;
  editor.close();
  render();
  get('status').textContent = message;
  get('add').focus();
}

get('add').addEventListener('click', () => openEditor());
get('cancel').addEventListener('click', () => editor.close());
get('search').addEventListener('input', render);
get('remove').addEventListener('click', () => {
  if (window.confirm('Удалить эту подписку?')) {
    save(subscriptions.filter(entry => entry.id !== editing), 'Подписка удалена.');
  }
});
form.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(form);
  const name = data.get('name').trim();
  if (!name) {
    get('form-error').textContent = 'Введите название подписки.';
    get('form-error').hidden = false;
    return;
  }
  const entry = {
    id: editing ?? `sub-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name, category: data.get('category'), cents: Math.round(Number(data.get('price')) * 100),
    cycle: data.get('cycle'), date: data.get('date'),
  };
  const next = editing ? subscriptions.map(item => item.id === editing ? entry : item) : [...subscriptions, entry];
  save(next, 'Подписка сохранена.');
});
window.addEventListener('focus', render);
render();
