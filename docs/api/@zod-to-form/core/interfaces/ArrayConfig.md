[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / ArrayConfig

# Interface: ArrayConfig

Defined in: [types.ts:169](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/types.ts#L169)

Configuration for collection-style field add/remove buttons.
Applied via FormMeta registry on schemas rendered as `ArrayField`:
`z.array()`, `z.set()`, and `z.map()`.

## Properties

### addLabel?

> `optional` **addLabel?**: `string`

Defined in: [types.ts:171](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/types.ts#L171)

Label for the "add item" button (default: "+ Add")

***

### removeLabel?

> `optional` **removeLabel?**: `string`

Defined in: [types.ts:173](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/types.ts#L173)

Label for the "remove item" button (default: "− Remove")
