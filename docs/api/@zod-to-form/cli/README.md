[**Documentation v0.2.0**](../../README.md)

***

[Documentation](../../README.md) / @zod-to-form/cli

<p align="center">
  <img src="https://raw.githubusercontent.com/pradeepmouli/zod-to-form/master/attached_assets/banner.svg" alt="zod-to-form banner" />
</p>

# @zod-to-form/cli

Build-time code generator for Zod v4 form components.

`@zod-to-form/cli` loads a Zod schema module, walks it via `@zod-to-form/core`, and generates a TSX form component. It can also watch files and generate a paired Next.js server action.

## Installation

```bash
pnpm add -D @zod-to-form/cli zod
```

## Requirements

- Node.js >= 20
- Zod v4

## CLI Usage

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

## Examples

Generate to default output (`<DerivedName>Form.tsx`):

```bash
zod-to-form generate --schema ./src/user.schema.ts --export userSchema
```

Generate to specific directory with custom component name:

```bash
zod-to-form generate \
  --config ./z2f.config.ts \
  --schema ./src/user.schema.ts \
  --export userSchema \
  --out ./src/forms \
  --name UserProfile
```

Generate in auto-save mode with server action:

```bash
zod-to-form generate \
  --config ./z2f.config.ts \
  --schema ./src/user.schema.ts \
  --export userSchema \
  --mode auto-save \
  --server-action
```

Dry run to inspect generated output:

```bash
zod-to-form generate --config ./z2f.config.ts --schema ./src/user.schema.ts --export userSchema --dry-run
```

Initialize config with verbose diagnostics:

```bash
zod-to-form init --verbose
```

Initialize config with explicit components module path:

```bash
zod-to-form init --components ../../src/components/zod-form-components
```

## Type-Safe Component Config

The package exports helpers to define and validate component config.

### `defineConfig(...)`

`defineConfig` (re-exported from `@zod-to-form/core`) gives type-safe config construction with preset merging.

```ts
import { defineConfig } from '@zod-to-form/cli';

export default defineConfig({
  components: {
    source: '@/components/form-components',
    preset: 'shadcn',
    overrides: {
      TextareaInput: { controlled: false },
    },
  },
  types: ['userSchema'],
  include: ['*Schema'],
  exclude: ['Internal*'],
  defaults: {
    overwrite: true,
  },
  formPrimitives: {
    field: 'Field',
    label: 'FieldLabel',
    control: 'FieldControl',
  },
  fields: {
    'profile.bio': { component: 'TextareaInput', props: { rows: 5 } },
    'tags[].label': { component: 'TextInput' },
  },
});
```

`formPrimitives` is optional. When provided, generated fields use those wrappers instead of raw `div`/`label` markup.

Common examples:

```ts
formPrimitives: {
  field: 'Field',
  label: 'FieldLabel',
  control: 'FieldControl'
}
```

```ts
formPrimitives: {
  field: 'FormField',
  label: 'FormLabel',
  control: 'FormControl'
}
```

### `validateConfig(...)`

Use at runtime when loading external config objects. Validates and returns a typed `ZodFormsConfig`.

```ts
import { validateConfig } from '@zod-to-form/cli';

const parsed = validateConfig(configObject, 'component-config');
```

## Programmatic API

### `runGenerate(options)`

Runs generation and returns:

- `outputPath`
- `code`
- `wroteFile`
- `actionPath` and `actionCode` (when `serverAction` enabled)

### `createProgram()`

Returns Commander program instance for embedding or custom CLIs.

## Development

From repository root:

```bash
pnpm --filter @zod-to-form/cli run build
pnpm --filter @zod-to-form/cli run test
pnpm --filter @zod-to-form/cli run type-check
```

@zod-to-form/cli — Build-time CLI for generating React form components from Zod v4 schemas.

Drives the full code generation pipeline: loads a schema file, walks the Zod internal
type tree via `@zod-to-form/core`, applies per-field overrides from `z2f.config.ts`,
and emits static `.tsx` form components — optionally alongside a Next.js server action
and a schema-lite file for optimized client-side validation.

## Remarks

Before using the CLI, decide: are you scripting (use `runGenerate`) or interacting
(use `npx zod-to-form`)? For config authoring, always use `defineConfig` for type inference.

## Use When

- You want a one-shot CLI command to generate a typed React form from a Zod schema — no runtime overhead, static output
- You need watch-mode codegen that regenerates on schema file changes — `--watch` keeps the output in sync automatically
- You want programmatic codegen from a Node.js script without spawning a child process — import `runGenerate` directly instead of using the CLI binary

## Avoid When

- Runtime form rendering — use `@zod-to-form/react` for that; the CLI only emits static `.tsx` files
- Browser environments — this package uses Node.js `fs` and `path` APIs not available in browsers
- Projects that do not use Vite — the `@zod-to-form/vite` plugin covers that use case better with HMR integration

## Pitfalls

- NEVER omit `--config` when calling the CLI — there is no fallback auto-discovery
  when `--export` is provided without a config; the command will error
- NEVER rely on generated file content without checking `wroteFile` — when `overwrite`
  is false and the output file already exists, `runGenerate` returns `wroteFile: false`
  and leaves the existing file unchanged without throwing
- NEVER mix CLI-generated components with components managed by the Vite plugin
  in the same module — the import paths and registry expectations differ

## CLI

- [createProgram](functions/createProgram.md)
- [runGenerate](functions/runGenerate.md)

## Configuration

- [ZodFormsConfig](type-aliases/ZodFormsConfig.md)
- [defineConfig](functions/defineConfig.md)
- [validateConfig](functions/validateConfig.md)

## Other

- [ComponentOverride](type-aliases/ComponentOverride.md)

## Types

- [FieldConfig](type-aliases/FieldConfig.md)
