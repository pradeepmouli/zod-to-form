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

  // Value-shape awareness: the core walker maps both `z.date()` and string
  // formats (`z.string().date()` / `.time()` / `.datetime()`) to DatePicker.
  // A string-backed field must receive a string on change — writing a `Date`
  // into it fails Zod validation. Detect the field's shape from the incoming
  // bound value: if it is a string, emit a `yyyy-MM-dd` string; otherwise emit
  // a `Date` (the `z.date()` case, including the undefined-from-Date initial).
  //
  // Known limitation (v1): the calendar only represents a date, so
  // `z.string().time()` / `.datetime()` lose any time-of-day precision — the
  // emitted `yyyy-MM-dd` covers the date portion only. A dedicated time picker
  // is out of scope.
  const stringMode = typeof value === 'string';
  const emit = (d?: Date) => onChange?.(stringMode ? (d ? format(d, 'yyyy-MM-dd') : undefined) : d);

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
        <Calendar mode="single" selected={valid} onSelect={emit} />
      </PopoverContent>
    </Popover>
  );
});
DatePicker.displayName = 'DatePicker';
