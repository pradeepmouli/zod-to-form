import * as React from 'react';
import { Textarea as ShadcnTextarea } from '@/components/ui/textarea';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<typeof ShadcnTextarea>
>((props, ref) => <ShadcnTextarea ref={ref} {...props} />);
Textarea.displayName = 'Textarea';
