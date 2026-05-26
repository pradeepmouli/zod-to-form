/**
 * Stub fixture for @/components/ui/button.
 * Test-only — never shipped to consumers.
 *
 * When asChild is true the button renders its children directly (Radix Slot-like behaviour).
 */
import * as React from 'react';

export interface ButtonProps {
  id?: string;
  type?: 'button' | 'submit' | 'reset';
  variant?: string;
  disabled?: boolean;
  asChild?: boolean;
  children?: React.ReactNode;
}

export function Button({ id, type, variant: _variant, disabled, asChild, children }: ButtonProps) {
  if (asChild) {
    return <>{children}</>;
  }
  return (
    <button id={id} type={type ?? 'button'} disabled={disabled}>
      {children}
    </button>
  );
}
