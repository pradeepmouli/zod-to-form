/**
 * Stub fixture for @/components/ui/switch.
 * Test-only — never shipped to consumers.
 *
 * Uses Radix-shaped props (onCheckedChange) rather than the native onChange.
 * Mirrors the real shadcn Switch: forwardRef + accepts name/onBlur so the
 * controlled adapter can forward the full RHF field shape.
 */
import * as React from 'react';

export interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onBlur?: () => void;
  name?: string;
  disabled?: boolean;
  id?: string;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onCheckedChange, onBlur, name, disabled, id }, _ref) => (
    <input
      type="checkbox"
      role="switch"
      id={id}
      name={name}
      disabled={disabled}
      checked={!!checked}
      onBlur={onBlur}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
    />
  )
);
Switch.displayName = 'Switch';
