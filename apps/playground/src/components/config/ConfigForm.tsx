import type { ZodObject } from 'zod';
import type { FormField } from '@zod-to-form/core';
import { ZodForm, defaultComponentMap } from '@zod-to-form/react';

interface ConfigFormProps {
  schema: ZodObject;
  defaultValues: Record<string, unknown>;
  fields: FormField[] | null;
  onChange: (values: Record<string, unknown>) => void;
}

export function ConfigForm({ schema, defaultValues, fields, onChange }: ConfigFormProps) {
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
        components={defaultComponentMap}
        mode="onChange"
      />
    </div>
  );
}
