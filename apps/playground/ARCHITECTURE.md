# Z2F Studio — Playground Architecture

## Overview

Z2F Studio is an interactive browser-based playground for `zod-to-form`. Developers write Zod v4 schemas in a code editor and see live `<ZodForm>` previews rendered with real UI components from any shadcn-compatible registry.

**Stack:** Vite + React SPA, Tailwind CSS v4, CodeMirror 6, sucrase (in-browser TSX transpilation)

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Browser (SPA)                         │
│                                                              │
│  ┌─────────────┐    ┌──────────────┐    ┌────────────────┐  │
│  │ CodeMirror  │    │  FormPreview │    │  CodeOutput    │  │
│  │ Schema      │───>│  <ZodForm>   │    │  Generated TSX │  │
│  │ Editor      │    │  live render │    │                │  │
│  └─────────────┘    └──────┬───────┘    └────────────────┘  │
│         │                  │                                 │
│         ▼                  ▼                                 │
│  ┌─────────────┐    ┌──────────────┐                        │
│  │ Web Worker  │    │  Component   │                        │
│  │ Zod eval +  │    │  Compiler    │                        │
│  │ field gen   │    │  (sucrase)   │                        │
│  └─────────────┘    └──────────────┘                        │
│                                                              │
└──────────────────────────┬───────────────────────────────────┘
                           │ HTTP (dev server middleware)
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                   Vite Dev Server                             │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  shadcn Registry Plugin (vite.config.ts)              │   │
│  │                                                       │   │
│  │  /api/shadcn/registries  — list all community regs    │   │
│  │  /api/shadcn/search      — search components in a reg │   │
│  │  /api/shadcn/resolve     — resolve items + all deps   │   │
│  │                                                       │   │
│  │  Uses: shadcn/registry (resolveRegistryItems,         │   │
│  │        getRegistries, searchRegistries)                │   │
│  └───────────────────────────┬───────────────────────────┘   │
│                              │                               │
└──────────────────────────────┼───────────────────────────────┘
                               │ HTTPS
                               ▼
┌──────────────────────────────────────────────────────────────┐
│               shadcn Registry Network                        │
│                                                              │
│  ui.shadcn.com/r/...        — core shadcn components         │
│  www.8bitcn.com/r/...       — 8-bit retro components         │
│  ui.aceternity.com/r/...    — Aceternity UI                  │
│  150+ community registries  — auto-discovered                │
└──────────────────────────────────────────────────────────────┘
```

---

## Key Data Flows

### 1. Schema Evaluation

```
Editor content (string)
  → useDebouncedEval (300ms debounce)
    → Web Worker (eval-worker.ts)
      → sucrase transform (strip types, compile JSX)
      → sandbox eval (new Function with Zod v4 in scope)
      → z2f core walkSchema() → FormField[]
    → fields sent back via postMessage
  → FormPreview receives FormField[]
```

The web worker runs in a sandboxed environment with `zod` available as a global. User code writes a Zod schema and the last expression is the schema object. The worker walks the schema using `@zod-to-form/core` to produce an array of `FormField` descriptors.

### 2. Component Import via shadcn Registry

```
User clicks "Components" → CustomComponentImport modal
  1. GET /api/shadcn/registries
     → Server calls shadcn getRegistries()
     → Returns 150+ community registries with names, URLs, descriptions

  2. User selects a library (e.g., @8bitcn)
     GET /api/shadcn/search?registry=@8bitcn&limit=200
     → Server calls shadcn searchRegistries()
     → Returns component index for that registry

  3. User clicks a component (e.g., "input")
     POST /api/shadcn/resolve { items: ["@8bitcn/input"] }
     → Server calls shadcn resolveRegistryItems()
     → shadcn resolves ALL transitive dependencies:
       - Base shadcn input (ui/input.tsx)
       - 8-bit wrapper (components/ui/8bit/input.tsx)
       - Retro CSS (components/ui/8bit/styles/retro.css)
     → Returns files[], dependencies[], cssVars{}

  4. User clicks "Compile & Import"
     → CSS files injected via <style> tag
     → TSX files sent to in-browser compiler
