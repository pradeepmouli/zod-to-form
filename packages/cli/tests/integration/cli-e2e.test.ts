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
  const configPath = path.join(dir, 'component-config.ts');

  await writeFile(
    schemaPath,
    `import { z } from 'zod';\nexport const userSchema = z.object({ name: z.string(), age: z.number() });\n`,
    'utf8'
  );

  await writeFile(
    configPath,
    [
      'export default {',
      "  components: '@app/components',",
      '  overwrite: false,',
      '  fieldTypes: {',
      "    string: { component: 'Input' },",
      "    number: { component: 'Input' },",
      "    Input: { component: 'Input' },",
      "    Checkbox: { component: 'Checkbox' }",
      '  }',
      '};'
    ].join('\n'),
    'utf8'
  );

  return { dir, schemaPath, outDir, configPath };
}

describe('CLI generate command', () => {
  it('writes file, supports dry-run, and config overwrite behavior', async () => {
    const { schemaPath, outDir, dir } = await createFixture();

    const originalCwd = process.cwd();
    process.chdir(path.dirname(schemaPath));

    const program = createProgram();
    await program.parseAsync(
      [
        'node',
        'zodform',
        'generate',
        '--config',
        './component-config.ts',
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

    await writeFile(outputPath, 'changed by test', 'utf8');

    const noOverwriteProgram = createProgram();
    await noOverwriteProgram.parseAsync(
      [
        'node',
        'zodform',
        'generate',
        '--config',
        './component-config.ts',
        '--schema',
        './schema.ts',
        '--export',
        'userSchema',
        '--out',
        outDir
      ],
      { from: 'node' }
    );

    const unchangedContent = await readFile(outputPath, 'utf8');
    expect(unchangedContent).toBe('changed by test');

    const overwriteConfigPath = path.join(dir, 'component-config.overwrite.ts');
    await writeFile(
      overwriteConfigPath,
      [
        'export default {',
        "  components: '@app/components',",
        '  overwrite: true,',
        '  fieldTypes: {',
        "    string: { component: 'Input' },",
        "    number: { component: 'Input' },",
        "    Input: { component: 'Input' },",
        "    Checkbox: { component: 'Checkbox' }",
        '  }',
        '};'
      ].join('\n'),
      'utf8'
    );

    const overwriteProgram = createProgram();
    await overwriteProgram.parseAsync(
      [
        'node',
        'zodform',
        'generate',
        '--config',
        './component-config.overwrite.ts',
        '--schema',
        './schema.ts',
        '--export',
        'userSchema',
        '--out',
        outDir
      ],
      { from: 'node' }
    );

    const overwrittenContent = await readFile(outputPath, 'utf8');
    expect(overwrittenContent).toContain('function UserForm');

    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const dryRunProgram = createProgram();
    await dryRunProgram.parseAsync(
      [
        'node',
        'zodform',
        'generate',
        '--config',
        './component-config.ts',
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

  it('uses config.types when --export is omitted', async () => {
    const { schemaPath, outDir, dir } = await createFixture();
    const configWithTypesPath = path.join(dir, 'component-config.types.ts');

    await writeFile(
      configWithTypesPath,
      [
        'export default {',
        "  components: '@app/components',",
        "  types: ['userSchema'],",
        '  overwrite: true,',
        '  fieldTypes: {',
        "    string: { component: 'Input' },",
        "    number: { component: 'Input' },",
        "    Input: { component: 'Input' },",
        "    Checkbox: { component: 'Checkbox' }",
        '  }',
        '};'
      ].join('\n'),
      'utf8'
    );

    const originalCwd = process.cwd();
    process.chdir(path.dirname(schemaPath));

    const program = createProgram();
    await program.parseAsync(
      [
        'node',
        'zodform',
        'generate',
        '--config',
        './component-config.types.ts',
        '--schema',
        './schema.ts',
        '--out',
        outDir
      ],
      { from: 'node' }
    );

    const outputPath = path.join(outDir, 'UserForm.tsx');
    const content = await readFile(outputPath, 'utf8');
    expect(content).toContain('function UserForm');

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
    const configPath = path.join(dir, 'component-config.ts');

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

    await writeFile(
      configPath,
      [
        'export default {',
        "  components: '@app/components',",
        '  overwrite: true,',
        '  fieldTypes: {',
        "    string: { component: 'Input' },",
        "    number: { component: 'Input' },",
        "    boolean: { component: 'Checkbox' },",
        "    Select: { component: 'Select' },",
        "    Input: { component: 'Input' },",
        "    Checkbox: { component: 'Checkbox' }",
        '  }',
        '};'
      ].join('\n'),
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
        '--config',
        './component-config.ts',
        '--schema',
        './big-schema.ts',
        '--export',
        'bigSchema',
        '--out',
        outDir
      ],
      { from: 'node' }
    );
    const elapsed = Date.now() - start;

    process.chdir(originalCwd);

    expect(elapsed).toBeLessThan(10_000);
  });
});
