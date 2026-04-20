[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / FormOptimizerContext

# Interface: FormOptimizerContext

Defined in: [optimizers/types.ts:51](https://github.com/pradeepmouli/zod-to-form/blob/5f49fae050176ccfdb49bf394bb00a3229c02f4a/packages/core/src/optimizers/types.ts#L51)

Context shared across all optimizers during a `walkSchema` run.
Carries the optimizer registry, the SchemaLite collector, the optimization level,
and the current collector's base path for building nested lite schemas.

## Properties

### collectorBasePath

> **collectorBasePath**: `string`

Defined in: [optimizers/types.ts:59](https://github.com/pradeepmouli/zod-to-form/blob/5f49fae050176ccfdb49bf394bb00a3229c02f4a/packages/core/src/optimizers/types.ts#L59)

Dot-path prefix of the current collector's scope (empty string at root)

***

### level

> **level**: `1` \| `2` \| `3`

Defined in: [optimizers/types.ts:57](https://github.com/pradeepmouli/zod-to-form/blob/5f49fae050176ccfdb49bf394bb00a3229c02f4a/packages/core/src/optimizers/types.ts#L57)

Optimization level: 1 = decompose per-field, 2 = native rules, 3 = cross-field

***

### optimizers

> **optimizers**: `Record`\<`string`, [`FormOptimizer`](../type-aliases/FormOptimizer.md)[]\>

Defined in: [optimizers/types.ts:53](https://github.com/pradeepmouli/zod-to-form/blob/5f49fae050176ccfdb49bf394bb00a3229c02f4a/packages/core/src/optimizers/types.ts#L53)

The registered optimizer chains, keyed by Zod def.type

***

### schemaLite

> **schemaLite**: [`SchemaLiteCollector`](SchemaLiteCollector.md)

Defined in: [optimizers/types.ts:55](https://github.com/pradeepmouli/zod-to-form/blob/5f49fae050176ccfdb49bf394bb00a3229c02f4a/packages/core/src/optimizers/types.ts#L55)

Mutable collector that accumulates checks and fallthrough fields for the lite schema
