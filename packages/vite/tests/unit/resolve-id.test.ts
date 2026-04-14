import { describe, expect, it } from 'vitest';
import { resolveZ2FId } from '../../src/query-mode/resolve-id.js';

/**
 * Contract: resolveZ2FId is the pure function side of the resolveId hook.
 * Given a specifier + an absolute resolved path (the result of Vite's
 * standard resolver running on the path portion), it produces the
 * normalized virtual module id used as the cache key, or returns `null`
 * if the specifier doesn't carry `?z2f`.
 */
describe('resolveZ2FId', () => {
  it('returns null for non-z2f specifiers', () => {
    expect(resolveZ2FId('./schemas/x.ts', '/abs/src/schemas/x.ts', '/abs')).toBeNull();
    expect(resolveZ2FId('./schemas/x.ts?raw', '/abs/src/schemas/x.ts', '/abs')).toBeNull();
  });

  it('produces a normalized id with the absolute path and bare ?z2f suffix', () => {
    const id = resolveZ2FId('./schemas/signup.ts?z2f', '/abs/src/schemas/signup.ts', '/abs');
    expect(id).toBe('/abs/src/schemas/signup.ts?z2f');
  });

  it('preserves the variant in the normalized id', () => {
    const id = resolveZ2FId('./schemas/user.ts?z2f=edit', '/abs/src/schemas/user.ts', '/abs');
    expect(id).toBe('/abs/src/schemas/user.ts?z2f=edit');
  });

  it('throws SCHEMA_OUTSIDE_ROOT when the resolved path is not inside the Vite root', () => {
    expect(() =>
      resolveZ2FId(
        'some-package/schemas/x.ts?z2f',
        '/elsewhere/node_modules/some-package/schemas/x.ts',
        '/abs/project'
      )
    ).toThrow(/Z2F_VITE_SCHEMA_OUTSIDE_ROOT/);
  });

  it('accepts paths nested deep inside the root', () => {
    const id = resolveZ2FId('./a/b/c/d/x.ts?z2f', '/root/a/b/c/d/x.ts', '/root');
    expect(id).toBe('/root/a/b/c/d/x.ts?z2f');
  });

  it('rejects relative paths that escape the root via ../', () => {
    expect(() => resolveZ2FId('../escape.ts?z2f', '/elsewhere/escape.ts', '/abs/project')).toThrow(
      /Z2F_VITE_SCHEMA_OUTSIDE_ROOT/
    );
  });

  it('throws on malformed specifiers (delegates to parseSpecifier)', () => {
    expect(() => resolveZ2FId('./x.ts?z2f=user-edit', '/abs/x.ts', '/abs')).toThrow(
      /Z2F_VITE_INVALID_VARIANT_NAME/
    );
  });
});
