import { describe, expect, it } from 'vitest';
import { selectExport } from '../../src/config/load.js';

/**
 * Contract: selectExport picks the right Zod schema from a module
 * namespace and throws clear errors on ambiguity, missing export, or
 * non-Zod value.
 *
 * Closes Edge Case "Schema file with multiple exports" (finding M4 from
 * /speckit.analyze): the diagnostic must name both candidates so the
 * user can copy the right name into their config.
 */
function fakeZodSchema(): { _zod: { def: { type: string } } } {
  return { _zod: { def: { type: 'object' } } };
}

describe('selectExport', () => {
  describe('with expectedName provided', () => {
    it('returns the export when it exists and is a Zod schema', () => {
      const ns = { signupSchema: fakeZodSchema(), helper: () => {} };
      const result = selectExport(ns, '/abs/signup.ts', 'signupSchema');
      expect(result.name).toBe('signupSchema');
      expect(result.schema).toBe(ns.signupSchema);
    });

    it('throws SCHEMA_NOT_FOUND when the named export is missing', () => {
      const ns = { otherSchema: fakeZodSchema() };
      expect(() => selectExport(ns, '/abs/x.ts', 'signupSchema')).toThrow(
        /Z2F_VITE_SCHEMA_NOT_FOUND/
      );
    });

    it('error message lists available exports to help the user', () => {
      const ns = { otherSchema: fakeZodSchema(), unrelated: 42 };
      try {
        selectExport(ns, '/abs/x.ts', 'signupSchema');
        expect.fail('Expected throw');
      } catch (err) {
        expect((err as Error).message).toContain('otherSchema');
        expect((err as Error).message).toContain('unrelated');
      }
    });

    it('throws SCHEMA_NOT_ZOD when the named export is not a Zod schema', () => {
      const ns = { signupSchema: { not: 'zod' } };
      expect(() => selectExport(ns, '/abs/x.ts', 'signupSchema')).toThrow(
        /Z2F_VITE_SCHEMA_NOT_ZOD/
      );
    });
  });

  describe('auto-detect (no expectedName)', () => {
    it('returns the lone Zod schema export', () => {
      const ns = { signupSchema: fakeZodSchema(), helper: () => {} };
      const result = selectExport(ns, '/abs/signup.ts');
      expect(result.name).toBe('signupSchema');
    });

    it('throws SCHEMA_NOT_FOUND when no Zod exports exist', () => {
      const ns = { helper: () => {}, constant: 42 };
      expect(() => selectExport(ns, '/abs/x.ts')).toThrow(/Z2F_VITE_SCHEMA_NOT_FOUND/);
    });

    it('throws AMBIGUOUS_EXPORT when more than one Zod schema is exported', () => {
      const ns = {
        signupSchema: fakeZodSchema(),
        loginSchema: fakeZodSchema(),
        helper: () => {}
      };
      expect(() => selectExport(ns, '/abs/x.ts')).toThrow(/Z2F_VITE_AMBIGUOUS_EXPORT/);
    });

    it('AMBIGUOUS_EXPORT message lists every candidate so the user can copy the right name', () => {
      const ns = {
        signupSchema: fakeZodSchema(),
        loginSchema: fakeZodSchema()
      };
      try {
        selectExport(ns, '/abs/x.ts');
        expect.fail('Expected throw');
      } catch (err) {
        const message = (err as Error).message;
        expect(message).toContain('signupSchema');
        expect(message).toContain('loginSchema');
      }
    });

    it('skips default export even if it looks like a Zod schema', () => {
      // `default` exports are intentionally excluded — the contract is
      // "named export matching the convention". A user with a default-
      // exported schema must rename it to a named export OR set exportName.
      const ns = { default: fakeZodSchema(), namedSchema: fakeZodSchema() };
      const result = selectExport(ns, '/abs/x.ts');
      expect(result.name).toBe('namedSchema');
    });

    it('treats a default-only export the same as no schemas at all', () => {
      const ns = { default: fakeZodSchema() };
      expect(() => selectExport(ns, '/abs/x.ts')).toThrow(/Z2F_VITE_SCHEMA_NOT_FOUND/);
    });
  });
});
