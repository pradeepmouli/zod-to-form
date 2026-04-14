import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Allow a passing run before the first test file lands (during initial
    // scaffolding in Phase 2). Once the test suite is populated this flag is
    // harmless because vitest ignores it when test files exist.
    passWithNoTests: true,
    // Integration tests use the programmatic Vite API and can take longer
    // than plain unit tests; give them extra headroom.
    testTimeout: 30_000,
    hookTimeout: 30_000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/virtual-types.d.ts']
    }
  }
});
