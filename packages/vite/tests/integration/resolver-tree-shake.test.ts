import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { build, type Rollup } from 'vite';
import { z2fVite } from '../../src/index.js';

/**
 * Integration: resolver tree-shake (FR-013 / SC-004 / Phase 6).
 *
 * Builds the query-minimal fixture twice — once without optimization
 * and once with `validationLevel: 2` — and asserts:
 *
 *   1. The optimized bundle does NOT contain any `zodResolver(` call
 *      expressions (they were stripped by resolver-strip).
 *   2. The optimized bundle does NOT reference `@hookform/resolvers`
 *      (Rollup tree-shook the now-unused import).
 *   3. The optimized bundle is materially smaller than the baseline
 *      (we don't enforce the 1.5 KB SC-004 target here because that
 *      depends on real react/react-hook-form resolution; just assert
 *      the SOURCE is smaller after the strip).
 *
 * The test bundles `useZodForm.ts` directly so Rollup can actually
 * tree-shake the import statement — exporting only what we care about
 * keeps the test self-contained without bringing react/react-dom into
 * the fixture.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = path.resolve(__dirname, '../fixtures/query-minimal');
// Path to the real useZodForm source — we bundle it through the
// plugin's transform to exercise the strip pass end-to-end.
const USE_ZOD_FORM_PATH = path.resolve(__dirname, '../../../react/src/useZodForm.ts');

let createdFiles: string[] = [];

async function runBuild(options: {
  validationLevel?: 1 | 2 | 3;
}): Promise<{ output: Rollup.RollupOutput; entryFile: string }> {
  // Each build gets a unique entry file inside FIXTURE_ROOT so it
  // resolves react / react-hook-form / @hookform/resolvers via the
  // workspace's hoisted node_modules.
  const entryFile = path.join(FIXTURE_ROOT, `src/strip-entry-${randomUUID().slice(0, 8)}.ts`);
  createdFiles.push(entryFile);
  // Re-export useZodForm so Rollup keeps it in the bundle.
  await fs.writeFile(entryFile, `export { useZodForm } from '${USE_ZOD_FORM_PATH}';\n`);

  const result = await build({
    root: FIXTURE_ROOT,
    configFile: false,
    plugins: [
      z2fVite({
        configOverride: {
          componentName: 'F',
          mode: 'submit',
          ui: 'html',
          ...(options.validationLevel !== undefined
            ? { validationLevel: options.validationLevel }
            : {})
        },
        logLevel: 'silent'
      })
    ],
    logLevel: 'silent',
    build: {
      lib: { entry: entryFile, formats: ['es'], fileName: 'bundle' },
      write: false,
      minify: false,
      rollupOptions: {
        external: (id): boolean => {
          if (id.startsWith('.') || id.startsWith('/')) return false;
          return true;
        }
      }
    }
  });

  const output = Array.isArray(result) ? result[0]! : (result as Rollup.RollupOutput);
  return { output, entryFile };
}

beforeEach(() => {
  createdFiles = [];
});

afterEach(async () => {
  for (const f of createdFiles) {
    await fs.rm(f, { force: true });
  }
});

function joinChunks(output: Rollup.RollupOutput): string {
  return output.output
    .filter((c): c is Rollup.OutputChunk => c.type === 'chunk')
    .map((c) => c.code)
    .join('\n');
}

describe('resolver tree-shake', () => {
  it('baseline build (no optimization) keeps the zodResolver import path', async () => {
    const { output } = await runBuild({});
    const code = joinChunks(output);
    // The unoptimized build retains the zodResolver call expression
    // that the strip pass would otherwise replace.
    expect(code).toContain('zodResolver(');
  });

  it('optimized build (validationLevel: 2) strips every zodResolver call site', async () => {
    const { output } = await runBuild({ validationLevel: 2 });
    const code = joinChunks(output);
    // No more `zodResolver(...)` call expressions anywhere in the output.
    expect(code).not.toMatch(/\bzodResolver\s*\(/);
  });

  it('optimized build does not reference @hookform/resolvers in the bundle', async () => {
    const { output } = await runBuild({ validationLevel: 2 });
    const code = joinChunks(output);
    // Rollup's tree-shaker removes the now-unused import statement once
    // the call expressions are gone.
    expect(code).not.toContain('@hookform/resolvers');
  });

  it('optimized build is materially smaller than the baseline (uncompressed + gzipped)', async () => {
    const baseline = await runBuild({});
    const optimized = await runBuild({ validationLevel: 2 });

    const baselineCode = joinChunks(baseline.output);
    const optimizedCode = joinChunks(optimized.output);

    const rawDelta = baselineCode.length - optimizedCode.length;
    // Uncompressed delta: in the externalized lib build (where
    // @hookform/resolvers is treated as a bare specifier and never
    // bundled), the strip's contribution is only the removed call
    // expressions and the dropped `import { zodResolver }` line —
    // ~50-100 bytes. The full SC-004 1.5KB target is observable in a
    // real app build that inlines the resolver package, but that
    // requires resolving react/@hookform/resolvers through the
    // workspace which this fast-running fixture doesn't do.
    expect(rawDelta).toBeGreaterThan(40);

    // Gzipped delta tracks the same shape — non-zero confirms the
    // strip actually removed content rather than reshuffling it.
    const baselineGz = gzipSync(baselineCode).length;
    const optimizedGz = gzipSync(optimizedCode).length;
    const gzDelta = baselineGz - optimizedGz;
    expect(gzDelta).toBeGreaterThan(10);
  });
});
