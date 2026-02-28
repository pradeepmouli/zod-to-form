import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { createProgram } from '../../src/index.js';
import { startWatch } from '../../src/watcher.js';

async function createFixture() {
  const dir = await mkdtemp(path.join(tmpdir(), 'zodform-cli-e2e-'));
  const schemaPath = path.join(dir, 'schema.ts');
  const outDir = path.join(dir, 'out');

  await writeFile(
    schemaPath,
    `import { z } from 'zod';\nexport const userSchema = z.object({ name: z.string(), age: z.number() });\n`,
    'utf8'
  );

  return { dir, schemaPath, outDir };
}

describe('CLI generate command', () => {
  it('writes file, supports dry-run, and force overwrites', async () => {
    const { schemaPath, outDir } = await createFixture();

    const originalCwd = process.cwd();
    process.chdir(path.dirname(schemaPath));

    const program = createProgram();
    await program.parseAsync(
      [
        'node',
        'zodform',
        'generate',
        '--schema',
        './schema.ts',
        '--export',
        'userSchema',
        '--out',
        outDir
      ],
      { from: 'node' }
    );

    const outputPath = path.join(outDir, 'UserForm.tsx');
    const firstContent = await readFile(outputPath, 'utf8');
    expect(firstContent).toContain('function UserForm');

    const afterSecondRunProgram = createProgram();
    await afterSecondRunProgram.parseAsync(
      [
        'node',
        'zodform',
        'generate',
        '--schema',
        './schema.ts',
        '--export',
        'userSchema',
        '--out',
        outDir
      ],
      { from: 'node' }
    );

    const contentAfterSecondRun = await readFile(outputPath, 'utf8');
    expect(contentAfterSecondRun).toBe(firstContent);

    await writeFile(outputPath, 'changed by test', 'utf8');
    const forceProgram = createProgram();
    await forceProgram.parseAsync(
      [
        'node',
        'zodform',
        'generate',
        '--schema',
        './schema.ts',
        '--export',
        'userSchema',
        '--out',
        outDir,
        '--force'
      ],
      { from: 'node' }
    );

    const forcedContent = await readFile(outputPath, 'utf8');
    expect(forcedContent).toContain('function UserForm');

    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const dryRunProgram = createProgram();
    await dryRunProgram.parseAsync(
      [
        'node',
        'zodform',
        'generate',
        '--schema',
        './schema.ts',
        '--export',
        'userSchema',
        '--out',
        outDir,
        '--dry-run'
      ],
      { from: 'node' }
    );

    expect(stdoutSpy).toHaveBeenCalled();
    stdoutSpy.mockRestore();
    process.chdir(originalCwd);
  });
});

// --- Watch Mode (US7) ---

describe('startWatch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('calls regenerate when a file change is detected (after debounce)', async () => {
    const regenerate = vi.fn().mockResolvedValue(undefined);
    const watcher = await startWatch('/tmp/schema.ts', regenerate);

    watcher.emit('change', '/tmp/schema.ts');

    expect(regenerate).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(250);
    expect(regenerate).toHaveBeenCalledTimes(1);

    await watcher.close();
  });

  it('debounces multiple rapid changes into a single regeneration', async () => {
    const regenerate = vi.fn().mockResolvedValue(undefined);
    const watcher = await startWatch('/tmp/schema.ts', regenerate);

    watcher.emit('change', '/tmp/schema.ts');
    watcher.emit('change', '/tmp/schema.ts');
    watcher.emit('change', '/tmp/schema.ts');

    await vi.advanceTimersByTimeAsync(250);
    expect(regenerate).toHaveBeenCalledTimes(1);

    await watcher.close();
  });

  it('logs messages when a change is detected', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const regenerate = vi.fn().mockResolvedValue(undefined);
    const watcher = await startWatch('/tmp/schema.ts', regenerate);

    watcher.emit('change', '/tmp/schema.ts');
    await vi.advanceTimersByTimeAsync(250);

    expect(consoleSpy).toHaveBeenCalled();
    await watcher.close();
  });

  it('returns a watcher with a close() method', async () => {
    const regenerate = vi.fn().mockResolvedValue(undefined);
    const watcher = await startWatch('/tmp/schema.ts', regenerate);

    expect(typeof watcher.close).toBe('function');
    await watcher.close();
  });

  it('does not regenerate after watcher is closed', async () => {
    const regenerate = vi.fn().mockResolvedValue(undefined);
    const watcher = await startWatch('/tmp/schema.ts', regenerate);

    await watcher.close();

    watcher.emit('change', '/tmp/schema.ts');
    await vi.advanceTimersByTimeAsync(250);

    expect(regenerate).not.toHaveBeenCalled();
  });
});

// --- Performance Benchmark (T106 / SC-002) ---

describe('CLI generate performance benchmark', () => {
  it('generates a 50-field schema end-to-end in under 10 seconds (SC-002)', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'zodform-bench-'));
    const schemaPath = path.join(dir, 'big-schema.ts');
    const outDir = path.join(dir, 'out');

    const fields50 = Array.from({ length: 50 }, (_: unknown, i: number) => {
      const mod = i % 5;
      if (mod === 0) return `  field${i}: z.string()`;
      if (mod === 1) return `  field${i}: z.number()`;
      if (mod === 2) return `  field${i}: z.boolean()`;
      if (mod === 3) return `  field${i}: z.enum(['a', 'b', 'c'])`;
      return `  field${i}: z.string().optional()`;
    }).join(',\n');

    await writeFile(
      schemaPath,
      `import { z } from 'zod';\nexport const bigSchema = z.object({\n${fields50}\n});\n`,
      'utf8'
    );

    const originalCwd = process.cwd();
    process.chdir(path.dirname(schemaPath));

    const start = Date.now();
    const program = createProgram();
    await program.parseAsync(
      [
        'node',
        'zodform',
        'generate',
        '--schema',
        './big-schema.ts',
        '--export',
        'bigSchema',
        '--out',
        outDir,
        '--force'
      ],
      { from: 'node' }
    );
    const elapsed = Date.now() - start;

    process.chdir(originalCwd);

    // SC-002: full generate pipeline must complete in under 10 seconds
    expect(elapsed).toBeLessThan(10_000);
  });
});
