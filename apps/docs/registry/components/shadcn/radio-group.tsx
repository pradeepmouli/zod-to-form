import * as React from 'react';
import { RadioGroup as ShadcnRadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { FormFieldOption } from './types.js';
import type { ControlledFieldProps } from './types.js';

type Props = ControlledFieldProps<string | number> & {
  options?: FormFieldOption[];
};

export const RadioGroup = React.forwardRef<HTMLDivElement, Props>(
  ({ value, onChange, onBlur, name, disabled, options = [] }, ref) => (
    <ShadcnRadioGroup
      ref={ref}
      name={name}
      onBlur={onBlur}
      value={value == null ? undefined : String(value)}
      onValueChange={(v) => onChange?.(v)}
      disabled={disabled}
    >
      {options.map((o, index) => {
        const itemId = `${name ?? 'radio'}-${index}`;
        return (
          <div key={String(o.value)}>
            <RadioGroupItem value={String(o.value)} id={itemId} disabled={o.disabled} />
            <Label htmlFor={itemId}>{o.label}</Label>
          </div>
        );
      })}
    </ShadcnRadioGroup>
  )
);
RadioGroup.displayName = 'RadioGroup';
