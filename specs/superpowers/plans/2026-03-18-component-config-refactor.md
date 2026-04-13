# Component Config Refactor Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate `fieldType`/`fieldTypes` indirection by renaming `FieldConfig.fieldType` to `FieldConfig.component`, replacing the `fieldTypes` map with a `components` object containing `source`, `preset`, and strongly-typed `overrides`, and removing the redundant `ComponentEntry.component` property.

**Architecture:** The `components` config field expands from a plain string (import path) to `ComponentsConfig<T>` with `source` (import path), optional `preset`, and `overrides` (strongly typed to `keyof T`). Overrides only contain non-default metadata (`controlled`, `propMap`). Processors set `field.component` directly; codegen imports any PascalCase component name from `components.source`. The `ComponentEntry` type is replaced by `ComponentOverride`.

**Tech Stack:** TypeScript 5.x strict, Zod v4, React 18+, React Hook Form 7+, Vitest, pnpm monorepo

---

## File Map

### Core package (`packages/core/src/`)
| File | Action | Responsibility |
|------|--------|---------------|
| `types.ts` | Modify | `FieldConfigBase.fieldType` → `component` (already done in prior edit) |
| `config.ts` | **Rewrite** | New `ComponentOverride`, `ComponentsConfig<T>` types; remove `ComponentEntry.component` property; `ZodFormsConfig.fieldTypes` → `ZodFormsConfig.components: ComponentsConfig<T>`; presets produce override maps; validation schema update; error messages |
| `processors/string.ts` | Modify | `meta?.fieldType?.toLowerCase()` → `meta?.component ?? 'Input'` |
| `processors/boolean.ts` | Modify | Same pattern → `meta?.component ?? 'Checkbox'` |
| `register.ts` | Modify | JSDoc examples: `fieldType:` → `component:` |
| `index.ts` | Modify | Exports: remove `ComponentEntry` if unused, export `ComponentOverride`, `ComponentsConfig` |

### React package (`packages/react/src/`)
| File | Action | Responsibility |
|------|--------|---------------|
| `FieldRenderer.tsx` | Modify | `RuntimeComponentConfig.fieldTypes` → use `components.overrides`; `override.fieldType` → `override.component`; component resolution uses `field.component` as key into overrides |
| `useZodForm.ts` | Modify | Already mostly done; ensure `FieldConfig.component` references are correct |
| `ZodForm.tsx` | Modify | Pass `componentConfig.fields` using new property names |

### CLI package (`packages/cli/src/`)
| File | Action | Responsibility |
|------|--------|---------------|
| `codegen.ts` | Modify | `resolveFieldMapping` rewrite: look up `components.overrides[componentName]` for controlled/propMap; `componentConfig.components` (string) → `componentConfig.components.source`; remove `source: 'fieldTypes'` |
| `init.ts` | Modify | Generate new config structure: `components: { source, preset, overrides }` instead of `components: string` + `fieldTypes: {...}` |
| `index.ts` | Modify | Exports update |

### Tests (all `**/tests/`)
| File | Action |
|------|--------|
| `core/tests/config.test.ts` | Rewrite config objects: `fieldTypes: {...}` → `components: { source, componentMap }` → `components: { source, overrides }` |
| `core/tests/component-config-types.test.ts` | Update type test fixtures |
| `core/tests/metadata.test.ts` | `fieldType` → `component` in registry metadata |
| `core/tests/register.test.ts` | `fieldType` → `component` everywhere |
| `core/tests/processors/object.test.ts` | `fieldType` → `component` in registry |
| `react/tests/useZodForm.test.ts` | `fieldType` → `component` |
| `react/tests/ZodForm.test.tsx` | `fieldType` → `component` |
| `react/tests/FieldRenderer.test.tsx` | `fieldTypes` → `components.overrides`, `fieldType` → `component` |
| `cli/tests/config.test.ts` | Config structure update |
| `cli/tests/codegen.test.ts` | `fieldType` → `component`, `fieldTypes` → `components.overrides` |
| `cli/tests/loader.test.ts` | Config fixture update |
| `cli/tests/init.test.ts` | Generated config assertions |
| `cli/tests/integration/cli-e2e.test.ts` | Config fixture update |

