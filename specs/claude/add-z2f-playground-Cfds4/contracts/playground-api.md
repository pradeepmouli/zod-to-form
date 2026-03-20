# Contracts: Z2F Studio — Interactive Playground

**Date**: 2026-03-19

The playground is a client-only SPA with no external APIs. These contracts define the internal interfaces between playground subsystems.

---

## Contract 1: Worker Message Protocol

### `worker/protocol.ts` — Shared types between main thread and Web Worker

```typescript
/** Main thread → Worker */
type EvalRequest = {
  type: 'eval';
  id: string;        // Unique request ID for cancellation/matching
  source: string;    // Raw TypeScript source from editor
};

/** Worker → Main thread (success) */
type EvalSuccess = {
  type: 'result';
  id: string;
  fields: FormField[];  // Serializable IR from walkSchema()
};

/** Worker → Main thread (error) */
type EvalFailure = {
  type: 'error';
  id: string;
  error: EvaluationError;
};

type WorkerResponse = EvalSuccess | EvalFailure;
```

**Guarantees**:
- All messages are structured-clone-safe (no class instances, no functions)
- `id` enables the client to discard stale responses after cancellation
- `FormField[]` is the only data that crosses the Worker boundary — no Zod schema instances

---

## Contract 2: Worker-Side Transpilation

### `transpile(source: string): TranspileResult`

Runs **inside the Worker**. Converts TypeScript source to JavaScript via Sucrase.

```typescript
type TranspileResult =
  | { ok: true; code: string }
  | { ok: false; error: EvaluationError };
```

**Guarantees**:
- Pure function, no side effects
- Returns `ok: false` with `type: 'syntax'` and line/column on parse error
- Never throws — all errors are captured in the result type

---

## Contract 3: Worker-Side Sandbox Evaluation

### `evaluate(jsCode: string): EvalResult`

Runs **inside the Worker**. Evaluates transpiled JavaScript and extracts a Zod schema.

```typescript
type EvalResult =
  | { ok: true; schema: z.ZodType }
  | { ok: false; error: EvaluationError };
```

**Sandbox Scope** (globals available to user code):
```typescript
{
  z: typeof import('zod'),
  zod: typeof import('zod'),
  core: {
    defineConfig: typeof import('@zod-to-form/core').defineConfig,
    // Selected safe exports
  }
}
```

**Guarantees**:
- `import`/`require` statements are rejected with `type: 'import'` error
- No access to `self`, `fetch`, `XMLHttpRequest`, `importScripts` (overridden to no-ops in Worker scope)
- The returned schema has a valid `._zod` property (validated before returning)
- Never throws — all errors are captured in the result type

---

## Contract 4: Worker Client (Main Thread)

### `EvalWorkerClient`

Promise-based wrapper around the Web Worker with timeout and cancellation.

```typescript
class EvalWorkerClient {
  /** Evaluate source code. Returns FormField[] or throws EvaluationError. */
  eval(source: string): Promise<FormField[]>;

  /** Cancel any in-flight evaluation. */
  cancel(): void;

  /** Terminate and respawn the Worker (used after timeout). */
  restart(): void;

  /** Clean up the Worker entirely. */
  dispose(): void;
}
```

**Guarantees**:
- `eval()` rejects with `type: 'timeout'` after 3 seconds and auto-restarts the Worker
- Calling `eval()` while a previous eval is in-flight cancels the previous request (stale responses are dropped by `id` mismatch)
- `dispose()` terminates the Worker; subsequent `eval()` calls throw
- Thread-safe: Worker hangs (infinite loops) cannot freeze the main UI

---

## Contract 5: URL Share Encoding

### `encodeShareState(state: ShareInput): string`

Compresses playground state into a URL hash fragment.

```typescript
type ShareInput = {
  code: string;
  map?: 'default' | 'shadcn';
  tab?: 'preview' | 'inspect';
};
```

**Output**: URL hash string (e.g., `#code=NobwRA...&map=shadcn`)

### `decodeShareState(hash: string): ShareInput | null`

Decompresses URL hash fragment back to playground state.

**Guarantees**:
- `encode(state)` then `decode(encoded)` === `state` for all inputs < 10,000 chars (SC-005)
- Returns `null` for invalid/corrupt hash strings (never throws)
- `code` uses lz-string `compressToEncodedURIComponent` (URL-safe characters only)

---

## Contract 6: localStorage Persistence

### `savePlaygroundState(state: PersistedState): void`
### `loadPlaygroundState(): PersistedState | null`

```typescript
type PersistedState = {
  editorContent: string;
  componentMap: 'default' | 'shadcn';
  activeTab: 'preview' | 'inspect';
  config: PlaygroundConfig | null;
  version: number; // Schema version for migrations
};
```

**Storage Key**: `z2f-playground-state`

**Guarantees**:
- `save` is debounced (500ms) to avoid thrashing localStorage
- `load` returns `null` if key is missing or JSON parse fails (never throws)
- `version` field enables future schema migrations
- Max storage size: 5MB (typical localStorage limit) — editor content capped at 50,000 chars

---

## Contract 7: z2f.config Import/Export

### `importConfig(input: string | File): Promise<ConfigImportResult>`

```typescript
type ConfigImportResult =
  | { ok: true; config: PlaygroundConfig; warnings: string[] }
  | { ok: false; error: string };
```

### `exportConfig(state: PlaygroundState): string`

Returns a JSON string representing a valid `z2f.config.json` file.

**Guarantees**:
- Import validates against `validateConfig()` from `@zod-to-form/core`
- Invalid fields produce `warnings` but valid portions are still applied (FR-020)
- Export output is compatible with the `zodform generate` CLI command
- Supports both `.json` and `.ts` (parsed as JSON after type-stripping) input formats

---

## Contract 8: Debounced Evaluation Hook

### `useDebouncedEval(source: string, options: EvalOptions): EvalState`

```typescript
type EvalOptions = {
  debounceMs?: number;    // Default: 300
  maxDepth?: number;      // Default: 10 (walkSchema option)
};

type EvalState = {
  fields: FormField[] | null;
  error: EvaluationError | null;
  isEvaluating: boolean;
};
```

**Guarantees**:
- Debounces evaluation by `debounceMs` after last source change
- Delegates to `EvalWorkerClient.eval()` — all transpilation/evaluation runs off-thread
- Retains last successful `fields` when current evaluation fails (FR-005)
- Sets `isEvaluating: true` while the Worker is processing
- Cancels in-flight Worker evaluation if source changes before response arrives
