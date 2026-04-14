import { describe, expect, it } from 'vitest';
import { scanJsx } from '../../src/rewrite-mode/scan-jsx.js';
import { resolveSchemas } from '../../src/rewrite-mode/resolve-schema.js';
import { rewriteSource } from '../../src/rewrite-mode/rewrite-source.js';

/**
 * Contract: rewriteSource produces a magic-string-based transform that
 * (a) replaces <ZodForm> with the generated identifier, (b) removes the
 * schema attribute, (c) preserves all other attributes and children
 * verbatim, (d) prepends a synthesized import, (e) is idempotent.
 */

const VITE_ROOT = '/abs/project';

async function pipeline(
  source: string,
  table: Record<string, string>,
  sourceFile = '/abs/project/src/App.tsx'
): Promise<string> {
  const scan = scanJsx(source);
  if (scan === null) return source;
  const resolved = await resolveSchemas({
    source,
    candidates: scan.candidates,
    sourceFile,
    resolveImport: async (specifier) => table[specifier] ?? null,
    viteRoot: VITE_ROOT
  });
  return rewriteSource({ source, resolved: resolved.resolved }).code;
}

describe('rewriteSource', () => {
  it('rewrites a happy-path <ZodForm schema={X} />', async () => {
    const source = `
import { ZodForm } from '@zod-to-form/react';
import { signupSchema } from './signup';
const App = () => <ZodForm schema={signupSchema} />;
`;
    const out = await pipeline(source, { './signup': '/abs/project/src/signup.ts' });
    // ZodForm replaced
    expect(out).not.toContain('<ZodForm');
    expect(out).toContain('<_z2fGeneratedForm_1');
    // schema prop removed
    expect(out).not.toContain('schema={signupSchema}');
    // synthesized import prepended
    expect(out).toMatch(
      /import\s+\{[^}]*as\s+_z2fGeneratedForm_1[^}]*\}\s+from\s+'.*signup\.ts\?z2f=__rewrite_1'/
    );
  });

  it('preserves other attributes verbatim', async () => {
    const source = `
import { ZodForm } from '@zod-to-form/react';
import { s } from './s';
const App = () => <ZodForm schema={s} onSubmit={handleSubmit} className="form" />;
`;
    const out = await pipeline(source, { './s': '/abs/project/src/s.ts' });
    expect(out).toContain('onSubmit={handleSubmit}');
    expect(out).toContain('className="form"');
    expect(out).not.toContain('schema={s}');
  });

  it('preserves spread attributes', async () => {
    const source = `
import { ZodForm } from '@zod-to-form/react';
import { s } from './s';
const App = (props) => <ZodForm schema={s} {...props} />;
`;
    const out = await pipeline(source, { './s': '/abs/project/src/s.ts' });
    expect(out).toContain('{...props}');
    expect(out).not.toContain('schema={s}');
  });

  it('handles non-self-closing elements with children', async () => {
    const source = `
import { ZodForm } from '@zod-to-form/react';
import { s } from './s';
const App = () => <ZodForm schema={s}><h1>Title</h1></ZodForm>;
`;
    const out = await pipeline(source, { './s': '/abs/project/src/s.ts' });
    // Both opening and closing tag rewritten
    expect(out).toContain('<_z2fGeneratedForm_1');
    expect(out).toContain('</_z2fGeneratedForm_1>');
    expect(out).not.toContain('<ZodForm');
    expect(out).not.toContain('</ZodForm>');
    // Children preserved
    expect(out).toContain('<h1>Title</h1>');
  });

  it('rewrites multiple sites with sequential identifiers', async () => {
    const source = `
import { ZodForm } from '@zod-to-form/react';
import { a, b } from './schemas';
const App = () => (<>
  <ZodForm schema={a} />
  <ZodForm schema={b} />
</>);
`;
    const out = await pipeline(source, { './schemas': '/abs/project/src/schemas.ts' });
    expect(out).toContain('_z2fGeneratedForm_1');
    expect(out).toContain('_z2fGeneratedForm_2');
    expect(out).not.toContain('<ZodForm');
    // Two synthesized imports
    expect(out.match(/_z2fGeneratedForm_1/g)?.length).toBeGreaterThanOrEqual(2);
    expect(out.match(/_z2fGeneratedForm_2/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it('returns the source unchanged when there are no candidates', async () => {
    const source = `export const x = 1;`;
    const out = await pipeline(source, {});
    expect(out).toBe(source);
  });

  it('is idempotent: a second pass through the pipeline is a no-op', async () => {
    const source = `
import { ZodForm } from '@zod-to-form/react';
import { s } from './s';
const App = () => <ZodForm schema={s} />;
`;
    const first = await pipeline(source, { './s': '/abs/project/src/s.ts' });
    // The unused `import { ZodForm } from '@zod-to-form/react'` is left in
    // place after rewriting (Rollup tree-shakes it away in the build), so
    // scanJsx's substring guard still fires on the rewritten source. The
    // *correctness* contract is "produces identical output bytes on a
    // second pass" — assert that directly.
    const second = await pipeline(first, { './s': '/abs/project/src/s.ts' });
    expect(second).toBe(first);
  });

  it('produces a sourcemap with hires: true', async () => {
    const source = `
import { ZodForm } from '@zod-to-form/react';
import { s } from './s';
const App = () => <ZodForm schema={s} />;
`;
    const scan = scanJsx(source);
    const resolved = await resolveSchemas({
      source,
      candidates: scan!.candidates,
      sourceFile: '/abs/project/src/App.tsx',
      resolveImport: async (specifier) => (specifier === './s' ? '/abs/project/src/s.ts' : null),
      viteRoot: VITE_ROOT
    });
    const result = rewriteSource({ source, resolved: resolved.resolved });
    expect(result.map).toBeDefined();
    expect(typeof result.map.toString()).toBe('string');
    // hires sourcemaps have one entry per character; the mappings string
    // is non-empty for any non-trivial transform.
    expect(result.map.mappings.length).toBeGreaterThan(0);
  });
});
