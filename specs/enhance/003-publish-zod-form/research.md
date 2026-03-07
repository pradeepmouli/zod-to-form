# Research: shadcn Registry Integration

**Enhancement**: enhance-003
**Date**: 2026-03-06

## Decision 1: Registry Format & Hosting

**Decision**: Use direct per-item registry item JSON files under `public/r/`, served via GitHub raw URLs (no root `registry.json` index for now).

**Rationale**: GitHub raw URLs require zero infrastructure. The shadcn CLI supports direct URL consumption of individual registry items: `npx shadcn add https://raw.githubusercontent.com/pradeepmouli/zod-to-form/master/public/r/zod-form.json`. Community registries commonly use this pattern before graduating to custom domains.

**Alternatives considered**:
- npm package hosting — more complex, less common for shadcn registries
- Custom domain (`registry.zodforms.dev`) — overkill for initial release

**Implementation detail**: Each registry item is its own JSON file under `public/r/` (or just `r/`) with `content` fields populated. We hand-author these since we have only 2 items; if we later add more items or a root `registry.json` index, we can introduce a `shadcn build` step to generate them from source.

## Decision 2: Registry Item Architecture

**Decision**: Thin wrapper pattern — `zod-form` registry item imports from `@zod-to-form/react` (npm dep) and wires shadcn components.

**Rationale**: Avoids duplicating ~1000 lines of `ZodForm` + `FieldRenderer` + `useZodForm` source. Users get updates via `npm update` rather than re-running `shadcn add`. Core schema walking logic (`@zod-to-form/core`) stays in npm.

**Alternatives considered**:
- Full source inlining — standard shadcn pattern but impractical for a library with significant internal logic
- Hybrid (inline renderer, npm core) — unnecessary complexity

**Implementation detail**: The thin wrapper file will:
```tsx
export { ZodForm } from '@zod-to-form/react';
export { shadcnComponentMap } from '@zod-to-form/react';
```
With `dependencies: ["@zod-to-form/react", "@zod-to-form/core", "react-hook-form", "@hookform/resolvers", "zod"]`.

## Decision 3: Component Naming — `<Field>` Pattern

**Decision**: Rename wrapper keys from `FormField/FormLabel/FormDescription/FormMessage` to `Field/FieldLabel/FieldDescription/FieldMessage`.

**Rationale**: Matches shadcn's current registry component names. The old `<Form>` wrapper pattern has been deprecated in shadcn in favor of form-library-agnostic `<Field>` components.

**Alternatives considered**:
- Keep old names — would not align with shadcn registry
- Use `FormItem` (shadcn legacy name) — deprecated

**Implementation detail**:
- `defaultComponentMap` keys: `Field`, `FieldLabel`, `FieldDescription`, `FieldMessage`
- Old keys removed entirely — no deprecated aliases (backward compatibility not needed)
- `FieldRenderer.tsx` uses new keys internally: `componentMap.Field`, `componentMap.FieldLabel`, etc.
- `shadcnComponentMap` overrides the same new keys

## Decision 4: Bootstrapper Item Format

**Decision**: Use `registry:lib` type for the CLI bootstrapper. Drops `z2f.config.ts` into the user's project with `@zod-to-form/cli` as a devDependency.

**Rationale**: `registry:lib` places files in the project's `lib/` directory. The config file needs an explicit `target` to land at the project root instead.

**Implementation detail**: Use `registry:file` type with `target: "~/z2f.config.ts"` (the `~` means project root). Declare `devDependencies: ["@zod-to-form/cli"]`.

## Decision 5: Registry Serving Without Build Step

**Decision**: Hand-author the served JSON files under `public/r/` with `content` fields, rather than using `shadcn build`.

**Rationale**: We have only 2 registry items with 1-2 files each. A build pipeline is unnecessary overhead. The served JSON includes the `content` field with the source code as a string.

**Alternatives considered**:
- Use `shadcn build` — requires setting up the registry-template project structure, overkill for 2 items
- Dynamic serving via API — unnecessary complexity

**File structure**:
```
public/r/
├── zod-form.json        # served item with content
└── zod-form-cli.json    # served item with content
```

Users consume via:
```bash
npx shadcn add https://raw.githubusercontent.com/pradeepmouli/zod-to-form/master/public/r/zod-form.json
```
