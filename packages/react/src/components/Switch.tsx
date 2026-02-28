import { memo } from 'react';
import type { InputHTMLAttributes } from 'react';

export const Switch = memo(function Switch(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="checkbox" role="switch" {...props} />;
});
