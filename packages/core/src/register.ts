import type { $ZodRegistry, $ZodType, $replace } from 'zod/v4/core';
import type { ZodFormsConfig } from './config.js';
import type { FieldConfig, FormMeta } from './types.js';

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
 *
 * @remarks
 * Recursively walks a FieldConfig tree, separating traversal keys (fields, arrayItems)
 * from flat metadata keys (component, order, hidden). Only flat keys are stored in the
 * registry — structural keys drive the recursion. Warns on config keys that don't match
 * schema shape (helpful for typo detection).
 *
 * @useWhen
 * - You have a deeply-nested FieldConfig mirroring your schema shape
 * - Recommended for complex schemas with nested objects and arrays
 *
 * @avoidWhen
 * - For simple flat configs — registerFlat() is simpler and more direct
 * - Don't use if your config comes from dot-path format (CLI global fields)
 *
 * @never
 * - NEVER mix with registerFlat() on the same schema — registry entries conflict silently
 * - NEVER forget the structural keys (fields, arrayItems) for nested config — without them, child config is silently ignored
 *
 * @category Registration
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
    const shape = (schema._zod.def as { shape?: Record<string, $ZodType> }).shape ?? {};
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
    const element = (schema._zod.def as { element?: $ZodType }).element;
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
      const element = (current._zod.def as { element?: $ZodType }).element;
      if (!element) return undefined;
      current = element;
      continue;
    }

    // Named key → object shape lookup
    if (key) {
      const shape = (current._zod.def as { shape?: Record<string, $ZodType> }).shape ?? {};
      const child = shape[key];
      if (!child) return undefined;
      current = child;
    }

    // If the segment had `[]`, descend into the array element
    if (arrayBracket) {
      // SAFETY: element is $ZodType when current is a ZodArray — undefined otherwise
      const element = (current._zod.def as { element?: $ZodType }).element;
      if (!element) return undefined;
      current = element;
    }
  }

  return current;
}

function isZodSchema(value: unknown): value is $ZodType {
  if (typeof value !== 'object' || value === null) return false;
  const zodInternal = (value as { _zod?: unknown })._zod;
  return typeof zodInternal === 'object' && zodInternal !== null;
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
 *
 * @remarks
 * Maps flat dot-path keys (e.g., "address.street", "tags[]") to their target schemas
 * via resolveSchemaPath(). This bridges the flat config format (used by CLI and global fields)
 * into the registry. Warns on unresolved paths — check logs for typo detection.
 *
 * @useWhen
 * - Merging global field configs from z2f.config.ts into a registry
 * - Your config uses dot-path notation rather than nested structure
 *
 * @avoidWhen
 * - Your config is already nested mirroring schema shape — use registerDeep() instead
 *
 * @never
 * - NEVER mix with registerDeep() on the same schema — registry entries conflict silently
 * - NEVER assume numeric path segments matter — "items.0.name" and "items.2.name" resolve to the same target
 *
 * @param registry - The Zod registry to register field metadata into.
 * @param schema - The root Zod schema whose nested nodes are resolved by dot-path.
 * @param fields - Flat `Record<string, FieldConfig>` keyed by dot-path (e.g. `"address.street"`, `"tags[]"`).
 *
 * @category Registration
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

/**
 * Register `defineConfig({ schemas: ... })` entries by exported schema identity.
 *
 * Any configured export that resolves to a Zod schema in `moduleExports` is
 * attached to the registry via `registerDeep()`, so a reused exported subschema
 * carries its default component + nested field config everywhere it appears.
 */
export function registerSchemaConfigs(
  registry: $ZodRegistry<FormMeta>,
  moduleExports: Record<string, unknown>,
  schemaConfigs: ZodFormsConfig<Record<string, unknown>>['schemas'] | undefined
): void {
  if (!schemaConfigs) {
    return;
  }

  for (const [exportName, schemaConfig] of Object.entries(schemaConfigs)) {
    if (!schemaConfig) {
      continue;
    }

    const schema = moduleExports[exportName];
    if (!isZodSchema(schema)) {
      continue;
    }

    if (schemaConfig.component === undefined && schemaConfig.fields === undefined) {
      continue;
    }

    registerDeep(registry, schema, {
      ...(schemaConfig.component ? { component: schemaConfig.component } : {}),
      ...(schemaConfig.fields ? { fields: schemaConfig.fields } : {})
    } as FieldConfig<typeof schema>);
  }
}
