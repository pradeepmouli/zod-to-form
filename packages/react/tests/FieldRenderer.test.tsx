import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { FieldRenderer } from '../src/FieldRenderer.js';
import { defaultComponentMap } from '../src/components/index.js';
import type { FormField } from '@zod-to-form/core';

function renderWithForm(field: FormField): void {
  function TestHarness() {
    const form = useForm({ defaultValues: { [field.key]: '' } });
    return (
      <FormProvider {...form}>
        <FieldRenderer field={field} components={defaultComponentMap} />
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

  it('calls custom render function when field.render is set', () => {
    const renderFn = vi.fn((_field: FormField, _props: Record<string, unknown>) => (
      <textarea data-testid="custom-field" />
    ));

    const field: FormField = {
      key: 'bio',
      component: 'Input',
      props: { type: 'text' },
      label: 'Bio',
      required: false,
      readOnly: false,
      hidden: false,
      constraints: {},
      zodType: 'string',
      render: renderFn
    };

    renderWithForm(field);

    expect(renderFn).toHaveBeenCalled();
    const firstCall = renderFn.mock.calls[0];
    expect(firstCall).toBeDefined();
    expect(firstCall![0]).toMatchObject({ key: 'bio', label: 'Bio' });
    expect(firstCall![1]).toMatchObject({ id: 'bio' });
    expect(screen.getByTestId('custom-field')).toBeInTheDocument();
  });

  it('renders Combobox with datalist when component is Combobox', () => {
    const field: FormField = {
      key: 'country',
      component: 'Combobox',
      props: {},
      label: 'Country',
      required: true,
      readOnly: false,
      hidden: false,
      options: [
        { value: 'us', label: 'United States' },
        { value: 'uk', label: 'United Kingdom' }
      ],
      constraints: {},
      zodType: 'string'
    };

    renderWithForm(field);

    expect(screen.getByLabelText('Country')).toBeInTheDocument();
    expect(document.querySelector('datalist')).toBeInTheDocument();
  });
});
