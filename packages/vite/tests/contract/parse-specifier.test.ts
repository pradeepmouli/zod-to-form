import { describe, expect, it } from 'vitest';
import { parseSpecifier } from '../../src/query-mode/parse-specifier.js';

/**
 * Contract: parseSpecifier recognizes `?z2f` and `?z2f=<variant>` query
 * suffixes on import specifiers and rejects everything else, matching
 * the grammar table in `contracts/query-specifier.md`.
 *
 * The function is the single source of truth for what counts as a
 * z2f-handled import. Every Vite hook in the plugin delegates to it.
 */
describe('parseSpecifier', () => {
  describe('positive matches', () => {
    it('recognizes the bare ?z2f suffix', () => {
      expect(parseSpecifier('./schemas/signup.ts?z2f')).toEqual({
        kind: 'z2f',
        path: './schemas/signup.ts',
        variant: ''
      });
    });

    it('recognizes ?z2f=<variant>', () => {
      expect(parseSpecifier('./schemas/user.ts?z2f=edit')).toEqual({
        kind: 'z2f',
        path: './schemas/user.ts',
        variant: 'edit'
      });
    });

    it('handles absolute paths', () => {
      expect(parseSpecifier('/abs/src/schemas/x.ts?z2f')).toEqual({
        kind: 'z2f',
        path: '/abs/src/schemas/x.ts',
        variant: ''
      });
    });

    it('handles paths without a .ts extension', () => {
      expect(parseSpecifier('./schemas/user?z2f=create')).toEqual({
        kind: 'z2f',
        path: './schemas/user',
        variant: 'create'
      });
    });
  });

  describe('non-matches (returns null so other plugins can handle)', () => {
    it('returns null for plain imports without a query', () => {
      expect(parseSpecifier('./schemas/user.ts')).toBeNull();
    });

    it('returns null for unrelated queries', () => {
      expect(parseSpecifier('./schemas/user.ts?raw')).toBeNull();
      expect(parseSpecifier('./schemas/user.ts?url')).toBeNull();
      expect(parseSpecifier('./schemas/user.ts?worker')).toBeNull();
    });

    it('returns null for substring-but-not-token matches (?z2fX, ?xz2f)', () => {
      expect(parseSpecifier('./schemas/user.ts?z2fX')).toBeNull();
      expect(parseSpecifier('./schemas/user.ts?xz2f')).toBeNull();
      expect(parseSpecifier('./schemas/user.ts?z2foo')).toBeNull();
    });

    it('returns null for empty specifiers and edge cases', () => {
      expect(parseSpecifier('')).toBeNull();
      expect(parseSpecifier('?z2f')).toBeNull();
      expect(parseSpecifier('foo')).toBeNull();
    });
  });

  describe('rejected compositions (throws)', () => {
    it('throws Z2F_VITE_QUERY_COMPOSITION_UNSUPPORTED for ?z2f&raw', () => {
      expect(() => parseSpecifier('./schemas/user.ts?z2f&raw')).toThrow(
        /Z2F_VITE_QUERY_COMPOSITION_UNSUPPORTED/
      );
    });

    it('throws when ?z2f is combined with other known queries', () => {
      expect(() => parseSpecifier('./schemas/user.ts?url&z2f')).toThrow(
        /Z2F_VITE_QUERY_COMPOSITION_UNSUPPORTED/
      );
    });
  });

  describe('variant name validation', () => {
    it('accepts JavaScript-identifier-shaped variant names', () => {
      expect(parseSpecifier('./x.ts?z2f=foo')?.variant).toBe('foo');
      expect(parseSpecifier('./x.ts?z2f=Foo123')?.variant).toBe('Foo123');
      expect(parseSpecifier('./x.ts?z2f=_private')?.variant).toBe('_private');
      expect(parseSpecifier('./x.ts?z2f=camelCase')?.variant).toBe('camelCase');
    });

    it('rejects variant names that start with a digit', () => {
      expect(() => parseSpecifier('./x.ts?z2f=1bad')).toThrow(/Z2F_VITE_INVALID_VARIANT_NAME/);
    });

    it('rejects variant names with hyphens', () => {
      expect(() => parseSpecifier('./x.ts?z2f=user-edit')).toThrow(/Z2F_VITE_INVALID_VARIANT_NAME/);
    });

    it('rejects variant names with spaces', () => {
      expect(() => parseSpecifier('./x.ts?z2f=user edit')).toThrow(/Z2F_VITE_INVALID_VARIANT_NAME/);
    });

    it('rejects empty variant value (?z2f=)', () => {
      expect(() => parseSpecifier('./x.ts?z2f=')).toThrow(/Z2F_VITE_INVALID_VARIANT_NAME/);
    });

    it('rejects user-authored __rewrite_ prefixed variants (reserved internally)', () => {
      expect(() => parseSpecifier('./x.ts?z2f=__rewrite_foo')).toThrow(
        /Z2F_VITE_INVALID_VARIANT_NAME/
      );
    });
  });
});
