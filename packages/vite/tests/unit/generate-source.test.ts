import { describe, expect, it, vi } from 'vitest';
import { scanJsx } from '../../src/generate-mode/scan-jsx.js';
import { resolveSchemas } from '../../src/generate-mode/resolve-schema.js';
import { generateSource } from '../../src/generate-mode/generate-source.js';

/**
 * Contract: generateSource produces a magic-string-based transform that
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
  return generateSource({ source, resolved: resolved.resolved }).code;
}

describe('generateSource', () => {
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
      /import\s+\{[^}]*as\s+_z2fGeneratedForm_1[^}]*\}\s+from\s+'.*signup\.ts\?z2f=__generate_1'/
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

  it('preserves a leading `use client` directive — generated imports go AFTER it', async () => {
    const source = `'use client';
import { ZodForm } from '@zod-to-form/react';
import { s } from './s';
const App = () => <ZodForm schema={s} />;
`;
    const out = await pipeline(source, { './s': '/abs/project/src/s.ts' });
    // The directive must still be the first thing in the file.
    expect(out.startsWith("'use client';")).toBe(true);
    // The synthesized import appears after the directive, not before.
    const directiveIdx = out.indexOf("'use client';");
    const generatedIdx = out.indexOf('_z2fGeneratedForm_1');
    expect(generatedIdx).toBeGreaterThan(directiveIdx);
  });

  it('inserts generated imports AFTER existing top-level imports', async () => {
    const source = `import React from 'react';
import { ZodForm } from '@zod-to-form/react';
import { s } from './s';
const App = () => <ZodForm schema={s} />;
`;
    const out = await pipeline(source, { './s': '/abs/project/src/s.ts' });
    // Both user imports must precede the synthesized one.
    const reactIdx = out.indexOf("from 'react'");
    const userSchemaIdx = out.indexOf("from './s'");
    const generatedIdx = out.indexOf('_z2fGeneratedForm_1');
    expect(reactIdx).toBeGreaterThan(-1);
    expect(userSchemaIdx).toBeGreaterThan(-1);
    expect(generatedIdx).toBeGreaterThan(reactIdx);
    expect(generatedIdx).toBeGreaterThan(userSchemaIdx);
  });

  it('preserves a leading shebang line', async () => {
    const source = `#!/usr/bin/env node
import { ZodForm } from '@zod-to-form/react';
import { s } from './s';
const App = () => <ZodForm schema={s} />;
`;
    const out = await pipeline(source, { './s': '/abs/project/src/s.ts' });
    // Shebang stays first; the generated import comes after it.
    expect(out.startsWith('#!/usr/bin/env node')).toBe(true);
    expect(out.indexOf('#!/usr/bin/env node')).toBeLessThan(out.indexOf('_z2fGeneratedForm_1'));
  });

  it('preserves a shebang even when there are no user imports', async () => {
    // Regression: the old textual scanner handled shebangs explicitly.
    // The AST scanner must seed from program.interpreter so the shebang
    // doesn't get demoted below the generated import.
    const source = `#!/usr/bin/env node
import { ZodForm } from '@zod-to-form/react';
import { s } from './s';
const App = () => <ZodForm schema={s}/>;
`;
    const out = await pipeline(source, { './s': '/abs/project/src/s.ts' });
    // The shebang MUST be the literal first line of the output — not
    // just a prefix that could be followed by `import` on the same line.
    expect(out).toMatch(/^#!\/usr\/bin\/env node\r?\n/);
    // And the generated import must come on some line AFTER the shebang.
    const firstNewline = out.indexOf('\n');
    expect(out.indexOf('_z2fGeneratedForm_1')).toBeGreaterThan(firstNewline);
  });

  it('places generated imports after directives AND imports (both present)', async () => {
    const source = `'use client';
import { ZodForm } from '@zod-to-form/react';
import { s } from './s';
const App = () => <ZodForm schema={s} />;
`;
    const out = await pipeline(source, { './s': '/abs/project/src/s.ts' });
    const directiveIdx = out.indexOf("'use client';");
    const importIdx = out.indexOf("from './s'");
    const generatedIdx = out.indexOf('_z2fGeneratedForm_1');
    // Order must be directive → user import → generated import.
    expect(directiveIdx).toBeGreaterThanOrEqual(0);
    expect(importIdx).toBeGreaterThan(directiveIdx);
    expect(generatedIdx).toBeGreaterThan(importIdx);
  });

  it('handles CR-only line endings without concatenating statements', async () => {
    // Legacy fixtures may use Mac-classic CR-only line endings. The
    // insertion-point scanner's post-preamble whitespace advance must
    // treat bare `\r` as a line terminator — otherwise the generated
    // import would land directly after the preceding `;` on the same
    // line, producing `import X;import Y;` back-to-back.
    const source =
      `import { ZodForm } from '@zod-to-form/react';\r` +
      `import { s } from './s';\r` +
      `const App = () => <ZodForm schema={s} />;\r`;
    const out = await pipeline(source, { './s': '/abs/project/src/s.ts' });
    // Positive: the generated import MUST be preceded by a `\r` or the
    // start of the file (no semicolon-without-terminator before it).
    expect(out).toMatch(/(^|\r)import \{ Form as _z2fGeneratedForm_1 \}/);
    // Negative: must NOT appear glued onto the last user import's `;`.
    expect(out).not.toMatch(/;import \{ Form as _z2fGeneratedForm_1 \}/);
  });

  describe('findImportInsertionPoint onWarn contract', () => {
    // Direct tests against the exported helper — the defense-in-depth
    // path is "unreachable in practice" from the full generateSource
    // pipeline (scanJsx parses first and filters broken sources), so we
    // exercise the helper directly to pin the callback contract.

    it('fires onWarn with a "re-parse failed" message when the inner parser throws', async () => {
      const { findImportInsertionPoint } =
        await import('../../src/generate-mode/generate-source.js');
      const warn = vi.fn();
      // `const x = ;` is syntactically broken — Babel rejects it.
      const result = findImportInsertionPoint('const x = ;', warn);
      // Fallback: insertion at byte 0.
      expect(result).toBe(0);
      // Callback fired exactly once with a message containing the rationale.
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0]?.[0]).toMatch(/re-parse failed/);
    });

    it('swallows exceptions thrown by onWarn (safeWarn guard)', async () => {
      const { findImportInsertionPoint } =
        await import('../../src/generate-mode/generate-source.js');
      const throwingWarn = (): never => {
        throw new Error('logger exploded');
      };
      // A throwing callback must NOT propagate out — a recoverable
      // diagnostic shouldn't be able to convert itself into a hard
      // build failure.
      expect(() => findImportInsertionPoint('const x = ;', throwingWarn)).not.toThrow();
    });

    it('returns the correct insertion point for a well-formed source even without onWarn', async () => {
      const { findImportInsertionPoint } =
        await import('../../src/generate-mode/generate-source.js');
      const source = `'use client';
import { ZodForm } from '@zod-to-form/react';

const App = () => null;
`;
      // Insertion lands on the blank line between the imports and
      // `const App = …` — i.e. after the last import + trailing newline.
      const at = findImportInsertionPoint(source);
      const importEnd =
        source.indexOf("from '@zod-to-form/react';") + "from '@zod-to-form/react';".length;
      expect(at).toBeGreaterThan(importEnd);
      // And the character at `at` (if within bounds) is either EOF or
      // the start of a non-preamble statement.
      const rest = source.slice(at);
      expect(rest.startsWith('\n') || rest.startsWith('const')).toBe(true);
    });
  });

  it('handles side-effect-only imports (`import "polyfill";`)', async () => {
    const source = `import 'polyfill';
import { ZodForm } from '@zod-to-form/react';
import { s } from './s';
const App = () => <ZodForm schema={s} />;
`;
    const out = await pipeline(source, { './s': '/abs/project/src/s.ts' });
    expect(out.indexOf("import 'polyfill';")).toBeLessThan(out.indexOf('_z2fGeneratedForm_1'));
  });

  it('handles TypeScript `import type` forms', async () => {
    const source = `import type { FC } from 'react';
import { ZodForm } from '@zod-to-form/react';
import { s } from './s';
const App: FC = () => <ZodForm schema={s} />;
`;
    const out = await pipeline(source, { './s': '/abs/project/src/s.ts' });
    expect(out.indexOf('import type { FC }')).toBeLessThan(out.indexOf('_z2fGeneratedForm_1'));
  });

  it('handles multi-line `import {\\n  a,\\n  b\\n} from ...` statements', async () => {
    const source = `import {
  ZodForm
} from '@zod-to-form/react';
import { s } from './s';
const App = () => <ZodForm schema={s} />;
`;
    const out = await pipeline(source, { './s': '/abs/project/src/s.ts' });
    expect(out.indexOf("from '@zod-to-form/react'")).toBeLessThan(
      out.indexOf('_z2fGeneratedForm_1')
    );
  });

  it('handles multiple sequential directives', async () => {
    const source = `'use client';
'use strict';
import { ZodForm } from '@zod-to-form/react';
import { s } from './s';
const App = () => <ZodForm schema={s} />;
`;
    const out = await pipeline(source, { './s': '/abs/project/src/s.ts' });
    expect(out.startsWith("'use client';")).toBe(true);
    expect(out.indexOf("'use strict';")).toBeLessThan(out.indexOf('_z2fGeneratedForm_1'));
  });

  it('handles a block-comment inside an import statement without corrupting it', async () => {
    // Block comment contains a quote that a naive textual scanner
    // would mistake for the import source literal. The AST scanner
    // handles this correctly because @babel/parser owns the tokenizer.
    const source = `import { /* "quoted" */ ZodForm } from '@zod-to-form/react';
import { s } from './s';
const App = () => <ZodForm schema={s} />;
`;
    const out = await pipeline(source, { './s': '/abs/project/src/s.ts' });
    expect(out.indexOf("from '@zod-to-form/react'")).toBeLessThan(
      out.indexOf('_z2fGeneratedForm_1')
    );
    expect(out).toContain('/* "quoted" */');
  });

  it('does not crash when a candidate site is followed by an unparseable region', async () => {
    // scanJsx's own parse-failure path short-circuits the pipeline,
    // so a truly broken source produces zero candidates and nothing
    // to rewrite. The pipeline returns the source unchanged.
    const source = `import { ZodForm } from '@zod-to-form/react
// unclosed import specifier above — no closing quote
`;
    const out = await pipeline(source, {});
    expect(typeof out).toBe('string');
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
    const result = generateSource({ source, resolved: resolved.resolved });
    expect(result.map).toBeDefined();
    expect(typeof result.map.toString()).toBe('string');
    // hires sourcemaps have one entry per character; the mappings string
    // is non-empty for any non-trivial transform.
    expect(result.map.mappings.length).toBeGreaterThan(0);
  });
});
