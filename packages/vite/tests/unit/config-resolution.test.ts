import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { compileTarget } from '../../src/query-mode/transform.js';

describe('canonical Vite configuration', () => {
  it('resolves nested root settings and variant optimization through core', () => {
    const result = compileTarget({
      namespace: { User: z.object({ name: z.string() }) },
      schemaFile: '/src/user.ts',
      variant: 'mobile',
      config: {
        components: { source: './ui', preset: 'shadcn' },
        defaults: { mode: 'auto-save', optimization: { level: 2, compileZod: false } },
        schemas: { User: { name: 'Profile' } },
        variants: { mobile: { defaults: { optimization: { level: 1 } } } }
      } as never
    });
    expect(result.effectiveConfig).toMatchObject({
      componentName: 'Profile',
      mode: 'auto-save',
      optimization: { level: 1, compileZod: false }
    });
    expect(result.generatedSource).toContain('export function Profile');
  });
});
