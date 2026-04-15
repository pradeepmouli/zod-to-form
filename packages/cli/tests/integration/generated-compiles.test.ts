import { mkdtemp, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { FormField } from '@zod-to-form/core';
import { generateFormComponent } from '../../src/codegen.js';

const workspaceRoot = path.resolve(fileURLToPath(import.meta.url), '../../../..');

describe('generated component compilation', () => {
  it('falls back to default input rendering when component config is not provided', async () => {
    const fields: FormField[] = [
      {
        key: 'kind',
        component: 'cross-ref',
        props: {},
        label: 'Kind',
        required: true,
        readOnly: false,
        hidden: false,
        disabled: false,
        deprecated: false,
        constraints: {},
        zodType: 'string'
      }
    ];

    const output = await generateFormComponent(fields, {
      schemaPath: '/tmp/schema.ts',
      exportName: 'entitySchema',
      outputPath: '/tmp/EntityForm.tsx',
      componentName: 'EntityForm',
      mode: 'submit',
      ui: 'html',
      serverAction: false
    });

    expect(output).toContain(`<input id="kind" type="text" {...register('kind')} />`);
    expect(output).not.toContain(`from '@app/components'`);
  });

  // 30s timeout: defensive. `tsgo --noEmit` runs in under 500ms locally
  // and stays sub-3s on GitHub Actions, but the test used to flake at
  // the 5s vitest default back when it was calling `tsc` (cold startup
  // 8-12s on CI). Keeping the wider budget means a future toolchain
  // change can't reintroduce the flake.
  it('passes tsgo --noEmit in strict mode', async () => {
    const tempDir = await mkdtemp(path.join(tmpdir(), 'zodform-generated-compile-'));
    const outputPath = path.join(tempDir, 'UserForm.tsx');
    const schemaPath = path.join(tempDir, 'schema.ts');
    const declarationsPath = path.join(tempDir, 'declarations.d.ts');
    const tsconfigPath = path.join(tempDir, 'tsconfig.json');

    const fields: FormField[] = [
      {
        key: 'name',
        component: 'Input',
        props: { type: 'text' },
        label: 'Name',
        required: true,
        readOnly: false,
        hidden: false,
        disabled: false,
        deprecated: false,
        constraints: {},
        zodType: 'string'
      }
    ];

    const source = await generateFormComponent(fields, {
      schemaPath,
      exportName: 'userSchema',
      outputPath,
      componentName: 'UserForm',
      mode: 'submit',
      ui: 'html',
      serverAction: false
    });

    await writeFile(schemaPath, `export const userSchema = {} as any;\n`, 'utf8');
    await writeFile(outputPath, source, 'utf8');
    await writeFile(
      declarationsPath,
      [
        `declare module 'react-hook-form' {`,
        `  export function useForm<T>(options?: unknown): { register: (name: string, options?: unknown) => Record<string, unknown>; handleSubmit: (fn: (data: T) => void) => (event?: unknown) => void };`,
        `}`,
        `declare module '@hookform/resolvers/zod' {`,
        `  export function zodResolver(schema: unknown): (values: unknown, context: unknown, options: unknown) => unknown;`,
        `}`,
        `declare module 'zod' {`,
        `  export namespace z {`,
        `    export type output<T> = unknown;`,
        `    export type input<T> = unknown;`,
        `  }`,
        `  export const z: unknown;`,
        `}`,
        `declare module 'react/jsx-runtime' {`,
        `  export const jsx: (...args: unknown[]) => unknown;`,
        `  export const jsxs: (...args: unknown[]) => unknown;`,
        `  export const Fragment: unknown;`,
        `}`,
        `declare module '@zod-to-form/core' {`,
        `  export type StripIndexSignature<T> = T;`,
        `  export function normalizeFormValues(value: unknown): unknown;`,
        `}`,
        `declare namespace JSX { interface IntrinsicElements { form: any; div: any; label: any; input: any; select: any; option: any; textarea: any; button: any; } }`
      ].join('\n'),
      'utf8'
    );
    await writeFile(
      tsconfigPath,
      JSON.stringify(
        {
          compilerOptions: {
            strict: true,
            jsx: 'react-jsx',
            noEmit: true,
            skipLibCheck: true,
            target: 'ES2022',
            module: 'ESNext',
            moduleResolution: 'bundler',
            allowImportingTsExtensions: true
          },
          files: ['declarations.d.ts', 'schema.ts', 'UserForm.tsx']
        },
        null,
        2
      ),
      'utf8'
    );

    try {
      execFileSync('pnpm', ['exec', 'tsgo', '--noEmit', '-p', tsconfigPath], {
        cwd: workspaceRoot,
        stdio: 'pipe'
      });
    } catch (error) {
      const stderr =
        error && typeof error === 'object' && 'stderr' in error
          ? String((error as { stderr?: Buffer }).stderr)
          : '';
      const stdout =
        error && typeof error === 'object' && 'stdout' in error
          ? String((error as { stdout?: Buffer }).stdout)
          : '';
      throw new Error([stdout, stderr, String(error)].filter(Boolean).join('\n'));
    }
  }, 30_000);
});
