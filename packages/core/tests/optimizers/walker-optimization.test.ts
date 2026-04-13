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

  describe('recursive child collectors for nested containers', () => {
    it('captures superRefine on nested object as fallthrough field', () => {
      const billingRule = (data: any, ctx: any) => {
        if (!data.card && !data.bank) {
          ctx.addIssue({ code: 'custom', message: 'Need card or bank', path: ['card'] });
        }
      };

      const schema = z.object({
        name: z.string(),
        billing: z.object({ card: z.string(), bank: z.string() }).superRefine(billingRule)
      });

      const result = walkSchema(schema, { optimization: { level: 1 } }) as WalkResult;

      // schemaLite should be non-null because billing has effects
      expect(result.schemaLite).not.toBeNull();

      // Reuses 'checks' variant with checkCount: 0 for codegen compatibility
      expect(result.schemaLiteInfo?.type).toBe('checks');

      // billing should be in fallthrough fields
      expect(result.schemaLiteInfo?.fallthroughFields).toContain('billing');

      // The billing superRefine should actually run
      const fail = safeParse(result.schemaLite, {
        name: 'Alice',
        billing: { card: '', bank: '' }
      });
      expect(fail.success).toBe(false);

      const pass = safeParse(result.schemaLite, {
        name: 'Alice',
        billing: { card: '4111', bank: '' }
      });
      expect(pass.success).toBe(true);
    });

    it('nested object without effects does NOT become fallthrough', () => {
      const schema = z.object({
        address: z.object({ street: z.string(), city: z.string() })
      });

      const result = walkSchema(schema, { optimization: { level: 1 } }) as WalkResult;

      // No effects anywhere → null schemaLite
      expect(result.schemaLite).toBeNull();
      expect(result.schemaLiteInfo?.fallthroughFields ?? []).not.toContain('address');
    });

    it('captures refine on nested object', () => {
      const schema = z.object({
        period: z
          .object({ start: z.string(), end: z.string() })
          .refine((d) => d.start < d.end, { message: 'Start must precede end' })
      });

      const result = walkSchema(schema, { optimization: { level: 1 } }) as WalkResult;
      expect(result.schemaLite).not.toBeNull();
      expect(result.schemaLiteInfo?.fallthroughFields).toContain('period');

      const fail = safeParse(result.schemaLite, { period: { start: 'z', end: 'a' } });
      expect(fail.success).toBe(false);

      const pass = safeParse(result.schemaLite, { period: { start: 'a', end: 'z' } });
      expect(pass.success).toBe(true);
    });

    it('combines root superRefine with nested container effects', () => {
      const schema = z
        .object({
          billing: z.object({ card: z.string(), bank: z.string() }).superRefine((data, ctx) => {
            if (!data.card && !data.bank) {
              ctx.addIssue({ code: 'custom', message: 'Need payment', path: ['card'] });
            }
          }),
          shipping: z.string()
        })
        .superRefine((data, ctx) => {
          if (!data.shipping) {
            ctx.addIssue({ code: 'custom', message: 'Shipping required', path: ['shipping'] });
          }
        });

      const result = walkSchema(schema, { optimization: { level: 1 } }) as WalkResult;
      expect(result.schemaLite).not.toBeNull();

      // Both root-level and nested effects should be captured
      expect(result.schemaLiteInfo?.fallthroughFields).toContain('billing');

      // Root superRefine: shipping required
      const failShipping = safeParse(result.schemaLite, {
        billing: { card: '4111', bank: '' },
        shipping: ''
      });
      expect(failShipping.success).toBe(false);

      // Nested superRefine: billing needs card or bank
      const failBilling = safeParse(result.schemaLite, {
        billing: { card: '', bank: '' },
        shipping: 'UPS'
      });
      expect(failBilling.success).toBe(false);

      // Both pass
      const pass = safeParse(result.schemaLite, {
        billing: { card: '4111', bank: '' },
        shipping: 'UPS'
      });
      expect(pass.success).toBe(true);
    });

    it('children of nested container with effects still get optimized', () => {
      const schema = z.object({
        billing: z.object({ card: z.string().min(4), bank: z.string() }).superRefine(() => {})
      });

      const result = walkSchema(schema, { optimization: { level: 1 } }) as WalkResult;
      const billing = result.fields.find((f) => f.key === 'billing')!;

      // Container itself should NOT have zodSchema (L1 exclusion preserved)
      expect(billing.zodSchema).toBeUndefined();

      // But its leaf children should still be individually optimized
      const card = billing.children!.find((f) => f.key === 'billing.card')!;
      expect(card.validation?.mode).toBe('zodSchema');
      expect(card.zodSchema).toBeDefined();
    });

    it('deeply nested container effects are materialized via dot-path', () => {
      const schema = z.object({
        address: z.object({
          billing: z
            .object({ card: z.string(), bank: z.string() })
            .superRefine((data: any, ctx: any) => {
              if (!data.card && !data.bank) {
                ctx.addIssue({ code: 'custom', message: 'Need payment', path: ['card'] });
              }
            })
        })
      });

      const result = walkSchema(schema, { optimization: { level: 1 } }) as WalkResult;

      // Deeply nested container effects should be captured
      expect(result.schemaLite).not.toBeNull();
      expect(result.schemaLiteInfo?.fallthroughFields).toContain('address.billing');

      // The lite schema materializes the dot-path into nested objects,
      // so validation runs against the correct data structure
      const fail = safeParse(result.schemaLite, {
        address: { billing: { card: '', bank: '' } }
      });
      expect(fail.success).toBe(false);

      const pass = safeParse(result.schemaLite, {
        address: { billing: { card: '4111', bank: '' } }
      });
      expect(pass.success).toBe(true);
    });

    it('nested array with superRefine becomes fallthrough', () => {
      const schema = z.object({
        items: z.array(z.string()).superRefine((arr, ctx) => {
          if (new Set(arr).size !== arr.length) {
            ctx.addIssue({ code: 'custom', message: 'Duplicates not allowed' });
          }
        })
      });

      const result = walkSchema(schema, { optimization: { level: 1 } }) as WalkResult;
      expect(result.schemaLite).not.toBeNull();
      expect(result.schemaLiteInfo?.fallthroughFields).toContain('items');

      const fail = safeParse(result.schemaLite, { items: ['a', 'a'] });
      expect(fail.success).toBe(false);

      const pass = safeParse(result.schemaLite, { items: ['a', 'b'] });
      expect(pass.success).toBe(true);
    });

    it('array element with superRefine does NOT become fallthrough (numeric segment skipped)', () => {
      // The array itself has no effects; only its element schema does.
      // The element is processed under key "items.0" (a template path with a
      // numeric segment) — it must NOT be added as a fallthrough field because
      // SchemaLiteCollector would materialise it into
      //   { items: z.object({ "0": schema }).loose() }
      // which is the wrong shape for an array.
      const schema = z.object({
        items: z.array(
          z.object({ a: z.string(), b: z.string() }).superRefine((data, ctx) => {
            if (data.a === data.b) {
              ctx.addIssue({ code: 'custom', message: 'Must differ', path: ['a'] });
            }
          })
        )
      });

      const result = walkSchema(schema, { optimization: { level: 1 } }) as WalkResult;
      // No top-level or array-level effects → schemaLite should be null
      expect(result.schemaLite).toBeNull();
      // The numeric-segment key "items.0" must not appear in fallthroughFields
      const fields = result.schemaLiteInfo?.fallthroughFields ?? [];
      expect(fields.some((f) => f.includes('.0'))).toBe(false);
    });

    it('two sibling nested containers sharing the same topKey are both captured', () => {
      // "address.billing" and "address.shipping" both have effects.
      // They must be merged into a single z.object({ billing, shipping }).loose()
      // under the "address" key — not overwrite each other.
      const billingRule = (data: any, ctx: any) => {
        if (!data.card) {
          ctx.addIssue({ code: 'custom', message: 'card required', path: ['card'] });
        }
      };
      const shippingRule = (data: any, ctx: any) => {
        if (!data.street) {
          ctx.addIssue({ code: 'custom', message: 'street required', path: ['street'] });
        }
      };

      const schema = z.object({
        address: z.object({
          billing: z.object({ card: z.string() }).superRefine(billingRule),
          shipping: z.object({ street: z.string() }).superRefine(shippingRule)
        })
      });

      const result = walkSchema(schema, { optimization: { level: 1 } }) as WalkResult;
      expect(result.schemaLite).not.toBeNull();
      // Both paths should appear
      expect(result.schemaLiteInfo?.fallthroughFields).toContain('address.billing');
      expect(result.schemaLiteInfo?.fallthroughFields).toContain('address.shipping');

      // billing rule fires
      const failBilling = safeParse(result.schemaLite, {
        address: { billing: { card: '' }, shipping: { street: 'Main St' } }
      });
      expect(failBilling.success).toBe(false);

      // shipping rule fires
      const failShipping = safeParse(result.schemaLite, {
        address: { billing: { card: '4111' }, shipping: { street: '' } }
      });
      expect(failShipping.success).toBe(false);

      // Both pass
      const pass = safeParse(result.schemaLite, {
        address: { billing: { card: '4111' }, shipping: { street: 'Main St' } }
      });
      expect(pass.success).toBe(true);
    });

    it('pipe-wrapped nested container becomes fallthrough', () => {
      // z.object({...}).transform(...) wraps the object in a pipe; the zodType
      // seen by processField is "pipe", not "object". The walker must still
      // collect it as a fallthrough field.
      const schema = z.object({
        payment: z.object({ amount: z.number() }).transform((data) => ({
          ...data,
          amountCents: Math.round(data.amount * 100)
        }))
      });

      const result = walkSchema(schema, { optimization: { level: 1 } }) as WalkResult;
      expect(result.schemaLite).not.toBeNull();
      expect(result.schemaLiteInfo?.fallthroughFields).toContain('payment');

      // The transform should run during lite-schema validation
      const parsed = safeParse(result.schemaLite, { payment: { amount: 1.5 } });
      expect(parsed.success).toBe(true);
      expect((parsed.data as any)?.payment?.amountCents).toBe(150);
    });

    describe('inside-out collection: schemaLite excludes inlined fields', () => {
      it('schemaLite does NOT re-validate child field constraints', () => {
        // billing.card has min(4) — the child collector only captures the
        // superRefine, not per-field constraints (L1/L2 handles those).
        const schema = z.object({
          billing: z
            .object({ card: z.string().min(4), bank: z.string().min(2) })
            .superRefine((data, ctx) => {
              if (!data.card && !data.bank) {
                ctx.addIssue({ code: 'custom', message: 'Need payment', path: ['card'] });
              }
            })
        });

        const result = walkSchema(schema, { optimization: { level: 1 } }) as WalkResult;
        expect(result.schemaLite).not.toBeNull();

        // The superRefine fires when both empty
        const fail = safeParse(result.schemaLite, {
          billing: { card: '', bank: '' }
        });
        expect(fail.success).toBe(false);

        // With card='ab' (too short for min(4)), the superRefine passes because
        // card is truthy. Pruned schemaLite must NOT reject this — only L1/L2 does.
        const passLite = safeParse(result.schemaLite, {
          billing: { card: 'ab', bank: '' }
        });
        expect(passLite.success).toBe(true);
      });

      it('schemaLite accepts wrong types for child fields', () => {
        // The child collector only has the refine effect — child types are
        // validated per-field by L1/L2, not in the schemaLite.
        const schema = z.object({
          period: z
            .object({ start: z.string(), end: z.string() })
            .refine((d) => d.start < d.end, { message: 'Start must precede end' })
        });

        const result = walkSchema(schema, { optimization: { level: 1 } }) as WalkResult;
        expect(result.schemaLite).not.toBeNull();

        // Valid strings that violate the refine
        const failRefine = safeParse(result.schemaLite, { period: { start: 'z', end: 'a' } });
        expect(failRefine.success).toBe(false);

        // Numbers passed where strings expected — pruned schema accepts this
        const acceptsWrongTypes = safeParse(result.schemaLite, { period: { start: 1, end: 2 } });
        expect(acceptsWrongTypes.success).toBe(true);
      });

      it('array container only runs effects, not element validation', () => {
        const schema = z.object({
          items: z.array(z.string().email()).superRefine((arr, ctx) => {
            if (new Set(arr).size !== arr.length) {
              ctx.addIssue({ code: 'custom', message: 'Duplicates not allowed' });
            }
          })
        });

        const result = walkSchema(schema, { optimization: { level: 1 } }) as WalkResult;
        expect(result.schemaLite).not.toBeNull();

        // Duplicate check fires
        const failDupe = safeParse(result.schemaLite, { items: ['a@b.com', 'a@b.com'] });
        expect(failDupe.success).toBe(false);

        // Non-email strings pass schemaLite (pruned — no element validation)
        const passNotEmail = safeParse(result.schemaLite, { items: ['not-email', 'also-not'] });
        expect(passNotEmail.success).toBe(true);
      });

      it('pipe container preserves transform without child validation', () => {
        const schema = z.object({
          payment: z.object({ amount: z.number().min(1).max(10000) }).transform((data) => ({
            ...data,
            amountCents: Math.round(data.amount * 100)
          }))
        });

        const result = walkSchema(schema, { optimization: { level: 1 } }) as WalkResult;
        expect(result.schemaLite).not.toBeNull();

        // Transform runs correctly
        const parsed = safeParse(result.schemaLite, { payment: { amount: 1.5 } });
        expect(parsed.success).toBe(true);
        expect((parsed.data as any)?.payment?.amountCents).toBe(150);

        // Amount out of range (min 1, max 10000) passes schemaLite —
        // child constraints are pruned.
        const passOutOfRange = safeParse(result.schemaLite, { payment: { amount: 99999 } });
        expect(passOutOfRange.success).toBe(true);
        expect((passOutOfRange.data as any)?.payment?.amountCents).toBe(9999900);
      });

      it('pipe container preserves inner superRefine + transform', () => {
        // z.object({...}).superRefine(fn).transform(fn2) creates a pipe where
        // the inner object has the superRefine and the pipe has the transform.
        const schema = z.object({
          data: z
            .object({ a: z.string().min(5), b: z.string().min(5) })
            .superRefine((data, ctx) => {
              if (data.a === data.b) {
                ctx.addIssue({ code: 'custom', message: 'Must differ', path: ['b'] });
              }
            })
            .transform((d) => ({ ...d, validated: true }))
        });

        const result = walkSchema(schema, { optimization: { level: 1 } }) as WalkResult;
        expect(result.schemaLite).not.toBeNull();

        // SuperRefine fires: a === b
        const fail = safeParse(result.schemaLite, { data: { a: 'same', b: 'same' } });
        expect(fail.success).toBe(false);

        // SuperRefine passes, transform runs
        const pass = safeParse(result.schemaLite, { data: { a: 'hello', b: 'world' } });
        expect(pass.success).toBe(true);
        expect((pass.data as any)?.data?.validated).toBe(true);

        // Short strings (violate min(5)) pass schemaLite — child constraints pruned
        const passShort = safeParse(result.schemaLite, { data: { a: 'hi', b: 'yo' } });
        expect(passShort.success).toBe(true);
        expect((passShort.data as any)?.data?.validated).toBe(true);
      });

      it('multi-level effects: parent and child container both have superRefine', () => {
        // address has a superRefine, and address.billing also has a superRefine.
        // Both must be preserved in schemaLite without the parent overwriting the child.
        const schema = z.object({
          address: z
            .object({
              billing: z.object({ card: z.string(), bank: z.string() }).superRefine((data, ctx) => {
                if (!data.card && !data.bank) {
                  ctx.addIssue({ code: 'custom', message: 'Need payment', path: ['card'] });
                }
              }),
              country: z.string()
            })
            .superRefine((data, ctx) => {
              if (data.country === 'US' && !data.billing.card) {
                ctx.addIssue({
                  code: 'custom',
                  message: 'US requires card',
                  path: ['billing', 'card']
                });
              }
            })
        });

        const result = walkSchema(schema, { optimization: { level: 1 } }) as WalkResult;
        expect(result.schemaLite).not.toBeNull();

        // Inner superRefine: billing needs card or bank
        const failInner = safeParse(result.schemaLite, {
          address: { billing: { card: '', bank: '' }, country: 'UK' }
        });
        expect(failInner.success).toBe(false);

        // Outer superRefine: US requires card
        const failOuter = safeParse(result.schemaLite, {
          address: { billing: { card: '', bank: 'Chase' }, country: 'US' }
        });
        expect(failOuter.success).toBe(false);

        // Both pass
        const pass = safeParse(result.schemaLite, {
          address: { billing: { card: '4111', bank: '' }, country: 'US' }
        });
        expect(pass.success).toBe(true);
      });

      it('child collector builds z.object({}).loose() — rejects non-object data', () => {
        // The collector builds z.object({}).loose().check(...), preserving
        // the object structure. Non-object values should fail.
        const schema = z.object({
          billing: z.object({ card: z.string(), bank: z.string() }).superRefine((_data, _ctx) => {})
        });

        const result = walkSchema(schema, { optimization: { level: 1 } }) as WalkResult;
        expect(result.schemaLite).not.toBeNull();

        // Object data passes (inlined fields omitted, .loose() passes them through)
        const passObj = safeParse(result.schemaLite, { billing: { card: 123, bank: null } });
        expect(passObj.success).toBe(true);

        // Non-object data for billing fails — object structure is preserved
        const failNonObj = safeParse(result.schemaLite, { billing: 'not-an-object' });
        expect(failNonObj.success).toBe(false);
      });
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
