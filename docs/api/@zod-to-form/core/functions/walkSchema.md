[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / walkSchema

# Function: walkSchema()

## Call Signature

> **walkSchema**(`schema`, `options`): [`WalkResult`](../interfaces/WalkResult.md)

Defined in: [walker.ts:294](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/walker.ts#L294)

Walk a Zod schema and produce a FormField[] tree.
When optimization option is set, returns WalkResult with fields + schemaLite.

### Parameters

#### schema

`$ZodType`

The Zod schema to walk. Must be a `z.object()` (or pipe-wrapped object) at the root.

#### options

[`WalkOptions`](../interfaces/WalkOptions.md) & `object`

Optional walk options including formRegistry, custom processors, maxDepth, and optimization config.

### Returns

[`WalkResult`](../interfaces/WalkResult.md)

A sorted `FormField[]` array, or a `WalkResult` with `fields` + `schemaLite` when optimization is requested.

### Remarks

Recursively walks a Zod schema tree and produces a FormField[] intermediate
representation. Dispatches by def.type to a processor registry. Each processor
extracts structure and constraints from _zod.def + _zod.bag.
Uses WeakSet per top-level field for cycle detection — reused schema instances
(e.g., z.string() in two fields) don't trigger false positives.
The walker is STATELESS — call it repeatedly with different formRegistry values.

### Use When

- You need direct schema-to-fields conversion in runtime contexts
- You're building a custom codegen pipeline on top of FormField[]

### Avoid When

- You just want generated components — use the CLI instead
- Your schema is not z.object() at the root level

### Never

- NEVER pass a non-object schema at the root — throws immediately
- NEVER bypass the processor registry for custom types — extend via options.processors
- NEVER skip normalizeFormValues() before schema.safeParse() — empty strings from HTML inputs fail optional field validation

## Call Signature

> **walkSchema**(`schema`, `options?`): [`FormField`](../interfaces/FormField.md)[]

Defined in: [walker.ts:298](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/walker.ts#L298)

Walk a Zod schema and produce a FormField[] tree.
When optimization option is set, returns WalkResult with fields + schemaLite.

### Parameters

#### schema

`$ZodType`

The Zod schema to walk. Must be a `z.object()` (or pipe-wrapped object) at the root.

#### options?

[`WalkOptions`](../interfaces/WalkOptions.md)

Optional walk options including formRegistry, custom processors, maxDepth, and optimization config.

### Returns

[`FormField`](../interfaces/FormField.md)[]

A sorted `FormField[]` array, or a `WalkResult` with `fields` + `schemaLite` when optimization is requested.

### Remarks

Recursively walks a Zod schema tree and produces a FormField[] intermediate
representation. Dispatches by def.type to a processor registry. Each processor
extracts structure and constraints from _zod.def + _zod.bag.
Uses WeakSet per top-level field for cycle detection — reused schema instances
(e.g., z.string() in two fields) don't trigger false positives.
The walker is STATELESS — call it repeatedly with different formRegistry values.

### Use When

- You need direct schema-to-fields conversion in runtime contexts
- You're building a custom codegen pipeline on top of FormField[]

### Avoid When

- You just want generated components — use the CLI instead
- Your schema is not z.object() at the root level

### Never

- NEVER pass a non-object schema at the root — throws immediately
- NEVER bypass the processor registry for custom types — extend via options.processors
- NEVER skip normalizeFormValues() before schema.safeParse() — empty strings from HTML inputs fail optional field validation
