import { useEffect, useMemo, useState } from 'react';
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

// Dynamic import of zodResolver — keeps @hookform/resolvers out of the bundle
// when optimization is enabled and the resolver is never used.
// The promise is kicked off at module load time so it resolves before first render
// in the common case. If it hasn't resolved yet, the hook waits.
let _zodResolver: typeof import('@hookform/resolvers/zod').zodResolver | undefined;
const _resolverPromise = import('@hookform/resolvers/zod').then((mod) => {
  _zodResolver = mod.zodResolver;
});

export function useZodForm<TSchema extends ZodObject>(
  schema: TSchema,
  options?: UseZodFormOptions<TSchema>
) {
  const validationLevel = options?.optimization?.level;
  const isOptimized = validationLevel !== undefined;

  // Wait for dynamic zodResolver import when not optimized
  const [resolverLoaded, setResolverLoaded] = useState(!!_zodResolver);
  useEffect(() => {
    if (isOptimized || _zodResolver) return;
    _resolverPromise.then(() => setResolverLoaded(true));
  }, [isOptimized]);

  const baseResolver = useMemo(
    () => (isOptimized || !_zodResolver ? undefined : _zodResolver(rhfCast(schema))),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resolverLoaded triggers re-creation when import completes
    [schema, isOptimized, resolverLoaded]
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
    resolver:
      isOptimized || !baseResolver
        ? undefined
        : rhfCast((values: unknown, context: unknown, resolverOptions: unknown) =>
            baseResolver(
              rhfCast(normalizeFormValues(values)),
              context,
              // SAFETY: RHF's ResolverOptions type is not exported; narrow from unknown via parameter extraction
              resolverOptions as Parameters<typeof baseResolver>[2]
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
