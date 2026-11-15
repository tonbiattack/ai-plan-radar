import js from '@eslint/js';
import ts from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import { defineConfig } from 'eslint/config';

export default defineConfig(
  {
    ignores: ['dist/**', '.astro/**', 'node_modules/**', 'playwright-report/**', 'test-results/**'],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...astro.configs.recommended,
  { files: ['**/*.astro'], rules: { 'astro/no-set-html-directive': 'error' } },
  {
    // JSON-LD and inline JSON payloads are serialised from our own typed data
    // with `<` escaped, so they cannot close the element or inject markup.
    files: ['src/components/JsonLd.astro', 'src/components/JsonPayload.astro'],
    rules: { 'astro/no-set-html-directive': 'off' },
  },
);
