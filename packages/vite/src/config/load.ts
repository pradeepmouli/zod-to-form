/**
 * Config loading + variant merging.
 *
 * The Vite plugin uses Vite's own module loaders (`server.ssrLoadModule`
 * in dev, `this.load` in build) to load `z2f.config.ts` — see research R2.
 * This file's responsibility is the pure parts of that pipeline:
 *
 * - Build the effective config for a given variant by merging the variant
 *   override on top of the global config
 * - Validate that the loaded config has the shape of a `CodegenConfig`
 * - `selectExport` — pick the right Zod schema from a module namespace,
 *   throwing on ambiguity
 * - `canonicalizeForCache` — produce the SHA-256 cache key for a target
 */
import { createHash } from 'node:crypto';
import { canonicalizeConfig } from '@zod-to-form/core';
import type { CodegenConfig } from '@zod-to-form/core';
import type { $ZodType } from 'zod/v4/core';
import { Z2FViteError } from '../errors.js';
import type { Z2FViteConfig } from '../types.js';

// ─── Effective config per variant ────────────────────────────────────

/**
 * Build the effective `CodegenConfig` for a given (config, variant) pair.
 *
 * The bare default variant (`''`) returns the config as-is (minus the
 * `variants` field, which has no business in `generateFormComponent`'s
 * input). A named variant looks up `config.variants[variant]` and merges
 * it on top of the global fields. Unknown variants throw.
 */
/**
 * The plugin-side effective config — same shape as `CodegenConfig` except
 * `exportName` may still be empty (auto-detect). `compileTarget` promotes
 * it to a real name via `selectExport` before handing off to codegen.
 */
export type EffectiveZ2FConfig = Omit<CodegenConfig, 'exportName'> & {
  exportName?: string;
};

export function buildEffectiveConfig(config: Z2FViteConfig, variant: string): EffectiveZ2FConfig {
  // Strip the plugin-only `variants` field — generateFormComponent doesn't
  // know about it and would copy it through.
  const { variants, ...base } = config;

  // Default variant + plugin-internal `__generate_<n>` variants always
  // resolve to the base config. Generate-mode synthesizes one variant per
  // `<ZodForm>` site to give each generated component its own cache
  // entry, but they share the user's global config — there's no per-site
  // override mechanism in v1.
  if (variant === '' || /^__generate_\d+$/.test(variant)) {
    return base;
  }

  if (variants === undefined || variants[variant] === undefined) {
    const known = variants ? Object.keys(variants).join(', ') : '(none declared)';
    throw new Z2FViteError(
      'Z2F_VITE_UNKNOWN_VARIANT',
      `Variant '${variant}' is not declared in z2f.config.ts. Known variants: ${known}.`
    );
  }

  // Per-variant overrides win over global fields. Only top-level keys are
  // merged — there's no deep merge of nested objects like componentConfig,
  // because variants typically swap whole sub-objects rather than patch them.
  return { ...base, ...variants[variant] };
}

// ─── Schema export selection ─────────────────────────────────────────

/**
 * Module namespace returned by Vite's `ssrLoadModule`. The shape is
 * `Record<string, unknown>` — each named export is a property whose value
 * is whatever the user wrote.
 */
export type ModuleNamespace = Record<string, unknown>;

/**
 * Structural Zod-v4 check: the value is a non-null object whose `_zod`
 * property is itself a non-null object. Zod v4 attaches its internal
 * machinery under `_zod`, so this is the standard duck-type.
 *
 * The predicate narrows to `$ZodType` because `walkSchema` from core and
 * all downstream codegen helpers consume that interface — tightening here
 * eliminates `as $ZodType` casts at every call site.
 *
 * We deliberately avoid a runtime `import` of zod: the user's project owns
 * the zod version, and the plugin mustn't couple to a specific copy.
 */
function isZodSchema(value: unknown): value is $ZodType {
  if (typeof value !== 'object' || value === null) return false;
  const zodInternal = (value as { _zod?: unknown })._zod;
  return typeof zodInternal === 'object' && zodInternal !== null;
}

/**
 * Pick the named export from a module namespace that should be compiled
 * into a form. Resolution order:
 *
 * 1. If `expectedName` is provided, return that export (or throw if it
 *    doesn't exist or isn't a Zod schema).
 * 2. Otherwise, find every named export that looks like a Zod schema.
 *    If exactly one matches, return it. If zero or more than one match,
 *    throw with a clear diagnostic — the user must disambiguate via
 *    `config.exportName` or `config.variants[name].exportName`.
 *
 * Default exports are NOT considered — the contract is "named export
 * matching the convention". This avoids surprising the user when they
 * have both a default-exported helper and a named schema.
 */
export function selectExport(
  namespace: ModuleNamespace,
  schemaFile: string,
  expectedName?: string
): { name: string; schema: $ZodType } {
  if (expectedName !== undefined) {
    const value = namespace[expectedName];
    if (value === undefined) {
      throw new Z2FViteError(
        'Z2F_VITE_SCHEMA_NOT_FOUND',
        `Schema export '${expectedName}' not found in '${schemaFile}'. Available named exports: ${Object.keys(namespace).join(', ') || '(none)'}.`,
        { file: schemaFile }
      );
    }
    if (!isZodSchema(value)) {
      throw new Z2FViteError(
        'Z2F_VITE_SCHEMA_NOT_ZOD',
        `Export '${expectedName}' from '${schemaFile}' is not a Zod v4 schema (no '_zod' property). Make sure the export is a Zod schema instance, not a constructor or plain object.`,
        { file: schemaFile }
      );
    }
    return { name: expectedName, schema: value };
  }

  // Auto-detect mode: find every Zod-shaped named export.
  const candidates: Array<{ name: string; schema: $ZodType }> = [];
  for (const [name, value] of Object.entries(namespace)) {
    if (name === 'default') continue; // skip default exports per the contract above
    if (isZodSchema(value)) {
      candidates.push({ name, schema: value });
    }
  }

  if (candidates.length === 0) {
    throw new Z2FViteError(
      'Z2F_VITE_SCHEMA_NOT_FOUND',
      `No Zod v4 schema exports found in '${schemaFile}'. Default exports are not considered — re-export as a named export (e.g. 'export const signupSchema = z.object({ ... });').`,
      { file: schemaFile }
    );
  }

  if (candidates.length > 1) {
    throw new Z2FViteError(
      'Z2F_VITE_AMBIGUOUS_EXPORT',
      `Schema file '${schemaFile}' has multiple Zod schema exports (${candidates.map((c) => c.name).join(', ')}) and no 'exportName' is configured. Set 'exportName' in z2f.config.ts (or in a variant) to disambiguate.`,
      { file: schemaFile }
    );
  }

  return candidates[0]!;
}

// ─── Cache key helper ────────────────────────────────────────────────

/**
 * Compute a stable cache key from a config-shaped value. Consumers (the
 * `CompilationCache` keying logic in `plugin.ts`) should call this rather
 * than canonicalizing themselves so the hashing strategy stays in one
 * place. The parameter is widened beyond `CodegenConfig` because the
 * plugin hashes its own `Z2FViteConfig` (which adds `variants`) — and
 * `canonicalizeConfig` walks structurally, so either shape round-trips.
 *
 * Truncated to 16 hex chars (64 bits): collision-resistant enough for a
 * per-project cache keyed by (schemaFile, variant) pairs and keeps the
 * resulting virtual-module query strings short.
 */
export function configHash(config: CodegenConfig | Record<string, unknown>): string {
  const canonical = canonicalizeConfig(config as CodegenConfig);
  return createHash('sha256').update(canonical).digest('hex').slice(0, 16);
}
