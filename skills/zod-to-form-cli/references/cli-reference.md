# @zod-to-form/cli Reference

## Command: `z2f generate`

```
z2f generate [options]
```

### Required Options

| Flag              | Description                                                        |
| ----------------- | ------------------------------------------------------------------ |
| `--schema <path>` | Path to the TypeScript/JavaScript module containing the Zod schema |
| `--export <name>` | Named export that contains the `z.object(...)` schema              |

### Optional Flags

| Flag                   | Default                 | Description                                                                                              |
| ---------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------- |
| `--config <path>`      | —                       | Path to config file (`.ts` or `.json`) — see shared-config.md                                            |
| `--out <path>`         | `./<Name>Form.tsx`      | Output directory or `.tsx` file path                                                                     |
| `--name <name>`        | Derived from `--export` | Component name (e.g., `UserForm`). If omitted, derived by stripping `Schema` suffix and appending `Form` |
| `--mode <mode>`        | `submit`                | `submit` — standard `handleSubmit` pattern; `auto-save` — `watch` + `useEffect` pattern                  |
| `--ui <preset>`        | `shadcn`                | `shadcn` or `unstyled`                                                                                   |
| `--force`              | `false`                 | Overwrite existing output file                                                                           |
| `--dry-run`            | `false`                 | Print generated code to stdout without writing files                                                     |
| `--server-action`      | `false`                 | Generate a Next.js server action alongside the form                                                      |
| `--watch`              | `false`                 | Watch the schema file and regenerate on changes                                                          |

### Command: `z2f init`

Scaffold a new `z2f.config.ts` in the current directory:

```bash
npx z2f init
```

## Naming Conventions

| `--export` value | Derived `--name` | Output file         |
| ---------------- | ---------------- | ------------------- |
| `userSchema`     | `UserForm`       | `UserForm.tsx`      |
| `orderSchema`    | `OrderForm`      | `OrderForm.tsx`     |
| `loginData`      | `LoginDataForm`  | `LoginDataForm.tsx` |

Override with `--name`:

```bash
z2f generate --schema src/user.ts --export userSchema --name ProfileEditor
# → ProfileEditor.tsx
```

## Generated Output Structure

### Submit Mode

```tsx
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { StripIndexSignature } from '@zod-to-form/core';
import { userSchema } from './schema';

type FormData = StripIndexSignature<z.output<typeof userSchema>>;

export function UserForm(props: {
  onSubmit: (data: FormData) => void;
  values?: Partial<FormData>;
}) {
  const form = useForm<FormData>({
    resolver: zodResolver(userSchema),
    ...(props.values && { values: props.values })
  });
  const { register, handleSubmit } = form;

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(props.onSubmit)}>
        {/* fields */}
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
}
```

### Auto-Save Mode

```tsx
import { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { StripIndexSignature } from '@zod-to-form/core';
import { userSchema } from './schema';

type FormData = StripIndexSignature<z.output<typeof userSchema>>;

export function UserForm(props: {
  onValueChange?: (data: FormData) => void;
  values?: Partial<FormData>;
}) {
  const form = useForm<FormData>({
    resolver: zodResolver(userSchema),
    mode: 'onChange',
    ...(props.values && { values: props.values })
  });
  const { register, watch } = form;

  useEffect(() => {
    const subscription = watch((values) => {
      props.onValueChange?.(values as FormData);
    });
    return () => subscription.unsubscribe();
  }, [watch, props.onValueChange]);

  return (
    <FormProvider {...form}>
      <form>{/* fields — no submit button */}</form>
    </FormProvider>
  );
}
```

### With Controlled Components

When `controlled: true` is set on a field type, the output uses `<Controller>`:

```tsx
import { useForm, FormProvider, Controller } from 'react-hook-form';
// ...
const { register, handleSubmit, control } = form;

// Regular field
<Input id="name" {...register('name')} />

// Controlled field
<Controller
  name="role"
  control={control}
  render={({ field }) => <MySelect value={field.value} onChange={field.onChange} />}
/>
```

### With Arrays

When the schema contains `z.array()`, the output includes `useFieldArray`:

```tsx
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
// ...
const { register, handleSubmit, control } = form;
const { fields: itemsFields, append: appendItems, remove: removeItems } = useFieldArray({
  control, name: 'items'
});
```

### With Section Grouping

When fields have `section` config, the section component is rendered after the main form body:

```tsx
import { MetadataSection } from '@/components/ui';
// ...
{/* regular fields */}
<MetadataSection fields={['source', 'version', 'lastUpdated']} />
```

## Programmatic API

### `runGenerate(options)`

```typescript
import { runGenerate } from '@zod-to-form/cli';

const result = await runGenerate({
  schema: './src/schemas/user.ts',
  export: 'userSchema',
  config: './z2f.config.ts',
  out: './src/components/',
  name: 'UserForm',
  mode: 'submit',
  ui: 'shadcn',
  force: true,
  serverAction: true
});
```

**Returns:**

| Property     | Type                  | Description                                                                    |
| ------------ | --------------------- | ------------------------------------------------------------------------------ |
| `outputPath` | `string`              | Absolute path to the generated `.tsx` file                                     |
| `code`       | `string`              | Generated TypeScript source                                                    |
| `wroteFile`  | `boolean`             | Whether the file was written (false in dry-run or if exists without `--force`) |
| `actionPath` | `string \| undefined` | Path to server action file (when `serverAction: true`)                         |
| `actionCode` | `string \| undefined` | Server action source                                                           |

### `createProgram()`

Returns a Commander.js `Command` instance for embedding in custom CLIs:

```typescript
import { createProgram } from '@zod-to-form/cli';

const program = createProgram();
await program.parseAsync(['node', 'z2f', 'generate', '--schema', ...]);
```

### `defineConfig(config)`

Type-safe helper for config files (re-exported from `@zod-to-form/core`):

```typescript
import { defineConfig } from '@zod-to-form/core';

export default defineConfig<Components>({
  components: '@/components/ui',
  fieldTypes: { ... },
  fields: { ... },
});
```

### `validateConfig(value, source?)`

Runtime validation for externally loaded config objects:

```typescript
import { validateConfig } from '@zod-to-form/core';

const parsed = validateConfig(loadedConfig, 'my-config.json');
```

Throws with descriptive error messages if the config shape is invalid.

### Deprecated

- `defineComponentConfig()` — use `defineConfig()` instead
- `validateComponentConfig()` — use `validateConfig()` instead
