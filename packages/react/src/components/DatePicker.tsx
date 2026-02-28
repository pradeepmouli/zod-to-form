import { memo } from 'react';
import type { InputHTMLAttributes } from 'react';

export const DatePicker = memo(function DatePicker(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="date" {...props} />;
});
