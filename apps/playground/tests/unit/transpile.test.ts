import { describe, it, expect } from 'vitest';
import { transpile } from '../../src/worker/transpile.ts';

describe('transpile', () => {
  it('converts valid TypeScript to JavaScript', () => {
    const result = transpile('const x: number = 42;');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.code).toContain('const x');
      expect(result.code).not.toContain(': number');
    }
  });

  it('returns syntax error with line/column info', () => {
    const result = transpile('const x: = ;');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('syntax');
      expect(result.error.message).toBeTruthy();
    }
  });

  it('rejects import statements', () => {
    const result = transpile('import { z } from "zod";');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('import');
    }
  });

  it('rejects require statements', () => {
    const result = transpile('const z = require("zod");');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('import');
    }
  });

  it('preserves ES module syntax (disableESTransforms)', () => {
    const result = transpile('const fn = () => 42;');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.code).toContain('=>');
    }
  });
});
