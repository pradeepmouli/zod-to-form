// @vitest-environment jsdom
// SPDX-License-Identifier: MIT
// Tests for US1 — array reorder primitive (010-editor-primitives).

import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { FieldRenderer } from '../src/FieldRenderer.js';
import { defaultComponentMap } from '../src/components/index.js';
import type { FormField, ArrayConfig } from '@zod-to-form/core';

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

function renderWithItems(arrayConfig: ArrayConfig | undefined, items: string[]) {
  function Harness() {
    const form = useForm({ defaultValues: { items } });
    return (
      <FormProvider {...form}>
        <FieldRenderer field={makeArrayField(arrayConfig)} components={defaultComponentMap} />
        <ValueProbe name="items" />
      </FormProvider>
    );
  }
  return render(<Harness />);
}

describe('ArrayReorder', () => {
  // T006
  it('renders ArrayReorderHandle for each row when reorder enabled', () => {
    renderWithItems({ reorder: true }, ['a', 'b', 'c']);
    const upButtons = screen.getAllByRole('button', { name: /move row \d up/i });
    const downButtons = screen.getAllByRole('button', { name: /move row \d down/i });
    expect(upButtons).toHaveLength(3);
    expect(downButtons).toHaveLength(3);
  });

  // T007
  it('calls move() and updates form state on ↑/↓ click', () => {
    renderWithItems({ reorder: true }, ['a', 'b', 'c']);
    // Click ↑ on row 3 (index 2): moves c above b → [a, c, b]
    const upButtonRow3 = screen.getByRole('button', { name: /move row 3 up/i });
    fireEvent.click(upButtonRow3);
    expect(screen.getByTestId('probe').textContent).toBe('["a","c","b"]');
  });

  // T008
  it('fires onReorder callback exactly once with post-reorder indices', () => {
    const onReorder = vi.fn();
    renderWithItems({ reorder: true, onReorder }, ['a', 'b', 'c']);
    const upButtonRow3 = screen.getByRole('button', { name: /move row 3 up/i });
    fireEvent.click(upButtonRow3);
    expect(onReorder).toHaveBeenCalledTimes(1);
    expect(onReorder).toHaveBeenCalledWith(2, 1);
  });

  // T009
  it('renders no handles when reorder disabled or arrayConfig omitted', () => {
    const { rerender } = renderWithItems({ reorder: false }, ['a', 'b', 'c']);
    expect(screen.queryAllByRole('button', { name: /move row/i })).toHaveLength(0);

    rerender(<RenderHarness arrayConfig={undefined} items={['a', 'b', 'c']} />);
    expect(screen.queryAllByRole('button', { name: /move row/i })).toHaveLength(0);
  });

  // T010
  it('disables ↑ on first row and ↓ on last row', () => {
    renderWithItems({ reorder: true }, ['a', 'b', 'c']);
    const upRow1 = screen.getByRole('button', { name: /move row 1 up/i });
    const downRow3 = screen.getByRole('button', { name: /move row 3 down/i });
    const upRow2 = screen.getByRole('button', { name: /move row 2 up/i });
    const downRow1 = screen.getByRole('button', { name: /move row 1 down/i });
    expect(upRow1).toBeDisabled();
    expect(downRow3).toBeDisabled();
    expect(upRow2).not.toBeDisabled();
    expect(downRow1).not.toBeDisabled();
  });

  // PR #104 follow-up: disabled / readOnly field disables every handle button
  it('disables every handle button when the field itself is disabled', () => {
    function Harness() {
      const form = useForm({ defaultValues: { items: ['a', 'b', 'c'] } });
      const disabledField: FormField = { ...makeArrayField({ reorder: true }), disabled: true };
      return (
        <FormProvider {...form}>
          <FieldRenderer field={disabledField} components={defaultComponentMap} />
        </FormProvider>
      );
    }
    render(<Harness />);
    const allButtons = screen.getAllByRole('button', { name: /move row/i });
    expect(allButtons).toHaveLength(6);
    for (const btn of allButtons) expect(btn).toBeDisabled();
  });
});

function RenderHarness({
  arrayConfig,
  items
}: {
  arrayConfig: ArrayConfig | undefined;
  items: string[];
}) {
  function Harness() {
    const form = useForm({ defaultValues: { items } });
    return (
      <FormProvider {...form}>
        <FieldRenderer field={makeArrayField(arrayConfig)} components={defaultComponentMap} />
        <ValueProbe name="items" />
      </FormProvider>
    );
  }
  return <Harness />;
}
