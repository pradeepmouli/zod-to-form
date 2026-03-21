import { describe, it, expect, vi } from 'vitest';
import { encodeShareState, decodeShareState } from '../../src/lib/share.ts';

describe('share', () => {
  it('round-trips code through encode/decode', () => {
    const state = { code: 'const schema = z.string(); schema;' };
    const { hash } = encodeShareState(state);
    const result = decodeShareState(hash);
    expect(result).not.toBeNull();
    expect(result!.ok).toBe(true);
    if (result!.ok) {
      expect(result!.state.code).toBe(state.code);
    }
  });

  it('preserves componentMap in round-trip', () => {
    const state = { code: 'z.string();', map: 'shadcn' as const };
    const { hash } = encodeShareState(state);
    const result = decodeShareState(hash);
    expect(result?.ok).toBe(true);
    if (result?.ok) {
      expect(result.state.map).toBe('shadcn');
    }
  });

  it('preserves activeTab in round-trip', () => {
    const state = { code: 'z.string();', tab: 'inspect' as const };
    const { hash } = encodeShareState(state);
    const result = decodeShareState(hash);
    expect(result?.ok).toBe(true);
    if (result?.ok) {
      expect(result.state.tab).toBe('inspect');
    }
  });

  it("defaults to 'default' map when not specified", () => {
    const state = { code: 'z.string();' };
    const { hash } = encodeShareState(state);
    const result = decodeShareState(hash);
    expect(result?.ok).toBe(true);
    if (result?.ok) {
      expect(result.state.map).toBe('default');
    }
  });

  it('returns null for empty hash', () => {
    expect(decodeShareState('')).toBeNull();
    expect(decodeShareState('#')).toBeNull();
  });

  it('returns error for corrupt hash', () => {
    const result = decodeShareState('#code=!!!corrupt!!!');
    expect(result).not.toBeNull();
    expect(result!.ok).toBe(false);
    if (!result!.ok) {
      expect(result!.error).toBeTruthy();
    }
  });

  it('handles hash with leading #', () => {
    const state = { code: 'z.number();' };
    const { hash } = encodeShareState(state);
    expect(hash.startsWith('#')).toBe(true);
    const result = decodeShareState(hash);
    expect(result).not.toBeNull();
    expect(result!.ok).toBe(true);
  });

  it('preserves tab:code in round-trip', () => {
    const state = { code: 'z.string();', tab: 'code' as const };
    const { hash } = encodeShareState(state);
    const result = decodeShareState(hash);
    expect(result?.ok).toBe(true);
    if (result?.ok) {
      expect(result.state.tab).toBe('code');
    }
  });

  it('returns tooLarge=false for small schemas', () => {
    const { tooLarge } = encodeShareState({ code: 'z.string();' });
    expect(tooLarge).toBe(false);
  });

  it('returns tooLarge=true and warns for large schemas', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    let largeCode = '';
    for (let i = 0; i < 2000; i++) {
      largeCode += `const v${i} = ${i * 7};\n`;
    }
    const { hash, tooLarge } = encodeShareState({ code: largeCode });
    expect(hash).toBeTruthy();
    expect(tooLarge).toBe(true);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Share URL is'));
    warnSpy.mockRestore();
  });
});
