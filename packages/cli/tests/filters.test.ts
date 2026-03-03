import { describe, expect, it } from 'vitest';
import { applyExportFilters } from '../src/filters.js';

describe('applyExportFilters', () => {
  const exports = ['userSchema', 'postSchema', 'commentSchema', 'adminUserSchema'];

  it('returns all exports when include and exclude are both undefined', () => {
    expect(applyExportFilters(exports, undefined, undefined)).toEqual(exports);
  });

  it('returns all exports when include and exclude are both empty arrays', () => {
    expect(applyExportFilters(exports, [], [])).toEqual(exports);
  });

  it('filters to only included exports using exact match', () => {
    expect(applyExportFilters(exports, ['userSchema'], undefined)).toEqual(['userSchema']);
  });

  it('filters to only included exports using wildcard', () => {
    expect(applyExportFilters(exports, ['*Schema'], undefined)).toEqual(exports);
    // Case-sensitive: '*user*' matches 'userSchema' but not 'adminUserSchema' (capital U)
    expect(applyExportFilters(exports, ['*user*'], undefined)).toEqual(['userSchema']);
    // '*User*' matches 'adminUserSchema' but not 'userSchema' (lowercase u)
    expect(applyExportFilters(exports, ['*User*'], undefined)).toEqual(['adminUserSchema']);
    // Case-sensitive: '*USER*' matches nothing
    expect(applyExportFilters(exports, ['*USER*'], undefined)).toEqual([]);
  });

  it('excludes exports using exact match', () => {
    expect(applyExportFilters(exports, undefined, ['userSchema'])).toEqual([
      'postSchema',
      'commentSchema',
      'adminUserSchema'
    ]);
  });

  it('excludes exports using wildcard', () => {
    // '*Schema' excludes all entries
    expect(applyExportFilters(exports, undefined, ['*Schema'])).toEqual([]);
    // Case-sensitive: '*user*' excludes only 'userSchema' (not 'adminUserSchema' with capital U)
    expect(applyExportFilters(exports, undefined, ['*user*'])).toEqual([
      'postSchema',
      'commentSchema',
      'adminUserSchema'
    ]);
    expect(applyExportFilters(exports, undefined, ['user*', 'admin*'])).toEqual([
      'postSchema',
      'commentSchema'
    ]);
  });

  it('applies include before exclude (exclude wins over include)', () => {
    const result = applyExportFilters(exports, ['*Schema'], ['userSchema']);
    expect(result).toEqual(['postSchema', 'commentSchema', 'adminUserSchema']);
  });

  it('returns empty array when no exports match include pattern', () => {
    expect(applyExportFilters(exports, ['nonExistent'], undefined)).toEqual([]);
  });

  it('returns empty array when all included exports are excluded', () => {
    expect(applyExportFilters(exports, ['userSchema'], ['userSchema'])).toEqual([]);
  });

  it('handles include-only with multiple patterns', () => {
    expect(applyExportFilters(exports, ['userSchema', 'postSchema'], undefined)).toEqual([
      'userSchema',
      'postSchema'
    ]);
  });

  it('handles exclude-only with multiple patterns', () => {
    expect(applyExportFilters(exports, undefined, ['userSchema', 'postSchema'])).toEqual([
      'commentSchema',
      'adminUserSchema'
    ]);
  });

  it('handles wildcard * matching everything', () => {
    expect(applyExportFilters(exports, ['*'], undefined)).toEqual(exports);
    expect(applyExportFilters(exports, undefined, ['*'])).toEqual([]);
  });
});
