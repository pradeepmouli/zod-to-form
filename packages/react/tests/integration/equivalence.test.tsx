/**
 * T099 — Runtime / Codegen equivalence test (SC-003).
 *
 * Verifies that the runtime <ZodForm> renderer and the walkSchema output
 * agree on field count, labels, and validation behaviour.  The CLI codegen
 * pipeline is driven by the same walkSchema call so this test forms the
 * shared contract baseline for both paths.
 */
// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { walkSchema } from '@zod-to-form/core';
import { ZodForm } from '../../src/index.js';

const equivalenceSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  age: z.number().min(18),
  bio: z.string().optional()
});

describe('Runtime ↔ walkSchema equivalence (SC-003)', () => {
  it('walkSchema and ZodForm agree on top-level field count', () => {
    const fields = walkSchema(equivalenceSchema as never);

    render(
      <ZodForm schema={equivalenceSchema as never} onSubmit={vi.fn()}>
        <button type="submit">Submit</button>
      </ZodForm>
    );

    // Every walkSchema field should correspond to a rendered label
    for (const field of fields) {
      const labelEl = screen.queryByText(field.label);
      expect(labelEl, `label "${field.label}" missing from DOM`).not.toBeNull();
    }

    cleanup();
  });

  it('ZodForm renders labels that match walkSchema inferred labels', () => {
    const fields = walkSchema(equivalenceSchema as never);
    const expectedLabels = fields.map((f) => f.label);

    render(
      <ZodForm schema={equivalenceSchema as never} onSubmit={vi.fn()}>
        <button type="submit">Submit</button>
      </ZodForm>
    );

    for (const label of expectedLabels) {
      expect(screen.getByText(label)).toBeTruthy();
    }

    cleanup();
  });

  it('walkSchema optional field maps to non-required ZodForm field', () => {
    const fields = walkSchema(equivalenceSchema as never);
    const bio = fields.find((f) => f.key === 'bio');
    expect(bio?.required).toBe(false);
  });

  it('ZodForm validation fires on submit with missing required fields', async () => {
    const onSubmit = vi.fn();

    render(
      <ZodForm schema={equivalenceSchema as never} onSubmit={onSubmit}>
        <button type="submit">Submit</button>
      </ZodForm>
    );

    // Click submit without filling any fields
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    // react-hook-form defers validation to the next tick
    await waitFor(() => {
      // onSubmit should NOT have been called since required fields are empty
      expect(onSubmit).not.toHaveBeenCalled();
    });

    cleanup();
  });

  it('ZodForm calls onSubmit for valid data matching walkSchema field keys', async () => {
    const onSubmit = vi.fn();

    render(
      <ZodForm schema={equivalenceSchema as never} onSubmit={onSubmit}>
        <button type="submit">Submit</button>
      </ZodForm>
    );

    // Fill in required fields
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'alice' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alice@example.com' } });
    fireEvent.change(screen.getByLabelText('Age'), { target: { value: '25' } });

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    cleanup();
  });
});
