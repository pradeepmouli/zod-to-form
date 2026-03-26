import { useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { walkSchema, registerFlat, normalizeFormValues } from '@zod-to-form/core';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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

export function useZodForm<TSchema extends ZodObject>(
  schema: TSchema,
  options?: UseZodFormOptions<TSchema>
) {
  const baseResolver = useMemo(() => zodResolver(rhfCast(schema)), [schema]);

  // Build a registry from flat field config when no explicit registry is provided
  const effectiveRegistry = useMemo(() => {
    if (options?.formRegistry) return options.formRegistry;
    if (!options?.fields || Object.keys(options.fields).length === 0) return undefined;
    const reg = z.registry<FormMeta>();
    registerFlat(reg, rhfCast(schema), options.fields);
    return reg;
  }, [schema, options?.formRegistry, options?.fields]);

  const walkResult = useMemo(
    () => ({
      fields: walkSchema(schema, {
        formRegistry: effectiveRegistry,
        processors: options?.processors
      }),
      error: null as string | null
    }),
    [schema, effectiveRegistry, options?.processors]
  );

  const form = useForm<output<TSchema>>({
    resolver: rhfCast((values: unknown, context: unknown, resolverOptions: unknown) =>
      baseResolver(
        rhfCast(normalizeFormValues(values)),
        context,
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
    schemaError: walkResult.error
  };
}
