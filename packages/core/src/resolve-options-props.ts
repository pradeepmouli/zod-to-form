import type { FormField } from './types.js';

/**
 * Extract options props from a field for enum/union select-style components.
 *
 * Returns `{ options: field.options }` when the field carries options, or `{}`
 * for fields without options (e.g. plain string/number inputs). This is the
 * single source so runtime and codegen agree on how options flow to a component.
 *
 * @category Helpers
 */
export function resolveOptionsProps(field: FormField): Record<string, unknown> {
  return field.options ? { options: field.options } : {};
}
