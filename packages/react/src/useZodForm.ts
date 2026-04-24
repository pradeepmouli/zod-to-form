import { useEffect, useMemo } from 'react';
import { walkSchema, registerFlat, normalizeFormValues } from '@zod-to-form/core';
import type { FormField, WalkResult, OptimizationConfig } from '@zod-to-form/core';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { $ZodType } from 'zod/v4/core';
import type { output, ZodObject } from 'zod';
import type { FieldConfig, FormMeta, FormProcessor, ZodFormRegistry } from '@zod-to-form/core';
import { zodResolver } from '@hookform/resolvers/zod';

type UseZodFormOptions<TSchema extends ZodObject> = {
  defaultValues?: Partial<output<TSchema>>;
  /** Controlled external data — RHF re-renders on change. See react-hook-form `values` option. */
  values?: output<TSchema>;
  /** Pre-populated registry — when provided, `fields` is ignored entirely. */
  formRegistry?: ZodFormRegistry;
  /** Flat field config (from defineConfig / componentConfig). Auto-registers into a registry. */
  fields?: Record<string, FieldConfig>;
  processors?: Record<string, FormProcessor>;
  mode?: 'onSubmit' | 'onChange' | 'onBlur';
  onValueChange?: (values: output<TSchema>) => void;
  /** Validation optimization config. When set, skips zodResolver and uses per-field validation. */
  optimization?: OptimizationConfig;
};

/**
 * Bridge cast for the Zod v4 ↔ RHF type boundary.
 * RHF's resolver type is nominally incompatible with Zod v4's internal
 * `_zod.version` discriminant. This single cast point replaces scattered
 * `as never` throughout the hook.
 */
function rhfCast<T>(value: T): never {
  return value as never;
}

// zodResolver is imported statically but only invoked when optimization is NOT enabled.
// Bundlers that support tree-shaking of unused imports (Vite, webpack 5, esbuild)
// can eliminate it when all call sites are dead code. For full elimination,
// a separate entrypoint (@zod-to-form/react/optimized) would be needed — tracked
// as a future improvement.

/**
 * React Hook Form integration hook for Zod v4 schemas.
 *
 * Walks the schema to produce `FormField[]` and wires `useForm` with a
 * `zodResolver`. When `options.optimization` is set the `zodResolver` is
 * replaced by per-field validation (via `schemaLite`) and the resolver
 * import is tree-shaken in production builds.
 *
 * @param schema - The `z.object({...})` schema to generate the form from.
 * @param options - Optional hook configuration.
 * @returns `{ form, fields }` — the RHF `UseFormReturn` and the `FormField[]` array.
 *
 * @example
 * ```tsx
 * const { form, fields } = useZodForm(loginSchema);
 * return (
 *   <form onSubmit={form.handleSubmit(onSubmit)}>
 *     {fields.map((f) => <input key={f.key} {...form.register(f.key)} />)}
 *   </form>
 * );
 * ```
 *
 * @useWhen
 * - You need direct access to the RHF `form` instance (e.g. to call `form.setValue`)
 * - You are building a custom renderer on top of `FormField[]`
 * - You want to colocate form state management with your own layout logic
 *
 * @avoidWhen
 * - You just need a working form UI — use `<ZodForm>` instead; `useZodForm` returns `fields[]` and `form`, but rendering those fields requires wiring up each field component yourself
 *
 * @never
 * - NEVER pass a new schema object on every render — `walkSchema` is memoized by schema
 *   identity; an unstable reference causes re-walking on every render cycle; FIX: declare
 *   the schema outside the component or wrap in `useMemo`
 * - NEVER forget `normalizeFormValues()` before manually calling `schema.safeParse()` —
 *   the hook's internal resolver applies normalization, but manual calls do not; FIX:
 *   always call `schema.safeParse(normalizeFormValues(values))`
 * - NEVER mix `formRegistry` and `fields` options on the same call — when `formRegistry`
 *   is provided, `fields` is ignored entirely with no merge and no warning; FIX: pick one
 *   or merge field config into the registry manually before passing it
 *
 * @category Hooks
 */
