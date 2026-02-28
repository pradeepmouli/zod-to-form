import { memo } from 'react';
import type { InputHTMLAttributes } from 'react';
import type { FormFieldOption } from '@zod-to-form/core';

type ComboboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'list'> & {
  options?: FormFieldOption[];
};

/**
 * Unstyled native combobox using `<datalist>` + `<input list>`.
 * Provides browser-native autocomplete from the options list.
 */
export const ComboboxFallback = memo(function ComboboxFallback({
  options,
  id,
  ...props
}: ComboboxProps) {
  const listId = id ? `${id}-list` : undefined;

  return (
    <>
      <input {...props} id={id} list={listId} type="text" />
      <datalist id={listId}>
        {options?.map((option) => (
          <option key={`${option.value}`} value={`${option.value}`}>
            {option.label}
          </option>
        ))}
      </datalist>
    </>
  );
});
