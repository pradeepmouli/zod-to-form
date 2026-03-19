import type { $ZodType as ZodType } from 'zod/v4/core';
import type { FormField, FormFieldOption, FormProcessorContext, ProcessParams } from '../types.js';
import { inferLabel } from '../utils.js';
import { getDef, getShape } from './_utils.js';

function getLiteralValues(schema: ZodType): (string | number | boolean)[] {
  const def = getDef(schema);
  if (def['type'] === 'literal') {
    const values = def['values'] as (string | number | boolean)[] | undefined;
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
    const def = getDef(opt);
    return def['type'] === 'literal';
  });
}

export function processUnion(
  schema: ZodType,
  ctx: FormProcessorContext,
  field: FormField,
  params: ProcessParams
): void {
  const def = getDef(schema);
  const options = def['options'] as ZodType[] | undefined;
  const discriminator = def['discriminator'] as string | undefined;

  if (!options || options.length === 0) {
    field.component = 'Input';
    return;
  }

  // Discriminated union
  if (discriminator) {
    processDiscriminatedUnion(field, options, discriminator, params, ctx);
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

function processDiscriminatedUnion(
  field: FormField,
  options: ZodType[],
  discriminator: string,
  params: ProcessParams,
  ctx: FormProcessorContext
): void {
  field.component = 'Select';
  field.props['_discriminator'] = discriminator;

  const selectOptions: FormFieldOption[] = [];
  const variants: Record<string, FormField[]> = {};

  for (const variantSchema of options) {
    const variantDef = getDef(variantSchema);
    const shape = getShape(variantDef);

    // Find the discriminator literal value
    const discSchema = shape[discriminator];
    if (!discSchema) continue;

    const discDef = getDef(discSchema);
    const discValues = discDef['values'] as (string | number | boolean)[] | undefined;
    const discValue = discValues?.[0];
    if (discValue === undefined) continue;

    const strValue = String(discValue);
    selectOptions.push({ value: strValue, label: inferLabel(strValue) });

    // Build children for this variant (excluding the discriminator field itself)
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
