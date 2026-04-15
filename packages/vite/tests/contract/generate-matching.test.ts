import { describe, expect, it } from 'vitest';
import { scanJsx } from '../../src/generate-mode/scan-jsx.js';
import { resolveSchemas } from '../../src/generate-mode/resolve-schema.js';

/**
 * Contract: every row of the "Match criteria" table in
 * `specs/007-vite-codegen-plugin/contracts/generate-mode.md` is
 * exercised here. Each row asserts whether a particular `<ZodForm>`
 * shape ends up in `resolved` (matched) or `skipped` (rejected).
 *
 * The table is the public contract — changes to the criteria require
 * updating both the spec and these tests in lockstep.
 */

const VITE_ROOT = '/abs/project';

async function pipeline(
  source: string,
  table: Record<string, string>
): Promise<{ matched: number; skipped: string[] }> {
  const scan = scanJsx(source);
  if (scan === null) return { matched: 0, skipped: [] };
  const resolved = await resolveSchemas({
    source,
    candidates: scan.candidates,
    sourceFile: '/abs/project/src/App.tsx',
    resolveImport: async (specifier) => table[specifier] ?? null,
    viteRoot: VITE_ROOT
  });
  return {
    matched: resolved.resolved.length,
    skipped: [...scan.skipped.map((s) => s.reason), ...resolved.skipped.map((s) => s.reason)]
  };
}

describe('generate-mode match criteria contract', () => {
  it('row: element name <ZodForm> + bare identifier schema → MATCH', async () => {
    const result = await pipeline(
      `import { ZodForm } from '@zod-to-form/react';
import { signupSchema } from './signup';
const App = () => <ZodForm schema={signupSchema} />;`,
      { './signup': '/abs/project/src/signup.ts' }
    );
    expect(result.matched).toBe(1);
  });

  it('row: <ns.ZodForm> (member-expression element name) → SKIP', async () => {
    const result = await pipeline(
      `import * as z2f from '@zod-to-form/react';
import { s } from './s';
const App = () => <z2f.ZodForm schema={s} />;`,
      { './s': '/abs/project/src/s.ts' }
    );
    expect(result.matched).toBe(0);
    expect(result.skipped.some((r) => /member-expression/.test(r))).toBe(true);
  });

  it('row: import origin is local wrapper → SKIP', async () => {
    const result = await pipeline(
      `import { ZodForm } from './local-wrapper';
import { s } from './s';
const App = () => <ZodForm schema={s} />;`,
      {
        './s': '/abs/project/src/s.ts',
        './local-wrapper': '/abs/project/src/local-wrapper.ts'
      }
    );
    expect(result.matched).toBe(0);
    expect(result.skipped.some((r) => /import origin/.test(r))).toBe(true);
  });

  it('row: schema prop missing → SKIP', async () => {
    const result = await pipeline(
      `import { ZodForm } from '@zod-to-form/react';
const App = () => <ZodForm onSubmit={() => {}} />;`,
      {}
    );
    expect(result.matched).toBe(0);
    expect(result.skipped.some((r) => /schema/.test(r))).toBe(true);
  });

  it('row: schema={inlined()} → SKIP (not an Identifier)', async () => {
    const result = await pipeline(
      `import { ZodForm } from '@zod-to-form/react';
import { z } from 'zod';
const App = () => <ZodForm schema={z.object({})} />;`,
      {}
    );
    expect(result.matched).toBe(0);
  });

  it('row: schema={a ? b : c} (conditional) → SKIP', async () => {
    const result = await pipeline(
      `import { ZodForm } from '@zod-to-form/react';
import { a, b } from './schemas';
const App = ({ flag }) => <ZodForm schema={flag ? a : b} />;`,
      {}
    );
    expect(result.matched).toBe(0);
  });

  it('row: schema={schemas[key]} (dynamic) → SKIP', async () => {
    const result = await pipeline(
      `import { ZodForm } from '@zod-to-form/react';
import { schemas } from './schemas';
const App = ({ key }) => <ZodForm schema={schemas[key]} />;`,
      {}
    );
    expect(result.matched).toBe(0);
  });

  it('row: import { ZodForm as MyForm } → SKIP (aliased element name)', async () => {
    const result = await pipeline(
      `import { ZodForm as MyForm } from '@zod-to-form/react';
import { s } from './s';
const App = () => <MyForm schema={s} />;`,
      { './s': '/abs/project/src/s.ts' }
    );
    expect(result.matched).toBe(0);
  });

  it('row: schema from node_modules package → SKIP (outside Vite root)', async () => {
    const result = await pipeline(
      `import { ZodForm } from '@zod-to-form/react';
import { s } from '@acme/schemas';
const App = () => <ZodForm schema={s} />;`,
      { '@acme/schemas': '/elsewhere/node_modules/@acme/schemas/index.js' }
    );
    expect(result.matched).toBe(0);
    expect(result.skipped.some((r) => /outside the Vite root/.test(r))).toBe(true);
  });

  it('row: re-exported ZodForm from a local module → SKIP', async () => {
    // The local re-export means the import origin isn't @zod-to-form/react.
    const result = await pipeline(
      `import { ZodForm } from './re-exports';
import { s } from './s';
const App = () => <ZodForm schema={s} />;`,
      {
        './re-exports': '/abs/project/src/re-exports.ts',
        './s': '/abs/project/src/s.ts'
      }
    );
    expect(result.matched).toBe(0);
    expect(result.skipped.some((r) => /import origin/.test(r))).toBe(true);
  });

  it('row: schema import is a default export → SKIP', async () => {
    const result = await pipeline(
      `import { ZodForm } from '@zod-to-form/react';
import s from './s';
const App = () => <ZodForm schema={s} />;`,
      { './s': '/abs/project/src/s.ts' }
    );
    expect(result.matched).toBe(0);
    expect(result.skipped.some((r) => /default/.test(r))).toBe(true);
  });

  it('row: schema is a local const, not an import → SKIP', async () => {
    const result = await pipeline(
      `import { ZodForm } from '@zod-to-form/react';
import { z } from 'zod';
const localSchema = z.object({});
const App = () => <ZodForm schema={localSchema} />;`,
      {}
    );
    expect(result.matched).toBe(0);
    expect(result.skipped.some((r) => /not a top-level import/.test(r))).toBe(true);
  });
});
