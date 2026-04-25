import type { $ZodArray, $ZodObject, $ZodRegistry, $ZodType } from 'zod/v4/core';
import type { FormOptimizer } from './optimizers/types.js';

// ─── Validation Strategy (used by FormField and optimizers) ──────────

/**
 * Native HTML and RHF validation rules extracted from Zod constraints.
 * Used by L2 optimizers to produce per-field validation rules that map directly
 * to react-hook-form's `register()` options, bypassing the zodResolver overhead.
 *
 * @category Types
 */
export interface NativeRules {
  /** Required validation message shown when field is empty. */
  required?: string;
  /** Minimum numeric value constraint with violation message. */
  min?: { value: number; message: string };
  /** Maximum numeric value constraint with violation message. */
  max?: { value: number; message: string };
  /** Minimum string length constraint with violation message. */
  minLength?: { value: number; message: string };
  /** Maximum string length constraint with violation message. */
  maxLength?: { value: number; message: string };
  /** Regex pattern constraint with violation message. */
  pattern?: { value: RegExp; message: string };
}

/**
 * Specifies how a field's validation is handled at submit and change time.
 * Set by the L1/L2 optimizers; undefined means use the whole-schema zodResolver.
 *
 * @category Types
 */
export interface ValidationStrategy {
  /**
   * How validation is performed for this field:
   * - `'zodSchema'` — per-field Zod schema via `register({ validate })` (L1)
   * - `'native'` — HTML/RHF native rules from the constraint bag (L2)
   * - `'component-enforced'` — the component handles validation itself (no RHF rules emitted)
   */
  mode: 'zodSchema' | 'native' | 'component-enforced';
  /** Native RHF validation rules, populated by the L2 optimizer when `mode === 'native'`. */
  rules?: NativeRules;
  // TODO(L3): Add watch mode when cross-field optimization is implemented
  // mode: 'zodSchema' | 'native' | 'component-enforced' | 'watch';
  // watchFields?: string[];
  // watchValidate?: (value: unknown, watchedValues: Record<string, unknown>) => true | string;
}

// ─── FormField: Intermediate Representation ───────────────────────────

/**
 * An individual option in a Select, RadioGroup, or similar enum-driven component.
 * Generated from z.enum(), z.literal(), and z.union() of literals by their processors.
 *
 * @category Types
 */
export interface FormFieldOption {
  /** The option value submitted with the form (must be string or number for HTML compatibility). */
  value: string | number;
  /** Human-readable label displayed in the Select, RadioGroup, or Combobox. */
  label: string;
  /** When true, the option is shown but cannot be selected. */
  disabled?: boolean;
}

/**
 * Structural constraints extracted from Zod's `_zod.bag` for a field.
 * Used to populate HTML validation attributes (min, max, minLength, pattern, etc.)
 * and to drive the L2 native-rules optimizer output.
 *
 * @category Types
 */
export interface FormFieldConstraints {
  /** Minimum numeric value (from `z.number().min()`). */
  min?: number;
  /** Maximum numeric value (from `z.number().max()`). */
  max?: number;
  /** Minimum string length (from `z.string().min()`). */
  minLength?: number;
  /** Maximum string length (from `z.string().max()`). */
  maxLength?: number;
  /** Regex pattern as a string (from `z.string().regex()`). */
  pattern?: string;
  /** String format name (from `z.string().email()` → `'email'`, etc.). */
  format?: string;
  /** Step constraint for numeric inputs (1 for integer-constrained fields). */
  step?: number;
}

/**
 * Intermediate representation of a single form field produced by `walkSchema`.
 * Each processor fills in component, props, constraints, and optional children.
 * This structure is consumed by codegen (static TSX generation) and by the
 * runtime `FieldRenderer` to produce a live React component tree.
 *
 * @category Types
 */
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

/**
 * Configuration for collection-style field add/remove buttons.
 * Applied via FormMeta registry on schemas rendered as `ArrayField`:
 * `z.array()`, `z.set()`, and `z.map()`.
 *
 * @category Types
 */
export interface ArrayConfig {
  /** Label for the "add item" button (default: "+ Add") */
  addLabel?: string;
  /** Label for the "remove item" button (default: "− Remove") */
  removeLabel?: string;
  /**
   * Enable per-row reorder affordance. When true, the renderer mounts a
   * registered `ArrayReorderHandle` component per row and wires it to
   * `useFieldArray.move()`. Off by default — existing arrays are unchanged.
   */
  reorder?: boolean;
  /**
   * Optional callback fired after a reorder completes. Adopters who hold a
   * parallel copy of the array (e.g. a graph store) mirror the change here.
   * `from` and `to` are zero-based indices into the form-driven array
   * (excluding ghost rows).
   */
  onReorder?: (from: number, to: number) => void;
  /**
   * Non-form rows rendered before the first form-driven row. Each entry is
   * a self-contained renderable; the library never inspects its contents.
   * Ghost rows do not participate in form state, validation, or submission.
   */
  before?: GhostRow[];
  /**
   * Non-form rows rendered after the last form-driven row. Same semantics as
   * `before`.
   */
  after?: GhostRow[];
}

