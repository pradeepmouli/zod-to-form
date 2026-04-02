import type { SchemaLiteInfo } from '@zod-to-form/core';

/**
 * Generate a shape access expression for a fallthrough field path.
 *
 * For top-level keys ("billing"), returns:
 *   schema._zod.def.shape["billing"]
 *
 * For nested paths ("address.billing"), wraps in z.object().loose()
 * so the lite schema's structure matches the actual data shape:
 *   z.object({ "billing": schema._zod.def.shape["address"]._zod.def.shape["billing"] }).loose()
 */
function emitShapeAccess(exportName: string, path: string): { topKey: string; expr: string } {
  const segments = path.split('.');
  // Navigate through nested shapes: schema._zod.def.shape["a"]._zod.def.shape["b"]
  const accessor = segments.map((seg) => `._zod.def.shape[${JSON.stringify(seg)}]`).join('');
  const fullAccess = `${exportName}${accessor}`;

  const topKey = segments[0]!;

  if (segments.length === 1) {
    return { topKey, expr: fullAccess };
  }

  // Wrap from inside out for nested paths
  let expr = fullAccess;
  for (let i = segments.length - 1; i >= 1; i--) {
    expr = `z.object({ ${JSON.stringify(segments[i]!)}: ${expr} }).loose()`;
  }
  return { topKey, expr };
}

/**
 * Emit the base lite schema: z.object({...fallthrough}).loose()
 * Fallthrough fields are referenced from the imported schema's shape.
 */
function emitLiteBase(exportName: string, fallthroughFields: string[]): string {
  if (fallthroughFields.length === 0) {
    return `let _lite: any = z.object({}).loose();`;
  }
  const shapeEntries = fallthroughFields
    .map((key) => {
      const { topKey, expr } = emitShapeAccess(exportName, key);
      return `${JSON.stringify(topKey)}: ${expr}`;
    })
    .join(', ');
  return `let _lite: any = z.object({ ${shapeEntries} }).loose();`;
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
