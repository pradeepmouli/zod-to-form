import { bench, describe } from 'vitest';
import { walkSchema } from '@zod-to-form/core';
import type { WalkResult } from '@zod-to-form/core';
import { generateFormComponent } from '../../src/index.js';
import { smallSchema, mediumSchema, largeSchema } from '../../../core/tests/performance/schemas.js';

const baseConfig = {
  exportName: 'BenchSchema',
  componentName: 'BenchForm',
  mode: 'submit' as const,
  ui: 'html' as const
};

const schemas = [
  { name: 'small (5 fields)', schema: smallSchema },
  { name: 'medium (18 fields)', schema: mediumSchema },
  { name: 'large (50 fields)', schema: largeSchema }
] as const;

describe('codegen pipeline (walk + generate)', () => {
  for (const { name, schema } of schemas) {
    describe(name, () => {
      bench('no optimization', () => {
        const fields = walkSchema(schema as never);
        generateFormComponent(fields, baseConfig);
      });

      bench('L1', () => {
        const result = walkSchema(schema as never, {
          optimization: { level: 1 }
        }) as WalkResult;
        generateFormComponent(result.fields, {
          ...baseConfig,
          validationLevel: 1,
          schemaLite: result.schemaLite,
          schemaLiteInfo: result.schemaLiteInfo
        });
      });

      bench('L2', () => {
        const result = walkSchema(schema as never, {
          optimization: { level: 2 }
        }) as WalkResult;
        generateFormComponent(result.fields, {
          ...baseConfig,
          validationLevel: 2,
          schemaLite: result.schemaLite,
          schemaLiteInfo: result.schemaLiteInfo
        });
      });
    });
  }
});
