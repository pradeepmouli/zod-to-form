# Implementation Plan: API Surface Cleanup

**Branch**: `005-api-surface-cleanup` | **Date**: 2026-03-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-api-surface-cleanup/spec.md`

## Summary

Simplify the z2f API surface by merging `propMap` into `props`, removing `gridColumn` and `sectionComponents`, adding `fieldTemplate` support with preset defaults, enabling object field component dispatch, achieving zero-dependency codegen eject, and adding `disabled`/`helpText`/`deprecated` field properties. This is a breaking change that reduces configuration concepts while increasing customization power.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Zod v4 (peer), React 18+ (peer), React Hook Form 7+ (peer), @hookform/resolvers
**Storage**: N/A (library)
**Testing**: Vitest
**Target Platform**: Browser (React applications)
**Project Type**: Library (monorepo: core, react, cli/codegen)
**Performance Goals**: N/A (library — no runtime perf regression)
**Constraints**: Zero runtime dependencies on z2f in generated code (Constitution Principle IV)
**Scale/Scope**: 3 packages affected, ~10 files modified, ~19 functional requirements

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Zod-Native Architecture | PASS | No schema representation changes. All changes are at the config/renderer/codegen layer. |
| II. Processor Registry Pattern | PASS | Processors unchanged. Walker gains `deprecated`, `disabled`, `helpText` population — additive only. |
| III. Dual-Mode Output | PASS | Both runtime and codegen consume the same `FormField[]` IR. Field template is mode-specific (React component for runtime, emitted file for codegen). |
| IV. Zero Unnecessary Dependencies | PASS | Zero-dep eject (FR-011/012/013) directly strengthens this principle. No new dependencies added. |
| V. Test-First Development | PASS | Each change area has clear acceptance scenarios suitable for TDD. |
| VI. Type Safety First | PASS | `FieldConfigBase`, `ComponentOverride`, `FormField` type changes are additive/subtractive with no `any` casts. Field expression detection is string-literal typed. |
| VII. Accessibility by Default | PASS | `disabled` attribute improves accessibility. `helpText` adds a second description channel. `deprecated` adds informational indicator. Field template preserves label/description/error structure. |

No violations. No complexity tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/005-api-surface-cleanup/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── field-config.ts  # FieldConfigBase contract
│   ├── component-override.ts  # ComponentOverride contract
│   ├── components-config.ts   # ComponentsConfig contract
│   ├── form-field.ts          # FormField IR contract
│   └── field-template.ts      # FieldTemplateProps contract
├── checklists/
│   └── requirements.md  # Quality checklist
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
packages/
├── core/
│   └── src/
│       ├── types.ts          # FieldConfigBase, FormField, FieldConfigExtras (MODIFY)
│       ├── config.ts         # ComponentOverride, ComponentsConfig, presets, defineConfig (MODIFY)
│       ├── normalize.ts      # normalizeFormValues (READ ONLY — inline in codegen)
│       └── walker.ts         # processField — populate deprecated/disabled/helpText (MODIFY)
├── react/
│   └── src/
│       ├── FieldRenderer.tsx # applyPropMap, resolvePropMap, FieldsetBlock, field template (MODIFY)
│       ├── ZodForm.tsx       # SectionRenderer, section resolution (MODIFY)
│       └── components/
│           └── index.ts      # defaultComponentMap (READ ONLY)
└── codegen/
    └── src/
        ├── generate.ts       # generateFormComponent, renderFieldContainer (MODIFY)
        ├── templates.ts      # getFileHeader, imports (MODIFY)
        └── config-template.ts # buildConfigSource (MODIFY)
```

**Structure Decision**: Existing monorepo structure. No new packages or directories needed at the package level. Changes span all three packages (core types, react renderer, codegen).

## Implementation Phases

### Phase 1: Core Type Changes (P1 — foundation for everything else)

**Scope**: `packages/core/src/types.ts`, `packages/core/src/config.ts`

1. **FieldConfigBase**: Remove `propMap` and `gridColumn`. Add `disabled?: boolean` and `helpText?: string`. `props` remains unchanged.
2. **ComponentOverride**: Remove `propMap`. Add `props?: Record<string, unknown>`. The `props` values that match field expressions are resolved at render/codegen time, not at the type level.
3. **ComponentsConfig**: Add `fieldTemplate?: string`.
4. **FormField IR**: Remove `gridColumn`. Add `deprecated?: boolean`, `disabled?: boolean`, `helpText?: string`.
5. **Preset definitions**: Update `SHADCN_OVERRIDES` to use `props` instead of `propMap`:
   - `Select: { controlled: true, props: { onValueChange: 'field.onChange' } }`
   - `Checkbox: { controlled: true, props: { checked: 'field.value', onCheckedChange: 'field.onChange' } }`
   - `Switch: { controlled: true, props: { checked: 'field.value', onCheckedChange: 'field.onChange' } }`
6. **defineConfig**: Add `fieldTemplate` merge logic. Preset provides default template; explicit `fieldTemplate` overrides.
7. **FormPrimitivesConfig**: Remove entirely from `config.ts` — subsumed by `fieldTemplate` (see research.md D7).
8. **RuntimeComponentConfig**: Remove `sectionComponents` property (section components now resolve from `componentModule`).
9. **Walker**: In `processField` / `resolveMetadata`, populate `deprecated` from `z.globalRegistry`, populate `disabled` and `helpText` from field config.

**Tests**: Unit tests for each type change — verify removed keys produce type errors, new keys are accepted, preset definitions resolve correctly.

