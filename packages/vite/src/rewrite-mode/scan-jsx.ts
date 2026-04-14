/**
 * scanJsx — find candidate `<ZodForm schema={X}>` JSX elements in a source
 * file. Pure: no I/O, no plugin context. Reports both candidate sites and
 * skip diagnostics so the caller can buffer them through the logger.
 *
 * The substring fast-path is critical: most files in a typical project
 * don't contain `'ZodForm'` anywhere, so a single `indexOf` check keeps
 * rewrite-mode's per-file cost at zero for the common case (research R3).
 *
 * Parsing is deliberately scoped to `JSXElement` nodes only — we don't
 * walk the rest of the AST. That means even a 5000-line file with one
 * `<ZodForm>` call site stays cheap to scan.
 */
import { parse } from '@babel/parser';
// `@babel/traverse`'s ESM default export is the function itself; the
// CJS interop adds a `.default` indirection some bundlers preserve and
// others don't. The published types model it as a namespace, so we
// import via a value alias and unwrap at runtime through `unknown`.
import * as traverseModule from '@babel/traverse';
import type { NodePath } from '@babel/traverse';
import type {
  JSXAttribute,
  JSXElement,
  JSXExpressionContainer,
  JSXIdentifier,
  Node
} from '@babel/types';

type TraverseFn = (ast: unknown, visitor: Record<string, unknown>) => void;
const traverseAny = traverseModule as unknown as TraverseFn | { default: TraverseFn };
const traverse: TraverseFn = typeof traverseAny === 'function' ? traverseAny : traverseAny.default;

export interface CandidateAttribute {
  /** `'schema'`, `'onSubmit'`, etc. — `null` for spread attributes. */
  name: string | null;
  /** Byte range of the entire attribute, inclusive of name + value. */
  range: { start: number; end: number };
  /** The raw source slice for this attribute (used to preserve formatting). */
  source: string;
  /** True iff this is a `{...spread}` attribute. */
  isSpread: boolean;
}

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
  /** The identifier name from `schema={identifier}`, or null if non-Identifier. */
  schemaIdentifier: string | null;
  /** Children source slice (between opening and closing tags), or '' if self-closing. */
  childrenSource: string;
}

export interface ScanResult {
  /** Candidate sites that may be rewriteable. resolveSchema validates them. */
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
 */
export function scanJsx(source: string): ScanResult | null {
  // Substring fast-path. Most files won't contain ZodForm at all.
  if (source.indexOf('ZodForm') === -1) return null;

  let ast: ReturnType<typeof parse>;
  try {
    ast = parse(source, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
      errorRecovery: false
    });
  } catch {
    // Parse failures propagate as Vite errors via the caller; here we
    // return null so the caller knows to leave the file alone. The
    // user's normal Vite pipeline will surface the syntax error.
    return null;
  }

  const candidates: CandidateSite[] = [];
  const skipped: SkippedSite[] = [];

  traverse(ast, {
    JSXElement(path: NodePath<JSXElement>): void {
      const opening = path.node.openingElement;
      const nameNode = opening.name;

      // Element name MUST be a bare `JSXIdentifier`, not `JSXMemberExpression`
      // or `JSXNamespacedName`. `<x.ZodForm>` and `<x:ZodForm>` are skipped.
      if (nameNode.type !== 'JSXIdentifier') {
        // Only flag this as a skip if the rendered text actually contains
        // `ZodForm` — otherwise we'd noise up the log with every member-
        // expression element in the file.
        if (containsZodForm(nameNode)) {
          skipped.push({
            loc: locOf(path.node),
            reason:
              'JSX element uses member-expression name (e.g. <ns.ZodForm/>); only bare <ZodForm> is matched'
          });
        }
        return;
      }
      if ((nameNode as JSXIdentifier).name !== 'ZodForm') return;

      const loc = locOf(path.node);

      // Find the schema attribute and collect all the others.
      const attributes: CandidateAttribute[] = [];
      let schemaAttr: JSXAttribute | null = null;
      for (const attr of opening.attributes) {
        const range = rangeOf(attr);
        const slice = source.slice(range.start, range.end);
        if (attr.type === 'JSXSpreadAttribute') {
          attributes.push({ name: null, range, source: slice, isSpread: true });
          continue;
        }
        const jsxAttr = attr as JSXAttribute;
        const attrName = jsxAttr.name.type === 'JSXIdentifier' ? jsxAttr.name.name : null;
        attributes.push({
          name: attrName,
          range,
          source: slice,
          isSpread: false
        });
        if (attrName === 'schema') schemaAttr = jsxAttr;
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
      const expr = (value as JSXExpressionContainer).expression;
      if (expr.type !== 'Identifier') {
        skipped.push({
          loc,
          reason: `schema prop expression is ${expr.type}, expected Identifier`
        });
        return;
      }

      const openingRange = rangeOf(opening);
      const closingRange =
        path.node.closingElement === null || path.node.closingElement === undefined
          ? null
          : rangeOf(path.node.closingElement);
      const childrenSource =
        closingRange === null ? '' : source.slice(openingRange.end, closingRange.start);

      candidates.push({
        openingRange,
        closingRange,
        loc,
        selfClosing: opening.selfClosing,
        attributes,
        schemaIdentifier: expr.name,
        childrenSource
      });
    }
  });

  return { candidates, skipped };
}

function rangeOf(node: Node): { start: number; end: number } {
  if (
    node.start === null ||
    node.start === undefined ||
    node.end === null ||
    node.end === undefined
  ) {
    throw new Error('Babel AST node missing byte range — parser was misconfigured');
  }
  return { start: node.start, end: node.end };
}

function locOf(node: Node): { line: number; column: number } {
  const loc = node.loc;
  if (loc === null || loc === undefined) {
    return { line: 0, column: 0 };
  }
  return { line: loc.start.line, column: loc.start.column };
}

function containsZodForm(node: Node): boolean {
  // Cheap check used to filter member-expression element names — we don't
  // want every `<x.foo />` in the file to log a skip.
  if (node.type === 'JSXIdentifier') return node.name === 'ZodForm';
  if (node.type === 'JSXMemberExpression') {
    return containsZodForm(node.object) || containsZodForm(node.property);
  }
  return false;
}
