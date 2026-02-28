import { memo } from 'react';
import type { SelectHTMLAttributes } from 'react';
import type { FormFieldOption } from '@zod-to-form/core';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  options?: FormFieldOption[];
};

export const Select = memo(function Select({ options, ...props }: SelectProps) {
  return (
    <select {...props}>
      {options?.map((option) => (
        <option key={`${option.value}`} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </select>
  );
});
