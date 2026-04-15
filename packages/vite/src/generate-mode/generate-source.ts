/**
 * generateSource — apply magic-string edits for each ResolvedSite.
 *
 * Three operations per site:
 *
 *   1. Replace the opening tag's `ZodForm` identifier with the generated
 *      identifier (e.g., `_z2fGeneratedForm_1`). The schema attribute is
 *      removed; all other attributes and children are preserved verbatim.
 *   2. Replace the closing tag's identifier (if any).
 *   3. Append a single `import { Form as <generatedId> } from
 *      '<schemaPath>?z2f=__generate_<n>'` after the existing imports.
 *
 * Idempotent by construction: the substring fast-path in `scan-jsx`
 * checks for `'ZodForm'`, which the rewrite removes — running the
 * pipeline twice on the same source produces byte-identical output
 * because the second pass has nothing to rewrite.
 */
import MagicString from 'magic-string';
import type { CandidateAttribute } from './scan-jsx.js';
import type { ResolvedSite } from './resolve-schema.js';

export interface GenerateSourceInput {
  source: string;
  resolved: ResolvedSite[];
}

export interface GenerateSourceOutput {
  /** The transformed source (or the original, if there was nothing to do). */
  code: string;
  /** Hi-res sourcemap from magic-string, suitable for Vite. */
  map: ReturnType<MagicString['generateMap']>;
  /** Number of sites actually rewritten (== `resolved.length`). */
  rewritten: number;
}

export function generateSource(input: GenerateSourceInput): GenerateSourceOutput {
  const { source, resolved } = input;

  if (resolved.length === 0) {
    // Nothing to do — but still hand back a valid magic-string sourcemap
    // so downstream Vite plumbing has something to chain against.
    const ms = new MagicString(source);
    return {
      code: source,
      map: ms.generateMap({ hires: true }),
      rewritten: 0
    };
  }

  const ms = new MagicString(source);

  // Process sites in source order. magic-string supports overlapping
  // edits as long as we use append/prepend instead of overwrite for
  // adjacent ranges, but our per-site edits never overlap because
  // they're confined to the opening/closing tag of distinct elements.
  for (const site of resolved) {
    const { candidate, generatedIdentifier } = site;
    const openingSlice = source.slice(candidate.openingRange.start, candidate.openingRange.end);

    // Build the new opening tag: replace `ZodForm` and remove the schema attr.
    const newOpening = buildNewOpening(openingSlice, generatedIdentifier, candidate);
    ms.overwrite(candidate.openingRange.start, candidate.openingRange.end, newOpening);

    // Closing tag — `</ZodForm>` becomes `</_z2fGeneratedForm_N>`.
    if (candidate.closingRange !== null) {
      const closingSlice = source.slice(candidate.closingRange.start, candidate.closingRange.end);
      const newClosing = closingSlice.replace(/ZodForm/, generatedIdentifier);
      ms.overwrite(candidate.closingRange.start, candidate.closingRange.end, newClosing);
    }
  }

  // Insert the generated imports AFTER any leading shebang / block
  // comments / string directives (`'use client'`, `'use strict'`) and
  // AFTER the last existing top-level `import` statement — not blindly
  // at byte 0. Prepending at byte 0 would demote a `'use client'`
  // directive past the first import, invalidating it, and would push
  // header comments below the generated block.
  //
  // Every generate-mode variant emits its component under the fixed
  // export name `Form`; see compileTarget's rewrite-variant carve-out.
  const importLines: string[] = [];
  for (let i = 0; i < resolved.length; i++) {
    const site = resolved[i]!;
    const variant = `__generate_${i + 1}`;
    importLines.push(
      `import { Form as ${site.generatedIdentifier} } from '${site.schemaFile}?z2f=${variant}';`
    );
  }
  const insertAt = findImportInsertionPoint(source);
  ms.appendLeft(insertAt, importLines.join('\n') + '\n');

  return {
    code: ms.toString(),
    map: ms.generateMap({ hires: true }),
    rewritten: resolved.length
  };
}

/**
 * Find the byte offset at which to insert generated imports. The target
 * is "immediately after the last thing that must come first": shebang,
 * leading block/line comments, string directives, and any existing
 * top-level `import` statements. If none of those exist, the result is
 * byte 0 (the file starts with user code and the generated imports go
 * at the very top).
 *
 * This is a lightweight textual scan rather than a Babel traversal —
 * the scanner only needs to skip over syntactically "boring" prefix
 * tokens, and the tokens it cares about are all locally recognizable.
 * False negatives (e.g. a directive the scanner doesn't recognize) are
 * safe: the generated imports land slightly earlier than optimal, not
 * in an invalid position.
 */