### Phase 2: Renderer Changes (P1+P2 — unified props, field template, fieldset dispatch)

**Scope**: `packages/react/src/FieldRenderer.tsx`, `packages/react/src/ZodForm.tsx`

1. **Merge propMap into props resolution**:
   - Refactor `applyPropMap` → `resolveProps`. Instead of a separate `propMap` parameter, scan the merged `props` object for values matching the known field expression set (`field.value`, `field.onChange`, `field.onBlur`, `field.ref`, `field.name`). Resolve matches from the RHF controller field; pass everything else through as literals.
   - Merge order: spread preset override `props`, then spread field config `props` (FR-019: shallow merge, field config wins).
   - Remove `resolvePropMap` function entirely.

2. **Remove gridColumn rendering**:
   - Remove all `style={{ gridColumn: field.gridColumn }}` patterns from `FieldRenderer`, `FieldsetBlock`, `ArrayBlock`, `DiscriminatedUnionBlock`.
   - Field-level `props.style` and `props.className` are now passed through to the wrapper element.

3. **Field template extraction**:
   - Define `FieldTemplateProps` interface: `{ children: ReactNode, label: string, description?: string, helpText?: string, error?: string, name: string, deprecated?: boolean }`.
   - Extract the hardcoded field composition (lines ~469-477) into a `DefaultFieldTemplate` component.
   - `FieldRenderer` resolves the template: explicit `fieldTemplate` from config → preset default → `DefaultFieldTemplate` fallback.
   - Pass `disabled` through to the rendered input component as a prop.
   - **Field template imports (codegen)**: Each preset declares which form primitive components its default template requires (e.g., shadcn needs `FormField`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage`). CLI init discovery scans the component source for these names (similar to the removed `discoverFormPrimitives` but driven by the preset definition). Codegen emits imports for the template's required components alongside field component imports.

4. **FieldsetBlock component dispatch**:
   - When `FieldConfig.component` is set for an object-type field, resolve the component from `componentModule` instead of hardcoding `<fieldset><legend>`.
   - Fall back to default `<fieldset><legend>` when no component override exists (FR-010).
   - Emit console warning if specified component not found in module.

5. **Remove sectionComponents**:
   - `RuntimeComponentConfig`: Remove `sectionComponents` property.
   - `SectionRenderer` in `ZodForm.tsx`: Resolve section components from `componentModule` instead of `sectionComponents` map.

**Tests**: Integration tests for each renderer change — controlled component with unified props, custom field template rendering, object field with custom component, section resolution from componentModule.

### Phase 3: Codegen Changes (P1 — zero-dep eject)

**Scope**: `packages/codegen/src/generate.ts`, `packages/codegen/src/templates.ts`, `packages/codegen/src/config-template.ts`

1. **Remove z2f imports from generated code**:
   - `getFileHeader` / import generation: Remove `@zod-to-form/core` and `@zod-to-form/react` imports entirely.
   - For shadcn preset: Don't emit `normalizeFormValues` — controlled components handle types natively.
   - For html preset: Inline `normalizeFormValues` (~30 lines from `packages/core/src/normalize.ts`) directly in the generated file.
   - For both: Inline `StripIndexSignature` type utility as a local type alias in the generated file.

2. **Remove gridColumn from codegen**:
   - Remove `style={{ gridColumn: '${field.gridColumn}' }}` emission from `renderFieldBlockWithConfig` and `renderFieldContainer`.

3. **Emit field template file**:
   - When generating a form, also emit the preset's default field template as a concrete `.tsx` file alongside the generated form.
   - The generated form imports from this local template file, not from z2f.
   - Codegen reads the preset template content from a known registry of string constants (one per preset) embedded in the codegen package — not from the runtime `packages/react/src/templates/` files at build time.

4. **Update propMap codegen**:
   - `renderFieldBlockWithConfig`: Adapt controlled component code to resolve field expressions from `props` instead of a separate `propMap`.

5. **Update config-template**:
   - `buildConfigSource`: Emit `fieldTemplate` in components block. Remove `propMap` from overrides. Emit `props` instead.

6. **Remove formPrimitives from codegen**:
   - Remove `formPrimitives` handling from `renderFieldContainer` and `buildConfigSource` (subsumed by field template).

**Tests**: Snapshot tests for generated code — verify no z2f imports, verify inlined utilities, verify field template file emission.

### Phase 4: Polish & Deprecated Fields (P3 — small additions)

**Scope**: Cross-cutting across all three packages.

1. **`disabled` rendering**: Pass `disabled` attribute to input elements in both renderer and codegen.
2. **`helpText` rendering**: Render below input in field template (distinct from `description` below label).
3. **`deprecated` indicator**: Render visual indicator (e.g., strikethrough on label, warning text) in field template when `deprecated` is true.
4. **Runtime validation**: Add console warnings when removed keys (`propMap`, `gridColumn`, `sectionComponents`) are detected in config objects.

**Tests**: Unit tests for each new field property rendering.

## Build Sequence

```
Phase 1 (core types)
  ↓ types compile
Phase 2 (renderer) ←── depends on Phase 1 types
  ↓ runtime tests pass
Phase 3 (codegen) ←── depends on Phase 1 types
  ↓ codegen tests pass + generated files compile
Phase 4 (polish) ←── depends on Phases 2+3
  ↓ all tests pass + type-check + lint
```

Phases 2 and 3 can be developed in parallel after Phase 1 completes.
