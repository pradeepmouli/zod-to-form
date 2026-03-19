# Research: Z2F Studio — Interactive Playground

**Date**: 2026-03-19
**Status**: Complete

## R1: Code Editor — CodeMirror 6 in React

### Decision
Use CodeMirror 6 directly (no wrapper library). Create a thin React component using `useEffect` + `useRef` for lifecycle management.

### Rationale
- CodeMirror 6 is modular, tree-shakeable, and designed for embedding
- React wrappers like `@uiw/react-codemirror` add abstraction but also bundle size and version-coupling risk
- Direct integration is ~30 lines of code and gives full control over extensions and state management

### Key Packages
| Package | Purpose |
|---------|---------|
| `@codemirror/state` | Editor state management |
| `@codemirror/view` | DOM rendering and input handling |
| `@codemirror/lang-javascript` | JavaScript/TypeScript language support (syntax highlighting, autocomplete) |
| `@codemirror/autocomplete` | Autocompletion framework |
| `@codemirror/commands` | Default keybindings |
| `@codemirror/search` | Find/replace |
| `@codemirror/lint` | Error/warning gutter decorations |
| `@codemirror/theme-one-dark` | Dark theme (optional, can default to light) |
| `codemirror` | Meta-package for basic setup convenience |

### Integration Pattern
```typescript
// SchemaEditor.tsx — simplified
const editorRef = useRef<HTMLDivElement>(null);
const viewRef = useRef<EditorView>();

useEffect(() => {
  const view = new EditorView({
    state: EditorState.create({
      doc: initialCode,
      extensions: [
        javascript({ typescript: true }),
        oneDark,
        linter(/* custom diagnostics from transpile errors */),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) onChange(update.state.doc.toString());
        }),
      ],
    }),
    parent: editorRef.current!,
  });
  viewRef.current = view;
  return () => view.destroy();
}, []);
```

### Alternatives Considered
- **Monaco Editor**: Full VS Code experience but ~5MB bundle, heavyweight for a playground
- **`@uiw/react-codemirror`**: Adds convenience but another dependency; direct CM6 is simple enough
- **`<textarea>` + Prism.js**: No real editing experience (no autocomplete, no error gutters)

---

## R2: In-Browser TypeScript Transpilation

### Decision
Use **Sucrase** for TypeScript → JavaScript transpilation.

### Rationale
- Sucrase is purpose-built for fast, lightweight transpilation (types-only stripping)
- ~1MB bundle vs ~40MB for the full TypeScript compiler
- Handles all TypeScript syntax the playground needs (type annotations, enums, `as const`)
- Does NOT type-check — which is fine; we show runtime errors from Zod instead

### Usage
```typescript
import { transform } from 'sucrase';

function transpile(tsCode: string): string {
  const result = transform(tsCode, {
    transforms: ['typescript'],
    disableESTransforms: true,  // Keep modern JS as-is
  });
  return result.code;
}
```

### Error Handling
- Sucrase throws on syntax errors with line/column info → display in CodeMirror's lint gutter
- Runtime errors from `new Function()` evaluation → display in ErrorDisplay component

### Alternatives Considered
- **TypeScript compiler (`ts.transpileModule`)**: Full fidelity but 40MB+, slow cold start
- **esbuild-wasm**: More capable but ~10MB WASM binary, overkill for type stripping
- **SWC (wasm)**: Similar to esbuild — heavier than needed
- **Babel**: Larger bundle, slower than Sucrase for pure TS transpilation

---

## R3: Sandboxed Schema Evaluation

### Decision
Use `new Function()` with a controlled scope object. No Web Worker (unnecessary for synchronous evaluation).

### Rationale
- Schema evaluation is synchronous and fast (<50ms for typical schemas)
- Web Workers add message-passing complexity without security benefit (same origin)
- The controlled scope prevents access to `window`, `document`, `fetch`, etc.
- `import`/`require` statements are detected and rejected pre-evaluation

