/**
 * scanJsx — find candidate `<ZodForm schema={X}>` JSX elements in a source
 * file. Pure: no I/O, no plugin context. Reports both candidate sites and
 * skip diagnostics so the caller can buffer them through the logger.
 *
 * The substring fast-path is critical: most files in a typical project
 * don't contain `'ZodForm'` anywhere, so a single `indexOf` check keeps
 * generate-mode's per-file cost at zero for the common case (research R3).
 *
 * The oxc Visitor only fires on `JSXElement` nodes. The traversal still
 * walks the full AST but the per-node cost outside the visitor is just a
 * type check, so even a 5000-line file with one `<ZodForm>` call site
 * stays cheap to scan in practice.
 */
import { parseSync, Visitor } from 'oxc-parser';

/**
 * One JSX attribute as it appears on a candidate `<ZodForm>` element.
 *
 * Discriminated on `kind`: a `'spread'` attribute (`{...rest}`) has no
 * name; a `'named'` attribute has one. Encoding the distinction in the
 * type prevents the "name is null when isSpread is true" coupling from
 * silently drifting.
 */
export type CandidateAttribute =
  | {
      kind: 'named';
      /** Attribute identifier (e.g. `'schema'`, `'onSubmit'`). */
      name: string;
      /** Byte range of the entire attribute, inclusive of name + value. */
      range: { start: number; end: number };
      /** Raw source slice for this attribute (used to preserve formatting). */
      source: string;
    }
  | {
      kind: 'spread';
      range: { start: number; end: number };
      source: string;
    };

export interface CandidateSite {
  /**
   * Byte range of the *opening tag* (e.g. `<ZodForm schema={X} ... >` or
   * `<ZodForm ... />` for self-closing). The closing tag (if any) is
   * tracked separately.
   */
  openingRange: { start: number; end: number };
  /** Byte range of the closing tag, or null for self-closing elements. */
  closingRange: { start: number; end: number } | null;
  /** Source location of the opening tag, for diagnostics (1-indexed line). */
  loc: { line: number; column: number };
  /** True iff the element is `<ZodForm ... />`. */
  selfClosing: boolean;
  /** All attributes in source order, including the `schema` attribute. */
  attributes: CandidateAttribute[];
  /** The identifier name from `schema={identifier}`. */
  schemaIdentifier: string;
  /** Children source slice (between opening and closing tags), or '' if self-closing. */
  childrenSource: string;
}

export interface ScanResult {
  /** Candidate sites that may be transformable. resolveSchema validates them. */
  candidates: CandidateSite[];
  /** Sites that matched `<ZodForm>` but failed an early structural check. */
  skipped: SkippedSite[];
}

export interface SkippedSite {
  loc: { line: number; column: number };
  reason: string;
}

/**
 * Scan a source string for `<ZodForm>` JSX elements. Returns candidates
 * for further validation by `resolveSchema` plus an array of sites that
 * structurally don't qualify (and thus need a DEBUG diagnostic).
 *
 * Returns `null` (a discriminator distinct from "scanned and found
 * nothing") when the substring fast-path filtered the file out — the
 * caller can short-circuit before allocating anything else.
 *
 * On an oxc parse failure, returns a `ScanResult` with zero candidates
 * and a single skip diagnostic naming the parser error so it surfaces
 * in the buildEnd summary. We deliberately don't propagate the parse
 * error — Vite's main pipeline will report the user's syntax problem
 * elsewhere with better context.
 */
