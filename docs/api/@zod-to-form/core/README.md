[**Documentation v0.2.0**](../../README.md)

***

[Documentation](../../README.md) / @zod-to-form/core

<p align="center">
  <img src="https://raw.githubusercontent.com/pradeepmouli/zod-to-form/master/attached_assets/banner.svg" alt="zod-to-form banner" />
</p>

# @zod-to-form/core

Schema walker and processor registry for Zod v4 form generation.

`@zod-to-form/core` is the foundation package in this monorepo. It walks a Zod schema and produces a `FormField[]` intermediate representation that can be consumed by runtime renderers (like `@zod-to-form/react`) or code generators (like `@zod-to-form/cli`).

## Installation

```bash
pnpm add @zod-to-form/core zod
```

## Requirements

- Node.js >= 20
- Zod v4

## Quick Start

```ts
import { z } from 'zod';
import { walkSchema } from '@zod-to-form/core';

const schema = z.object({
  name: z.string().min(1).describe('Your full name'),
  age: z.number().int().min(0),
  newsletter: z.boolean().default(false)
});

const fields = walkSchema(schema);

console.log(fields.map((f) => ({ key: f.key, component: f.component })));
```

## API

### `walkSchema(schema, options?)`

Converts a top-level `z.object(...)` schema into ordered form field descriptors.

- Throws if top-level schema is not `z.object(...)`
- Applies built-in processors based on internal Zod def type
- Supports custom processors and form metadata registry
- Guards recursion with `maxDepth` (default: `5`)

```ts
import { walkSchema } from '@zod-to-form/core';

const fields = walkSchema(schema, {
  maxDepth: 8,
  processors: {
    // override/add processors by zod def.type
  }
});
```

### `createProcessors(overrides?)`

Returns processor map with built-ins plus optional overrides.

### `builtinProcessors`

Built-in processor registry for core Zod types.

### `processors`

Namespace export of individual processor implementations.

### `defineConfig(config)`

Type-safe config builder for `ZodFormsConfig`. Merges preset overrides into the returned config object.

### `validateConfig(value, source?)`

Validates a raw config object against the config schema. Throws with a descriptive message on failure.

### `resolveFieldConfig(globalFields, schemaFields)`

Merges global and per-schema field configs with schema-level overrides taking priority.

### Utility Exports

- `inferLabel(key: string)`
- `joinPath(...parts: string[])`
- `createBaseField(key: string, zodType: string)`
- `getEmptyDefault(schema)` — schema-inferred type-safe empty value
- `normalizeFieldKey(key)` — normalize dot-path field keys
- `collectFieldSections(fields)` — group fields by section name
- `registerDeep(registry, schema, meta)` — register metadata on a schema and its children
- `registerFlat(registry, schema, fieldConfigs)` — register flat field configs onto schema shapes

## Types

Core public types:

- `FormField`
- `FormFieldOption`
- `FormFieldConstraints`
- `FormMeta`
- `FieldConfig`
- `FormProcessor`
- `FormProcessorContext`
- `ProcessParams`
- `WalkOptions`
- `ZodFormRegistry`
- `ComponentOverride`
- `ComponentPreset`
- `ComponentsConfig`
- `FormPrimitivesConfig`
- `TypedFieldConfig`
- `ZodFormsConfig`
- `ZodTypeConfig`
- `ConfigDefaults`
- `StripIndexSignature`

## Form Metadata via Zod Registry

Attach UI metadata to schemas with a Zod registry and pass it as `formRegistry`.

```ts
import { z } from 'zod';
import { walkSchema } from '@zod-to-form/core';
import type { FormMeta } from '@zod-to-form/core';

const formRegistry = z.registry<FormMeta>();

const schema = z.object({
  bio: z.string(),
  email: z.string().email()
});

formRegistry.add(schema.shape.bio, {
  component: 'Textarea',
  order: 1,
  gridColumn: 'span 2'
});

const fields = walkSchema(schema, { formRegistry });
```

## Custom Processor Example

```ts
import type { FormProcessor } from '@zod-to-form/core';
import { walkSchema } from '@zod-to-form/core';

const customStringProcessor: FormProcessor = (_schema, _ctx, field) => {
  field.component = 'Input';
  field.props.type = 'text';
  field.props.autoComplete = 'off';
};

const fields = walkSchema(schema, {
  processors: {
    string: customStringProcessor
  }
});
```

## Relationship to Other Packages

- `@zod-to-form/react` consumes `FormField[]` at runtime to render forms.
- `@zod-to-form/cli` consumes `FormField[]` at build time to generate TSX components.

## Development

From repository root:

```bash
pnpm --filter @zod-to-form/core run build
pnpm --filter @zod-to-form/core run test
pnpm --filter @zod-to-form/core run type-check
```

## Modules

- [](README.md)
- [loader](loader/README.md)
- [processors](processors/README.md)
