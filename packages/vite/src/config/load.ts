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
export function buildEffectiveConfig(config: Z2FViteConfig, variant: string): CodegenConfig {
  // Strip the plugin-only `variants` field — generateFormComponent doesn't
  // know about it and would copy it through.
  const { variants, ...base } = config;

  if (variant === '') {
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
 * Structural Zod-v4 check: the value has a `_zod` property. We deliberately
 * don't import zod here — the user's project provides it, and the version
 * the plugin sees might differ from the one zod-to-form pins.
 */
function isZodSchema(value: unknown): value is { _zod: unknown } {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { _zod?: unknown })._zod !== 'undefined'
  );
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
): { name: string; schema: unknown } {
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
  const candidates: Array<{ name: string; schema: unknown }> = [];
  for (const [name, value] of Object.entries(namespace)) {
    if (name === 'default') continue; // skip default exports per the contract above
    if (isZodSchema(value)) {
      candidates.push({ name, schema: value });
    }
  }

  if (candidates.length === 0) {
    throw new Z2FViteError(
      'Z2F_VITE_SCHEMA_NOT_FOUND',
      `No Zod v4 schema exports found in '${schemaFile}'. Make sure the file exports at least one named Zod schema (e.g. 'export const signupSchema = z.object({ ... });').`,
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
 * Compute a stable cache key from an effective config. Consumers (the
 * `CompilationCache` keying logic in `plugin.ts`) should call this rather
 * than canonicalizing themselves so the hashing strategy stays in one
 * place.
 */
export function configHash(config: CodegenConfig): string {
  const canonical = canonicalizeConfig(config);
  return createHash('sha256').update(canonical).digest('hex').slice(0, 16);
}
