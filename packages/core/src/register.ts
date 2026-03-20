import type { $ZodRegistry, $ZodType, $replace } from 'zod/v4/core';
import { getDef, getShape } from './processors/_utils.js';
import type { FieldConfig } from './types.js';

// Structural keys used to drive recursive traversal in registerDeep.
// These are not field metadata, so they are stripped before calling registry.add().
const TRAVERSAL_KEYS = new Set(['fields', 'arrayItems']);

/**
 * Extract only the flat metadata keys from a config object, stripping
 * traversal directives (`fields`, `arrayItems`). Returns `undefined`
 * when no metadata keys remain.
 */
function stripTraversalKeys(config: Record<string, unknown>): Record<string, unknown> | undefined {
  const flatMeta: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    if (!TRAVERSAL_KEYS.has(key)) {
      flatMeta[key] = value;
    }
  }
  return Object.keys(flatMeta).length > 0 ? flatMeta : undefined;
}

/**
 * Register a schema and all its nested fields in a registry using a
 * path-structured {@link FieldConfig} tree.
 *
 * Only the flat metadata fields (`fieldType`, `order`, `hidden`, `section`,
 * `props`, etc.) are passed to `registry.add()` for each schema. The
 * structural keys `fields` and `arrayItems` are used purely to drive the
 * recursive walk and are never stored in the registry.
 *
 * @example
 * ```ts
 * const formRegistry = z.registry<FormMeta>();
 *
 * const schema = z.object({
 *   name: z.string(),
 *   address: z.object({ street: z.string(), city: z.string() }),
 *   tags: z.array(z.string()),
 * });
 *
 * registerDeep(formRegistry, schema, {
 *   component: 'form',
 *   fields: {
 *     name:    { component: 'Input', order: 0 },
 *     address: {
 *       component: 'Fieldset',
 *       fields: {
 *         street: { component: 'Input' },
 *         city:   { component: 'Input', hidden: true },
 *       },
 *     },
 *     tags: {
 *       component: 'ArrayField',
 *       arrayItems: { component: 'Input' },
 *     },
 *   },
 * });
 * ```
 */
export function registerDeep<S extends $ZodType, Meta extends object>(
  registry: $ZodRegistry<Meta>,
  schema: S,
  config: FieldConfig<S>
): void {
  // SAFETY: FieldConfig<S> is a branded intersection — cast to plain record for dynamic key iteration
  const raw = config as Record<string, unknown>;

  const flatMeta = stripTraversalKeys(raw);
  if (flatMeta) {
    // SAFETY: flatMeta is built from the user's FieldConfig which matches Meta at runtime
    registry.add(schema, flatMeta as $replace<Meta, S>);
  }

  // ── Object shape ───────────────────────────────────────────────────
  const fields = raw['fields'];
  if (fields && typeof fields === 'object') {
    const shape = getShape(getDef(schema));
    const shapeKeys = new Set(Object.keys(shape));

    for (const [key, childSchema] of Object.entries(shape)) {
      // SAFETY: fields is Record<string, FieldConfig> at runtime
      const childConfig = (fields as Record<string, FieldConfig | undefined>)[key];
      if (childConfig) {
        // SAFETY: childSchema is $ZodType from the shape — cast needed for recursive generic
        registerDeep(registry, childSchema, childConfig as FieldConfig<typeof childSchema>);
      }
    }

    // Warn about config keys that don't match any schema field
    for (const configKey of Object.keys(fields as Record<string, unknown>)) {
      if (!shapeKeys.has(configKey)) {
        console.warn(
          `[zod-to-form] registerDeep: config references field "${configKey}" ` +
            `which does not exist in the schema shape. Available fields: ${[...shapeKeys].join(', ')}. ` +
            `This entry will be ignored.`
        );
      }
    }
  }

  // ── Array element ──────────────────────────────────────────────────
  const arrayItems = raw['arrayItems'];
  if (arrayItems) {
    // SAFETY: element is $ZodType when schema is a ZodArray — undefined otherwise (safely guarded)
    const element = getDef(schema)['element'] as $ZodType | undefined;
    if (element) {
      // SAFETY: recursive generic requires cast — element is $ZodType at runtime
      registerDeep(registry, element, arrayItems as FieldConfig<typeof element>);
    }
  }
}

/**
 * Resolve a dot-path (e.g. `"address.street"` or `"tags[]"`) against a
 * schema, returning the leaf `$ZodType` that the path points to.
 *
 * Supported path segments:
 * - `key`       — object shape lookup
 * - `key[]`     — array element lookup (strips the `[]` suffix, descends into element)
 * - `N`         — numeric segment, descends into the array element of the current schema
 */
function resolveSchemaPath(schema: $ZodType, path: string): $ZodType | undefined {
  const segments = path.split('.');
  let current: $ZodType = schema;

  for (const segment of segments) {
    // Handle trailing `[]` — means "descend into the array element"
    const arrayBracket = segment.endsWith('[]');
    const key = arrayBracket ? segment.slice(0, -2) : segment;

    // Numeric segment → descend into the array element of the current schema
    if (/^\d+$/.test(key)) {
      // SAFETY: element is $ZodType when current is a ZodArray — undefined otherwise
      const element = getDef(current)['element'] as $ZodType | undefined;
      if (!element) return undefined;
      current = element;
      continue;
    }

    // Named key → object shape lookup
    if (key) {
      const shape = getShape(getDef(current));
      const child = shape[key];
      if (!child) return undefined;
      current = child;
    }

    // If the segment had `[]`, descend into the array element
    if (arrayBracket) {
      // SAFETY: element is $ZodType when current is a ZodArray — undefined otherwise
      const element = getDef(current)['element'] as $ZodType | undefined;
      if (!element) return undefined;
      current = element;
    }
  }

  return current;
}

/**
 * Register flat dot-path field configs against a schema's registry.
 *
 * Typically called with the merged output of `resolveFieldConfig()`,
 * a flat `Record<string, FieldConfig>` keyed by dot-paths like
 * `"name"`, `"address.street"`, `"tags[]"` — and resolves each path against
 * the schema structure, calling `registry.add()` for the target schema node.
 *
 * This bridges the existing flat config format (used by CLI and
 * `ZodFormsConfig.fields`) into the registry so that `walkSchema` can
 * consume it uniformly.
 *
 * @example
 * ```ts
 * const formRegistry = z.registry<FormMeta>();
 * const schema = z.object({
 *   name: z.string(),
 *   address: z.object({ street: z.string(), city: z.string() }),
 * });
 *
 * registerFlat(formRegistry, schema, {
 *   name:             { component: 'Input', order: 0 },
 *   'address.street': { component: 'Input' },
 *   'address.city':   { component: 'Input', hidden: true },
 * });
 * ```
 */
export function registerFlat<Meta extends object>(
  registry: $ZodRegistry<Meta>,
  schema: $ZodType,
  fields: Record<string, FieldConfig>
): void {
  for (const [path, config] of Object.entries(fields)) {
    if (!config) continue;

    const target = resolveSchemaPath(schema, path);
    if (!target) {
      console.warn(
        `[zod-to-form] registerFlat: path "${path}" does not resolve to any ` +
          `schema node and will be ignored. Check for typos or ensure the schema ` +
          `structure matches the configured paths.`
      );
      continue;
    }

    // Strip traversal keys before storing in registry
    const flatMeta = stripTraversalKeys(config as Record<string, unknown>);
    if (flatMeta) {
      // SAFETY: flatMeta is built from the user's FieldConfig which matches Meta at runtime
      registry.add(target, flatMeta as $replace<Meta, $ZodType>);
    }
  }
}
