import type { InputHTMLAttributes } from 'react';

export function FileInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="file" {...props} />;
}
