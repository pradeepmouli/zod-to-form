import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { walkSchema } from '../../src/walker.js';
import type { WalkResult, FormOptimizer } from '../../src/optimizers/types.js';

describe('Custom optimizer registration (US4)', () => {
  it('custom optimizer overrides builtin for a type', () => {
    const customOptimizer: FormOptimizer = (_schema, _ctx, field) => {
      field.validation = { mode: 'component-enforced' };
      field.zodSchema = undefined;
    };

    const schema = z.object({ name: z.string().min(2) });
    const result = walkSchema(schema, {
      validation: {
        level: 2,
        optimizers: { string: [customOptimizer] } as any
      }
    }) as WalkResult;

    // Custom optimizer replaces entire chain for 'string' type
    expect(result.fields[0]?.validation?.mode).toBe('component-enforced');
    expect(result.fields[0]?.zodSchema).toBeUndefined();
  });

  it('custom optimizer sets component-enforced for a component', () => {
    const dateRangeOptimizer: FormOptimizer = (_schema, _ctx, field) => {
      if (field.component === 'DatePicker') {
        field.validation = { mode: 'component-enforced' };
        field.zodSchema = undefined;
      }
    };

    const schema = z.object({ dob: z.date() });
    const result = walkSchema(schema, {
      validation: {
        level: 2,
        optimizers: { date: [dateRangeOptimizer] } as any
      }
    }) as WalkResult;

    expect(result.fields[0]?.validation?.mode).toBe('component-enforced');
  });

  it('unregistered types use default chain', () => {
    const customOptimizer: FormOptimizer = (_schema, _ctx, field) => {
      field.validation = { mode: 'component-enforced' };
    };

    const schema = z.object({
      name: z.string(),
      age: z.number().min(0)
    });

    const result = walkSchema(schema, {
      validation: {
        level: 2,
        // Only override string, number uses default chain
        optimizers: { string: [customOptimizer] } as any
      }
    }) as WalkResult;

    // string: custom optimizer
    expect(result.fields.find((f) => f.key === 'name')?.validation?.mode).toBe(
      'component-enforced'
    );
    // number: default L1+L2 chain
    expect(result.fields.find((f) => f.key === 'age')?.validation?.mode).toBe('native');
  });
});
