[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/vite](../README.md) / GenerationTarget

# Type Alias: GenerationTarget

> **GenerationTarget** = `GenerationTargetBase` & `object` \| `GenerationTargetBase` & `object`

Defined in: [packages/vite/src/types.ts:183](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/vite/src/types.ts#L183)

A single (schema, variant, config) triple that produces exactly one
generated form. The cache key space.

Discriminated on `sourceKind`: query-mode targets carry a user-named
variant (or empty string for the default), while generate-mode targets
use the reserved `__generate_<n>` prefix. Encoding the prefix in the
type system prevents accidentally crossing the streams.
