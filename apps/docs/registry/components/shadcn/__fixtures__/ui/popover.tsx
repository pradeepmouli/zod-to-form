/**
 * Stub fixture for @/components/ui/popover.
 * Test-only — never shipped to consumers.
 *
 * All three components render children inline so the Calendar (or any
 * popover content) is always present in the DOM for tests — no portal/visibility toggling.
 *
 * PopoverTrigger supports both the legacy `asChild` pattern and the Base UI
 * `render` prop pattern. When `render` is provided, it is cloned and rendered
 * directly (any `children` are merged in as the render element's children).
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
    // Base UI pattern: `render` is the trigger element; children are its content.
    // Cast props to access .children safely (render is typed as ReactElement).
    const renderProps = render.props as { children?: React.ReactNode };
    return React.cloneElement(render, {}, children ?? renderProps.children);
  }
  return <>{children}</>;
}

export function PopoverContent({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
