// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { FieldRenderer, safeSerializeForDedup } from '../src/FieldRenderer.js';
import { defaultComponentMap } from '../src/components/index.js';
import type { FormField } from '@zod-to-form/core';

function renderArrayField(field: FormField, defaultValues?: Record<string, unknown>) {
  function TestHarness() {
    const form = useForm({ defaultValues: defaultValues ?? { [field.key]: [] } });
    return (
      <FormProvider {...form}>
        <FieldRenderer field={field} components={defaultComponentMap} />
      </FormProvider>
    );
  }

  return render(<TestHarness />);
}

function makeArrayField(overrides?: Partial<FormField>): FormField {
  return {
    key: 'items',
    component: 'ArrayField',
    props: {},
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
    },
    ...overrides
  };
}

describe('ArrayBlock', () => {
  it('renders Add button that is enabled by default', () => {
    renderArrayField(makeArrayField());

    const addBtn = screen.getByRole('button', { name: /add/i });
    expect(addBtn).toBeInTheDocument();
    expect(addBtn).not.toBeDisabled();
  });

  it('renders Remove button for each item', () => {
    renderArrayField(makeArrayField(), { items: ['a', 'b'] });

    const removeBtns = screen.getAllByRole('button', { name: /remove/i });
    expect(removeBtns).toHaveLength(2);
  });

  it('disables Add button when items.length >= maxLength', () => {
    const field = makeArrayField({ constraints: { maxLength: 2 } });
    renderArrayField(field, { items: ['a', 'b'] });

    const addBtn = screen.getByRole('button', { name: /add/i });
    expect(addBtn).toBeDisabled();
  });

  it('enables Add button when items.length < maxLength', () => {
    const field = makeArrayField({ constraints: { maxLength: 3 } });
    renderArrayField(field, { items: ['a', 'b'] });

    const addBtn = screen.getByRole('button', { name: /add/i });
    expect(addBtn).not.toBeDisabled();
  });

  it('disables Remove button when items.length <= minLength', () => {
    const field = makeArrayField({ constraints: { minLength: 2 } });
    renderArrayField(field, { items: ['a', 'b'] });

    const removeBtns = screen.getAllByRole('button', { name: /remove/i });
    for (const btn of removeBtns) {
      expect(btn).toBeDisabled();
    }
  });

  it('enables Remove button when items.length > minLength', () => {
    const field = makeArrayField({ constraints: { minLength: 1 } });
    renderArrayField(field, { items: ['a', 'b'] });

    const removeBtns = screen.getAllByRole('button', { name: /remove/i });
    for (const btn of removeBtns) {
      expect(btn).not.toBeDisabled();
    }
  });

  it('uses custom addLabel from arrayConfig', () => {
    const field = makeArrayField({
      props: { _arrayConfig: { addLabel: 'Add Item' } }
    });
    renderArrayField(field);

    expect(screen.getByRole('button', { name: 'Add Item' })).toBeInTheDocument();
  });

  it('uses custom removeLabel from arrayConfig', () => {
    const field = makeArrayField({
      props: { _arrayConfig: { removeLabel: 'Delete' } }
    });
    renderArrayField(field, { items: ['a'] });

    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('adds an item when Add button is clicked', () => {
    renderArrayField(makeArrayField());

    const addBtn = screen.getByRole('button', { name: /add/i });
    fireEvent.click(addBtn);

    // After adding, there should be one item with a Remove button
    expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
  });

  it('removes an item when Remove button is clicked', () => {
    renderArrayField(makeArrayField(), { items: ['a', 'b'] });

    const removeBtns = screen.getAllByRole('button', { name: /remove/i });
    expect(removeBtns).toHaveLength(2);

    fireEvent.click(removeBtns[0]!);

    // After removing, should have 1 remove button
    expect(screen.getAllByRole('button', { name: /remove/i })).toHaveLength(1);
  });
});

describe('safeSerializeForDedup', () => {
  it('returns null for empty/nullish values', () => {
    expect(safeSerializeForDedup(null)).toBeNull();
    expect(safeSerializeForDedup(undefined)).toBeNull();
    expect(safeSerializeForDedup('')).toBeNull();
  });

  it('produces stable keys for primitives', () => {
    expect(safeSerializeForDedup('hello')).toBe(safeSerializeForDedup('hello'));
    expect(safeSerializeForDedup(42)).toBe(safeSerializeForDedup(42));
    expect(safeSerializeForDedup(true)).toBe(safeSerializeForDedup(true));
  });

  it('handles BigInt values without throwing', () => {
    expect(() => safeSerializeForDedup(BigInt(1))).not.toThrow();
    expect(safeSerializeForDedup(BigInt(1))).toBe(safeSerializeForDedup(BigInt(1)));
    expect(safeSerializeForDedup(BigInt(1))).not.toBe(safeSerializeForDedup(BigInt(2)));
  });

  it('distinguishes different types with the same string representation', () => {
    // "1" string vs 1 number should NOT collide
    expect(safeSerializeForDedup('1')).not.toBe(safeSerializeForDedup(1));
  });

  it('handles objects with BigInt properties without throwing', () => {
    expect(() => safeSerializeForDedup({ id: BigInt(1), name: 'test' })).not.toThrow();
  });

  it('returns unique key for circular objects (no false match)', () => {
    const a: Record<string, unknown> = {};
    a['self'] = a;
    const b: Record<string, unknown> = {};
    b['self'] = b;
    // Both are circular — safe serializer returns unique keys so they don't falsely match
    expect(safeSerializeForDedup(a)).not.toBe(safeSerializeForDedup(b));
  });
});
