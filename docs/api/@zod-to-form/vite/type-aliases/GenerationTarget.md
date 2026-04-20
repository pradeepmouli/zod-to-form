[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/vite](../README.md) / GenerationTarget

# Type Alias: GenerationTarget

> **GenerationTarget** = `GenerationTargetBase` & `object` \| `GenerationTargetBase` & `object`

Defined in: [packages/vite/src/types.ts:183](https://github.com/pradeepmouli/zod-to-form/blob/80855062565e7587830d7555ce1551eb20fdbb74/packages/vite/src/types.ts#L183)

A single (schema, variant, config) triple that produces exactly one
generated form. The cache key space.

Discriminated on `sourceKind`: query-mode targets carry a user-named
variant (or empty string for the default), while generate-mode targets
use the reserved `__generate_<n>` prefix. Encoding the prefix in the
type system prevents accidentally crossing the streams.
