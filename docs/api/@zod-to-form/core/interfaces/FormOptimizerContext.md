[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / FormOptimizerContext

# Interface: FormOptimizerContext

Defined in: [optimizers/types.ts:35](https://github.com/pradeepmouli/zod-to-form/blob/f52a0ed6020c1b7e4faaba6683436bbe29928d05/packages/core/src/optimizers/types.ts#L35)

## Properties

### collectorBasePath

> **collectorBasePath**: `string`

Defined in: [optimizers/types.ts:40](https://github.com/pradeepmouli/zod-to-form/blob/f52a0ed6020c1b7e4faaba6683436bbe29928d05/packages/core/src/optimizers/types.ts#L40)

Dot-path prefix of the current collector's scope (empty string at root)

***

### level

> **level**: `1` \| `2` \| `3`

Defined in: [optimizers/types.ts:38](https://github.com/pradeepmouli/zod-to-form/blob/f52a0ed6020c1b7e4faaba6683436bbe29928d05/packages/core/src/optimizers/types.ts#L38)

***

### optimizers

> **optimizers**: `Record`\<`string`, [`FormOptimizer`](../type-aliases/FormOptimizer.md)[]\>

Defined in: [optimizers/types.ts:36](https://github.com/pradeepmouli/zod-to-form/blob/f52a0ed6020c1b7e4faaba6683436bbe29928d05/packages/core/src/optimizers/types.ts#L36)

***

### schemaLite

> **schemaLite**: [`SchemaLiteCollector`](SchemaLiteCollector.md)

Defined in: [optimizers/types.ts:37](https://github.com/pradeepmouli/zod-to-form/blob/f52a0ed6020c1b7e4faaba6683436bbe29928d05/packages/core/src/optimizers/types.ts#L37)
