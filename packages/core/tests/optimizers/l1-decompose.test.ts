import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { walkSchema } from '../../src/walker.js';
import type { WalkResult } from '../../src/optimizers/types.js';

function safeParse(schema: any, data: unknown) {
  return (schema as z.ZodType).safeParse(data);
}

function walkOptimized(schema: z.ZodType, level: 1 | 2 | 3 = 1): WalkResult {
  return walkSchema(schema, { optimization: { level } }) as WalkResult;
}

describe('L1 decompose optimizer', () => {
  describe('per-field zodSchema extraction', () => {
    it('sets zodSchema and validation.mode for string fields', () => {
      const schema = z.object({ name: z.string().min(2) });
      const { fields } = walkOptimized(schema);
      const field = fields[0]!;
      expect(field.validation?.mode).toBe('zodSchema');
      expect(field.zodSchema).toBeDefined();
      // The zodSchema should validate correctly
      const pass = safeParse(field.zodSchema, 'ab');
      expect(pass.success).toBe(true);
      const fail = safeParse(field.zodSchema, 'a');
      expect(fail.success).toBe(false);
    });

    it('sets zodSchema for number fields', () => {
      const schema = z.object({ age: z.number().min(0).max(120) });
      const { fields } = walkOptimized(schema);
      const field = fields[0]!;
      expect(field.validation?.mode).toBe('zodSchema');
      expect(safeParse(field.zodSchema, 50).success).toBe(true);
      expect(safeParse(field.zodSchema, -1).success).toBe(false);
    });

    it('sets zodSchema for boolean fields', () => {
      const schema = z.object({ active: z.boolean() });
      const { fields } = walkOptimized(schema);
      expect(fields[0]!.validation?.mode).toBe('zodSchema');
      expect(safeParse(fields[0]!.zodSchema, true).success).toBe(true);
    });

    it('sets zodSchema for enum fields', () => {
      const schema = z.object({ color: z.enum(['red', 'blue']) });
      const { fields } = walkOptimized(schema);
      expect(fields[0]!.validation?.mode).toBe('zodSchema');
      expect(safeParse(fields[0]!.zodSchema, 'red').success).toBe(true);
      expect(safeParse(fields[0]!.zodSchema, 'green').success).toBe(false);
    });

    it('sets zodSchema for date fields', () => {
      const schema = z.object({ dob: z.date() });
      const { fields } = walkOptimized(schema);
      expect(fields[0]!.validation?.mode).toBe('zodSchema');
    });

    it('sets zodSchema for literal fields', () => {
      const schema = z.object({ type: z.literal('admin') });
      const { fields } = walkOptimized(schema);
      expect(fields[0]!.validation?.mode).toBe('zodSchema');
    });

    it('sets zodSchema for array fields', () => {
      const schema = z.object({ tags: z.array(z.string()) });
      const { fields } = walkOptimized(schema);
      expect(fields[0]!.validation?.mode).toBe('zodSchema');
    });
  });

  describe('wrapper types delegate to inner', () => {
    it('handles optional fields', () => {
      const schema = z.object({ name: z.string().optional() });
      const { fields } = walkOptimized(schema);
      expect(fields[0]!.validation?.mode).toBe('zodSchema');
      expect(fields[0]!.zodSchema).toBeDefined();
    });

    it('handles nullable fields', () => {
      const schema = z.object({ name: z.string().nullable() });
      const { fields } = walkOptimized(schema);
      expect(fields[0]!.validation?.mode).toBe('zodSchema');
    });

    it('handles default fields', () => {
      const schema = z.object({ name: z.string().default('unnamed') });
      const { fields } = walkOptimized(schema);
      expect(fields[0]!.validation?.mode).toBe('zodSchema');
    });

    it('handles readonly fields', () => {
      const schema = z.object({ name: z.string().readonly() });
      const { fields } = walkOptimized(schema);
      expect(fields[0]!.validation?.mode).toBe('zodSchema');
    });

    it('handles pipe fields as atomic zodSchema', () => {
      const schema = z.object({
        num: z.string().pipe(z.coerce.number())
      });
      const { fields } = walkOptimized(schema);
      expect(fields[0]!.validation?.mode).toBe('zodSchema');
    });
  });

  describe('schemaLite handling', () => {
    it('produces null schemaLite when no top-level refines', () => {
      const schema = z.object({ name: z.string() });
      const { schemaLite } = walkOptimized(schema);
      expect(schemaLite).toBeNull();
    });

    it('captures top-level superRefine in schemaLite', () => {
      const schema = z
        .object({
          password: z.string(),
          confirm: z.string()
        })
        .superRefine((data, ctx) => {
          if (data.password !== data.confirm) {
            ctx.addIssue({ code: 'custom', message: 'Mismatch', path: ['confirm'] });
          }
        });

      const { fields, schemaLite } = walkOptimized(schema);
      // Fields should still be decomposed
      expect(fields).toHaveLength(2);
      expect(fields[0]!.validation?.mode).toBe('zodSchema');
      // SchemaLite should capture the superRefine
      expect(schemaLite).not.toBeNull();
    });
  });

  describe('multi-field forms', () => {
    it('decomposes each field independently', () => {
      const schema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
        age: z.number().min(0)
      });

      const { fields } = walkOptimized(schema);
      expect(fields).toHaveLength(3);

      for (const field of fields) {
        expect(field.validation?.mode).toBe('zodSchema');
        expect(field.zodSchema).toBeDefined();
      }
    });
  });
});
