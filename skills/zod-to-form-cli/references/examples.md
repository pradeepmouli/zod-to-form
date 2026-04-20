# Examples

```bash
zod-to-form generate --config ./z2f.config.ts --schema ./src/schema.ts --export userSchema
```

```bash
zod-to-form init
```

Alias: `z2f`.

### Command

`zod-to-form generate`

Required options:

- `--config <path>`: path to config file (`.json` or `.ts`) that drives generation
- `--schema <path>`: path to schema module

Optional options:

- `--export <name>`: named export containing the schema (optional when `config.types` or `config.include` are set)
- `--mode <mode>`: `submit | auto-save` (default `submit`)
- `--out <path>`: output directory or `.tsx` file path
- `--name <componentName>`: generated component name override
- `--ui <preset>`: `shadcn | html` (default `shadcn`)
- `--dry-run`: print generated code to stdout without writing files
- `--server-action`: generate Next.js server action next to form output
- `--watch`: watch schema file and regenerate on changes

Generation selection/overwrite is now config-driven:

- `overwrite`: overwrite existing output files
- `types`: explicit list of schema exports to generate (used when `--export` is omitted)
- `include`: wildcard include patterns for schema export names
- `exclude`: wildcard exclude patterns for schema export names

When generating with `--config`, component mapping and generation controls come from the same file.
Default config discovery order (used by runtime helpers / existing workflows) is still:

1. `z2f.config.ts`
2. `component-config.ts`
3. `z2f.config.js`
4. `component-config.js`
5. `z2f.config.json`
6. `component-config.json`

### Command

`zod-to-form init`

Creates `z2f.config.ts` using sensible defaults and introspection of shadcn `components.json` when available.

Optional options:

- `--out <path>`: output file or directory (default `z2f.config.ts`)
- `--components <modulePath>`: module path assigned to `components` in generated config (overrides inference)
- `--schemas <path>`: path to schema file or directory for autodiscovery
- `--force`: overwrite existing config file
- `--dry-run`: print generated config and skip file writes
- `--verbose`: print detailed diagnostics for each step

Output behavior:

- default: concise progress + final summary
- `--verbose`: adds detailed diagnostics (detected config source/aliases)