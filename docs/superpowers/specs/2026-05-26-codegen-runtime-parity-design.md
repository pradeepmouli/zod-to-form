# Design: codegen ↔ runtime field-resolution parity

**Date:** 2026-05-26
**Status:** Approved (design); pending spec review → implementation plan(s)
**Note:** Umbrella design. Decomposes into several implementation plans (core+leaf first, then one per structural type). The first plan covers the shared resolvers + leaf-field migration + the parity harness.

## Goal

Eliminate the class of bugs where `@zod-to-form/react` (runtime `<ZodForm>`) and `@zod-to-form/codegen` (generated components) render the *same* `FormField` differently — by making both consume **one shared set of `zodType`-keyed resolvers** for a field's component props and control binding, instead of each hand-assembling them.

## Problem

`walkSchema` produces a `FormField[]` IR (carrying `zodType`, `component`, `props`, `constraints`, `options`, `children`, `validation`). Two renderers then independently interpret it:
- **Runtime** `FieldRenderer`: `buildBaseComponentProps` + `...field.props` + `...override.props` + `register`/`useController` (via `getFieldRegisterHints`).
- **Codegen** `generate.ts`/`templates.ts`: `id` + `renderNativeInputAttrs` + `buildRegisterExpr`/`renderControlledComponent` + `overrideProps`.

Because each derives the prop set separately, they drift. Three confirmed divergences (all fixed reactively):
1. register coercion options (`setValueAs`) — fixed by extracting `getFieldRegisterHints` into core (#130).
2. native attrs (`type="email"`) dropped by codegen's mapped path — fixed in #137.
3. base props (`required`/`readOnly`/`aria-invalid`) emitted by runtime, not codegen — still open.

The first two were patched at the symptom; this design fixes the disease.

## Key decision — no new abstraction; key on the true schema type

We do **not** introduce a new `FieldBinding`/`kind` model. The shared contract is the existing **`FormField` IR**, and dispatch is keyed on the existing **`zodType`** discriminator — which mirrors Zod's own type taxonomy (`string`/`number`/`boolean`/`date`/`object`/`array`/`union`/…) and is already the dispatch key in the processor registry. We generalize the existing `getFieldRegisterHints(field)` pattern: a small family of pure, `zodType`-keyed **resolver functions in `@zod-to-form/core`** that compute *what props/binding a field's component receives*. Both renderers call them and keep their existing `FormField` + `zodType`/`component` traversal; they stop hand-assembling.

## Architecture

**Shared resolvers (core), keyed on `zodType`/`component`:**
- `getFieldRegisterHints(field)` — exists (coerce/nativeRules/validate).
- `resolveBaseProps(field, ctx)` → `{ id, required?, readOnly?, disabled?, ariaInvalid }` (the current `buildBaseComponentProps` logic, moved to core).
- `resolveNativeAttrs(field)` → DOM-valid native attributes from `field.props` (e.g. `type`) — the parity-#2 logic, made canonical.
- `resolveControlMode(field, config)` → `'register' | 'controller' | 'native'` (the controlled-vs-uncontrolled decision, currently split between `componentOverride?.controlled` checks in both renderers).
- `resolveOptionsProps(field)` → `options` passthrough where applicable.

These may be exposed individually or as one `resolveFieldProps(field, config)` returning `{ baseProps, nativeAttrs, controlMode, registerHints, options, overrideProps }`. Each is pure, unit-tested in core, and is the *single* place a given decision lives.

**Renderers materialize, don't decide.**
- Runtime: `FieldRenderer` keeps its `FormField` traversal + `zodType`/`component` switch, but builds component props from the resolvers (spread onto the live component; `register`/`useController` per `controlMode`).
- Codegen: `generate.ts` keeps its traversal + switch, but serializes the resolver output to JSX (props as source; `register`/`<Controller>` per `controlMode`).
- Framework-specific materialization (runtime hooks vs codegen source; `useFieldArray` vs `.map`) stays per-renderer but is *driven by* the shared resolvers + `FormField.children`, so structure + props can't diverge.

**Structural recursion** follows `FormField.children` (objects), the array element field, and union variants — both renderers already traverse these; they continue to, calling the shared leaf resolvers at each leaf.

## Parity test (acceptance gate)

A test that takes a schema exercising every `zodType` (string/email/number/bool/date/enum→select/radio/object/array/discriminated-union/custom), runs it through both the runtime resolution and codegen, and asserts the **resolved prop set per field matches**. Because both pull from the same resolvers, leaf parity holds by construction; the test guards that each renderer *materializes faithfully* and catches any future drift mechanically (no more relying on review). This harness lands in stage 1 and gates every subsequent stage.

## Staged rollout (each stage: migrate both renderers, parity + existing suites green)

1. **Core resolvers + parity harness + leaf-field migration** (first plan): add `resolveBaseProps`/`resolveNativeAttrs`/`resolveControlMode`/`resolveOptionsProps` (or `resolveFieldProps`) to core with tests; migrate runtime + codegen leaf rendering to consume them; add the parity harness; fix the open base-props divergence (#3). 
2. **Fieldset** (nested objects) — both renderers' nested traversal calls shared resolvers; parity for nested leaves.
3. **Array** — hardest; `useFieldArray` (runtime) vs `.map`+`<Controller>` (codegen) materialization, both driven by the shared element resolution + array controls.
4. **Discriminated union** — discriminator leaf + per-variant children via shared resolvers.
5. **Custom render** — `field.render` (runtime) vs codegen placeholder; align the contract.

Each stage is its own spec → plan → PR. Behavior is preserved (parity) except where it deliberately fixes a divergence; each touches published packages (`core`/`react`/`codegen`) → changeset.

## Non-goals

- Sharing the actual *rendering* code (impossible: runtime needs live React hooks/closures; codegen needs static source). We share the *decisions*, not the materialization.
- A new IR or model. `FormField` + `zodType` are the contract.
- Changing `walkSchema`'s output shape (the resolvers read it; they don't replace it).

## Risks

- **Array/union materialization** differ most between renderers; the shared layer describes the decision, but the per-renderer hook-vs-source code is where regressions hide — staged + parity-gated to contain it.
- Large surface across three published packages with substantial existing test suites; the parity test + per-stage existing-suite runs are the safety net.
- **Currently blocked from CI/merge**: the GitHub account is suspended (all Actions/checkout 403). Implementation can proceed locally, but PRs can't be validated/merged until the account is reinstated.

## Open questions

- Single `resolveFieldProps(field, config)` vs a family of `resolve*` functions — decide in the first plan based on how cleanly each renderer consumes it (lean: one `resolveFieldProps` returning a struct, mirroring `getFieldRegisterHints`'s single-entry shape).
- Whether `resolveControlMode` fully subsumes the existing `componentOverride?.controlled` checks in both renderers, or wraps them.