```

### 3. In-Browser Component Compilation

```
Source files (Record<name, tsxSource>)
  → compileComponents() — multi-pass compiler
    For each source file:
      → sucrase transform (TSX + TypeScript → CommonJS)
      → Resolve require() calls against MODULE_MAP:
          react, @radix-ui/*, class-variance-authority,
          clsx, tailwind-merge, lucide-react, @/lib/utils
      → Resolve @/components/ui/* against already-compiled modules
      → Execute in sandboxed Function (globals shadowed)
      → Extract named React component export
    Multi-pass handles dependency ordering:
      Pass 1: compile independent components (e.g., base input)
      Pass 2: compile dependent components (e.g., 8-bit input)
      → Compiled modules exposed via runtimeModules for cross-resolution

  Result: Record<slotName, ReactComponent>
    e.g., { Input: <8bitInputComponent>, Checkbox: <8bitCheckboxComponent> }
```

### 4. Form Rendering

```
FormPreview receives:
  - fields: FormField[] (from schema evaluation)
  - componentMap: "default" | "shadcn" | "custom"
  - compiledComponents: Record<string, ReactComponent>

  → Merges base component map with compiled components
  → Builds componentConfig with SHADCN_OVERRIDES for controlled components
  → useSchemaFromSource reconstructs the Zod schema object
  → Renders <ZodForm schema={schema} components={merged} />
```

---

## Module Architecture

### Package Dependencies

```
@zod-to-form/core     — Schema walking, field generation, component resolution
@zod-to-form/react    — ZodForm component, defaultComponentMap, shadcnComponentMap
@zod-to-form/cli      — (not used by playground, CLI codegen tool)
apps/playground        — This SPA
```

### Source Layout

```
apps/playground/
├── vite.config.ts              — Vite config + shadcn registry plugin
├── src/
│   ├── main.tsx                — App entry point
│   ├── App.tsx                 — Root component, state orchestration
│   ├── styles/
│   │   └── globals.css         — Glassmorphism theme, dark form preview styles
│   ├── hooks/
│   │   ├── usePlaygroundState  — Central state (editor, map, fields, config, custom)
│   │   ├── useDebouncedEval    — Debounced schema evaluation via worker
│   │   ├── useSchemaFromSource — Reconstructs Zod schema for ZodForm
│   │   └── useMediaQuery       — Responsive breakpoints
│   ├── lib/
│   │   ├── component-compiler  — In-browser sucrase TSX→JS + sandbox eval
│   │   ├── codegen             — Generated code output (RHF or ZodForm)
│   │   ├── config-io           — Config import/export (JSON)
│   │   ├── storage             — localStorage persistence
│   │   └── share               — URL hash sharing
│   ├── worker/
│   │   ├── eval-worker         — Web Worker: schema evaluation
│   │   ├── evaluate            — Schema evaluation logic
│   │   ├── transpile           — Sucrase transform wrapper
│   │   ├── protocol            — Worker message types
│   │   └── client              — Worker client API
│   ├── components/
│   │   ├── editor/
│   │   │   ├── SchemaEditor    — CodeMirror 6 editor
│   │   │   └── editor-setup    — CM extensions, theme, keybindings
│   │   ├── preview/
│   │   │   ├── FormPreview     — Live ZodForm renderer
│   │   │   ├── CodeOutput      — Generated code display
│   │   │   ├── ErrorDisplay    — Schema evaluation errors
│   │   │   └── ResultsPanel    — Form submission results
│   │   ├── inspect/
│   │   │   └── IRInspector     — FormField[] JSON tree viewer
│   │   ├── config/
│   │   │   ├── CustomComponentImport — Component library browser
│   │   │   └── ConfigImportExport    — Config file import/export
│   │   ├── layout/
│   │   │   ├── Header          — Top bar with controls
│   │   │   └── PlaygroundShell — Split-pane layout
│   │   └── examples/
│   │       ├── ExampleGallery  — Pre-built schema examples
│   │       ├── examples        — Example definitions
│   │       └── starter         — Default starter schema
│   └── types/
│       └── playground          — TypeScript type definitions
```

---

## Design System

### Theme

- **Background:** Deep navy (`#0a0e1a`) with glassmorphism panels
- **Accent:** Orange gradient (`#FB923C → #F97316 → #EA580C`)
- **Glass surfaces:** `backdrop-filter: blur(20px)` with semi-transparent backgrounds
- **Border glow:** Orange-tinted borders on interactive elements

### CSS Architecture

- Tailwind CSS v4 with `@theme` directive for design tokens
- Custom CSS variables for glassmorphism (`--bg-base`, `--bg-surface`, `--border-subtle`, etc.)
- Scoped `.form-preview-area` styles for dark-themed form inputs
- Radix UI portal styles for Select/Popover dropdowns
- `@theme` tokens (`--color-input`, `--color-ring`, `--radius`) for shadcn component compatibility

### Glass Component Classes

| Class | Usage |
|-------|-------|
| `.glass-surface` | Main content panels |
| `.glass-panel` | Smaller containers, cards |
| `.btn-glass` | Ghost/outline buttons |
| `.btn-accent` | Primary action buttons (orange) |
| `.input-glass` | Text inputs with glass effect |
| `.modal-backdrop` | Modal overlay |
| `.modal-panel` | Modal container |

---

## Component Compilation Pipeline

### Available Runtime Modules

The in-browser compiler has these packages pre-bundled and available to compiled components:

| Module | What's Available |
|--------|-----------------|
| `react` | Full React API |
| `@radix-ui/react-checkbox` | Checkbox primitive |
| `@radix-ui/react-switch` | Switch primitive |
| `@radix-ui/react-select` | Select primitive |
| `@radix-ui/react-label` | Label primitive |
| `@radix-ui/react-radio-group` | RadioGroup primitive |
| `@radix-ui/react-slot` | Slot component |
| `class-variance-authority` | cva() |
| `clsx` | clsx() |
| `tailwind-merge` | twMerge() |
| `lucide-react` | All Lucide icons |
| `@/lib/utils` | cn() helper |

### Controlled Component Overrides

Components like Select, Checkbox, and Switch need special wiring for React Hook Form:

```
SHADCN_OVERRIDES = {
  Select:   { controlled: true, propMap: { onValueChange: 'field.onChange', value: 'field.value' } }
  Checkbox: { controlled: true, propMap: { checked: 'field.value', onCheckedChange: 'field.onChange' } }
  Switch:   { controlled: true, propMap: { checked: 'field.value', onCheckedChange: 'field.onChange' } }
}
```

### Radix Select Composition

Radix Select exports multiple sub-components (Root, Trigger, Content, Item, etc.) that must be composed into a single form-compatible component. The compiler's `tryComposeRadixComponent()` detects this pattern and auto-composes them into a component that accepts `options`, `value`, and `onValueChange` props.

---

## Server-Side Registry Plugin

The Vite dev server plugin (`shadcnRegistryPlugin`) provides three endpoints that proxy to shadcn's Node.js registry API:

### `GET /api/shadcn/registries`
Returns all community registries (150+). Cached for 5 minutes.

### `GET /api/shadcn/search?registry=@name&q=query&limit=50`
Searches components within a specific registry. Requires the registry config to be built from `getRegistries()`.

### `POST /api/shadcn/resolve` `{ items: ["@registry/component"] }`
Resolves one or more registry items with full transitive dependency resolution. This is the core of the integration — shadcn handles:
- Fetching the component source
- Resolving `registryDependencies` (e.g., 8-bit input depends on base input)
- Including CSS files (e.g., retro.css for 8-bit components)
- Returning `cssVars` for theming

The resolved files are returned to the browser where the in-browser compiler transpiles and executes them.

---

## State Management

All state lives in `usePlaygroundState` (React useState + useCallback):

| State | Type | Persisted |
|-------|------|-----------|
| `editorContent` | string | localStorage |
| `componentMap` | "default" / "shadcn" / "custom" | localStorage |
| `activeTab` | "preview" / "code" / "inspect" | localStorage |
| `activePane` | "editor" / "preview" | no |
| `lastValidFields` | FormField[] | no |
| `evaluationError` | EvaluationError | no |
| `submitResult` | SubmitResult | no |
| `config` | PlaygroundConfig | localStorage |
| `customComponents` | Record<string, string> | no |

URL hash sharing encodes `editorContent + componentMap + activeTab` in base64.
