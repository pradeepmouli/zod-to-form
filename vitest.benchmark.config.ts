import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    benchmark: {
      include: ['packages/**/tests/performance/*.bench.ts'],
      exclude: ['**/node_modules/**', '**/*.browser.bench.*'],
      outputJson: 'bench-results.json'
    }
  }
});
