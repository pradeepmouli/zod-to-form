import * as React from 'react';
import { Switch as ShadcnSwitch } from '@/components/ui/switch';
import type { ControlledFieldProps } from './types.js';

export const Switch = React.forwardRef<HTMLButtonElement, ControlledFieldProps<boolean>>(
  ({ value, onChange, name, disabled, id }, ref) => (
    <ShadcnSwitch
      inputRef={ref as React.Ref<HTMLInputElement>}
      id={id}
      name={name}
      disabled={disabled}
      checked={!!value}
      onCheckedChange={(c: boolean) => onChange?.(c)}
    />
  )
);
Switch.displayName = 'Switch';
