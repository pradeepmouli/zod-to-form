/**
 * Stub fixture for @/components/ui/input.
 * Test-only — never shipped to consumers.
 */
import * as React from 'react';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>((p, ref) => <input ref={ref} {...p} />);
Input.displayName = 'Input';
