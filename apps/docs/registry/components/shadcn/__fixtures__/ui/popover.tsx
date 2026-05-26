/**
 * Stub fixture for @/components/ui/popover.
 * Test-only — never shipped to consumers.
 *
 * All three components render children inline so the Calendar (or any
 * popover content) is always present in the DOM for tests — no portal/visibility toggling.
 *
 * PopoverTrigger supports both the legacy `asChild` pattern and the Base UI
 * `render` prop pattern. When `render` is provided, it is cloned and rendered
 * with the TRIGGER's own children (Base UI merges the component's children into
 * the rendered element, overriding any children the render element itself had).
 * When `children` are provided without `render`, they are rendered as-is.
 */
import * as React from 'react';

export function Popover({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

export function PopoverTrigger({
  asChild: _asChild,
  children,
  render
}: {
  asChild?: boolean;
  children?: React.ReactNode;
  render?: React.ReactElement;
}) {
  if (render) {
    // Base UI pattern: `render` is the trigger element; the trigger's own
    // `children` become its content (Base UI merges component children into the
    // rendered element, overriding the render element's own children).
    return React.cloneElement(render, {}, children);
  }
  return <>{children}</>;
}

export function PopoverContent({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
