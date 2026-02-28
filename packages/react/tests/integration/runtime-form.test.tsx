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
        <button type="submit">Create</button>
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

  it('renders nested object fields inside a fieldset element', async () => {
    const schema = z.object({
      address: z.object({
        street: z.string(),
        city: z.string()
      })
    });

    render(
      <ZodForm schema={schema} onSubmit={() => {}}>
        <button type="submit">Submit</button>
      </ZodForm>
    );

    expect(document.querySelector('fieldset')).toBeInTheDocument();
    expect(screen.getByLabelText('Street')).toBeInTheDocument();
    expect(screen.getByLabelText('City')).toBeInTheDocument();
  });

  it('renders array field with Add button and disabled Remove at min', async () => {
    const schema = z.object({
      tags: z.array(z.string()).min(1)
    });

    render(
      <ZodForm schema={schema} onSubmit={() => {}}>
        <button type="submit">Submit</button>
      </ZodForm>
    );

    const addButton = screen.getByRole('button', { name: /add/i });
    expect(addButton).toBeInTheDocument();

    // Initially 0 items added to the RHF list → Add to get an item
    fireEvent.click(addButton);

    // After adding 1 item, Remove button should be disabled (at minLength=1)
    await waitFor(() => {
      const removeButton = screen.getByRole('button', { name: /remove/i });
      expect(removeButton).toBeInTheDocument();
      expect(removeButton).toBeDisabled();
    });
  });

  it('renders discriminated union and shows variant fields on select change', async () => {
    const schema = z.object({
      profile: z.discriminatedUnion('role', [
        z.object({ role: z.literal('admin'), level: z.number() }),
        z.object({ role: z.literal('user'), name: z.string() })
      ])
    });

    render(
      <ZodForm schema={schema} onSubmit={() => {}}>
        <button type="submit">Submit</button>
      </ZodForm>
    );

    // Select should render the discriminator options
    const select = screen.getByLabelText('Profile');
    expect(select).toBeInTheDocument();

    // Initially no variant-specific fields visible
    expect(screen.queryByLabelText('Level')).not.toBeInTheDocument();

    // Select admin variant
    fireEvent.change(select, { target: { value: 'admin' } });

    await waitFor(() => {
      expect(screen.getByLabelText('Level')).toBeInTheDocument();
      expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
    });

    // Switch to user variant
    fireEvent.change(select, { target: { value: 'user' } });

    await waitFor(() => {
      expect(screen.getByLabelText('Name')).toBeInTheDocument();
      expect(screen.queryByLabelText('Level')).not.toBeInTheDocument();
    });
  });
});
