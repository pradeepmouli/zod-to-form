/**
 * Stub fixture for @/components/ui/switch.
 * Test-only — never shipped to consumers.
 *
 * Uses Radix-shaped props (onCheckedChange) rather than the native onChange.
 */
import * as React from 'react';

export interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
}

export function Switch({ checked, onCheckedChange, disabled, id }: SwitchProps) {
  return (
    <input
      type="checkbox"
      role="switch"
      id={id}
      disabled={disabled}
      checked={!!checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
    />
  );
}