function findImportInsertionPoint(source: string): number {
  let cursor = 0;
  const n = source.length;

  const skipWhitespace = (): void => {
    while (cursor < n && /\s/.test(source[cursor]!)) cursor += 1;
  };
  const skipLineComment = (): boolean => {
    if (source.slice(cursor, cursor + 2) !== '//') return false;
    const eol = source.indexOf('\n', cursor);
    cursor = eol === -1 ? n : eol + 1;
    return true;
  };
  const skipBlockComment = (): boolean => {
    if (source.slice(cursor, cursor + 2) !== '/*') return false;
    const end = source.indexOf('*/', cursor + 2);
    cursor = end === -1 ? n : end + 2;
    return true;
  };
  const skipDirective = (): boolean => {
    // Match a single string literal followed by optional semicolon +
    // end-of-line — that's what a directive looks like at the top of
    // a module (`'use client';`, `"use strict";`). We're not parsing
    // JavaScript; we only need to recognize the idiomatic form.
    const quote = source[cursor];
    if (quote !== "'" && quote !== '"') return false;
    let i = cursor + 1;
    while (i < n && source[i] !== quote) {
      if (source[i] === '\\') i += 2;
      else i += 1;
    }
    if (i >= n) return false;
    i += 1; // past the closing quote
    // Optional semicolon + newline before the next meaningful token.
    while (i < n && (source[i] === ' ' || source[i] === '\t')) i += 1;
    if (source[i] === ';') i += 1;
    // Require the directive to end at a line break — otherwise it's
    // not a statement-level string.
    const rest = source.slice(i);
    if (!/^\s*(?:\r?\n|$)/.test(rest)) return false;
    cursor = i;
    return true;
  };
  const skipImportStatement = (): boolean => {
    if (
      source.slice(cursor, cursor + 7) !== 'import ' &&
      source.slice(cursor, cursor + 7) !== 'import{'
    ) {
      return false;
    }
    // Naive: walk forward until we find the end of the statement.
    // An import can span multiple lines (`import {\n  a,\n  b\n} from 'x'`),
    // so we can't just indexOf('\n'). Look for the closing quote of
    // the `from '...'` source literal + optional semicolon.
    let i = cursor + 6;
    // Find the from-source quote. An import can also be side-effect
    // only: `import 'polyfill';` — in which case the first quote IS
    // the source quote.
    while (i < n) {
      const c = source[i]!;
      if (c === "'" || c === '"') {
        const quote = c;
        i += 1;
        while (i < n && source[i] !== quote) {
          if (source[i] === '\\') i += 2;
          else i += 1;
        }
        i += 1; // past the closing quote
        break;
      }
      i += 1;
    }
    // Optional semicolon + newline.
    while (i < n && (source[i] === ' ' || source[i] === '\t')) i += 1;
    if (source[i] === ';') i += 1;
    cursor = i;
    return true;
  };

  // Shebang (only at byte 0).
  if (source.startsWith('#!')) {
    const eol = source.indexOf('\n', 2);
    cursor = eol === -1 ? n : eol + 1;
  }

  // Now alternate: skip whitespace, then try each prefix form. Stop as
  // soon as none match.
  while (cursor < n) {
    const before = cursor;
    skipWhitespace();
    if (skipLineComment()) continue;
    if (skipBlockComment()) continue;
    if (skipDirective()) continue;
    if (skipImportStatement()) continue;
    if (cursor === before) break;
  }

  return cursor;
}

/**
 * Build the replacement opening tag from the original source slice.
 * Strategy: walk attributes from end to start so removing the schema
 * attribute doesn't shift earlier offsets. We work with the slice
 * (origin-relative offsets) to keep the math local.
 */
function buildNewOpening(
  openingSlice: string,
  generatedIdentifier: string,
  candidate: {
    attributes: ReadonlyArray<CandidateAttribute>;
    openingRange: { start: number; end: number };
    selfClosing: boolean;
  }
): string {
  // Convert absolute attribute ranges to slice-local offsets.
  const sliceStart = candidate.openingRange.start;
  let result = openingSlice;

  // Process attributes in REVERSE order so each removal/replacement
  // doesn't invalidate earlier offsets.
  const sortedAttrs = [...candidate.attributes].sort((a, b) => b.range.start - a.range.start);
  for (const attr of sortedAttrs) {
    if (attr.kind !== 'named' || attr.name !== 'schema') continue;
    const start = attr.range.start - sliceStart;
    const end = attr.range.end - sliceStart;
    // Trim a leading whitespace character if present so we don't leave
    // a double space between adjacent props.
    const before = result.slice(0, start);
    const after = result.slice(end);
    const trimmedBefore = before.endsWith(' ') ? before.slice(0, -1) : before;
    result = trimmedBefore + after;
  }

  // Replace the element name (the FIRST occurrence of `ZodForm`, which
  // is the tag name). Subsequent occurrences inside attributes — vanishingly
  // rare but possible — are left alone.
  result = result.replace(/ZodForm/, generatedIdentifier);

  return result;
}
