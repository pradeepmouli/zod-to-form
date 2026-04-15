/**
 * resolver-strip — build-mode pass that eliminates `zodResolver` from the
 * `@zod-to-form/react` `useZodForm` hook when the user has validation
 * optimization enabled (FR-013).
 *
 * The runtime hook keeps a static `import { zodResolver } from
 * '@hookform/resolvers/zod'` so non-optimized users get the resolver via
 * normal ESM evaluation. When optimization is on, every call site sits
 * inside an `isOptimized ? undefined : zodResolver(...)` ternary, and
 * the call is dead code — but Rollup's tree-shaker can't prove that
 * statically because the ternary's condition is a runtime value.
 *
 * This pure helper rewrites every `zodResolver(rhfCast(schema))` call
 * in `useZodForm` source to a literal `undefined`. After the rewrite
 * the import has zero remaining references, and Rollup eliminates the
 * import statement automatically — closing the gzipped delta the
 * benchmark page asserts.
 *
 * Pure: takes source + a "should-strip" flag, returns transformed source
 * + sourcemap. No I/O, no plugin context. The plugin's `transform` hook
 * decides WHEN to call it based on file id + config.
 */
import MagicString from 'magic-string';
import { Z2FViteError } from './errors.js';

export interface ResolverStripInput {
  /** The source code of the file (typically `useZodForm.{ts,js}`). */
  source: string;
}

export interface ResolverStripOutput {
  /** Transformed code (or original if there was nothing to strip). */
  code: string;
  /** Magic-string sourcemap (hires). */
  map: ReturnType<MagicString['generateMap']>;
  /** Number of `zodResolver(...)` call sites the strip replaced. */
  rewritten: number;
}

/**
 * Detect whether a Vite/Rollup module id refers to the `useZodForm` hook
 * source. We accept any extension (.ts / .tsx / .js / .mjs / .cjs) so
 * the strip works equally well in dev (raw .ts) and build (transpiled .js).
 */
export function isUseZodFormId(id: string): boolean {
  // Strip query string and normalize separators so the basename check
  // survives on Windows.
  const queryIdx = id.indexOf('?');
  const path = (queryIdx === -1 ? id : id.slice(0, queryIdx)).replace(/\\/g, '/');
  return /(^|\/)useZodForm\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(path);
}

/** A single `zodResolver(...)` call expression located by the scanner. */
interface CallSite {
  /** Byte offset of the leading `z` in `zodResolver`. */
  start: number;
  /** Byte offset just past the matching close-paren. */
  end: number;
}

/**
 * Locate every `zodResolver(...)` call expression in `source`. Returns
 * the call sites in source order, or `null` if any candidate is unbalanced
 * — callers MUST treat `null` as "do not rewrite this file" (we can't
 * partially rewrite without leaving a corrupt half-edited result).
 *
 * The scanner is kept separate from the rewriter so we can run a full
 * pass before any `magic-string` mutation. That's the contract that
 * prevents the unbalanced-paren bail from leaving the file half-stripped.
 */
function scanCallSites(source: string): CallSite[] | null {
  const sites: CallSite[] = [];
  let cursor = 0;
  const NEEDLE = 'zodResolver(';

  while (cursor < source.length) {
    const start = source.indexOf(NEEDLE, cursor);
    if (start === -1) break;

    // Word-boundary guard: reject when the preceding character is part
    // of an identifier (so `myzodResolver(`, `_zodResolver(`, etc. are
    // not matched). The previous character is checked DIRECTLY (no
    // whitespace skip) — `foozodResolver(` should fail even though
    // there's no whitespace separator.
    const prev = start === 0 ? '' : source[start - 1]!;
    const isIdentifierContinuation = prev !== '' && /[A-Za-z0-9_$]/.test(prev);
    if (isIdentifierContinuation) {
      cursor = start + NEEDLE.length;
      continue;
    }

    // Find the matching close-paren via single-pass depth tracking.
    let depth = 1;
    let i = start + NEEDLE.length;
    while (i < source.length && depth > 0) {
      const c = source[i]!;
      if (c === '(') depth += 1;
      else if (c === ')') depth -= 1;
      i += 1;
    }
    if (depth !== 0) {
      // Unbalanced. Bail with `null` so the caller refuses to rewrite
      // anything in this file rather than leaving a half-edited result.
      return null;
    }

    sites.push({ start, end: i });
    cursor = i;
  }

  return sites;
}

/**
 * Rewrite every `zodResolver(...)` call expression in `source` to
 * `undefined` AND remove the now-unused
 * `import { zodResolver } from '@hookform/resolvers/zod'` statement.
 *
 * Two-pass: first locate every call site (validates balanced parens
 * across the whole file), then apply edits via magic-string. If the
 * scan reports unbalanced parens we throw `Z2F_VITE_RESOLVER_STRIP_FAILED`
 * — partial rewrites would corrupt the file silently.
 *
 * Uses a regex sweep + manual paren balancing rather than an AST visitor
 * because the call shape in `useZodForm` is fixed and the strip is a
 * one-shot source-level rewrite — pulling Babel back in just for two
 * replacements would be massively over-engineered.
 */
export function stripResolver(input: ResolverStripInput): ResolverStripOutput {
  const { source } = input;

  // Substring fast-path — most files don't contain `zodResolver`, and
  // even useZodForm is small enough that re-scanning the source is fine.
  if (!source.includes('zodResolver(')) {
    const ms = new MagicString(source);
    return { code: source, map: ms.generateMap({ hires: true }), rewritten: 0 };
  }

  // Pass 1: locate every call site. Bail BEFORE any magic-string mutation
  // if the scan can't find a matching close-paren.
  const sites = scanCallSites(source);
  if (sites === null) {
    throw new Z2FViteError(
      'Z2F_VITE_RESOLVER_STRIP_FAILED',
      'resolver-strip aborted: an unbalanced zodResolver(...) call was encountered. Refusing to apply a partial rewrite. Check the source for syntax errors.'
    );
  }

  if (sites.length === 0) {
    const ms = new MagicString(source);
    return { code: source, map: ms.generateMap({ hires: true }), rewritten: 0 };
  }

  // Pass 2: apply edits.
  const ms = new MagicString(source);

  // Drop the `import { zodResolver } from '@hookform/resolvers/zod'`
  // line entirely. Rollup is conservative about side-effect-only
  // imports — even after every call site becomes `undefined`, the
  // bare `import '@hookform/resolvers/zod'` survives in the bundle
  // unless we remove it ourselves.
  const importRegex =
    /^\s*import\s*\{\s*zodResolver\s*\}\s*from\s*['"]@hookform\/resolvers\/zod['"]\s*;?\s*\n?/m;
  const importMatch = importRegex.exec(source);
  if (importMatch !== null) {
    ms.remove(importMatch.index, importMatch.index + importMatch[0].length);
  }

  for (const site of sites) {
    ms.overwrite(site.start, site.end, 'undefined');
  }

  return {
    code: ms.toString(),
    map: ms.generateMap({ hires: true }),
    rewritten: sites.length
  };
}
