<p align="center">
  <a href="https://github.com/pradeepmouli/zod-to-form">
    <img src="https://raw.githubusercontent.com/pradeepmouli/zod-to-form/master/attached_assets/logo.png" alt="zod-to-form logo" height="32" />
  </a>
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
zodform generate --schema ./src/schema.ts --export userSchema
```

### Command

`zodform generate`

Required options:

- `--schema <path>`: path to schema module
- `--export <name>`: named export containing the schema

Optional options:

- `--mode <mode>`: `submit | auto-save` (default `submit`)
- `--component-config <path>`: path to component config (`.json` or `.ts`)
- `--out <path>`: output directory or `.tsx` file path
- `--name <componentName>`: generated component name override
- `--ui <preset>`: `shadcn | unstyled` (default `shadcn`)
- `--force`: overwrite existing output file
- `--dry-run`: print generated code to stdout without writing files
- `--server-action`: generate Next.js server action next to form output
- `--watch`: watch schema file and regenerate on changes

## Examples

Generate to default output (`<DerivedName>Form.tsx`):

```bash
zodform generate --schema ./src/user.schema.ts --export userSchema
```

Generate to specific directory with custom component name:

```bash
zodform generate \
  --schema ./src/user.schema.ts \
  --export userSchema \
  --out ./src/forms \
  --name UserProfile
```

Generate in auto-save mode with server action:

```bash
zodform generate \
  --schema ./src/user.schema.ts \
  --export userSchema \
  --mode auto-save \
  --server-action
```

Dry run to inspect generated output:

```bash
zodform generate --schema ./src/user.schema.ts --export userSchema --dry-run
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
