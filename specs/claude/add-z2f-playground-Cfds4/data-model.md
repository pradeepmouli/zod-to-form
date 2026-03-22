# Data Model: Z2F Studio — Interactive Playground

**Date**: 2026-03-19

## Entities

### PlaygroundState

Central state for the playground session. Managed in React state and persisted to localStorage.

| Field | Type | Description |
|-------|------|-------------|
| `editorContent` | `string` | Raw TypeScript source code in the editor |
| `componentMap` | `'default' \| 'shadcn'` | Active component map for form rendering |
| `activeTab` | `'preview' \| 'inspect'` | Active output tab (within the preview pane) |
| `activePane` | `'editor' \| 'preview'` | Active pane on narrow screens |
| `inspectOpen` | `boolean` | Whether the IR inspect panel is visible |
| `resultsOpen` | `boolean` | Whether the submit results panel is visible |
| `lastValidSchema` | `ZodType \| null` | Last successfully evaluated Zod schema (not persisted) |
| `lastValidFields` | `FormField[] \| null` | Last successfully walked FormField[] IR (not persisted) |
| `evaluationError` | `EvaluationError \| null` | Current transpile/evaluate error (not persisted) |
| `submitResult` | `SubmitResult \| null` | Last form submission result (not persisted) |
| `config` | `PlaygroundConfig \| null` | Imported z2f.config settings |

**Persistence**: `editorContent`, `componentMap`, `activeTab`, `config` are saved to `localStorage` under key `z2f-playground-state`. Transient fields (`lastValidSchema`, `evaluationError`, etc.) are not persisted.

**State Transitions**:
```
[Initial Load]
  → Check URL hash for shared state
    → Found: decode & restore editorContent
    → Not found: check localStorage
      → Found: restore persisted state
      → Not found: load starter schema

[Editor Change]
  → debounce(300ms)
    → transpile(TS → JS)
      → Success: evaluate(JS → ZodType)
        → Success: walkSchema(schema → FormField[])
          → Update lastValidSchema, lastValidFields, clear error
        → Error: set evaluationError, retain lastValidFields
      → Error: set evaluationError (syntax), retain lastValidFields
    → persist editorContent to localStorage
```

---

### EvaluationError

Represents a transpilation or evaluation error to display to the user.

| Field | Type | Description |
|-------|------|-------------|
| `type` | `'syntax' \| 'runtime' \| 'timeout' \| 'import'` | Error category |
| `message` | `string` | Human-readable error message |
| `line` | `number \| undefined` | Source line number (from Sucrase or stack trace) |
| `column` | `number \| undefined` | Source column number |

---

### SubmitResult

Result from submitting the rendered preview form.

| Field | Type | Description |
|-------|------|-------------|
| `success` | `boolean` | Whether Zod validation passed |
| `data` | `Record<string, unknown> \| null` | Parsed output from `z.parse()` on success |
| `errors` | `FieldError[] \| null` | Validation errors on failure |
| `timestamp` | `number` | When the submission occurred |

---

### ExampleSchema

A curated example bundled with the playground.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier (e.g., `'registration-form'`) |
| `title` | `string` | Display name (e.g., `'User Registration'`) |
| `description` | `string` | Brief explanation of what the example demonstrates |
| `category` | `'basic' \| 'advanced' \| 'patterns'` | Grouping category |
| `source` | `string` | TypeScript source code for the schema |
| `tags` | `string[]` | Searchable tags (e.g., `['nested', 'validation', 'enum']`) |

**Initial Examples** (5 minimum per SC-004):
1. `registration-form` — basic: string, email, password with constraints
2. `settings-page` — basic: booleans, enums, optional fields
3. `contact-form` — basic: textarea, select, required fields
4. `nested-address` — advanced: nested objects, arrays
5. `multi-field-wizard` — patterns: sections, field ordering, metadata

---

### PlaygroundConfig

Represents an imported or active z2f.config for the playground session.

| Field | Type | Description |
|-------|------|-------------|
| `components` | `ComponentsConfig` | Component source and overrides (from `@zod-to-form/core`) |
| `fields` | `Record<string, FieldConfig>` | Per-field configuration overrides |
| `defaults` | `ConfigDefaults \| undefined` | Default field settings |

This aligns with the existing `ZodFormsConfig` type from `@zod-to-form/core`. Validation uses `validateConfig()`.

---

### ShareState

Encoded state for URL sharing.

| Field | Type | Description |
|-------|------|-------------|
| `code` | `string` | lz-string compressed editor content |
| `map` | `'default' \| 'shadcn'` | Component map selection |
| `tab` | `'preview' \| 'inspect'` | Active tab |

**Encoding**: `#code=<lz>&map=<value>&tab=<value>` in URL hash fragment.

## Relationships

```
PlaygroundState
  ├── has one ──▶ EvaluationError (nullable, transient)
  ├── has one ──▶ SubmitResult (nullable, transient)
  ├── has one ──▶ PlaygroundConfig (nullable, persisted)
  ├── produces ──▶ FormField[] (via walkSchema, transient)
  └── serializes to ──▶ ShareState (for URL sharing)

ExampleSchema
  └── loads into ──▶ PlaygroundState.editorContent
```

## Validation Rules

| Entity | Rule | Source |
|--------|------|--------|
| PlaygroundState.editorContent | Max 50,000 characters | Edge case: large schemas |
| ShareState.code | Warn if compressed > 2,000 chars | FR-009 / SC-005 |
| PlaygroundConfig | Must pass `validateConfig()` | FR-020 |
| EvaluationError.line | Must be ≥ 1 if present | Internal consistency |
| ExampleSchema.source | Must be valid TypeScript that evaluates to a ZodType | SC-004 |
