[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / ConfigDefaults

# Type Alias: ConfigDefaults

> **ConfigDefaults** = `object`

Defined in: config.ts:92

Default generation settings applied to all schemas unless overridden per-schema.
These map directly to CLI flag defaults and to the `defaults` block in `z2f.config.ts`.

## Properties

### formProvider?

> `optional` **formProvider?**: `boolean`

Defined in: config.ts:99

Wrap generated form in <FormProvider {...form}>

***

### mode?

> `optional` **mode?**: `"submit"` \| `"auto-save"`

Defined in: config.ts:93

***

### optimization?

> `optional` **optimization?**: [`OptimizationConfig`](OptimizationConfig.md)

Defined in: config.ts:101

Validation optimization configuration

***

### out?

> `optional` **out?**: `string`

Defined in: config.ts:95

***

### overwrite?

> `optional` **overwrite?**: `boolean`

Defined in: config.ts:96

***

### serverAction?

> `optional` **serverAction?**: `boolean`

Defined in: config.ts:97

***

### ui?

> `optional` **ui?**: `"shadcn"` \| `"html"`

Defined in: config.ts:94
