import { describe, expect, it } from 'vitest';
import { catalog } from '../../src/lib/catalog';
import { formatLimit } from '../../src/lib/format';

describe('モデル別の利用条件', () => {
  it.each([
    ['opencode-console-go', 'glm-5-3-flash', 60],
    ['opencode-console-go', 'gpt-6-luna', 15],
    ['opencode-console-go-plus', 'glm-5-3-flash', 180],
    ['opencode-console-go-plus', 'gpt-6-luna', 60],
    ['opencode-console-go-teams', 'glm-5-3-flash', 65],
    ['opencode-console-go-teams', 'gpt-6-luna', 20],
  ])('%s %s の公式枠と出典を登録', (planId, modelId, expected) => {
    const plan = catalog.plans.find((p) => p.id === planId)!;
    const limit = plan.limits.find((l) => l.scope === 'model' && l.targetId === modelId)!;
    expect(limit.amount).toBe(expected);
    expect(limit.sourceUrl).toBe('https://opencode.ai/docs/console/go');
    expect(formatLimit(limit, 'ja')).toContain('USD相当');
    expect(limit.notes).toContain('目安');
    expect(
      plan.modelAccess.some(
        (access) => access.modelId === modelId && access.availability === 'available',
      ),
    ).toBe(true);
  });
  it('Copilotの月次リセットと繰越なしは公式根拠付き', () => {
    const plan = catalog.plans.find((p) => p.id === 'github-copilot-pro')!;
    const limit = plan.limits.find((l) => l.metric === 'AIクレジット')!;
    expect(limit.resetPolicy).toContain('毎月1日');
    expect(limit.rolloverPolicy).toContain('繰り越されません');
    expect(plan.sources.some((s) => s.url === limit.sourceUrl)).toBe(true);
  });
});
