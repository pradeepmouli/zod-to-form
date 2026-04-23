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
    // Use `vite preview` against a prebuilt bundle for a deterministic, fast-startup
    // server. Build runs on-demand — CI will pre-build before `test:e2e`.
    command: 'pnpm exec vite preview --host 127.0.0.1 --port ' + PORT + ' --strictPort',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000
  }
});
