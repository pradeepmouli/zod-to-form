/**
 * Stub fixture for @/components/ui/select.
 * Test-only — never shipped to consumers.
 *
 * Renders a real <select> with <option> children so tests can fire change events.
 * SelectTrigger / SelectValue / SelectContent are thin pass-throughs;
 * SelectItem renders as <option> so the native <select> tree works.
 */
import * as React from 'react';

export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}

export function Select({ value, onValueChange, disabled, children }: SelectProps) {
  return (
    <select
      data-testid="select"
      value={value ?? ''}
      disabled={disabled}
      onChange={(e) => onValueChange?.(e.target.value)}
    >
      {children}
    </select>
  );
}

export function SelectTrigger({ id, children }: { id?: string; children?: React.ReactNode }) {
  // In real shadcn this wraps the trigger button; in the stub it's a no-op wrapper.
  return <>{children}</>;
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <>{placeholder}</>;
}

export function SelectContent({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

export interface SelectItemProps {
  value: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

export function SelectItem({ value, disabled, children }: SelectItemProps) {
  return (
    <option value={value} disabled={disabled}>
      {children}
    </option>
  );
}
