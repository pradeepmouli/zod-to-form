[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/react](../README.md) / [](../README.md) / wrapWithSchemaLite

# Function: wrapWithSchemaLite()

> **wrapWithSchemaLite**\<`TData`\>(`schemaLite`, `setError`, `onSubmit`): (`data`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/react/src/SchemaLiteSubmit.ts:58](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/react/src/SchemaLiteSubmit.ts#L58)

Wraps a form `onSubmit` handler with `schemaLite` client-side validation.

Runs `schemaLite.safeParse(normalizeFormValues(data))` before calling the
original handler. On failure, maps each validation issue to the corresponding
RHF field via `setError`. On success, delegates to `onSubmit` unchanged.

Used by optimization-level codegen output to perform fast per-field
validation with a trimmed schema that omits cross-field refinements.

## Type Parameters

### TData

`TData` *extends* `Record`\<`string`, `unknown`\>

## Parameters

### schemaLite

`$ZodType`

The stripped Zod schema produced by `walkSchema` at optimization level 1+.

### setError

`UseFormSetError`\<`TData`\>

RHF's `setError` function from `useFormContext`.

### onSubmit

(`data`) => `void` \| `Promise`\<`void`\>

The original submit handler to call on successful validation.

## Returns

A wrapped submit handler with the same signature as `onSubmit`.

(`data`) => `void` \| `Promise`\<`void`\>

## Use When

- You are using codegen output with `validationLevel: 1` or higher and need the lite schema to run before your submit handler — this is the only function that wires `schemaLite` into RHF's `handleSubmit` flow

## Avoid When

- You are using the default `zodResolver` path (no `validationLevel`) — validation is handled by RHF's resolver and adding this wrapper causes double-validation with no benefit

## Never

- NEVER pass the full schema as `schemaLite` — it defeats the optimization and adds
  double-validation overhead; FIX: only pass the schema produced by `walkSchema`'s
  `result.schemaLite` field (never the original `z.object({...})`)
- NEVER use this with schemas that have root-level `.superRefine()` — root refinements
  are stripped from `schemaLite` by design and will not run through this wrapper;
  FIX: use full `zodResolver` path and skip `wrapWithSchemaLite` entirely

## Remarks

The wrapper calls `normalizeFormValues()` on the data before passing it to `schemaLite.safeParse()`.
This ensures empty strings from HTML inputs are converted to `undefined`, matching Zod's `.optional()` expectation.
Each validation issue's `path` array is joined with `.` to produce the RHF field path for `setError`.

## Throws

Never — validation errors are mapped to RHF's `setError` rather than thrown.

## Example

```ts
const handleSubmit = wrapWithSchemaLite(schemaLite, setError, async (data) => {
  await fetch('/api/submit', { method: 'POST', body: JSON.stringify(data) });
});
// Pass handleSubmit to RHF's form.handleSubmit(handleSubmit)
```
