[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/vite](../README.md) / VariantConfigs

# Type Alias: VariantConfigs

> **VariantConfigs** = `Record`\<`string`, `Partial`\<[`CodegenConfig`](../../codegen/type-aliases/CodegenConfig.md)\>\>

Defined in: [packages/vite/src/types.ts:30](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/vite/src/types.ts#L30)

Variant overrides keyed by the `?z2f=<name>` query value.
Per-variant settings merge on top of the global `CodegenConfig`.

## Use When

- You need different generated form styles for the same schema (e.g. `?z2f=mobile` vs `?z2f=desktop`)
- You want variant-specific UI presets or component overrides without separate schema files

## Avoid When

- You only have a single form variant — omit this field entirely and use the global config

## Config
