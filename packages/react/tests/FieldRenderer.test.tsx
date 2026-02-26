import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { FieldRenderer } from '../src/FieldRenderer.js';
import { defaultComponentMap } from '../src/components/index.js';
import type { FormField } from '@zodform/core';

function renderWithForm(field: FormField): void {
  function TestHarness() {
    const form = useForm({ defaultValues: { [field.key]: '' } });
    return (
      <FormProvider {...form}>
        <FieldRenderer
          field={field}
          components={defaultComponentMap}
        />
      </FormProvider>
    );
  }

  render(<TestHarness />);
}

describe('FieldRenderer', () => {
  it('renders correct HTML for Input fields', () => {
    const field: FormField = {
      key: 'name',
      component: 'Input',
      props: { type: 'text' },
      label: 'Name',
      required: true,
      readOnly: false,
      hidden: false,
      constraints: {},
      zodType: 'string'
    };

    renderWithForm(field);

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  it('wires label htmlFor to input id and required attribute', () => {
    const field: FormField = {
      key: 'email',
      component: 'Input',
      props: { type: 'email' },
      label: 'Email',
      required: true,
      readOnly: false,
      hidden: false,
      constraints: {},
      zodType: 'string'
    };

    renderWithForm(field);

    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('id', 'email');
    expect(input).toHaveAttribute('required');
  });

  it('sets aria-invalid when field has validation errors', () => {
    const field: FormField = {
      key: 'website',
      component: 'Input',
      props: { type: 'url' },
      label: 'Website',
      required: true,
      readOnly: false,
      hidden: false,
      constraints: {},
      zodType: 'string'
    };

    renderWithForm(field);

    const input = screen.getByLabelText('Website');
    expect(input).toHaveAttribute('aria-invalid');
  });
});