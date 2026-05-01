---
title: CLI Codegen
sidebar_position: 2
description: Generate static React form components at build time from Zod v4 schemas using the z2f generate CLI.
---

# CLI Codegen

Generate static `.tsx` form components at build time using `@zod-to-form/cli`. This guide covers the current `z2f generate` command, the required `z2f.config.ts`, export selection, watch mode, server actions, and the programmatic API.

## When to Use

Use the CLI codegen path when a project needs static, hand-readable `.tsx` form components generated from Zod v4 schemas at build time. It is best suited for production forms, design system integration, and cases where the generated code should be inspected, customized, and committed.

## Prerequisites

- Node.js >= 20
- Zod v4 (`zod@^4.0.0`)
- A `z2f.config.ts` file
- A schema module that exports one or more Zod schemas

## Installation

```bash
pnpm add -D @zod-to-form/cli zod
```

The package exposes both `z2f` and `zod-to-form` binaries. The examples below use the shorter `z2f` alias.

## Basic Usage

### 1. Create `z2f.config.ts`

```ts
// z2f.config.ts
import { defineConfig } from '@zod-to-form/core';

export default defineConfig({
  components: {
    source: '@/components/ui',
    preset: 'shadcn',
  },
  defaults: {
    out: 'src/components',
    overwrite: true,
    mode: 'submit',
  },
});
```

### 2. Define a Schema File

```ts
// src/schemas/user.ts
import { z } from 'zod';

export const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'editor', 'viewer']),
  bio: z.string().optional(),
  newsletter: z.boolean().default(false),
});
```

### 3. Generate the Form Component

```bash
npx z2f generate \
  --config z2f.config.ts \
  --schema src/schemas/user.ts \
  --export userSchema \
  --out src/components/ \
  --name UserForm
```

### 4. Generated Output

The generated `src/components/UserForm.tsx` imports your schema, React Hook Form, and the selected UI components. No `@zod-to-form/*` imports remain in the emitted file.

## CLI Options

### Required Flags

| Flag | Description |
|---|---|
| `--config <path>` | Path to `z2f.config.ts` (or `.json`) |
| `--schema <path>` | Path to the TypeScript/JavaScript module containing the Zod schema exports |

### Optional Flags

| Flag | Default | Description |
|---|---|---|
| `--export <name>` | Derived from config | Named export containing the root schema |
| `--out <path>` | `config.defaults.out` or local default | Output directory or `.tsx` file path |
| `--name <name>` | Derived from export name | Generated component name |
| `--mode <mode>` | `config.defaults.mode` or `submit` | `submit` or `auto-save` |
| `--ui <preset>` | `config.defaults.ui` or `shadcn` | `shadcn` or `html` |
| `--dry-run` | `false` | Print generated code without writing files |
| `--server-action` | `false` | Generate a Next.js server action alongside the form |
| `--watch` | `false` | Watch the schema file and regenerate on changes |

Overwrite behavior is controlled by `config.defaults.overwrite`; there is no separate `--force` flag for `generate`.

## Export Selection

`--export` is optional when your config already tells the CLI which exports to generate.

Resolution order:

1. `--export`
2. `config.types`
3. exported schemas discovered from the module, filtered by `config.include` / `config.exclude`

That lets one command generate a single form, a curated list, or every matching export in a schema module.

## Naming Conventions

| `--export` value | Derived `--name` | Output file |
|---|---|---|
| `userSchema` | `UserForm` | `UserForm.tsx` |
| `orderSchema` | `OrderForm` | `OrderForm.tsx` |
| `loginData` | `LoginDataForm` | `LoginDataForm.tsx` |

Override with `--name`:

```bash
npx z2f generate --config z2f.config.ts --schema src/user.ts --export userSchema --name ProfileEditor
# ProfileEditor.tsx
```

## Generation Modes

### Submit Mode

Generates a standard `handleSubmit` + `onSubmit` pattern:

