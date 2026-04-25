# Contract: `useExternalSync`

Implemented by `packages/react/src/useExternalSync.ts`. Exported from
the `@zod-to-form/react` index.

## Surface

```ts
import { useExternalSync } from '@zod-to-form/react';

function NodeEditor({ node }: { node: GraphNode }) {
  const { form } = useZodForm(dataTypeFormSchema, {
    defaultValues: toFormValues(node),
    mode: 'onChange'
  });

  useExternalSync(form, node, toFormValues);

  return <ZodForm form={form} schema={dataTypeFormSchema} />;
}
```

## Behaviour

1. The hook stores a ref to the previous `source` value.
2. On every render, it compares the new `source` to the previous one
   via `Object.is`.
3. If they differ, it calls `form.reset(toValues(source), {
   keepDirty: options?.keepDirty ?? false })`.
4. If they are the same reference, nothing happens — including when
   the source's *contents* change without a new reference.

## Reference identity is the contract

This satisfies US2 acceptance scenario 2 ("user edit preserved when
unrelated property of the same source changes"). Adopters who hold a
mutable graph node and want resets on content change MUST swap the
reference (e.g. shallow-clone or use an immutable update library).

## Projection function

`toValues(source)` is required (FR-004). Adopters with mismatched
source-vs-form shapes declare the projection inline. The hook does not
cache `toValues` results; if the projection is expensive, adopters
memoise externally.

## Null sources

Passing `null`/`undefined` as `source` is supported. The hook calls
`toValues(source)` and the adopter's projection decides how to handle
nullish values. The library does not throw on nullish inputs.

## Edge cases

| Scenario | Behaviour |
|----------|-----------|
| First render | The hook initialises its ref to `source` and does NOT call `form.reset` (the form already has `defaultValues` from `useZodForm`). |
| Source identity changes mid-edit | `form.reset` discards in-progress edits unless `keepDirty: true` (FR opt-in). |
| Source identity unchanged but contents mutated | No reset; user edits preserved (US2 acceptance scenario 2). |
| Source flips A → B → A in rapid succession | Each transition triggers exactly one reset; final form state matches the final A's projection. |

## Tree-shaking

The hook is a pure function with no module-init side effects.
Importing only `<ZodForm>` from `@zod-to-form/react` MUST NOT pull
`useExternalSync` into the bundle (verified in `quickstart.md` bundle
budget step).

## Verification

Tests live in `packages/react/tests/useExternalSync.test.tsx`.
Coverage:
- Source A → B triggers reset to B's projection.
- Source A → A (identity stable, contents mutated) preserves edit.
- `keepDirty: true` preserves edit across identity change.
- Null source: hook calls `toValues(null)`; adopter projection handles.
- Hook does not call `form.reset` on first render.
