/**
 * Contract: ComponentOverride
 *
 * Preset-level overrides for specific component types.
 * Applied to all instances of a component unless overridden per-field.
 */
type ComponentOverride = {
  /** Use Controller/useController instead of register() */
  controlled?: boolean;

  /**
   * Default props for this component type.
   *
   * - Values matching a FieldExpression string are resolved from the RHF controller.
   * - All other values pass through as literals.
   * - Per-field props override these via shallow merge (field config wins).
   *
   * @example
   * // shadcn Select preset override
   * { controlled: true, props: { onValueChange: 'field.onChange' } }
   *
   * @example
   * // shadcn Checkbox preset override
   * { controlled: true, props: { checked: 'field.value', onCheckedChange: 'field.onChange' } }
   */
  props?: Record<string, unknown>;
};
