import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { z } from 'zod';
import { ZodForm } from '../../src/ZodForm.js';

describe('runtime form integration', () => {
  it('renders, validates, and submits full basic schema end-to-end', async () => {
    const schema = z.object({
      fullName: z.string().min(2),
      email: z.string().email(),
      age: z.number().min(18),
      isActive: z.boolean(),
      role: z.enum(['user', 'admin']),
      startDate: z.date(),
      avatar: z.file().optional()
    });

    const onSubmit = vi.fn();

    render(
      <ZodForm schema={schema} onSubmit={onSubmit}>
        <button type='submit'>Create</button>
      </ZodForm>
    );

    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Age')).toBeInTheDocument();
    expect(screen.getByLabelText('Is Active')).toBeInTheDocument();
    expect(screen.getByLabelText('Role')).toBeInTheDocument();
    expect(screen.getByLabelText('Start Date')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'Ada Lovelace' }
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'ada@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Age'), {
      target: { value: '32' }
    });
    fireEvent.click(screen.getByLabelText('Is Active'));
    fireEvent.change(screen.getByLabelText('Role'), {
      target: { value: 'admin' }
    });
    fireEvent.change(screen.getByLabelText('Start Date'), {
      target: { value: '2026-01-01' }
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  });
});