/**
 * Stub fixture for @/components/ui/switch.
 * Test-only — never shipped to consumers.
 *
 * Mirrors the real Base UI shadcn Switch:
 *   - `checked`/`onCheckedChange(boolean)` controlled props
 *   - `inputRef` for the hidden input (NOT forwardRef root ref)
 *   - `name`/`id`/`disabled` pass-through (no `onBlur` — Base UI Switch omits it)
 */
import * as React from 'react';

export interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  name?: string;
  disabled?: boolean;
  id?: string;
  inputRef?: React.Ref<HTMLInputElement>;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onCheckedChange, name, disabled, id, inputRef }, _ref) => (
    <input
      ref={inputRef as React.Ref<HTMLInputElement>}
      type="checkbox"
      role="switch"
      id={id}
      name={name}
      disabled={disabled}
      checked={!!checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
    />
  )
);
Switch.displayName = 'Switch';
