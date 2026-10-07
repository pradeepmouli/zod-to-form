import { expect, it } from 'vitest';
import { resolveFormConfig } from '../src/index.js';

it('normalizes separators and trailing punctuation in inferred component names', () => {
  const config = { components: { source: './ui' } };
  const name = (exportName: string) => resolveFormConfig({ config, exportName }).componentName;
  expect(name('user-profileSchema')).toBe('UserProfileForm');
  expect(name('user///')).toBe('UserForm');
  expect(name('user' + '/'.repeat(100000))).toBe('UserForm');
});
