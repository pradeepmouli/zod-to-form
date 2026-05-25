import type { FormField, NativeRules } from './types.js';

/**
 * Framework-agnostic descriptor of the register options a field requires.
 *
 * React translates this into actual RHF `register()` options (via `setValueAs`
 * functions); codegen emits the equivalent static source code.  Neither the
 * type nor the builder has any dependency on RHF or React.
 *
 * The `coerce` kind replaces the old `valueAsNumber`/`valueAsDate` flags.
 * Both consumers **must** produce the canonical `setValueAs` semantics below —
 * this eliminates the P1 (NaN on empty optional number) and P2 (bigint
 * precision) bugs caused by `valueAsNumber: true`.
 *
 * Canonical `setValueAs` semantics (single source of truth):
 * - **number**: `(v) => (v === '' || v == null ? undefined : Number(v))`
 * - **bigint**: `(v) => { if (v === '' || v == null) return undefined; try { return BigInt(v); } catch { return v; } }`
 * - **date**:   `(v) => (v === '' || v == null ? undefined : new Date(v))`
 * - **file**:   `(v) => (v instanceof FileList ? (v.length > 0 ? v.item(0) : undefined) : v)`
 *
 * @category Types
 */
export interface FieldRegisterHints {
  /**
   * Coercion kind — consumers produce a `setValueAs` function matching the
   * canonical semantics documented above.  Empty strings and null/undefined
   * always map to `undefined` so optional fields validate correctly.
   */
  coerce?: 'number' | 'bigint' | 'date' | 'file';
  /**
   * Native HTML / RHF validation rules extracted from Zod constraints (L2).
   * Keys mirror `NativeRules` exactly.
   */
  nativeRules?: NativeRules;
  /**
   * `validate: true` — marker indicating per-field Zod schema validation (L1)
   * should be wired in.  The actual validate function is constructed by the
   * consumer because it closes over the live Zod schema object.
   */
  validate?: true;
}

/**
 * Derive framework-agnostic register hints from a `FormField`.
 *
 * The `coerce` kind drives `setValueAs` in both the runtime renderer
 * (`@zod-to-form/react`) and the code generator (`@zod-to-form/codegen`).
 *
 * @category Helpers
 */
export function getFieldRegisterHints(field: FormField): FieldRegisterHints {
  const hints: FieldRegisterHints = {};

  if (field.zodType === 'number') {
    hints.coerce = 'number';
  } else if (field.zodType === 'bigint') {
    hints.coerce = 'bigint';
  } else if (field.zodType === 'date') {
    hints.coerce = 'date';
  } else if (field.zodType === 'file') {
    hints.coerce = 'file';
  }

  if (field.validation?.mode === 'native' && field.validation.rules) {
    const rules = field.validation.rules;
    const nativeRules: NativeRules = {};
    if (rules.required) nativeRules.required = rules.required;
    if (rules.min) nativeRules.min = rules.min;
    if (rules.max) nativeRules.max = rules.max;
    if (rules.minLength) nativeRules.minLength = rules.minLength;
    if (rules.maxLength) nativeRules.maxLength = rules.maxLength;
    if (rules.pattern) nativeRules.pattern = rules.pattern;
    hints.nativeRules = nativeRules;
  } else if (field.validation?.mode === 'zodSchema') {
    hints.validate = true;
  }
  // 'component-enforced': no hints emitted

  return hints;
}
