[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / walkSchema

# Function: walkSchema()

## Call Signature

> **walkSchema**(`schema`, `options`): [`WalkResult`](../interfaces/WalkResult.md)

Defined in: [walker.ts:286](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/walker.ts#L286)

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

Defined in: [walker.ts:290](https://github.com/pradeepmouli/zod-to-form/blob/c74f77fffd2cebcc6ae8059fad83772f8d79fc1c/packages/core/src/walker.ts#L290)

Walk a Zod schema and produce a FormField[] tree.
When optimization option is set, returns WalkResult with fields + schemaLite.

### Parameters

#### schema

`$ZodType`

#### options?

[`WalkOptions`](../interfaces/WalkOptions.md)

### Returns

[`FormField`](../interfaces/FormField.md)[]
