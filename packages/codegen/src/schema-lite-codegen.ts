import type { SchemaLiteInfo } from '@zod-to-form/core';

/**
 * Build a tree grouping dot-paths by their first segment.
 * Returns a map from topKey to either null (leaf) or a list of sub-paths.
 */
function buildPathTree(paths: string[]): Map<string, string[] | null> {
  const tree = new Map<string, string[] | null>();
  for (const path of paths) {
    const dotIndex = path.indexOf('.');
    if (dotIndex === -1) {
      tree.set(path, null);
    } else {
      const topKey = path.slice(0, dotIndex);
      const rest = path.slice(dotIndex + 1);
      const sub = tree.get(topKey);
      if (sub === null) {
        // topKey was previously a direct leaf (no nested sub-path).
        // Convert to a nested-path list to include this new sub-path.
        tree.set(topKey, [rest]);
      } else if (sub === undefined) {
        tree.set(topKey, [rest]);
      } else {
        sub.push(rest);
      }
    }
  }
  return tree;
}

/**
 * Emit a shape-access expression for a path segment tree node.
 * accessPath: schema property segments already navigated (used to build shape accessor).
 * subPaths: null for a leaf (direct shape access), or array of remaining sub-paths to merge.
 */
function emitShapeNode(
  exportName: string,
  accessPath: string[],
  subPaths: string[] | null
): string {
  const accessor = accessPath.map((seg) => `._zod.def.shape[${JSON.stringify(seg)}]`).join('');
  const fullAccess = `${exportName}${accessor}`;

  if (subPaths === null) {
    return fullAccess;
  }

  // Group sub-paths and emit a merged z.object().loose() for this level
  const subTree = buildPathTree(subPaths);
  const entries: string[] = [];
  for (const [key, nested] of subTree) {
    const expr = emitShapeNode(exportName, [...accessPath, key], nested);
    entries.push(`${JSON.stringify(key)}: ${expr}`);
  }
  return `z.object({ ${entries.join(', ')} }).loose()`;
}

/**
 * Emit the base lite schema: z.object({...fallthrough}).loose()
 * Fallthrough fields are referenced from the imported schema's shape.
 * Paths sharing the same top-level key are merged into a single z.object entry.
 */
function emitLiteBase(exportName: string, fallthroughFields: string[]): string {
  if (fallthroughFields.length === 0) {
    return `let _lite: any = z.object({}).loose();`;
  }
  const topTree = buildPathTree(fallthroughFields);
  const entries: string[] = [];
  for (const [key, subPaths] of topTree) {
    const expr = emitShapeNode(exportName, [key], subPaths);
    entries.push(`${JSON.stringify(key)}: ${expr}`);
  }
  return `let _lite: any = z.object({ ${entries.join(', ')} }).loose();`;
}

/**
 * Generate the content of a .lite.ts file that constructs a lite schema
 * from the imported schema's check objects at runtime.
 *
 * Returns null if no schemaLite is needed (no top-level effects).
 */
export function generateSchemaLiteFile(
  schemaImportPath: string,
  exportName: string,
  info: SchemaLiteInfo
): string | null {
  if (!info) return null;

  const lines: string[] = [];

  // Non-decomposable pipe — re-export the original schema
  if (info.type === 'original') {
    lines.push(`import { ${exportName} } from '${schemaImportPath}';`);
    lines.push('');
    lines.push(`export const schemaLite = ${exportName};`);
    lines.push('');
    return lines.join('\n');
  }

  // Checks-only case: z.object({...fallthrough}).loose().check(c1).check(c2)
  if (info.type === 'checks') {
    lines.push(`import { z } from 'zod';`);
    lines.push(`import { ${exportName} } from '${schemaImportPath}';`);
    lines.push('');
    lines.push(emitLiteBase(exportName, info.fallthroughFields));
    lines.push(
      `const _parentCheckCount = ${exportName}._zod.parent?._zod.def.checks?.length ?? 0;`
    );
    lines.push(`const _checks = (${exportName}._zod.def.checks ?? []).slice(_parentCheckCount);`);
    lines.push(`for (const _c of _checks) _lite = _lite.check(_c);`);
    lines.push(`export const schemaLite = _lite;`);
    lines.push('');
    return lines.join('\n');
  }

  // Transform case: extract inner checks + transform fn + outer checks
  if (info.type === 'transform') {
    lines.push(`import { z } from 'zod';`);
    lines.push(`import { ${exportName} } from '${schemaImportPath}';`);
    lines.push('');
    lines.push(`const _def = ${exportName}._zod.def;`);
    lines.push(emitLiteBase(exportName, info.fallthroughFields));
    lines.push('');

    if (info.hasInnerChecks) {
      lines.push(`// Inner checks (superRefine/refine before transform)`);
      lines.push(`const _inner = _def.type === 'pipe' ? _def.in : ${exportName};`);
      lines.push(`const _parentChecks = _inner._zod.parent?._zod.def.checks?.length ?? 0;`);
      lines.push(
        `for (const _c of (_inner._zod.def.checks ?? []).slice(_parentChecks)) _lite = _lite.check(_c);`
      );
      lines.push('');
    }

    lines.push(`// Transform`);
    lines.push(`if (_def.type === 'pipe' && _def.out?._zod.def.transform) {`);
    lines.push(`  _lite = _lite.transform(_def.out._zod.def.transform);`);
    lines.push(`}`);

    if (info.hasOuterChecks) {
      lines.push('');
      lines.push(`// Outer checks (superRefine/refine after transform)`);
      lines.push(`for (const _c of (_def.checks ?? [])) _lite = _lite.check(_c);`);
    }

    lines.push('');
    lines.push(`export const schemaLite = _lite;`);
    lines.push('');
    return lines.join('\n');
  }

  return null;
}
