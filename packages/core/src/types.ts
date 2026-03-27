import type { $ZodArray, $ZodObject, $ZodRegistry, $ZodType } from 'zod/v4/core';

// ─── Validation Strategy (used by FormField and optimizers) ──────────

export interface NativeRules {
  required?: string;
  min?: { value: number; message: string };
  max?: { value: number; message: string };
  minLength?: { value: number; message: string };
  maxLength?: { value: number; message: string };
  pattern?: { value: RegExp; message: string };
}

export interface ValidationStrategy {
  mode: 'zodSchema' | 'native' | 'component-enforced' | 'watch';
  rules?: NativeRules;
  watchFields?: string[];
  watchValidate?: (value: unknown, watchedValues: Record<string, unknown>) => true | string;
}

// ─── FormField: Intermediate Representation ───────────────────────────

export interface FormFieldOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface FormFieldConstraints {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  step?: number;
}

export interface FormField {
  /** Field path, e.g. "name", "address.street", "items.0.name" */
  key: string;
  /** Component name from ComponentMap, e.g. "Input", "Select", "Textarea" */
  component: string;
  /** Pass-through props for the component */
  props: Record<string, unknown>;
  /** Display label */
  label: string;
  /** Help text from .describe() or .meta() */
  description?: string;
  /** Placeholder from examples[0] or metadata */
  placeholder?: string;
  /** Whether the field is required */
  required: boolean;
  /** Default value from z.default() or metadata */
  defaultValue?: unknown;
  /** Read-only from z.readonly() or metadata */
  readOnly: boolean;
  /** Hidden but present in form state */
  hidden: boolean;
  /** Display order override from form registry */
  order?: number;
  /** Non-interactive state (greyed out) */
  disabled: boolean;
  /** Help text rendered below the input, distinct from description (below label) */
  helpText?: string;
  /** Whether the field is marked as deprecated in the schema registry */
  deprecated: boolean;
  /** Options for enum/union select fields */
  options?: FormFieldOption[];
  /** Children for nested objects */
  children?: FormField[];
  /** Template for array items */
  arrayItem?: FormField;
  /** Validation constraints extracted from Zod v4 constraint bag (_zod.bag) */
  constraints: FormFieldConstraints;
  /** Original Zod def.type for reference */
  zodType: string;
  /** Whether a custom render function is registered for this field (runtime only) */
  hasCustomRender?: boolean;
  /** Custom render function from FormMeta (runtime only, not serialisable) */
  render?: (field: FormField, props: Record<string, unknown>) => unknown;
  /** Atomic Zod schema for this field, set by L1 optimizer */
  zodSchema?: $ZodType;
  /** Validation strategy set by optimizers (undefined = use zodResolver) */
  validation?: ValidationStrategy;
}

// ─── FieldConfig: Serializable field configuration ────────────────────

/**
 * Known RHF field expression strings that can be used as values in `props`.
 * When a prop value matches one of these strings, it is resolved from the
 * RHF controller field at render time instead of being passed as a literal.
 */
export type FieldExpression =
  | 'field.value'
  | 'field.onChange'
  | 'field.onBlur'
  | 'field.ref'
  | 'field.name';

type FieldConfigBase = {
  /** Component name override, e.g. "Textarea", "Switch", "Combobox" */
  component?: string;
  /** Display order override */
  order?: number;
  /** Hide field from UI (remains in form state) */
  hidden?: boolean;
  /** Render as non-interactive (greyed out). Boolean only. */
  disabled?: boolean;
  /**
   * Group this field into a named section component.
   * Fields sharing the same section value are suppressed individually
   * and rendered once via the section component resolved from componentModule.
   */
  section?: string;
  /** Help text rendered below the input, distinct from description (below label) */
  helpText?: string;
  /**
   * Props passed to the rendered component.
   *
   * Values matching a known field expression string (`field.value`, `field.onChange`,
   * `field.onBlur`, `field.ref`, `field.name`) are resolved from the RHF controller
   * at render time. All other values pass through as literals.
   *
   * When both preset override props and per-field config props are present,
   * they are shallow-merged with field config winning on key conflict.
   */
  props?: Record<string, unknown>;
};

type FieldConfigExtras<T extends $ZodType> =
  // T is the unparameterized base — preserve open fallbacks for runtime/registry use
  $ZodType extends T
    ? { fields?: Record<string, FieldConfig>; arrayItems?: FieldConfig }
    : T extends $ZodObject<infer Shape>
      ? { fields?: { [K in keyof Shape]?: FieldConfig<Shape[K]> }; arrayItems?: never }
      : T extends $ZodArray<infer Item>
        ? // Item is inferred as SomeType (not $ZodType) — intersection narrows to satisfy FieldConfig's constraint
          { arrayItems?: FieldConfig<Item & $ZodType>; fields?: never }
        : // leaf schema types (string, number, boolean, etc.) — neither field applies
          Record<never, never>;

export type FieldConfig<T extends $ZodType = $ZodType> = FieldConfigBase & FieldConfigExtras<T>;

// ─── FormMeta: Registry Annotation ────────────────────────────────────

export type FormMeta<T extends $ZodType = $ZodType> = FieldConfig<T> & {
  /** Custom render function (runtime only, ignored in codegen) */
  render?: (field: FormField, props: unknown) => unknown;
};

// ─── Processor Types ──────────────────────────────────────────────────

export interface ProcessParams {
  /** Parent field path for nested fields */
  parentKey?: string;
  /** Whether this field is an array item template */
  isArrayItem?: boolean;
  /** Array item index for rendering */
  index?: number;
}

export interface FormProcessorContext {
  /** Registry mapping def.type → processor function */
  processors: Record<string, FormProcessor>;
  /** Form-specific metadata registry */
  formRegistry?: ZodFormRegistry;
  /** Current field path stack */
  path: string[];
  /** Tracks visited schema objects — prevents infinite loops from recursive schemas and avoids re-processing the same reference */
  seen: WeakSet<$ZodType>;
  /** Maximum recursion depth (default: 5) */
  maxDepth: number;
  /** Current recursion depth */
  currentDepth: number;
  /**
   * Process a child schema into a FormField.
   * Provided by the walker for use in nesting processors (object, array, union).
   * Undefined only in unit-test contexts where nesting is not being tested.
   */
  processChild?: (schema: $ZodType, key: string) => FormField;
}

export type FormProcessor<T extends $ZodType = $ZodType> = (
  schema: T,
  ctx: FormProcessorContext,
  field: FormField,
  params: ProcessParams
) => void;

// ─── Public API Options ───────────────────────────────────────────────

/** Zod v4 registry parameterized with FormMeta. Create via `z.registry<FormMeta>()`. */
export type ZodFormRegistry = $ZodRegistry<FormMeta>;

export interface WalkOptions {
  /** Custom form registry for metadata annotations */
  formRegistry?: ZodFormRegistry;
  /** Custom processors to add or override built-in ones */
  processors?: Record<string, FormProcessor>;
  /** Maximum recursion depth for lazy/recursive schemas (default: 5) */
  maxDepth?: number;
  /** AOT validation optimization settings */
  validation?: {
    level: 1 | 2 | 3;
    optimizers?: Record<
      string,
      Array<(schema: $ZodType, ctx: unknown, field: FormField, params: ProcessParams) => void>
    >;
  };
}
