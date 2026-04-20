[**Documentation v0.2.0**](../../../../README.md)

***

[Documentation](../../../../README.md) / [@zod-to-form/core](../../README.md) / [processors](../README.md) / processLazy

# Function: processLazy()

> **processLazy**(`schema`, `ctx`, `field`, `params`): `void`

Defined in: [processors/wrappers.ts:176](https://github.com/pradeepmouli/zod-to-form/blob/4dbc81702f0a9a2a7fa8f750c3efdc32bb88ac3b/packages/core/src/processors/wrappers.ts#L176)

Process `z.lazy()` — evaluates the lazy getter and delegates to the inner schema's processor.
Guards against infinite recursion using `ctx.currentDepth` / `ctx.maxDepth` and the `seen` WeakSet.
Renders as a plain text `Input` when the depth limit is reached or the schema is cyclic.

## Parameters

### schema

`$ZodLazy`

The `$ZodLazy` schema whose getter is evaluated on first encounter.

### ctx

[`FormProcessorContext`](../../interfaces/FormProcessorContext.md)

The walker context providing depth tracking, cycle detection, and processor dispatch.

### field

[`FormField`](../../interfaces/FormField.md)

The base FormField to mutate in-place.

### params

[`ProcessParams`](../../interfaces/ProcessParams.md)

Parent path metadata passed through to the inner processor.

## Returns

`void`
