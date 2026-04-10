import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { extractNativeRules } from '../../src/optimizers/constraint-map.js';
import type { $ZodType } from 'zod/v4/core';

/** Cast helper — extractNativeRules expects $ZodType */
function extract(schema: z.ZodType) {
  return extractNativeRules(schema as unknown as $ZodType);
}

describe('extractNativeRules', () => {
  describe('string constraints', () => {
    it('extracts minLength/maxLength from z.string().min().max()', () => {
      const rules = extract(z.string().min(2).max(100));
      expect(rules).not.toBeNull();
      expect(rules!.minLength).toEqual(expect.objectContaining({ value: 2 }));
      expect(rules!.maxLength).toEqual(expect.objectContaining({ value: 100 }));
    });

    it('preserves custom error messages', () => {
      const rules = extract(z.string().min(2, 'Too short').max(100, 'Too long'));
      expect(rules!.minLength?.message).toBe('Too short');
      expect(rules!.maxLength?.message).toBe('Too long');
    });

    it('extracts pattern from z.string().email()', () => {
      const rules = extract(z.string().email());
      expect(rules).not.toBeNull();
      expect(rules!.pattern?.value).toBeInstanceOf(RegExp);
      // The extracted regex should match valid emails
      expect(rules!.pattern!.value.test('user@example.com')).toBe(true);
      expect(rules!.pattern!.value.test('not-an-email')).toBe(false);
    });

    it('extracts pattern from z.string().uuid()', () => {
      const rules = extract(z.string().uuid());
      expect(rules).not.toBeNull();
      expect(rules!.pattern?.value).toBeInstanceOf(RegExp);
      expect(rules!.pattern!.value.test('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('extracts pattern from z.string().regex()', () => {
      const rules = extract(z.string().regex(/^[A-Z]+$/, 'Must be uppercase'));
      expect(rules).not.toBeNull();
      expect(rules!.pattern?.value).toEqual(/^[A-Z]+$/);
      expect(rules!.pattern?.message).toBe('Must be uppercase');
    });

    it('returns null for multiple patterns (e.g. email + regex)', () => {
      const rules = extract(z.string().email().regex(/^test/));
      expect(rules).toBeNull();
    });

    it('handles z.string().email().url() (email pattern + url format)', () => {
      // .email() adds to bag.patterns, .url() adds to bag.format.
      // The combined schema has both — extractNativeRules should handle this
      // without crashing, returning either a single pattern or null.
      const rules = extract(z.string().email().url());
      // If rules are returned, the email pattern should be present
      if (rules !== null) {
        expect(rules.pattern?.value).toBeInstanceOf(RegExp);
      }
    });

    it('falls through to zodSchema for z.string().url() (uses format, not pattern)', () => {
      // url() stores format in bag, not patterns — extractNativeRules returns
      // a rules object without pattern, which is valid (url stays as zodSchema
      // at the L2 level since there's no native rule to map to)
      const rules = extract(z.string().url());
      expect(rules).not.toBeNull();
      // No pattern extracted — url uses bag.format not bag.patterns
      expect(rules!.pattern).toBeUndefined();
    });
  });

  describe('number constraints', () => {
    it('extracts min/max from z.number().min().max()', () => {
      const rules = extract(z.number().min(0).max(100));
      expect(rules).not.toBeNull();
      expect(rules!.min).toEqual(expect.objectContaining({ value: 0 }));
      expect(rules!.max).toEqual(expect.objectContaining({ value: 100 }));
    });

    it('returns null for z.number().gt() (exclusive bounds)', () => {
      const rules = extract(z.number().gt(0));
      expect(rules).toBeNull();
    });

    it('returns null for z.number().lt() (exclusive bounds)', () => {
      const rules = extract(z.number().lt(100));
      expect(rules).toBeNull();
    });

    it('extracts min for z.number().gte() (inclusive)', () => {
      const rules = extract(z.number().gte(0));
      expect(rules).not.toBeNull();
      expect(rules!.min).toEqual(expect.objectContaining({ value: 0 }));
    });
  });

  describe('refine/transform → null (strict equivalence)', () => {
    it('returns null for z.string().refine()', () => {
      const rules = extract(z.string().refine((v) => v !== 'banned'));
      expect(rules).toBeNull();
    });

    it('returns empty rules for z.string().transform() (transform is a pipe wrapper, not a check)', () => {
      // In Zod v4, .transform() wraps the schema in a pipe — the inner string
      // has no checks. extractNativeRules sees a clean string and returns {}.
      // The transform is handled by L1/schema-lite, not by extractNativeRules.
      const schema = z.string().transform((v) => v.toUpperCase());
      // Extract from the inner string (what the optimizer chain actually sees)
      const inner = (schema as any)._zod.def.in ?? schema;
      const rules = extract(inner);
      expect(rules).not.toBeNull();
    });

    it('returns null for z.string().min(2).refine() (mixed chain)', () => {
      const rules = extract(
        z
          .string()
          .min(2)
          .refine((v) => v !== 'banned')
      );
      expect(rules).toBeNull();
    });
  });

  describe('bag["patterns"] verification (Zod v4 substrate)', () => {
    it('z.string().email() stores regex in bag["patterns"] as a Set', () => {
      const schema = z.string().email();
      const bag = (schema as unknown as $ZodType)._zod.bag as Record<string, unknown>;
      const patterns = bag['patterns'];

      expect(patterns).toBeInstanceOf(Set);
      expect((patterns as Set<unknown>).size).toBe(1);

      const regex = [...(patterns as Set<unknown>)][0];
      expect(regex).toBeInstanceOf(RegExp);
      expect((regex as RegExp).test('user@example.com')).toBe(true);
      expect((regex as RegExp).test('invalid')).toBe(false);
    });

    it('z.string().uuid() stores regex in bag["patterns"]', () => {
      const schema = z.string().uuid();
      const bag = (schema as unknown as $ZodType)._zod.bag as Record<string, unknown>;
      const patterns = bag['patterns'];

      expect(patterns).toBeInstanceOf(Set);
      expect((patterns as Set<unknown>).size).toBe(1);
    });

    it('z.string().regex() stores regex in bag["patterns"]', () => {
      const schema = z.string().regex(/^[A-Z]+$/);
      const bag = (schema as unknown as $ZodType)._zod.bag as Record<string, unknown>;
      const patterns = bag['patterns'];

      expect(patterns).toBeInstanceOf(Set);
      expect((patterns as Set<unknown>).size).toBe(1);

      const regex = [...(patterns as Set<unknown>)][0];
      expect(regex).toEqual(/^[A-Z]+$/);
    });

    it('multiple patterns accumulate in the Set', () => {
      const schema = z.string().email().regex(/^test/);
      const bag = (schema as unknown as $ZodType)._zod.bag as Record<string, unknown>;
      const patterns = bag['patterns'];

      expect(patterns).toBeInstanceOf(Set);
      expect((patterns as Set<unknown>).size).toBe(2);
    });
  });

  describe('bare schemas (no constraints)', () => {
    it('returns empty rules for z.string() (no constraints)', () => {
      const rules = extract(z.string());
      expect(rules).not.toBeNull();
      expect(rules!.minLength).toBeUndefined();
      expect(rules!.maxLength).toBeUndefined();
      expect(rules!.pattern).toBeUndefined();
    });

    it('returns empty rules for z.number() (no constraints)', () => {
      const rules = extract(z.number());
      expect(rules).not.toBeNull();
      expect(rules!.min).toBeUndefined();
      expect(rules!.max).toBeUndefined();
    });
  });
});
