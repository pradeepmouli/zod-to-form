import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const fixturesDir = fileURLToPath(
  new URL('registry/components/shadcn/__fixtures__/ui', import.meta.url)
);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^@\/components\/ui\/(.*)$/,
        replacement: `${fixturesDir}/$1`
      }
    ]
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['registry/components/shadcn/__tests__/setup.ts'],
    include: ['registry/**/__tests__/**/*.test.ts', 'registry/**/__tests__/**/*.test.tsx'],
    exclude: ['**/node_modules/**', '**/dist/**']
  }
});
