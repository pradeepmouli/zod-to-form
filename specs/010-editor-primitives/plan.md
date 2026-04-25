# Implementation Plan: Editor Primitives for Graph-Driven Schema Editors

**Branch**: `010-editor-primitives` | **Date**: 2026-04-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-editor-primitives/spec.md`

## Summary

Six small, independently shippable primitives for `@zod-to-form/react` that
unblock editor-style adopters (live consumer: rune-langium's visual-editor
package). The work breaks cleanly into three landed-as-needed groups:

- **P1, runtime additions**: array reorder slot (`arrayConfig.reorder`,
  `componentMap.ArrayReorderHandle`, exposed `move` from `useFieldArray`); a
  documented `useExternalSync(form, source, toValues)` hook in
  `@zod-to-form/react` that resets form values on source-identity change.
- **P2, runtime additions**: `<ZodFormSwitch>` host that picks between schemas
  by a discriminator field; `arrayConfig.before`/`arrayConfig.after` ghost-row
  slots that render non-form rows alongside `useFieldArray` rows.
- **P3, types + docs**: tighten `FieldConfig` field-key paths so `attributes[].x`
  autocompletes against the schema's array element shape; ship a worked example
  for the existing `FormMeta.render` row-renderer pattern (no runtime change).

All work lives in `packages/react` (and `packages/core` for the path-typing
change). No codegen-side work in this feature; codegen mirrors come later if
needed. No new dependencies. The defaults preserve current behaviour: an
adopter who ignores all six primitives sees zero observable change.

## Technical Context

**Language/Version**: TypeScript 5.x (strict)
**Primary Dependencies**:
- `@zod-to-form/core` (in-tree, peer of `@zod-to-form/react`)
- React 18+ (peer)
- React Hook Form 7+ (peer) — already exposes `move`/`swap` on `useFieldArray`
- Zod v4 (peer)

**Storage**: N/A — runtime only, no persistence
**Testing**: Vitest + `@testing-library/react`; new tests follow the existing
`packages/react/tests/{ArrayBlock,FieldRenderer,ZodForm,useZodForm}.test.tsx`
patterns. Type-only tests for the array-path tightening live alongside
`packages/core/tests/component-config-types.test.ts`.
**Target Platform**: Evergreen browsers; SSR-compatible.
**Project Type**: TypeScript library (pnpm workspaces).
**Performance Goals**: Reorder dispatch ≤1 frame on a 100-row array; external
sync triggers exactly one `form.reset` per source-identity change; ghost-row
rendering O(N+M) where N is form rows and M is ghost rows.
**Constraints**:
- No new third-party deps (Constitution IV).
- All new exports tree-shakeable; opt-in adopters who don't import them pay
  zero bundle cost (FR-012).
- No imports from internal subpaths (FR-011).
- Existing public APIs (`<ZodForm>`, `useZodForm`, `walkSchema`,
  `defaultComponentMap`, `shadcnComponentMap`) MUST keep their current
  observable behaviour. The reorder primitive MUST be off by default.
**Scale/Scope**: ~6 net-new public exports across `react` + `core`; ~600 LOC
estimate including docs and tests; one breaking-change risk vector
(FieldConfig path typing tightening) handled with an additive escape hatch.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Zod-Native Architecture**: PASS. Reorder, ghost rows, and external sync
  are runtime UI features that operate on `FormField[]` and RHF state — no
  new schema-level intermediate representation introduced.
- **II. Processor Registry Pattern**: PASS. No new processors needed; ghost
  rows live in `FieldConfig.arrayConfig`, not in walker output.
- **III. Dual-Mode Output**: PASS for runtime; codegen mirroring is explicit
  Out of Scope (spec line "Codegen-side support… is a follow-up"). Tracked
  for a future spec; runtime ships standalone.
- **IV. Zero Unnecessary Dependencies**: PASS. Zero new third-party deps.
  Drag/keyboard gesture handling stays adopter-supplied.
- **V. Test-First Development**: PASS. Each primitive has Vitest coverage
  authored before implementation per US1–US6 acceptance scenarios.
- **VI. Type Safety First**: PASS. The array-path tightening (US5) directly
  improves type safety; no new `any`/`as` casts introduced.
- **VII. Accessibility by Default**: PASS with note. Reorder primitive ships
  the operation only — adopters wire the gesture. Documentation MUST cover
  the recommended ARIA wiring (drag-handle role, live-region announcements,
  keyboard shortcuts) per accessibility-by-default. The default
  `ArrayReorderHandle` component MUST be keyboard-operable out of the box.

**Result**: All gates PASS. Re-check after Phase 1 confirms no design
deviations triggered new violations.

## Project Structure

### Documentation (this feature)

```text
specs/010-editor-primitives/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── array-reorder.md
│   ├── external-sync.md
│   ├── discriminator-host.md
│   └── ghost-rows.md
├── checklists/
│   └── requirements.md
└── tasks.md            # created by /speckit.tasks
```

### Source Code (repository root)

```text
packages/
├── core/
│   └── src/
│       ├── types.ts                    # MODIFY: extend ArrayConfig with
│       │                               #   { reorder?: boolean;
│       │                               #     before?: GhostRow[]; after?: GhostRow[] }
│       │                               # ADD: GhostRow type
│       └── config.ts                   # MODIFY: tighten DotPath / SchemaFieldPath
│                                       #   to include `[].` traversal in autocomplete
├── react/
│   └── src/
│       ├── FieldRenderer.tsx           # MODIFY: ArrayBlock destructures `move`
│       │                               #   from useFieldArray; renders
│       │                               #   ArrayReorderHandle when reorder=true;
│       │                               #   renders before/after ghost rows.
│       ├── components/
│       │   ├── ArrayReorderHandle.tsx  # ADD: minimal HTML reorder handle
│       │   │                           #   (button with up/down + drag attrs)
│       │   └── index.ts                # MODIFY: export ArrayReorderHandle
│       ├── shadcn/
│       │   ├── ArrayReorderHandle.tsx  # ADD: shadcn-styled variant
│       │   └── index.ts                # MODIFY: include in shadcnComponentMap
│       ├── useExternalSync.ts          # ADD: exported hook
│       ├── ZodFormSwitch.tsx           # ADD: discriminator host
│       └── index.ts                    # MODIFY: export useExternalSync,
│                                       #   ZodFormSwitch
│   └── tests/
│       ├── ArrayReorder.test.tsx       # ADD: US1 acceptance scenarios
│       ├── useExternalSync.test.tsx    # ADD: US2 acceptance scenarios
│       ├── ZodFormSwitch.test.tsx      # ADD: US3 acceptance scenarios
│       └── GhostRows.test.tsx          # ADD: US4 acceptance scenarios
└── core/
    └── tests/
        └── field-path-types.test.ts    # ADD: US5 type-only tests

