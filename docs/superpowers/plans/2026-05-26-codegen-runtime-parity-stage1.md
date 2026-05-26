# codegen↔runtime Parity — Stage 1 (core resolvers + leaf migration) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the per-field component-prop decisions (currently duplicated in `@zod-to-form/react` `FieldRenderer` and `@zod-to-form/codegen` `generate.ts`) into shared, `zodType`-keyed resolver functions in `@zod-to-form/core`, migrate **leaf fields** in both renderers to consume them, add a parity harness, and fix the open base-props divergence — all behavior-preserving except the deliberate divergence fix.

**Architecture:** New pure resolvers in core (`resolveBaseProps`, `resolveNativeAttrs`, `resolveControlMode`, `resolveOptionsProps`), composed alongside the existing `getFieldRegisterHints`. Runtime spreads their output onto the live component; codegen serializes the same output to JSX. No new IR — keyed on the existing `FormField`/`zodType`. Structural kinds (object/array/union/custom) are out of scope for Stage 1 (later plans).

**Tech Stack:** TypeScript (strict), Vitest. Packages: `@zod-to-form/core`, `@zod-to-form/react`, `@zod-to-form/codegen`.

**Spec:** `docs/superpowers/specs/2026-05-26-codegen-runtime-parity-design.md`

**Precondition note:** The GitHub account is suspended → CI/PR validation is blocked. This plan is execute-locally-ready; PRs validate once access returns.

---

## Reference: current duplicated logic
- Runtime base props: `packages/react/src/FieldRenderer.tsx` `buildBaseComponentProps` (~line 315) → `{ id, 'aria-invalid', required, readOnly, disabled }`. **`aria-invalid` is error-state** (`errorMessage ? 'true' : 'false'`), NOT schema-derived.
- Runtime prop assembly: uncontrolled (~line 824) `{ ...buildBaseComponentProps, ...field.props, ...override.props, ...register(key, getRegisterOptions(field)) }`; controlled `ControlledFieldInner` (~line 703) `{ ...buildBaseComponentProps, ...field.props, ...resolveProps(controllerField, presetProps, fieldConfigProps), options }`.
- Codegen leaf mapped: `packages/codegen/src/generate.ts` `renderMappedComponent` (~line 526, uncontrolled branch ~line 545) → `id` + `renderNativeInputAttrs(field)` + `buildRegisterExpr(field)` + `overrideProps` + `fieldPropsSpread`. `renderNativeInputAttrs` uses an allowlist `NATIVE_INPUT_ATTRS = ['type']`.
- Existing shared resolver: `packages/core/src/register-hints.ts` `getFieldRegisterHints(field)` — the pattern to mirror.

---

## Task 1: `resolveBaseProps` in core

**Files:**
- Create: `packages/core/src/resolve-base-props.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/tests/resolve-base-props.test.ts`

- [ ] **Step 1: Failing test**
```ts
import { describe, it, expect } from 'vitest';
import { resolveBaseProps } from '../src/resolve-base-props.js';
import type { FormField } from '../src/types.js';

const base = (over: Partial<FormField>): FormField => ({
  key: 'name', label: 'Name', zodType: 'string', component: 'Input',
  required: true, readOnly: false, disabled: false, props: {}, constraints: {},
  ...over
} as FormField);

describe('resolveBaseProps', () => {
  it('returns id + static flags (no aria-invalid — that is error state)', () => {
    expect(resolveBaseProps(base({}))).toEqual({ id: 'name', required: true });
  });
  it('includes readOnly/disabled only when true', () => {
    expect(resolveBaseProps(base({ readOnly: true, disabled: true, required: false })))
      .toEqual({ id: 'name', readOnly: true, disabled: true });
  });
});
```
- [ ] **Step 2:** Run `pnpm --filter @zod-to-form/core test -- resolve-base-props.test.ts` → FAIL (not exported).
- [ ] **Step 3: Implement**
```ts
// packages/core/src/resolve-base-props.ts
import type { FormField } from './types.js';

/**
 * Static, schema-derived base props every field's component receives,
 * identical across all zodTypes. `aria-invalid` is intentionally excluded —
 * it derives from runtime error state, so each renderer materializes it.
 */
export function resolveBaseProps(field: FormField): Record<string, unknown> {
  const props: Record<string, unknown> = { id: field.key };
  if (field.required) props['required'] = true;
  if (field.readOnly) props['readOnly'] = true;
  if (field.disabled) props['disabled'] = true;
  return props;
}
```
Export from `index.ts`: `export { resolveBaseProps } from './resolve-base-props.js';`
- [ ] **Step 4:** Run the test → PASS. Run full core suite (`pnpm --filter @zod-to-form/core test`) → green.
- [ ] **Step 5: Commit** `feat(core): add resolveBaseProps (shared static base props)`

