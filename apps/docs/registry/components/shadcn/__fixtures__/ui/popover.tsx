/**
 * Stub fixture for @/components/ui/popover.
 * Test-only — never shipped to consumers.
 *
 * All three components render children inline so the Calendar (or any
 * popover content) is always present in the DOM for tests — no portal/visibility toggling.
 */
import * as React from 'react';

export function Popover({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

export function PopoverTrigger({
  asChild: _asChild,
  children
}: {
  asChild?: boolean;
  children?: React.ReactNode;
}) {
  return <>{children}</>;
}

export function PopoverContent({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
