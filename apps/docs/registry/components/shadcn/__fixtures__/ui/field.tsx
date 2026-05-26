/**
 * Stub fixture for @/components/ui/field.
 * Test-only — never shipped to consumers.
 *
 * Minimal pass-through stubs for the Base UI shadcn Field* layout primitives
 * that replaced the Form* family (Oct 2025). The real consumer-side module is
 * installed by the shadcn `field` registry item; these stubs only let the
 * adapter index.tsx re-export resolve under the @/components/ui/* test alias.
 */
import * as React from 'react';

type DivProps = React.ComponentPropsWithoutRef<'div'>;
type FieldSetProps = React.ComponentPropsWithoutRef<'fieldset'>;
type LabelProps = React.ComponentPropsWithoutRef<'label'>;
type ParagraphProps = React.ComponentPropsWithoutRef<'p'>;
type LegendProps = React.ComponentPropsWithoutRef<'legend'>;
type HRProps = React.ComponentPropsWithoutRef<'hr'>;
type HeadingProps = React.ComponentPropsWithoutRef<'h3'>;

export function Field({ children, ...props }: DivProps) {
  return <div {...props}>{children}</div>;
}

export function FieldLabel({ children, ...props }: LabelProps) {
  return <label {...props}>{children}</label>;
}

export function FieldDescription({ children, ...props }: ParagraphProps) {
  return <p {...props}>{children}</p>;
}

export function FieldError({ children, ...props }: ParagraphProps) {
  return <p {...props}>{children}</p>;
}

export function FieldGroup({ children, ...props }: DivProps) {
  return <div {...props}>{children}</div>;
}

export function FieldContent({ children, ...props }: DivProps) {
  return <div {...props}>{children}</div>;
}

export function FieldSet({ children, ...props }: FieldSetProps) {
  return <fieldset {...props}>{children}</fieldset>;
}

export function FieldLegend({ children, ...props }: LegendProps) {
  return <legend {...props}>{children}</legend>;
}

export function FieldSeparator(props: HRProps) {
  return <hr {...props} />;
}

export function FieldTitle({ children, ...props }: HeadingProps) {
  return <h3 {...props}>{children}</h3>;
}
