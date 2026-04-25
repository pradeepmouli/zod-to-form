// @vitest-environment jsdom
// SPDX-License-Identifier: MIT
// Tests for US4 — ghost rows (010-editor-primitives).

import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { FieldRenderer } from '../src/FieldRenderer.js';
import { defaultComponentMap } from '../src/components/index.js';
import type { FormField, ArrayConfig, GhostRow } from '@zod-to-form/core';

function makeArrayField(arrayConfig?: ArrayConfig): FormField {
  return {
    key: 'items',
    component: 'ArrayField',
    props: arrayConfig ? { _arrayConfig: arrayConfig } : {},
    label: 'Items',
    required: false,
    readOnly: false,
    hidden: false,
    disabled: false,
    deprecated: false,
    constraints: {},
    zodType: 'array',
    arrayItem: {
      key: 'items.0',
      component: 'Input',
      props: { type: 'text' },
      label: 'Item',
      required: false,
      readOnly: false,
      hidden: false,
      disabled: false,
      deprecated: false,
      constraints: {},
      zodType: 'string'
    }
  };
}

function ValueProbe({ name }: { name: string }) {
  const value = useWatch({ name });
  return <pre data-testid="probe">{JSON.stringify(value)}</pre>;
}

function Harness({
  arrayConfig,
  items,
  onSubmit
}: {
  arrayConfig: ArrayConfig | undefined;
  items: string[];
  onSubmit?: (data: { items: string[] }) => void;
}) {
  const form = useForm({ defaultValues: { items } });
  return (
    <FormProvider {...form}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit((d) => onSubmit?.(d as { items: string[] }))();
        }}
      >
        <FieldRenderer field={makeArrayField(arrayConfig)} components={defaultComponentMap} />
        <button type="submit" data-testid="submit">
          submit
        </button>
        <ValueProbe name="items" />
      </form>
    </FormProvider>
  );
}

describe('GhostRows', () => {
  // T033
  it('renders before-ghost rows above form-driven rows', () => {
    const before: GhostRow[] = [
      { id: 'g1', render: () => <div data-testid="ghost" data-id="g1" /> },
      { id: 'g2', render: () => <div data-testid="ghost" data-id="g2" /> }
    ];
    const { container } = render(<Harness arrayConfig={{ before }} items={['a', 'b']} />);
    const rows = container.querySelectorAll('[data-testid="ghost"], input');
    // Order: g1, g2, input[a], input[b]
    expect(rows[0]?.getAttribute('data-id')).toBe('g1');
    expect(rows[1]?.getAttribute('data-id')).toBe('g2');
    expect((rows[2] as HTMLInputElement)?.value).toBe('a');
    expect((rows[3] as HTMLInputElement)?.value).toBe('b');
  });

  // T034
  it('renders after-ghost rows below form-driven rows', () => {
    const after: GhostRow[] = [
      { id: 'g1', render: () => <div data-testid="ghost" data-id="g1" /> }
    ];
    const { container } = render(<Harness arrayConfig={{ after }} items={['a', 'b']} />);
    const rows = container.querySelectorAll('[data-testid="ghost"], input');
    // Order: input[a], input[b], g1
    expect((rows[0] as HTMLInputElement)?.value).toBe('a');
    expect((rows[1] as HTMLInputElement)?.value).toBe('b');
    expect(rows[2]?.getAttribute('data-id')).toBe('g1');
  });

  // T035
  it('ghost rows do not appear in submitted form value', async () => {
    const onSubmit = vi.fn();
    const before: GhostRow[] = [{ id: 'g1', render: () => <div data-testid="ghost" /> }];
    render(<Harness arrayConfig={{ before }} items={['a', 'b', 'c']} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByTestId('submit'));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ items: ['a', 'b', 'c'] });
    });
  });

  // T036
  it('renders isFirst/isLast flags correctly', () => {
    const before: GhostRow[] = [
      {
        id: 'g1',
        render: (ctx) => (
          <div data-testid="ghost" data-id="g1" data-first={ctx.isFirst} data-last={ctx.isLast} />
        )
      },
      {
        id: 'g2',
        render: (ctx) => (
          <div data-testid="ghost" data-id="g2" data-first={ctx.isFirst} data-last={ctx.isLast} />
        )
      },
      {
        id: 'g3',
        render: (ctx) => (
          <div data-testid="ghost" data-id="g3" data-first={ctx.isFirst} data-last={ctx.isLast} />
        )
      }
    ];
    const { container } = render(<Harness arrayConfig={{ before }} items={[]} />);
    expect(container.querySelector('[data-id="g1"]')?.getAttribute('data-first')).toBe('true');
    expect(container.querySelector('[data-id="g1"]')?.getAttribute('data-last')).toBe('false');
    expect(container.querySelector('[data-id="g2"]')?.getAttribute('data-first')).toBe('false');
    expect(container.querySelector('[data-id="g2"]')?.getAttribute('data-last')).toBe('false');
    expect(container.querySelector('[data-id="g3"]')?.getAttribute('data-first')).toBe('false');
    expect(container.querySelector('[data-id="g3"]')?.getAttribute('data-last')).toBe('true');
  });

  // T037
  it('reordering form rows does not move ghost rows', () => {
    const before: GhostRow[] = [
      { id: 'g1', render: () => <div data-testid="ghost" data-id="g1" /> },
      { id: 'g2', render: () => <div data-testid="ghost" data-id="g2" /> }
    ];
    const { container } = render(
      <Harness arrayConfig={{ before, reorder: true }} items={['a', 'b', 'c']} />
    );
    // Click ↑ on row 3 (last form row): should reorder to [a, c, b]
    fireEvent.click(screen.getByRole('button', { name: /move row 3 up/i }));
    expect(screen.getByTestId('probe').textContent).toBe('["a","c","b"]');

    // Ghost rows still in positions 0 and 1
    const rows = container.querySelectorAll('[data-testid="ghost"], input');
    expect(rows[0]?.getAttribute('data-id')).toBe('g1');
    expect(rows[1]?.getAttribute('data-id')).toBe('g2');
  });
});
