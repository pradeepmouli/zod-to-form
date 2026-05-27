/**
 * Runtime React renderer for Zod v4 form schemas — wraps react-hook-form with a schema walker that maps Zod types to form components.
 *
 * Provides the `<ZodForm>` component and `useZodForm()` hook for dynamically rendering
 * forms from a `z.object()` schema at runtime — no codegen required. Use this package
 * when you need schema-driven forms that adapt to runtime schema changes.
 *
 * Key exports:
 * - `ZodForm` — the top-level form component; wraps RHF `FormProvider`
 * - `useZodForm` — hook that calls `walkSchema` and wires up RHF for you
 * - `normalizeFormValues` — call before `schema.safeParse()` to convert HTML empty strings
 * - `defaultComponentMap` — the built-in HTML component set
 * - `shadcnComponentMap` — the shadcn/ui component set
 * - `wrapWithSchemaLite` — wrap a submit handler with the lite schema for optimized validation
 *
 * @remarks
 * Choose your abstraction level: `<ZodForm>` for zero-config, `useZodForm` for custom
 * rendering, manual `walkSchema` for full control. Each step down trades convenience for
 * flexibility.
 *
 * @useWhen
 * - You need runtime schema-driven forms with dynamic schema changes — no rebuild needed when the schema updates
 * - You are prototyping and don't want a codegen step — `<ZodForm>` renders immediately from any `z.object()`
 * - Your schema is determined at runtime (e.g. from a backend API) — the walker evaluates schemas lazily on render
 *
 * @avoidWhen
 * - Performance is critical and you can run codegen at build time — prefer `@zod-to-form/cli` for static `.tsx` output with zero runtime overhead
 * - You need SSR with no client bundle — generated static components are lighter and have no React runtime dependency on `walkSchema`
 *
 * @never
 * - NEVER call `schema.safeParse(formValues)` without first calling `normalizeFormValues(formValues)` — HTML inputs produce `""` for unset optional fields, which Zod's `.optional()` rejects with a confusing "expected string, received string" error; FIX: always use `schema.safeParse(normalizeFormValues(values))`
 * - NEVER use a Zod v3 schema — this package requires Zod v4's `_zod.bag` and `z.registry()` APIs; FIX: upgrade to `zod@^4.0.0` or use the Zod v3 JSON Schema path without this package
 *
 * @packageDocumentation
 */

// @zod-to-form/react — Public API

// Re-export core types consumers may need
export type {
  FormField,
  FormFieldOption,
  FormFieldConstraints,
  FormMeta,
  FieldConfig,
  WalkOptions
} from '@zod-to-form/core';

// Runtime renderer
export { ZodForm } from './ZodForm.js';
export type { ZodFormComponents } from './ZodForm.js';
export { useZodForm } from './useZodForm.js';
export { useExternalSync } from './useExternalSync.js';
export type { UseExternalSyncOptions } from './useExternalSync.js';
export { ZodFormSwitch } from './ZodFormSwitch.js';
export type { ZodFormSwitchProps } from './ZodFormSwitch.js';
// Re-export normalizeFormValues from core for backward compatibility
export { normalizeFormValues } from '@zod-to-form/core';
export { wrapWithSchemaLite } from './SchemaLiteSubmit.js';
export { defaultComponentMap } from './components/index.js';
export { shadcnComponentMap } from './shadcn/index.js';

// User-facing component names (excludes internal Field wrappers)
export { FIELD_COMPONENT_NAMES } from './components/index.js';
export type { RuntimeComponentConfig, FieldTemplateProps } from './FieldRenderer.js';
