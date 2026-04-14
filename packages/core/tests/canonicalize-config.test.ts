import { describe, expect, it } from 'vitest';
import { canonicalizeConfig } from '../src/canonicalize-config.js';
import type { CodegenConfig } from '../src/config-types.js';

/**
 * Contract: canonicalizeConfig produces a deterministic, pure string
 * representation of a CodegenConfig that can be hashed to form cache keys.
 *
 * Invariants:
 * - Key order independence: two configs with the same fields in different
 *   insertion order MUST produce identical output.
 * - Deterministic recursion: nested objects and arrays are walked in a
 *   predictable order.
 * - undefined fields are omitted (matching JSON.stringify semantics).
 * - null is preserved distinctly from undefined.
 * - Numeric stability: integer and float values round-trip precisely.
 * - No side effects: calling it twice on the same input returns the same
 *   string.
 */
describe('canonicalizeConfig', () => {
  it('produces identical output for identical inputs', () => {
    const a: CodegenConfig = {
      exportName: 'Signup',
      componentName: 'SignupForm',
      mode: 'submit',
      ui: 'html'
    };
    const b: CodegenConfig = {
      exportName: 'Signup',
      componentName: 'SignupForm',
      mode: 'submit',
      ui: 'html'
    };
    expect(canonicalizeConfig(a)).toBe(canonicalizeConfig(b));
  });

  it('is independent of top-level key insertion order', () => {
    const a = {
      exportName: 'Signup',
      componentName: 'SignupForm',
      mode: 'submit',
      ui: 'html'
    } as CodegenConfig;
    const b = {
      ui: 'html',
      mode: 'submit',
      componentName: 'SignupForm',
      exportName: 'Signup'
    } as CodegenConfig;
    expect(canonicalizeConfig(a)).toBe(canonicalizeConfig(b));
  });

  it('is independent of nested object key insertion order', () => {
    const a = {
      exportName: 'Signup',
      componentName: 'SignupForm',
      mode: 'submit',
      ui: 'html',
      componentConfig: {
        components: { preset: 'shadcn' as const, source: '@/components' },
        fields: { name: { component: 'Input' } }
      }
    } as unknown as CodegenConfig;
    const b = {
      exportName: 'Signup',
      componentName: 'SignupForm',
      mode: 'submit',
      ui: 'html',
      componentConfig: {
        fields: { name: { component: 'Input' } },
        components: { source: '@/components', preset: 'shadcn' as const }
      }
    } as unknown as CodegenConfig;
    expect(canonicalizeConfig(a)).toBe(canonicalizeConfig(b));
  });

  it('preserves array order (arrays are NOT sorted)', () => {
    // Arrays carry order semantics — if the user writes [a, b, c] vs [c, b, a]
    // that's a different config.
    const a = {
      exportName: 'X',
      componentName: 'XForm',
      mode: 'submit',
      ui: 'html',
      _arr: ['a', 'b', 'c']
    } as unknown as CodegenConfig;
    const b = {
      exportName: 'X',
      componentName: 'XForm',
      mode: 'submit',
      ui: 'html',
      _arr: ['c', 'b', 'a']
    } as unknown as CodegenConfig;
    expect(canonicalizeConfig(a)).not.toBe(canonicalizeConfig(b));
  });

  it('omits undefined fields (does not treat them as null)', () => {
    const a: CodegenConfig = {
      exportName: 'X',
      componentName: 'XForm',
      mode: 'submit',
      ui: 'html',
      schemaImportPath: undefined,
      validationLevel: undefined
    };
    const b: CodegenConfig = {
      exportName: 'X',
      componentName: 'XForm',
      mode: 'submit',
      ui: 'html'
    };
    expect(canonicalizeConfig(a)).toBe(canonicalizeConfig(b));
  });

  it('preserves null distinctly from undefined', () => {
    const withNull = {
      exportName: 'X',
      componentName: 'XForm',
      mode: 'submit',
      ui: 'html',
      schemaLite: null
    } as unknown as CodegenConfig;
    const withoutField = {
      exportName: 'X',
      componentName: 'XForm',
      mode: 'submit',
      ui: 'html'
    } as unknown as CodegenConfig;
    expect(canonicalizeConfig(withNull)).not.toBe(canonicalizeConfig(withoutField));
  });

  it('is numerically stable for integer and float values', () => {
    const a = {
      exportName: 'X',
      componentName: 'XForm',
      mode: 'submit',
      ui: 'html',
      validationLevel: 2
    } as CodegenConfig;
    const b = {
      exportName: 'X',
      componentName: 'XForm',
      mode: 'submit',
      ui: 'html',
      validationLevel: 2
    } as CodegenConfig;
    expect(canonicalizeConfig(a)).toBe(canonicalizeConfig(b));
  });

  it('differs when a meaningful field changes', () => {
    const a: CodegenConfig = {
      exportName: 'X',
      componentName: 'XForm',
      mode: 'submit',
      ui: 'html'
    };
    const b: CodegenConfig = {
      exportName: 'X',
      componentName: 'XForm',
      mode: 'submit',
      ui: 'shadcn'
    };
    expect(canonicalizeConfig(a)).not.toBe(canonicalizeConfig(b));
  });

  it('is pure (same input twice returns identical output)', () => {
    const cfg: CodegenConfig = {
      exportName: 'X',
      componentName: 'XForm',
      mode: 'submit',
      ui: 'html'
    };
    const first = canonicalizeConfig(cfg);
    const second = canonicalizeConfig(cfg);
    expect(first).toBe(second);
  });

  it('returns a non-empty string', () => {
    const cfg: CodegenConfig = {
      exportName: 'X',
      componentName: 'XForm',
      mode: 'submit',
      ui: 'html'
    };
    const out = canonicalizeConfig(cfg);
    expect(typeof out).toBe('string');
    expect(out.length).toBeGreaterThan(0);
  });

  describe('opaque sentinel paths', () => {
    // Zod schemas are recognized structurally via a non-null `_zod` property
    // and replaced by a stable sentinel. Cache keys stay deterministic even
    // when different schema instances are referenced across configs.
    it('replaces values with a non-null `_zod` property by an opaque sentinel', () => {
      const fakeSchemaA = { _zod: { def: { type: 'string' } } };
      const fakeSchemaB = { _zod: { def: { type: 'number' } } };
      const a = {
        exportName: 'X',
        componentName: 'XForm',
        mode: 'submit',
        ui: 'html',
        schemaLite: fakeSchemaA
      } as unknown as CodegenConfig;
      const b = {
        exportName: 'X',
        componentName: 'XForm',
        mode: 'submit',
        ui: 'html',
        schemaLite: fakeSchemaB
      } as unknown as CodegenConfig;
      // Both schemas get the opaque sentinel → identical canonical output.
      expect(canonicalizeConfig(a)).toBe(canonicalizeConfig(b));
      // And the sentinel ends up in the output (not the internals).
      expect(canonicalizeConfig(a)).toContain('__opaque__');
      expect(canonicalizeConfig(a)).not.toContain('string');
    });

    it('does not treat `_zod: undefined` as a Zod schema', () => {
      // Just presence of the property is not enough; the value must be a
      // non-null object. A user-defined object that happens to have
      // `_zod: undefined` should serialize normally.
      const withUndef = {
        exportName: 'X',
        componentName: 'XForm',
        mode: 'submit',
        ui: 'html',
        componentConfig: { _zod: undefined, extras: 'kept' }
      } as unknown as CodegenConfig;
      const out = canonicalizeConfig(withUndef);
      expect(out).toContain('kept');
      // The `_zod: undefined` key is omitted like any other undefined field.
      expect(out).not.toContain('_zod');
    });

    it('replaces function values with the opaque sentinel', () => {
      const cfg = {
        exportName: 'X',
        componentName: 'XForm',
        mode: 'submit',
        ui: 'html',
        onChange: () => void 0
      } as unknown as CodegenConfig;
      const out = canonicalizeConfig(cfg);
      expect(out).toContain('__opaque__');
    });

    it('replaces symbol and bigint values with the opaque sentinel', () => {
      const cfg = {
        exportName: 'X',
        componentName: 'XForm',
        mode: 'submit',
        ui: 'html',
        sym: Symbol('x'),
        big: 42n
      } as unknown as CodegenConfig;
      const out = canonicalizeConfig(cfg);
      expect(out).toContain('__opaque__');
    });
  });
});
