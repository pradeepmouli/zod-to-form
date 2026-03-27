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

  it('build constructs a Zod object schema when fields are collected', () => {
    const collector = createSchemaLiteCollector();
    const nameSchema = z.string().min(2);
    collector.addField('name', nameSchema as any);

    const result = collector.build();
    expect(result).not.toBeNull();

    // The built schema should be a loose object that accepts extra keys
    const parseResult = safeParse(result, { name: 'ab', extraField: 123 });
    expect(parseResult.success).toBe(true);

    const failResult = safeParse(result, { name: 'a', extraField: 123 });
    expect(failResult.success).toBe(false);
  });

  it('build constructs schema with top-level superRefine', () => {
    const collector = createSchemaLiteCollector();
    const refineFn = (data: any, ctx: any) => {
      if (data.password !== data.confirm) {
        ctx.addIssue({ code: 'custom', message: 'Passwords must match', path: ['confirm'] });
      }
    };
    collector.addTopLevel({ type: 'superRefine', fn: refineFn });

    const result = collector.build();
    expect(result).not.toBeNull();

    // Should fail when passwords don't match
    const failResult = safeParse(result, { password: 'abc', confirm: 'xyz' });
    expect(failResult.success).toBe(false);

    // Should pass when passwords match
    const passResult = safeParse(result, { password: 'abc', confirm: 'abc' });
    expect(passResult.success).toBe(true);
  });

  it('build combines fields and top-level entries', () => {
    const collector = createSchemaLiteCollector();
    const nameSchema = z.string().min(2);
    collector.addField('name', nameSchema as any);

    const refineFn = (data: any, ctx: any) => {
      if (data.name === 'banned') {
        ctx.addIssue({ code: 'custom', message: 'Name is banned', path: ['name'] });
      }
    };
    collector.addTopLevel({ type: 'superRefine', fn: refineFn });

    const result = collector.build();
    expect(result).not.toBeNull();

    // Should fail min length
    const tooShort = safeParse(result, { name: 'a' });
    expect(tooShort.success).toBe(false);

    // Should fail banned name
    const banned = safeParse(result, { name: 'banned' });
    expect(banned.success).toBe(false);

    // Should pass valid name
    const valid = safeParse(result, { name: 'hello' });
    expect(valid.success).toBe(true);
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

  it('prunes empty subtrees — only fields with schemas are included', () => {
    const collector = createSchemaLiteCollector();
    const emailSchema = z.string().email();
    collector.addField('email', emailSchema as any);

    const result = collector.build();
    expect(result).not.toBeNull();

    // Valid email passes
    const valid = safeParse(result, { email: 'test@example.com', other: 'ignored' });
    expect(valid.success).toBe(true);

    // Invalid email fails
    const invalid = safeParse(result, { email: 'not-an-email', other: 'ignored' });
    expect(invalid.success).toBe(false);
  });

  describe('nested schemaLite integration (T045 / FR-016)', () => {
    it('preserves container structure with .loose() for branches with un-inlined validation', () => {
      const collector = createSchemaLiteCollector();
      // A field with a refine that can't be inlined
      const nameSchema = z.string().min(2);
      collector.addField('name', nameSchema as any);

      const result = collector.build();
      expect(result).not.toBeNull();

      // Should validate the collected field
      const valid = safeParse(result, { name: 'hello', age: 42, extra: true });
      expect(valid.success).toBe(true);

      // Should reject invalid value for the collected field
      const invalid = safeParse(result, { name: 'a', age: 42 });
      expect(invalid.success).toBe(false);

      // Extra fields should pass through (loose object)
      const withExtras = safeParse(result, { name: 'ok', unknownField: 'anything' });
      expect(withExtras.success).toBe(true);
    });

    it('prunes empty subtrees — empty collector builds null', () => {
      const collector = createSchemaLiteCollector();
      expect(collector.build()).toBeNull();
    });

    it('handles multiple fallthrough fields', () => {
      const collector = createSchemaLiteCollector();
      const nameSchema = z.string().min(2);
      const ageSchema = z.number().min(0);
      collector.addField('name', nameSchema as any);
      collector.addField('age', ageSchema as any);

      const result = collector.build();
      expect(result).not.toBeNull();

      // Both fields validated
      const valid = safeParse(result, { name: 'hello', age: 5 });
      expect(valid.success).toBe(true);

      // Name too short
      const badName = safeParse(result, { name: 'a', age: 5 });
      expect(badName.success).toBe(false);

      // Age negative
      const badAge = safeParse(result, { name: 'hello', age: -1 });
      expect(badAge.success).toBe(false);
    });
  });
});
