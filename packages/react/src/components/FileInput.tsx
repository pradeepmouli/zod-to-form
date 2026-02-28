import { memo } from 'react';
import type { InputHTMLAttributes } from 'react';

export const FileInput = memo(function FileInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="file" {...props} />;
});
