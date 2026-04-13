import { bench, describe } from 'vitest';
import { walkSchema } from '../../src/walker.js';
import { smallSchema, mediumSchema, largeSchema } from './schemas.js';

const schemas = [
  { name: 'small (5 fields)', schema: smallSchema },
  { name: 'medium (18 fields)', schema: mediumSchema },
  { name: 'large (50 fields)', schema: largeSchema }
] as const;

describe('walkSchema', () => {
  for (const { name, schema } of schemas) {
    describe(name, () => {
      bench('no optimization', () => {
        walkSchema(schema as never);
      });

      bench('L1', () => {
        walkSchema(schema as never, { optimization: { level: 1 } });
      });

      bench('L2', () => {
        walkSchema(schema as never, { optimization: { level: 2 } });
      });
    });
  }
});
