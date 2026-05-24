import { describe, it, expect } from 'vitest';
import { walkSchema } from '@zod-to-form/core';
import { schema } from '../../sample/schema.js';
import { buildReactItem, buildCodegenItem, buildViteItem, buildRegistryIndex } from '../items.js';
import { REGISTRY_DEPENDENCIES, STARTER_DOCS } from '../docs.js';

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
    expect(config.content).toContain("preset: 'shadcn'");
  });

  it('has the correct $schema, registryDependencies, and docs', () => {
    expect(item.$schema).toBe('https://ui.shadcn.com/schema/registry-item.json');
    expect(item.registryDependencies).toEqual(REGISTRY_DEPENDENCIES);
    expect(item.docs).toBe(STARTER_DOCS);
  });
});

describe('buildCodegenItem', () => {
  const item = buildCodegenItem();

  it('is named starter-codegen and drops the z2f runtime dep', () => {
    expect(item.name).toBe('starter-codegen');
    expect(item.dependencies).not.toContain('@zod-to-form/react');
    expect(item.dependencies).toEqual(
      expect.arrayContaining(['zod', 'react-hook-form', '@hookform/resolvers'])
    );
  });

  it('ships a generated form component built from the sample schema', () => {
    const gen = item.files.find((f) => f.path === 'generated-form.tsx');
    expect(gen).toBeDefined();
    expect(gen!.content).toContain('useForm');
    expect(gen!.content).toContain('zodResolver');
  });
});

describe('buildViteItem', () => {
  const item = buildViteItem();
  it('is named starter-vite and dev-depends on the vite plugin', () => {
    expect(item.name).toBe('starter-vite');
    expect(item.devDependencies).toContain('@zod-to-form/vite');
  });
});

describe('buildRegistryIndex', () => {
  const index = buildRegistryIndex();
  it('lists all three starter items under the @zod-to-form namespace', () => {
    expect(index.name).toBe('@zod-to-form');
    expect(index.items.map((i) => i.name)).toEqual([
      'starter-react',
      'starter-codegen',
      'starter-vite'
    ]);
  });
});
