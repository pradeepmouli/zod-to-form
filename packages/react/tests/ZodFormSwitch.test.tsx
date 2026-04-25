// @vitest-environment jsdom
// SPDX-License-Identifier: MIT
// Tests for US3 — ZodFormSwitch (010-editor-primitives).

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { z } from 'zod';
import { ZodFormSwitch } from '../src/ZodFormSwitch.js';

const schemaA = z.object({ kind: z.literal('A'), aField: z.string() });
const schemaB = z.object({ kind: z.literal('B'), bField: z.string() });

const SCHEMAS = { A: schemaA, B: schemaB } as const;

describe('ZodFormSwitch', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  // T024
  it('renders the schema matching the discriminator value', () => {
    const { container } = render(
      <ZodFormSwitch source={{ kind: 'A', aField: 'hi' }} discriminator="kind" schemas={SCHEMAS} />
    );
    expect(container.querySelector('input[name="aField"]')).not.toBeNull();
    expect(container.querySelector('input[name="bField"]')).toBeNull();
  });

  // T025
  it('unmounts the previous form when the discriminator changes', () => {
    const { container, rerender } = render(
      <ZodFormSwitch source={{ kind: 'A', aField: 'hi' }} discriminator="kind" schemas={SCHEMAS} />
    );
    expect(container.querySelector('input[name="aField"]')).not.toBeNull();
    rerender(
      <ZodFormSwitch source={{ kind: 'B', bField: 'bye' }} discriminator="kind" schemas={SCHEMAS} />
    );
    expect(container.querySelector('input[name="aField"]')).toBeNull();
    expect(container.querySelector('input[name="bField"]')).not.toBeNull();
  });

  // T026
  it('renders fallback ReactNode when discriminator is unmapped', () => {
    render(
      <ZodFormSwitch
        source={{ kind: 'C' as 'A' }}
        discriminator="kind"
        schemas={SCHEMAS}
        fallback={<span data-testid="fallback">no match</span>}
      />
    );
    expect(screen.getByTestId('fallback')).toBeDefined();
  });

  // T027
  it('calls fallback function with source when provided as function', () => {
    const fallback = vi.fn((s: { kind: string }) => <span>FN:{s.kind}</span>);
    render(
      <ZodFormSwitch
        source={{ kind: 'C' as 'A' }}
        discriminator="kind"
        schemas={SCHEMAS}
        fallback={fallback}
      />
    );
    expect(fallback).toHaveBeenCalled();
    expect(screen.getByText('FN:C')).toBeDefined();
  });

  // T028
  it('renders null and warns once when no fallback and unmapped', () => {
    const warn = vi.mocked(console.warn);
    const { container, rerender } = render(
      <ZodFormSwitch source={{ kind: 'C' as 'A' }} discriminator="kind" schemas={SCHEMAS} />
    );
    expect(container.firstChild).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    // Re-render with same unmapped value: no second warn
    rerender(
      <ZodFormSwitch source={{ kind: 'C' as 'A' }} discriminator="kind" schemas={SCHEMAS} />
    );
    expect(warn).toHaveBeenCalledTimes(1);
  });

  // T029
  it('forwards onValueChange to the inner ZodForm', () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <ZodFormSwitch
        source={{ kind: 'A', aField: 'hi' }}
        discriminator="kind"
        schemas={SCHEMAS}
        onValueChange={onValueChange}
      />
    );
    const input = container.querySelector('input[name="aField"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    fireEvent.change(input, { target: { value: 'updated' } });
    expect(onValueChange).toHaveBeenCalled();
  });
});