### Other
| File | Action |
|------|--------|
| `registry/zod-form-cli.ts` | Update to new config shape |
| `registry/zod-form.tsx` | Update if references `fieldTypes` |

---

## New Types (End State)

```typescript
// ─── Component Override ───────────────────────────────────────
/** Per-component metadata override. Only components that differ from defaults need an entry. */
export type ComponentOverride = {
  /** When true, use Controller/useController instead of register() spread */
  controlled?: boolean;
  /** Map RHF field props to component-specific prop names */
  propMap?: Record<string, string>;
};

// ─── Components Config ────────────────────────────────────────
export type ComponentPreset = 'shadcn' | 'unstyled';

export type ComponentsConfig<T extends Record<string, unknown> = Record<string, unknown>> = {
  /** Import path for the components module */
  source: string;
  /** Preset that provides base overrides */
  preset?: ComponentPreset;
  /** Per-component overrides, strongly typed to module keys */
  overrides?: { [K in keyof T & string]?: ComponentOverride };
};

// ─── ZodFormsConfig (changed fields only) ─────────────────────
export type ZodFormsConfig<TComponents, TSchemas> = {
  components: ComponentsConfig<TComponents>;  // was: components: string + fieldTypes: Record<string, ComponentEntry>
  // preset?: ... REMOVED (moved into components)
  // fieldTypes: ... REMOVED (replaced by components.overrides)
  // ... rest unchanged
};
```

### FieldConfig (already done)
```typescript
type FieldConfigBase = {
  component?: string;  // was: fieldType?: string
  // ... rest unchanged
};
```

### Processor simplification
```typescript
// string.ts — BEFORE:
const fieldType = meta?.fieldType?.toLowerCase();
field.component = fieldType === 'textarea' ? 'Textarea' : 'Input';

// string.ts — AFTER:
field.component = meta?.component ?? 'Input';

// boolean.ts — BEFORE:
const fieldType = meta?.fieldType?.toLowerCase();
field.component = fieldType === 'switch' ? 'Switch' : 'Checkbox';

// boolean.ts — AFTER:
field.component = meta?.component ?? 'Checkbox';
```

### Codegen resolution (new logic)
```typescript
// resolveFieldMapping — BEFORE:
// 1. Check config.fields[key].fieldType → config.fieldTypes[fieldType]
// 2. Check config.fieldTypes[field.component]

// resolveFieldMapping — AFTER:
// 1. Check config.fields[key].component for override
// 2. Component name = override.component ?? field.component
// 3. Look up config.components.overrides[componentName] for controlled/propMap
```

### Preset maps (end state)
```typescript
export const SHADCN_OVERRIDES: Record<string, ComponentOverride> = {};
// shadcn has NO controlled components by default — all use register()

export const DEFAULT_OVERRIDES: Record<string, ComponentOverride> = {};
// same — no controlled components by default
```
Note: The current shadcn preset entries (`Input: { component: 'Input' }`, etc.) have ZERO non-redundant data. After removing `ComponentEntry.component`, the presets become empty objects. The preset concept may be removable entirely in a follow-up, but for now we keep the type for future use.

---

## Chunk 1: Core Types + Config + Processors

### Task 1: Core types and config restructure

