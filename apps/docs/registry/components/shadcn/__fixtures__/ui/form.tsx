/**
 * Stub fixture for @/components/ui/form.
 * Test-only — never shipped to consumers.
 *
 * Minimal pass-through stubs for the shadcn Form* layout primitives that the
 * codegen shadcn field template imports (see PRESET_TEMPLATE_IMPORTS['shadcn']
 * in @zod-to-form/codegen). The real consumer-side module is installed by the
 * shadcn `form` registry item; these stubs only let the adapter index.tsx
 * re-export resolve under the @/components/ui/* test alias.
 */
import * as React from 'react';

type DivProps = React.ComponentPropsWithoutRef<'div'>;
type LabelProps = React.ComponentPropsWithoutRef<'label'>;
type ParagraphProps = React.ComponentPropsWithoutRef<'p'>;

export function FormItem({ children, ...props }: DivProps) {
  return <div {...props}>{children}</div>;
}

export function FormControl({ children, ...props }: DivProps) {
  return <div {...props}>{children}</div>;
}

export function FormLabel({ children, ...props }: LabelProps) {
  return <label {...props}>{children}</label>;
}

export function FormMessage({ children, ...props }: ParagraphProps) {
  return <p {...props}>{children}</p>;
}

export function FormDescription({ children, ...props }: ParagraphProps) {
  return <p {...props}>{children}</p>;
}

export function FormField({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
