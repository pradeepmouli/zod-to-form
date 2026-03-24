/**
 * Contract: FieldTemplateProps (NEW)
 *
 * Props received by the field template component.
 * The field template is a standard React wrapper component that controls
 * the composition of label + input + description + helpText + error.
 *
 * Preset provides a default template; explicit fieldTemplate overrides it.
 */
import type { ReactNode } from 'react';

interface FieldTemplateProps {
  /** The rendered input element */
  children: ReactNode;

  /** Display label for the field */
  label: string;

  /** Help text below the label */
  description?: string;

  /** Help text below the input (distinct from description) */
  helpText?: string;

  /** Validation error message */
  error?: string;

  /** Field path/name (for htmlFor, aria attributes) */
  name: string;

  /** Whether the field is required */
  required?: boolean;

  /** Whether the field is disabled */
  disabled?: boolean;

  /** Whether the field is marked as deprecated */
  deprecated?: boolean;
}

/**
 * Example: shadcn default field template
 *
 * function ShadcnFieldTemplate({ children, label, description, helpText, error, name, deprecated }: FieldTemplateProps) {
 *   return (
 *     <FormField name={name}>
 *       <FormLabel>{deprecated ? <s>{label}</s> : label}</FormLabel>
 *       <FormControl>{children}</FormControl>
 *       {description && <FormDescription>{description}</FormDescription>}
 *       {helpText && <p className="text-sm text-muted-foreground mt-1">{helpText}</p>}
 *       <FormMessage />
 *     </FormField>
 *   );
 * }
 *
 * Example: html default field template
 *
 * function HtmlFieldTemplate({ children, label, description, helpText, error, name, deprecated }: FieldTemplateProps) {
 *   return (
 *     <div>
 *       <label htmlFor={name}>{deprecated ? <s>{label}</s> : label}</label>
 *       {description && <p>{description}</p>}
 *       {children}
 *       {helpText && <p>{helpText}</p>}
 *       {error && <p role="alert">{error}</p>}
 *     </div>
 *   );
 * }
 */
