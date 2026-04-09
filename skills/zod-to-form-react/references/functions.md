# Functions

## `ZodForm`
```ts
ZodForm<TSchema>(props: ZodFormProps<TSchema>): ReactNode
```
**Parameters:**
- `props: ZodFormProps<TSchema>` — 
**Returns:** `ReactNode`

## `useZodForm`
```ts
useZodForm<TSchema>(schema: TSchema, options?: UseZodFormOptions<TSchema>): { form: UseFormReturn<output<TSchema>, any, output<TSchema>>; fields: FormField[]; schemaError: string | null; schemaLite: $ZodType<unknown, unknown, $ZodTypeInternals<unknown, unknown>> | null }
```
**Parameters:**
- `schema: TSchema` — 
- `options: UseZodFormOptions<TSchema>` (optional) — 
**Returns:** `{ form: UseFormReturn<output<TSchema>, any, output<TSchema>>; fields: FormField[]; schemaError: string | null; schemaLite: $ZodType<unknown, unknown, $ZodTypeInternals<unknown, unknown>> | null }`

## `normalizeFormValues`
Normalize raw HTML form values for Zod parsing.

HTML inputs produce values that don't match Zod's expectations:
- Empty strings "" for unset optional fields (Zod .optional() accepts undefined, not "")
- FileList objects for file inputs (Zod expects File or undefined)

This function recursively normalizes these mismatches so that
schema.safeParse(normalizeFormValues(values)) works correctly.

Called unconditionally in the resolver wrapper to ensure consistent
behavior across all component libraries. While shadcn components handle
most value conversions natively, normalization provides a safety net for
edge cases like FileList objects.
```ts
normalizeFormValues(value: unknown): unknown
```
**Parameters:**
- `value: unknown` — 
**Returns:** `unknown`

## `wrapWithSchemaLite`
Wraps a form onSubmit handler with schemaLite validation.
Runs schemaLite.safeParse on the form data before calling the original handler.
Maps validation errors to form fields via setError.
```ts
wrapWithSchemaLite<TData>(schemaLite: $ZodType, setError: UseFormSetError<TData>, onSubmit: (data: TData) => void | Promise<void>): (data: TData) => void | Promise<void>
```
**Parameters:**
- `schemaLite: $ZodType` — 
- `setError: UseFormSetError<TData>` — 
- `onSubmit: (data: TData) => void | Promise<void>` — 
**Returns:** `(data: TData) => void | Promise<void>`
