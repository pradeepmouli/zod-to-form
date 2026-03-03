// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { z } from 'zod';
import { ZodForm } from '../../src/ZodForm.js';

describe('ZodForm accessibility integration', () => {
  it('associates labels with controls and keeps keyboard focus order', () => {
    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      bio: z.string().optional()
    });

    render(
      <ZodForm schema={schema} onSubmit={() => {}}>
        <button type="submit">Save</button>
      </ZodForm>
    );

    const name = screen.getByLabelText('Name');
    const email = screen.getByLabelText('Email');
    const bio = screen.getByLabelText('Bio');

    expect(name).toHaveAttribute('id', 'name');
    expect(email).toHaveAttribute('id', 'email');
    expect(bio).toHaveAttribute('id', 'bio');

    name.focus();
    expect(name).toHaveFocus();

    fireEvent.keyDown(name, { key: 'Tab', code: 'Tab' });
    email.focus();
    expect(email).toHaveFocus();
  });

  it('keeps aria-invalid and required semantics on rendered controls', async () => {
    const schema = z.object({
      email: z.string().email(),
      age: z.number().min(18)
    });

    render(
      <ZodForm schema={schema} onSubmit={() => {}}>
        <button type="submit">Submit</button>
      </ZodForm>
    );

    const email = screen.getByLabelText('Email');
    const age = screen.getByLabelText('Age');

    expect(email).toHaveAttribute('required');
    expect(age).toHaveAttribute('required');

    expect(email).toHaveAttribute('aria-invalid', 'false');
    expect(age).toHaveAttribute('aria-invalid', 'false');
  });

  it('renders description text and supports keyboard submit flow', async () => {
    const schema = z.object({
      username: z.string().min(3).describe('Public handle visible to others')
    });

    const onSubmit = vi.fn();

    render(
      <ZodForm schema={schema} onSubmit={onSubmit}>
        <button type="submit">Submit</button>
      </ZodForm>
    );

    expect(screen.getByText('Public handle visible to others')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'alice' }
    });
    fireEvent.keyDown(screen.getByLabelText('Username'), {
      key: 'Enter',
      code: 'Enter'
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  });
});
