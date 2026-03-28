import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { walkSchema } from '../../src/walker.js';
import type { WalkResult } from '../../src/optimizers/types.js';

function walkL2(schema: z.ZodType): WalkResult {
  return walkSchema(schema, { optimization: { level: 2 } }) as WalkResult;
}

describe('L2 native rules optimizer', () => {
  describe('string constraints → native rules', () => {
    it('converts min/max to minLength/maxLength native rules', () => {
      const schema = z.object({ name: z.string().min(2).max(100) });
      const { fields } = walkL2(schema);
      const field = fields[0]!;
      expect(field.validation?.mode).toBe('native');
      expect(field.validation?.rules?.minLength).toEqual(expect.objectContaining({ value: 2 }));
      expect(field.validation?.rules?.maxLength).toEqual(expect.objectContaining({ value: 100 }));
      expect(field.zodSchema).toBeUndefined();
    });

    it('converts email to pattern native rule with Zod regex', () => {
      const schema = z.object({ email: z.string().email() });
      const { fields } = walkL2(schema);
      const field = fields[0]!;
      expect(field.validation?.mode).toBe('native');
      expect(field.validation?.rules?.pattern?.value).toBeInstanceOf(RegExp);
    });

    it('preserves error messages from Zod schema', () => {
      const schema = z.object({ name: z.string().min(2, 'At least 2') });
      const { fields } = walkL2(schema);
      const rules = fields[0]!.validation?.rules;
      expect(rules?.minLength?.message).toContain('2');
    });
  });

  describe('number constraints → native rules', () => {
    it('converts min/max to native rules', () => {
      const schema = z.object({ age: z.number().min(0).max(120) });
      const { fields } = walkL2(schema);
      const field = fields[0]!;
      expect(field.validation?.mode).toBe('native');
      expect(field.validation?.rules?.min).toEqual(expect.objectContaining({ value: 0 }));
      expect(field.validation?.rules?.max).toEqual(expect.objectContaining({ value: 120 }));
    });
  });

  describe('exclusive bounds → stays as zodSchema (FR-017)', () => {
    it('falls back to zodSchema for z.number().gt() (exclusive >)', () => {
      const schema = z.object({ score: z.number().gt(0) });
      const { fields } = walkL2(schema);
      expect(fields[0]!.validation?.mode).toBe('zodSchema');
    });

    it('falls back to zodSchema for z.number().lt() (exclusive <)', () => {
      const schema = z.object({ score: z.number().lt(100) });
      const { fields } = walkL2(schema);
      expect(fields[0]!.validation?.mode).toBe('zodSchema');
    });

    it('uses native rules for z.number().gte() (inclusive >=)', () => {
      const schema = z.object({ score: z.number().gte(0) });
      const { fields } = walkL2(schema);
      expect(fields[0]!.validation?.mode).toBe('native');
      expect(fields[0]!.validation?.rules?.min).toEqual(expect.objectContaining({ value: 0 }));
    });
  });

  describe('refine/transform → stays as zodSchema', () => {
    it('keeps entire chain as zodSchema when field has refine', () => {
      const schema = z.object({
        name: z
          .string()
          .min(2)
          .refine((v) => v !== 'banned')
      });
      const { fields } = walkL2(schema);
      expect(fields[0]!.validation?.mode).toBe('zodSchema');
      expect(fields[0]!.zodSchema).toBeDefined();
    });

    it('keeps entire chain when field has constraint + refine (no partial conversion)', () => {
      const schema = z.object({
        email: z
          .string()
          .email()
          .refine((v) => v.endsWith('.com'))
      });
      const { fields } = walkL2(schema);
      expect(fields[0]!.validation?.mode).toBe('zodSchema');
    });
  });

  describe('component-enforced', () => {
    it('sets component-enforced for enum fields', () => {
      const schema = z.object({ color: z.enum(['red', 'blue', 'green']) });
      const { fields } = walkL2(schema);
      expect(fields[0]!.validation?.mode).toBe('component-enforced');
      expect(fields[0]!.zodSchema).toBeUndefined();
    });

    it('sets component-enforced for boolean fields', () => {
      const schema = z.object({ agree: z.boolean() });
      const { fields } = walkL2(schema);
      expect(fields[0]!.validation?.mode).toBe('component-enforced');
    });

    it('sets component-enforced for literal fields', () => {
      const schema = z.object({ type: z.literal('admin') });
      const { fields } = walkL2(schema);
      expect(fields[0]!.validation?.mode).toBe('component-enforced');
    });
  });

  describe('required flag', () => {
    it('adds required to native rules for required fields', () => {
      const schema = z.object({ name: z.string() });
      const { fields } = walkL2(schema);
      expect(fields[0]!.validation?.mode).toBe('native');
      expect(fields[0]!.validation?.rules?.required).toBeDefined();
    });

    it('does not add required for optional fields', () => {
      const schema = z.object({ name: z.string().optional() });
      const { fields } = walkL2(schema);
      // Optional wrapper still gets zodSchema mode from L1
      // but L2 should handle the inner string
      expect(fields[0]!.required).toBe(false);
    });
  });

  describe('mixed forms', () => {
    it('decomposes each field appropriately at level 2', () => {
      const schema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
        age: z.number().min(0),
        role: z.enum(['admin', 'user']),
        bio: z.string().refine((v) => v.length > 0)
      });

      const { fields } = walkL2(schema);

      const name = fields.find((f) => f.key === 'name')!;
      const email = fields.find((f) => f.key === 'email')!;
      const age = fields.find((f) => f.key === 'age')!;
      const role = fields.find((f) => f.key === 'role')!;
      const bio = fields.find((f) => f.key === 'bio')!;

      expect(name.validation?.mode).toBe('native');
      expect(email.validation?.mode).toBe('native');
      expect(age.validation?.mode).toBe('native');
      expect(role.validation?.mode).toBe('component-enforced');
      expect(bio.validation?.mode).toBe('zodSchema'); // has refine
    });
  });
});
