import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { compileTarget } from '../../src/query-mode/transform.js';

/**
 * Constitution Principle V sub-clause: "Generated code MUST compile
 * without errors". Closes finding C2 from /speckit.analyze.
 *
 * Calls `compileTarget` directly (the same pure helper the plugin's
 * `load` hook uses) to capture the raw TSX the codegen produces, writes
 * it to a temp dir alongside ambient declarations for react-hook-form
 * and friends, runs `tsgo --noEmit` against it, and asserts zero
 * diagnostics. Mirrors `packages/cli/tests/integration/generated-compiles.test.ts`
 * to keep the CLI and plugin parity gates in lockstep.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '../../../..');

const AMBIENT_DECLARATIONS = [
  `declare module 'react-hook-form' {`,
  `  export function useForm<T>(options?: unknown): { register: (name: string, options?: unknown) => Record<string, unknown>; handleSubmit: (fn: (data: T) => void) => (event?: unknown) => void };`,
  `}`,
  `declare module '@hookform/resolvers/zod' {`,
  `  export function zodResolver(schema: unknown): (values: unknown, context: unknown, options: unknown) => unknown;`,
  `}`,
  `declare module 'zod' {`,
  `  // Some generated files use \`z.input<typeof X>\` / \`z.output<typeof X>\``,
  `  // (namespace access), others use \`import('zod').input<typeof X>\` (direct`,
  `  // module member access). Stub both shapes so neither variant breaks.`,
  `  export type input<T> = unknown;`,
  `  export type output<T> = unknown;`,
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
].join('\n');

const TSCONFIG = JSON.stringify(
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
    files: ['declarations.d.ts', 'signup.ts', 'UserForm.tsx']
  },
  null,
  2
);

describe('plugin-generated component compilation', () => {
  it('passes tsgo --noEmit on the source emitted for a query-mode target', async () => {
    // Drive compileTarget directly with a synthetic Zod namespace — this is
    // exactly what the plugin's load hook does internally, minus the
    // post-codegen esbuild transform that strips JSX (we want the TSX form).
    const namespace = {
      userSchema: z.object({
        name: z.string().min(2),
        email: z.string().email()
      })
    };
    const result = compileTarget({
      namespace,
      schemaFile: '/abs/src/schemas/signup.ts',
      variant: '',
      config: {
        componentName: 'UserForm',
        mode: 'submit',
        ui: 'html',
        schemaImportPath: './signup'
      }
    });
    const generatedSource = result.generatedSource;

    const tempDir = await mkdtemp(path.join(tmpdir(), 'z2f-vite-generated-'));
    const outputPath = path.join(tempDir, 'UserForm.tsx');
    const schemaPath = path.join(tempDir, 'signup.ts');
    const declarationsPath = path.join(tempDir, 'declarations.d.ts');
    const tsconfigPath = path.join(tempDir, 'tsconfig.json');

    await writeFile(schemaPath, `export const userSchema = {} as any;\n`, 'utf8');
    await writeFile(outputPath, generatedSource, 'utf8');
    await writeFile(declarationsPath, AMBIENT_DECLARATIONS, 'utf8');
    await writeFile(tsconfigPath, TSCONFIG, 'utf8');

    try {
      execFileSync('pnpm', ['exec', 'tsc', '--noEmit', '-p', tsconfigPath], {
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
      throw new Error(
        `tsgo reported errors on plugin-generated source:\n${stdout}\n${stderr}\n\nSource:\n${generatedSource}`
      );
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }, 30_000);

  it('passes tsgo --noEmit when validation optimization is enabled', async () => {
    const namespace = {
      userSchema: z.object({
        name: z.string().min(2),
        email: z.string().email()
      })
    };
    const result = compileTarget({
      namespace,
      schemaFile: '/abs/src/schemas/signup.ts',
      variant: '',
      config: {
        componentName: 'UserForm',
        mode: 'submit',
        ui: 'html',
        schemaImportPath: './signup',
        validationLevel: 2
      }
    });

    const tempDir = await mkdtemp(path.join(tmpdir(), 'z2f-vite-generated-opt-'));
    const outputPath = path.join(tempDir, 'UserForm.tsx');
    const schemaPath = path.join(tempDir, 'signup.ts');
    const declarationsPath = path.join(tempDir, 'declarations.d.ts');
    const tsconfigPath = path.join(tempDir, 'tsconfig.json');

    await writeFile(schemaPath, `export const userSchema = {} as any;\n`, 'utf8');
    await writeFile(outputPath, result.generatedSource, 'utf8');
    await writeFile(declarationsPath, AMBIENT_DECLARATIONS, 'utf8');
    await writeFile(tsconfigPath, TSCONFIG, 'utf8');

    try {
      execFileSync('pnpm', ['exec', 'tsc', '--noEmit', '-p', tsconfigPath], {
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
      throw new Error(
        `tsgo reported errors on optimized plugin-generated source:\n${stdout}\n${stderr}\n\nSource:\n${result.generatedSource}`
      );
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }, 30_000);
});
