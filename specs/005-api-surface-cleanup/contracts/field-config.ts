/**
 * Contract: FieldConfigBase
 *
 * Per-field configuration provided by library consumers.
 * Used in both runtime (<ZodForm>) and codegen (CLI) paths.
 */

/** The exact set of RHF field expressions recognized in props values */
type FieldExpression =
  | 'field.value'
  | 'field.onChange'
  | 'field.onBlur'
  | 'field.ref'
  | 'field.name';

/**
 * Base field configuration. Extended by FieldConfigExtras<T> to add
 * recursive `fields` (for objects) and `arrayItems` (for arrays).
 */
type FieldConfigBase = {
  /** Component name resolved from componentModule (works for both leaf and object fields) */
  component?: string;

  /** Display order override (default: schema declaration order) */
  order?: number;

  /** Hide from UI while keeping in form state */
  hidden?: boolean;

  /** Render as non-interactive (greyed out). Boolean only — conditional form deferred. */
  disabled?: boolean;

  /** Group into a named section (resolved from componentModule) */
  section?: string;

  /** Help text rendered below the input, distinct from description (below label) */
  helpText?: string;

  /**
   * Props passed to the rendered component.
   *
   * - Values matching a FieldExpression string are resolved from the RHF controller at render time.
   * - All other values pass through as literals.
   * - Merged with ComponentOverride.props via shallow merge (field config wins on conflict).
   *
   * @example
   * // Literal + field expression in one object
   * props: { placeholder: 'Pick one', onValueChange: 'field.onChange' }
   */
  props?: Record<string, unknown>;
};
