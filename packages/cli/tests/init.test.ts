import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runInit } from '../src/init.js';

async function createTempDir(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), 'zod-to-form-cli-init-'));
}

describe('runInit', () => {
  let originalCwd = '';

  beforeEach(() => {
    originalCwd = process.cwd();
  });

  it('writes z2f.config.ts with baseline defaults', async () => {
    const dir = await createTempDir();
    process.chdir(dir);

    const result = await runInit({});

    expect(result.wroteFile).toBe(true);
    expect(path.basename(result.outputPath)).toBe('z2f.config.ts');

    const content = await readFile(result.outputPath, 'utf8');
    expect(content).toContain(`defineComponentConfig`);
    expect(content).toContain(`components: '@/components/zod-form-components'`);
    expect(content).toContain(`formPrimitives: {`);
    expect(content).toContain(`field: 'Field'`);
    expect(content).toContain(`label: 'FieldLabel'`);
    expect(content).toContain(`control: 'FieldControl'`);

    process.chdir(originalCwd);
  });

  it('uses explicit --components module path when provided', async () => {
    const dir = await createTempDir();
    process.chdir(dir);

    const result = await runInit({ components: '@rune-langium/design-system/ui/input' });

    expect(result.wroteFile).toBe(true);
    const content = await readFile(result.outputPath, 'utf8');
    expect(content).toContain(`components: '@rune-langium/design-system/ui/input'`);

    process.chdir(originalCwd);
  });

  it('uses shadcn aliases when components.json is present', async () => {
    const dir = await createTempDir();
    process.chdir(dir);

    await writeFile(
      path.join(dir, 'components.json'),
      JSON.stringify(
        {
          style: 'new-york',
          aliases: {
            ui: '@/components/ui'
          }
        },
        null,
        2
      ),
      'utf8'
    );

    const result = await runInit({});
    const content = await readFile(result.outputPath, 'utf8');

    expect(result.usedShadcnDefaults).toBe(true);
    expect(content).toContain(`components: '@/components/ui/zod-form-components'`);

    process.chdir(originalCwd);
  });

  it('discovers formPrimitives from local exported field components', async () => {
    const dir = await createTempDir();
    process.chdir(dir);

    await mkdir(path.join(dir, 'src', 'components', 'ui'), { recursive: true });
    await writeFile(
      path.join(dir, 'components.json'),
      JSON.stringify(
        {
          aliases: {
            ui: '@/components/ui'
          }
        },
        null,
        2
      ),
      'utf8'
    );

    await writeFile(
      path.join(dir, 'src', 'components', 'ui', 'field.tsx'),
      [
        'export const FormField = () => null;',
        'export const FormLabel = () => null;',
        'export const FormControl = () => null;'
      ].join('\n'),
      'utf8'
    );

    const result = await runInit({});
    const content = await readFile(result.outputPath, 'utf8');

    expect(content).toContain(`field: 'FormField'`);
    expect(content).toContain(`label: 'FormLabel'`);
    expect(content).toContain(`control: 'FormControl'`);

    process.chdir(originalCwd);
  });

  it('does not overwrite existing file without force', async () => {
    const dir = await createTempDir();
    process.chdir(dir);

    const outputPath = path.join(dir, 'z2f.config.ts');
    await writeFile(outputPath, 'const sentinel = true;\n', 'utf8');

    const result = await runInit({});

    expect(result.wroteFile).toBe(false);
    const content = await readFile(outputPath, 'utf8');
    expect(content).toContain('sentinel');

    process.chdir(originalCwd);
  });

  it('prints dry-run output and does not write file', async () => {
    const dir = await createTempDir();
    process.chdir(dir);

    const writeSpy = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    const result = await runInit({ dryRun: true, out: './nested' });

    expect(result.wroteFile).toBe(false);
    expect(writeSpy).toHaveBeenCalled();

    await expect(
      readFile(path.join(dir, 'nested', 'z2f.config.ts'), 'utf8')
    ).rejects.toThrow();

    writeSpy.mockRestore();
    process.chdir(originalCwd);
  });

  it('creates parent directory when --out points to a non-existent directory', async () => {
    const dir = await createTempDir();
    process.chdir(dir);

    const result = await runInit({ out: './nested/config' });

    expect(result.wroteFile).toBe(true);
    const content = await readFile(path.join(dir, 'nested', 'config', 'z2f.config.ts'), 'utf8');
    expect(content).toContain('defineComponentConfig');

    process.chdir(originalCwd);
  });

  it('emits verbose details when verbose is enabled', async () => {
    const dir = await createTempDir();
    process.chdir(dir);
    await mkdir(path.join(dir, 'src'), { recursive: true });

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await runInit({ verbose: true });

    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('shadcn components.json found');
    expect(output).toContain('formPrimitives source:');
    expect(output).toContain('[summary]');

    logSpy.mockRestore();
    process.chdir(originalCwd);
  });
});
