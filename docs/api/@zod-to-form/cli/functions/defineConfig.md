[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/cli](../README.md) / defineConfig

# Function: defineConfig()

> **defineConfig**\<`TComponents`, `TSchemas`\>(`config`): [`ZodFormsConfig`](../type-aliases/ZodFormsConfig.md)\<`TComponents`, `TSchemas`\>

Defined in: core/dist/config.d.ts:129

Identity helper that returns its argument typed as `ZodFormsConfig`.

Merges preset component overrides (e.g. shadcn) into `config.components.overrides`
so that user-supplied overrides layer on top of the preset defaults. Use this in
your `z2f.config.ts` to get full TypeScript inference and IDE autocompletion.

## Type Parameters

### TComponents

`TComponents` *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>

### TSchemas

`TSchemas` *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>

## Parameters

### config

[`ZodFormsConfig`](../type-aliases/ZodFormsConfig.md)\<`TComponents`, `TSchemas`\>

The raw configuration object.

## Returns

[`ZodFormsConfig`](../type-aliases/ZodFormsConfig.md)\<`TComponents`, `TSchemas`\>

The same configuration with preset overrides applied.

## Example

```ts
export default defineConfig({
  components: { source: '@/components/ui', preset: 'shadcn' },
});
```
