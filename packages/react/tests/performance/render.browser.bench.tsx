import { bench, describe } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { walkSchema } from '@zod-to-form/core';
import { ZodForm, defaultComponentMap } from '../../src/index.js';
import { smallSchema, mediumSchema, largeSchema } from './schemas.js';

const noop = () => {};

/**
 * Render a ZodForm synchronously and unmount.
 * Uses flushSync to ensure React commits before we return.
 */
function renderAndUnmount(schema: unknown): void {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  flushSync(() => {
    root.render(
      React.createElement(ZodForm, {
        schema: schema as any,
        onSubmit: noop,
        components: defaultComponentMap
      })
    );
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

// Full form render: walkSchema + React mount + unmount (browser only)
describe('browser render (walk + React mount)', () => {
  for (const { name, schema } of schemas) {
    describe(name, () => {
      bench('no optimization', () => {
        renderAndUnmount(schema);
      });

      bench('L1', () => {
        renderAndUnmount(schema);
      });

      bench('L2', () => {
        renderAndUnmount(schema);
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
