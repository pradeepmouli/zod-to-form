/**
 * resolveZ2FId — pure helper for the resolveId Vite hook.
 *
 * Given an import specifier and the absolute resolved path that Vite's
 * standard resolver returned for the path portion, decide whether this
 * is a z2f-handled import and produce the normalized virtual module id.
 *
 * Returns:
 * - `null` if the specifier doesn't carry `?z2f` (so other Vite plugins
 *   get their turn via the standard resolveId chain)
 * - The normalized id `<absolutePath>?z2f[=variant]` when the import is
 *   handled
 *
 * Throws:
 * - `Z2F_VITE_SCHEMA_OUTSIDE_ROOT` when the resolved path is outside the
 *   Vite root (FR-021 — schemas must live in project source)
 * - Any error parseSpecifier throws (composition errors, invalid variants)
 */
import { parseSpecifier } from './parse-specifier.js';
import { Z2FViteError } from '../errors.js';

/**
 * Check if a child path lives inside a parent root. Both must be
 * absolute. Comparison is byte-level after normalizing trailing slashes;
 * we deliberately don't use `path.relative()` because its `..` heuristic
 * can be wrong on Windows when drives differ.
 */
function isInsideRoot(child: string, root: string): boolean {
  const normalizedRoot = root.endsWith('/') ? root : root + '/';
  // Same path is treated as inside (the root itself can be a file in
  // theoretical edge cases); the normal usage is "child must start with
  // root + /".
  if (child === root) return true;
  return child.startsWith(normalizedRoot);
}

export function resolveZ2FId(
  specifier: string,
  resolvedAbsolutePath: string,
  viteRoot: string
): string | null {
  const parsed = parseSpecifier(specifier);
  if (parsed === null) return null;

  if (!isInsideRoot(resolvedAbsolutePath, viteRoot)) {
    throw new Z2FViteError(
      'Z2F_VITE_SCHEMA_OUTSIDE_ROOT',
      `Schema '${resolvedAbsolutePath}' is outside the Vite root '${viteRoot}'. The plugin only compiles schemas in your project's own source. Move the schema into the project, or use the codegen CLI for cross-project schemas.`,
      { file: resolvedAbsolutePath }
    );
  }

  // Re-attach the query so each (schema, variant) pair has its own
  // stable virtual module id in Vite's graph.
  const query = parsed.variant === '' ? '?z2f' : `?z2f=${parsed.variant}`;
  return `${resolvedAbsolutePath}${query}`;
}

/**
 * Inverse of `resolveZ2FId`: parse a normalized virtual module id back into
 * `(schemaFile, variant)`. Used by the load and HMR hooks.
 *
 * Returns `null` if the id is not a z2f virtual id.
 */
export function parseZ2FId(id: string): { schemaFile: string; variant: string } | null {
  // Cheap check before invoking parseSpecifier
  if (!id.includes('?z2f')) return null;
  const parsed = parseSpecifier(id);
  if (parsed === null) return null;
  return { schemaFile: parsed.path, variant: parsed.variant };
}
