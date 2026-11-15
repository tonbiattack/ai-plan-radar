// Reports whether benchmark data changed in a way that needs review.
// `retrievedAt` only records when we looked, so a weekly re-run with identical
// results does not open a pull request. Exits 0 either way; the result is
// written to $GITHUB_OUTPUT as `changed=true|false` when running in Actions.
// Usage: npx tsx scripts/bench-changed.ts src/data/aider-polyglot.json ...
import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { benchmarkDataChanged } from '../src/lib/benchmark-diff';

const files = process.argv.slice(2);
if (files.length === 0) throw new Error('比較するファイルを指定してください');

const changed = files.filter((file) => {
  let previous: string;
  try {
    previous = execFileSync('git', ['show', `HEAD:${file}`], { encoding: 'utf8' });
  } catch {
    return true;
  }
  return benchmarkDataChanged(previous, readFileSync(file, 'utf8'));
});

console.log(changed.length ? `変更あり: ${changed.join(', ')}` : '取得日以外の変更はありません');
if (process.env.GITHUB_OUTPUT)
  appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed.length > 0}\n`);
