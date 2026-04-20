[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/codegen](../README.md) / generateFormComponent

# Function: generateFormComponent()

> **generateFormComponent**(`fields`, `config`): `string`

Defined in: [codegen/src/generate.ts:657](https://github.com/pradeepmouli/zod-to-form/blob/80855062565e7587830d7555ce1551eb20fdbb74/packages/codegen/src/generate.ts#L657)

Generate a React form component as a TypeScript string from `FormField[]`.

Produces a `.tsx` file string containing imports, the form component, and
(when `config.mode === 'auto-save'`) the `FormProvider` wrapper. The output
is deterministic for a given `(fields, config)` pair — same inputs always
produce the same output string.

## Parameters

### fields

[`FormField`](../../core/interfaces/FormField.md)[]

Intermediate `FormField[]` from `walkSchema`.

### config

[`CodegenConfig`](../type-aliases/CodegenConfig.md)

Resolved codegen config (output path, component names, UI preset, etc.).

## Returns

`string`

The generated `.tsx` source as a string. Not yet written to disk.

## Example

```ts
const fields = walkSchema(schema, { formRegistry });
const code = generateFormComponent(fields, {
  schemaPath: './signup.schema.ts',
  exportName: 'signupSchema',
  outputPath: './SignupForm.tsx',
  componentName: 'SignupForm',
  mode: 'submit',
  ui: 'shadcn',
});
await writeFile('./SignupForm.tsx', code, 'utf8');
```

## Use When

- Building a custom codegen pipeline that assembles `FormField[]` and needs the TSX string
- Writing codegen tests that verify output structure without spawning a CLI process

## Avoid When

- You want file-writing behavior — use `runGenerate()` from `@zod-to-form/cli` instead
- You are using the Vite plugin — `compileTarget` wraps this and handles esbuild transformation

## Throws

Never — this function is purely a string transformer; I/O errors from writing
  the result to disk are the caller's responsibility.

## Pitfalls

- NEVER call `generateFormComponent` with a stale `fields` array from a previous schema
  version — there is no cache invalidation; callers must re-run `walkSchema` on schema change
- NEVER use the returned string as a module cache key — it is not content-addressed;
  use `configHash` from `@zod-to-form/core` on the config object instead
