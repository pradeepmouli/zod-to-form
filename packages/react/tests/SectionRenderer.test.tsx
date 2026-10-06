// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import { SectionRenderer } from '../src/index.js';

function Details({ fields }: { fields: string[] }) {
  const { register } = useFormContext();
  return (
    <>
      {fields.map((field) => (
        <input key={field} aria-label={field} {...register(field)} />
      ))}
    </>
  );
}

describe('SectionRenderer composition', () => {
  it('uses the host form and preserves edited values when the layout changes', () => {
    const submit = vi.fn();
    function Host({ sections }: { sections: Map<string, string[]> }) {
      const form = useForm({ defaultValues: { name: 'Initial', description: 'Existing' } });
      return (
        <FormProvider {...form}>
          <SectionRenderer sections={sections} componentConfig={{ componentModule: { Details } }} />
          <button onClick={() => submit(form.getValues())}>Read values</button>
        </FormProvider>
      );
    }
    const { rerender } = render(<Host sections={new Map([['Details', ['name']]])} />);
    fireEvent.change(screen.getByLabelText('name'), { target: { value: 'Edited' } });
    rerender(<Host sections={new Map([['Details', ['name', 'description']]])} />);
    expect(screen.getByLabelText('name')).toHaveValue('Edited');
    expect(screen.getByLabelText('description')).toHaveValue('Existing');
    fireEvent.click(screen.getByRole('button', { name: 'Read values' }));
    expect(submit).toHaveBeenCalledWith({ name: 'Edited', description: 'Existing' });
  });
});
