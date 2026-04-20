[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/vite](../README.md) / Z2FViteConfig

# Type Alias: Z2FViteConfig

> **Z2FViteConfig** = `Omit`\<[`CodegenConfig`](../../codegen/type-aliases/CodegenConfig.md), `"exportName"`\> & `object`

Defined in: [packages/vite/src/types.ts:63](https://github.com/pradeepmouli/zod-to-form/blob/a4dd58978c639c7b27f819dd2141da3ec858bcf3/packages/vite/src/types.ts#L63)

The full config the Vite plugin operates on: a base `CodegenConfig`
plus optional per-variant overrides.

`exportName` is relaxed to optional at the plugin boundary — the plugin
auto-detects a single Zod schema export when the user omits it, and
throws `Z2F_VITE_AMBIGUOUS_EXPORT` on ambiguity. The codegen package
still requires it, and the plugin promotes the resolved name before
invoking codegen.

## Type Declaration

### exportName?

> `optional` **exportName?**: `string`

### variants?

> `optional` **variants?**: [`VariantConfigs`](VariantConfigs.md)

Per-variant overrides. Keyed by `?z2f=<name>` query value.

## Remarks

Place this in `z2f.config.ts` as a default export. The plugin auto-discovers
that file from the Vite root (searches `z2f.config.{ts,mts,js,mjs}` in order).
Use `defineConfig` from `@zod-to-form/core` for type-safe config authoring.

## Use When

- Centralizing form generation options for all `?z2f` imports in a project
- Applying a consistent UI preset (shadcn/html) and field overrides across forms

## Avoid When

- You only need a single one-off form — pass `configOverride` to `z2fVite()` instead

## Pitfalls

- NEVER place `z2f.config.ts` outside the Vite root — the auto-discovery only searches
  `resolvedConfig.root` and will silently fall back to defaults if the file is not found
- NEVER export an async function as the config default — only plain objects are supported;
  async evaluation is not handled by `ssrLoadModule`

## Config
