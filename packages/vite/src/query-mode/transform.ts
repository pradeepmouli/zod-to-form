/**
 * compileTarget — pure side of the `load` hook.
 *
 * Given an already-loaded schema module namespace (whoever's calling this
 * is responsible for getting it via `ssrLoadModule` or `this.load`),
 * produces the generated form source string and optional `.lite.ts` source.
 *
 * No I/O. No Vite context. No caching. The dispatching `load` hook in
 * `plugin.ts` handles all of that.
 */
import path from 'node:path';
import { walkSchema } from '@zod-to-form/core';
import type { CodegenConfig, SchemaLiteInfo, WalkResult } from '@zod-to-form/core';
import { generateFormComponent, generateSchemaLiteFile } from '@zod-to-form/codegen';
import type { $ZodType } from 'zod/v4/core';
import { buildEffectiveConfig, selectExport } from '../config/load.js';
import type { ModuleNamespace } from '../config/load.js';
import type { Z2FViteConfig } from '../types.js';

/**
 * Default `schemaImportPath` for query-mode targets when the user did not
 * configure one explicitly. The generated module's id is
 * `<schemaFile>?z2f`, so a relative import to the schema file's basename
 * (without extension) resolves back to the original schema through Vite's
 * normal extension auto-resolution. This is what lets `import { signupSchema }
 * from './signup'` work from inside the virtual module.
 */
function defaultSchemaImportPath(schemaFile: string): string {
  const base = path.basename(schemaFile, path.extname(schemaFile));
  return `./${base}`;
}

function isZodType(value: unknown): value is $ZodType {
  if (typeof value !== 'object' || value === null) return false;
  const internal = (value as { _zod?: unknown })._zod;
  return typeof internal === 'object' && internal !== null;
}

export interface CompileTargetInput {
  /** The module namespace returned by `ssrLoadModule` / `this.load`. */
  namespace: ModuleNamespace;
  /** Absolute path to the schema source file (used in error messages). */
  schemaFile: string;
  /** Variant name (`''` for the default target). */
  variant: string;
  /** The full plugin-side config, before variant merging. */
  config: Z2FViteConfig;
}

export interface CompileTargetResult {
  /** The generated `.tsx` source string. */
  generatedSource: string;
  /** The companion `.lite.ts` source, or `null` if no top-level effects. */
  schemaLiteSource: string | null;
  /** The effective config used for this compilation (post variant merge). */
  effectiveConfig: CodegenConfig;
  /** The selected export name from the schema module namespace. */
  exportName: string;
}

/**
 * Pick the schema, walk it, generate the form. This is the function every
 * other entry point (load hook, build pipeline, integration tests) calls.
 *
 * Note on the type cast for `walkSchema`: `walkSchema` accepts a `$ZodType`
 * and we just verified the value structurally has `_zod`, so the cast is
 * sound. The structural check happens inside `selectExport`.
 */
export function compileTarget(input: CompileTargetInput): CompileTargetResult {
  const { namespace, schemaFile, variant, config } = input;

  const effectiveConfig = buildEffectiveConfig(config, variant);
  const expectedName = effectiveConfig.exportName || undefined;

  const { name, schema } = selectExport(namespace, schemaFile, expectedName);
  // selectExport's return type is $ZodType, so walkSchema needs no cast.
  // Runtime guard kept as a belt-and-braces check against a future refactor
  // accidentally relaxing selectExport's predicate.
  if (!isZodType(schema)) {
    throw new Error(`Internal: selectExport returned a non-$ZodType value for '${name}'`);
  }

  // Walk the schema, optionally with the optimization level the user
  // configured. The result type depends on whether optimization is set.
  const optimization = effectiveConfig.validationLevel
    ? { optimization: { level: effectiveConfig.validationLevel } }
    : undefined;

  let fields;
  let schemaLite: $ZodType | null = null;
  let schemaLiteInfo: SchemaLiteInfo = null;

  if (optimization) {
    const result = walkSchema(schema, optimization) as WalkResult;
    fields = result.fields;
    schemaLite = result.schemaLite;
    schemaLiteInfo = result.schemaLiteInfo;
  } else {
    fields = walkSchema(schema);
  }

  // Build the codegen-facing config: take the effective config but
  // overwrite exportName with the actually-selected name (so auto-detect
  // mode produces the right import statements), inject the default
  // schemaImportPath when the user didn't supply one, and inject
  // schemaLite info if optimization produced any effects.
  //
  // Rewrite-mode variants always emit under the fixed component name
  // `Form` regardless of `componentName`. The synthesized rewrite-mode
  // import (`import { Form as _z2fGeneratedForm_<n> }`) is decoupled
  // from the user's chosen name this way — the rewrite emitter can hard-
  // code `Form` instead of threading the user's configured name through
  // the AST visitor.
  const isRewriteVariant = /^__rewrite_\d+$/.test(variant);
  const codegenConfig: CodegenConfig = {
    ...effectiveConfig,
    exportName: name,
    componentName: isRewriteVariant ? 'Form' : (effectiveConfig.componentName ?? 'Form'),
    schemaImportPath: effectiveConfig.schemaImportPath ?? defaultSchemaImportPath(schemaFile),
    schemaLite: schemaLite ?? undefined,
    schemaLiteInfo: schemaLiteInfo ?? undefined
  };

  const generatedSource = generateFormComponent(fields, codegenConfig);

  // Generate the companion .lite.ts file if optimization produced effects.
  const schemaLiteSource =
    schemaLiteInfo !== null
      ? generateSchemaLiteFile(codegenConfig.schemaImportPath ?? './schema', name, schemaLiteInfo)
      : null;

  return {
    generatedSource,
    schemaLiteSource,
    effectiveConfig: codegenConfig,
    exportName: name
  };
}
