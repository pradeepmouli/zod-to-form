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
zodform generate --config ./component-config.ts --schema ./src/schema.ts --export userSchema
```

```bash
zodform init
```

### Command

`zodform generate`

Required options:

- `--schema <path>`: path to schema module
- `--export <name>`: named export containing the schema

Optional options:

- `--mode <mode>`: `submit | auto-save` (default `submit`)
- `--config <path>`: path to generate config (`.json` or `.ts`) **required**
- `--out <path>`: output directory or `.tsx` file path
- `--name <componentName>`: generated component name override
- `--ui <preset>`: `shadcn | unstyled` (default `shadcn`)
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

1. `component-config.ts`
2. `component-config.js`
3. `component-config.json`
4. `z2f.config.ts`
5. `z2f.config.js`
6. `z2f.config.json`

### Command

`zodform init`

Creates `component-config.ts` using sensible defaults and introspection of shadcn `components.json` when available.

Optional options:

- `--out <path>`: output file or directory (default `component-config.ts`)
- `--components <modulePath>`: module path assigned to `components` in generated config (overrides inference)
- `--force`: overwrite existing config file
- `--dry-run`: print generated config and skip file writes
- `--verbose`: print detailed diagnostics for each step

Output behavior:

- default: concise progress + final summary
- `--verbose`: adds detailed diagnostics (detected config source/aliases)

## Examples

Generate to default output (`<DerivedName>Form.tsx`):

```bash
zodform generate --schema ./src/user.schema.ts --export userSchema
```

Generate to specific directory with custom component name:

```bash
zodform generate \
  --config ./component-config.ts \
  --schema ./src/user.schema.ts \
  --export userSchema \
  --out ./src/forms \
  --name UserProfile
```

Generate in auto-save mode with server action:

```bash
zodform generate \
  --config ./component-config.ts \
  --schema ./src/user.schema.ts \
  --export userSchema \
  --mode auto-save \
  --server-action
```

Dry run to inspect generated output:

```bash
zodform generate --config ./component-config.ts --schema ./src/user.schema.ts --export userSchema --dry-run
```

Initialize config with verbose diagnostics:

```bash
zodform init --verbose
```

Initialize config with explicit components module path:

```bash
zodform init --components ../../src/components/zod-form-components
```

## Type-Safe Component Config

The package exports helpers to define and validate component config.

### `defineComponentConfig(...)`

`defineComponentConfig` gives type-safe field path support (including array path normalization).

```ts
import { defineComponentConfig } from '@zod-to-form/cli';

type Values = {
  profile: { bio: string };
  tags: Array<{ label: string }>;
};

type Components = {
  TextInput: unknown;
  TextareaInput: unknown;
};

export default defineComponentConfig<Components, Values>({
  components: '@/components/form-components',
  overwrite: true,
  types: ['userSchema'],
  include: ['*Schema'],
  exclude: ['Internal*'],
  fieldTypes: {
    Input: { component: 'TextInput' },
    textarea: { component: 'TextareaInput' }
  },
  fields: {
    'profile.bio': { fieldType: 'textarea', props: { rows: 5 } },
    'tags[].label': { fieldType: 'Input' }
  }
});
```

### `validateComponentConfig(...)`

Use at runtime when loading external config objects.

```ts
import { validateComponentConfig } from '@zod-to-form/cli';

const parsed = validateComponentConfig(configObject, 'component-config');
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
