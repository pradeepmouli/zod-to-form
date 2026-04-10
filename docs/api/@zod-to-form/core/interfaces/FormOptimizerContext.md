[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / FormOptimizerContext

# Interface: FormOptimizerContext

Defined in: [optimizers/types.ts:35](https://github.com/pradeepmouli/zod-to-form/blob/07a3b2a90ac2fca44ff29a544e6b0db537316968/packages/core/src/optimizers/types.ts#L35)

## Properties

### collectorBasePath

> **collectorBasePath**: `string`

Defined in: [optimizers/types.ts:40](https://github.com/pradeepmouli/zod-to-form/blob/07a3b2a90ac2fca44ff29a544e6b0db537316968/packages/core/src/optimizers/types.ts#L40)

Dot-path prefix of the current collector's scope (empty string at root)

***

### level

> **level**: `1` \| `2` \| `3`

Defined in: [optimizers/types.ts:38](https://github.com/pradeepmouli/zod-to-form/blob/07a3b2a90ac2fca44ff29a544e6b0db537316968/packages/core/src/optimizers/types.ts#L38)

***

### optimizers

> **optimizers**: `Record`\<`string`, [`FormOptimizer`](../type-aliases/FormOptimizer.md)[]\>

Defined in: [optimizers/types.ts:36](https://github.com/pradeepmouli/zod-to-form/blob/07a3b2a90ac2fca44ff29a544e6b0db537316968/packages/core/src/optimizers/types.ts#L36)

***

### schemaLite

> **schemaLite**: [`SchemaLiteCollector`](SchemaLiteCollector.md)

Defined in: [optimizers/types.ts:37](https://github.com/pradeepmouli/zod-to-form/blob/07a3b2a90ac2fca44ff29a544e6b0db537316968/packages/core/src/optimizers/types.ts#L37)
