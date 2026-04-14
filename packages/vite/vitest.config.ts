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
    // Several integration tests write uniquely-named files into the
    // shared in-monorepo fixture directories (query-minimal,
    // rewrite-project, etc.) and rely on `afterEach` cleanup. Running
    // those test files in parallel would race on directory enumeration
    // even though the per-file UUIDs prevent name collisions. Sequential
    // file execution is a tiny throughput cost that eliminates an entire
    // class of flakes — the unit tests are still parallel within each
    // file via vitest's default in-file concurrency.
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/virtual-types.d.ts']
    }
  }
});
