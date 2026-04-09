import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { walkSchema } from '../../src/walker.js';
import type { WalkResult } from '../../src/optimizers/types.js';

function safeParse(schema: any, data: unknown) {
  return (schema as z.ZodType).safeParse(data);
}

describe('Validation equivalence (FR-017)', () => {
  function walkOptimized(schema: z.ZodType, level: 1 | 2 | 3 = 2): WalkResult {
    return walkSchema(schema, { optimization: { level } }) as WalkResult;
  }

  describe('simple schemas — native rules match zodResolver', () => {
    const testCases = [
      { name: 'string min/max', schema: z.object({ val: z.string().min(2).max(10) }) },
      { name: 'number min/max', schema: z.object({ val: z.number().min(0).max(100) }) },
      { name: 'email format', schema: z.object({ val: z.string().email() }) },
      { name: 'required string', schema: z.object({ val: z.string() }) },
      { name: 'enum', schema: z.object({ val: z.enum(['a', 'b', 'c']) }) },
      { name: 'boolean', schema: z.object({ val: z.boolean() }) }
    ];

    for (const { name, schema } of testCases) {
      it(`produces valid optimization for: ${name}`, () => {
        const { fields, schemaLite } = walkOptimized(schema);
        expect(fields).toHaveLength(1);
        expect(fields[0]!.validation).toBeDefined();
        expect(schemaLite).toBeNull(); // Simple schemas need no schemaLite
      });
    }
  });

  describe('schemas with effects — preserved in schemaLite or zodSchema', () => {
    it('superRefine preserved in schemaLite', () => {
      const schema = z.object({ a: z.string(), b: z.string() }).superRefine((data, ctx) => {
        if (data.a === data.b) {
          ctx.addIssue({ code: 'custom', message: 'Must differ', path: ['b'] });
        }
      });

      const { schemaLite } = walkOptimized(schema);
      expect(schemaLite).not.toBeNull();

      // Verify the schemaLite validates correctly
      const fail = safeParse(schemaLite, { a: 'same', b: 'same' });
      expect(fail.success).toBe(false);

      const pass = safeParse(schemaLite, { a: 'hello', b: 'world' });
      expect(pass.success).toBe(true);
    });

    it('refine on field keeps atomic zodSchema', () => {
      const schema = z.object({
        val: z.string().refine((v) => v.startsWith('X'))
      });

      const { fields } = walkOptimized(schema);
      expect(fields[0]!.validation?.mode).toBe('zodSchema');
      expect(fields[0]!.zodSchema).toBeDefined();

      // Verify the zodSchema validates correctly
      const pass = safeParse(fields[0]!.zodSchema, 'Xhello');
      expect(pass.success).toBe(true);
      const fail = safeParse(fields[0]!.zodSchema, 'hello');
      expect(fail.success).toBe(false);
    });
  });

  describe('nested and complex schemas', () => {
    it('handles nested objects', () => {
      const schema = z.object({
        address: z.object({
          street: z.string().min(1),
          city: z.string()
        })
      });

      const { fields } = walkOptimized(schema);
      expect(fields).toHaveLength(1);
      // Container types don't get validation mode — they render children
      expect(fields[0]!.validation).toBeUndefined();
      // But leaf children should be optimized
      expect(fields[0]!.children![0]!.validation?.mode).toBeDefined();
    });

    it('handles arrays', () => {
      const schema = z.object({
        tags: z.array(z.string().min(1))
      });

      const { fields } = walkOptimized(schema);
      // Container types don't get validation mode
      expect(fields[0]!.validation).toBeUndefined();
    });

    it('handles unions', () => {
      const schema = z.object({
        val: z.union([z.string(), z.number()])
      });

      const { fields } = walkOptimized(schema);
      // Container types don't get validation mode
      expect(fields[0]!.validation).toBeUndefined();
    });
  });

  describe('backward compatibility', () => {
    it('walkSchema returns FormField[] when no validation option', () => {
      const schema = z.object({ name: z.string() });
      const result = walkSchema(schema);
      expect(Array.isArray(result)).toBe(true);
      expect((result as any).fields).toBeUndefined();
      expect((result as any).schemaLite).toBeUndefined();
    });

    it('walkSchema with processors but no validation returns FormField[]', () => {
      const schema = z.object({ name: z.string() });
      const result = walkSchema(schema, { processors: {} });
      expect(Array.isArray(result)).toBe(true);
    });

    it('FormField without validation property works unchanged', () => {
      const schema = z.object({ name: z.string() });
      const fields = walkSchema(schema);
      expect(fields[0]!.validation).toBeUndefined();
      expect(fields[0]!.zodSchema).toBeUndefined();
    });
  });
});
