import { describe, it, expect } from 'vitest';
import { walkSchema } from '@zod-to-form/core';
import { generateFormComponent } from '../src/index.js';
import { z } from 'zod';

const fields = walkSchema(z.object({ name: z.string() }));
const base = {
  exportName: 'schema',
  componentName: 'MyForm',
  mode: 'submit' as const,
  ui: 'html' as const
};

describe('typesModule', () => {
  it('imports StripIndexSignature when typesModule is set', () => {
    const out = generateFormComponent(fields, { ...base, typesModule: '@/components/z2f' });
    expect(out).toContain("import type { StripIndexSignature } from '@/components/z2f';");
    expect(out).not.toContain('type StripIndexSignature<T>');
  });

  it('inlines StripIndexSignature when typesModule is absent', () => {
    const out = generateFormComponent(fields, { ...base });
    expect(out).toContain('type StripIndexSignature<T>');
    expect(out).not.toContain('import type { StripIndexSignature }');
  });
});
