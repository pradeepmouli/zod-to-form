import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    entries: ['packages/react/tests/performance/*.browser.bench.tsx']
  },
  test: {
    reporters: ['default', 'json'],
    outputFile: 'bench-browser-results.json',
    benchmark: {
      include: ['packages/**/tests/performance/*.browser.bench.{ts,tsx}'],
      exclude: ['**/node_modules/**']
    },
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }]
    }
  }
});
