import {
  Select as ShadcnSelect,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';
import type { FormFieldOption } from '@zod-to-form/core';

type Props = {
  value?: string | number;
  onChange?: (v: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  placeholder?: string;
  options?: FormFieldOption[];
};

export function Select({ value, onChange, disabled, id, placeholder, options = [] }: Props) {
  return (
    <ShadcnSelect
      value={value == null ? undefined : String(value)}
      onValueChange={(v) => onChange?.(v)}
      disabled={disabled}
    >
      <SelectTrigger id={id}>
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
  );
}
