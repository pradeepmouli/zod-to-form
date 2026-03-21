# Data Model: Studio Layout Redesign

**Feature**: 004-studio-layout-redesign | **Date**: 2026-03-20

## Entities

### PlaygroundState (Modified)

Existing entity with new fields for the redesigned layout.

| Field | Type | New? | Description |
|-------|------|------|-------------|
| editorContent | `string` | No | Schema source code |
| componentMap | `"default" \| "shadcn"` | No | Active component theme |
| activeTab | `"preview" \| "inspect" \| "code"` | No | Right-top pane active tab |
| activePane | `"editor" \| "preview"` | No | Mobile pane selector |
| lastValidFields | `FormField[] \| null` | No | Last successful evaluation |
| evaluationError | `EvaluationError \| null` | No | Current eval error |
| submitResult | `SubmitResult \| null` | No | Last form submission |
| config | `PlaygroundConfig \| null` | No | z2f.config object |
| customComponents | `Record<string, string> \| null` | No | Custom component sources |
| configTab | `ConfigTab` | **Yes** | Active config sub-tab |
| codeOutputMode | `CodeOutputMode` | **Yes** | Active code output mode |
| paneSizes | `PaneSizes` | **Yes** | Resizable pane proportions |

### ConfigTab (New)

Discriminant for config pane sub-view.

```typescript
type ConfigTab = "form" | "ts";
```

Default: `"form"`

### CodeOutputMode (New)

Discriminant for code output pane mode.

```typescript
type CodeOutputMode = "react" | "cli";
```

Default: `"react"`

### PaneSizes (New)

Pane proportion state for resizable quadrants. Values are percentages (0-100).

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| verticalSplit | `number` | 50 | Left/right column split (% left) |
| leftHorizontalSplit | `number` | 50 | Schema/config split (% top) |
| rightHorizontalSplit | `number` | 50 | Preview/code split (% top) |

Persisted to localStorage alongside existing state.

### DynamicConfigSchema (New — Runtime)

Not a stored entity. Generated at runtime from the user's Zod schema.

For each top-level field `fieldName` in the user's schema, generates a config entry:

```typescript
z.object({
  [fieldName]: z.object({
    component: z.enum(["Input", "Textarea", "Select", ...]).optional(),
    label: z.string().optional(),
    placeholder: z.string().optional(),
    order: z.number().optional(),
    hidden: z.boolean().optional(),
    gridColumn: z.string().optional(),
  })
}).partial()
```

### ExportPayload (New — Transient)

Not stored. Constructed at export time.

| Field | Type | Description |
|-------|------|-------------|
| configTs | `string` | Serialized `defineConfig(...)` TypeScript code |
| hasCustomComponents | `boolean` | Auto-detect flag |
| customComponentSources | `Record<string, string> \| null` | TSX source files |
| shadcnConfig | `object \| null` | Component mappings for shadcn |
| readme | `string \| null` | Instructions for `npx shadcn` (when no custom components) |

## State Transitions

### Config Pane Sync (Bidirectional)

```
Form Edit → serialize to TS → update .ts view → apply config → re-render preview
.ts Edit  → parse TS       → update Form view → apply config → re-render preview
```

**Error state**: If .ts code has syntax errors, Form view shows parse error banner and retains last valid state.

### Schema Change → Config Update

```
Schema change → walkSchema() → new FormField[]
                             → derive new config schema
                             → drop orphaned overrides (FR-014)
                             → re-render config Form
```

### Export Flow

```
Export click → read current config state
            → serialize as defineConfig(...) TS
            → if customComponents loaded:
                → zip(config.ts + component sources + CSS + shadcn config)
                → download .zip
            → else:
                → zip(config.ts + shadcn config + README.md)
                → download .zip
```

## Relationships

```
PlaygroundState
├── config: PlaygroundConfig ──→ derives ExportPayload.configTs
├── customComponents ──→ determines ExportPayload.hasCustomComponents
├── configTab ──→ controls ConfigPane sub-view
├── codeOutputMode ──→ controls CodeOutput display
└── paneSizes ──→ controls quadrant dimensions

User Schema (editorContent)
├── walkSchema() ──→ FormField[]
├── derives DynamicConfigSchema
└── FormField[] ──→ CodeOutput (react mode: existing, cli mode: generateFormComponent)
```
