import { describe, expect, it } from 'vitest';
import { isUseZodFormId, stripResolver } from '../../src/resolver-strip.js';

/**
 * Contract: stripResolver replaces every `zodResolver(...)` call
 * expression with the literal `undefined`, leaving everything else
 * (including the surrounding ternary, useMemo, and other code)
 * untouched. The companion `isUseZodFormId` helper must accept any
 * file extension under the `useZodForm.<ext>` basename and reject
 * anything else.
 */
describe('isUseZodFormId', () => {
  it('matches every useZodForm.<ext> shape', () => {
    expect(isUseZodFormId('/abs/packages/react/src/useZodForm.ts')).toBe(true);
    expect(isUseZodFormId('/abs/packages/react/dist/useZodForm.js')).toBe(true);
    expect(isUseZodFormId('/abs/packages/react/dist/useZodForm.mjs')).toBe(true);
    expect(isUseZodFormId('/abs/some/path/useZodForm.tsx')).toBe(true);
  });

  it('strips query strings before matching', () => {
    expect(isUseZodFormId('/abs/useZodForm.ts?z2f')).toBe(true);
    expect(isUseZodFormId('/abs/useZodForm.js?v=123')).toBe(true);
  });

  it('rejects unrelated files', () => {
    expect(isUseZodFormId('/abs/UseZodForm.ts')).toBe(false); // case-sensitive
    expect(isUseZodFormId('/abs/useZodFormHelper.ts')).toBe(false);
    expect(isUseZodFormId('/abs/SomeOtherHook.ts')).toBe(false);
    expect(isUseZodFormId('/abs/zodResolver.ts')).toBe(false);
  });

  it('handles Windows-style backslashes', () => {
    expect(isUseZodFormId('C:\\code\\packages\\react\\useZodForm.ts')).toBe(true);
  });
});

describe('stripResolver', () => {
  it('returns the source unchanged when there is no zodResolver call', () => {
    const source = `import { useForm } from 'react-hook-form';\nexport const x = 1;\n`;
    const result = stripResolver({ source });
    expect(result.code).toBe(source);
    expect(result.rewritten).toBe(0);
  });

  it('replaces zodResolver(rhfCast(schema)) with undefined (single call site)', () => {
    const source = `import { zodResolver } from '@hookform/resolvers/zod';
const baseResolver = isOptimized ? undefined : zodResolver(rhfCast(schema));
`;
    const result = stripResolver({ source });
    expect(result.code).toContain('isOptimized ? undefined : undefined');
    expect(result.code).not.toContain('zodResolver(');
    expect(result.rewritten).toBe(1);
  });

  it('replaces multiple call sites in the same file', () => {
    const source = `const a = zodResolver(schemaA);
const b = zodResolver(rhfCast(schemaB));
const c = zodResolver(other(stuff(here)));
`;
    const result = stripResolver({ source });
    expect(result.code).not.toContain('zodResolver(');
    expect(result.rewritten).toBe(3);
    // The `const a/b/c` declarations are still there with `undefined` rhs.
    expect(result.code).toContain('const a = undefined');
    expect(result.code).toContain('const b = undefined');
    expect(result.code).toContain('const c = undefined');
  });

  it('preserves balanced nested parens inside the call argument', () => {
    const source = `const r = zodResolver(rhfCast(schema.refine((v) => v.length > 0)));`;
    const result = stripResolver({ source });
    expect(result.code).toBe('const r = undefined;');
    expect(result.rewritten).toBe(1);
  });

  it('does NOT replace zodResolver appearing inside a string literal', () => {
    // A string literal containing `'zodResolver('` looks like a call to a
    // naive substring search. The heuristic guard checks the preceding
    // non-whitespace character — a `'` or `"` rules it out.
    const source = `const msg = 'zodResolver(was called)';`;
    const result = stripResolver({ source });
    expect(result.code).toBe(source);
    expect(result.rewritten).toBe(0);
  });

  it('preserves the surrounding ternary structure for tree-shaking', () => {
    const source = `import { zodResolver } from '@hookform/resolvers/zod';
function rhfCast(x) { return x; }
function useZodForm(schema, options) {
  const isOptimized = options?.optimization !== undefined;
  const baseResolver = isOptimized ? undefined : zodResolver(rhfCast(schema));
  return { baseResolver };
}
`;
    const result = stripResolver({ source });
    // After the strip:
    //   - The call site has become `undefined`
    //   - `zodResolver` has zero remaining references
    //   - Rollup will tree-shake the unused `import { zodResolver }`
    expect(result.code).toContain('isOptimized ? undefined : undefined');
    // The substring `zodResolver` still appears in the import line, but
    // NOT in any call expression — that's the contract the build pass
    // depends on for tree-shaking.
    const callMatches = result.code.match(/zodResolver\s*\(/g);
    expect(callMatches).toBeNull();
  });

  it('emits a hires sourcemap', () => {
    const source = `const r = zodResolver(schema);`;
    const result = stripResolver({ source });
    expect(result.map).toBeDefined();
    expect(result.map.mappings.length).toBeGreaterThan(0);
  });

  it('is idempotent on its own output', () => {
    const source = `const r = zodResolver(schema);`;
    const first = stripResolver({ source });
    const second = stripResolver({ source: first.code });
    expect(second.code).toBe(first.code);
    expect(second.rewritten).toBe(0);
  });
});
