# Research: zodform — Schema-Driven Form Generation

**Feature**: 001-zodform | **Date**: 2026-02-26

## 1. Zod v4 Internals API

### Decision: Use `schema._zod` substrate API exclusively

**Rationale**: Zod v4 exposes a documented internals API designed for library authors (the "substrate"). This is the same API that `z.toJSONSchema()` uses internally. Using it directly avoids information loss from intermediate representations.

**Key structures**:

- `schema._zod.def` — Type definition object with `type` discriminator
  - `def.type`: string identifier (e.g., `"string"`, `"number"`, `"object"`, `"array"`, `"union"`, `"enum"`, `"literal"`, `"optional"`, `"nullable"`, `"default"`, `"pipe"`, etc.)
  - `def.shape`: Record of named child schemas (for `object` type)
  - `def.element`: Child schema (for `array` type)
  - `def.options`: Array of variant schemas (for `union` type)
  - `def.entries`: Enum entries (for `enum` type)
  - `def.value`: Literal value (for `literal` type)
  - `def.innerType`: Wrapped schema (for `optional`, `nullable`, `default`, `readonly`, `pipe`)
  - `def.discriminator`: Discriminator key (for discriminated unions)

- `schema._zod.bag` — Constraint bag (accumulated validation constraints)
  - `minimum`, `maximum` — numeric bounds
  - `minLength`, `maxLength` — string/array length bounds
  - `pattern` — regex pattern for strings
  - `format` — semantic format hint (email, url, uuid, etc.)

- `schema._zod.parent` — Reference to wrapping schema (for unwinding wrapper chains)

- `schema._zod.optin` / `schema._zod.optout` — Sets tracking opt-in/opt-out behaviors; used to detect optionality

**Alternatives considered**:
- JSON Schema conversion then parsing → Rejected: loses type info for date, file, custom types
- Zod v3 `._def` API → Rejected: not forward-compatible, v3 is legacy

## 2. Processor Registry Pattern

### Decision: Mirror `z.toJSONSchema()` architecture with `Record<string, FormProcessor>`

**Rationale**: The `toJSONSchema()` implementation in Zod v4 uses a processor map keyed by `def.type`. Each processor reads the schema internals and produces output. This is extensible (add a processor without touching the walker) and battle-tested in Zod core.

**Pattern**:
```typescript
type FormProcessor = (
  schema: ZodType,
  ctx: FormProcessorContext,
  field: FormField,
  params: ProcessParams
) => void;

const processors: Record<string, FormProcessor> = {
  string: processString,
  number: processNumber,
  object: processObject,
  // ...
};

function process(schema: ZodType, ctx: FormProcessorContext, params: ProcessParams): FormField {
  const field = createBaseField(schema, ctx, params);
  const processor = ctx.processors[schema._zod.def.type];
  if (processor) {
    processor(schema, ctx, field, params);
  } else {
    processFallback(schema, ctx, field, params);
  }
  return field;
}
```

**Alternatives considered**:
- Visitor pattern (double dispatch) → Rejected: more complex, Zod doesn't support accept()
- Switch statement → Rejected: not extensible by consumers
- Plugin system with lifecycle hooks → Rejected: over-engineered for v1

## 3. React Hook Form Integration

### Decision: Use `zodResolver` with `useForm`, `useFieldArray` for arrays

**Rationale**: React Hook Form is the de facto standard for performant React forms. `zodResolver` from `@hookform/resolvers` provides native Zod validation. Using RHF's `register` and `Controller` for field binding keeps the implementation aligned with the ecosystem.

**Key patterns**:
- `useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })` — type-safe form state
- `useFieldArray({ control, name: "items" })` — dynamic array fields with add/remove
- `Controller` — for complex components (Select, DatePicker, Switch)
- Field paths use dot notation (`address.street`) for nested objects
- Array fields use indexed paths (`items.0.name`)

**Discriminated union handling**:
- `watch("discriminatorField")` to get current discriminator value
- Conditional rendering based on discriminator value
- `unregister` fields when switching variants to clean form state

