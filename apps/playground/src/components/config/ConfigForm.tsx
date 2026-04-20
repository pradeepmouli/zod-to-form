import { useMemo, type ComponentType } from 'react';
import type { ZodObject } from 'zod';
import type { FormField } from '@zod-to-form/core';
import { ZodForm, defaultComponentMap, shadcnComponentMap } from '@zod-to-form/react';
import type { ComponentMapType } from '../../types/playground.ts';

interface ConfigFormProps {
  schema: ZodObject;
  defaultValues: Record<string, unknown>;
  fields: FormField[] | null;
  onChange: (values: Record<string, unknown>) => void;
  /** Which preset to use for rendering the config form itself (dogfooding) */
  componentMap?: ComponentMapType;
  /** Compiled shadcn components from the registry (overrides preset stubs when available) */
  compiledComponents?: Record<string, ComponentType<Record<string, unknown>>>;
}

export function ConfigForm({
  schema,
  defaultValues,
  fields,
  onChange,
  componentMap = 'default',
  compiledComponents
}: ConfigFormProps) {
  const components = useMemo(() => {
    const base =
      componentMap === 'shadcn'
        ? (shadcnComponentMap as unknown as typeof defaultComponentMap)
        : defaultComponentMap;
    if (!compiledComponents || Object.keys(compiledComponents).length === 0) {
      return base;
    }
    return { ...base, ...compiledComponents } as typeof defaultComponentMap;
  }, [componentMap, compiledComponents]);

  if (!fields || fields.length === 0) {
    return (
      <div
        className="h-full flex items-center justify-center text-sm"
        style={{ color: 'var(--text-muted)' }}
      >
        No fields to configure. Add fields to your schema to see config options.
      </div>
    );
  }

  return (
    <div className="config-form-area">
      <ZodForm
        schema={schema}
        defaultValues={defaultValues}
        onValueChange={onChange}
        onSubmit={() => {}}
        components={components}
        mode="onChange"
      />
    </div>
  );
}
