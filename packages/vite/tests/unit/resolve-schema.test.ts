import { describe, expect, it } from 'vitest';
import { scanJsx } from '../../src/generate-mode/scan-jsx.js';
import { resolveSchemas } from '../../src/generate-mode/resolve-schema.js';

/**
 * Contract: resolveSchemas validates that each candidate's ZodForm
 * import comes from '@zod-to-form/react' AND its schema identifier is
 * a top-level named import resolving to a file inside the Vite root.
 *
 * The async resolver callback wraps Vite's `this.resolve`; in these
 * tests we pass a synthetic resolver that maps specifiers to absolute
 * paths via a lookup table, so the test is hermetic.
 */

const VITE_ROOT = '/abs/project';

function makeResolver(
  table: Record<string, string>
): (s: string, importer: string) => Promise<string | null> {
  return async (specifier) => {
    return table[specifier] ?? null;
  };
}

async function scanAndResolve(
  source: string,
  table: Record<string, string>,
  sourceFile = '/abs/project/src/App.tsx'
): Promise<{ resolved: number; skipped: string[] }> {
  const scan = scanJsx(source);
  if (scan === null) return { resolved: 0, skipped: [] };
  const result = await resolveSchemas({
    source,
    candidates: scan.candidates,
    sourceFile,
    resolveImport: makeResolver(table),
    viteRoot: VITE_ROOT
  });
  return {
    resolved: result.resolved.length,
    skipped: result.skipped.map((s) => s.reason)
  };
}

describe('resolveSchemas', () => {
  it('resolves a happy-path <ZodForm schema={signupSchema} />', async () => {
    const source = `
import { ZodForm } from '@zod-to-form/react';
import { signupSchema } from './schemas/signup';
const App = () => <ZodForm schema={signupSchema} />;
`;
    const result = await scanAndResolve(source, {
      './schemas/signup': '/abs/project/src/schemas/signup.ts'
    });
    expect(result.resolved).toBe(1);
    expect(result.skipped).toHaveLength(0);
  });

  it('skips when ZodForm comes from a local wrapper, not @zod-to-form/react', async () => {
    const source = `
import { ZodForm } from './local-wrapper';
import { s } from './s';
const App = () => <ZodForm schema={s} />;
`;
    const result = await scanAndResolve(source, {
      './s': '/abs/project/src/s.ts',
      './local-wrapper': '/abs/project/src/local-wrapper.ts'
    });
    expect(result.resolved).toBe(0);
    expect(result.skipped[0]).toMatch(/import origin/);
  });

  it('skips when ZodForm is aliased (import { ZodForm as MyForm })', async () => {
    const source = `
import { ZodForm as MyForm } from '@zod-to-form/react';
import { s } from './s';
const App = () => <MyForm schema={s} />;
`;
    const result = await scanAndResolve(source, {
      './s': '/abs/project/src/s.ts'
    });
    // <MyForm> is not <ZodForm> so scanJsx skips it before resolveSchemas
    // even sees it. Count the scan-jsx skips too.
    expect(result.resolved).toBe(0);
  });

  it('skips when the schema identifier is a local const (not an import)', async () => {
    const source = `
import { ZodForm } from '@zod-to-form/react';
import { z } from 'zod';
const localSchema = z.object({});
const App = () => <ZodForm schema={localSchema} />;
`;
    const result = await scanAndResolve(source, {});
    expect(result.resolved).toBe(0);
    expect(result.skipped[0]).toMatch(/not a top-level import/);
  });

  it('skips when the schema is a default import', async () => {
    const source = `
import { ZodForm } from '@zod-to-form/react';
import s from './s';
const App = () => <ZodForm schema={s} />;
`;
    const result = await scanAndResolve(source, {
      './s': '/abs/project/src/s.ts'
    });
    expect(result.resolved).toBe(0);
    expect(result.skipped[0]).toMatch(/default/);
  });

  it('skips when the schema is a namespace import', async () => {
    const source = `
import { ZodForm } from '@zod-to-form/react';
import * as s from './s';
const App = () => <ZodForm schema={s} />;
`;
    const result = await scanAndResolve(source, {
      './s': '/abs/project/src/s.ts'
    });
    expect(result.resolved).toBe(0);
    expect(result.skipped[0]).toMatch(/namespace/);
  });

  it('skips when the schema source file is outside the Vite root', async () => {
    const source = `
import { ZodForm } from '@zod-to-form/react';
import { s } from '@acme/schemas';
const App = () => <ZodForm schema={s} />;
`;
    const result = await scanAndResolve(source, {
      '@acme/schemas': '/elsewhere/node_modules/@acme/schemas/index.js'
    });
    expect(result.resolved).toBe(0);
    expect(result.skipped[0]).toMatch(/outside the Vite root/);
  });

  it('allows schemas outside the Vite root for aliased workspace source files', async () => {
    const source = `
import { ZodForm } from '@zod-to-form/react';
import { s } from '../generated/schema';
const App = () => <ZodForm schema={s} />;
`;
    const result = await scanAndResolve(
      source,
      {
        '../generated/schema': '/repo/packages/visual-editor/src/generated/schema.ts'
      },
      '/repo/packages/visual-editor/src/components/TypeAliasForm.tsx'
    );
    expect(result.resolved).toBe(1);
    expect(result.skipped).toHaveLength(0);
  });

  it('skips when Vite cannot resolve the schema specifier', async () => {
    const source = `
import { ZodForm } from '@zod-to-form/react';
import { s } from './missing';
const App = () => <ZodForm schema={s} />;
`;
    const result = await scanAndResolve(source, {});
    expect(result.resolved).toBe(0);
    expect(result.skipped[0]).toMatch(/could not be resolved/);
  });

  it('assigns sequential generated identifiers per source file', async () => {
    const source = `
import { ZodForm } from '@zod-to-form/react';
import { a } from './a';
import { b } from './b';
const App = () => (<><ZodForm schema={a} /><ZodForm schema={b} /></>);
`;
    const scan = scanJsx(source);
    const result = await resolveSchemas({
      source,
      candidates: scan!.candidates,
      sourceFile: '/abs/project/src/App.tsx',
      resolveImport: makeResolver({
        './a': '/abs/project/src/a.ts',
        './b': '/abs/project/src/b.ts'
      }),
      viteRoot: VITE_ROOT
    });
    expect(result.resolved).toHaveLength(2);
    expect(result.resolved[0]?.generatedIdentifier).toBe('_z2fGeneratedForm_1');
    expect(result.resolved[1]?.generatedIdentifier).toBe('_z2fGeneratedForm_2');
  });
});
