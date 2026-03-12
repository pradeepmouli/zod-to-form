import { useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { walkSchema } from '@zod-to-form/core';
import { useForm } from 'react-hook-form';
import type { output, ZodObject } from 'zod';
import type { FormProcessor, ZodFormRegistry } from '@zod-to-form/core';

type UseZodFormOptions<TSchema extends ZodObject> = {
  defaultValues?: Partial<output<TSchema>>;
  /** Controlled external data — RHF re-renders on change. See react-hook-form `values` option. */
  values?: output<TSchema>;
  formRegistry?: ZodFormRegistry;
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
  const baseResolver = useMemo(() => zodResolver(schema), [schema]);

  const fields = useMemo(
    () =>
      walkSchema(schema, {
        formRegistry: options?.formRegistry,
        processors: options?.processors
      }),
    [schema, options?.formRegistry, options?.processors]
  );

  const form = useForm<output<TSchema>>({
    resolver: ((values: unknown, context: unknown, resolverOptions: unknown) =>
      baseResolver(
        normalizeFileLists(values) as any,
        context,
        resolverOptions as Parameters<typeof baseResolver>[2]
      )) as any,
    defaultValues: options?.defaultValues as any,
    values: options?.values as any,
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
  }, [options?.onValueChange, schema]);

  return {
    form,
    fields
  };
}
