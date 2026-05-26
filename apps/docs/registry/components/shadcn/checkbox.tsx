import * as React from 'react';
import { Checkbox as ShadcnCheckbox } from '@/components/ui/checkbox';
import type { ControlledFieldProps } from './types.js';

export const Checkbox = React.forwardRef<HTMLButtonElement, ControlledFieldProps<boolean>>(
  ({ value, onChange, onBlur, name, disabled, id }, ref) => (
    <ShadcnCheckbox
      inputRef={ref as React.Ref<HTMLInputElement>}
      id={id}
      name={name}
      disabled={disabled}
      onBlur={onBlur}
      checked={!!value}
      onCheckedChange={(c: boolean) => onChange?.(c)}
    />
  )
);
Checkbox.displayName = 'Checkbox';
