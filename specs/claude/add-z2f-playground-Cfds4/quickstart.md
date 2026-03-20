# Quickstart: Z2F Studio — Interactive Playground

**Date**: 2026-03-19

## Prerequisites

- Node.js ≥ 20.0.0
- pnpm ≥ 10.0.0
- The zod-to-form monorepo cloned and dependencies installed

## Setup

```bash
# From the repository root
pnpm install

# Build workspace dependencies (core + react packages)
pnpm build

# Start the playground dev server
pnpm --filter @zod-to-form/playground dev
```

The playground opens at `http://localhost:5000`.

## Development

```bash
# Run playground tests
pnpm --filter @zod-to-form/playground test

# Type-check
pnpm --filter @zod-to-form/playground type-check

# Build for production
pnpm --filter @zod-to-form/playground build

# Preview production build
pnpm --filter @zod-to-form/playground preview
```

## Project Structure

```
apps/playground/
├── src/
│   ├── main.tsx              # Entry point
│   ├── App.tsx               # Root component
│   ├── components/           # UI components
│   │   ├── layout/           # Shell, header, responsive tabs
│   │   ├── editor/           # CodeMirror schema editor
│   │   ├── preview/          # Form preview + results
│   │   ├── inspect/          # FormField[] IR viewer
│   │   ├── config/           # Component map toggle, config I/O
│   │   └── examples/         # Example gallery
│   ├── lib/                  # Core logic (transpile, evaluate, share, storage)
│   ├── hooks/                # React hooks
│   └── types/                # Type definitions
└── tests/                    # Unit + integration tests
```

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/transpile.ts` | Sucrase TypeScript → JavaScript |
| `src/lib/evaluate.ts` | Sandboxed schema evaluation |
| `src/lib/share.ts` | lz-string URL encoding/decoding |
| `src/lib/storage.ts` | localStorage persistence |
| `src/lib/config-io.ts` | z2f.config import/export |
| `src/hooks/useDebouncedEval.ts` | Debounced transpile→evaluate→walk pipeline |
| `src/hooks/usePlaygroundState.ts` | Central state management |
| `src/components/editor/SchemaEditor.tsx` | CodeMirror 6 editor wrapper |
| `src/components/preview/FormPreview.tsx` | Live ZodForm rendering |

## Architecture

```
Editor (CodeMirror) → Sucrase (transpile) → Sandbox (evaluate) → walkSchema() → FormField[]
                                                                                      │
                                                                          ┌────────────┤
                                                                          │            │
                                                                     <ZodForm>    IRInspector
                                                                     (preview)    (inspect)
```

## Adding an Example Schema

1. Open `src/components/examples/examples.ts`
2. Add a new entry to the `EXAMPLES` array:
   ```typescript
   {
     id: 'my-example',
     title: 'My Example Form',
     description: 'Demonstrates XYZ',
     category: 'basic',
     source: `const schema = z.object({ ... }); schema;`,
     tags: ['object', 'string'],
   }
   ```
3. The example appears automatically in the gallery
