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

  it('writes z2f.config.ts with defineConfig and defaults section (T050)', async () => {
    const dir = await createTempDir();
    process.chdir(dir);

    const result = await runInit({});

    expect(result.wroteFile).toBe(true);
    expect(path.basename(result.outputPath)).toBe('z2f.config.ts');

    const content = await readFile(result.outputPath, 'utf8');
    expect(content).toContain(`defineConfig`);
    expect(content).toContain(
      `import type * as Components from '@/components/zod-form-components';`
    );
    expect(content).toContain(`export default defineConfig<typeof Components>({`);
    expect(content).toContain(`components: '@/components/zod-form-components'`);
    expect(content).toContain(`formPrimitives: {`);
    expect(content).toContain(`field: 'Field'`);
    expect(content).toContain(`label: 'FieldLabel'`);
    expect(content).toContain(`control: 'FieldControl'`);
    // T050: Verify defaults section is present
    expect(content).toContain(`defaults: {`);
    expect(content).toContain(`mode: 'submit'`);
    expect(content).toContain(`ui: 'shadcn'`);
    expect(content).toContain(`overwrite: false`);
    expect(content).toContain(`serverAction: false`);
    expect(content).toContain(`formProvider: false`);

    process.chdir(originalCwd);
  });

  it('uses explicit --components module path when provided', async () => {
    const dir = await createTempDir();
    process.chdir(dir);

    const result = await runInit({ components: '@rune-langium/design-system/ui/input' });

    expect(result.wroteFile).toBe(true);
    const content = await readFile(result.outputPath, 'utf8');
    expect(content).toContain(
      `import type * as Components from '@rune-langium/design-system/ui/input';`
    );
    expect(content).toContain(`components: '@rune-langium/design-system/ui/input'`);

    process.chdir(originalCwd);
  });

  it('uses explicit relative --components path for typed imports', async () => {
    const dir = await createTempDir();
    process.chdir(dir);

    const result = await runInit({
      components: './src/components/zod-form-components.ts',
      out: './nested/config'
    });

    const content = await readFile(result.outputPath, 'utf8');
    expect(content).toContain(
      `import type * as Components from '../../src/components/zod-form-components.js';`
    );
    expect(content).toContain(`components: './src/components/zod-form-components.ts'`);

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
        'export const Field = () => null;',
        'export const FieldLabel = () => null;',
        'export const FieldControl = () => null;'
      ].join('\n'),
      'utf8'
    );

    const result = await runInit({});
    const content = await readFile(result.outputPath, 'utf8');

    expect(content).toContain(`field: 'Field'`);
    expect(content).toContain(`label: 'FieldLabel'`);
    expect(content).toContain(`control: 'FieldControl'`);

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

    await expect(readFile(path.join(dir, 'nested', 'z2f.config.ts'), 'utf8')).rejects.toThrow();

    writeSpy.mockRestore();
    process.chdir(originalCwd);
  });

  it('creates parent directory when --out points to a non-existent directory', async () => {
    const dir = await createTempDir();
    process.chdir(dir);

    const result = await runInit({ out: './nested/config' });

    expect(result.wroteFile).toBe(true);
    const content = await readFile(path.join(dir, 'nested', 'config', 'z2f.config.ts'), 'utf8');
    expect(content).toContain('defineConfig');

    process.chdir(originalCwd);
  });

  it('prints styled autodiscovery output with detected components (T051)', async () => {
    const dir = await createTempDir();
    process.chdir(dir);

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await runInit({});

    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('Detected components:');
    expect(output).toContain('Field');
    expect(output).toContain('Label');
    expect(output).toContain('Control');
    expect(output).toContain('Using components from:');

    logSpy.mockRestore();
    process.chdir(originalCwd);
  });

  it('discovers component exports from module path and uses them in fieldTypes', async () => {
    const dir = await createTempDir();
    process.chdir(dir);

    await mkdir(path.join(dir, 'src', 'components', 'zod-form-components'), { recursive: true });
    await writeFile(
      path.join(dir, 'src', 'components', 'zod-form-components', 'index.ts'),
      [
        'export const Field = () => null;',
        'export const FieldLabel = () => null;',
        'export const FieldControl = () => null;',
        'export const TextInput = () => null;',
        'export const EmailInput = () => null;',
        'export const SelectField = () => null;',
        'export function useFormContext() { return {}; }',
        'export const helperUtil = 42;'
      ].join('\n'),
      'utf8'
    );

    const result = await runInit({});
    const content = await readFile(result.outputPath, 'utf8');

    // Discovered PascalCase components should be in fieldTypes
    expect(content).toContain(`TextInput: { component: 'TextInput' }`);
    expect(content).toContain(`EmailInput: { component: 'EmailInput' }`);
    expect(content).toContain(`SelectField: { component: 'SelectField' }`);

    // Form primitives should NOT be in fieldTypes
    expect(content).not.toMatch(/fieldTypes:[\s\S]*Field: \{ component: 'Field' \}/);
    expect(content).not.toContain(`FieldLabel: { component: 'FieldLabel' }`);
    expect(content).not.toContain(`FieldControl: { component: 'FieldControl' }`);

    // Hooks and non-PascalCase should NOT be in fieldTypes
    expect(content).not.toContain('useFormContext');
    expect(content).not.toContain('helperUtil');

    // Hardcoded defaults should NOT appear when components are discovered
    expect(content).not.toContain(`DatePicker: { component: 'DatePicker' }`);

    process.chdir(originalCwd);
  });

  it('uses shadcn preset fieldTypes when components.json is present', async () => {
    const dir = await createTempDir();
    process.chdir(dir);

    await writeFile(
      path.join(dir, 'components.json'),
      JSON.stringify({ aliases: { ui: '@/components/ui' } }, null, 2),
      'utf8'
    );

    const result = await runInit({});
    const content = await readFile(result.outputPath, 'utf8');

    // Imports SHADCN_FIELD_TYPES alongside defineConfig
    expect(content).toContain(
      `import { defineConfig, SHADCN_FIELD_TYPES } from '@zod-to-form/core'`
    );
    // preset field emitted
    expect(content).toContain(`preset: 'shadcn'`);
    // Spread in fieldTypes
    expect(content).toContain(`...SHADCN_FIELD_TYPES`);
    // No individual preset entries listed (they come from the spread)
    expect(content).not.toContain(`Input: { component: 'Input' }`);

    process.chdir(originalCwd);
  });

  it('merges shadcn preset spread with discovered components', async () => {
    const dir = await createTempDir();
    process.chdir(dir);

    await writeFile(
      path.join(dir, 'components.json'),
      JSON.stringify({ aliases: { ui: '@/components/ui' } }, null, 2),
      'utf8'
    );

    await mkdir(path.join(dir, 'src', 'components', 'ui', 'zod-form-components'), {
      recursive: true
    });
    await writeFile(
      path.join(dir, 'src', 'components', 'ui', 'zod-form-components', 'index.ts'),
      [
        'export const Field = () => null;',
        'export const FieldLabel = () => null;',
        'export const FieldControl = () => null;',
        'export const RichTextEditor = () => null;',
        'export const ColorPicker = () => null;'
      ].join('\n'),
      'utf8'
    );

    const result = await runInit({});
    const content = await readFile(result.outputPath, 'utf8');

    // Spread for preset base
    expect(content).toContain(`...SHADCN_FIELD_TYPES`);
    // Discovered entries listed after the spread
    expect(content).toContain(`RichTextEditor: { component: 'RichTextEditor' }`);
    // ColorPicker is a known controlled component
    expect(content).toContain(`ColorPicker: { component: 'ColorPicker', controlled: true }`);

    process.chdir(originalCwd);
  });

  it('falls back to hardcoded fieldTypes when no components found', async () => {
    const dir = await createTempDir();
    process.chdir(dir);

    const result = await runInit({});
    const content = await readFile(result.outputPath, 'utf8');

    // No preset emitted without shadcn
    expect(content).not.toContain('preset:');
    expect(content).toContain(`Input: { component: 'Input' }`);
    expect(content).toContain(`Select: { component: 'Select' }`);
    expect(content).toContain(`Checkbox: { component: 'Checkbox' }`);

    process.chdir(originalCwd);
  });

  it('discovers schemas via --schemas flag', async () => {
    const dir = await createTempDir();
    process.chdir(dir);

    await writeFile(
      path.join(dir, 'schemas.ts'),
      [
        "import { z } from 'zod';",
        'export const UserSchema = z.object({ name: z.string(), email: z.string() });',
        'export const OrderSchema = z.object({ total: z.number() });',
        'export const notASchema = { foo: 42 };'
      ].join('\n'),
      'utf8'
    );

    const result = await runInit({ schemas: './schemas.ts' });
    const content = await readFile(result.outputPath, 'utf8');

    expect(content).toContain(
      `import type * as Components from '@/components/zod-form-components';`
    );
    expect(content).toContain(`import type * as ZodSchemas from './schemas.js';`);
    expect(content).toContain(
      `export default defineConfig<typeof Components, typeof ZodSchemas>({`
    );
    expect(content).toContain('schemas: {');
    expect(content).toContain('UserSchema: {}');
    expect(content).toContain('OrderSchema: {}');
    expect(content).not.toContain('notASchema');

    process.chdir(originalCwd);
  });

  it('uses explicit --schemas path for typed imports', async () => {
    const dir = await createTempDir();
    process.chdir(dir);

    await mkdir(path.join(dir, 'src', 'generated'), { recursive: true });
    await writeFile(
      path.join(dir, 'src', 'generated', 'zod-schemas.ts'),
      [
        "import { z } from 'zod';",
        'export const UserSchema = z.object({ name: z.string() });'
      ].join('\n'),
      'utf8'
    );

    const result = await runInit({
      schemas: './src/generated/zod-schemas.ts',
      out: './nested/config'
    });
    const content = await readFile(result.outputPath, 'utf8');

    expect(content).toContain(
      `import type * as ZodSchemas from '../../src/generated/zod-schemas.js';`
    );

    process.chdir(originalCwd);
  });

  it('omits schemas section when none discovered', async () => {
    const dir = await createTempDir();
    process.chdir(dir);

    const result = await runInit({});
    const content = await readFile(result.outputPath, 'utf8');

    expect(content).not.toContain(`import type * as ZodSchemas`);
    expect(content).not.toContain('schemas:');

    process.chdir(originalCwd);
  });

  it('writes output-relative schema type imports for nested config output paths', async () => {
    const dir = await createTempDir();
    process.chdir(dir);

    await writeFile(
      path.join(dir, 'schemas.ts'),
      [
        "import { z } from 'zod';",
        'export const UserSchema = z.object({ name: z.string() });'
      ].join('\n'),
      'utf8'
    );

    const result = await runInit({ schemas: './schemas.ts', out: './nested/config' });
    const content = await readFile(result.outputPath, 'utf8');

    expect(content).toContain(`import type * as ZodSchemas from '../../schemas.js';`);

    process.chdir(originalCwd);
  });

  it('prints styled discovery output for components and schemas', async () => {
    const dir = await createTempDir();
    process.chdir(dir);

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await runInit({});

    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('Detected components:');
    expect(output).toContain('Using default field types');
    expect(output).toContain('No schemas discovered');
    expect(output).toContain('Using components from:');

    logSpy.mockRestore();
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

  it('marks known controlled components (Select, Switch) with controlled: true', async () => {
    const dir = await createTempDir();
    process.chdir(dir);

    await mkdir(path.join(dir, 'src', 'components', 'zod-form-components'), { recursive: true });
    await writeFile(
      path.join(dir, 'src', 'components', 'zod-form-components', 'index.ts'),
      [
        'export const Field = () => null;',
        'export const FieldLabel = () => null;',
        'export const FieldControl = () => null;',
        'export const TextInput = () => null;',
        'export const Select = () => null;',
        'export const Switch = () => null;'
      ].join('\n'),
      'utf8'
    );

    const result = await runInit({});
    const content = await readFile(result.outputPath, 'utf8');

    // Known controlled components get controlled: true
    expect(content).toContain(`Select: { component: 'Select', controlled: true }`);
    expect(content).toContain(`Switch: { component: 'Switch', controlled: true }`);
    // Regular components do not
    expect(content).toContain(`TextInput: { component: 'TextInput' }`);
    expect(content).not.toContain(`TextInput: { component: 'TextInput', controlled: true }`);

    process.chdir(originalCwd);
  });

  it('detects controlled components from source heuristic (value + onChange, no forwardRef)', async () => {
    const dir = await createTempDir();
    process.chdir(dir);

    await mkdir(path.join(dir, 'src', 'components', 'zod-form-components'), { recursive: true });
    await writeFile(
      path.join(dir, 'src', 'components', 'zod-form-components', 'index.ts'),
      [
        'export const Field = () => null;',
        'export const FieldLabel = () => null;',
        'export const FieldControl = () => null;',
        '',
        '// Controlled: has value + onChange in props, no forwardRef',
        'type TypeSelectorProps = { value: string; onChange: (v: string) => void; };',
        'export function TypeSelector({ value, onChange }: TypeSelectorProps) { return null; }',
        '',
        '// NOT controlled: uses forwardRef',
        'export const CustomInput = React.forwardRef(function CustomInput({ value, onChange }, ref) { return null; });'
      ].join('\n'),
      'utf8'
    );

    const result = await runInit({});
    const content = await readFile(result.outputPath, 'utf8');

    // Heuristic detects TypeSelector as controlled
    expect(content).toContain(`TypeSelector: { component: 'TypeSelector', controlled: true }`);
    // forwardRef component is NOT marked controlled
    expect(content).not.toContain(`CustomInput: { component: 'CustomInput', controlled: true }`);

    process.chdir(originalCwd);
  });

  it('shows (controlled) tag in discovery output for controlled components', async () => {
    const dir = await createTempDir();
    process.chdir(dir);

    await mkdir(path.join(dir, 'src', 'components', 'zod-form-components'), { recursive: true });
    await writeFile(
      path.join(dir, 'src', 'components', 'zod-form-components', 'index.ts'),
      [
        'export const Field = () => null;',
        'export const FieldLabel = () => null;',
        'export const FieldControl = () => null;',
        'export const Select = () => null;',
        'export const TextInput = () => null;'
      ].join('\n'),
      'utf8'
    );

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await runInit({});

    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('Select (controlled)');
    expect(output).not.toContain('TextInput (controlled)');

    logSpy.mockRestore();
    process.chdir(originalCwd);
  });
});