**Files:**
- Modify: `packages/core/src/types.ts` (already done: `fieldType` → `component`)
- Modify: `packages/core/src/config.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Rewrite config.ts**

Replace `ComponentEntry.component` with new `ComponentOverride` type. Replace `ZodFormsConfig.fieldTypes` with `ZodFormsConfig.components: ComponentsConfig<T>`. Move `preset` from top-level into `ComponentsConfig`. Update validation schemas, error messages, preset maps, and `defineConfig` function.

Key changes:
- `ComponentEntry` → `ComponentOverride` (remove `component` and `render` properties)
- `ZodFormsConfig.components: string` → `ZodFormsConfig.components: ComponentsConfig<T>`
- `ZodFormsConfig.fieldTypes` → removed (absorbed into `components.overrides`)
- `ZodFormsConfig.preset` → removed (moved into `components.preset`)
- `SHADCN_FIELD_TYPES` → `SHADCN_OVERRIDES: Record<string, ComponentOverride>` (empty — no overrides needed)
- `DEFAULT_FIELD_TYPES` → `DEFAULT_OVERRIDES: Record<string, ComponentOverride>` (empty)
- `FieldTypePreset` → `ComponentPreset`
- `defineConfig` merges `overrides` from preset into `components.overrides`
- Validation schema: `configSchema` gets `components` as object with `source`, `preset`, `overrides`

- [ ] **Step 2: Update core/src/index.ts exports**

Remove `ComponentEntry` export, add `ComponentOverride`, `ComponentsConfig` exports.

- [ ] **Step 3: Run type-check**

Run: `pnpm run type-check`
Expected: Failures in downstream packages (react, cli) that still reference old types — that's OK, we'll fix those next.

### Task 2: Processor simplification

**Files:**
- Modify: `packages/core/src/processors/string.ts`
- Modify: `packages/core/src/processors/boolean.ts`

- [ ] **Step 1: Simplify string processor**

Replace:
```typescript
const fieldType = meta?.fieldType?.toLowerCase();
field.component = fieldType === 'textarea' ? 'Textarea' : 'Input';
```
With:
```typescript
field.component = meta?.component ?? 'Input';
```

- [ ] **Step 2: Simplify boolean processor**

Replace:
```typescript
const fieldType = meta?.fieldType?.toLowerCase();
field.component = fieldType === 'switch' ? 'Switch' : 'Checkbox';
```
With:
```typescript
field.component = meta?.component ?? 'Checkbox';
```

### Task 3: Register.ts JSDoc update

**Files:**
- Modify: `packages/core/src/register.ts`

- [ ] **Step 1: Replace all `fieldType:` with `component:` in JSDoc examples and test fixtures**

### Task 4: Core tests

**Files:**
- Modify: `packages/core/tests/config.test.ts`
- Modify: `packages/core/tests/component-config-types.test.ts`
- Modify: `packages/core/tests/metadata.test.ts`
- Modify: `packages/core/tests/register.test.ts`
- Modify: `packages/core/tests/processors/object.test.ts`

- [ ] **Step 1: Update all `fieldType:` → `component:` in test fixtures**
- [ ] **Step 2: Update all config objects from `{ components: '...', fieldTypes: {...} }` to `{ components: { source: '...', overrides: {...} } }`**
- [ ] **Step 3: Update assertions that check error messages containing `fieldType` or `fieldTypes`**
- [ ] **Step 4: Run core tests**

Run: `cd packages/core && pnpm test -- --run`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/
git commit -m "refactor: replace fieldType/fieldTypes with component/components.overrides in core"
```

---

## Chunk 2: React Package

### Task 5: FieldRenderer.tsx refactor

**Files:**
- Modify: `packages/react/src/FieldRenderer.tsx`

- [ ] **Step 1: Update RuntimeComponentConfig type**

Replace:
```typescript
fieldTypes: Record<string, RuntimeComponentEntry>;
```
With something that uses `components.overrides` pattern. The runtime config becomes:
```typescript
export type RuntimeComponentConfig = {
  components: {
    source: string;
    overrides?: Record<string, ComponentOverride>;
  };
  componentModule?: Record<string, unknown>;
  fields?: Record<string, FieldConfig>;
  sectionComponents?: Record<string, ComponentType<{ fields: string[] }>>;
};
```

- [ ] **Step 2: Update resolveFieldOverride**

Change from looking up `componentConfig.fieldTypes[override.fieldType]` to looking up `componentConfig.components.overrides?.[componentName]`.

- [ ] **Step 3: Update component resolution logic**

