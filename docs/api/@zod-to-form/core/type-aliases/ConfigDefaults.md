[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / ConfigDefaults

# Type Alias: ConfigDefaults

> **ConfigDefaults** = `object`

Defined in: [config.ts:90](https://github.com/pradeepmouli/zod-to-form/blob/80855062565e7587830d7555ce1551eb20fdbb74/packages/core/src/config.ts#L90)

Default generation settings applied to all schemas unless overridden per-schema.
These map directly to CLI flag defaults and to the `defaults` block in `z2f.config.ts`.

## Properties

### formProvider?

> `optional` **formProvider?**: `boolean`

Defined in: [config.ts:97](https://github.com/pradeepmouli/zod-to-form/blob/80855062565e7587830d7555ce1551eb20fdbb74/packages/core/src/config.ts#L97)

Wrap generated form in <FormProvider {...form}>

***

### mode?

> `optional` **mode?**: `"submit"` \| `"auto-save"`

Defined in: [config.ts:91](https://github.com/pradeepmouli/zod-to-form/blob/80855062565e7587830d7555ce1551eb20fdbb74/packages/core/src/config.ts#L91)

***

### optimization?

> `optional` **optimization?**: [`OptimizationConfig`](OptimizationConfig.md)

Defined in: [config.ts:99](https://github.com/pradeepmouli/zod-to-form/blob/80855062565e7587830d7555ce1551eb20fdbb74/packages/core/src/config.ts#L99)

Validation optimization configuration

***

### out?

> `optional` **out?**: `string`

Defined in: [config.ts:93](https://github.com/pradeepmouli/zod-to-form/blob/80855062565e7587830d7555ce1551eb20fdbb74/packages/core/src/config.ts#L93)

***

### overwrite?

> `optional` **overwrite?**: `boolean`

Defined in: [config.ts:94](https://github.com/pradeepmouli/zod-to-form/blob/80855062565e7587830d7555ce1551eb20fdbb74/packages/core/src/config.ts#L94)

***

### serverAction?

> `optional` **serverAction?**: `boolean`

Defined in: [config.ts:95](https://github.com/pradeepmouli/zod-to-form/blob/80855062565e7587830d7555ce1551eb20fdbb74/packages/core/src/config.ts#L95)

***

### ui?

> `optional` **ui?**: `"shadcn"` \| `"html"`

Defined in: [config.ts:92](https://github.com/pradeepmouli/zod-to-form/blob/80855062565e7587830d7555ce1551eb20fdbb74/packages/core/src/config.ts#L92)
