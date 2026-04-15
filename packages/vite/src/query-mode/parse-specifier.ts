/**
 * parseSpecifier — recognize `?z2f` and `?z2f=<variant>` query-suffix
 * imports, return null for everything else.
 *
 * Single source of truth for what counts as a z2f-handled specifier.
 * Every Vite hook delegates here. Grammar table lives in
 * `contracts/query-specifier.md`.
 */
import { Z2FViteError } from '../errors.js';

export interface ParsedSpecifier {
  kind: 'z2f';
  /** The path portion without the query suffix. */
  path: string;
  /** Variant name (`''` for the bare `?z2f` default). */
  variant: string;
}

const VARIANT_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * Parse a Vite import specifier and decide whether the plugin handles it.
 *
 * Returns:
 * - A {@link ParsedSpecifier} when the specifier carries a `?z2f` query
 *   that is well-formed
 * - `null` when the specifier doesn't reference z2f at all (so other
 *   Vite plugins get their turn via the standard `resolveId` chain)
 *
 * Throws {@link Z2FViteError} when the specifier *intends* to use z2f
 * (contains `z2f` as a query token) but is malformed — composed with
 * other known queries, has an invalid variant name, or uses a reserved
 * internal prefix.
 */
export function parseSpecifier(specifier: string): ParsedSpecifier | null {
  // Empty / no query / no path before `?` → not ours
  const queryIndex = specifier.indexOf('?');
  if (queryIndex <= 0) return null;

  const path = specifier.slice(0, queryIndex);
  const query = specifier.slice(queryIndex + 1);

  // Tokenize the query string by `&`. We're looking for `z2f` as a
  // standalone key (or `z2f=value`), NOT a substring of a different key.
  const tokens = query.split('&');

  let z2fToken: string | undefined;
  const otherTokens: string[] = [];
  for (const token of tokens) {
    const eqIndex = token.indexOf('=');
    const key = eqIndex === -1 ? token : token.slice(0, eqIndex);
    if (key === 'z2f') {
      z2fToken = token;
    } else if (key.length > 0) {
      otherTokens.push(key);
    }
  }

  // No `z2f` token → not ours
  if (z2fToken === undefined) return null;

  // `z2f` combined with other tokens → unsupported composition.
  // The plugin refuses rather than silently picking one to honor.
  if (otherTokens.length > 0) {
    throw new Z2FViteError(
      'Z2F_VITE_QUERY_COMPOSITION_UNSUPPORTED',
      `Specifier '${specifier}' combines '?z2f' with other query keys (${otherTokens.join(', ')}). Combine queries on the same import is not supported — use a separate import statement instead.`
    );
  }

  // Parse the variant value (or empty for bare `?z2f`)
  const eqIndex = z2fToken.indexOf('=');
  if (eqIndex === -1) {
    return { kind: 'z2f', path, variant: '' };
  }

  const variant = z2fToken.slice(eqIndex + 1);

  // Empty variant value (`?z2f=`) is malformed
  if (variant.length === 0) {
    throw new Z2FViteError(
      'Z2F_VITE_INVALID_VARIANT_NAME',
      `Specifier '${specifier}' uses '?z2f=' with an empty variant value. Either drop the '=' to use the default variant, or supply a name matching ${VARIANT_NAME}.`
    );
  }

  // `__generate_` prefix is reserved for generate mode's internal use.
  // The plugin's own generate-mode emitter produces ids of the form
  // `__generate_<positive-int>` (counter scoped per source file), and
  // those round-trip back through this parser when the synthesized
  // import hits the load hook. Allow the strict `__generate_<digits>`
  // form, reject anything else with the prefix as a user-collision
  // attempt.
  if (variant.startsWith('__generate_')) {
    if (!/^__generate_\d+$/.test(variant)) {
      throw new Z2FViteError(
        'Z2F_VITE_INVALID_VARIANT_NAME',
        `Variant name '${variant}' uses the reserved '__generate_' prefix. The '__generate_<n>' form is plugin-internal — pick a different name.`
      );
    }
    return { kind: 'z2f', path, variant };
  }

  if (!VARIANT_NAME.test(variant)) {
    throw new Z2FViteError(
      'Z2F_VITE_INVALID_VARIANT_NAME',
      `Variant name '${variant}' is invalid. Variant names must match ${VARIANT_NAME} (JavaScript identifier rules: starts with letter or underscore, then alphanumerics or underscores).`
    );
  }

  return { kind: 'z2f', path, variant };
}
