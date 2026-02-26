/**
 * @zodform/core — API Contract
 *
 * This file defines the public TypeScript interfaces for the core package.
 * It serves as the contract between core and its consumers (react, cli).
 * Implementation MUST satisfy these interfaces.
 */

import type { ZodType, ZodRegistry } from "zod";

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
  /** Options for enum/union select fields */
  options?: FormFieldOption[];
  /** Children for nested objects */
  children?: FormField[];
  /** Template for array items */
  arrayItem?: FormField;
  /** Validation constraints extracted from _zod.bag */
  constraints: FormFieldConstraints;
  /** Original Zod def.type for reference */
  zodType: string;
}

// ─── FormMeta: Registry Annotation ────────────────────────────────────

export interface FormMeta {
  /** Override component, e.g. "textarea", "switch", "combobox" */
  fieldType?: string;
  /** Display order override */
  order?: number;
  /** Hide field from UI (remains in form state) */
  hidden?: boolean;
  /** CSS grid column hint */
  gridColumn?: string;
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
  formRegistry?: ZodRegistry<FormMeta>;
  /** Current field path stack */
  path: string[];
  /** Cycle detection for recursive schemas */
  seen: WeakSet<ZodType>;
  /** Maximum recursion depth (default: 5) */
  maxDepth: number;
  /** Current recursion depth */
  currentDepth: number;
}

export type FormProcessor = (
  schema: ZodType,
  ctx: FormProcessorContext,
  field: FormField,
  params: ProcessParams
) => void;

// ─── Public API ───────────────────────────────────────────────────────

export interface WalkOptions {
  /** Custom form registry for metadata annotations */
  formRegistry?: ZodRegistry<FormMeta>;
  /** Custom processors to add or override built-in ones */
  processors?: Record<string, FormProcessor>;
  /** Maximum recursion depth for lazy/recursive schemas (default: 5) */
  maxDepth?: number;
}

/**
 * Walk a Zod schema and produce a FormField[] tree.
 *
 * @param schema - A Zod object schema (top-level must be z.object())
 * @param options - Optional configuration for the walk
 * @returns FormField[] - Ordered array of field descriptors
 */
export declare function walkSchema(
  schema: ZodType,
  options?: WalkOptions
): FormField[];

/**
 * Create a custom processor registry by merging with built-in processors.
 *
 * @param custom - Custom processors to add or override
 * @returns Merged processor registry
 */
export declare function createProcessors(
  custom: Record<string, FormProcessor>
): Record<string, FormProcessor>;

/**
 * Built-in processor registry containing handlers for all supported Zod types.
 */
export declare const builtinProcessors: Record<string, FormProcessor>;
