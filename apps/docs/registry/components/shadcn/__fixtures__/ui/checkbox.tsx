/**
 * Stub fixture for @/components/ui/checkbox.
 * Test-only — never shipped to consumers.
 *
 * Mirrors the real Base UI shadcn Checkbox:
 *   - `checked`/`onCheckedChange(boolean)` controlled props
 *   - `inputRef` for the hidden input (NOT forwardRef root ref)
 *   - `name`/`id`/`disabled`/`onBlur` pass-through
 */
import * as React from 'react';

export interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onBlur?: () => void;
  name?: string;
  disabled?: boolean;
  id?: string;
  inputRef?: React.Ref<HTMLInputElement>;
}

export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ checked, onCheckedChange, onBlur, name, disabled, id, inputRef }, _ref) => (
    <input
      ref={inputRef as React.Ref<HTMLInputElement>}
      type="checkbox"
      id={id}
      name={name}
      disabled={disabled}
      checked={!!checked}
      onBlur={onBlur}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
    />
  )
);
Checkbox.displayName = 'Checkbox';