---

## Task 2: `resolveNativeAttrs` in core

**Files:** Create `packages/core/src/resolve-native-attrs.ts`; Modify `index.ts`; Test `packages/core/tests/resolve-native-attrs.test.ts`

- [ ] **Step 1: Failing test**
```ts
import { resolveNativeAttrs } from '../src/resolve-native-attrs.js';
// field.props carries the DOM input type set by the processors (e.g. 'email','number','date')
it('extracts DOM-valid native attrs (type) from field.props', () => {
  expect(resolveNativeAttrs({ props: { type: 'email' } } as any)).toEqual({ type: 'email' });
});
it('omits non-allowlisted / internal props', () => {
  expect(resolveNativeAttrs({ props: { type: 'number', _isSet: true } } as any)).toEqual({ type: 'number' });
});
it('returns empty when no native attrs', () => {
  expect(resolveNativeAttrs({ props: {} } as any)).toEqual({});
});
```
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3: Implement** (move codegen's `NATIVE_INPUT_ATTRS` allowlist here as the canonical source):
```ts
// packages/core/src/resolve-native-attrs.ts
import type { FormField } from './types.js';

/** DOM-valid native attributes the codegen raw-input path carries; the single
 *  source so runtime + codegen agree. Extend deliberately, not blindly. */
export const NATIVE_INPUT_ATTRS = ['type'] as const;

export function resolveNativeAttrs(field: FormField): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const name of NATIVE_INPUT_ATTRS) {
    const v = field.props[name];
    if (v !== undefined && v !== null) out[name] = v;
  }
  return out;
}
```
Export from `index.ts`.
- [ ] **Step 4:** Run → PASS; full core suite green.
- [ ] **Step 5: Commit** `feat(core): add resolveNativeAttrs (canonical native-attr allowlist)`

---

## Task 3: `resolveControlMode` in core

**Files:** Create `packages/core/src/resolve-control-mode.ts`; Modify `index.ts`; Test `packages/core/tests/resolve-control-mode.test.ts`

First read how both renderers decide controlled vs uncontrolled: runtime `mapping.componentOverride?.controlled === true` (FieldRenderer ~line 814); codegen `componentOverride?.controlled` (generate.ts ~line 535). The decision is: `controlled` when the resolved component override marks it controlled; else `register`. (Native-rules mode is an optimization concern handled via register hints — Stage 1 returns `'register' | 'controller'`.)

- [ ] **Step 1: Failing test**
```ts
import { resolveControlMode } from '../src/resolve-control-mode.js';
it("returns 'controller' when the component override is controlled", () => {
  expect(resolveControlMode({ componentOverride: { controlled: true } } as any)).toBe('controller');
});
it("returns 'register' otherwise", () => {
  expect(resolveControlMode({ componentOverride: { controlled: false } } as any)).toBe('register');
  expect(resolveControlMode({} as any)).toBe('register');
});
```
- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Implement.** Read the real `ComponentOverride` type (`packages/core/src/config-types.ts` / `types.ts`) for the exact field; mirror it.
```ts
// packages/core/src/resolve-control-mode.ts
import type { ComponentOverride } from './types.js';
export type ControlMode = 'register' | 'controller';
export function resolveControlMode(mapping: { componentOverride?: ComponentOverride }): ControlMode {
  return mapping.componentOverride?.controlled === true ? 'controller' : 'register';
}
```
(Confirm the import path/name of `ComponentOverride` against the codebase before finalizing.)
- [ ] **Step 4:** PASS; core suite green.
- [ ] **Step 5: Commit** `feat(core): add resolveControlMode`

---

## Task 4: `resolveOptionsProps` in core

**Files:** Create `packages/core/src/resolve-options-props.ts`; Modify `index.ts`; Test `packages/core/tests/resolve-options-props.test.ts`

- [ ] **Step 1: Failing test**
```ts
import { resolveOptionsProps } from '../src/resolve-options-props.js';
it('passes options through when present', () => {
  const options = [{ value: 'a', label: 'A' }];
  expect(resolveOptionsProps({ options } as any)).toEqual({ options });
});
it('returns empty when no options', () => {
  expect(resolveOptionsProps({} as any)).toEqual({});
});
```
- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Implement**
```ts
// packages/core/src/resolve-options-props.ts
import type { FormField } from './types.js';
export function resolveOptionsProps(field: FormField): Record<string, unknown> {
  return field.options ? { options: field.options } : {};
}
```
Export from `index.ts`.
- [ ] **Step 4:** PASS; core suite green.
- [ ] **Step 5: Commit** `feat(core): add resolveOptionsProps`

---

## Task 5: Migrate runtime leaf rendering to the resolvers (behavior-preserving)

**Files:** Modify `packages/react/src/FieldRenderer.tsx`

- [ ] **Step 1:** Replace `buildBaseComponentProps`'s static portion with `resolveBaseProps` from core, re-adding `aria-invalid` (error state) in the renderer:
```ts
import { resolveBaseProps, resolveNativeAttrs, resolveOptionsProps } from '@zod-to-form/core';
// inside buildBaseComponentProps (keep the function name/signature):
function buildBaseComponentProps(field: FormField, errorMessage: string | undefined): Record<string, unknown> {
  return { ...resolveBaseProps(field), 'aria-invalid': errorMessage ? 'true' : 'false' };
}
```
- [ ] **Step 2:** In the uncontrolled and controlled prop assembly, replace the bare `...field.props` spread for LEAF fields with `...resolveNativeAttrs(field)` + `...resolveOptionsProps(field)`. IMPORTANT: do this ONLY where `field` is a leaf (not object/array/union — those carry `_`-prefixed internals in `field.props` that the runtime consumes downstream; leave their handling untouched in Stage 1). Guard with the existing component/zodType checks already in `FieldRenderer` so container fields keep spreading `field.props` as before.
- [ ] **Step 3:** Run the FULL react suite (`pnpm --filter @zod-to-form/react test`) — every test that passed before MUST still pass (this is behavior-preserving for leaves; `aria-invalid`/required/readOnly/disabled/type/options output must be byte-identical). If any output changed, you altered behavior — reconcile against `resolveBaseProps`/`resolveNativeAttrs` (they were extracted to match) or narrow the leaf guard.
- [ ] **Step 4:** `pnpm --filter @zod-to-form/react run typecheck` (build core first: `pnpm --filter @zod-to-form/core build`) → clean.
- [ ] **Step 5: Commit** `refactor(react): leaf FieldRenderer consumes core prop resolvers`

---

## Task 6: Migrate codegen leaf rendering to the resolvers + fix base-props divergence (#3)

**Files:** Modify `packages/codegen/src/generate.ts`, `packages/codegen/src/templates.ts`; Test `packages/codegen/tests/`

- [ ] **Step 1: Failing test** — a mapped leaf field emits the base props the runtime emits (the #3 fix: `required`/`readOnly` now appear; previously codegen dropped them):
```ts
// schema z.object({ name: z.string().min(2) }) with name mapped to a named component
// expect generated output's <Input ...> to include required (name is required) + id="name" + type from native attrs
it('mapped leaf emits resolveBaseProps + resolveNativeAttrs', () => {
  // build fields via walkSchema, generate, assert the <Input> line contains id="name", required={true}, and (for email) type="email"
});
```
- [ ] **Step 2:** FAIL (codegen currently emits only `id` + `type`, not `required`/`readOnly`).
- [ ] **Step 3: Implement.** In `renderMappedComponent`'s uncontrolled branch (generate.ts ~line 545) and the controlled branch, emit serialized `resolveBaseProps(field)` + `resolveNativeAttrs(field)` + `resolveOptionsProps(field)` (replacing the local `renderNativeInputAttrs` with `resolveNativeAttrs` from core, and adding the base props codegen previously omitted). Reuse the existing `renderLiteralProp` serializer for each attr. Keep `buildRegisterExpr`/controlled binding, `overrideProps`, `fieldPropsSpread`. Order: base + native attrs BEFORE register/fieldProps spreads (consumer/runtime props win — match React last-wins). Replace codegen's `NATIVE_INPUT_ATTRS` constant with the core export to keep one source.
- [ ] **Step 4:** Run the FULL codegen suite. Existing tests asserting old codegen leaf output (which lacked `required` etc.) will fail — update those that legitimately should now include the base props (the #3 fix), keeping unrelated assertions intact. New test passes.
- [ ] **Step 5:** `pnpm --filter @zod-to-form/codegen run type-check` (build core first) → clean.
- [ ] **Step 6: Commit** `fix(codegen): leaf components emit shared base props + native attrs (parity)`

---

## Task 7: Parity harness (acceptance gate)

**Files:** Create `packages/codegen/tests/parity.test.ts`

- [ ] **Step 1: Implement the parity test.** For a schema exercising the Stage-1 leaf types (`z.object({ name: z.string().min(2), email: z.string().email(), age: z.number().min(18).optional(), agree: z.boolean() })`), walk it (`walkSchema`), and for each leaf field assert the **codegen-emitted props** (parse the generated `<Component …>` line) are the composition `{ ...resolveBaseProps(field), ...resolveNativeAttrs(field), ...resolveOptionsProps(field) }` plus the register binding — i.e. codegen materializes exactly the shared resolution. Add a parallel assertion (or a sibling test in `packages/react/tests/`) that the runtime path builds the same composition for the same fields (assert `resolveBaseProps`/`resolveNativeAttrs` are the source both consume).
```ts
import { walkSchema, resolveBaseProps, resolveNativeAttrs, resolveOptionsProps } from '@zod-to-form/core';
import { generateFormComponent } from '@zod-to-form/codegen';
// for each leaf field: expected = { ...resolveBaseProps(f), ...resolveNativeAttrs(f), ...resolveOptionsProps(f) }
// assert every key/value in expected appears in the generated component's emitted attributes
```
- [ ] **Step 2:** Run → PASS (both renderers now pull from the resolvers, so it holds by construction; if it fails, a renderer isn't materializing the resolver output faithfully — fix that renderer).
- [ ] **Step 3:** Run full core + react + codegen suites → all green.
- [ ] **Step 4: Commit** `test(parity): assert codegen materializes the shared leaf resolvers`

---

## Task 8: Changeset

**Files:** Create `.changeset/codegen-runtime-leaf-parity.md`

- [ ] **Step 1:**
```md
---
"@zod-to-form/core": minor
"@zod-to-form/react": patch
"@zod-to-form/codegen": patch
---

Shared, zodType-keyed prop resolvers (`resolveBaseProps`, `resolveNativeAttrs`, `resolveControlMode`, `resolveOptionsProps`) now back both the runtime renderer and codegen for leaf fields, so generated components and `<ZodForm>` produce identical component props. Fixes codegen leaf components previously omitting `required`/`readOnly` (base-props divergence). Structural fields (object/array/union) are migrated in follow-up releases.
```
- [ ] **Step 2: Commit** `chore: changeset for leaf-field codegen↔runtime parity`

---

## Self-Review

- **Spec coverage:** resolvers `resolveBaseProps` (T1), `resolveNativeAttrs` (T2), `resolveControlMode` (T3), `resolveOptionsProps` (T4); runtime migration (T5); codegen migration + #3 base-props fix (T6); parity harness (T7); changeset (T8). The spec's later structural stages (fieldset/array/union/custom) are explicitly out of Stage-1 scope. `resolveControlMode` is added (T3) but its full integration into both renderers' controlled/uncontrolled branch selection is deferred to where it's needed — Stage 1 keeps the existing control-mode checks and just makes the prop *composition* shared; note this so a later task wires `resolveControlMode` in. Covered with that caveat.
- **Placeholders:** code steps carry real code; the two "confirm against the codebase" notes (ComponentOverride import path in T3; which existing codegen tests to update in T6) point at exact locations to verify, not invented APIs.
- **Type consistency:** `resolveBaseProps`/`resolveNativeAttrs`/`resolveOptionsProps` return `Record<string, unknown>`; `resolveControlMode` returns `ControlMode`; names consistent across T5–T7 and the parity test.

## Risks / notes
- Behavior-preserving for leaves EXCEPT the deliberate #3 fix (codegen now emits `required`/`readOnly`). Existing codegen tests asserting the old output must be updated (T6 Step 4) — that's expected, not a regression.
- `resolveControlMode` (T3) is built but only lightly wired in Stage 1 (the prop *composition* is the parity win); fully routing control-mode selection through it is a clean follow-up (flag in the next stage's plan).
- `field.props` on container fields carries `_`-prefixed internals the runtime consumes — Stage 1's leaf guard (T5 Step 2) must NOT touch container handling; that's why structural kinds are separate stages.
- CI/merge blocked by the GitHub account suspension; execute locally, validate/merge on reinstatement.
