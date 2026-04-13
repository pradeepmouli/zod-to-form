import { bench, describe } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { FormProvider } from 'react-hook-form';
import type { ZodObject } from 'zod';
import { FieldRenderer } from '../../src/FieldRenderer.js';
import { defaultComponentMap } from '../../src/index.js';
import { useZodForm } from '../../src/useZodForm.js';
import {
  smallSafeSchema as smallSchema,
  mediumSafeSchema as mediumSchema,
  largeSafeSchema as largeSchema
} from './codegen-safe-schemas.js';

// ─── Real generated components (from gen-fixtures.ts) ───────────────
//
// These are actual outputs of generateFormComponent — fully self-contained
// React forms. At mount time they do NOT call walkSchema or run the optimizer
// chain. The walk happened at build time (i.e. when gen-fixtures.ts ran).
import { SmallNoneForm } from './generated/SmallNoneForm.js';
import { SmallL1Form } from './generated/SmallL1Form.js';
import { SmallL2Form } from './generated/SmallL2Form.js';
import { MediumNoneForm } from './generated/MediumNoneForm.js';
import { MediumL1Form } from './generated/MediumL1Form.js';
import { MediumL2Form } from './generated/MediumL2Form.js';
import { LargeNoneForm } from './generated/LargeNoneForm.js';
import { LargeL1Form } from './generated/LargeL1Form.js';
import { LargeL2Form } from './generated/LargeL2Form.js';

/**
 * Codegen vs runtime comparison.
 *
 * Runtime path: every mount walks the schema + runs optimizers + renders
 * via useZodForm → FieldRenderer.
 *
 * Codegen path: walkSchema + optimizer chain ran at BUILD time (gen-fixtures.ts).
 * At mount, the generated component imports pre-walked fields inline in the
 * JSX and renders directly with useForm. No walk, no FieldRenderer loop.
 */

const noop = () => {};

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

// ─── Runtime path: useZodForm walks on every mount ──────────────────
function RuntimeForm({
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

// ─── Codegen path: render real generated components ────────────────

const codegenSizes = [
  {
    name: 'small (5 fields)',
    none: SmallNoneForm,
    l1: SmallL1Form,
    l2: SmallL2Form
  },
  {
    name: 'medium (18 fields)',
    none: MediumNoneForm,
    l1: MediumL1Form,
    l2: MediumL2Form
  },
  {
    name: 'large (50 fields)',
    none: LargeNoneForm,
    l1: LargeL1Form,
    l2: LargeL2Form
  }
] as const;

const runtimeSizes = [
  { name: 'small (5 fields)', schema: smallSchema },
  { name: 'medium (18 fields)', schema: mediumSchema },
  { name: 'large (50 fields)', schema: largeSchema }
] as const;

describe('codegen mount (real generated components)', () => {
  for (const { name, none: None, l1: L1, l2: L2 } of codegenSizes) {
    describe(name, () => {
      bench('no optimization (codegen)', () => {
        renderAndUnmount(<None onSubmit={noop} />);
      });

      bench('L1 (codegen)', () => {
        renderAndUnmount(<L1 onSubmit={noop} />);
      });

      bench('L2 (codegen)', () => {
        renderAndUnmount(<L2 onSubmit={noop} />);
      });
    });
  }
});

describe('runtime mount (walk every time)', () => {
  for (const { name, schema } of runtimeSizes) {
    describe(name, () => {
      bench('no optimization (runtime)', () => {
        renderAndUnmount(<RuntimeForm schema={schema as ZodObject} level={undefined} />);
      });

      bench('L1 (runtime)', () => {
        renderAndUnmount(<RuntimeForm schema={schema as ZodObject} level={1} />);
      });

      bench('L2 (runtime)', () => {
        renderAndUnmount(<RuntimeForm schema={schema as ZodObject} level={2} />);
      });
    });
  }
});
