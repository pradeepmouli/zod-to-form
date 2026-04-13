/**
 * Build-time fixture generator for the codegen-vs-runtime benchmark.
 *
 * Runs the full codegen pipeline for small/medium/large schemas at each
 * optimization level and writes the generated components + schemaLite files
 * to ./generated/. These files are then statically imported by the
 * codegen-vs-runtime bench so we measure the ACTUAL generated code, not
 * a simulation.
 *
 * Invocation: `pnpm --filter @zod-to-form/react exec tsx tests/performance/gen-fixtures.ts`
 * (automatically run by the root `bench:browser` script)
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { walkSchema } from '@zod-to-form/core';
import type { FormField, WalkResult } from '@zod-to-form/core';
import { generateFormComponent, generateSchemaLiteFile } from '@zod-to-form/codegen';
import type { ZodObject } from 'zod';
import {
  smallSafeSchema as smallSchema,
  mediumSafeSchema as mediumSchema,
  largeSafeSchema as largeSchema
} from './codegen-safe-schemas.js';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, 'generated');
// Clear stale fixtures (e.g. .lite.ts files from previous runs with different
// schemas) so the generated directory only contains files from this run.
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

// ─── schema.ts: re-exports the bench schemas so generated files can import them

const schemaFile = `// GENERATED — do not edit
export { smallSafeSchema as SmallSchema } from '../codegen-safe-schemas.js';
export { mediumSafeSchema as MediumSchema } from '../codegen-safe-schemas.js';
export { largeSafeSchema as LargeSchema } from '../codegen-safe-schemas.js';
`;
writeFileSync(resolve(outDir, 'schema.ts'), schemaFile);

// ─── Generate one (schema, level) pair ──────────────────────────────

type Level = 0 | 1 | 2;

function levelSuffix(level: Level): string {
  return level === 0 ? 'None' : `L${level}`;
}

function writeVariant(
  name: 'Small' | 'Medium' | 'Large',
  exportName: 'SmallSchema' | 'MediumSchema' | 'LargeSchema',
  schema: ZodObject,
  level: Level
): string {
  const componentName = `${name}${levelSuffix(level)}Form`;
  const walkOptions = level === 0 ? undefined : { optimization: { level: level as 1 | 2 } };
  const walkResult =
    level === 0
      ? {
          fields: walkSchema(schema as never) as FormField[],
          schemaLite: null,
          schemaLiteInfo: null
        }
      : (walkSchema(schema as never, walkOptions!) as WalkResult);

  const fields = walkResult.fields;
  const schemaLite = level === 0 ? null : walkResult.schemaLite;
  const schemaLiteInfo = level === 0 ? null : walkResult.schemaLiteInfo;

  const tsx = generateFormComponent(fields, {
    exportName,
    componentName,
    mode: 'submit',
    ui: 'html',
    schemaImportPath: './schema.js',
    validationLevel: level === 0 ? undefined : (level as 1 | 2),
    schemaLite: schemaLite ?? undefined,
    schemaLiteInfo: schemaLiteInfo ?? undefined
  });

  writeFileSync(resolve(outDir, `${componentName}.tsx`), tsx);

  // Generate companion .lite.ts file if schemaLite exists.
  // generateSchemaLiteFile returns null when info is null (no top-level effects).
  if (level !== 0 && schemaLiteInfo) {
    const liteSource = generateSchemaLiteFile('./schema.js', exportName, schemaLiteInfo);
    if (liteSource) {
      writeFileSync(resolve(outDir, `${componentName}.lite.ts`), liteSource);
    }
  }

  return componentName;
}

const levels: Level[] = [0, 1, 2];

for (const level of levels) {
  writeVariant('Small', 'SmallSchema', smallSchema as unknown as ZodObject, level);
  writeVariant('Medium', 'MediumSchema', mediumSchema as unknown as ZodObject, level);
  writeVariant('Large', 'LargeSchema', largeSchema as unknown as ZodObject, level);
}

console.log(`Generated fixtures in ${outDir}`);
