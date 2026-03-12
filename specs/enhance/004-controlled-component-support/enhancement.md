# Enhancement: Controlled Component Support & Codegen Ergonomics

**Enhancement ID**: enhance-004
**Branch**: `enhance/004-controlled-component-support`
**Created**: 2026-03-12
**Priority**: [x] High | [ ] Medium | [ ] Low
**Component**: packages/core (config types), packages/cli (codegen templates), packages/react (runtime)
**Status**: [ ] Planned | [ ] In Progress | [x] Complete

## Input
User description: During integration of z2f-generated scaffolds with a visual editor using custom controlled components (Radix Select, custom TypeSelector, CardinalityPicker), several friction points required extensive manual patching. Seven improvements identified: controlled component support, FormProvider wrapping, form variable exposure, defaultValues/values prop, type-safe append defaults, controlled prop mapping, and shared StripIndexSignature utility.

## Overview
Add first-class support for controlled components in both the CLI codegen and runtime renderer, plus several codegen ergonomics improvements (FormProvider wrapping, form variable exposure, defaultValues prop, type-safe append defaults, prop mapping, StripIndexSignature export). These changes eliminate the need for adapter wrappers, sed-patching, and `as any` casts when integrating z2f output with controlled component libraries.

## Motivation
When using z2f with controlled components (Radix Select, custom TypeSelector, CardinalityPicker), the current `{...register('field')}` spread pattern doesn't work — controlled components don't accept `onChange`, `onBlur`, `ref`, `name` from `register()`. Users must create `forwardRef` adapter wrappers using `useController`, manually add `<FormProvider>` wrapping, expose the `form` variable, and cast append defaults with `as any`. Items 1-4 alone would eliminate ~90% of manual patching work.

## Clarifications

### Session 2026-03-12
- Q: When `controlled: true` is set but no `propMap` is provided, how should codegen wire props? → A: Use RHF's standard field props directly: `value={field.value} onChange={field.onChange} onBlur={field.onBlur} ref={field.ref}`. `propMap` is only needed when a component deviates from the standard interface.
- Q: Should `propMap` live only on `ComponentEntry` (global per component type), or also be overridable per-field? → A: `ComponentEntry` as default, overridable per-field in `TypedFieldConfig.propMap`. This avoids config duplication while handling edge cases where the same component type needs different prop wiring per field.
- Q: What should `getEmptyDefault` return for union/discriminated union types? → A: Use the first variant's empty default. For discriminated unions, populate the discriminator value of the first variant.

## Proposed Changes

1. **Controlled component flag** — Add `controlled: true` to `ComponentEntry` config type. When set, codegen emits `<Controller>` render-prop pattern instead of `register()` spread, defaulting to standard RHF field props (`value`, `onChange`, `onBlur`, `ref`) unless overridden by `propMap`. Runtime `FieldRenderer` uses `useController` instead of `register()`.
2. **Controlled prop mapping** — Add `propMap?: Record<string, string>` to `ComponentEntry` (component-level default) and `TypedFieldConfig` (per-field override). Maps RHF field props to component-specific prop names (e.g., `{ onSelect: 'field.onChange', value: 'field.value' }`). Per-field `propMap` merges over component-level default.
3. **FormProvider wrapping** — When config has `formProvider: true` or `mode: 'auto-save'`, wrap generated form in `<FormProvider {...form}>`.
4. **Form variable exposure** — Always generate `const form = useForm(...)` then `const { register, watch, control } = form;` as two statements.
5. **defaultValues/values prop** — Generated form components accept optional `defaultValues` and `values` props, passed through to `useForm()`.
6. **Type-safe append defaults** — Infer empty defaults from Zod schema shape (`''` for string, `0` for number, `false` for boolean, recursive for objects, first variant for unions/discriminated unions with discriminator value populated) instead of hardcoded string values.
7. **Shared StripIndexSignature** — Export `StripIndexSignature<T>` from `@zod-to-form/core` so generated files import it instead of inlining the utility type.

