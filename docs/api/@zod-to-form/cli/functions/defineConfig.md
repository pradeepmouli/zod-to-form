[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/cli](../README.md) / defineConfig

# Function: defineConfig()

> **defineConfig**\<`TComponents`, `TSchemas`\>(`config`): [`ZodFormsConfig`](../type-aliases/ZodFormsConfig.md)\<`TComponents`, `TSchemas`\>

Defined in: core/dist/config.d.ts:161

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

## Remarks

Identity helper that returns its argument typed as ZodFormsConfig.
Applies preset component overrides (e.g., shadcn) — preset defaults
merge with user overrides, user wins on conflicts. However, the props
dict is replaced entirely, not merged.

## Use When

- You want TypeScript inference and IDE autocompletion for config — `defineConfig` is the typed entry point; bare object literals lose generic inference on `components.overrides`

## Avoid When

- Runtime-only usage where you pass config inline to walkSchema — `defineConfig` is a no-op at runtime without a preset; skip it when config comes from JSON or dynamic import

## Never

- NEVER assume preset props merge with your props — the entire props dict is replaced. If you set component props, you must include ALL props including the ones from the preset

## Example

```ts
export default defineConfig({
  components: { source: '@/components/ui', preset: 'shadcn' },
});
```
