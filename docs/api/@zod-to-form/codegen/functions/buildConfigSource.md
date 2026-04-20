[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/codegen](../README.md) / buildConfigSource

# Function: buildConfigSource()

> **buildConfigSource**(`opts`): `string`

Defined in: [codegen/src/config-template.ts:59](https://github.com/pradeepmouli/zod-to-form/blob/7bf19cd9fc0937e42a238b2be647353aea0a2a27/packages/codegen/src/config-template.ts#L59)

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