export function useZodForm<TSchema extends ZodObject>(
  schema: TSchema,
  options?: UseZodFormOptions<TSchema>
) {
  const validationLevel = options?.optimization?.level;
  const isOptimized = validationLevel !== undefined;

  const baseResolver = useMemo(
    () => (isOptimized ? undefined : zodResolver(rhfCast(schema))),
    [schema, isOptimized]
  );

  // Build a registry from flat field config when no explicit registry is provided
  const effectiveRegistry = useMemo(() => {
    if (options?.formRegistry) return options.formRegistry;
    if (!options?.fields || Object.keys(options.fields).length === 0) return undefined;
    const reg = z.registry<FormMeta>();
    try {
      registerFlat(reg, rhfCast(schema), options.fields);
    } catch (error) {
      console.error('[zod-to-form] Failed to register field config into registry.', error);
      return undefined;
    }
    return reg;
  }, [schema, options?.formRegistry, options?.fields]);

  const walkResult = useMemo((): {
    fields: FormField[];
    schemaLite: $ZodType | null;
    error: string | null;
  } => {
    try {
      if (isOptimized) {
        const result: WalkResult = walkSchema(schema, {
          formRegistry: effectiveRegistry,
          processors: options?.processors,
          optimization: { level: validationLevel! }
        });
        return { fields: result.fields, schemaLite: result.schemaLite, error: null };
      }
      return {
        fields: walkSchema(schema, {
          formRegistry: effectiveRegistry,
          processors: options?.processors
        }),
        schemaLite: null,
        error: null
      };
    } catch (err) {
      console.error('[zod-to-form] walkSchema failed:', err);
      return {
        fields: [] as FormField[],
        schemaLite: null,
        error: err instanceof Error ? err.message : 'Schema processing failed'
      };
    }
  }, [schema, effectiveRegistry, options?.processors, validationLevel, isOptimized]);

  const form = useForm<output<TSchema>>({
    // When optimized, skip zodResolver — per-field validation is handled by register({ validate })
    resolver: isOptimized
      ? undefined
      : rhfCast((values: unknown, context: unknown, resolverOptions: unknown) =>
          baseResolver!(
            rhfCast(normalizeFormValues(values)),
            context,
            // SAFETY: RHF's ResolverOptions type is not exported; narrow from unknown via parameter extraction
            resolverOptions as Parameters<NonNullable<typeof baseResolver>>[2]
          )
        ),
    defaultValues: rhfCast(options?.defaultValues),
    values: rhfCast(options?.values),
    mode: options?.mode
  });

  useEffect(() => {
    if (!options?.onValueChange) return;

    const subscription = form.watch((values, info) => {
      // `info.name` is absent on programmatic resets / mount — skip those.
      if (!info?.name) return;

      // Fire on every field change so the consumer's state tracks user input
      // keystroke-by-keystroke. The auto-save codegen path does the same thing
      // (see packages/codegen/src/generate.ts — `watch((values) => ...)` with
      // no validity gate), so runtime + generated output stay consistent.
      //
      // If the current form state parses cleanly, hand back the coerced data
      // (numbers become numbers, empty-string enums become undefined, etc.).
      // Otherwise surface the normalized raw values — the consumer's state is
      // "what the user last typed" either way. Callers who care about validity
      // should gate on `formState.isValid` or render errors via the resolver.
      const normalized = normalizeFormValues(values);
      const parsed = schema.safeParse(normalized);
      const next = parsed.success
        ? (parsed.data as output<TSchema>)
        : (normalized as output<TSchema>);
      options.onValueChange?.(next);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [options?.onValueChange, schema, form]);

  return {
    form,
    fields: walkResult.fields,
    /** Non-null when walkSchema threw — lets consumers display the error instead of an empty form */
    schemaError: walkResult.error,
    /** SchemaLite for submit-time validation (non-null when optimization is enabled and top-level effects exist) */
    schemaLite: walkResult.schemaLite
  };
}
