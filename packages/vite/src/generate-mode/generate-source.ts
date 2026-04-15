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
import { parse as parseBabel } from '@babel/parser';
import type { ImportDeclaration, ExpressionStatement, Statement } from '@babel/types';
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
  // export name `Form`; see `isGenerateVariant` in query-mode/transform.ts.
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
 * is "immediately after the last thing that must come first": the
 * module's leading directives (`'use client'`, `'use strict'`) and any
 * existing top-level `import` statements. If none of those exist, the
 * result is byte 0 (the file starts with user code and the generated
 * imports go at the very top).
 *
 * Uses Babel's parser — the same dependency scan-jsx and resolve-schema
 * already rely on — so directive detection, multi-line imports,
 * TypeScript-specific forms (`import type`), side-effect-only imports
 * (`import 'polyfill';`), BOM handling, and escape sequences inside
 * string literals are all handled by the production-grade parser
 * instead of a hand-rolled textual walker.
 *
 * On parse failure (e.g. the user is mid-save with broken syntax) we
 * return 0 — safer than guessing at an offset we can't prove valid.
 * The caller is expected to surface the parse error through Vite's
 * normal pipeline.
 */
function findImportInsertionPoint(source: string): number {
  let ast: ReturnType<typeof parseBabel>;
  try {
    ast = parseBabel(source, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
      errorRecovery: false
    });
  } catch {
    return 0;
  }

  // Walk top-level statements and remember the end offset of the last
  // one that qualifies as a "preamble" (directive or import).
  let lastPreambleEnd = 0;
  const body: Statement[] = ast.program.body;
  for (const stmt of body) {
    if (stmt.type === 'ImportDeclaration') {
      const node = stmt as ImportDeclaration;
      if (node.end !== null && node.end !== undefined) {
        lastPreambleEnd = node.end;
      }
      continue;
    }
    // A directive reaches us as an `ExpressionStatement` whose
    // `expression` is a `StringLiteral` AND whose `directive` field is
    // set by Babel's parser.
    if (stmt.type === 'ExpressionStatement') {
      const exprStmt = stmt as ExpressionStatement & { directive?: string };
      if (
        typeof exprStmt.directive === 'string' &&
        exprStmt.end !== null &&
        exprStmt.end !== undefined
      ) {
        lastPreambleEnd = exprStmt.end;
        continue;
      }
    }
    // Anything else stops the preamble.
    break;
  }

  // Babel's `program.directives` array is populated when the source
  // has directives BEFORE any other statement — they're lifted out of
  // `body`. If we didn't find a preamble in `body`, check there too.
  if (lastPreambleEnd === 0 && ast.program.directives.length > 0) {
    const lastDirective = ast.program.directives[ast.program.directives.length - 1]!;
    if (lastDirective.end !== null && lastDirective.end !== undefined) {
      lastPreambleEnd = lastDirective.end;
    }
  }

  // Babel ranges don't include a trailing newline. Step forward past
  // any whitespace to land the insertion on its own line so the emitted
  // imports don't share a line with existing code.
  while (lastPreambleEnd < source.length && source[lastPreambleEnd] === ' ') {
    lastPreambleEnd += 1;
  }
  if (lastPreambleEnd < source.length && source[lastPreambleEnd] === '\n') {
    lastPreambleEnd += 1;
  } else if (
    lastPreambleEnd < source.length - 1 &&
    source[lastPreambleEnd] === '\r' &&
    source[lastPreambleEnd + 1] === '\n'
  ) {
    lastPreambleEnd += 2;
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
