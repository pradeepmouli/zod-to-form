# Data Model: CLI init + component-config bootstrap

## Entity: InitCommandRequest

- **Description**: User-provided options for `zodform init`.
- **Fields**:
  - `cwd`: string
  - `outFile`: string (default `component-config.ts`)
  - `force`: boolean
  - `dryRun`: boolean
  - `verbose`: boolean
- **Validation Rules**:
  - `outFile` must resolve within workspace/project root.
  - Existing target file requires `force=true` unless `dryRun=true`.

## Entity: ShadcnConfigSnapshot

- **Description**: Normalized values discovered from shadcn config files.
- **Fields**:
  - `exists`: boolean
  - `componentsPath`: string | null
  - `aliases`: record<string, string>
  - `style`: string | null
- **Validation Rules**:
  - Missing/partial config is valid and falls back to defaults.
  - Invalid or unreadable config should produce actionable warning and continue with defaults.

## Entity: ComponentConfigContract

- **Description**: Shared component-config type consumed by CLI and runtime.
- **Fields**:
  - `components`: string (module path)
  - `fieldTypes`: record<string, ComponentEntry>
  - `fields`: optional record<string, FieldOverride>
- **Relationships**:
  - Declared in `@zod-to-form/core` and imported by `@zod-to-form/cli`.
- **Validation Rules**:
  - Contract is the canonical shared definition; no package-local duplicate shape.

## Entity: ComponentEntry

- **Description**: Mapping value used for field token/type component resolution.
- **Fields**:
  - `component`: string
  - `render`: optional function reference (runtime) or omitted (codegen path)
- **Validation Rules**:
  - `component` must be a non-empty string.

## Entity: GeneratedConfigArtifact

- **Description**: Result of rendering `component-config.ts` content.
- **Fields**:
  - `path`: string
  - `content`: string
  - `usedShadcnDefaults`: boolean
  - `warnings`: string[]
- **State Transitions**:
  - `planned` -> `rendered` -> (`written` | `previewed` for dry-run)

## Entity: InitRunSummary

- **Description**: Final command summary emitted to stdout.
- **Fields**:
  - `status`: enum (`success`, `warning`, `error`)
  - `stepsCompleted`: number
  - `fileWritten`: boolean
  - `outputPath`: string
  - `usedFallbacks`: string[]
  - `verboseDetails`: optional string[]
- **Validation Rules**:
  - Default output includes concise progress and final summary.
  - `verboseDetails` emitted only when `verbose=true`.

## Entity: SchemaImportResolutionPolicy

- **Description**: Rules used to emit schema import paths/extensions in generated output.
- **Fields**:
  - `moduleKind`: string (e.g., `nodenext`)
  - `moduleResolution`: string (e.g., `node16`)
  - `requiresExtension`: boolean
  - `preferredExtension`: string (e.g., `.js`)
- **Validation Rules**:
  - Generated imports must compile with repo/package TypeScript configuration.
  - Policy is verified by tests covering extension/path variants.
