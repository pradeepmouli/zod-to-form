/**
 * Ambient declarations for `?z2f`-suffixed imports.
 *
 * Users add `"types": ["@zod-to-form/vite/client"]` to their `tsconfig.json`
 * and immediately get type resolution + autocomplete on `import { Form }
 * from './schemas/foo.ts?z2f'` without authoring any `.d.ts` files
 * themselves (FR-015, SC-005).
 *
 * Precision note (research R5): the `onSubmit` payload type is `unknown`
 * in v1. Tighter inference via `typeof import('...')` requires TypeScript
 * features not yet stable enough to rely on. Users who want a strongly
 * typed payload can annotate the parameter at the call site, where the
 * narrower type-checker context will prefer their annotation.
 */

declare module '*?z2f' {
  import type { ComponentType, FormHTMLAttributes, ReactNode } from 'react';

  /**
   * Props common to every generated form component.
   *
   * `onSubmit` receives the parsed schema output and is the primary surface
   * developers interact with. `defaultValues` and `values` accept partial
   * input data (matching React Hook Form's `useForm` semantics).
   */
  export interface Z2FFormProps<TData = unknown> extends FormHTMLAttributes<HTMLFormElement> {
    onSubmit: (data: TData) => void | Promise<void>;
    defaultValues?: Partial<TData>;
    values?: TData;
    fieldProps?: Record<string, Record<string, unknown>>;
    children?: ReactNode;
  }

  /**
   * The default export of every `?z2f` virtual module is a typed React
   * component. Each generated form re-exports the same component under
   * a named export matching the schema's component name (e.g. `SignupForm`).
   */
  const form: ComponentType<Z2FFormProps>;
  export default form;
}

/**
 * Variant-specific re-declaration. The grammar admits `?z2f=<variant>`
 * specifiers; we declare them with the same shape so `import { F } from
 * './schemas/x.ts?z2f=edit'` resolves the same way.
 */
declare module '*?z2f=*' {
  import type { ComponentType, FormHTMLAttributes, ReactNode } from 'react';

  export interface Z2FFormProps<TData = unknown> extends FormHTMLAttributes<HTMLFormElement> {
    onSubmit: (data: TData) => void | Promise<void>;
    defaultValues?: Partial<TData>;
    values?: TData;
    fieldProps?: Record<string, Record<string, unknown>>;
    children?: ReactNode;
  }

  const form: ComponentType<Z2FFormProps>;
  export default form;
}
