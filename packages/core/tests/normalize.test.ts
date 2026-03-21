import { describe, it, expect } from 'vitest';
import { normalizeFormValues } from '../src/normalize.js';

describe('normalizeFormValues', () => {
  it('converts empty string to undefined', () => {
    expect(normalizeFormValues('')).toBeUndefined();
  });

  it('passes through non-empty strings', () => {
    expect(normalizeFormValues('hello')).toBe('hello');
  });

  it('passes through numbers (including zero)', () => {
    expect(normalizeFormValues(0)).toBe(0);
    expect(normalizeFormValues(42)).toBe(42);
    expect(normalizeFormValues(-1)).toBe(-1);
  });

  it('passes through booleans (including false)', () => {
    expect(normalizeFormValues(false)).toBe(false);
    expect(normalizeFormValues(true)).toBe(true);
  });

  it('passes through null', () => {
    expect(normalizeFormValues(null)).toBeNull();
  });

  it('passes through undefined', () => {
    expect(normalizeFormValues(undefined)).toBeUndefined();
  });

  it('recursively normalizes plain objects', () => {
    const input = { name: 'Alice', mode: '', count: 0 };
    expect(normalizeFormValues(input)).toEqual({
      name: 'Alice',
      mode: undefined,
      count: 0
    });
  });

  it('recursively normalizes nested objects', () => {
    const input = { outer: { inner: '', value: 'ok' } };
    expect(normalizeFormValues(input)).toEqual({
      outer: { inner: undefined, value: 'ok' }
    });
  });

  it('recursively normalizes arrays', () => {
    const input = ['hello', '', 42, ''];
    expect(normalizeFormValues(input)).toEqual(['hello', undefined, 42, undefined]);
  });

  it('normalizes objects inside arrays', () => {
    const input = [{ name: '', age: 5 }];
    expect(normalizeFormValues(input)).toEqual([{ name: undefined, age: 5 }]);
  });

  it('converts FileList-like with items to first file', () => {
    const file = { name: 'test.txt' };
    const fileList = {
      length: 1,
      item: (i: number) => (i === 0 ? file : null),
      0: file
    };
    expect(normalizeFormValues(fileList)).toBe(file);
  });

  it('converts empty FileList-like to undefined', () => {
    const fileList = {
      length: 0,
      item: () => null
    };
    expect(normalizeFormValues(fileList)).toBeUndefined();
  });

  it('passes through Date objects (non-plain objects)', () => {
    const date = new Date('2024-01-01');
    expect(normalizeFormValues(date)).toBe(date);
  });

  it('passes through RegExp objects', () => {
    const re = /test/;
    expect(normalizeFormValues(re)).toBe(re);
  });
});
