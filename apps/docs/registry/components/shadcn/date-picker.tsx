import * as React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import type { ControlledFieldProps } from './types.js';

export const DatePicker = React.forwardRef<
  HTMLButtonElement,
  ControlledFieldProps<Date | string | undefined>
>(({ value, onChange, onBlur, name, disabled, id }, ref) => {
  const date =
    value == null || value === '' ? undefined : value instanceof Date ? value : new Date(value);
  // Guard against Invalid Date (e.g. a non-empty, non-ISO string): treat as
  // undefined so `format(...)` never throws and the placeholder is shown.
  const valid = date && !Number.isNaN(date.getTime()) ? date : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          ref={ref}
          id={id}
          name={name}
          onBlur={onBlur}
          type="button"
          variant="outline"
          disabled={disabled}
        >
          {valid ? format(valid, 'PPP') : 'Pick a date'}
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Calendar mode="single" selected={valid} onSelect={(d?: Date) => onChange?.(d)} />
      </PopoverContent>
    </Popover>
  );
});
DatePicker.displayName = 'DatePicker';