export function scanJsx(source: string): ScanResult | null {
  // Substring fast-path. Most files won't contain ZodForm at all.
  if (source.indexOf('ZodForm') === -1) return null;

  const result = parseSync('file.tsx', source, { lang: 'tsx' });

  if (result.errors.length > 0) {
    // Surface the parse failure as a buffered skip so the user sees one
    // line in the buildEnd generate-mode summary instead of silently
    // missing the transform. The parse error itself still propagates
    // through Vite's normal pipeline and the user fixes it there.
    const message = result.errors[0]?.message ?? 'unknown error';
    return {
      candidates: [],
      skipped: [{ loc: { line: 0, column: 0 }, reason: `oxc parse failed: ${message}` }]
    };
  }

  const candidates: CandidateSite[] = [];
  const skipped: SkippedSite[] = [];

  new Visitor({
    // The Visitor declares the callback as `(node: ESTree.JSXElement) => void`.
    // We use our own narrower stubs below and cast via `unknown` so that
    // TypeScript doesn't try to unify the two independent type hierarchies.
    JSXElement(raw): void {
      const node = raw as unknown as OxcJSXElement;
      const opening = node.openingElement;
      const nameNode = opening.name;

      // Element name MUST be a bare `JSXIdentifier`, not `JSXMemberExpression`
      // or `JSXNamespacedName`. `<x.ZodForm>` and `<x:ZodForm>` are skipped.
      if (nameNode.type !== 'JSXIdentifier') {
        // Only flag this as a skip if the rendered text actually contains
        // `ZodForm` — otherwise we'd noise up the log with every member-
        // expression element in the file.
        if (containsZodForm(nameNode)) {
          skipped.push({
            loc: offsetToLoc(source, node.start),
            reason:
              'JSX element uses member-expression name (e.g. <ns.ZodForm/>); only bare <ZodForm> is matched'
          });
        }
        return;
      }
      if (nameNode.name !== 'ZodForm') return;

      const loc = offsetToLoc(source, node.start);

      // Find the schema attribute and collect all the others.
      const attributes: CandidateAttribute[] = [];
      let schemaAttr: OxcJSXAttribute | null = null;
      for (const attr of opening.attributes) {
        const range = { start: attr.start, end: attr.end };
        const slice = source.slice(range.start, range.end);
        if (attr.type === 'JSXSpreadAttribute') {
          attributes.push({ kind: 'spread', range, source: slice });
          continue;
        }
        const jsxAttr = attr as OxcJSXAttribute;
        const attrName = jsxAttr.name.type === 'JSXIdentifier' ? jsxAttr.name.name : null;
        if (attrName !== null) {
          attributes.push({ kind: 'named', name: attrName, range, source: slice });
          if (attrName === 'schema') schemaAttr = jsxAttr;
        }
      }

      if (schemaAttr === null) {
        skipped.push({ loc, reason: '<ZodForm> has no schema={...} prop' });
        return;
      }

      // schema must be a JSXExpressionContainer wrapping an Identifier.
      const value = schemaAttr.value;
      if (value === null || value === undefined || value.type !== 'JSXExpressionContainer') {
        skipped.push({
          loc,
          reason: 'schema prop is not a JSXExpressionContainer (use schema={identifier})'
        });
        return;
      }
      const expr = (value as OxcJSXExpressionContainer).expression;
      if (expr.type !== 'Identifier') {
        skipped.push({
          loc,
          reason: `schema prop expression is ${expr.type}, expected Identifier`
        });
        return;
      }

      const openingRange = { start: opening.start, end: opening.end };
      const closingRange =
        node.closingElement === null || node.closingElement === undefined
          ? null
          : { start: node.closingElement.start, end: node.closingElement.end };
      const childrenSource =
        closingRange === null ? '' : source.slice(openingRange.end, closingRange.start);

      candidates.push({
        openingRange,
        closingRange,
        loc,
        selfClosing: opening.selfClosing,
        attributes,
        schemaIdentifier: (expr as OxcIdentifier).name,
        childrenSource
      });
    }
  }).visit(result.program);

  return { candidates, skipped };
}

/**
 * Compute 1-indexed line and 0-indexed column from a byte offset.
 * OXC nodes have `start`/`end` offsets directly but no `loc` field.
 */
function offsetToLoc(source: string, offset: number): { line: number; column: number } {
  let line = 1;
  let lastNl = -1;
  // Only \n and \r\n are handled; bare \r (legacy Mac) is vanishingly rare in modern source.
  for (let i = 0; i < offset; i++) {
    if (source[i] === '\n') {
      line++;
      lastNl = i;
    }
  }
  return { line, column: offset - lastNl - 1 };
}

function containsZodForm(node: OxcJSXName): boolean {
  // Cheap check used to filter member-expression element names — we don't
  // want every `<x.foo />` in the file to log a skip.
  if (node.type === 'JSXIdentifier') return node.name === 'ZodForm';
  if (node.type === 'JSXMemberExpression') {
    return containsZodForm(node.object) || containsZodForm(node.property as OxcJSXIdentifier);
  }
  return false;
}

// Minimal OXC AST type stubs — just enough for the shapes we actually access.
// oxc-parser ships a full .d.ts but the Visitor callback types are `unknown`
// in the current build; we narrow them here rather than casting to `any`.

interface OxcSpan {
  start: number;
  end: number;
}

interface OxcJSXIdentifier extends OxcSpan {
  type: 'JSXIdentifier';
  name: string;
}

interface OxcJSXMemberExpression extends OxcSpan {
  type: 'JSXMemberExpression';
  object: OxcJSXIdentifier | OxcJSXMemberExpression;
  property: OxcJSXIdentifier;
}

// OxcJSXNamespacedName covers any other name form (e.g. <x:ZodForm>) that we
// don't handle but must include in the union so the visitor node type is complete.
interface OxcJSXNamespacedName extends OxcSpan {
  type: 'JSXNamespacedName';
}

type OxcJSXName = OxcJSXIdentifier | OxcJSXMemberExpression | OxcJSXNamespacedName;

interface OxcIdentifier extends OxcSpan {
  type: 'Identifier';
  name: string;
}

interface OxcJSXExpressionContainer extends OxcSpan {
  type: 'JSXExpressionContainer';
  expression: OxcSpan & { type: string } & Partial<OxcIdentifier>;
}

interface OxcJSXAttribute extends OxcSpan {
  type: 'JSXAttribute';
  name: OxcJSXIdentifier | OxcJSXNamespacedName;
  value:
    | (
        | OxcJSXExpressionContainer
        | (OxcSpan & { type: 'StringLiteral' | 'JSXElement' | 'JSXFragment' })
      )
    | null
    | undefined;
}

interface OxcJSXSpreadAttribute extends OxcSpan {
  type: 'JSXSpreadAttribute';
}

interface OxcJSXOpeningElement extends OxcSpan {
  type: 'JSXOpeningElement';
  name: OxcJSXName;
  attributes: Array<OxcJSXAttribute | OxcJSXSpreadAttribute>;
  selfClosing: boolean;
}

interface OxcJSXClosingElement extends OxcSpan {
  type: 'JSXClosingElement';
}

interface OxcJSXElement extends OxcSpan {
  type: 'JSXElement';
  openingElement: OxcJSXOpeningElement;
  closingElement: OxcJSXClosingElement | null;
}
