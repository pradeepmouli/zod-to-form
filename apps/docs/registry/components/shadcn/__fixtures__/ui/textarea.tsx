/**
 * Stub fixture for @/components/ui/textarea.
 * Test-only — never shipped to consumers.
 */
import * as React from 'react';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>((p, ref) => <textarea ref={ref} {...p} />);
Textarea.displayName = 'Textarea';
