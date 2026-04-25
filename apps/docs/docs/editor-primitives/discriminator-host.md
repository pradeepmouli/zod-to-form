---
sidebar_position: 3
title: Discriminator host
description: Render the right form for a discriminated source — Data, Choice, Function, Enum — from one declaration.
---

# Discriminator host

`<ZodFormSwitch>` picks the right form based on a discriminator field
on your source object. Declare the schema map once; the host handles
unmount/remount on discriminator changes so no state leaks between
schemas.

## Quickstart

```tsx
import { ZodFormSwitch } from '@zod-to-form/react';

const SCHEMAS = {
  Data: dataTypeSchema,
  Choice: choiceSchema,
  Function: functionSchema,
  Enum: enumSchema,
  TypeAlias: typeAliasSchema
} as const;

function EditorPane({ node }: { node: GraphNode }) {
  return (
    <ZodFormSwitch
      source={node}
      discriminator="$type"
      schemas={SCHEMAS}
      fallback={<UnsupportedTypeNotice />}
    />
  );
}
```

`source[discriminator]` is read on every render. If it matches a key in
`schemas`, the matching schema's form is rendered. Otherwise, the
fallback is rendered (or `null` plus a one-time warning).

## State isolation via React keys

When the discriminator value changes, the host bumps a React `key` on
the inner `<ZodForm>`. React unmounts the old form completely, mounts a
fresh one with the new schema's `defaultValues`. Result: zero residual
state, zero stale-controller bugs.

You don't need to call `form.reset` yourself when switching nodes — the
unmount handles it. (If you also need to reset *within* a single
schema's form, use [`useExternalSync`](./external-sync.md).)

## Fallback options

Three forms of fallback:

1. **ReactNode** — a fixed component for any unmapped value:

   ```tsx
   <ZodFormSwitch
     source={node}
     discriminator="$type"
     schemas={SCHEMAS}
     fallback={<UnsupportedTypeNotice />}
   />
   ```

2. **Function** — receives the source so you can render
   value-specific output:

   ```tsx
   <ZodFormSwitch
     source={node}
     discriminator="$type"
     schemas={SCHEMAS}
     fallback={(s) => <span>No editor for type "{s.$type}"</span>}
   />
   ```

3. **Omit** — the host renders `null` and emits one console warning
   per unmapped value. Useful in development; not recommended for
   production.

## When NOT to use this

- Your form has only one schema. `<ZodForm>` directly is simpler.
- You want to merge state across schema changes (e.g., shared header
  fields). Lift those fields out of the per-schema form into a host
  component, then use `<ZodFormSwitch>` for the schema-specific
  remainder.
- You want to migrate values when the discriminator changes (e.g.,
  Data → Choice keeps the name field). The host does NOT migrate — it
  unmounts. Run your migration logic at the call site:

  ```tsx
  const migratedNode = useMemo(() => migrateOnTypeChange(node), [node.$type]);
  return <ZodFormSwitch source={migratedNode} ... />;
  ```

## Common pitfalls

- **Discriminator value not a string**: the host reads
  `source[discriminator]` and uses it as a `key`. Non-string values
  (`number`, `null`) trigger the fallback path.
- **Schemas map changes per render**: every new map reference may
  invalidate `key` lookups. Define `SCHEMAS` outside your component or
  in a `useMemo`.
- **Forgetting to register a fallback for production**: in development
  the warning surfaces missing schemas immediately, but it's a one-time
  log. In production, an unmapped value silently renders nothing — add
  a fallback so users see a helpful message.
