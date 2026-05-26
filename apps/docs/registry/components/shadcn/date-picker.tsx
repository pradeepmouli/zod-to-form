import * as React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import type { ControlledFieldProps } from './types.js';

export function DatePicker({
  value,
  onChange,
  name,
  disabled,
  id
}: ControlledFieldProps<Date | undefined>) {
  const selected = value instanceof Date && !Number.isNaN(value.getTime()) ? value : undefined;
  return (
    <Popover>
      <PopoverTrigger
        render={<Button type="button" variant="outline" id={id} name={name} disabled={disabled} />}
      >
        {selected ? format(selected, 'PPP') : 'Pick a date'}
      </PopoverTrigger>
      <PopoverContent>
        <Calendar mode="single" selected={selected} onSelect={(d?: Date) => onChange?.(d)} />
      </PopoverContent>
    </Popover>
  );
}
DatePicker.displayName = 'DatePicker';
