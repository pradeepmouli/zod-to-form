import type { FormField } from './types.js';

/**
 * Static, schema-derived base props every field's component receives, identical
 * across all zodTypes. `aria-invalid` is intentionally excluded — it derives from
 * runtime error state, so each renderer materializes it.
 *
 * @category Helpers
 */
export function resolveBaseProps(field: FormField): Record<string, unknown> {
  const props: Record<string, unknown> = { id: field.key };
  if (field.required) props['required'] = true;
  if (field.readOnly) props['readOnly'] = true;
  if (field.disabled) props['disabled'] = true;
  return props;
}
