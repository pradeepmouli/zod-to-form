import type { InputHTMLAttributes } from 'react';
import type { FormFieldOption } from '@zodform/core';

type RadioGroupProps = InputHTMLAttributes<HTMLInputElement> & {
  name: string;
  options?: FormFieldOption[];
};

export function RadioGroup({ options, name, ...props }: RadioGroupProps) {
  return (
    <fieldset>
      {options?.map((option) => (
        <label key={`${option.value}`}>
          <input
            {...props}
            type='radio'
            name={name}
            value={option.value}
            disabled={option.disabled}
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}