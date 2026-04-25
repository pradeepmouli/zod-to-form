# Phase 1 — Data Model

This feature is runtime-UI only and introduces no persisted state. The "data
model" here is the public type surface added or modified, which downstream
adopters consume directly.

## Modified types

### `ArrayConfig` (in `@zod-to-form/core/types`)

Existing shape (excerpted):

```ts
export interface ArrayConfig {
  addLabel?: string;
  removeLabel?: string;
}
```

After this feature:

```ts
export interface ArrayConfig {
  addLabel?: string;
  removeLabel?: string;

  /** Enable per-row reorder affordance. Off by default. */
  reorder?: boolean;

  /**
   * Optional callback fired after a reorder completes. Adopters who hold a
   * parallel copy of the array (e.g. a graph store) mirror the change here.
   * `from` and `to` are zero-based indices into the form-driven array
   * (excluding ghost rows).
   */
  onReorder?: (from: number, to: number) => void;

  /**
   * Non-form rows rendered before the first form-driven row. Each entry is
   * a self-contained renderable; the library never inspects its contents.
   * Ghost rows do not participate in form state, validation, or submission.
   */
  before?: GhostRow[];

  /** Non-form rows rendered after the last form-driven row. Same semantics as `before`. */
  after?: GhostRow[];
}

/**
 * A renderable row that lives inside an array section without participating
 * in form state. Used for inherited rows, computed defaults, or read-only
 * informational entries.
 */
export interface GhostRow {
  /** Stable React key. Required so reorders of real rows don't remount ghost rows. */
  id: string;
  /** Render function. Receives positional context relative to other ghost rows. */
  render: (ctx: GhostRowContext) => import('react').ReactNode;
}

export interface GhostRowContext {
  /** True if this row is the first ghost row in its `before` or `after` group. */
  isFirst: boolean;
  /** True if this row is the last ghost row in its `before` or `after` group. */
  isLast: boolean;
}
```

Validation rules:
- `reorder: true` is independent of `min`/`max` length constraints. Reorder
  works on fixed-length arrays (length stays constant; only order changes).
- `onReorder` is invoked exactly once per reorder, after RHF state is
  updated. Adopters MUST treat indices as referring to the post-reorder
  array.
- Ghost-row `id` MUST be unique within its `before` or `after` group.
  Duplicates produce a development-mode warning (one-time, gated by the
  existing `_warnedKeys` registry).

### `FieldConfig` field-key paths (in `@zod-to-form/core/config`)

The internal `DotPath<T>` and `SchemaFieldPath<T extends $ZodType>` helpers
extend to recognise array traversal:

```ts
// Before:
type DotPath<T> = T extends Primitive
  ? never
  : { [K in keyof T & string]: K | `${K}.${DotPath<T[K]>}` }[keyof T & string];

// After (illustrative, real implementation handles arrays/optional/etc.):
type DotPath<T> = T extends Primitive
  ? never
  : T extends readonly (infer U)[]
    ? `${number}` | `${number}.${DotPath<U>}` | `[]` | `[].${DotPath<U>}`
    : { [K in keyof T & string]:
          K
        | `${K}.${DotPath<T[K]>}` }[keyof T & string];
```

Validation rules:
- `[]` traversal resolves to "every item in this array" — a single config
  entry applies to all items uniformly.
- Existing configs that already use `[]` syntax continue to type-check.
- Configs that pass `string` for the field key (escape hatch) continue to
  work; the union widens.

## New types

### `UseExternalSyncOptions` (in `@zod-to-form/react`)

```ts
export interface UseExternalSyncOptions {
  /**
   * If true, preserve dirty fields across an external reset.
   * Defaults to false (matches US2 acceptance scenario 3:
   * source switch discards in-progress edits).
   */
  keepDirty?: boolean;
}

export function useExternalSync<TSource, TValues extends FieldValues>(
  form: UseFormReturn<TValues>,
  source: TSource,
  toValues: (source: TSource) => TValues,
  options?: UseExternalSyncOptions
): void;
```

Validation rules:
- `source` is compared by reference identity (`Object.is`).
- `toValues` is called only when the identity changes; the result is passed
  to `form.reset`.
- `null`/`undefined` source: the hook calls `form.reset(toValues(source))`
  — adopters' projection function decides how to handle nullish sources.

### `ZodFormSwitchProps` (in `@zod-to-form/react`)

```ts
export interface ZodFormSwitchProps<
  TSource extends Record<string, unknown>,
  TKey extends keyof TSource & string,
  TSchemas extends Record<string, $ZodType>
> {
  /** Source object whose `[discriminator]` value selects the schema. */
  source: TSource;
  /** Property name on `source` to use as the discriminator. */
  discriminator: TKey;
  /** Map from discriminator values to Zod schemas. */
  schemas: TSchemas;
  /**
   * Component(s) to render when the discriminator value matches no
   * schema. ReactNode for static fallback; function for dynamic.
   */
  fallback?: import('react').ReactNode | ((source: TSource) => import('react').ReactNode);
  /** Forwarded to the rendered <ZodForm>. */
  componentConfig?: RuntimeComponentConfig;
  componentModule?: Record<string, unknown>;
  onValueChange?: (
    data: unknown,
    meta: { isValid: boolean }
  ) => void;
}

export function ZodFormSwitch<…>(props: ZodFormSwitchProps<…>): JSX.Element | null;
```

Validation rules:
- The component bumps an internal `key` on the rendered `<ZodForm>` whenever
  `source[discriminator]` changes, so React unmounts the previous form and
  mounts a fresh one (FR-006).
- `fallback` rendering does NOT bump the key; the host returns the fallback
  node directly.
- One-time `console.warn` if `discriminator` value is missing from
  `schemas` and no `fallback` is provided.

## Component contract additions

### `ArrayReorderHandle` (in `defaultComponentMap` and `shadcnComponentMap`)

```ts
export interface ArrayReorderHandleProps {
  /** Current index of the row this handle controls. */
  index: number;
  /** Total number of *form-driven* rows (excludes ghost rows). */
  total: number;
  /** Disable both directions (e.g. fixed-length array constraint). */
  disabled?: boolean;
  /** Move this row to a new index. Wired to RHF `move()` by ArrayBlock. */
  onMove: (from: number, to: number) => void;
}
```

Default implementation (HTML baseline): an inline `<span role="group">` with
two buttons (↑ / ↓) that disable at the boundaries and call `onMove`.

shadcn variant: same surface, styled to match the existing
`ArrayAddButton`/`ArrayRemoveButton` look and SF-symbol equivalents.

## Out of scope (explicitly)

- Persisted form state: no change to local-storage, server, or codegen
  output formats.
- New processors or walker behaviour: ghost rows live in `FieldConfig`, not
  in `FormField` shape. The walker emits the same `FormField[]` it does
  today.
- Codegen output: this feature is runtime-only; codegen mirroring is a
  follow-up tracked in the spec's "Out of Scope" block.
