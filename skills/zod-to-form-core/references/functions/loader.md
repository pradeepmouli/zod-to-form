# Functions

## Loader

### `loadSchema`
Load a single named Zod schema export from a TypeScript or JavaScript
file. Throws with a clear message when the file can't be read, the
export doesn't exist, or the export isn't a Zod schema.
```ts
loadSchema(schemaPath: string, exportName: string): Promise<unknown>
```
**Parameters:**
- `schemaPath: string` — Absolute or relative path to the schema file to load.
- `exportName: string` — The named export to extract from the loaded module (e.g. `'UserSchema'`).
**Returns:** `Promise<unknown>` — The Zod schema instance for the named export.
**Throws:** When the file cannot be read, the export is missing, or the export is not a Zod schema.

### `loadSchemaModule`
Load a schema file and return the entire module namespace, leaving the
choice of which export to use to the caller. The Vite plugin uses this
variant so it can run its own export-disambiguation pass.
```ts
loadSchemaModule(schemaPath: string): Promise<Record<string, unknown>>
```
**Parameters:**
- `schemaPath: string` — Absolute or relative path to the schema file to load.
**Returns:** `Promise<Record<string, unknown>>` — All named exports from the module as a `Record<string, unknown>`.
**Throws:** When the file cannot be read or evaluated.

### `resolveSchemaExportNames`
Return the sorted list of named Zod schema exports in a schema file.
Used by the CLI's `--list-exports` flag and the Vite plugin's
ambiguous-export error message.
```ts
resolveSchemaExportNames(schemaPath: string): Promise<string[]>
```
**Parameters:**
- `schemaPath: string` — Absolute or relative path to the schema file to inspect.
**Returns:** `Promise<string[]>` — Alphabetically sorted array of export names that are Zod schemas.

### `loadConfig`
Load and validate a component config file (`z2f.config.ts` or similar).
Returns the normalized form ready to feed into codegen.
```ts
loadConfig(configPath: string): Promise<ZodFormsConfig<Record<string, unknown>>>
```
**Parameters:**
- `configPath: string` — Absolute or relative path to the config file to load.
**Returns:** `Promise<ZodFormsConfig<Record<string, unknown>>>` — The validated and normalized `ZodFormsConfig` from the config file's default export.
**Throws:** When the file cannot be read, or the exported config fails `validateConfig`.

### `resolveDefaultConfigPath`
Walk the standard config-file naming candidates in `cwd` and return the
first that exists. Used by the CLI's auto-discovery and (eventually) by
the Vite plugin's config watcher.
```ts
resolveDefaultConfigPath(cwd: string): Promise<string | undefined>
```
**Parameters:**
- `cwd: string` — The directory to search for a config file.
**Returns:** `Promise<string | undefined>` — The absolute path of the first config file found, or `undefined` if none exists.

### `loadDefaultConfig`
Load and validate the default config file from `cwd` by auto-discovering
standard naming candidates (`z2f.config.ts`, `component-config.ts`, etc.).
Returns `undefined` when no config file is found.
```ts
loadDefaultConfig(cwd: string): Promise<ZodFormsConfig<Record<string, unknown>> | undefined>
```
**Parameters:**
- `cwd: string` — The directory to search for a config file.
**Returns:** `Promise<ZodFormsConfig<Record<string, unknown>> | undefined>` — The validated and normalized config, or `undefined` if none was found.
