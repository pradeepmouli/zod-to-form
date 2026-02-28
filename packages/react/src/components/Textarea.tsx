import { memo } from 'react';
import type { TextareaHTMLAttributes } from 'react';

export const Textarea = memo(function Textarea(
  props: TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  return <textarea {...props} />;
});
