import type { ZodType } from 'zod';

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
  /** CSS grid-column hint from form registry */
  gridColumn?: string;
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
}

// ─── FieldConfig: Serializable field configuration ────────────────────

export interface FieldConfig {
  /** Override component, e.g. "textarea", "switch", "combobox" */
  fieldType?: string;
  /** Display order override */
  order?: number;
  /** Hide field from UI (remains in form state) */
  hidden?: boolean;
  /** CSS grid column hint */
  gridColumn?: string;
  /** Arbitrary field metadata props forwarded by processors */
  props?: Record<string, unknown>;
  /** Per-field prop mapping override (merges over ComponentEntry.propMap) */
  propMap?: Record<string, string>;
}

// ─── FormMeta: Registry Annotation ────────────────────────────────────

export interface FormMeta extends FieldConfig {
  /** Custom render function (runtime only, ignored in codegen) */
  render?: (field: FormField, props: unknown) => unknown;
}

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
  /** Cycle detection for recursive schemas */
  seen: WeakSet<ZodType>;
  /** Maximum recursion depth (default: 5) */
  maxDepth: number;
  /** Current recursion depth */
  currentDepth: number;
  /**
   * Process a child schema into a FormField.
   * Provided by the walker for use in nesting processors (object, array, union).
   * Undefined only in unit-test contexts where nesting is not being tested.
   */
  processChild?: (schema: ZodType, key: string) => FormField;
}

export type FormProcessor = (
  schema: ZodType,
  ctx: FormProcessorContext,
  field: FormField,
  params: ProcessParams
) => void;

// ─── Public API Options ───────────────────────────────────────────────

/**
 * Type alias for the form registry. Uses the Zod registry system
 * with FormMeta as the metadata shape.
 * Consumers create this via: `const formRegistry = z.registry<FormMeta>()`
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ZodFormRegistry = {
  get(schema: ZodType): FormMeta | undefined;
  has(schema: ZodType): boolean;
};

export interface WalkOptions {
  /** Custom form registry for metadata annotations */
  formRegistry?: ZodFormRegistry;
  /** Custom processors to add or override built-in ones */
  processors?: Record<string, FormProcessor>;
  /** Maximum recursion depth for lazy/recursive schemas (default: 5) */
  maxDepth?: number;
}
