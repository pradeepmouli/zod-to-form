import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createSchemaLiteCollector } from '../../src/optimizers/schema-lite.js';

function safeParse(schema: any, data: unknown) {
  return (schema as z.ZodType).safeParse(data);
}

describe('SchemaLiteCollector', () => {
  it('isEmpty returns true when nothing has been collected', () => {
    const collector = createSchemaLiteCollector();
    expect(collector.isEmpty()).toBe(true);
  });

  it('build returns null when empty', () => {
    const collector = createSchemaLiteCollector();
    expect(collector.build()).toBeNull();
  });

  it('tracks checks after addCheck', () => {
    const collector = createSchemaLiteCollector();
    const check = {};
    collector.addCheck(check);
    expect(collector.isEmpty()).toBe(false);
    expect(collector.checks).toHaveLength(1);
    expect(collector.checks[0]).toBe(check);
  });

  it('tracks fallthrough fields after addField', () => {
    const collector = createSchemaLiteCollector();
    const schema = z.string().min(2);
    collector.addField('name', schema as any);
    expect(collector.isEmpty()).toBe(false);
    expect(collector.fields.get('name')).toBe(schema);
  });

  describe('build with real Zod checks', () => {
    it('builds lite schema from superRefine check', () => {
      // Create a schema with superRefine and extract its check
      const base = z.object({ a: z.string(), b: z.string() });
      const withSR = base.superRefine((data, ctx) => {
        if (data.a === data.b) {
          ctx.addIssue({ code: 'custom', message: 'Must differ', path: ['b'] });
        }
      });
      const check = (withSR._zod.def as any).checks[0];

      const collector = createSchemaLiteCollector();
      collector.addCheck(check);

      const result = collector.build();
      expect(result).not.toBeNull();

      // Lite schema validates the superRefine effect
      expect(safeParse(result, { a: 'same', b: 'same' }).success).toBe(false);
      expect(safeParse(result, { a: 'hello', b: 'world' }).success).toBe(true);

      // Lite schema does NOT validate field types (loose object)
      expect(safeParse(result, { a: 123, b: 456 }).success).toBe(true);
    });

    it('builds lite schema from multiple checks', () => {
      const base = z.object({ a: z.string(), b: z.string() });
      const withTwo = base
        .superRefine((data, ctx) => {
          if (data.a === data.b) ctx.addIssue({ code: 'custom', message: 'fn1', path: ['b'] });
        })
        .superRefine((data, ctx) => {
          if (data.a.length < 2) ctx.addIssue({ code: 'custom', message: 'fn2', path: ['a'] });
        });
      const checks = (withTwo._zod.def as any).checks;

      const collector = createSchemaLiteCollector();
      for (const check of checks) {
        collector.addCheck(check);
      }

      const result = collector.build();
      expect(result).not.toBeNull();

      // Both checks validate
      expect(safeParse(result, { a: 'x', b: 'x' }).success).toBe(false); // fn1 + fn2
      expect(safeParse(result, { a: 'x', b: 'y' }).success).toBe(false); // fn2 only
      expect(safeParse(result, { a: 'hello', b: 'world' }).success).toBe(true);
    });

    it('builds lite schema with fallthrough fields', () => {
      const collector = createSchemaLiteCollector();
      collector.addField('name', z.string().min(2) as any);

      const result = collector.build();
      expect(result).not.toBeNull();

      // Validates the collected field
      expect(safeParse(result, { name: 'ab', extra: true }).success).toBe(true);
      expect(safeParse(result, { name: 'a' }).success).toBe(false);
    });

    it('materializes dot-paths into nested object wrappers', () => {
      // Simulates a nested container: address.billing has a superRefine
      const billingSchema = z
        .object({ card: z.string(), bank: z.string() })
        .superRefine((data, ctx) => {
          if (!data.card && !data.bank) {
            ctx.addIssue({ code: 'custom', message: 'Need payment', path: ['card'] });
          }
        });

      const collector = createSchemaLiteCollector();
      collector.addField('address.billing', billingSchema as any);

      const result = collector.build();
      expect(result).not.toBeNull();

      // Dot-path materialized: { address: z.object({ billing: schema }).loose() }
      // so data is validated with correct nested structure
      const fail = safeParse(result, {
        address: { billing: { card: '', bank: '' } }
      });
      expect(fail.success).toBe(false);

      const pass = safeParse(result, {
        address: { billing: { card: '4111', bank: '' } }
      });
      expect(pass.success).toBe(true);
    });

    it('merges sibling dot-paths sharing the same topKey', () => {
      // Both "address.billing" and "address.shipping" must be merged into a
      // single shape entry rather than the second overwriting the first.
      const billingSchema = z.object({ card: z.string() }).superRefine((data, ctx) => {
        if (!data.card) ctx.addIssue({ code: 'custom', message: 'card required', path: ['card'] });
      });
      const shippingSchema = z.object({ street: z.string() }).superRefine((data, ctx) => {
        if (!data.street)
          ctx.addIssue({ code: 'custom', message: 'street required', path: ['street'] });
      });

      const collector = createSchemaLiteCollector();
      collector.addField('address.billing', billingSchema as any);
      collector.addField('address.shipping', shippingSchema as any);

      const result = collector.build();
      expect(result).not.toBeNull();

      // Billing rule fires
      const failBilling = safeParse(result, {
        address: { billing: { card: '' }, shipping: { street: 'Main St' } }
      });
      expect(failBilling.success).toBe(false);

      // Shipping rule fires
      const failShipping = safeParse(result, {
        address: { billing: { card: '4111' }, shipping: { street: '' } }
      });
      expect(failShipping.success).toBe(false);

      // Both pass
      const pass = safeParse(result, {
        address: { billing: { card: '4111' }, shipping: { street: 'Main St' } }
      });
      expect(pass.success).toBe(true);
    });

    it('top-level key (no dot) is not wrapped', () => {
      const billingSchema = z.object({ card: z.string() }).superRefine((data, ctx) => {
        if (!data.card) {
          ctx.addIssue({ code: 'custom', message: 'Need card', path: ['card'] });
        }
      });

      const collector = createSchemaLiteCollector();
      collector.addField('billing', billingSchema as any);

      const result = collector.build();
      expect(result).not.toBeNull();

      const fail = safeParse(result, { billing: { card: '' } });
      expect(fail.success).toBe(false);

      const pass = safeParse(result, { billing: { card: '4111' } });
      expect(pass.success).toBe(true);
    });
  });

  describe('addTransform', () => {
    it('replays transform function onto lite schema', () => {
      const collector = createSchemaLiteCollector();
      const transformFn = (data: any) => ({ ...data, added: true });
      collector.addTransform(transformFn);

      const result = collector.build();
      expect(result).not.toBeNull();

      const parsed = safeParse(result, { foo: 'bar' });
      expect(parsed.success).toBe(true);
      expect(parsed.data).toHaveProperty('added', true);
    });

    it('combines checks and transforms in order', () => {
      const collector = createSchemaLiteCollector();

      // Add a superRefine check
      const base = z.object({});
      const withSR = base.superRefine((data, ctx) => {
        if (!('a' in data)) {
          ctx.addIssue({ code: 'custom', message: 'needs a', path: ['a'] });
        }
      });
      const check = (withSR._zod.def as any).checks[0];
      collector.addCheck(check);

      // Add a transform
      collector.addTransform((data: any) => ({ ...data, transformed: true }));

      const result = collector.build();
      expect(result).not.toBeNull();

      // Check fires first, then transform
      const valid = safeParse(result, { a: 'hello' });
      expect(valid.success).toBe(true);
      expect(valid.data).toHaveProperty('transformed', true);
    });
  });

  describe('setOriginalSchema', () => {
    it('returns original schema when set (non-decomposable pipe)', () => {
      const collector = createSchemaLiteCollector();
      const schema = z.object({ a: z.string() }).pipe(z.object({ a: z.string() }));
      collector.setOriginalSchema(schema as any);

      expect(collector.isEmpty()).toBe(false);
      const result = collector.build();
      expect(result).toBe(schema);
    });

    it('takes precedence over checks and fields', () => {
      const collector = createSchemaLiteCollector();
      const schema = z.object({ a: z.string() }).pipe(z.object({ a: z.string() }));
      collector.setOriginalSchema(schema as any);
      collector.addCheck({});
      collector.addField('x', z.string() as any);

      // Original schema wins
      const result = collector.build();
      expect(result).toBe(schema);
    });
  });
});
