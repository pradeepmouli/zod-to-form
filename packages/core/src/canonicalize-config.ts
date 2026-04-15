/**
 * canonicalizeConfig — produce a deterministic, pure string representation
 * of a {@link CodegenConfig}.
 *
 * The output is designed to be hashed (e.g., SHA-256 by the Vite plugin) to
 * form `CompilationCache` keys. Two configs that are structurally equal —
 * regardless of key insertion order — MUST produce identical output. Two
 * configs that differ in any meaningful field MUST produce different output.
 *
 * Semantics:
 * - Object keys are sorted lexicographically at every nesting level.
 * - Arrays preserve their source order (arrays carry ordering semantics).
 * - `undefined` fields are omitted (matching `JSON.stringify`).
 * - `null` is preserved distinctly from `undefined`.
 * - Numbers, booleans, and strings are serialized via `JSON.stringify`.
 * - Special values that don't serialize (e.g., `$ZodType` instances on
 *   `schemaLite`) are replaced by a stable sentinel so two references to
 *   the same schema don't produce divergent outputs.
 *
 * This function is pure, synchronous, has no I/O, and has zero runtime
 * dependencies — safe to call from both Node and browser contexts.
 */
import type { CodegenConfig } from './config-types.js';

/**
 * Sentinel returned for values that cannot be serialized deterministically
 * but whose identity does not affect codegen output (e.g. a Zod schema
 * reference). Using a constant string ensures cache keys stay stable.
 */
const OPAQUE_SENTINEL = '__opaque__';

function canonicalize(value: unknown): unknown {
  // null is meaningful; undefined becomes "omit this key" at the object level
  if (value === null) return null;
  if (value === undefined) return undefined;

  // Primitives pass through
  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean') return value;

  // Functions, symbols, and bigints are opaque
  if (t === 'function' || t === 'symbol' || t === 'bigint') {
    return OPAQUE_SENTINEL;
  }

  // Arrays preserve order, recurse element-wise
  if (Array.isArray(value)) {
    return value.map((item) => canonicalize(item));
  }

  // Zod schemas (identified structurally via _zod) are opaque — their
  // identity does not affect codegen output, and they contain non-enumerable
  // internals that JSON.stringify can't walk deterministically.
  if (typeof (value as { _zod?: unknown })._zod !== 'undefined') {
    return OPAQUE_SENTINEL;
  }

  // Plain objects: sort keys lexicographically, recurse, omit undefined values
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

  const out: Record<string, unknown> = {};
  for (const [k, v] of entries) {
    out[k] = canonicalize(v);
  }
  return out;
}

/**
 * Serialize a {@link CodegenConfig} to a canonical string suitable for
 * hashing into a cache key.
 */
export function canonicalizeConfig(config: CodegenConfig): string {
  return JSON.stringify(canonicalize(config));
}
