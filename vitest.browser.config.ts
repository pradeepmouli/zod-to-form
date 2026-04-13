import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    benchmark: {
      include: ['packages/**/tests/performance/*.browser.bench.{ts,tsx}'],
      exclude: ['**/node_modules/**'],
      outputJson: 'bench-browser-results.json'
    },
    browser: {
      enabled: true,
      provider: 'playwright',
      instances: [{ browser: 'chromium' }]
    }
  }
});
