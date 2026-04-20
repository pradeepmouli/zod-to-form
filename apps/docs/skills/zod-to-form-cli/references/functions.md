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
Identity helper that returns its argument typed as `ZodFormsConfig`.

Merges preset component overrides (e.g. shadcn) into `config.components.overrides`
so that user-supplied overrides layer on top of the preset defaults. Use this in
your `z2f.config.ts` to get full TypeScript inference and IDE autocompletion.

Identity helper that returns its argument typed as ZodFormsConfig.
Applies preset component overrides (e.g., shadcn) — preset defaults
merge with user overrides, user wins on conflicts. However, the props
dict is replaced entirely, not merged.
```ts
defineConfig<TComponents, TSchemas>(config: ZodFormsConfig<TComponents, TSchemas>): ZodFormsConfig<TComponents, TSchemas>
```
**Parameters:**
- `config: ZodFormsConfig<TComponents, TSchemas>` — The raw configuration object.
**Returns:** `ZodFormsConfig<TComponents, TSchemas>` — The same configuration with preset overrides applied.
```ts
export default defineConfig({
  components: { source: '@/components/ui', preset: 'shadcn' },
});
```

### `validateConfig`
Validates an unknown value as a `ZodFormsConfig` at runtime.

Parses `value` using the internal Zod config schema and throws a descriptive
error if validation fails. Use this when loading config from untrusted sources
such as JSON files or dynamic `import()` calls.
```ts
validateConfig(value: unknown, source?: string): ZodFormsConfig<Record<string, unknown>>
```
**Parameters:**
- `value: unknown` — The value to validate.
- `source: string` (optional) — Human-readable label for error messages (defaults to `'config'`).
**Returns:** `ZodFormsConfig<Record<string, unknown>>` — The validated configuration cast to `ZodFormsConfig`.
**Throws:** If `value` does not conform to the config schema.
