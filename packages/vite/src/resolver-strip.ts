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

/**
 * Rewrite every `zodResolver(...)` call expression in `source` to
 * `undefined`. Uses a regex sweep rather than an AST visitor because
 * the call shape in `useZodForm` is fixed and the strip is a one-shot
 * source-level rewrite — pulling babel back in just for two replacements
 * would be massively over-engineered.
 *
 * The regex matches `zodResolver(` followed by any balanced argument
 * list up to the matching close-paren. Balance is tracked manually
 * (regex can't handle balanced parens, but we can scan forward from
 * the opening `(` once we've located it).
 */
export function stripResolver(input: ResolverStripInput): ResolverStripOutput {
  const { source } = input;

  // Substring fast-path — most files don't contain `zodResolver`, and
  // even useZodForm is small enough that re-scanning the source is fine.
  if (!source.includes('zodResolver(')) {
    const ms = new MagicString(source);
    return { code: source, map: ms.generateMap({ hires: true }), rewritten: 0 };
  }

  const ms = new MagicString(source);
  let rewritten = 0;

  // Drop the `import { zodResolver } from '@hookform/resolvers/zod'`
  // line entirely. Rollup is conservative about side-effect-only
  // imports — even after every call site becomes `undefined`, the
  // bare `import '@hookform/resolvers/zod'` survives in the bundle
  // unless we remove it ourselves. Match the import statement (with
  // optional trailing semicolon and newline) and erase it.
  const importRegex =
    /^\s*import\s*\{\s*zodResolver\s*\}\s*from\s*['"]@hookform\/resolvers\/zod['"]\s*;?\s*\n?/m;
  const importMatch = importRegex.exec(source);
  if (importMatch !== null && importMatch.index !== undefined) {
    ms.remove(importMatch.index, importMatch.index + importMatch[0].length);
  }

  // Locate every `zodResolver(` (followed by anything up to the matching
  // close paren) and replace the entire call expression with `undefined`.
  // Walk from left to right so each replacement preserves the byte
  // offsets of unprocessed regions.
  let cursor = 0;
  while (cursor < source.length) {
    const start = source.indexOf('zodResolver(', cursor);
    if (start === -1) break;

    // Skip occurrences that aren't an actual call expression (e.g. a
    // string literal or comment containing the substring). Heuristic:
    // the previous non-whitespace character must be one of the
    // operators/punctuation that can precede a call: `(`, `:`, `?`,
    // `,`, `=`, `>`, `[`, `;`, `{`, `}`, `+`, `&`, `|`, `!`, or the
    // start of the file. This excludes `'zodResolver(' as a string
    // literal payload`.
    let prev = start - 1;
    while (prev >= 0 && /\s/.test(source[prev]!)) prev -= 1;
    const prevChar = prev >= 0 ? source[prev]! : '';
    const isCallContext =
      prev < 0 ||
      '(:?,=>[;{}+&|!'.includes(prevChar) ||
      // `return zodResolver(` and `await zodResolver(` are also call sites;
      // accept any preceding alpha-only keyword via word-boundary match.
      /[a-z]/.test(prevChar);
    if (!isCallContext) {
      cursor = start + 'zodResolver('.length;
      continue;
    }

    // Find the matching close-paren via single-pass depth tracking.
    let depth = 1;
    let i = start + 'zodResolver('.length;
    while (i < source.length && depth > 0) {
      const c = source[i]!;
      if (c === '(') depth += 1;
      else if (c === ')') depth -= 1;
      i += 1;
    }
    if (depth !== 0) {
      // Unbalanced — bail to avoid mangling. The user's normal Vite
      // pipeline will surface the syntax error elsewhere.
      break;
    }

    ms.overwrite(start, i, 'undefined');
    rewritten += 1;
    cursor = i;
  }

  return {
    code: ms.toString(),
    map: ms.generateMap({ hires: true }),
    rewritten
  };
}
