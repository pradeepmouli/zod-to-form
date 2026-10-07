import { describe } from 'vitest';
import { bench } from './register-benchmark.js';
import { walkSchema } from '../../src/walker.js';
import { smallSchema, mediumSchema, largeSchema } from './schemas.js';

const schemas = [
  { name: 'small (5 fields)', schema: smallSchema },
  { name: 'medium (18 fields)', schema: mediumSchema },
  { name: 'large (50 fields)', schema: largeSchema }
] as const;

for (const { name, schema } of schemas) {
  describe(`walker / ${name}`, () => {
    for (const level of [undefined, 1, 2] as const) {
      bench(level === undefined ? 'no optimization' : `L${level}`, () => {
        walkSchema(schema as never, level === undefined ? {} : { optimization: { level } });
      });
    }
  });
}
