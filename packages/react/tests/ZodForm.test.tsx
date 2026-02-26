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
        <button type='submit'>Submit</button>
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
        <button type='submit'>Submit</button>
      </ZodForm>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
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
        <button type='submit'>Submit</button>
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
});