import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['registry/**/__tests__/**/*.test.ts']
  }
});
