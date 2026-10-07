# Functions

## CLI

### `runGenerate`
Executes the code generation pipeline for a single Zod schema export.

Loads the config and schema, resolves field overrides, walks the Zod type
tree to produce an intermediate `FormField[]` representation, and writes a
React form component (plus optional server action and schema-lite files) to
disk. When `options.dryRun` is true the generated code is printed to stdout
instead of being written.
```ts
runGenerate(options: GenerateOptions): Promise<{ outputPath: string; code: string; wroteFile: boolean; actionPath?: string; actionCode?: string }>
```
**Parameters:**
- `options: GenerateOptions` — Generation options including paths for config, schema, and output.
**Returns:** `Promise<{ outputPath: string; code: string; wroteFile: boolean; actionPath?: string; actionCode?: string }>` — Resolved output paths and the generated code string.
**Throws:** When the output file exists and cannot be read (permissions or unexpected I/O error).
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

### `createProgram`
Creates the Commander.js CLI program for `zod-to-form`.

Registers the `generate` and `init` sub-commands with all their options and
action handlers. Consumers can pass the returned `Command` to `.parseAsync()`
to run the CLI, or use it for testing without spawning a child process.
```ts
createProgram(): Command
```
**Returns:** `Command` — A fully configured `Command` instance ready to be parsed.
```ts
const program = createProgram();
await program.parseAsync(['node', 'z2f', 'generate',
  '--config', 'z2f.config.ts',
  '--schema', 'src/schemas/user.ts',
  '--export', 'UserSchema',
]);
```

## Configuration

### `defineConfig`
Typed identity helper for canonical authored configuration.
Presets are expanded by resolveFormConfig after variants and adapter overrides
have merged, so changing presets does not retain injected settings.
```ts
defineConfig<TComponents, TSchemas>(config: ZodFormsConfig<TComponents, TSchemas>): ZodFormsConfig<TComponents, TSchemas>
```
**Parameters:**
- `config: ZodFormsConfig<TComponents, TSchemas>` — Authored configuration.
**Returns:** `ZodFormsConfig<TComponents, TSchemas>` — The same object with generic inference retained.

### `validateConfig`
Validate canonical authored configuration without expanding presets.
Unknown root keys are rejected; known nested properties retain validation,
and field metadata supports application extensions.
```ts
validateConfig(value: unknown, source?: string): ZodFormsConfig<Record<string, unknown>>
```
**Parameters:**
- `value: unknown`
- `source: string` (optional)
**Returns:** `ZodFormsConfig<Record<string, unknown>>`
**Throws:** Descriptive configuration error for invalid input.
