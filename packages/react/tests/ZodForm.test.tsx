// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { z } from 'zod';
import { ZodForm } from '../src/ZodForm.js';

describe('ZodForm', () => {
  it('renders all fields from schema', () => {
    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      age: z.number().min(18)
    });

    render(
      <ZodForm schema={schema} onSubmit={vi.fn()}>
        <button type="submit">Submit</button>
      </ZodForm>
    );

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Age')).toBeInTheDocument();
  });

  it('shows validation errors on invalid submit', async () => {
    const schema = z.object({
      email: z.string().email()
    });

    render(
      <ZodForm schema={schema} onSubmit={vi.fn()}>
        <button type="submit">Submit</button>
      </ZodForm>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(screen.getByText(/invalid/i)).toBeInTheDocument();
    });
  });

  it('calls onSubmit with typed data for valid submit', async () => {
    const schema = z.object({
      name: z.string().min(1),
      age: z.number().min(18)
    });
    const onSubmit = vi.fn();

    render(
      <ZodForm schema={schema} onSubmit={onSubmit}>
        <button type="submit">Submit</button>
      </ZodForm>
    );

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Ada' }
    });
    fireEvent.change(screen.getByLabelText('Age'), {
      target: { value: '42' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Ada', age: 42 }),
        expect.anything()
      );
    });
  });

  it('applies form metadata overrides in rendering', async () => {
    const formRegistry = z.registry<{
      component?: string;
      order?: number;
      hidden?: boolean;
    }>();
    const onSubmit = vi.fn();

    const bio = z
      .string()
      .meta({ title: 'Biography', examples: ['Write a short bio'] })
      .describe('Shown on your public profile');
    const isActive = z.boolean().meta({ title: 'Active User' });
    const hiddenToken = z.string();

    formRegistry.add(bio, { component: 'Textarea', order: 2 });
    formRegistry.add(isActive, { component: 'Switch', order: 1 });
    formRegistry.add(hiddenToken, { hidden: true });

    const schema = z.object({ bio, isActive, hiddenToken });

    render(
      <ZodForm
        schema={schema}
        formRegistry={formRegistry}
        defaultValues={{ hiddenToken: 'secret-value' }}
        onSubmit={onSubmit}
      >
        <button type="submit">Save</button>
      </ZodForm>
    );

    expect(screen.getByLabelText('Biography').tagName).toBe('TEXTAREA');
    expect(screen.getByLabelText('Active User')).toHaveAttribute('role', 'switch');
    expect(screen.getByLabelText('Biography')).toHaveAttribute('placeholder', 'Write a short bio');
    expect(screen.getByText('Shown on your public profile')).toBeInTheDocument();
    expect(screen.queryByLabelText('Hidden Token')).not.toBeInTheDocument();

    const labels = Array.from(document.querySelectorAll('label')).map((label) =>
      label.textContent?.trim()
    );
    expect(labels[0]).toBe('Active User');

    fireEvent.change(screen.getByLabelText('Biography'), {
      target: { value: 'Hello world' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          bio: 'Hello world',
          isActive: false,
          hiddenToken: 'secret-value'
        }),
        expect.anything()
      );
    });
  });

  it('preserves submit-only behavior when onValueChange is not provided', async () => {
    const schema = z.object({
      name: z.string().min(1)
    });
    const onSubmit = vi.fn();

    render(
      <ZodForm schema={schema} onSubmit={onSubmit}>
        <button type="submit">Save</button>
      </ZodForm>
    );

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Alice' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Alice' }),
        expect.anything()
      );
    });
  });

  it('calls onInvalid callback when validation fails', async () => {
    const schema = z.object({
      email: z.string().email()
    });

    const onSubmit = vi.fn();
    const onInvalid = vi.fn();

    render(
      <ZodForm schema={schema} onSubmit={onSubmit} onInvalid={onInvalid}>
        <button type="submit">Submit</button>
      </ZodForm>
    );

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'not-an-email' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(onInvalid).toHaveBeenCalled();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('renders array fields with add/remove controls', async () => {
    const schema = z.object({
      tags: z.array(z.string()).min(1)
    });

    render(
      <ZodForm schema={schema} onSubmit={vi.fn()}>
        <button type="submit">Submit</button>
      </ZodForm>
    );

    // Should have an Add button for the array field
    const addButton = screen.getByRole('button', { name: /add/i });
    expect(addButton).toBeInTheDocument();

    // Click add to create an entry
    fireEvent.click(addButton);

    await waitFor(() => {
      const inputs = document.querySelectorAll('input[name^="tags"]');
      expect(inputs.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders readonly fields with readOnly attribute', () => {
    const schema = z.object({
      token: z.string().readonly()
    });

    render(
      <ZodForm schema={schema} defaultValues={{ token: 'abc123' }} onSubmit={vi.fn()}>
        <button type="submit">Submit</button>
      </ZodForm>
    );

    const input = screen.getByLabelText('Token');
    expect(input).toHaveAttribute('readonly');
  });

  it('supports onSubmit and onValueChange with separate triggers', async () => {
    const schema = z.object({
      name: z.string().min(2)
    });

    const onSubmit = vi.fn();
    const onValueChange = vi.fn();

    render(
      <ZodForm schema={schema} mode="onChange" onSubmit={onSubmit} onValueChange={onValueChange}>
        <button type="submit">Save</button>
      </ZodForm>
    );

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Al' }
    });

    await waitFor(() => {
      expect(onValueChange).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Al' }),
        expect.objectContaining({ isValid: expect.any(Boolean) })
      );
    });

    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Al' }),
        expect.anything()
      );
    });
  });
});

// ─── setValueAs coercion behaviour (P1 regression guard) ─────────────────────

describe('ZodForm — number/date setValueAs coercion', () => {
  /**
   * P1 regression guard: empty optional number input must submit as `undefined`,
   * not NaN. This failed with `valueAsNumber: true` because an empty
   * `<input type="number">` gives valueAsNumber = NaN, which is not `undefined`
   * and therefore fails `z.number().optional()`.
   */
  it('submits empty optional number field as undefined (not NaN) — P1 guard', async () => {
    const schema = z.object({
      label: z.string(),
      score: z.number().optional()
    });
    const onSubmit = vi.fn();

    render(
      <ZodForm schema={schema} onSubmit={onSubmit}>
        <button type="submit">Submit</button>
      </ZodForm>
    );

    // Fill only the required string field; leave score empty
    fireEvent.change(screen.getByLabelText('Label'), { target: { value: 'test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    // score must be undefined (empty → undefined), never NaN
    const submitted = onSubmit.mock.calls[0]![0] as Record<string, unknown>;
    expect(submitted['score']).toBeUndefined();

    // Extra: confirm z.number().optional().safeParse(undefined) passes
    expect(z.number().optional().safeParse(submitted['score']).success).toBe(true);
  });

  /**
   * Verify that filling a number field with a valid value submits it as a JS number.
   */
  it('submits filled optional number field as a number (not a string)', async () => {
    const schema = z.object({
      score: z.number().optional()
    });
    const onSubmit = vi.fn();

    render(
      <ZodForm schema={schema} onSubmit={onSubmit}>
        <button type="submit">Submit</button>
      </ZodForm>
    );

    fireEvent.change(screen.getByLabelText('Score'), { target: { value: '99' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const submitted = onSubmit.mock.calls[0]![0] as Record<string, unknown>;
    expect(submitted['score']).toBe(99);
    expect(typeof submitted['score']).toBe('number');
  });
});
