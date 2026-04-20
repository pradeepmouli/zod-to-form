[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/cli](../README.md) / runGenerate

# Function: runGenerate()

> **runGenerate**(`options`): `Promise`\<\{ `actionCode?`: `string`; `actionPath?`: `string`; `code`: `string`; `outputPath`: `string`; `wroteFile`: `boolean`; \}\>

Defined in: [cli/src/index.ts:168](https://github.com/pradeepmouli/zod-to-form/blob/7bf19cd9fc0937e42a238b2be647353aea0a2a27/packages/cli/src/index.ts#L168)

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

## Use When

- You need programmatic codegen from a Node.js script or build tool (not just the CLI)
- You are writing tests for the code generation pipeline end-to-end
- You need `dryRun` output for preview/diffing without touching the filesystem

## Avoid When

- Interactive use — run `npx zod-to-form generate` (via `createProgram()`) instead
- Browser environments — this function uses Node.js `fs` and `path` APIs

## Pitfalls

- NEVER call with a schema that already has a generated output file when
  `defaults.overwrite` is false — the function silently skips writing and returns
  `wroteFile: false` with no error; this is intentional but easy to miss in scripts
- NEVER rely on generated file content after re-running `runGenerate` without
  checking `wroteFile` — if the file already exists and overwrite is disabled,
  the on-disk file is NOT updated even though `code` is returned
- NEVER use `--watch` mode on schema files that have indirect imports — the watcher
  only tracks the top-level schema file, not its transitive dependencies

## Throws

When the schema file cannot be loaded, the export is missing, or the export is not a Zod schema.

## Throws

When the output file exists and cannot be read (permissions or unexpected I/O error).

## Example

```ts
const result = await runGenerate({
  config: './z2f.config.ts',
  schema: './src/schemas/user.ts',
  export: 'UserSchema',
  out: './src/forms',
});
if (result.wroteFile) {
  console.log('Generated:', result.outputPath);
}
```
