[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / FormOptimizerContext

# Interface: FormOptimizerContext

Defined in: [optimizers/types.ts:35](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/optimizers/types.ts#L35)

## Properties

### collectorBasePath

> **collectorBasePath**: `string`

Defined in: [optimizers/types.ts:40](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/optimizers/types.ts#L40)

Dot-path prefix of the current collector's scope (empty string at root)

***

### level

> **level**: `1` \| `2` \| `3`

Defined in: [optimizers/types.ts:38](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/optimizers/types.ts#L38)

***

### optimizers

> **optimizers**: `Record`\<`string`, [`FormOptimizer`](../type-aliases/FormOptimizer.md)[]\>

Defined in: [optimizers/types.ts:36](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/optimizers/types.ts#L36)

***

### schemaLite

> **schemaLite**: [`SchemaLiteCollector`](SchemaLiteCollector.md)

Defined in: [optimizers/types.ts:37](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/optimizers/types.ts#L37)
