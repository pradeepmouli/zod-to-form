import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { walkSchema } from '../../src/walker.js';
import type { WalkResult } from '../../src/optimizers/types.js';

function walkL3(schema: z.ZodType): WalkResult {
  return walkSchema(schema, { optimization: { level: 3 } }) as WalkResult;
}

describe('L3 cross-field optimizer', () => {
  it('preserves L1/L2 optimization at level 3', () => {
    const schema = z.object({
      name: z.string().min(1),
      age: z.number().min(0),
      role: z.enum(['admin', 'user'])
    });

    const { fields } = walkL3(schema);
    expect(fields.find((f) => f.key === 'name')?.validation?.mode).toBe('native');
    expect(fields.find((f) => f.key === 'age')?.validation?.mode).toBe('native');
    expect(fields.find((f) => f.key === 'role')?.validation?.mode).toBe('component-enforced');
  });

  it('keeps non-analyzable superRefine in schemaLite at level 3', () => {
    const schema = z
      .object({
        password: z.string().min(8),
        confirm: z.string()
      })
      .superRefine((data, ctx) => {
        if (data.password !== data.confirm) {
          ctx.addIssue({ code: 'custom', message: 'Passwords must match', path: ['confirm'] });
        }
      });

    const { fields, schemaLite } = walkL3(schema);
    // Fields should still be optimized at L2
    expect(fields.find((f) => f.key === 'password')?.validation?.mode).toBe('native');
    expect(fields.find((f) => f.key === 'confirm')?.validation?.mode).toBe('native');
    // SchemaLite should still contain the superRefine since L3 static analysis
    // is conservative (current implementation doesn't extract Zod v4 check functions)
    expect(schemaLite).not.toBeNull();
  });

  it('is a no-op when no cross-field dependencies exist', () => {
    const schema = z.object({ name: z.string() });
    const { fields, schemaLite } = walkL3(schema);
    expect(fields[0]?.validation?.mode).toBe('native');
    expect(schemaLite).toBeNull();
  });

  it('handles level 3 with opaque superRefines staying in schemaLite', () => {
    // Dynamic path — should NOT be converted
    const schema = z
      .object({
        a: z.string(),
        b: z.string()
      })
      .superRefine((data, ctx) => {
        const field = data.a.length > data.b.length ? 'a' : 'b';
        ctx.addIssue({ code: 'custom', message: 'Dynamic error', path: [field] });
      });

    const { schemaLite } = walkL3(schema);
    expect(schemaLite).not.toBeNull();
  });
});
