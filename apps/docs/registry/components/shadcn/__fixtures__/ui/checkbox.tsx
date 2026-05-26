/**
 * Stub fixture for @/components/ui/checkbox.
 * Test-only — never shipped to consumers.
 *
 * Uses Radix-shaped props (onCheckedChange) rather than the native onChange.
 */
import * as React from 'react';

export interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
}

export function Checkbox({ checked, onCheckedChange, disabled, id }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      id={id}
      disabled={disabled}
      checked={!!checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
    />
  );
}
