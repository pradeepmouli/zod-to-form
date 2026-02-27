# Data Model: Rune Integration Additions

## Entity: ProcessorDefinition

- **Description**: A built-in or custom processor function used by the core walker to map Zod schema nodes into `FormField` output.
- **Fields**:
  - `id`: string (stable export name, e.g., `stringProcessor`)
  - `zodType`: string (`def.type` value, e.g., `string`, `number`, `object`)
  - `handler`: function signature compatible with `FormProcessor`
  - `isBuiltin`: boolean
  - `exportPath`: string (public module path)
- **Relationships**:
  - One `ProcessorDefinition` applies to many `FormFieldDefinition` nodes during traversal.
- **Validation Rules**:
  - `handler` must satisfy processor contract.
  - Built-ins must be re-exported from core processors index.

## Entity: FormFieldMetadata

- **Description**: Registry-attached metadata used to influence field rendering and ordering.
- **Fields**:
  - `fieldType`: string token (e.g., `cross-ref`, `Input`)
  - `order`: number | undefined
  - `props`: record<string, unknown> | undefined
- **Relationships**:
  - Attached to Zod schema nodes via `ZodFormRegistry`.
  - Read by walker and processors to produce `FormFieldDefinition`.
- **Validation Rules**:
  - `fieldType` should map to known runtime/codegen component-config token when customized.

## Entity: FormFieldDefinition

- **Description**: Normalized walker output consumed by runtime and codegen.
- **Fields**:
  - `name`: string
  - `component`: string token (not required to be JSX component name)
  - `props`: record<string, unknown>
  - `constraints`: optional record<string, unknown>
  - `children`: optional `FormFieldDefinition[]`
- **Relationships**:
  - Produced from schema + metadata + processor behavior.
  - Consumed by runtime renderer and CLI templates.
- **Validation Rules**:
  - If field classified as cross-reference, `component` token should be `cross-ref`.
  - Processor-vs-metadata overlaps resolve with processor precedence.

## Entity: UseZodFormLifecycleOptions

- **Description**: Runtime hook options controlling submit and value-change behavior.
- **Fields**:
  - `schema`: Zod schema
  - `defaultValues`: optional inferred values
  - `onSubmit`: optional callback
  - `onValueChange`: optional callback
  - `mode`: optional RHF mode (`onSubmit` | `onChange` | `onBlur`)
- **State Transitions**:
  - `mounted` -> `editingValid`: emit `onValueChange`
  - `mounted` -> `editingInvalid`: suppress `onValueChange`
  - `mounted` (no interaction): do not emit `onValueChange`
  - `editing*` -> `submitted`: invoke `onSubmit` when submit flow used
- **Validation Rules**:
  - `onValueChange` emissions only for valid post-mount changes.

## Entity: ComponentConfig

- **Description**: Shared configuration used by CLI and runtime for component resolution.
- **Fields**:
  - `components`: string module path
  - `fieldTypes`: record<string, ComponentEntry>
  - `fields`: optional record<string, FieldOverride>
- **Relationships**:
  - Consumed by CLI for import emission.
  - Consumed by runtime for dynamic component resolution.
- **Validation Rules**:
  - Supports `.json` and `.ts` forms.
  - `.ts` configs loaded via `jiti`.
  - `fields` mapping precedence > `fieldTypes` mapping precedence.

## Entity: ComponentEntry

- **Description**: Mapping payload for a field token/type within component-config.
- **Fields**:
  - `component`: string (`keyof T & string` in TS typed configs)
  - `render`: optional async function returning renderable component
- **Validation Rules**:
  - If `render` exists, it must be a function.
  - If `render` absent, `(await import(components))[component]` must resolve to function.

## Entity: CliGenerationRequest

- **Description**: CLI generation input controlling output mode and config usage.
- **Fields**:
  - `schemaPath`: string
  - `outDir`: string
  - `mode`: `submit` | `auto-save`
  - `componentConfigPath`: optional string
- **State Transitions**:
  - `received` -> `validated` -> `generated` -> `written`
  - `received/validated` -> `failed` for malformed config or validation failures
- **Validation Rules**:
  - Default mode (`submit`) must stay behaviorally identical to baseline.
  - If no component-config provided, output uses default type-based fields.
