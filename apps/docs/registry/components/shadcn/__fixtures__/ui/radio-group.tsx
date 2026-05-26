/**
 * Stub fixture for @/components/ui/radio-group.
 * Test-only — never shipped to consumers.
 *
 * Mirrors real Radix RadioGroup: selection is wired via React context so the
 * RadioGroupItem can live at any depth (e.g. inside a per-option <div> wrapper),
 * not just as a direct child. RadioGroup provides onValueChange + disabled;
 * each RadioGroupItem reads the context and fires onValueChange(value) on change.
 *
 * Usage in tests:
 *   Render <RadioGroup onValueChange={handler}>...<RadioGroupItem value="a" />...</RadioGroup>
 *   Then fireEvent.click on the radio input for that item (React 19 + jsdom does
 *   not trigger the synthetic onChange via fireEvent.change on radio inputs).
 *   Assert that handler was called with the expected value.
 */
import * as React from 'react';

const Ctx = React.createContext<{ onValueChange?: (v: string) => void; disabled?: boolean }>({});

export interface RadioGroupProps {
  value?: string;
  onValueChange?: (v: string) => void;
  onBlur?: () => void;
  name?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ onValueChange, onBlur, name, disabled, children }, ref) => (
    <div ref={ref} role="radiogroup" data-name={name} onBlur={onBlur}>
      <Ctx.Provider value={{ onValueChange, disabled }}>{children}</Ctx.Provider>
    </div>
  )
);
RadioGroup.displayName = 'RadioGroup';

export interface RadioGroupItemProps {
  value: string;
  id?: string;
  disabled?: boolean;
}

export function RadioGroupItem({ value, id, disabled }: RadioGroupItemProps) {
  const { onValueChange, disabled: groupDisabled } = React.useContext(Ctx);
  return (
    <input
      type="radio"
      id={id}
      value={value}
      disabled={disabled ?? groupDisabled}
      onChange={() => onValueChange?.(value)}
    />
  );
}
