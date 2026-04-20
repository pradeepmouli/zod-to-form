import type {
  $ZodType as ZodType,
  $ZodDiscriminatedUnion,
  $ZodUnion,
  $ZodObject,
  $ZodLiteral
} from 'zod/v4/core';
import type { FormField, FormFieldOption, FormProcessorContext, ProcessParams } from '../types.js';
import { inferLabel } from '../utils.js';

function getLiteralValues(schema: ZodType): (string | number | boolean)[] {
  const def = schema._zod.def;
  if (def.type === 'literal') {
    const values = (def as { values?: (string | number | boolean)[] }).values;
    return values ?? [];
  }
  return [];
}

function buildOptionFromLiteral(schema: ZodType): FormFieldOption | null {
  const values = getLiteralValues(schema);
  if (values.length === 0) return null;
  const value = values[0];
  const strValue = String(value);
  return { value: strValue, label: inferLabel(strValue) };
}

function isAllLiterals(options: ZodType[]): boolean {
  return options.every((opt) => {
    return opt._zod.def.type === 'literal';
  });
}

/**
 * Process `z.union()` — renders as a `Select` when all options are literals,
 * or delegates to `processDiscriminatedUnion` when a discriminator property is detected.
 * Falls back to a plain `Input` for mixed unions.
 *
 * @param schema - The `$ZodUnion` schema to process.
 * @param ctx - The walker context (used by discriminated union delegation).
 * @param field - The base FormField to mutate in-place.
 * @param params - Parent path metadata for discriminated union child keys.
 *
 * @remarks
 * Discriminated unions have `def.type === "union"` in Zod v4 — they are detected
 * by the presence of a `discriminator` property in the def. This processor handles both.
 *
 * @category Processors
 */
export function processUnion(
  schema: $ZodUnion,
  ctx: FormProcessorContext,
  field: FormField,
  params: ProcessParams
): void {
  const def = schema._zod.def;
  const options = def.options as ZodType[] | undefined;

  if (!options || options.length === 0) {
    field.component = 'Input';
    return;
  }

  // Discriminated union: $ZodDiscriminatedUnion extends $ZodUnion, so def.type is "union"
  // but the def has a `discriminator` property. Delegate to the specialized processor.
  if ('discriminator' in def && typeof def.discriminator === 'string') {
    processDiscriminatedUnion(schema as unknown as $ZodDiscriminatedUnion, ctx, field, params);
    return;
  }

  // Regular union: only render as Select if all options are literals
  if (isAllLiterals(options)) {
    field.component = 'Select';
    field.options = options
      .map(buildOptionFromLiteral)
      .filter((opt): opt is FormFieldOption => opt !== null);
    return;
  }

  // Fallback for mixed unions
  field.component = 'Input';
}

/**
 * Process `z.discriminatedUnion()` — renders as a `Select` for the discriminator field,
 * with variant child fields stored in `field.props._variants` for runtime conditional rendering.
 * The runtime `DiscriminatedUnionBlock` and codegen both read `_discriminator` and `_variants`.
 *
 * @param schema - The `$ZodDiscriminatedUnion` schema to process.
 * @param ctx - The walker context providing child processing for variant shape entries.
 * @param field - The base FormField to mutate in-place.
 * @param params - Parent path metadata for constructing variant child field keys.
 *
 * @remarks
 * The discriminator select options are derived from the literal values in each variant's
 * discriminator field. Variant child fields (excluding the discriminator key) are pre-processed
 * and stored keyed by their discriminator value string.
 *
 * @category Processors
 */
export function processDiscriminatedUnion(
  schema: $ZodDiscriminatedUnion,
  ctx: FormProcessorContext,
  field: FormField,
  params: ProcessParams
): void {
  const def = schema._zod.def;
  const options = def.options as ZodType[] | undefined;
  const discriminator = def.discriminator;

  if (!options || options.length === 0 || !discriminator) {
    field.component = 'Input';
    return;
  }

  field.component = 'Select';
  field.props['_discriminator'] = discriminator;

  const selectOptions: FormFieldOption[] = [];
  const variants: Record<string, FormField[]> = {};

  for (const variantSchema of options) {
    const shape = (variantSchema as $ZodObject)._zod.def.shape as Record<string, ZodType>;

    const discSchema = shape[discriminator];
    if (!discSchema) continue;

    const discValues = (discSchema as $ZodLiteral)._zod.def.values;
    const discValue = discValues?.[0];
    if (discValue === undefined) continue;

    const strValue = String(discValue);
    selectOptions.push({ value: strValue, label: inferLabel(strValue) });

    if (ctx.processChild) {
      const variantChildren: FormField[] = Object.entries(shape)
        .filter(([key]) => key !== discriminator)
        .map(([key, childSchema]) => {
          const fullKey = params.parentKey ? `${params.parentKey}.${key}` : key;
          return ctx.processChild!(childSchema, fullKey);
        });
      variants[strValue] = variantChildren;
    } else {
      variants[strValue] = [];
    }
  }

  field.options = selectOptions;
  field.props['_variants'] = variants;
}