### Implementation
```typescript
const ALLOWED_GLOBALS = { z: zod, zod, console: { log: () => {}, warn: () => {} } };

function evaluate(jsCode: string): z.ZodType {
  // Strip/reject import/require statements
  if (/\b(import|require)\s*[\('"]/m.test(jsCode)) {
    throw new Error('Imports are not supported in the playground sandbox');
  }
  // Wrap in function with controlled scope
  const fn = new Function(...Object.keys(ALLOWED_GLOBALS), jsCode);
  const result = fn(...Object.values(ALLOWED_GLOBALS));
  // Validate result is a Zod schema
  if (!result?._zod) throw new Error('Schema must export a Zod type');
  return result;
}
```

### Timeout Protection
- Wrap evaluation in `Promise.race` with a 3-second `setTimeout` rejection
- For synchronous hangs (infinite loops), a Web Worker can be added later as an enhancement

### Alternatives Considered
- **iframe sandbox**: Stronger isolation but complex message-passing for schema objects (can't serialize Zod instances across frames)
- **Web Worker**: Unnecessary overhead; schema evaluation is fast and synchronous. Can't share Zod class instances across worker boundary.
- **Realm/ShadowRealm**: Not yet widely supported in browsers

---

## R4: URL State Sharing

### Decision
Use **lz-string** with `compressToEncodedURIComponent` / `decompressFromEncodedURIComponent`.

### Rationale
- lz-string is ~5KB gzipped, battle-tested, and produces URL-safe output
- Typical schema (500 chars) compresses to ~200 chars — well within URL limits
- Used by TypeScript Playground, Babel REPL, and many similar tools

### URL Format
```
https://z2f.dev/playground#code=<lz-compressed>&map=shadcn&tab=preview
```

### Size Limits
- Schemas > 10,000 chars: show warning that URL may exceed browser limits (~2KB URL recommended max)
- Fallback: offer "Copy as JSON" for very large schemas

### Alternatives Considered
- **Base64 only**: No compression, URLs are ~33% longer
- **Server-side storage (gist/DB)**: Requires backend, violates "no server" constraint
- **pako/zlib**: Heavier than lz-string for similar compression ratios on small inputs

---

## R5: Build Tool — Vite

### Decision
Use **Vite** for development server and production build.

### Rationale
- Already listed in the constitution's Technology Stack
- Excellent pnpm workspace support via `resolve.dedupe` and `optimizeDeps.include`
- Fast HMR for React development
- Built-in code splitting for lazy-loading CodeMirror and examples
- Static output deployable to any CDN/static host

### Configuration Notes
- Add `apps/*` to `pnpm-workspace.yaml`
- Use `resolve.alias` or workspace `dependencies` to reference `@zod-to-form/core` and `@zod-to-form/react`
- Configure `optimizeDeps.include` for workspace packages to avoid full-page reloads during dev

### Alternatives Considered
- **Next.js**: SSR/SSG unnecessary for a client-only playground; adds routing complexity
- **Parcel**: Less ecosystem support, fewer plugins
- **Webpack**: Slower dev experience, more configuration overhead

---

## R6: UI Framework — shadcn/ui + Tailwind CSS for Playground Shell

### Decision
Use **shadcn/ui** components with **Tailwind CSS 4** for the playground's own UI (not the rendered form preview).

### Rationale
- User explicitly requested shadcn internally
- Consistent with the project's existing shadcn component map stubs
- Copy-paste component model means no runtime dependency on a UI library
- Tailwind provides the utility classes shadcn components expect

### Components Needed (playground shell)
- `Button`, `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent`
- `DropdownMenu` (component map selector)
- `Dialog` (config import, example gallery)
- `Tooltip` (action buttons)
- `ResizablePanel` / `ResizablePanelGroup` (split pane — from `react-resizable-panels`)
- `Badge` (status indicators)
- `ScrollArea` (preview/inspect panels)

### Alternatives Considered
- **Radix UI directly**: More work to style; shadcn wraps Radix with Tailwind
- **Headless UI**: Less component variety, smaller ecosystem
- **Custom HTML/CSS**: More work, less polished, harder to maintain
