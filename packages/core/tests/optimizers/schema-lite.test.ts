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

  it('tracks top-level entries after addTopLevel', () => {
    const collector = createSchemaLiteCollector();
    const fn = () => {};
    collector.addTopLevel({ type: 'superRefine', fn });
    expect(collector.isEmpty()).toBe(false);
    expect(collector.topLevel).toHaveLength(1);
    expect(collector.topLevel[0]).toEqual({ type: 'superRefine', fn });
  });

  it('tracks fallthrough fields after addField', () => {
    const collector = createSchemaLiteCollector();
    const schema = z.string().min(2);
    collector.addField('name', schema as any);
    expect(collector.isEmpty()).toBe(false);
    expect(collector.fields.get('name')).toBe(schema);
  });

  it('removeTopLevel removes a specific entry', () => {
    const collector = createSchemaLiteCollector();
    const fn1 = () => {};
    const fn2 = () => {};
    const entry1 = { type: 'superRefine' as const, fn: fn1 };
    const entry2 = { type: 'refine' as const, fn: fn2 };
    collector.addTopLevel(entry1);
    collector.addTopLevel(entry2);
    expect(collector.topLevel).toHaveLength(2);

    collector.removeTopLevel(entry1);
    expect(collector.topLevel).toHaveLength(1);
    expect(collector.topLevel[0]).toBe(entry2);
  });

  it('becomes empty after all entries are removed', () => {
    const collector = createSchemaLiteCollector();
    const entry = { type: 'superRefine' as const, fn: () => {} };
    collector.addTopLevel(entry);
    expect(collector.isEmpty()).toBe(false);

    collector.removeTopLevel(entry);
    expect(collector.isEmpty()).toBe(true);
    expect(collector.build()).toBeNull();
  });

  describe('setOriginalSchema', () => {
    it('returns originalSchema from build() when set with no other entries', () => {
      const collector = createSchemaLiteCollector();
      const schema = z.object({ a: z.string(), b: z.string() }).superRefine((data, ctx) => {
        if (data.a === data.b) {
          ctx.addIssue({ code: 'custom', message: 'Must differ', path: ['b'] });
        }
      });
      collector.setOriginalSchema(schema as any);

      expect(collector.isEmpty()).toBe(false);

      const result = collector.build();
      expect(result).toBe(schema); // Exact same reference

      const fail = safeParse(result, { a: 'same', b: 'same' });
      expect(fail.success).toBe(false);
      const pass = safeParse(result, { a: 'hello', b: 'world' });
      expect(pass.success).toBe(true);
    });

    it('returns originalSchema even when fieldMap has entries', () => {
      const collector = createSchemaLiteCollector();
      const schema = z.object({ a: z.string(), b: z.string() }).superRefine((data, ctx) => {
        if (data.a === data.b) {
          ctx.addIssue({ code: 'custom', message: 'Must differ', path: ['b'] });
        }
      });
      collector.setOriginalSchema(schema as any);
      collector.addField('extra', z.string().min(2) as any);

      const result = collector.build();
      expect(result).not.toBeNull();
      const fail = safeParse(result, { a: 'same', b: 'same' });
      expect(fail.success).toBe(false);
    });

    it('build returns null when only addField is used without setOriginalSchema', () => {
      // Fields without top-level effects are handled by per-field validators,
      // not schemaLite. The collector returns null in this case.
      const collector = createSchemaLiteCollector();
      collector.addField('name', z.string().min(2) as any);
      expect(collector.isEmpty()).toBe(false); // has entries
      expect(collector.build()).toBeNull(); // but no original schema → null
    });
  });
});
