[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / ArrayConfig

# Interface: ArrayConfig

Defined in: types.ts:171

Configuration for collection-style field add/remove buttons.
Applied via FormMeta registry on schemas rendered as `ArrayField`:
`z.array()`, `z.set()`, and `z.map()`.

## Properties

### addLabel?

> `optional` **addLabel?**: `string`

Defined in: types.ts:173

Label for the "add item" button (default: "+ Add")

***

### after?

> `optional` **after?**: [`GhostRow`](GhostRow.md)[]

Defined in: types.ts:199

Non-form rows rendered after the last form-driven row. Same semantics as
`before`.

***

### before?

> `optional` **before?**: [`GhostRow`](GhostRow.md)[]

Defined in: types.ts:194

Non-form rows rendered before the first form-driven row. Each entry is
a self-contained renderable; the library never inspects its contents.
Ghost rows do not participate in form state, validation, or submission.

***

### onReorder?

> `optional` **onReorder?**: (`from`, `to`) => `void`

Defined in: types.ts:188

Optional callback fired after a reorder completes. Adopters who hold a
parallel copy of the array (e.g. a graph store) mirror the change here.
`from` and `to` are zero-based indices into the form-driven array
(excluding ghost rows).

#### Parameters

##### from

`number`

##### to

`number`

#### Returns

`void`

***

### removeLabel?

> `optional` **removeLabel?**: `string`

Defined in: types.ts:175

Label for the "remove item" button (default: "− Remove")

***

### reorder?

> `optional` **reorder?**: `boolean`

Defined in: types.ts:181

Enable per-row reorder affordance. When true, the renderer mounts a
registered `ArrayReorderHandle` component per row and wires it to
`useFieldArray.move()`. Off by default — existing arrays are unchanged.