**Alternatives considered**:
- Formik → Rejected: less performant (full re-render), smaller ecosystem
- Custom form state → Rejected: reinventing the wheel, no ecosystem
- React 19 form actions only → Rejected: no client-side validation story

## 4. Code Generation Strategy

### Decision: Template string interpolation with Prettier formatting

**Rationale**: For form component generation, the output is well-structured and predictable. Template strings are simple, debuggable, and sufficient. AST-based generation (e.g., ts-morph) adds complexity without proportional benefit for this use case.

**Approach**:
- Walk `FormField[]` tree and emit JSX strings
- Use template functions for each component type
- Concatenate imports, component body, and exports
- Run Prettier on the output for consistent formatting
- Generated code imports from `react-hook-form`, `zod`, and user's UI library

**Schema loading**:
- Use `jiti` to dynamically import the user's `.ts` file at CLI runtime
- Resolve the named export from the imported module
- Validate that the export is a Zod schema

**Alternatives considered**:
- ts-morph (AST) → Rejected: heavy dependency, harder to debug output
- Handlebars templates → Rejected: another templating language, limited TypeScript support
- EJS templates → Rejected: same issues as Handlebars

## 5. Default UI Components

### Decision: Unstyled HTML primitives as default; shadcn/ui as optional preset

**Rationale**: Per spec clarification, the runtime renderer defaults to unstyled native HTML elements. This ensures the library works without any UI framework dependency. shadcn/ui is provided as an optional component map for production use.

**Default ComponentMap**:
| Component | Default (unstyled) | shadcn/ui override |
|-----------|-------------------|-------------------|
| Input | `<input>` | `<Input>` from shadcn |
| Textarea | `<textarea>` | `<Textarea>` from shadcn |
| Checkbox | `<input type="checkbox">` | `<Checkbox>` from shadcn |
| Switch | `<input type="checkbox" role="switch">` | `<Switch>` from shadcn |
| Select | `<select>` | `<Select>` from shadcn |
| DatePicker | `<input type="date">` | Date picker from shadcn |
| FileInput | `<input type="file">` | Custom file input |
| RadioGroup | `<fieldset>` + `<input type="radio">` | `<RadioGroup>` from shadcn |

**CLI codegen default**: shadcn/ui imports (since codegen targets production use cases where a UI library is expected).

**Alternatives considered**:
- Default to shadcn/ui → Rejected: would require shadcn as a dependency for basic usage
- Default to headless UI → Rejected: still a dependency; unstyled HTML is the true zero-dep option

## 6. Package Dependency Strategy

### Decision: Strict peer dependencies per constitution Principle IV

**Core (`@zodform/core`)**:
- peerDependencies: `zod: ">=4.0.0"`
- dependencies: (none)

**React (`@zodform/react`)**:
- peerDependencies: `react: ">=18"`, `react-hook-form: ">=7"`, `@hookform/resolvers: ">=3"`, `zod: ">=4.0.0"`, `@zodform/core: workspace:*`
- dependencies: (none)

**CLI (`@zodform/cli`)**:
- peerDependencies: `zod: ">=4.0.0"`, `@zodform/core: workspace:*`
- dependencies: `commander`, `jiti`, `prettier`, `chokidar` (justified CLI tooling)
- bin: `zodform`

**Alternatives considered**:
- Bundle RHF in @zodform/react → Rejected: version conflicts, bloated bundle
- Make core a devDependency → Rejected: needed at runtime for type resolution

## 7. Metadata Precedence

### Decision: Form registry → Global registry → Inferred defaults

**Resolution order**:
1. Form-specific registry: `z.registry<FormMeta>()` — highest priority
   - fieldType, order, hidden, gridColumn, render (runtime only)
2. Global registry: `z.globalRegistry` / `.meta()` / `.describe()`
   - title → label, description, examples → placeholder, deprecated
3. Inferred defaults:
   - Label from field key (camelCase → Title Case)
   - Required from schema optionality
   - Component from Zod type mapping

**Alternatives considered**:
- Single registry only → Rejected: can't separate form concerns from general metadata
- Props-level overrides → Rejected: doesn't compose with schema-first approach
