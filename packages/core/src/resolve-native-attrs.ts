import type { FormField } from './types.js';

/**
 * The set of DOM-valid native input attributes extracted from `field.props`.
 * This is the single source of truth so runtime and codegen agree on which props
 * flow through to the native element. Extend deliberately, not blindly.
 *
 * @category Helpers
 */
export const NATIVE_INPUT_ATTRS = [
  'type',
  'minLength',
  'maxLength',
  'pattern',
  'min',
  'max',
  'step'
] as const;

/**
 * Extract DOM-valid native attributes from a field's props.
 *
 * Only keys listed in `NATIVE_INPUT_ATTRS` are included; internal props (e.g.
 * `_isSet`) and component-specific props are silently ignored. Null and
 * undefined values are skipped so the result only contains meaningful attrs.
 *
 * @category Helpers
 */
export function resolveNativeAttrs(field: FormField): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const name of NATIVE_INPUT_ATTRS) {
    const v = field.props[name];
    if (v !== undefined && v !== null) out[name] = v;
  }
  return out;
}
