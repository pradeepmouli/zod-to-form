[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / createSchemaLiteCollector

# Function: createSchemaLiteCollector()

> **createSchemaLiteCollector**(`options?`): [`SchemaLiteCollector`](../interfaces/SchemaLiteCollector.md)

Defined in: [optimizers/schema-lite.ts:188](https://github.com/pradeepmouli/zod-to-form/blob/f52a0ed6020c1b7e4faaba6683436bbe29928d05/packages/core/src/optimizers/schema-lite.ts#L188)

Create a new SchemaLiteCollector instance.

Builds a "lite" schema for submit-time validation:
- Checks (superRefine/refine): z.object({}).loose().check(c1).check(c2)
- Transforms: z.object({}).loose().check(...).transform(fn)
- Non-decomposable pipes: original schema as-is

## Parameters

### options?

#### useAnyBase?

`boolean`

Use z.any() instead of z.object({}).loose() when no fields are present.
 Set for non-object containers (arrays, tuples, etc.) whose data isn't an object.

## Returns

[`SchemaLiteCollector`](../interfaces/SchemaLiteCollector.md)
