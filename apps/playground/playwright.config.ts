import { defineConfig, devices } from '@playwright/test';

// Avoid well-known dev ports — stale servers on 5173/4173 get reused by
// Playwright's webServer and the tests end up hitting some other project.
const PORT = 5873;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    // Build + preview in one command so `pnpm test:e2e` works from a clean
    // checkout without a separate build step. `vite preview` needs an
    // existing `dist/` or it errors.
    command:
      'pnpm exec vite build && pnpm exec vite preview --host 127.0.0.1 --port ' +
      PORT +
      ' --strictPort',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
