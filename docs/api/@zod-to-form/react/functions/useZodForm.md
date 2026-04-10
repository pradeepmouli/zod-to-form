[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/react](../README.md) / [](../README.md) / useZodForm

# Function: useZodForm()

> **useZodForm**\<`TSchema`\>(`schema`, `options?`): `object`

Defined in: [packages/react/src/useZodForm.ts:42](https://github.com/pradeepmouli/zod-to-form/blob/07a3b2a90ac2fca44ff29a544e6b0db537316968/packages/react/src/useZodForm.ts#L42)

## Type Parameters

### TSchema

`TSchema` *extends* `ZodObject`\<`$ZodLooseShape`, `$strip`\>

## Parameters

### schema

`TSchema`

### options?

`UseZodFormOptions`\<`TSchema`\>

## Returns

### fields

> **fields**: [`FormField`](../interfaces/FormField.md)[] = `walkResult.fields`

### form

> **form**: `UseFormReturn`\<`output`\<`TSchema`\>, `any`, `output`\<`TSchema`\>\>

### schemaError

> **schemaError**: `string` \| `null` = `walkResult.error`

Non-null when walkSchema threw — lets consumers display the error instead of an empty form

### schemaLite

> **schemaLite**: `$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\> \| `null` = `walkResult.schemaLite`

SchemaLite for submit-time validation (non-null when optimization is enabled and top-level effects exist)