apps/
└── docs/
    └── docs/
        ├── editor-primitives/
        │   ├── reorder.mdx             # ADD: worked example for US1
        │   ├── external-sync.mdx       # ADD: worked example for US2
        │   ├── discriminator-host.mdx  # ADD: worked example for US3
        │   ├── ghost-rows.mdx          # ADD: worked example for US4
        │   └── custom-row-renderer.mdx # ADD: worked example for US6
        │                               #   (no runtime change; documents
        │                               #   existing FormMeta.render pattern)
        └── api/                        # auto-generated; refresh after merge
```

**Structure Decision**:
- All runtime additions stay in `packages/react`. The only `packages/core`
  change is the `ArrayConfig` extension (data shape for ghost rows + reorder
  flag) and the `FieldConfig` path-typing tightening — both are type-only at
  the runtime boundary.
- New components ship in both `defaultComponentMap` (HTML baseline) and
  `shadcnComponentMap` (shadcn-styled). This matches the existing pattern for
  `ArrayAddButton`/`ArrayRemoveButton`.
- Documentation is published with the source so the worked examples in
  `apps/docs/docs/editor-primitives/` exercise the actual exports and break
  the docs build if any rename occurs.
- No changes to `packages/codegen` or `packages/vite` — runtime-only feature.

## Complexity Tracking

> No constitutional violations — section intentionally empty.

---

## Phase Outputs

- **Phase 0**: [research.md](./research.md) — public-API shapes, default-off
  semantics, ghost-row data shape, type-tightening escape hatch, RHF
  integration choice (`move` vs `swap`).
- **Phase 1**: [data-model.md](./data-model.md),
  [contracts/array-reorder.md](./contracts/array-reorder.md),
  [contracts/external-sync.md](./contracts/external-sync.md),
  [contracts/discriminator-host.md](./contracts/discriminator-host.md),
  [contracts/ghost-rows.md](./contracts/ghost-rows.md),
  [quickstart.md](./quickstart.md).
- **Phase 2**: tasks.md (produced by `/speckit.tasks`).
