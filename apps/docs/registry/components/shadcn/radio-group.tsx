import { RadioGroup as ShadcnRadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { FormFieldOption } from '@zod-to-form/core';

type Props = {
  value?: string | number;
  onChange?: (v: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  options?: FormFieldOption[];
};

export function RadioGroup({ value, onChange, disabled, name, options = [] }: Props) {
  return (
    <ShadcnRadioGroup
      value={value == null ? undefined : String(value)}
      onValueChange={(v) => onChange?.(v)}
      disabled={disabled}
    >
      {options.map((o) => {
        const itemId = `${name ?? 'radio'}-${String(o.value)}`;
        return (
          <RadioGroupItem
            key={String(o.value)}
            value={String(o.value)}
            id={itemId}
            disabled={o.disabled}
          />
        );
      })}
      {options.map((o) => {
        const itemId = `${name ?? 'radio'}-${String(o.value)}`;
        return (
          <Label key={`${String(o.value)}-label`} htmlFor={itemId}>
            {o.label}
          </Label>
        );
      })}
    </ShadcnRadioGroup>
  );
}
