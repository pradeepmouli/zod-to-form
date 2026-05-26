// @vitest-environment jsdom
// Tests for runtime resolution of '!!field.value' coercion expression.
// Covers the Base UI Checkbox/Switch pattern: checked: '!!field.value'.

import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { FieldRenderer } from '../src/FieldRenderer.js';
import type { FormField } from '@zod-to-form/core';
import type { RuntimeComponentConfig } from '../src/FieldRenderer.js';

// A minimal controlled component that captures the props it receives.
let capturedProps: Record<string, unknown> = {};
function SpyCheckbox(props: Record<string, unknown>) {
  capturedProps = props;
  return null;
}

const componentMap = {
  Checkbox: SpyCheckbox as unknown as React.ComponentType<Record<string, unknown>>,
  // Required by defaultComponentMap shape — FieldRenderer looks these up
  Field: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  FieldLabel: ({ children }: { children?: React.ReactNode }) => <label>{children}</label>,
  FieldDescription: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  FieldMessage: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  Input: () => null,
  Textarea: () => null,
  Switch: () => null,
  Select: () => null,
  RadioGroup: () => null,
  DatePicker: () => null
} as unknown as typeof import('../src/components/index.js').defaultComponentMap;

const booleanField: FormField = {
  key: 'subscribe',
  component: 'Checkbox',
  label: 'Subscribe',
  required: false,
  readOnly: false,
  hidden: false,
  disabled: false,
  deprecated: false,
  constraints: {},
  zodType: 'boolean'
};

const controlledConfig: RuntimeComponentConfig = {
  components: {
    source: '@/components/z2f',
    overrides: {
      Checkbox: {
        controlled: true,
        props: { checked: '!!field.value', onCheckedChange: 'field.onChange' }
      }
    }
  }
};

function renderControlledCheckbox(defaultValue: unknown) {
  capturedProps = {};
  function TestHarness() {
    const form = useForm({ defaultValues: { subscribe: defaultValue } });
    return (
      <FormProvider {...form}>
        <FieldRenderer
          field={booleanField}
          components={componentMap}
          componentConfig={controlledConfig}
        />
      </FormProvider>
    );
  }
  render(<TestHarness />);
}

import React from 'react';

describe('runtime resolveProps — !!field.value coercion', () => {
  it('passes checked=false when field.value is undefined (!!undefined === false)', () => {
    renderControlledCheckbox(undefined);
    expect(capturedProps['checked']).toBe(false);
  });

  it('passes checked=false when field.value is null (!!null === false)', () => {
    renderControlledCheckbox(null);
    expect(capturedProps['checked']).toBe(false);
  });

  it('passes checked=false when field.value is false', () => {
    renderControlledCheckbox(false);
    expect(capturedProps['checked']).toBe(false);
  });

  it('passes checked=true when field.value is true', () => {
    renderControlledCheckbox(true);
    expect(capturedProps['checked']).toBe(true);
  });

  it('wires onCheckedChange to the RHF field.onChange function', () => {
    renderControlledCheckbox(undefined);
    expect(typeof capturedProps['onCheckedChange']).toBe('function');
    // The remapped prop replaces the default 'onChange' on the component
    expect(capturedProps).not.toHaveProperty('onChange');
  });

  it('does NOT expose a raw field.value prop (checked replaces value)', () => {
    renderControlledCheckbox(undefined);
    // checked is the remapped name; 'value' should be absent because
    // '!!field.value' remaps the 'value' controller property
    expect(capturedProps).not.toHaveProperty('value');
  });
});
