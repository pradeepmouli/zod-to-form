import { useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { walkSchema, registerFlat } from '@zod-to-form/core';
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

function normalizeFileLists(value: unknown): unknown {
  if (isFileListLike(value)) {
    return value.length > 0 ? (value.item(0) ?? value[0]) : undefined;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeFileLists(item));
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
      key,
      normalizeFileLists(nested)
    ]);

    return Object.fromEntries(entries);
  }

  return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return Object.prototype.toString.call(value) === '[object Object]';
}

function isFileListLike(value: unknown): value is FileList & { [index: number]: File } {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as {
    length?: unknown;
    item?: unknown;
  };

  return typeof candidate.length === 'number' && typeof candidate.item === 'function';
}

export function useZodForm<TSchema extends ZodObject>(
  schema: TSchema,
  options?: UseZodFormOptions<TSchema>
) {
  // SAFETY: ZodObject extends $ZodType at runtime but TS nominal typing on _zod.version requires the cast
  const baseResolver = useMemo(() => zodResolver(schema as never), [schema]);

  // Build a registry from flat field config when no explicit registry is provided
  const effectiveRegistry = useMemo(() => {
    if (options?.formRegistry) return options.formRegistry;
    if (!options?.fields || Object.keys(options.fields).length === 0) return undefined;
    const reg = z.registry<FormMeta>();
    try {
      // SAFETY: ZodObject extends $ZodType at runtime but TS nominal typing requires the cast
      registerFlat(reg, schema as never, options.fields);
    } catch (error) {
      console.error(
        '[zod-to-form] Failed to register field config into registry. ' +
          'The form will render without field overrides.',
        error
      );
      return undefined;
    }
    return reg;
  }, [schema, options?.formRegistry, options?.fields]);

  const fields = useMemo(() => {
    try {
      return walkSchema(schema, {
        formRegistry: effectiveRegistry,
        processors: options?.processors
      });
    } catch (err) {
      console.error('[zod-to-form] walkSchema failed:', err);
      return [];
    }
  }, [schema, effectiveRegistry, options?.processors]);

  const form = useForm<output<TSchema>>({
    // SAFETY: resolver wraps baseResolver to normalize FileLists before validation.
    // The `as never` casts are required because RHF's resolver type is nominally
    // incompatible with Zod v4's internal version discriminant, same as zodResolver above.
    resolver: ((values: unknown, context: unknown, resolverOptions: unknown) =>
      baseResolver(
        normalizeFileLists(values) as never,
        context,
        resolverOptions as Parameters<typeof baseResolver>[2]
      )) as never,
    // SAFETY: Partial<output<TSchema>> is structurally correct but RHF's DeepPartial
    // is not directly assignable — cast required at the RHF boundary.
    defaultValues: options?.defaultValues as never,
    values: options?.values as never,
    mode: options?.mode
  });

  useEffect(() => {
    if (!options?.onValueChange) {
      return undefined;
    }

    const subscription = form.watch((values, info) => {
      if (!info?.name) {
        return;
      }

      const parsed = schema.safeParse(normalizeFileLists(values));
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
    fields
  };
}