```bash
npx z2f generate --config z2f.config.ts --schema src/schemas/user.ts --export userSchema
```

### Auto-Save Mode

Generates a `watch` + `useEffect` pattern with `onValueChange`:

```bash
npx z2f generate \
  --config z2f.config.ts \
  --schema src/schemas/user.ts \
  --export userSchema \
  --mode auto-save
```

## Multiple Exports from One Schema Module

If the schema module exports several forms, list them in config and omit `--export`:

```ts
// z2f.config.ts
import { defineConfig } from '@zod-to-form/core';

export default defineConfig({
  components: {
    source: '@/components/ui',
    preset: 'shadcn',
  },
  types: ['UserSchema', 'AdminSchema'],
  defaults: {
    out: 'src/components',
    overwrite: true,
  },
});
```

```bash
npx z2f generate --config z2f.config.ts --schema src/schemas/index.ts
```

The CLI will emit both selected forms in one pass.

## Config-Driven Schema Defaults

The CLI reads `schemas[ExportName]` from `z2f.config.ts` in two ways:

1. **Root-only generation settings** such as `name`, `mode`, `out`, and `serverAction`
2. **Schema-identity defaults** such as `component` and nested `fields`

That means reusable exported subschemas can carry their own default editor wherever they are reused.

```ts
import { defineConfig } from '@zod-to-form/core';
import * as schemaModule from './src/schemas';

export default defineConfig<typeof import('@/components/ui'), typeof schemaModule>({
  components: {
    source: '@/components/ui',
    preset: 'shadcn',
  },
  schemas: {
    ExpressionSchema: {
      component: 'ExpressionEditor',
      fields: {
        language: { hidden: true },
      },
    },
    WorkflowSchema: {
      name: 'WorkflowForm',
    },
  },
});
```

If `WorkflowSchema` reuses the exact exported `ExpressionSchema` object, the generated form will render that nested schema with `ExpressionEditor` unless a more specific path override wins.

## Server Actions

Generate a paired Next.js server action alongside the form:

```bash
npx z2f generate \
  --config z2f.config.ts \
  --schema src/schemas/user.ts \
  --export userSchema \
  --server-action
```

This produces both `UserForm.tsx` and `user-form-action.ts`.

## Watch Mode

Regenerate automatically when the schema file changes:

```bash
npx z2f generate \
  --config z2f.config.ts \
  --schema src/schemas/user.ts \
  --export userSchema \
  --watch
```

`--watch` tracks the schema file passed to `--schema`. If your config changes, rerun the command.

## Programmatic API

### `runGenerate(options)`

```ts
import { runGenerate } from '@zod-to-form/cli';

const result = await runGenerate({
  config: './z2f.config.ts',
  schema: './src/schemas/user.ts',
  export: 'userSchema',
  out: './src/components/',
  name: 'UserForm',
  mode: 'submit',
  ui: 'shadcn',
  serverAction: true,
});
```

Returns:

| Property | Type | Description |
|---|---|---|
| `outputPath` | `string` | Absolute path to the generated `.tsx` file |
| `code` | `string` | Generated TypeScript source |
| `wroteFile` | `boolean` | Whether the file was written to disk |
| `actionPath` | `string \| undefined` | Path to the generated server action file |
| `actionCode` | `string \| undefined` | Generated server action source |

### `createProgram()`

Returns a Commander.js `Command` instance for embedding in custom CLIs:

```ts
import { createProgram } from '@zod-to-form/cli';

const program = createProgram();
await program.parseAsync(['node', 'z2f', 'generate', '--config', 'z2f.config.ts', '--schema', 'src/schemas/user.ts']);
```

## Relationship to Runtime

The CLI and runtime `<ZodForm>` share `@zod-to-form/core`, but the CLI consumes `defineConfig()` while runtime-only component binding happens through `componentConfig`. See [Core Configuration](./core-config.md) and [Runtime Component Config](./component-config.md).