The `resolveConfiguredComponent` function currently uses `entry.render` and `entry.component` from `ComponentEntry`. With the new model:
- Component name comes from `field.component` directly
- `controlled` and `propMap` come from `components.overrides[field.component]`
- `render` (lazy loading) is removed from overrides — runtime uses `componentModule` directly

### Task 6: React tests

**Files:**
- Modify: `packages/react/tests/useZodForm.test.ts`
- Modify: `packages/react/tests/ZodForm.test.tsx`
- Modify: `packages/react/tests/FieldRenderer.test.tsx`

- [ ] **Step 1: Update all `fieldType:` → `component:` in test fixtures**
- [ ] **Step 2: Update all `fieldTypes:` → `components: { source, overrides }` in runtime config fixtures**
- [ ] **Step 3: Run react tests**

Run: `cd packages/react && pnpm test -- --run`
Expected: ALL PASS

- [ ] **Step 4: Commit**

```bash
git add packages/react/
git commit -m "refactor: replace fieldType/fieldTypes with component/components.overrides in react"
```

---

## Chunk 3: CLI Package

### Task 7: codegen.ts refactor

**Files:**
- Modify: `packages/cli/src/codegen.ts`

- [ ] **Step 1: Rewrite resolveFieldMapping**

New logic:
1. Check `config.fields[fieldKey]` for per-field override
2. Component name = `override?.component ?? field.component`
3. Look up `config.components.overrides?.[componentName]` for `controlled`/`propMap`
4. Return `{ componentName, override, controlled, propMap }`

- [ ] **Step 2: Update component import path**

Change `config.componentConfig.components` (was string) → `config.componentConfig.components.source`

- [ ] **Step 3: Update all `entry.component` → use component name directly**
- [ ] **Step 4: Update `getMappedFieldComponent`, `collectMappedComponentNames`, `hasControlledFields`**

### Task 8: init.ts refactor

**Files:**
- Modify: `packages/cli/src/init.ts`

- [ ] **Step 1: Update `buildConfigTemplate` to emit new config shape**

Change from:
```
components: '...',
preset: 'shadcn',
fieldTypes: {
  Input: { component: 'Input' },
  ...
}
```
To:
```
components: {
  source: '...',
  preset: 'shadcn',
  overrides: {
    Select: { controlled: true },
    ...
  }
}
```

Only emit overrides for components that have non-default metadata (controlled: true, propMap).

### Task 9: CLI index.ts and tests

**Files:**
- Modify: `packages/cli/src/index.ts`
- Modify: `packages/cli/tests/config.test.ts`
- Modify: `packages/cli/tests/codegen.test.ts`
- Modify: `packages/cli/tests/loader.test.ts`
- Modify: `packages/cli/tests/init.test.ts`
- Modify: `packages/cli/tests/integration/cli-e2e.test.ts`
- Modify: `packages/cli/tests/component-config-types.test.ts`

- [ ] **Step 1: Update CLI index.ts exports**
- [ ] **Step 2: Update all test config fixtures**
- [ ] **Step 3: Run CLI tests**

Run: `cd packages/cli && pnpm test -- --run`
Expected: ALL PASS

- [ ] **Step 4: Commit**

```bash
git add packages/cli/
git commit -m "refactor: replace fieldType/fieldTypes with component/components.overrides in cli"
```

---

## Chunk 4: Registry + Final Verification

### Task 10: Registry examples

**Files:**
- Modify: `registry/zod-form-cli.ts`
- Modify: `registry/zod-form.tsx` (if applicable)

- [ ] **Step 1: Update config to new shape**

### Task 11: Full verification

- [ ] **Step 1: Run all tests**

Run: `pnpm test -- --run`
Expected: ALL PASS

- [ ] **Step 2: Run type-check**

Run: `pnpm run type-check`
Expected: CLEAN

- [ ] **Step 3: Final commit**

```bash
git add .
git commit -m "refactor: complete fieldType/fieldTypes → component/components.overrides migration"
```
