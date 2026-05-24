import type { FormField, NativeRules } from './types.js';

/**
 * Framework-agnostic descriptor of the register options a field requires.
 *
 * React translates this into actual RHF `register()` options; codegen emits
 * the equivalent static code.  Neither the type nor the builder has any
 * dependency on RHF or React.
 *
 * @category Types
 */
export interface FieldRegisterHints {
  /** `valueAsNumber: true` — for number and bigint fields */
  valueAsNumber?: true;
  /** `valueAsDate: true` — for date fields */
  valueAsDate?: true;
  /**
   * `setValueAs: 'file'` — marker indicating the `setValueAs` option is needed
   * to coerce a `FileList` to the first `File`.  The actual function is created
   * by the consumer (react/codegen) because it can't be serialised.
   */
  setValueAs?: 'file';
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
 * Mirrors the branching in `getRegisterOptions` in `@zod-to-form/react`
 * exactly — both consumers must stay in sync with this function.
 *
 * @category Helpers
 */
export function getFieldRegisterHints(field: FormField): FieldRegisterHints {
  const hints: FieldRegisterHints = {};

  if (field.zodType === 'number' || field.zodType === 'bigint') {
    hints.valueAsNumber = true;
  }

  if (field.zodType === 'date') {
    hints.valueAsDate = true;
  }

  if (field.zodType === 'file') {
    hints.setValueAs = 'file';
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
