import { memo } from 'react';
import type { InputHTMLAttributes } from 'react';

export const Input = memo(function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} />;
});
