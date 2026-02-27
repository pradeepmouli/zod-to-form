import type { ZodType } from 'zod';
import { resolveMetadata } from './metadata.js';
import { processFallback } from './processors/fallback.js';
import { createProcessors } from './registry.js';
import { createBaseField } from './utils.js';
import type { FormField, WalkOptions } from './types.js';

function getDef(schema: ZodType): Record<string, unknown> {
  return (schema as unknown as { _zod?: { def?: Record<string, unknown> } })['_zod']?.['def'] ?? {};
}

function getShape(def: Record<string, unknown>): Record<string, ZodType> {
  const rawShape = def['shape'];

  if (typeof rawShape === 'function') {
    const computed = rawShape as () => unknown;
    return (computed() as Record<string, ZodType>) ?? {};
  }

  return (rawShape as Record<string, ZodType>) ?? {};
}

function processField(
  schema: ZodType,
  key: string,
  options: WalkOptions | undefined,
  processors: ReturnType<typeof createProcessors>,
  seen: WeakSet<ZodType>,
  maxDepth: number,
  currentDepth: number
): FormField {
  const def = getDef(schema);
  const zodType = typeof def['type'] === 'string' ? (def['type'] as string) : 'unknown';
  const field = createBaseField(key, zodType);

  if (seen.has(schema) || currentDepth > maxDepth) {
    field.component = 'Input';
    field.props['type'] = 'text';
    return field;
  }

  seen.add(schema);

  const ctx: import('./types.js').FormProcessorContext = {
    processors,
    formRegistry: options?.formRegistry,
    path: key.split('.'),
    seen,
    maxDepth,
    currentDepth,
    processChild: (childSchema, childKey) =>
      processField(childSchema, childKey, options, processors, seen, maxDepth, currentDepth + 1)
  };

  const processor = processors[zodType];
  if (processor) {
    processor(schema, ctx, field, { parentKey: key });
  } else {
    processFallback(schema, ctx, field, { parentKey: key });
  }

  const metadata = resolveMetadata(schema, options?.formRegistry);

  if (metadata.title) {
    field.label = metadata.title;
  }
  if (metadata.description) {
    field.description = metadata.description;
  }
  if (metadata.examples?.[0] && typeof metadata.examples[0] === 'string') {
    field.placeholder = metadata.examples[0];
    if (field.component === 'Input' || field.component === 'Textarea') {
      field.props['placeholder'] = metadata.examples[0];
    }
  }
  if (metadata.hidden !== undefined) {
    field.hidden = metadata.hidden;
  }
  if (metadata.order !== undefined) {
    field.order = metadata.order;
  }
  if (metadata.gridColumn !== undefined) {
    field.gridColumn = metadata.gridColumn;
  }
  if (typeof metadata.render === 'function') {
    field.render = metadata.render as (field: FormField, props: Record<string, unknown>) => unknown;
    field.hasCustomRender = true;
  }

  return field;
}

/**
 * Walk a Zod schema and produce a FormField[] tree.
 *
 * @param schema - A Zod object schema (top-level must be z.object())
 * @param options - Optional configuration for the walk
 * @returns FormField[] - Ordered array of field descriptors
 */
export function walkSchema(schema: ZodType, options?: WalkOptions): FormField[] {
  const def = getDef(schema);
  const topLevelType = def['type'];

  if (topLevelType !== 'object') {
    throw new Error('walkSchema expects a top-level z.object() schema.');
  }

  const maxDepth = options?.maxDepth ?? 5;
  const processors = createProcessors(options?.processors ?? {});
  const seen = new WeakSet<ZodType>();
  const shape = getShape(def);

  const fields = Object.entries(shape).map(([key, childSchema]) =>
    processField(childSchema, key, options, processors, seen, maxDepth, 0)
  );

  return fields.sort((left, right) => {
    if (left.order === undefined && right.order === undefined) {
      return 0;
    }
    if (left.order === undefined) {
      return 1;
    }
    if (right.order === undefined) {
      return -1;
    }
    return left.order - right.order;
  });
}
