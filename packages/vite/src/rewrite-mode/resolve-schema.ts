/**
 * resolveSchema — given a `CandidateSite` and the source file's path,
 * walk the AST scope to validate that:
 *
 *   1. The `ZodForm` identifier resolves to a named import from the literal
 *      specifier `'@zod-to-form/react'` (no aliased re-exports).
 *   2. The `schema` identifier resolves to a named import whose source
 *      module path is inside the Vite root.
 *
 * Returns a fully-resolved `RewriteSite` on success, or a `SkipReason`
 * string on failure. The caller buffers the skip reason through the
 * logger.
 *
 * Pure: takes the parsed AST + source + candidate, returns a result.
 * No I/O. The path-resolution portion (turning a string specifier into
 * an absolute file path) is delegated to a `resolveImport` callback that
 * the plugin's `transform` hook supplies — it wraps Vite's `this.resolve`.
 */
import { parse } from '@babel/parser';
import * as traverseModule from '@babel/traverse';
import type { NodePath } from '@babel/traverse';
import type {
  ImportDeclaration,
  ImportDefaultSpecifier,
  ImportNamespaceSpecifier,
  ImportSpecifier,
  Program
} from '@babel/types';
import type { CandidateSite } from './scan-jsx.js';

type TraverseFn = (ast: unknown, visitor: Record<string, unknown>) => void;
const traverseAny = traverseModule as unknown as TraverseFn | { default: TraverseFn };
const traverse: TraverseFn = typeof traverseAny === 'function' ? traverseAny : traverseAny.default;

const ZOD_FORM_PACKAGE = '@zod-to-form/react';

export interface ImportBinding {
  /** The raw import specifier (e.g. `'./schemas/signup'` or `'@acme/lib'`). */
  source: string;
  /** Local identifier name (after any `as` alias). */
  localName: string;
  /** Imported name from the source module (`signupSchema`, `default`). */
  importedName: string;
}

export interface ResolvedSite {
  /** The candidate site this resolution applies to. */
  candidate: CandidateSite;
  /** Absolute path to the schema file (post-resolveImport). */
  schemaFile: string;
  /** Imported name of the schema from the source module. */
  schemaExportName: string;
  /** The local identifier the rewrite will introduce (`_z2fGeneratedForm_<n>`). */
  generatedIdentifier: string;
}

export type SkipReason = string;

export interface ResolveSchemaInput {
  source: string;
  candidates: CandidateSite[];
  /** Absolute path to the file containing the candidates (importer). */
  sourceFile: string;
  /**
   * Resolves an import specifier (e.g. `'./schemas/signup'`) against the
   * importing source file and returns an absolute path, or null when the
   * resolver can't find it. Wraps Vite's `this.resolve` in the caller.
   */
  resolveImport: (specifier: string, importer: string) => Promise<string | null>;
  /** Vite root — schema files outside this dir are skipped. */
  viteRoot: string;
}

export interface ResolveSchemaOutput {
  resolved: ResolvedSite[];
  skipped: Array<{ candidate: CandidateSite; reason: SkipReason }>;
}

