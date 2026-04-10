[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/cli](../README.md) / runGenerate

# Function: runGenerate()

> **runGenerate**(`options`): `Promise`\<\{ `actionCode?`: `string`; `actionPath?`: `string`; `code`: `string`; `outputPath`: `string`; `wroteFile`: `boolean`; \}\>

Defined in: [cli/src/index.ts:101](https://github.com/pradeepmouli/zod-to-form/blob/f52a0ed6020c1b7e4faaba6683436bbe29928d05/packages/cli/src/index.ts#L101)

Executes the code generation pipeline for a single Zod schema export.

Loads the config and schema, resolves field overrides, walks the Zod type
tree to produce an intermediate `FormField[]` representation, and writes a
React form component (plus optional server action and schema-lite files) to
disk. When `options.dryRun` is true the generated code is printed to stdout
instead of being written.

## Parameters

### options

`GenerateOptions`

Generation options including paths for config, schema, and output.

## Returns

`Promise`\<\{ `actionCode?`: `string`; `actionPath?`: `string`; `code`: `string`; `outputPath`: `string`; `wroteFile`: `boolean`; \}\>

Resolved output paths and the generated code string.
