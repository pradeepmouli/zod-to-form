# Contract: `<ZodFormSwitch>`

Implemented by `packages/react/src/ZodFormSwitch.tsx`. Exported from
the `@zod-to-form/react` index.

## Surface

```ts
import { ZodFormSwitch } from '@zod-to-form/react';

const SCHEMAS = {
  Data: dataTypeFormSchema,
  Choice: choiceFormSchema,
  Function: functionFormSchema,
  Enum: enumFormSchema,
  TypeAlias: typeAliasFormSchema
} as const;

function EditorPane({ node }: { node: GraphNode }) {
  return (
    <ZodFormSwitch
      source={node}
      discriminator="$type"
      schemas={SCHEMAS}
      fallback={<UnsupportedTypeNotice />}
      componentConfig={config}
      onValueChange={(values, meta) => commitToGraph(node, values, meta)}
    />
  );
}
```

## Behaviour

1. The host reads `source[discriminator]` on every render.
2. If the value is a key of `schemas`, the host renders `<ZodForm
   schema={schemas[value]} … key={value} />`. The `key` ensures React
   unmounts the previous form on discriminator changes (FR-006).
3. If the value is NOT a key of `schemas`:
   - If `fallback` is a ReactNode, render it.
   - If `fallback` is a function, call `fallback(source)` and render
     its return.
   - Otherwise, render `null` and emit a one-time `console.warn`
     (gated by the existing `_warnedKeys` registry).
4. `componentConfig`, `componentModule`, and `onValueChange` props
   forward verbatim to the inner `<ZodForm>`.

## State isolation

When the discriminator value changes, React's `key` change unmounts
the previous form. All RHF state (controllers, watches, validators) is
released; the new form mounts with its own `defaultValues`. This is
the intended behaviour (US3 acceptance scenario 3) — no manual
`form.reset` plumbing required.

## Source vs. defaultValues

The host does NOT pass `source` directly to `<ZodForm>`. Adopters
needing source-driven `defaultValues` use `useExternalSync` inside the
form they ship for each schema, or pre-project the source at the
host's call site:

```ts
<ZodFormSwitch
  source={node}
  discriminator="$type"
  schemas={SCHEMAS}
  // Each form sets its own defaultValues from `node` via toFormValues
  // and uses useExternalSync to repopulate on identity changes.
/>
```

## Type safety

`schemas` is a `Record<string, $ZodType>`. `source[discriminator]`
must resolve to a `string` value at runtime. TypeScript inference uses
the `discriminator` literal to constrain `keyof schemas` against
`source[K]` where possible.

## Edge cases

| Scenario | Behaviour |
|----------|-----------|
| `source[discriminator]` is `undefined` | Treat as unmapped → render `fallback` or `null`. |
| `source` itself is `undefined` or `null` | Render `fallback` or `null`. The host does not crash. |
| Schemas map is empty | Always render `fallback`. |
| `discriminator` value changes during render commit | React's reconciler handles the key change; previous form unmounts. |

## Verification

Tests live in `packages/react/tests/ZodFormSwitch.test.tsx`. Coverage:
- Source A (Data) → A-form rendered.
- Swap to source B (Choice) → A-form unmounted, B-form mounted with
  B's defaults.
- Unmapped discriminator → fallback rendered.
- Missing fallback → null + one-time warning.
- Re-swap to source C (also Data) → fresh A-form (no stale state).
