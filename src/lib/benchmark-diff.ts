// Decides whether refreshed benchmark data differs in content.
// `retrievedAt` only records when the source was last read, so a re-run that
// returns identical results must not be treated as a change.
const ignoredKeys = new Set(['retrievedAt']);

function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !ignoredKeys.has(key))
        .map(([key, entry]) => [key, normalize(entry)]),
    );
  return value;
}

export function benchmarkDataChanged(previous: string, next: string): boolean {
  return (
    JSON.stringify(normalize(JSON.parse(previous))) !== JSON.stringify(normalize(JSON.parse(next)))
  );
}
