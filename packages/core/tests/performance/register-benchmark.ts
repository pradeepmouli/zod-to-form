import { test } from 'vitest';

/** Keep the shared matrix independent of Vitest's test-context registration API. */
export function bench(
  name: string,
  run: () => unknown,
  options: {
    time?: number;
    iterations?: number;
    warmupTime?: number;
    warmupIterations?: number;
  } = {}
): void {
  test(
    name,
    async ({ bench: measure }) => {
      await measure(name, run).run({ time: 200, ...options });
    },
    30_000
  );
}
