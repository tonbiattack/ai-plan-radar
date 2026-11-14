import { catalog } from '../lib/catalog';
import { defaults, readFilters, searchCatalog, writeFilters, type Filters } from '../lib/search';
import { isStale } from '../lib/format';

const form = document.querySelector<HTMLFormElement>('#filters')!;
const list = document.querySelector<HTMLElement>('#service-list')!;
const cards = new Map(
  Array.from(list.querySelectorAll<HTMLElement>('[data-service]')).map((card) => [
    card.dataset.service!,
    card,
  ]),
);
const count = document.querySelector('#result-count')!;
const empty = document.querySelector<HTMLElement>('#empty-state')!;

function readForm(): Filters {
  return readFilters(
    new URLSearchParams(
      Array.from(new FormData(form).entries()).map(([key, value]) => [key, String(value)]),
    ),
  );
}
function render(filters: Filters) {
  const result = searchCatalog(catalog, filters);
  for (const card of cards.values()) card.hidden = true;
  for (const service of result) {
    const card = cards.get(service.id)!;
    card.hidden = false;
    list.append(card);
  }
  count.textContent = `${result.length}件のサービス`;
  empty.hidden = result.length > 0;
}
function restore() {
  const filters = readFilters(new URLSearchParams(location.search));
  for (const key of Object.keys(defaults) as (keyof Filters)[]) {
    const field = form.elements.namedItem(key) as HTMLInputElement | HTMLSelectElement;
    if (field instanceof HTMLInputElement && field.type === 'checkbox')
      field.checked = Boolean(filters[key]);
    else field.value = filters[key];
  }
  // Invalid/removed option values are dropped, so UI and results always agree.
  render(readForm());
}
function update() {
  const filters = readForm();
  const url = new URL(location.href);
  url.search = writeFilters(filters).toString();
  if (url.href !== location.href) history.pushState(null, '', url);
  render(filters);
}
form.addEventListener('submit', (event) => {
  event.preventDefault();
  update();
});
form.addEventListener('input', (event) => {
  if ((event.target as HTMLInputElement).name === 'q') update();
});
form.addEventListener('change', (event) => {
  // Search already updates on input. Reparenting result cards on its blur
  // would detach a clicked link between pointerdown and click.
  if ((event.target as HTMLInputElement).name !== 'q') update();
});
form.addEventListener('reset', () => {
  queueMicrotask(update);
});
document.querySelector('#clear-empty')!.addEventListener('click', () => form.reset());
window.addEventListener('popstate', restore);
for (const element of document.querySelectorAll<HTMLElement>('[data-verified]'))
  element.hidden = !isStale(element.dataset.verified!);
restore();
