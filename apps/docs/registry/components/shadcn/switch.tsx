import * as React from 'react';
import { Switch as ShadcnSwitch } from '@/components/ui/switch';
import type { ControlledFieldProps } from './types.js';

export const Switch = React.forwardRef<HTMLButtonElement, ControlledFieldProps<boolean>>(
  ({ value, onChange, onBlur, name, disabled, id }, ref) => (
    <ShadcnSwitch
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
Switch.displayName = 'Switch';
