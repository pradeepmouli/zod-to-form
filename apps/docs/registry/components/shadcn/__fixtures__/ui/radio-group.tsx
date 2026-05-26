/**
 * Stub fixture for @/components/ui/radio-group.
 * Test-only — never shipped to consumers.
 *
 * Selection testing strategy:
 *   RadioGroup passes an `onSelect` prop down to each RadioGroupItem child
 *   via React.cloneElement. When the item's <input type="radio"> fires onChange,
 *   it calls onSelect(value) which in turn calls the parent's onValueChange.
 *
 * Usage in tests:
 *   Render <RadioGroup onValueChange={handler}><RadioGroupItem value="a" /></RadioGroup>
 *   Then fireEvent.click / fireEvent.change on the radio input for that item.
 *   Assert that handler was called with the expected value.
 */
import * as React from 'react';

export interface RadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}

export function RadioGroup({ value: _value, onValueChange, disabled, children }: RadioGroupProps) {
  // Clone each child and inject an onSelect callback so RadioGroupItem can
  // bubble the selection back up without needing React context.
  const clonedChildren = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    return React.cloneElement(child as React.ReactElement<RadioGroupItemProps>, {
      onSelect: onValueChange,
      disabled: (child.props as RadioGroupItemProps).disabled ?? disabled
    });
  });

  return <div role="radiogroup">{clonedChildren}</div>;
}

export interface RadioGroupItemProps {
  value: string;
  id?: string;
  disabled?: boolean;
  /** Injected by RadioGroup — not part of the public shadcn API. */
  onSelect?: (value: string) => void;
}

export function RadioGroupItem({ value, id, disabled, onSelect }: RadioGroupItemProps) {
  return (
    <input
      type="radio"
      id={id}
      value={value}
      disabled={disabled}
      onChange={() => onSelect?.(value)}
    />
  );
}
