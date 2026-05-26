import * as React from 'react';
import { Checkbox as ShadcnCheckbox } from '@/components/ui/checkbox';
import type { ControlledFieldProps } from './types.js';

export const Checkbox = React.forwardRef<HTMLButtonElement, ControlledFieldProps<boolean>>(
  ({ value, onChange, onBlur, name, disabled, id }, ref) => (
    <ShadcnCheckbox
      ref={ref}
      id={id}
      name={name}
      disabled={disabled}
      onBlur={onBlur}
      checked={!!value}
      onCheckedChange={(c) => onChange?.(c === true)}
    />
  )
);
Checkbox.displayName = 'Checkbox';
