import { Switch as ShadcnSwitch } from '@/components/ui/switch';

type Props = {
  value?: boolean;
  onChange?: (v: boolean) => void;
  onBlur?: () => void;
  disabled?: boolean;
  id?: string;
  name?: string;
};

export function Switch({ value, onChange, onBlur, disabled, id }: Props) {
  return (
    <ShadcnSwitch
      id={id}
      disabled={disabled}
      checked={!!value}
      onCheckedChange={(c) => onChange?.(c === true)}
    />
  );
}
