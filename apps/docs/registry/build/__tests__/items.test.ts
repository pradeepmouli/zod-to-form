import { describe, it, expect } from 'vitest';
import { walkSchema } from '@zod-to-form/core';
import { schema } from '../../sample/schema.js';
import { buildReactItem } from '../items.js';

describe('sample schema', () => {
  it('walks to four named fields', () => {
    const fields = walkSchema(schema);
    expect(fields.map((f) => f.key)).toEqual(['name', 'email', 'age', 'subscribe']);
  });
});

describe('buildReactItem', () => {
  const item = buildReactItem();

  it('is a registry:block named starter-react', () => {
    expect(item.name).toBe('starter-react');
    expect(item.type).toBe('registry:block');
  });

  it('depends on the z2f runtime and peers', () => {
    expect(item.dependencies).toEqual(
      expect.arrayContaining([
        '@zod-to-form/react',
        'zod',
        'react-hook-form',
        '@hookform/resolvers'
      ])
    );
  });

  it('ships schema.ts, z2f.config.ts, and a ZodForm usage file with inlined content', () => {
    const paths = item.files.map((f) => f.path);
    expect(paths).toEqual(expect.arrayContaining(['schema.ts', 'z2f.config.ts', 'zod-form.tsx']));
    for (const f of item.files) {
      expect(f.content.length).toBeGreaterThan(0);
      expect(f.target.startsWith('@/')).toBe(true);
    }
  });

  it('config content is produced by buildConfigSource (shadcn preset)', () => {
    const config = item.files.find((f) => f.path === 'z2f.config.ts')!;
    expect(config.content).toContain('shadcn');
  });
});
