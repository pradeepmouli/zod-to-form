[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / WalkResult

# Interface: WalkResult

Defined in: [optimizers/types.ts:33](https://github.com/pradeepmouli/zod-to-form/blob/80855062565e7587830d7555ce1551eb20fdbb74/packages/core/src/optimizers/types.ts#L33)

The result returned by `walkSchema()` when an optimization level is specified.
Contains the full `FormField[]` tree plus a lite Zod schema for submit-time validation
and metadata that codegen uses to reconstruct the lite schema in generated files.

## Properties

### fields

> **fields**: [`FormField`](FormField.md)[]

Defined in: [optimizers/types.ts:35](https://github.com/pradeepmouli/zod-to-form/blob/80855062565e7587830d7555ce1551eb20fdbb74/packages/core/src/optimizers/types.ts#L35)

Ordered, sorted FormField tree produced by the schema walker

***

### schemaLite

> **schemaLite**: `$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\> \| `null`

Defined in: [optimizers/types.ts:37](https://github.com/pradeepmouli/zod-to-form/blob/80855062565e7587830d7555ce1551eb20fdbb74/packages/core/src/optimizers/types.ts#L37)

Lite schema for submit-time validation (null when no effects were found)

***

### schemaLiteInfo

> **schemaLiteInfo**: [`SchemaLiteInfo`](../type-aliases/SchemaLiteInfo.md)

Defined in: [optimizers/types.ts:39](https://github.com/pradeepmouli/zod-to-form/blob/80855062565e7587830d7555ce1551eb20fdbb74/packages/core/src/optimizers/types.ts#L39)

Codegen metadata — describes how to reconstruct schemaLite in generated code
