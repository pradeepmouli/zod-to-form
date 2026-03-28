import { useEffect, useMemo } from 'react';
import { walkSchema, registerFlat, normalizeFormValues } from '@zod-to-form/core';
import type { FormField, WalkResult, OptimizationConfig } from '@zod-to-form/core';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { $ZodType } from 'zod/v4/core';
import type { output, ZodObject } from 'zod';
import type { FieldConfig, FormMeta, FormProcessor, ZodFormRegistry } from '@zod-to-form/core';

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

// Lazy-loaded zodResolver — cached after first call.
// Keeps @hookform/resolvers out of the initial bundle when optimization is enabled.
let _zodResolver: ((schema: any) => any) | undefined;
function getZodResolver(): (schema: any) => any {
  if (!_zodResolver) {
    // Synchronous require — bundlers (Vite, webpack, Next.js) resolve this at build time.
    // Keeps @hookform/resolvers out of the bundle when optimization is enabled
    // and this code path is never reached (dead code elimination).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@hookform/resolvers/zod') as { zodResolver: (schema: any) => any };
    _zodResolver = mod.zodResolver;
  }
  return _zodResolver;
}

export function useZodForm<TSchema extends ZodObject>(
  schema: TSchema,
  options?: UseZodFormOptions<TSchema>
) {
  const validationLevel = options?.optimization?.level;
  const isOptimized = validationLevel !== undefined;

  const baseResolver = useMemo(
    () => (isOptimized ? undefined : getZodResolver()(rhfCast(schema))),
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
      if (!info?.name) return;

      const parsed = schema.safeParse(normalizeFormValues(values));
      if (parsed.success) {
        options.onValueChange?.(parsed.data as output<TSchema>);
      }
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
