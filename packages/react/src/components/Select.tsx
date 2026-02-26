import type { SelectHTMLAttributes } from 'react';
import type { FormFieldOption } from '@zodform/core';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  options?: FormFieldOption[];
};

export function Select({ options, ...props }: SelectProps) {
  return (
    <select {...props}>
      {options?.map((option) => (
        <option key={`${option.value}`} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </select>
  );
}