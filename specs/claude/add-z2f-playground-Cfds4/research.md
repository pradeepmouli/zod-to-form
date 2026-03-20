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
Use a **Web Worker** that bundles Sucrase, Zod, and `@zod-to-form/core`. The Worker runs `new Function()` with a controlled scope, then walks the resulting schema to `FormField[]`. Only the serializable `FormField[]` crosses the Worker boundary.

### Rationale
- **Infinite-loop safety**: User code runs in a separate thread — if it hangs, the main thread remains responsive. The client terminates and respawns the Worker after a 3-second timeout.
- **Natural DOM isolation**: Workers have no access to `window`, `document`, or the DOM.
- **Clean architecture**: The entire transpile→evaluate→walk pipeline is encapsulated in one Worker, with a simple request/response message protocol.
- **Vite-native**: `new Worker(new URL('./worker/eval-worker.ts', import.meta.url), { type: 'module' })` — Vite bundles the Worker file separately with zero config.

### Worker-Side Implementation
```typescript
// worker/eval-worker.ts
import { transform } from 'sucrase';
import * as z from 'zod';
import { walkSchema } from '@zod-to-form/core';

self.onmessage = (e: MessageEvent<EvalRequest>) => {
  const { source, id } = e.data;
  try {
    // 1. Transpile TS → JS
    const js = transform(source, { transforms: ['typescript'], disableESTransforms: true }).code;
    // 2. Reject imports
    if (/\b(import|require)\s*[\('"]/m.test(js)) {
      throw { type: 'import', message: 'Imports are not supported in the playground sandbox' };
    }
    // 3. Evaluate with controlled scope
    const fn = new Function('z', 'zod', js);
    const schema = fn(z, z);
    if (!schema?._zod) throw { type: 'runtime', message: 'Expression must evaluate to a Zod schema' };
    // 4. Walk to FormField[]
    const fields = walkSchema(schema);
    self.postMessage({ type: 'result', id, fields });
  } catch (err) {
    self.postMessage({ type: 'error', id, error: normalizeError(err) });
  }
};
```

### Main-Thread Client
```typescript
// worker/client.ts — simplified
class EvalWorkerClient {
  private worker: Worker;
  private pending: Map<string, { resolve, reject, timer }>;

  eval(source: string): Promise<FormField[]> {
    const id = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.terminate(); // kill hung worker
        reject({ type: 'timeout', message: 'Evaluation timed out (3s)' });
      }, 3000);
      this.pending.set(id, { resolve, reject, timer });
      this.worker.postMessage({ type: 'eval', source, id });
    });
  }

  private terminate() {
    this.worker.terminate();
    this.worker = this.createWorker(); // respawn
  }
}
```

### FormField[] Serialization
- `FormField[]` is plain data (strings, numbers, booleans, arrays, objects) — serializes cleanly via structured clone
- Zod schema instances do **not** cross the boundary
- For form submission (which needs the live Zod schema for validation), the main thread re-evaluates the last known-good JS on demand using `new Function()` — this is a one-shot operation triggered by user click, not a continuous pipeline

### Alternatives Considered
- **Main-thread `new Function()` only**: Simpler but infinite loops freeze the UI with no recovery. `Promise.race` with `setTimeout` cannot interrupt synchronous execution.
- **iframe sandbox**: Stronger browsing-context isolation but complex message-passing, and Zod/core would need to be loaded separately inside the iframe.
- **Realm/ShadowRealm**: Not yet widely supported in browsers.

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