export async function resolveSchemas(input: ResolveSchemaInput): Promise<ResolveSchemaOutput> {
  const { source, candidates, sourceFile, resolveImport, viteRoot } = input;

  if (candidates.length === 0) {
    return { resolved: [], skipped: [] };
  }

  // Re-parse the source to pick up the program-level import declarations.
  // We could pass the AST through from scanJsx, but keeping resolveSchemas
  // self-contained makes it easier to unit-test in isolation. The parse
  // cost is bounded by the file size, not by the number of candidates.
  let ast: ReturnType<typeof parse>;
  try {
    ast = parse(source, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
      errorRecovery: false
    });
  } catch {
    return {
      resolved: [],
      skipped: candidates.map((c) => ({ candidate: c, reason: 'source file failed to re-parse' }))
    };
  }

  // Build a map of local identifier name → import binding for every
  // top-level import. We only care about top-level imports because
  // <ZodForm> can't validly use a function-scoped import.
  const bindings = new Map<string, ImportBinding>();
  traverse(ast, {
    Program(path: NodePath<Program>): void {
      for (const node of path.node.body) {
        if (node.type !== 'ImportDeclaration') continue;
        const decl = node as ImportDeclaration;
        const sourceLiteral = decl.source.value;
        for (const specifier of decl.specifiers) {
          if (specifier.type === 'ImportSpecifier') {
            const s = specifier as ImportSpecifier;
            const importedName =
              s.imported.type === 'Identifier' ? s.imported.name : s.imported.value;
            bindings.set(s.local.name, {
              source: sourceLiteral,
              localName: s.local.name,
              importedName
            });
          } else if (specifier.type === 'ImportDefaultSpecifier') {
            const s = specifier as ImportDefaultSpecifier;
            bindings.set(s.local.name, {
              source: sourceLiteral,
              localName: s.local.name,
              importedName: 'default'
            });
          } else if (specifier.type === 'ImportNamespaceSpecifier') {
            const s = specifier as ImportNamespaceSpecifier;
            bindings.set(s.local.name, {
              source: sourceLiteral,
              localName: s.local.name,
              importedName: '*'
            });
          }
        }
      }
      path.stop();
    }
  });

  const resolved: ResolvedSite[] = [];
  const skipped: ResolveSchemaOutput['skipped'] = [];
  let counter = 0;

  for (const candidate of candidates) {
    // 1. ZodForm must come from @zod-to-form/react
    const zodFormBinding = bindings.get('ZodForm');
    if (zodFormBinding === undefined) {
      skipped.push({
        candidate,
        reason: `<ZodForm> at ${candidate.loc.line}:${candidate.loc.column} has no in-scope import; rewrite mode requires a top-level 'import { ZodForm }' statement`
      });
      continue;
    }
    if (zodFormBinding.source !== ZOD_FORM_PACKAGE) {
      skipped.push({
        candidate,
        reason: `ZodForm import origin is '${zodFormBinding.source}', not '${ZOD_FORM_PACKAGE}'`
      });
      continue;
    }
    if (zodFormBinding.importedName !== 'ZodForm') {
      skipped.push({
        candidate,
        reason: `ZodForm import is aliased ('${zodFormBinding.importedName}' as '${zodFormBinding.localName}'); only the unaliased named import is matched`
      });
      continue;
    }

    // 2. The schema identifier must resolve to a top-level import
    const schemaIdName = candidate.schemaIdentifier;
    if (schemaIdName === null) {
      skipped.push({
        candidate,
        reason: 'schema identifier is null (scan-jsx invariant violation)'
      });
      continue;
    }
    const schemaBinding = bindings.get(schemaIdName);
    if (schemaBinding === undefined) {
      skipped.push({
        candidate,
        reason: `schema identifier '${schemaIdName}' is not a top-level import (rewrite mode only handles imported schemas)`
      });
      continue;
    }
    if (schemaBinding.importedName === '*' || schemaBinding.importedName === 'default') {
      skipped.push({
        candidate,
        reason: `schema identifier '${schemaIdName}' is a ${schemaBinding.importedName === '*' ? 'namespace' : 'default'} import; only named imports are handled`
      });
      continue;
    }

    // 3. The schema source must resolve to an absolute path inside the Vite root
    const absoluteSchemaPath = await resolveImport(schemaBinding.source, sourceFile);
    if (absoluteSchemaPath === null) {
      skipped.push({
        candidate,
        reason: `schema import '${schemaBinding.source}' could not be resolved by Vite`
      });
      continue;
    }
    if (!isInsideRoot(absoluteSchemaPath, viteRoot)) {
      skipped.push({
        candidate,
        reason: `schema identifier '${schemaIdName}' resolves to '${absoluteSchemaPath}', which is outside the Vite root`
      });
      continue;
    }

    counter += 1;
    resolved.push({
      candidate,
      schemaFile: absoluteSchemaPath,
      schemaExportName: schemaBinding.importedName,
      generatedIdentifier: `_z2fGeneratedForm_${counter}`
    });
  }

  return { resolved, skipped };
}

function isInsideRoot(child: string, root: string): boolean {
  const c = child.replace(/\\/g, '/');
  const r = root.replace(/\\/g, '/');
  const normalizedRoot = r.endsWith('/') ? r : r + '/';
  return c === r || c.startsWith(normalizedRoot);
}
