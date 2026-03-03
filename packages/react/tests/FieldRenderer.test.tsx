// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Component, type ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { FieldRenderer } from '../src/FieldRenderer.js';
import { defaultComponentMap } from '../src/components/index.js';
import type { FormField } from '@zod-to-form/core';
import type { RuntimeComponentConfig } from '../src/FieldRenderer.js';

class TestErrorBoundary extends Component<{ children: ReactNode }, { message: string | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { message: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { message: error.message };
  }

  render() {
    if (this.state.message) {
      return <div data-testid="runtime-error">{this.state.message}</div>;
    }

    return this.props.children;
  }
}

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

  it('resolves configured runtime component and caches render resolver across fields', async () => {
    const customInput = (props: Record<string, unknown>) => {
      return <input data-testid="runtime-input" {...props} />;
    };
    const renderResolver = vi.fn(async () => customInput);

    function TestHarness() {
      const form = useForm({ defaultValues: { name: '', alias: '' } });
      const componentConfig: RuntimeComponentConfig = {
        components: '@unused/components',
        fieldTypes: {
          Input: {
            component: 'RuntimeInput',
            render: renderResolver
          }
        }
      };

      return (
        <FormProvider {...form}>
          <FieldRenderer
            field={{
              key: 'name',
              component: 'Input',
              props: { type: 'text' },
              label: 'Name',
              required: true,
              readOnly: false,
              hidden: false,
              constraints: {},
              zodType: 'string'
            }}
            components={defaultComponentMap}
            componentConfig={componentConfig}
          />
          <FieldRenderer
            field={{
              key: 'alias',
              component: 'Input',
              props: { type: 'text' },
              label: 'Alias',
              required: false,
              readOnly: false,
              hidden: false,
              constraints: {},
              zodType: 'string'
            }}
            components={defaultComponentMap}
            componentConfig={componentConfig}
          />
        </FormProvider>
      );
    }

    render(<TestHarness />);

    await waitFor(() => {
      expect(screen.getAllByTestId('runtime-input')).toHaveLength(2);
    });
    expect(renderResolver).toHaveBeenCalledTimes(1);
  });

  it('throws explicit runtime diagnostic for invalid component module resolution', async () => {
    const field: FormField = {
      key: 'kind',
      component: 'Input',
      props: { type: 'text' },
      label: 'Kind',
      required: true,
      readOnly: false,
      hidden: false,
      constraints: {},
      zodType: 'string'
    };

    function InvalidModuleHarness() {
      const form = useForm({ defaultValues: { kind: '' } });
      return (
        <TestErrorBoundary>
          <FormProvider {...form}>
            <FieldRenderer
              field={field}
              components={defaultComponentMap}
              componentConfig={{
                components: './components/index.js',
                fieldTypes: {
                  Input: { component: 'MissingComponent' }
                }
              }}
            />
          </FormProvider>
        </TestErrorBoundary>
      );
    }

    render(<InvalidModuleHarness />);

    await waitFor(() => {
      expect(screen.getByTestId('runtime-error')).toHaveTextContent('INVALID_RUNTIME_COMPONENT');
    });
  });

  it('throws explicit runtime diagnostic for invalid render override result', async () => {
    const field: FormField = {
      key: 'kind',
      component: 'Input',
      props: { type: 'text' },
      label: 'Kind',
      required: true,
      readOnly: false,
      hidden: false,
      constraints: {},
      zodType: 'string'
    };

    function InvalidRenderHarness() {
      const form = useForm({ defaultValues: { kind: '' } });
      return (
        <TestErrorBoundary>
          <FormProvider {...form}>
            <FieldRenderer
              field={field}
              components={defaultComponentMap}
              componentConfig={{
                components: '@unused/components',
                fieldTypes: {
                  Input: {
                    component: 'RuntimeInputInvalid',
                    render: async () => 'not-a-component'
                  }
                }
              }}
            />
          </FormProvider>
        </TestErrorBoundary>
      );
    }

    render(<InvalidRenderHarness />);

    await waitFor(() => {
      expect(screen.getByTestId('runtime-error')).toHaveTextContent('INVALID_COMPONENT_ENTRY');
    });
  });
});
