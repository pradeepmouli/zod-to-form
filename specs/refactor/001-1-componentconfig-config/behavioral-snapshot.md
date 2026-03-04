# Behavioral Snapshot

**Purpose**: Document observable behavior before refactoring to verify it's preserved after.

## Key Behaviors to Preserve

### Behavior 1: `defineComponentConfig()` returns config identity
**Input**: Any valid `ZodToFormComponentConfig` object
**Expected Output**: The exact same object, unchanged (identity function for type inference)
**Actual Output** (before): [Run and document]
**Actual Output** (after): [Re-run after refactoring - must match]

### Behavior 2: `validateComponentConfig()` validates and throws on invalid config
**Input**: Various valid and invalid config objects
**Expected Output**:
- Valid config → returns void (no throw)
- Missing `components` → throws formatted error with field path
- Missing `fieldTypes` → throws formatted error
- Invalid `fieldTypes` entry (missing `component`) → throws formatted error
- Extra unknown fields → accepted (Zod passthrough or strip behavior)
**Actual Output** (before): [Run and document]
**Actual Output** (after): [Re-run after refactoring - must match]

### Behavior 3: Config file loading via jiti
**Input**: Path to `.ts`/`.js`/`.json` config file
**Expected Output**:
- `.ts` file with `export default defineComponentConfig({...})` → loaded, validated, returned
- Non-existent path → throws error
- Invalid config content → throws validation error with source path in message
**Actual Output** (before): [Run and document]
**Actual Output** (after): [Re-run after refactoring - must match]

### Behavior 4: Default config path resolution
**Input**: Current working directory
**Expected Output**: Searches in order: `z2f.config.ts`, `component-config.ts`, `z2f.config.js`, `component-config.js`, `z2f.config.json`, `component-config.json` — returns first found
**Actual Output** (before): [Run and document]
**Actual Output** (after): [Re-run after refactoring - must match]

### Behavior 5: Schema export name resolution
**Input**: Path to schema file with multiple Zod exports
**Expected Output**: Array of export names where value has `_zod` property, sorted alphabetically
**Actual Output** (before): [Run and document]
**Actual Output** (after): [Re-run after refactoring - must match]

### Behavior 6: CLI `generate` produces identical output
**Input**: `--config z2f.config.ts --schema schema.ts --export UserSchema`
**Expected Output**: Generated `.tsx` file with React Hook Form component
**Actual Output** (before): [Capture generated file content]
**Actual Output** (after): [Re-run after refactoring - must match]

### Behavior 7: CLI `init` generates valid config template
**Input**: `zod-to-form init` in a directory with/without shadcn `components.json`
**Expected Output**: Valid `z2f.config.ts` with discovered primitives and default fieldTypes
**Actual Output** (before): [Capture generated file content]
**Actual Output** (after): [Re-run after refactoring - must match]

### Behavior 8: `resolveMetadata()` precedence chain
**Input**: Schema with both global Zod metadata and form registry metadata
**Expected Output**:
- Form registry fields override global registry
- Global registry provides `title`, `description`, `examples`, `deprecated`
- Form registry provides `fieldType`, `order`, `hidden`, `gridColumn`, `props`
- When both set same field, form registry wins
**Actual Output** (before): [Run and document]
**Actual Output** (after): [Re-run after refactoring - must match]

### Behavior 9: FieldRenderer component resolution chain
**Input**: A `FormField` with various `component` and `key` values, plus a `RuntimeComponentConfig`
**Expected Output**: Resolution order:
1. `config.fields[field.key]` → exact field path override
2. `config.fieldTypes[field.component]` → logical type lookup
3. `defaultComponentMap[field.component]` → built-in component
4. `defaultComponentMap.Input` → final fallback
**Actual Output** (before): [Run and document]
**Actual Output** (after): [Re-run after refactoring - must match]

### Behavior 10: Export filtering (include/exclude patterns)
**Input**: List of schema export names + include/exclude glob patterns
**Expected Output**: Filtered list matching include patterns, excluding exclude patterns
**Actual Output** (before): [Run and document]
**Actual Output** (after): [Re-run after refactoring - must match]

## Verification Matrix

| # | Behavior | Pre-Refactor | Post-Refactor | Match? |
|---|----------|-------------|---------------|--------|
| 1 | defineComponentConfig identity | [ ] Captured | [ ] Verified | [ ] |
| 2 | validateComponentConfig errors | [ ] Captured | [ ] Verified | [ ] |
| 3 | Config file loading | [ ] Captured | [ ] Verified | [ ] |
| 4 | Config path resolution | [ ] Captured | [ ] Verified | [ ] |
| 5 | Schema export resolution | [ ] Captured | [ ] Verified | [ ] |
| 6 | CLI generate output | [ ] Captured | [ ] Verified | [ ] |
| 7 | CLI init template | [ ] Captured | [ ] Verified | [ ] |
| 8 | resolveMetadata precedence | [ ] Captured | [ ] Verified | [ ] |
| 9 | FieldRenderer resolution | [ ] Captured | [ ] Verified | [ ] |
| 10 | Export filtering | [ ] Captured | [ ] Verified | [ ] |

## Test Commands
```bash
# Run all tests to establish baseline
pnpm test

# Type-check all packages
pnpm run type-check

# Build all packages
pnpm run build

# CLI generate dry-run (capture output)
pnpm --filter @zod-to-form/cli exec -- node dist/index.js generate --config <path> --schema <path> --dry-run

# CLI init dry-run (capture output)
pnpm --filter @zod-to-form/cli exec -- node dist/index.js init --dry-run
```

---
*Update this file with actual behaviors before starting refactoring*
