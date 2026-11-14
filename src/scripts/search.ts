import { catalog } from '../lib/catalog';
import { catalogFacts } from '../lib/views';
import { defaults, readFilters, searchCatalog, writeFilters, type Filters } from '../lib/search';

const form = document.querySelector<HTMLFormElement>('#filters')!;
const quickSearch = document.querySelector<HTMLInputElement>('#quick-search')!;
const serviceBody = document.querySelector<HTMLElement>('#service-table-body')!;
const planBody = document.querySelector<HTMLElement>('#plan-table-body')!;
const serviceRows = Array.from(serviceBody.querySelectorAll<HTMLTableRowElement>('tr'));
const planRows = Array.from(planBody.querySelectorAll<HTMLTableRowElement>('tr'));
const cardRows = Array.from(
  document.querySelectorAll<HTMLElement>('#service-list article[data-service]'),
);
const count = document.querySelector('#result-count')!;
const empty = document.querySelector<HTMLElement>('#empty-state')!;
const views = Array.from(document.querySelectorAll<HTMLButtonElement>('.view-switch [data-view]'));
const panels = new Map(
  ['table', 'plans', 'cards'].map((view) => [
    view,
    document.querySelector<HTMLElement>(`#view-${view}`)!,
  ]),
);
const facts = new Map(catalogFacts(catalog).map((service) => [service.id, service]));
const summary = document.querySelector('#filter-summary');
// The view is not a filter field, so it is tracked separately and restored from the URL.
let currentView: string = defaults.view;

const KEY_LABELS: Record<keyof Filters, string> = {
  q: 'キーワード',
  category: 'カテゴリ',
  billing: '課金方式',
  free: '無料',
  model: 'モデル',
  type: '種類',
  disclosure: '利用枠',
  currency: '通貨',
  max: '月額上限',
  sort: '並べ替え',
  view: '表示',
};

function readForm(): Filters {
  const filters = readFilters(
    new URLSearchParams(
      Array.from(new FormData(form).entries()).map(([key, value]) => [key, String(value)]),
    ),
  );
  return { ...filters, q: quickSearch.value, view: currentView };
}

const visibleServices = (filters: Filters) =>
  new Set(searchCatalog(catalog, filters).map((service) => service.id));
const normalize = (value: string) => value.normalize('NFKC').toLocaleLowerCase('ja-JP').trim();

function planVisible(filters: Filters, serviceId: string, planId: string): boolean {
  const service = facts.get(serviceId)!;
  const plan = service.plans.find((item) => item.id === planId)!;
  const query = normalize(filters.q);
  if (filters.billing && plan.billing !== filters.billing) return false;
  if (filters.free && !plan.free) return false;
  if (filters.model && !plan.modelIds.includes(filters.model)) return false;
  if (filters.disclosure === 'known' && plan.disclosure !== 'known') return false;
  if (filters.disclosure === 'unknown' && plan.disclosure !== 'unknown') return false;
  if (filters.max.trim() !== '') {
    const max = Number(filters.max);
    if (!Number.isFinite(max)) return false;
    const price = plan.prices[filters.currency === 'JPY' ? 'JPY' : 'USD'];
    if (price === null || price > max) return false;
  }
  return (
    !query ||
    normalize(service.name).includes(query) ||
    normalize(`${plan.name} ${plan.modelsLabel}`).includes(query)
  );
}

function setView(view: string) {
  currentView = view;
  for (const [name, panel] of panels) panel.hidden = name !== view;
  for (const button of views)
    button.setAttribute('aria-pressed', String(button.dataset.view === view));
}

function render(filters: Filters) {
  const visible = visibleServices(filters);
  let serviceCount = 0;
  for (const row of serviceRows) {
    const show = visible.has(row.dataset.service!);
    row.hidden = !show;
    if (show) serviceCount++;
  }
  let planCount = 0;
  for (const row of planRows) {
    const show =
      visible.has(row.dataset.service!) &&
      planVisible(filters, row.dataset.service!, row.dataset.plan!);
    row.hidden = !show;
    if (show) planCount++;
  }
  for (const card of cardRows) card.hidden = !visible.has(card.dataset.service!);
  count.textContent =
    filters.view === 'plans' ? `${planCount}件のプラン` : `${serviceCount}件のサービス`;
  empty.hidden = (filters.view === 'plans' ? planCount : serviceCount) > 0;
  setView(filters.view);
  if (summary) {
    const active = (Object.keys(defaults) as (keyof Filters)[])
      .filter((key) => key !== 'view' && filters[key] !== defaults[key])
      .map((key) => KEY_LABELS[key]);
    summary.textContent = active.length ? `適用中: ${active.join(' / ')}` : 'すべてのサービス';
  }
}

function syncUrl(filters: Filters) {
  const url = new URL(location.href);
  url.search = writeFilters(filters).toString();
  if (url.href !== location.href) history.pushState(null, '', url);
}

function restore() {
  const filters = readFilters(new URLSearchParams(location.search));
  currentView = filters.view;
  quickSearch.value = filters.q;
  for (const key of Object.keys(defaults) as (keyof Filters)[]) {
    if (key === 'view' || key === 'q') continue;
    const field = form.elements.namedItem(key) as HTMLInputElement | HTMLSelectElement | null;
    if (field instanceof HTMLInputElement && field.type === 'checkbox')
      field.checked = Boolean(filters[key]);
    else if (field) field.value = filters[key];
  }
  render(readForm());
}

function update() {
  const filters = readForm();
  syncUrl(filters);
  render(filters);
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  update();
});
quickSearch.addEventListener('input', update);
// The quick field already updates on input; its change event would re-render while
// a result link is being clicked, detaching the link before the click lands.
quickSearch.addEventListener('change', (event) => event.stopPropagation());
form.addEventListener('change', update);
form.addEventListener('reset', () => {
  quickSearch.value = '';
  queueMicrotask(update);
});
for (const button of views) {
  button.addEventListener('click', () => {
    const filters = { ...readForm(), view: button.dataset.view! };
    syncUrl(filters);
    render(filters);
  });
}
document.querySelector('#clear-empty')!.addEventListener('click', () => form.reset());
window.addEventListener('popstate', restore);
restore();