/**
 * A renderable row that lives inside an array section without participating
 * in form state. Used for inherited rows, computed defaults, or read-only
 * informational entries.
 *
 * @category Types
 */
export interface GhostRow {
  /**
   * Stable identifier within a `before` or `after` group. The renderer
   * combines this with the group name to form the React key
   * (`ghost-before-${id}` / `ghost-after-${id}`), so the same `id` may
   * safely appear in both groups without collision. Duplicates *within*
   * a single group emit a one-time development warning. Required so
   * that reorders of real rows don't remount ghost rows.
   */
  id: string;
  /** Render function. Receives positional context relative to other ghost rows. */
  render: (ctx: GhostRowContext) => unknown;
}

/**
 * Positional context passed to a `GhostRow`'s render function.
 *
 * @category Types
 */
export interface GhostRowContext {
  /** True if this row is the first ghost row in its `before` or `after` group. */
  isFirst: boolean;
  /** True if this row is the last ghost row in its `before` or `after` group. */
  isLast: boolean;
}

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
   * Configuration for collection-style field add/remove controls.
   * Meaningful for schemas rendered via array-style UI handling, including
   * `z.array()`, `z.set()`, and `z.map()`. Ignored on leaf/object types.
   */
  arrayConfig?: ArrayConfig;
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

/**
 * Per-field configuration that customises how a Zod schema field is rendered.
 *
 * Merges base options (component override, visibility, order, props) with type-aware
 * extras: nested `fields` for object schemas, and `arrayItems` for array schemas.
 * Use this type when annotating a `ZodFormsConfig.fields` record or a per-schema
 * `schemas.[key].fields` map.
 *
 * @typeParam T - The Zod schema type of the field, used to constrain nested `fields` and `arrayItems`.
 * @category Types
 */
export type FieldConfig<T extends $ZodType = $ZodType> = FieldConfigBase & FieldConfigExtras<T>;

// ─── FormMeta: Registry Annotation ────────────────────────────────────

/**
 * Per-schema annotation stored in a `z.registry<FormMeta>()`.
 * Extends `FieldConfig` with a runtime-only `render` function for custom field rendering.
 * Used with `registerDeep()` / `registerFlat()` to attach form metadata to Zod schemas.
 *
 * @typeParam T - The Zod schema type this meta is attached to.
 * @category Types
 */
export type FormMeta<T extends $ZodType = $ZodType> = FieldConfig<T> & {
  /** Custom render function (runtime only, ignored in codegen) */
  render?: (field: FormField, props: unknown) => unknown;
};

// ─── Processor Types ──────────────────────────────────────────────────

/**
 * Optional parameters passed to each processor alongside the schema, context, and field.
 * Provides parent key and array-item metadata needed for path construction.
 *
 * @category Types
 */
export interface ProcessParams {
  /** Parent field path for nested fields */
  parentKey?: string;
  /** Whether this field is an array item template */
  isArrayItem?: boolean;
  /** Array item index for rendering */
  index?: number;
}

/**
 * Runtime context passed to every processor during a walkSchema traversal.
 * Provides the processor registry, form registry, path tracking, cycle detection,
 * and a child-processing callback for recursive types (object, array, union).
 *
 * @category Types
 */
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

/**
 * A processor function that mutates a `FormField` in-place based on the Zod schema it handles.
 * Dispatched by the walker based on `schema._zod.def.type`. Register custom processors
 * via `walkSchema(schema, { processors: { myType: myProcessor } })`.
 *
 * @category Types
 */
export type FormProcessor<T extends $ZodType = $ZodType> = (
  schema: T,
  ctx: FormProcessorContext,
  field: FormField,
  params: ProcessParams
) => void;

// ─── Public API Options ───────────────────────────────────────────────

/** Zod v4 registry parameterized with FormMeta. Create via `z.registry<FormMeta>()`. */
export type ZodFormRegistry = $ZodRegistry<FormMeta>;

/** @category Schema Walking */
export interface WalkOptions {
  /** Custom form registry for metadata annotations */
  formRegistry?: ZodFormRegistry;
  /** Custom processors to add or override built-in ones */
  processors?: Record<string, FormProcessor>;
  /** Maximum recursion depth for lazy/recursive schemas (default: 5) */
  maxDepth?: number;
  /**
   * Validation optimization settings.
   *
   * This is the walker's API surface — callers (useZodForm, CLI codegen) pass
   * the optimization config here. The CLI reads `config.defaults.optimization`
   * and forwards it; useZodForm accepts it via its own options. Both converge
   * here as the single source of truth for the walker.
   */
  optimization?: {
    level: 1 | 2 | 3;
    optimizers?: Record<string, FormOptimizer[]>;
  };
}
