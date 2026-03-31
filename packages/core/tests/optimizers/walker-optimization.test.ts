import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { walkSchema } from '../../src/walker.js';
import type { WalkResult } from '../../src/optimizers/types.js';
import type { FormOptimizer } from '../../src/optimizers/types.js';

function safeParse(schema: any, data: unknown) {
  return (schema as z.ZodType).safeParse(data);
}

describe('walkSchema with optimization', () => {
  it('returns FormField[] when no validation option is set', () => {
    const schema = z.object({ name: z.string() });
    const result = walkSchema(schema);
    expect(Array.isArray(result)).toBe(true);
  });

  it('returns WalkResult when validation.level is set', () => {
    const schema = z.object({ name: z.string() });
    const result = walkSchema(schema, { optimization: { level: 1 } }) as WalkResult;
    expect(result).toHaveProperty('fields');
    expect(result).toHaveProperty('schemaLite');
    expect(Array.isArray(result.fields)).toBe(true);
  });

  it('optimizer chain runs after processors', () => {
    const calls: string[] = [];

    const testOptimizer: FormOptimizer = (_schema, _ctx, field) => {
      calls.push(`optimize:${field.key}`);
      field.validation = { mode: 'zodSchema' };
    };

    const schema = z.object({
      name: z.string(),
      age: z.number()
    });

    const result = walkSchema(schema, {
      optimization: {
        level: 1,
        optimizers: {
          string: [testOptimizer],
          number: [testOptimizer]
        }
      }
    }) as WalkResult;

    expect(calls).toContain('optimize:name');
    expect(calls).toContain('optimize:age');
    // Fields should have validation set by the optimizer
    expect(result.fields.find((f) => f.key === 'name')?.validation?.mode).toBe('zodSchema');
    expect(result.fields.find((f) => f.key === 'age')?.validation?.mode).toBe('zodSchema');
  });

  it('custom optimizers override builtins for a type', () => {
    const customOptimizer: FormOptimizer = (_schema, _ctx, field) => {
      field.validation = { mode: 'component-enforced' };
    };

    const schema = z.object({ name: z.string() });
    const result = walkSchema(schema, {
      optimization: {
        level: 1,
        optimizers: { string: [customOptimizer] }
      }
    }) as WalkResult;

    expect(result.fields[0]?.validation?.mode).toBe('component-enforced');
  });

  it('schemaLite is null when no top-level refines exist and all fields inline', () => {
    const schema = z.object({ name: z.string() });
    const result = walkSchema(schema, { optimization: { level: 1 } }) as WalkResult;
    expect(result.schemaLite).toBeNull();
  });

  it('schemaLite captures top-level superRefine', () => {
    const schema = z
      .object({
        password: z.string(),
        confirm: z.string()
      })
      .superRefine((data, ctx) => {
        if (data.password !== data.confirm) {
          ctx.addIssue({ code: 'custom', message: 'Passwords must match', path: ['confirm'] });
        }
      });

    const result = walkSchema(schema, { optimization: { level: 1 } }) as WalkResult;
    expect(result.schemaLite).not.toBeNull();

    // schemaLite should validate the superRefine
    const fail = safeParse(result.schemaLite, { password: 'abc', confirm: 'xyz' });
    expect(fail.success).toBe(false);

    const pass = safeParse(result.schemaLite, { password: 'abc', confirm: 'abc' });
    expect(pass.success).toBe(true);
  });

  it('preserves field order with optimization enabled', () => {
    const schema = z.object({
      beta: z.string(),
      alpha: z.string()
    });

    const result = walkSchema(schema, { optimization: { level: 1 } }) as WalkResult;
    expect(result.fields.map((f) => f.key)).toEqual(['beta', 'alpha']);
  });

  it('schemaLite captures top-level transform as lite schema', () => {
    const schema = z.object({ name: z.string() }).transform((data) => ({ ...data, added: true }));

    const result = walkSchema(schema, { optimization: { level: 1 } }) as WalkResult;
    expect(result.fields).toHaveLength(1);
    expect(result.schemaLite).not.toBeNull();

    // Lite schema runs the transform
    const parsed = safeParse(result.schemaLite, { name: 'hello' });
    expect(parsed.success).toBe(true);
    expect(parsed.data).toHaveProperty('added', true);
  });

  it('schemaLite captures superRefine before transform', () => {
    const schema = z
      .object({ a: z.string(), b: z.string() })
      .superRefine((data, ctx) => {
        if (data.a === data.b) {
          ctx.addIssue({ code: 'custom', message: 'Must differ', path: ['b'] });
        }
      })
      .transform((d) => d);

    const result = walkSchema(schema, { optimization: { level: 1 } }) as WalkResult;
    expect(result.schemaLite).not.toBeNull();
    // The superRefine check from before the transform should be preserved
    const fail = safeParse(result.schemaLite, { a: 'same', b: 'same' });
    expect(fail.success).toBe(false);
    const pass = safeParse(result.schemaLite, { a: 'hello', b: 'world' });
    expect(pass.success).toBe(true);
  });

  it('schemaLite captures superRefine on transformed schema', () => {
    const schema = z
      .object({ a: z.string(), b: z.string() })
      .transform((d) => d)
      .superRefine((data, ctx) => {
        if (data.a === data.b) {
          ctx.addIssue({ code: 'custom', message: 'Must differ', path: ['b'] });
        }
      });

    const result = walkSchema(schema, { optimization: { level: 1 } }) as WalkResult;
    expect(result.schemaLite).not.toBeNull();
    const fail = safeParse(result.schemaLite, { a: 'same', b: 'same' });
    expect(fail.success).toBe(false);
  });

  describe('container types are not optimized', () => {
    it('L1: nested object fields do not get zodSchema', () => {
      const schema = z.object({
        name: z.string(),
        address: z.object({ street: z.string(), city: z.string() })
      });
      const result = walkSchema(schema, { optimization: { level: 1 } }) as WalkResult;
      const address = result.fields.find((f) => f.key === 'address')!;
      // Container should NOT get zodSchema — it renders children
      expect(address.validation).toBeUndefined();
      expect(address.zodSchema).toBeUndefined();
      // But its leaf children should
      expect(address.children).toBeDefined();
      expect(address.children![0]!.validation?.mode).toBe('zodSchema');
    });

    it('L1: array fields do not get zodSchema', () => {
      const schema = z.object({
        tags: z.array(z.string())
      });
      const result = walkSchema(schema, { optimization: { level: 1 } }) as WalkResult;
      const tags = result.fields.find((f) => f.key === 'tags')!;
      expect(tags.validation).toBeUndefined();
      expect(tags.zodSchema).toBeUndefined();
    });
  });

  describe('L2 integration via walker', () => {
    it('simple string field → native mode', () => {
      const schema = z.object({ name: z.string().min(1) });
      const result = walkSchema(schema, { optimization: { level: 2 } }) as WalkResult;
      expect(result.fields[0]!.validation?.mode).toBe('native');
      expect(result.fields[0]!.zodSchema).toBeUndefined();
    });

    it('enum field → component-enforced mode', () => {
      const schema = z.object({ role: z.enum(['admin', 'user']) });
      const result = walkSchema(schema, { optimization: { level: 2 } }) as WalkResult;
      expect(result.fields[0]!.validation?.mode).toBe('component-enforced');
    });

    it('field with refine → zodSchema mode', () => {
      const schema = z.object({
        code: z.string().refine((v) => v.startsWith('X'))
      });
      const result = walkSchema(schema, { optimization: { level: 2 } }) as WalkResult;
      expect(result.fields[0]!.validation?.mode).toBe('zodSchema');
      expect(result.fields[0]!.zodSchema).toBeDefined();
    });
  });

  describe('schemaLiteInfo metadata', () => {
    it('returns null schemaLiteInfo when no top-level effects', () => {
      const schema = z.object({ name: z.string() });
      const result = walkSchema(schema, { optimization: { level: 1 } }) as WalkResult;
      expect(result.schemaLiteInfo).toBeNull();
    });

    it('returns checks info for superRefine', () => {
      const schema = z.object({ a: z.string() }).superRefine((_data, _ctx) => {});
      const result = walkSchema(schema, { optimization: { level: 1 } }) as WalkResult;
      expect(result.schemaLiteInfo).not.toBeNull();
      expect(result.schemaLiteInfo!.type).toBe('checks');
      expect(result.schemaLiteInfo!.fallthroughFields).toBeDefined();
    });

    it('returns transform info for .transform()', () => {
      const schema = z.object({ a: z.string() }).transform((d) => d);
      const result = walkSchema(schema, { optimization: { level: 1 } }) as WalkResult;
      expect(result.schemaLiteInfo).not.toBeNull();
      expect(result.schemaLiteInfo!.type).toBe('transform');
      expect(result.schemaLiteInfo!.fallthroughFields).toBeDefined();
    });

    it('original variant has fallthroughFields', () => {
      // A pipe with a non-transform output triggers the 'original' variant
      const schema = z.object({ a: z.string() }).pipe(z.object({ a: z.string() }));
      const result = walkSchema(schema, { optimization: { level: 1 } }) as WalkResult;
      if (result.schemaLiteInfo?.type === 'original') {
        expect(result.schemaLiteInfo.fallthroughFields).toBeDefined();
        expect(Array.isArray(result.schemaLiteInfo.fallthroughFields)).toBe(true);
      }
    });
  });

  it('schemaLite captures ALL checks from chained superRefines', () => {
    const schema = z
      .object({ a: z.string(), b: z.string() })
      .superRefine((data, ctx) => {
        if (!data.a) ctx.addIssue({ code: 'custom', message: 'a required', path: ['a'] });
      })
      .superRefine((data, ctx) => {
        if (data.a === data.b)
          ctx.addIssue({ code: 'custom', message: 'must differ', path: ['b'] });
      });

    const result = walkSchema(schema, { optimization: { level: 1 } }) as WalkResult;
    expect(result.schemaLite).not.toBeNull();

    // First superRefine: a is required
    const failA = safeParse(result.schemaLite, { a: '', b: 'world' });
    expect(failA.success).toBe(false);

    // Second superRefine: a !== b
    const failB = safeParse(result.schemaLite, { a: 'same', b: 'same' });
    expect(failB.success).toBe(false);

    // Both pass
    const pass = safeParse(result.schemaLite, { a: 'hello', b: 'world' });
    expect(pass.success).toBe(true);
  });
});
