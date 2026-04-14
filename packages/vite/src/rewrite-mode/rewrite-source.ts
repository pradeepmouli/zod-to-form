/**
 * rewriteSource — apply magic-string edits for each ResolvedSite.
 *
 * Three operations per site:
 *
 *   1. Replace the opening tag's `ZodForm` identifier with the generated
 *      identifier (e.g., `_z2fGeneratedForm_1`). The schema attribute is
 *      removed; all other attributes and children are preserved verbatim.
 *   2. Replace the closing tag's identifier (if any).
 *   3. Append a single `import { Form as <generatedId> } from
 *      '<schemaPath>?z2f=__rewrite_<n>'` after the existing imports.
 *
 * Idempotent by construction: the substring fast-path in `scan-jsx`
 * checks for `'ZodForm'`, which the rewrite removes — running the
 * pipeline twice on the same source produces byte-identical output
 * because the second pass has nothing to rewrite.
 */
import MagicString from 'magic-string';
import type { CandidateAttribute } from './scan-jsx.js';
import type { ResolvedSite } from './resolve-schema.js';

export interface RewriteSourceInput {
  source: string;
  resolved: ResolvedSite[];
}

export interface RewriteSourceOutput {
  /** The transformed source (or the original, if there was nothing to do). */
  code: string;
  /** Hi-res sourcemap from magic-string, suitable for Vite. */
  map: ReturnType<MagicString['generateMap']>;
  /** Number of sites actually rewritten (== `resolved.length`). */
  rewritten: number;
}

export function rewriteSource(input: RewriteSourceInput): RewriteSourceOutput {
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

  // Prepend the generated imports just before the first non-import node
  // (or at byte 0 if the file starts with code). For simplicity we
  // prepend at byte 0 — Vite handles the source map collapse.
  // Every rewrite-mode variant emits its component under the fixed
  // export name `Form`; see compileTarget's rewrite-variant carve-out.
  const importLines: string[] = [];
  for (let i = 0; i < resolved.length; i++) {
    const site = resolved[i]!;
    const variant = `__rewrite_${i + 1}`;
    importLines.push(
      `import { Form as ${site.generatedIdentifier} } from '${site.schemaFile}?z2f=${variant}';`
    );
  }
  ms.prepend(importLines.join('\n') + '\n');

  return {
    code: ms.toString(),
    map: ms.generateMap({ hires: true }),
    rewritten: resolved.length
  };
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
