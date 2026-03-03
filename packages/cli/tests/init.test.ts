import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runInit } from '../src/init.js';

async function createTempDir(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), 'zodform-cli-init-'));
}

describe('runInit', () => {
  let originalCwd = '';

  beforeEach(() => {
    originalCwd = process.cwd();
  });

  it('writes component-config.ts with baseline defaults', async () => {
    const dir = await createTempDir();
    process.chdir(dir);

    const result = await runInit({});

    expect(result.wroteFile).toBe(true);
    expect(path.basename(result.outputPath)).toBe('component-config.ts');

    const content = await readFile(result.outputPath, 'utf8');
    expect(content).toContain(`defineComponentConfig`);
    expect(content).toContain(`components: '@/components/zod-form-components'`);

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

  it('does not overwrite existing file without force', async () => {
    const dir = await createTempDir();
    process.chdir(dir);

    const outputPath = path.join(dir, 'component-config.ts');
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
      readFile(path.join(dir, 'nested', 'component-config.ts'), 'utf8')
    ).rejects.toThrow();

    writeSpy.mockRestore();
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
    expect(output).toContain('[summary]');

    logSpy.mockRestore();
    process.chdir(originalCwd);
  });
});
