[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / createSchemaLiteCollector

# Function: createSchemaLiteCollector()

> **createSchemaLiteCollector**(`options?`): [`SchemaLiteCollector`](../interfaces/SchemaLiteCollector.md)

Defined in: [optimizers/schema-lite.ts:193](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/optimizers/schema-lite.ts#L193)

Create a new SchemaLiteCollector instance.

Builds a "lite" schema for submit-time validation:
- Checks (superRefine/refine): z.object({}).loose().check(c1).check(c2)
- Transforms: z.object({}).loose().check(...).transform(fn)
- Non-decomposable pipes: original schema as-is

## Parameters

### options?

Optional configuration for the collector base type.

#### useAnyBase?

`boolean`

Use z.any() instead of z.object({}).loose() when no fields are present.
 Set for non-object containers (arrays, tuples, etc.) whose data isn't an object.

## Returns

[`SchemaLiteCollector`](../interfaces/SchemaLiteCollector.md)

A fresh `SchemaLiteCollector` ready to accumulate checks, transforms, and fallthrough fields.
