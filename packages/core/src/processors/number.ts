import type { $ZodNumber, $ZodBigInt } from 'zod/v4/core';
import type { FormField, FormProcessorContext, ProcessParams } from '../types.js';

/**
 * Process `z.number()` / `z.bigint()` — renders as a numeric `Input` with `type="number"`.
 * Extracts `min`/`max` from the constraint bag and detects integer constraints from `def.checks`.
 * Sets `step=1` when an integer constraint is detected.
 *
 * @param schema - The `$ZodNumber` or `$ZodBigInt` schema to process.
 * @param _ctx - The walker context (unused for number processing).
 * @param field - The base FormField to mutate in-place.
 * @param _params - Unused; included for processor signature conformance.
 *
 * @category Processors
 */
export function processNumber(
  schema: $ZodNumber | $ZodBigInt,
  _ctx: FormProcessorContext,
  field: FormField,
  _params: ProcessParams
): void {
  const bag = schema._zod.bag;
  const minimum = typeof bag['minimum'] === 'number' ? bag['minimum'] : undefined;
  const maximum = typeof bag['maximum'] === 'number' ? bag['maximum'] : undefined;

  const def = schema._zod.def;
  const checks = def.checks ?? [];
  const hasIntegerConstraint = checks.some((check: unknown) => {
    const value = check as Record<string, unknown>;
    const nested =
      (value['def'] as Record<string, unknown> | undefined) ??
      (value['_zod'] as { def?: Record<string, unknown> } | undefined)?.['def'] ??
      {};
    return (
      value['kind'] === 'int' ||
      value['check'] === 'int' ||
      nested['check'] === 'number_format' ||
      nested['format'] === 'int' ||
      nested['format'] === 'safeint'
    );
  });

  field.component = 'Input';
  field.props = {
    ...field.props,
    type: 'number'
  };

  if (minimum !== undefined) {
    field.constraints.min = minimum;
    field.props['min'] = minimum;
  }
  if (maximum !== undefined) {
    field.constraints.max = maximum;
    field.props['max'] = maximum;
  }
  if (hasIntegerConstraint) {
    field.constraints.step = 1;
    field.props['step'] = 1;
  }
}
