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
import { walkSchema } from '@zod-to-form/core';
import type { CodegenConfig, SchemaLiteInfo, WalkResult } from '@zod-to-form/core';
import { generateFormComponent, generateSchemaLiteFile } from '@zod-to-form/codegen';
import type { $ZodType } from 'zod/v4/core';
import { buildEffectiveConfig, selectExport } from '../config/load.js';
import type { ModuleNamespace } from '../config/load.js';
import type { Z2FViteConfig } from '../types.js';

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
  const expectedName =
    effectiveConfig.exportName !== '' && effectiveConfig.exportName !== undefined
      ? effectiveConfig.exportName
      : undefined;

  const { name, schema } = selectExport(namespace, schemaFile, expectedName);

  // Walk the schema, optionally with the optimization level the user
  // configured. The result type depends on whether optimization is set.
  const optimization = effectiveConfig.validationLevel
    ? { optimization: { level: effectiveConfig.validationLevel } }
    : undefined;

  let fields;
  let schemaLite: $ZodType | null = null;
  let schemaLiteInfo: SchemaLiteInfo = null;

  if (optimization) {
    const result = walkSchema(schema as $ZodType, optimization) as WalkResult;
    fields = result.fields;
    schemaLite = result.schemaLite;
    schemaLiteInfo = result.schemaLiteInfo;
  } else {
    fields = walkSchema(schema as $ZodType);
  }

  // Build the codegen-facing config: take the effective config but
  // overwrite exportName with the actually-selected name (so auto-detect
  // mode produces the right import statements) and inject schemaLite
  // info if optimization produced any effects.
  const codegenConfig: CodegenConfig = {
    ...effectiveConfig,
    exportName: name,
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
