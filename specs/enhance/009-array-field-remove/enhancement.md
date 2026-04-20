# Enhancement: Array Field Add/Remove Buttons

**Enhancement ID**: enhance-009
**Branch**: `enhance/009-array-field-remove`
**Created**: 2026-04-20
**Priority**: [X] High | [ ] Medium | [ ] Low
**Component**: packages/core (types), packages/react (FieldRenderer), packages/codegen (generate)
**Status**: [ ] Planned | [ ] In Progress | [X] Complete

## Input
User description: "Array field add/remove buttons: wire maxLength constraint to disable Add button, style buttons through component map (shadcn preset gets Button component), and add arrayConfig to FormMeta registry for customizing button labels and behavior per-field"

## Overview
Array fields currently render unstyled `<button>Add</button>` / `<button>Remove</button>` text buttons. The `maxLength` constraint from `z.array().max(N)` is already extracted but not wired to disable the Add button. The component map needs array button slots so the shadcn preset can render proper `Button` components, and `FormMeta` needs an `arrayConfig` option for per-field customization of button labels.

## Motivation
Array fields are a core form pattern but the current UX is minimal — unstyled buttons, no max-item enforcement, no way to customize labels via the registry. Users expect styled +/- buttons that respect schema constraints and integrate with their component library.

## Proposed Changes
- Wire `field.constraints.maxLength` to disable the Add button when items reach the limit (runtime + codegen)
- Add `ArrayAddButton` and `ArrayRemoveButton` slots to the component map so presets can style them
- Add shadcn-styled button stubs for the array buttons in the shadcn preset
- Add `arrayConfig` to `FieldConfigBase` (applies when schema is `$ZodArray`) for customizing add/remove labels
- Update codegen to emit styled buttons and respect maxLength

**Files to Modify**:
- `packages/core/src/types.ts` — Add `arrayConfig` to FieldConfigBase, add button slots to ComponentMap type
- `packages/react/src/FieldRenderer.tsx` — Wire maxLength disable, use component map button slots
- `packages/react/src/components/index.ts` — Add default ArrayAddButton/ArrayRemoveButton components
- `packages/react/src/shadcn/index.ts` — Add shadcn-styled array button stubs
- `packages/codegen/src/generate.ts` — Wire maxLength disable, emit styled button code
- `packages/core/src/metadata.ts` — Resolve arrayConfig from registry

**Breaking Changes**: [ ] Yes | [X] No
The existing `<button>` elements remain as the default; component map additions are backward compatible.

## Implementation Plan

**Phase 1: Implementation**

**Tasks**:
1. [X] Add `ArrayAddButton` and `ArrayRemoveButton` slots to the component map type in `packages/react/src/components/index.ts` with default implementations (`<button type="button">` with `+`/`-` labels)
2. [X] Add `arrayConfig?: { addLabel?: string; removeLabel?: string }` to `FieldConfigBase` in `packages/core/src/types.ts`
3. [X] Wire `maxLength` in `ArrayBlock` (packages/react/src/FieldRenderer.tsx): disable Add button when `items.length >= field.constraints.maxLength`; use component map button slots; resolve `arrayConfig` labels from field metadata
4. [X] Add shadcn-styled `ShadcnArrayAddButton` and `ShadcnArrayRemoveButton` stubs to `packages/react/src/shadcn/index.ts`
5. [X] Update codegen `renderArrayField` in `packages/codegen/src/generate.ts` to emit `disabled` attribute when maxLength is defined, and use configurable labels
6. [X] Add unit tests for maxLength disable behavior and arrayConfig label resolution in `packages/react/tests/ArrayBlock.test.tsx` (10 tests) and `packages/codegen/tests/generate.test.ts` (2 tests)
7. [X] Update playground to reflect new button styling when shadcn preset is active (inherited from component map)

**Acceptance Criteria**:
- [X] Add button is disabled when array items reach `z.array().max(N)` limit (runtime + codegen)
- [X] Remove button is disabled when array items are at `z.array().min(N)` (already works, verify)
- [X] shadcn preset renders styled array buttons (outline variant, small size)
- [X] Custom labels via `arrayConfig: { addLabel: 'Add Item', removeLabel: 'Remove' }` in FormMeta work
- [X] Codegen output includes disabled logic and respects labels
- [X] No breaking changes to existing array field usage

## Testing
- [X] Unit tests added/updated (527 tests total, 12 new)
- [X] Integration tests pass
- [ ] Manual testing complete (playground with array schema)
- [ ] Edge cases verified (0 items + minLength, max items reached, no config)

## Verification Checklist
- [ ] Changes implemented as described
- [ ] Tests written and passing
- [ ] No regressions in existing functionality
- [ ] Documentation updated (if needed)
- [ ] Code reviewed (if appropriate)

## Follow-on: Record Fields

Records (`z.record()`) should get similar add/remove UX:
- `RecordField` component that renders key-value pairs with add/remove
- Add button creates a new entry with a user-provided key + empty value
- Remove button deletes an entry by key
- `recordConfig?: { addLabel?, removeLabel?, keyPlaceholder? }` in FieldConfigBase
- The record processor currently renders as a plain `Input` — needs a new component type

This is larger scope (needs key input UX, different RHF pattern with `useWatch` or manual state) and should be a separate enhancement or feature spec.

## Notes
- `FormFieldConstraints.maxLength` is already populated by the array processor from `z.array().max(N)._zod.bag.maximum`
- `FieldConfig` is already typed per-schema-type: `$ZodArray` branch gets `arrayItems` — `arrayConfig` fits naturally alongside it
- The component map already has precedent for wrapper components (Field, FieldLabel, etc.)

---
*Enhancement created using `/enhance` workflow - See .specify/extensions/workflows/enhance/*
