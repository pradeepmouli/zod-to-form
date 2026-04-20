[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/cli](../README.md) / runGenerate

# Function: runGenerate()

> **runGenerate**(`options`): `Promise`\<\{ `actionCode?`: `string`; `actionPath?`: `string`; `code`: `string`; `outputPath`: `string`; `wroteFile`: `boolean`; \}\>

Defined in: [cli/src/index.ts:168](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/cli/src/index.ts#L168)

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

## Never

- NEVER treat `result.code` as the on-disk file content when `overwrite` is false — if
  the output file already exists, `runGenerate` returns `wroteFile: false` and the
  existing file is unchanged without throwing; FIX: check `result.wroteFile` before
  assuming the file was updated, or set `defaults.overwrite: true` explicitly
- NEVER use `--watch` mode on schemas that re-export types from other modules — the
  watcher tracks only the top-level file, so a change in an imported schema file
  does not trigger regeneration; FIX: run `runGenerate` manually from a parent file
  watcher (e.g. chokidar) that covers the full import tree

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
