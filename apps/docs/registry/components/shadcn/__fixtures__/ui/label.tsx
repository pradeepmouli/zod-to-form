/**
 * Stub fixture for @/components/ui/label.
 * Test-only — never shipped to consumers.
 */
import * as React from 'react';

export function Label({ htmlFor, children }: { htmlFor?: string; children?: React.ReactNode }) {
  return <label htmlFor={htmlFor}>{children}</label>;
}