**Files to Modify**:
- `packages/core/src/config.ts` — Add `controlled`, `propMap` to `ComponentEntry`; add `formProvider` to `ConfigDefaults`; export `StripIndexSignature`
- `packages/core/src/types.ts` — Add `defaultFactory` to `FormField` for type-safe empty values
- `packages/core/src/walker.ts` — Compute default empty values per field during walk
- `packages/cli/src/templates.ts` — Emit `<Controller>` pattern for controlled components; emit `FormProvider` wrapping; emit two-statement `useForm`; emit `defaultValues`/`values` props; emit schema-inferred append defaults; import `StripIndexSignature` from core
- `packages/cli/src/codegen.ts` — Thread new config options through to templates
- `packages/react/src/FieldRenderer.tsx` — Use `useController` for controlled components; apply `propMap`
- `packages/react/src/ZodForm.tsx` — Already has `FormProvider` and `defaultValues`; verify parity
- `packages/react/src/useZodForm.ts` — Support `values` prop pass-through

**Breaking Changes**: [ ] Yes | [x] No
All changes are additive — existing configs and generated output remain valid.

## Implementation Plan

**Phase 1: Implementation**

**Tasks**:
1. [x] **Core config types** — Extend `ComponentEntry` with `controlled?: boolean` and `propMap?: Record<string, string>`. Add `formProvider?: boolean` to `ConfigDefaults`. Export `StripIndexSignature<T>` utility type from `packages/core/src/config.ts` (or a new `packages/core/src/utils.ts`). Add config validation for new fields.
2. [x] **Schema default value inference** — Add a `getEmptyDefault(field: FormField): unknown` utility in core that returns type-safe empty values based on `field.zodType` and `field.children`/`field.arrayItem`. Wire into walker so `FormField.defaultValue` is populated when no explicit `.default()` exists.
3. [x] **CLI codegen: form scaffolding** — Update `templates.ts` to: (a) always emit `const form = useForm(...)` + destructure as second statement, (b) emit `<FormProvider {...form}>` wrapping when `formProvider: true` or `mode: 'auto-save'`, (c) accept and pass through `defaultValues`/`values` props, (d) import `StripIndexSignature` from `@zod-to-form/core` instead of inlining.
4. [x] **CLI codegen: controlled components** — Update `renderField()` in `templates.ts` to check `ComponentEntry.controlled`. When true, emit `<Controller name={key} control={control} render={({ field }) => <Component {...propMap(field)} />} />` pattern. Apply `propMap` to rename field props. Use schema-inferred defaults for `useFieldArray` append calls.
5. [x] **React runtime: controlled support** — Update `FieldRenderer.tsx` to detect `controlled: true` from resolved component config. Use `useController` instead of `register()`. Apply `propMap` for prop name remapping. Pass `values` through `useZodForm` to RHF's `useForm({ values })`.
6. [x] **Tests** — Add unit tests for: config validation with new fields, `getEmptyDefault()` for all Zod types, codegen output assertions for controlled vs uncontrolled components, codegen FormProvider wrapping, codegen defaultValues/values props, runtime controlled field rendering. Update existing snapshot tests.
7. [x] **Documentation & changeset** — Update README examples showing controlled component config. Add changeset for minor version bump.

**Acceptance Criteria**:
- [x] `controlled: true` in config produces `<Controller>` pattern in codegen output and uses `useController` at runtime
- [x] `propMap` correctly remaps field props in both codegen and runtime
- [x] Generated forms include `<FormProvider>` when configured
- [x] Generated forms expose `const form = useForm(...)` as a separate variable
- [x] Generated forms accept `defaultValues` and `values` props
- [x] Array field append uses schema-inferred type-safe defaults (no `as any` needed)
- [x] `StripIndexSignature` is importable from `@zod-to-form/core`
- [x] All existing tests continue to pass (no regressions)

## Testing
- [x] Unit tests added/updated
- [x] Integration tests pass
- [x] Manual testing complete
- [x] Edge cases verified

## Verification Checklist
- [x] Changes implemented as described
- [x] Tests written and passing
- [x] No regressions in existing functionality
- [x] Documentation updated (if needed)
- [x] Code reviewed (if appropriate)

## Notes
- Items 2-4 (FormProvider, form variable, defaultValues) are trivial codegen changes and should be done first as quick wins.
- Item 1 (controlled component support) is the highest-impact change — root cause of the adapter wrapper pattern.
- Items 5-6 (append defaults, prop mapping) complete the controlled component story.
- Item 7 (StripIndexSignature) is a small cleanup that reduces generated file size.
- The runtime `ZodForm` component already uses `FormProvider` and accepts `defaultValues` — CLI codegen needs to reach parity.
- The `propMap` design intentionally uses string templates (`'field.value'`, `'field.onChange'`) to keep config serializable (no functions in JSON config).

---
*Enhancement created using `/enhance` workflow - See .specify/extensions/workflows/enhance/*
