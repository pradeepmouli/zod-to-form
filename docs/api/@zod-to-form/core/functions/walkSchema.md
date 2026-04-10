[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / walkSchema

# Function: walkSchema()

## Call Signature

> **walkSchema**(`schema`, `options`): [`WalkResult`](../interfaces/WalkResult.md)

Defined in: [walker.ts:264](https://github.com/pradeepmouli/zod-to-form/blob/f52a0ed6020c1b7e4faaba6683436bbe29928d05/packages/core/src/walker.ts#L264)

Walk a Zod schema and produce a FormField[] tree.
When optimization option is set, returns WalkResult with fields + schemaLite.

### Parameters

#### schema

`$ZodType`

#### options

[`WalkOptions`](../interfaces/WalkOptions.md) & `object`

### Returns

[`WalkResult`](../interfaces/WalkResult.md)

## Call Signature

> **walkSchema**(`schema`, `options?`): [`FormField`](../interfaces/FormField.md)[]

Defined in: [walker.ts:268](https://github.com/pradeepmouli/zod-to-form/blob/f52a0ed6020c1b7e4faaba6683436bbe29928d05/packages/core/src/walker.ts#L268)

Walk a Zod schema and produce a FormField[] tree.
When optimization option is set, returns WalkResult with fields + schemaLite.

### Parameters

#### schema

`$ZodType`

#### options?

[`WalkOptions`](../interfaces/WalkOptions.md)

### Returns

[`FormField`](../interfaces/FormField.md)[]
