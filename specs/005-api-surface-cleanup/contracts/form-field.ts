/**
 * Contract: FormField (Intermediate Representation)
 *
 * Produced by the schema walker, consumed by runtime renderer and codegen.
 * Changes from current: removed gridColumn, added deprecated/disabled/helpText.
 */
interface FormField {
  /** Field path: "name", "address.street", "items.0.name" */
  key: string;

  /** Component name from processor or field config override */
  component: string;

  /** Pass-through props (includes resolved field expressions at render time) */
  props: Record<string, unknown>;

  /** Display label */
  label: string;

  /** Help text below label */
  description?: string;

  /** Placeholder text */
  placeholder?: string;

  /** Whether the field is required */
  required: boolean;

  /** Default value from schema */
  defaultValue?: unknown;

  /** Read-only state */
  readOnly: boolean;

  /** Hidden from UI (remains in form state) */
  hidden: boolean;

  /** Non-interactive state (greyed out) */
  disabled?: boolean;

  /** Help text below input (distinct from description) */
  helpText?: string;

  /** Whether the field is marked as deprecated in the schema registry */
  deprecated?: boolean;

  /** Display order override */
  order?: number;

  /** Select/radio/combobox options */
  options?: FormFieldOption[];

  /** Nested object children */
  children?: FormField[];

  /** Array item template */
  arrayItem?: FormField;

  /** Extracted Zod constraints */
  constraints: FormFieldConstraints;

  /** Original Zod def.type */
  zodType: string;

  /** Custom render function override */
  hasCustomRender?: boolean;
  render?: (field: FormField, props: Record<string, unknown>) => unknown;
}
