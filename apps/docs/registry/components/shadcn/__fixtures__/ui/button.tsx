/**
 * Stub fixture for @/components/ui/button.
 * Test-only — never shipped to consumers.
 *
 * When asChild is true the button renders its children directly (Radix Slot-like behaviour).
 */
import * as React from 'react';

export interface ButtonProps {
  id?: string;
  name?: string;
  type?: 'button' | 'submit' | 'reset';
  variant?: string;
  disabled?: boolean;
  asChild?: boolean;
  onBlur?: () => void;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ id, name, type, variant: _variant, disabled, asChild, onBlur, children }, ref) => {
    if (asChild) {
      return <>{children}</>;
    }
    return (
      <button
        ref={ref}
        id={id}
        name={name}
        type={type ?? 'button'}
        disabled={disabled}
        onBlur={onBlur}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
