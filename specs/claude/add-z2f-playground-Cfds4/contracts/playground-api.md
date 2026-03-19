# Contracts: Z2F Studio — Interactive Playground

**Date**: 2026-03-19

The playground is a client-only SPA with no external APIs. These contracts define the internal interfaces between playground subsystems.

---

## Contract 1: Transpilation Pipeline

### `transpile(source: string): TranspileResult`

Converts TypeScript source to JavaScript.

**Input**: Raw TypeScript string from the editor
**Output**:
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

## Contract 2: Schema Evaluation Sandbox

### `evaluate(jsCode: string, globals?: Record<string, unknown>): EvalResult`

Evaluates transpiled JavaScript and extracts a Zod schema.

**Input**: JavaScript code string (output of `transpile`)
**Output**:
```typescript
type EvalResult =
  | { ok: true; schema: z.ZodType }
  | { ok: false; error: EvaluationError };
```

**Sandbox Scope** (default globals):
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
- Evaluation timeout: 3 seconds → `type: 'timeout'` error
- No access to `window`, `document`, `fetch`, `XMLHttpRequest`, `eval`, `Function`
- The returned schema has a valid `._zod` property (validated before returning)
- Never throws — all errors are captured in the result type

---

## Contract 3: URL Share Encoding

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

## Contract 4: localStorage Persistence

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

## Contract 5: z2f.config Import/Export

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

## Contract 6: Debounced Evaluation Hook

### `useDebouncedEval(source: string, options: EvalOptions): EvalState`

```typescript
type EvalOptions = {
  debounceMs?: number;    // Default: 300
  maxDepth?: number;      // Default: 10 (walkSchema option)
  componentMap?: ComponentMap;
};

type EvalState = {
  fields: FormField[] | null;
  schema: z.ZodType | null;
  error: EvaluationError | null;
  isEvaluating: boolean;
};
```

**Guarantees**:
- Debounces evaluation by `debounceMs` after last source change
- Retains last successful `fields`/`schema` when current evaluation fails (FR-005)
- Sets `isEvaluating: true` during transpile+evaluate+walk pipeline
- Cancels in-flight evaluation if source changes before completion
