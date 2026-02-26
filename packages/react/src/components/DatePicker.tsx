import type { InputHTMLAttributes } from 'react';

export function DatePicker(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input type='date' {...props} />;
}