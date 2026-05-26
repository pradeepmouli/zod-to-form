import * as React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

type Props = {
  value?: Date | string;
  onChange?: (v: Date | undefined) => void;
  disabled?: boolean;
  id?: string;
};

export function DatePicker({ value, onChange, disabled, id }: Props) {
  const date =
    value == null || value === '' ? undefined : value instanceof Date ? value : new Date(value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button id={id} type="button" variant="outline" disabled={disabled}>
          {date ? format(date, 'PPP') : 'Pick a date'}
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Calendar mode="single" selected={date} onSelect={(d?: Date) => onChange?.(d)} />
      </PopoverContent>
    </Popover>
  );
}
