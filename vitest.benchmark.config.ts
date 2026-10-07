import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    reporters: ['default', 'json'],
    outputFile: 'bench-results.json',
    benchmark: {
      include: ['packages/**/tests/performance/*.bench.ts'],
      exclude: ['**/node_modules/**', '**/*.browser.bench.*']
    }
  }
});
