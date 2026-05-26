import { Checkbox as ShadcnCheckbox } from '@/components/ui/checkbox';

type Props = {
  value?: boolean;
  onChange?: (v: boolean) => void;
  onBlur?: () => void;
  disabled?: boolean;
  id?: string;
  name?: string;
};

export function Checkbox({ value, onChange, onBlur, disabled, id }: Props) {
  return (
    <ShadcnCheckbox
      id={id}
      disabled={disabled}
      checked={!!value}
      onCheckedChange={(c) => onChange?.(c === true)}
    />
  );
}
