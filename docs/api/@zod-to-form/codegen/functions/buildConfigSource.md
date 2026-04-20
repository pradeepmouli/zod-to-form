[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/codegen](../README.md) / buildConfigSource

# Function: buildConfigSource()

> **buildConfigSource**(`opts`): `string`

Defined in: [codegen/src/config-template.ts:59](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/codegen/src/config-template.ts#L59)

Generate a `z2f.config.ts` starter file as a source string.
Produces a `defineConfig(...)` call with components, defaults, include/exclude,
optional fields, and schemas blocks based on the provided options.

## Parameters

### opts

[`ConfigTemplateOptions`](../type-aliases/ConfigTemplateOptions.md)

Template options controlling the generated config structure.

## Returns

`string`

The complete config file source as a string, ready to write to disk.

## Example

```ts
const source = buildConfigSource({ componentSource: './components/ui', preset: 'shadcn' });
await fs.writeFile('z2f.config.ts', source);
```

## Remarks

The generated file uses TypeScript generics for full type inference:
`defineConfig<typeof Components, typeof ZodSchemas>(...)`.
Preset-specific overrides (e.g. `SHADCN_OVERRIDES`) are spread into the overrides block.
