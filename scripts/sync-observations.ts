// Records when each service and plan first entered this catalog.
// The dates come from this repository's own git history: they say when we
// started publishing an entry, not when a vendor changed anything.
// Run manually: npm run history:sync
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

type Catalog = {
  services: { id: string; name: string }[];
  plans: { id: string; serviceId: string; name: string; verifiedAt: string }[];
};

const file = 'src/data/catalog.json';
const revisions = execFileSync('git', ['log', '--reverse', '--format=%H%x09%cI', '--', file], {
  encoding: 'utf8',
})
  .trim()
  .split('\n')
  .filter(Boolean)
  .map((line) => {
    const [hash, committedAt] = line.split('\t');
    return { hash, committedAt };
  });

if (revisions.length === 0) throw new Error('catalog.json の履歴がありません');

const read = (hash: string): Catalog =>
  JSON.parse(
    execFileSync('git', ['show', `${hash}:${file}`], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    }),
  );

const services = new Map<string, { firstSeenAt: string; verifiedAt: string }>();
const plans = new Map<string, { firstSeenAt: string; verifiedAt: string; serviceId: string }>();

for (const revision of revisions) {
  const data = read(revision.hash);
  for (const service of data.services) {
    const previous = services.get(service.id);
    const verifiedAt =
      (service as { verifiedAt?: string }).verifiedAt ?? revision.committedAt.slice(0, 10);
    if (!previous)
      services.set(service.id, { firstSeenAt: revision.committedAt.slice(0, 10), verifiedAt });
  }
  for (const plan of data.plans) {
    if (plans.has(plan.id)) continue;
    plans.set(plan.id, {
      firstSeenAt: revision.committedAt.slice(0, 10),
      verifiedAt: plan.verifiedAt,
      serviceId: plan.serviceId,
    });
  }
}

const payload = {
  note: 'このサイトへの掲載開始日です。事業者が料金や利用枠を変更した日ではありません。',
  generatedFrom: file,
  entries: [
    ...[...services].map(([id, entry]) => ({ id, kind: 'service' as const, ...entry })),
    ...[...plans].map(([id, entry]) => ({ id, kind: 'plan' as const, ...entry })),
  ].sort((a, b) => a.firstSeenAt.localeCompare(b.firstSeenAt) || a.id.localeCompare(b.id)),
};

writeFileSync(
  new URL('../src/data/observations.json', import.meta.url),
  JSON.stringify(payload, null, 2) + '\n',
);
console.log(`掲載開始日の記録を作成しました: サービス${services.size}件 / プラン${plans.size}件`);
