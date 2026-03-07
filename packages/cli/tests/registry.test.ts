import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

function registryPath(name: string): string {
  return path.join(ROOT, 'public', 'r', name);
}

describe('registry JSON validation', () => {
  it('public/r/zod-form.json is valid and has correct structure', async () => {
    const raw = await readFile(registryPath('zod-form.json'), 'utf8');
    const item = JSON.parse(raw);

    expect(item.$schema).toContain('shadcn.com/schema');
    expect(item.name).toBe('zod-form');
    expect(item.type).toBe('registry:component');
    expect(item.files).toBeInstanceOf(Array);
    expect(item.files.length).toBeGreaterThan(0);
    expect(item.files[0].content).toBeTruthy();
    expect(item.files[0].content).toContain('ZodForm');

    expect(item.dependencies).toContain('@zod-to-form/react');
    expect(item.dependencies).toContain('@zod-to-form/core');
    expect(item.dependencies).toContain('react-hook-form');
    expect(item.dependencies).toContain('@hookform/resolvers');
    expect(item.dependencies).toContain('zod');

    expect(item.registryDependencies).toContain('field');
    expect(item.registryDependencies).toContain('input');
    expect(item.registryDependencies).toContain('select');
  });

  it('public/r/zod-form-cli.json is valid and has correct structure', async () => {
    const raw = await readFile(registryPath('zod-form-cli.json'), 'utf8');
    const item = JSON.parse(raw);

    expect(item.$schema).toContain('shadcn.com/schema');
    expect(item.name).toBe('zod-form-cli');
    expect(item.type).toBe('registry:file');
    expect(item.files).toBeInstanceOf(Array);
    expect(item.files.length).toBeGreaterThan(0);
    expect(item.files[0].content).toBeTruthy();
    expect(item.files[0].content).toContain('defineConfig');
    expect(item.files[0].target).toBe('~/z2f.config.ts');

    expect(item.devDependencies).toContain('@zod-to-form/cli');

    expect(item.registryDependencies).toContain('field');
    expect(item.registryDependencies).toContain('input');
  });
});
