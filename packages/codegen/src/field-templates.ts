/**
 * Preset field template source code, emitted as standalone files alongside generated forms.
 * Each template is a React component implementing FieldTemplateProps.
 */

export const SHADCN_FIELD_TEMPLATE = `import type { ReactNode } from 'react';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from './ui/form';

export interface FieldTemplateProps {
  children: ReactNode;
  label: string;
  description?: string;
  helpText?: string;
  error?: string;
  name: string;
  required?: boolean;
  disabled?: boolean;
  deprecated?: boolean;
}

export function FieldTemplate({
  children,
  label,
  description,
  helpText,
  error,
  name,
  deprecated
}: FieldTemplateProps) {
  return (
    <FormItem>
      <FormLabel htmlFor={name}>
        {deprecated ? <s>{label}</s> : label}
        {deprecated ? (
          <span aria-hidden="true" title="Deprecated"> ⚠</span>
        ) : null}
      </FormLabel>
      <FormControl>{children}</FormControl>
      {description ? <FormDescription>{description}</FormDescription> : null}
      {helpText ? (
        <p className="text-sm text-muted-foreground mt-1">{helpText}</p>
      ) : null}
      {error ? <FormMessage>{error}</FormMessage> : null}
    </FormItem>
  );
}
`;

export const HTML_FIELD_TEMPLATE = `import type { ReactNode } from 'react';

export interface FieldTemplateProps {
  children: ReactNode;
  label: string;
  description?: string;
  helpText?: string;
  error?: string;
  name: string;
  required?: boolean;
  disabled?: boolean;
  deprecated?: boolean;
}

export function FieldTemplate({
  children,
  label,
  description,
  helpText,
  error,
  name,
  deprecated
}: FieldTemplateProps) {
  return (
    <div>
      <label htmlFor={name}>
        {deprecated ? <s>{label}</s> : label}
        {deprecated ? (
          <span aria-hidden="true" title="Deprecated"> ⚠</span>
        ) : null}
      </label>
      {children}
      {description ? <p>{description}</p> : null}
      {helpText ? (
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
          {helpText}
        </p>
      ) : null}
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
`;

/** Components that each preset's field template imports from the component source */
export const PRESET_TEMPLATE_IMPORTS: Record<string, string[]> = {
  shadcn: ['FormControl', 'FormDescription', 'FormField', 'FormItem', 'FormLabel', 'FormMessage'],
  html: []
};

/**
 * Return the source code for the preset's `FieldTemplate` React component.
 * Used by the CLI `generate` and `init` commands to emit a standalone `FieldTemplate.tsx`
 * alongside generated forms.
 *
 * @param preset - The preset name: `'shadcn'` for Radix/shadcn-ui, `'html'` for plain HTML.
 * @returns The complete `FieldTemplate.tsx` source string for the chosen preset.
 *
 * @example
 * ```ts
 * const source = getFieldTemplateSource('shadcn');
 * await fs.writeFile('src/components/FieldTemplate.tsx', source);
 * ```
 *
 * @category Templates
 */
export function getFieldTemplateSource(preset: 'shadcn' | 'html'): string {
  return preset === 'shadcn' ? SHADCN_FIELD_TEMPLATE : HTML_FIELD_TEMPLATE;
}
