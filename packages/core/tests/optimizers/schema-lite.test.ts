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
  });
});
