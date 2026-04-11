[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/react](../README.md) / [](../README.md) / wrapWithSchemaLite

# Function: wrapWithSchemaLite()

> **wrapWithSchemaLite**\<`TData`\>(`schemaLite`, `setError`, `onSubmit`): (`data`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/react/src/SchemaLiteSubmit.ts:17](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/react/src/SchemaLiteSubmit.ts#L17)

Wraps a form onSubmit handler with schemaLite validation.
Runs schemaLite.safeParse on the form data before calling the original handler.
Maps validation errors to form fields via setError.

## Type Parameters

### TData

`TData` *extends* `Record`\<`string`, `unknown`\>

## Parameters

### schemaLite

`$ZodType`

### setError

`UseFormSetError`\<`TData`\>

### onSubmit

(`data`) => `void` \| `Promise`\<`void`\>

## Returns

(`data`) => `void` \| `Promise`\<`void`\>
