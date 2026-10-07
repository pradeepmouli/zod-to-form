[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / GhostRow

# Interface: GhostRow

Defined in: types.ts:209

A renderable row that lives inside an array section without participating
in form state. Used for inherited rows, computed defaults, or read-only
informational entries.

## Properties

### id

> **id**: `string`

Defined in: types.ts:218

Stable identifier within a `before` or `after` group. The renderer
combines this with the group name to form the React key
(`ghost-before-${id}` / `ghost-after-${id}`), so the same `id` may
safely appear in both groups without collision. Duplicates *within*
a single group emit a one-time development warning. Required so
that reorders of real rows don't remount ghost rows.

***

### render

> **render**: (`ctx`) => `unknown`

Defined in: types.ts:220

Render function. Receives positional context relative to other ghost rows.

#### Parameters

##### ctx

[`GhostRowContext`](GhostRowContext.md)

#### Returns

`unknown`
