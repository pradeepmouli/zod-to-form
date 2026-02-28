/**
 * @zod-to-form/react — API Contract
 *
 * This file defines the public TypeScript interfaces for the React package.
 * Implementation MUST satisfy these interfaces.
 */

import type { ComponentType, ReactNode } from 'react';
import type { ZodObject, ZodRegistry } from 'zod';
import type { UseFormReturn, SubmitHandler } from 'react-hook-form';
import type { FormField, FormMeta, FormProcessor } from './core-api';

// ─── ComponentMap ─────────────────────────────────────────────────────

export interface ComponentMap {
  Input: ComponentType<any>;
  Textarea: ComponentType<any>;
  Checkbox: ComponentType<any>;
  Switch: ComponentType<any>;
  Select: ComponentType<any>;
  DatePicker: ComponentType<any>;
  FileInput: ComponentType<any>;
  RadioGroup: ComponentType<any>;
  /** Combobox for autocomplete/searchable select (optional) */
  Combobox?: ComponentType<any>;
  /** Field wrapper providing label + input + error layout */
  FormField: ComponentType<any>;
  /** Label element */
  FormLabel: ComponentType<any>;
  /** Description text */
  FormDescription: ComponentType<any>;
  /** Validation error message */
  FormMessage: ComponentType<any>;
}

// ─── ZodForm Props ────────────────────────────────────────────────────

export interface ZodFormProps<TSchema extends ZodObject<any>> {
  /** The Zod object schema to render as a form */
  schema: TSchema;
  /** Typed submit handler receiving validated data */
  onSubmit: SubmitHandler<TSchema['_zod']['output']>;
  /** Optional default values matching schema shape */
  defaultValues?: Partial<TSchema['_zod']['output']>;
  /** Custom component map (overrides default unstyled primitives) */
  components?: Partial<ComponentMap>;
  /** Form-specific metadata registry */
  formRegistry?: ZodRegistry<FormMeta>;
  /** Custom processors to add or override */
  processors?: Record<string, FormProcessor>;
  /** Additional CSS class name for the form element */
  className?: string;
  /** Form children (submit button, etc.) */
  children?: ReactNode;
}

/**
 * Render a complete, validated form from a Zod schema.
 *
 * @example
 * ```tsx
 * <ZodForm schema={userSchema} onSubmit={(data) => console.log(data)}>
 *   <button type="submit">Submit</button>
 * </ZodForm>
 * ```
 */
export declare function ZodForm<TSchema extends ZodObject<any>>(
  props: ZodFormProps<TSchema>
): ReactNode;

// ─── useZodForm Hook ──────────────────────────────────────────────────

export interface UseZodFormReturn<TSchema extends ZodObject<any>> {
  /** React Hook Form instance */
  form: UseFormReturn<TSchema['_zod']['output']>;
  /** FormField[] tree from walking the schema */
  fields: FormField[];
}

/**
 * Hook that combines schema walking with React Hook Form setup.
 * Memoizes the walk — re-walks only when schema reference changes.
 *
 * @param schema - A Zod object schema
 * @param options - Optional configuration
 * @returns Form instance and field descriptors
 */
export declare function useZodForm<TSchema extends ZodObject<any>>(
  schema: TSchema,
  options?: {
    defaultValues?: Partial<TSchema['_zod']['output']>;
    formRegistry?: ZodRegistry<FormMeta>;
    processors?: Record<string, FormProcessor>;
  }
): UseZodFormReturn<TSchema>;

// ─── Component Maps ───────────────────────────────────────────────────

/** Default unstyled HTML primitives */
export declare const defaultComponentMap: ComponentMap;

/** shadcn/ui component map (optional import from @zod-to-form/react/shadcn) */
export declare const shadcnComponentMap: ComponentMap;
