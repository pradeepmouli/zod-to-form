import * as React from 'react';
import {
  Select as ShadcnSelect,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';
import type { FormFieldOption } from './types.js';
import type { ControlledFieldProps } from './types.js';

type Props = ControlledFieldProps<string | number> & {
  placeholder?: string;
  options?: FormFieldOption[];
};

export const Select = React.forwardRef<HTMLButtonElement, Props>(
  ({ value, onChange, onBlur, name, disabled, id, placeholder, options = [] }, ref) => (
    <ShadcnSelect
      value={value == null ? undefined : String(value)}
      onValueChange={(v) => {
        if (v != null) onChange?.(v);
      }}
      disabled={disabled}
    >
      <SelectTrigger ref={ref} id={id} name={name} onBlur={onBlur}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={String(o.value)} value={String(o.value)} disabled={o.disabled}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </ShadcnSelect>
  )
);
Select.displayName = 'Select';
