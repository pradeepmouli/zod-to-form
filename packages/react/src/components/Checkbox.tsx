import { memo } from 'react';
import type { InputHTMLAttributes } from 'react';

export const Checkbox = memo(function Checkbox(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="checkbox" {...props} />;
});
