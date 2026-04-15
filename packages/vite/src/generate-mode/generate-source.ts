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
 * checks for `'ZodForm'`, which this transform removes — running the
 * pipeline twice on the same source produces byte-identical output
 * because the second pass has nothing to transform.
 */
import type { ParseResult } from '@babel/parser';
import { parse as parseBabel } from '@babel/parser';
import type { File, ImportDeclaration, Statement } from '@babel/types';
import MagicString from 'magic-string';
import type { CandidateAttribute } from './scan-jsx.js';
import type { ResolvedSite } from './resolve-schema.js';

export interface GenerateSourceInput {
  source: string;
  resolved: ResolvedSite[];
  /**
   * Optional diagnostic callback. Called with an error message (never
   * an Error object) when an internal invariant is violated — e.g., the
   * insertion-point scanner's Babel re-parse fails even though scanJsx
   * already parsed the same source successfully. Wired to the plugin's
   * logger at the call site so these land in the buildEnd summary
   * instead of being lost.
   */
  onWarn?: (message: string) => void;
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
  const { source, resolved, onWarn } = input;

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
  // export name `Form`; see `isGenerateVariant` in query-mode/transform.ts.
  const importLines: string[] = [];
  for (let i = 0; i < resolved.length; i++) {
    const site = resolved[i]!;
    const variant = `__generate_${i + 1}`;
    importLines.push(
      `import { Form as ${site.generatedIdentifier} } from '${site.schemaFile}?z2f=${variant}';`
    );
  }
  const insertAt = findImportInsertionPoint(source, onWarn);
  ms.appendLeft(insertAt, importLines.join('\n') + '\n');

  return {
    code: ms.toString(),
    map: ms.generateMap({ hires: true }),
    rewritten: resolved.length
  };
}

/**
 * Find the byte offset at which to insert generated imports. The target
 * is "immediately after the last thing that must come first": the file's
 * shebang, its leading string directives (`'use client'`, `'use strict'`),
 * and any existing top-level `import` statements. If none of those exist,
 * the result is byte 0 (the file starts with user code and the generated
 * imports go at the very top).
 *
 * Uses Babel's parser — the same dependency scan-jsx and resolve-schema
 * already rely on — so directive detection, multi-line imports,
 * TypeScript-specific forms (`import type`), side-effect-only imports,
 * BOM handling, and escape sequences inside string literals are all
 * handled by the production-grade parser instead of a hand-rolled
 * textual walker.
 *
 * On parse failure (e.g. the user is mid-save with broken syntax) we
 * warn via `onWarn` and return 0. In practice this branch is unreachable
 * because scanJsx parses the same source first and returns zero
 * candidates on failure, so `generateSource` never reaches this path —
 * the guard exists as defense-in-depth against Babel plugin-flag drift.
 */
function findImportInsertionPoint(source: string, onWarn?: (message: string) => void): number {
  let ast: ParseResult<File>;
  try {
    ast = parseBabel(source, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
      errorRecovery: false
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    onWarn?.(
      `generate-mode: re-parse failed inside findImportInsertionPoint (${msg}); ` +
        'inserting at byte 0 as a safety fallback'
    );
    return 0;
  }

  // Seed from the interpreter directive (shebang). Babel models a `#!`
  // line as `program.interpreter`, not as a statement in `body`, so we
  // must pick its end offset up separately to avoid landing the emitted
  // imports ABOVE the shebang (which would break Node's interpreter
  // detection).
  let lastPreambleEnd = 0;
  if (ast.program.interpreter?.end != null) {
    lastPreambleEnd = ast.program.interpreter.end;
  }

  // Babel lifts every leading string-literal directive out of `body`
  // and into `program.directives` (always, for `sourceType: 'module'`).
  // Take the max end across all of them so the seed covers every
  // directive regardless of order.
  for (const directive of ast.program.directives) {
    if (directive.end != null && directive.end > lastPreambleEnd) {
      lastPreambleEnd = directive.end;
    }
  }

  // Walk top-level imports. They always come after directives per ES
  // ordering rules, so any import's end is necessarily after the last
  // directive's end.
  const body: Statement[] = ast.program.body;
  for (const stmt of body) {
    if (stmt.type === 'ImportDeclaration') {
      const node: ImportDeclaration = stmt;
      if (node.end != null) {
        lastPreambleEnd = node.end;
      }
      continue;
    }
    // Anything else stops the preamble.
    break;
  }

  // Babel ranges don't include a trailing newline. Advance past any
  // horizontal whitespace followed by a single line terminator (any of
  // `\n`, `\r\n`, or bare `\r`) so the inserted imports land on their
  // own line rather than appended to the last preamble statement.
  const tail = source.slice(lastPreambleEnd);
  const match = /^[ \t]*(?:\r\n|\n|\r)/.exec(tail);
  if (match !== null) {
    lastPreambleEnd += match[0].length;
  }

  return lastPreambleEnd;
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
