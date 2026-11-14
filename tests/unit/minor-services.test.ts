import { describe, expect, it } from 'vitest';
import { catalog } from '../../src/lib/catalog';
import { searchCatalog, defaults } from '../../src/lib/search';

describe('追加したサービス', () => {
  it.each(['logfare', 'command-code', 'cline-pass', 'kilo-code'])(
    '%sに公式出典とプランがある',
    (id) => {
      const service = catalog.services.find((s) => s.id === id)!;
      expect(service.sources.length).toBeGreaterThan(0);
      expect(catalog.plans.some((p) => p.serviceId === id)).toBe(true);
      expect(searchCatalog(catalog, { ...defaults, q: service.name }).map((s) => s.id)).toContain(
        id,
      );
    },
  );
  it('Logfareの無料枠に同意と通常・新規枠が記載される', () => {
    const standard = catalog.plans.find((p) => p.id === 'logfare-standard')!;
    expect(standard.limits[0].amount).toBe(40);
    expect(standard.limits[0].notes).toContain('最初の24時間');
    expect(standard.notes).toContain('記録');
    expect(catalog.plans.find((p) => p.id === 'logfare-premium')!.notes).toContain('学習');
    expect(catalog.plans.find((p) => p.id === 'logfare-pro')!.notes).toContain('販売');
    expect(standard.modelAccess.find((m) => m.modelId === 'glm-5-3-flash')!.availability).toBe(
      'unavailable',
    );
  });
  it('クライアントと別契約のClinePassを分ける', () => {
    expect(catalog.services.find((s) => s.id === 'cline')!.relatedServiceIds).toContain(
      'cline-pass',
    );
    expect(catalog.services.find((s) => s.id === 'cline-pass')!.serviceType).toBe('model_provider');
  });
  it('Logfareの時間・日・同時実行の枠を分けて記録', () => {
    const plan = catalog.plans.find((p) => p.id === 'logfare-standard')!;
    const byWindow = Object.fromEntries(plan.limits.map((l) => [l.window, l]));
    expect(byWindow['分'].amount).toBe(40);
    expect(byWindow['時間'].amount).toBe(1000);
    expect(byWindow['日'].amount).toBe(5000);
    expect(byWindow['同時'].amount).toBe(6);
    const premium = catalog.plans.find((p) => p.id === 'logfare-premium')!;
    expect(premium.limits.find((l) => l.window === '時間')!.amount).toBe(2000);
    expect(premium.limits.find((l) => l.window === '同時')!.amount).toBe(12);
    const pro = catalog.plans.find((p) => p.id === 'logfare-pro')!;
    expect(pro.limits.find((l) => l.window === '日')!.amount).toBe(20000);
    expect(pro.limits.find((l) => l.window === '同時')!.amount).toBe(24);
  });
  it('Command Codeのモデル別枠は共有プールと加算できないことを明記', () => {
    const go = catalog.plans.find((p) => p.id === 'command-code-go')!;
    const pool = go.limits.find((l) => l.scope === 'plan')!;
    expect(pool.amount).toBe(10);
    expect(pool.notes).toContain('加算できません');
    expect(
      go.modelAccess.every(
        (m) => m.notes.includes('別枠ではありません') || m.notes.includes('換算です'),
      ),
    ).toBe(true);
    const goat = catalog.plans.find((p) => p.id === 'command-code-goat')!;
    expect(goat.notes).toContain('全額をすべてのモデルで利用できるという意味ではありません');
    const pro = catalog.plans.find((p) => p.id === 'command-code-pro')!;
    expect(pro.modelAccess.find((m) => m.modelId === 'claude-opus')!.availability).toBe(
      'unavailable',
    );
    expect(pro.limits.find((l) => l.metric === '合計利用枠')!.amount).toBe(110);
    expect(pro.limits.find((l) => l.targetId === 'minimax-m3')!.notes).toContain('50%割引');
    expect(catalog.plans.find((p) => p.id === 'command-code-max-10')!.limits[0].amount).toBe(150);
    expect(catalog.plans.find((p) => p.id === 'command-code-max-20')!.limits[1].amount).toBe(200);
  });
});
