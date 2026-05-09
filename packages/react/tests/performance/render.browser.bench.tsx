import { bench, describe } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { FormProvider } from 'react-hook-form';
import { walkSchema } from '@zod-to-form/core';
import type { ZodObject } from 'zod';
import { FieldRenderer } from '../../src/FieldRenderer.js';
import { defaultComponentMap } from '../../src/index.js';
import { useZodForm } from '../../src/useZodForm.js';
import { smallSchema, mediumSchema, largeSchema } from './schemas.js';

const _noop = () => {};

/**
 * Test component: renders a form via useZodForm with a specific optimization level.
 * We render FieldRenderer directly (not <ZodForm>) so we can pass the optimization
 * option — the ZodForm wrapper doesn't forward it.
 */
function BenchForm({
  schema,
  level
}: {
  schema: ZodObject;
  level: 1 | 2 | undefined;
}): React.ReactElement {
  const { fields, form } = useZodForm(schema, {
    optimization: level !== undefined ? { level } : undefined
  });

  return (
    <FormProvider {...form}>
      <form>
        {fields.map((field) => (
          <FieldRenderer key={field.key} field={field} components={defaultComponentMap} />
        ))}
      </form>
    </FormProvider>
  );
}

/**
 * Render a component synchronously and unmount.
 * Uses flushSync to ensure React commits before we return.
 */
function renderAndUnmount(element: React.ReactElement): void {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  flushSync(() => {
    root.render(element);
  });
  flushSync(() => {
    root.unmount();
  });
  document.body.removeChild(container);
}

const schemas = [
  { name: 'small (5 fields)', schema: smallSchema },
  { name: 'medium (18 fields)', schema: mediumSchema },
  { name: 'large (50 fields)', schema: largeSchema }
] as const;

// Full form render: useZodForm (walk + optimizer chain) + React mount + unmount
describe('browser render (walk + React mount)', () => {
  for (const { name, schema } of schemas) {
    describe(name, () => {
      bench('no optimization', () => {
        renderAndUnmount(<BenchForm schema={schema as ZodObject} level={undefined} />);
      });

      bench('L1', () => {
        renderAndUnmount(<BenchForm schema={schema as ZodObject} level={1} />);
      });

      bench('L2', () => {
        renderAndUnmount(<BenchForm schema={schema as ZodObject} level={2} />);
      });
    });
  }
});

// walkSchema in the browser JS engine (isolates schema processing cost)
describe('browser walkSchema', () => {
  for (const { name, schema } of schemas) {
    describe(name, () => {
      bench('no optimization', () => {
        walkSchema(schema as never);
      });

      bench('L1', () => {
        walkSchema(schema as never, { optimization: { level: 1 } });
      });

      bench('L2', () => {
        walkSchema(schema as never, { optimization: { level: 2 } });
      });
    });
  }
});
