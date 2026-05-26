import * as React from 'react';
import { Input as ShadcnInput } from '@/components/ui/input';

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<typeof ShadcnInput>>(
  (props, ref) => <ShadcnInput ref={ref} {...props} />
);
Input.displayName = 'Input';
