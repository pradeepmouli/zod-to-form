# Feature Specification: zodform — Schema-Driven Form Generation

**Feature Branch**: `001-zodform`
**Created**: 2026-02-26
**Status**: Draft
**Input**: User description: "Schema-Driven Form Generation for Zod v4. A form generation library that walks Zod's internal type tree using the processor registry pattern to emit React form components instead of JSON Schema."

## Clarifications

### Session 2026-02-26

- Q: What is the default component library for the runtime `<ZodForm>` renderer? → A: Unstyled HTML primitives as default; shadcn/ui as optional preset map
- Q: How should discriminated unions render in the form? → A: Select-then-reveal — render a select/radio for the discriminator field, then dynamically show only the fields for the selected variant
- Q: Should `zodform/react` bundle react-hook-form as a direct dependency or declare it as a peer dependency? → A: Peer dependencies only — `react-hook-form` and `@hookform/resolvers` are peer deps that the user installs themselves

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Runtime Form Rendering (Priority: P1)

As a developer with a Zod v4 schema, I want to render a complete, validated form at runtime with a single component so that I can rapidly build admin panels, internal tools, and prototypes without manually wiring up form fields.

**Why this priority**: This is the core value proposition — going from schema to working form in one line of JSX. Without this, the library has no usable output. Every other story depends on the core walker that this story exercises.

**Independent Test**: Render a form from a test schema containing string, number, boolean, enum, date, and file fields. Verify all fields render with correct input types, labels, validation, and that submission produces typed output.

**Acceptance Scenarios**:

1. **Given** a Zod object schema with string, number, boolean, enum, date, and file fields, **When** I render `<ZodForm schema={mySchema} onSubmit={handler} />`, **Then** a complete form is rendered with the correct input component for each field type, labels derived from field names, and validation wired through the schema
2. **Given** a schema field with `.optional()`, **When** the form renders, **Then** the field is not marked as required and the label reflects optionality
3. **Given** a rendered form with invalid input, **When** the user submits, **Then** validation errors from the Zod schema are displayed next to the corresponding fields
4. **Given** a rendered form with valid input, **When** the user submits, **Then** the `onSubmit` handler receives data typed as the schema's output type

---

### User Story 2 - Form Metadata via Zod Registry (Priority: P1)

As a developer, I want to annotate my Zod schema with form-specific hints using Zod v4's native registry system so that I can control field rendering (labels, types, ordering, visibility) without a separate configuration format.

**Why this priority**: Without metadata support, the library can only produce generic forms. Metadata is what makes forms usable in practice — custom labels, textarea vs input, field ordering, placeholders. This is a P1 because it's essential for real-world adoption.

**Independent Test**: Create a schema with custom form registry annotations (fieldType, order, hidden) and global metadata (title, description, examples). Verify each annotation is reflected in the rendered form.

**Acceptance Scenarios**:

1. **Given** a string field with `{ fieldType: "textarea" }` in the form registry, **When** the form renders, **Then** a textarea component is used instead of a text input
2. **Given** a boolean field with `{ fieldType: "switch" }` in the form registry, **When** the form renders, **Then** a switch component is used instead of a checkbox
3. **Given** a field with `.meta({ title: "Full Name" })`, **When** the form renders, **Then** the label reads "Full Name" instead of the inferred field name
4. **Given** a field with `.meta({ examples: ["alice@example.com"] })`, **When** the form renders, **Then** the first example is used as the input placeholder
5. **Given** a field with `{ hidden: true }` in the form registry, **When** the form renders, **Then** the field is not visible but remains in form state
6. **Given** a field with `{ order: 2 }` in the form registry, **When** the form renders, **Then** it appears second regardless of schema declaration order

---

### User Story 3 - Build-Time Code Generation (Priority: P1)

As a developer who prefers explicit, debuggable code, I want to generate a complete static form component from my schema so that I have full control over the output with no runtime dependency on the form generation library.

**Why this priority**: Many teams require codegen over runtime generation for auditability, bundle size, and customization. This is a P1 because it's a core differentiator — the dual-mode architecture is a primary selling point.

**Independent Test**: Run the CLI against a test schema, inspect the generated `.tsx` file, compile it with the TypeScript compiler, render it in a test harness, and verify it produces identical behavior to the runtime form.

**Acceptance Scenarios**:

1. **Given** a CLI invocation with `--schema src/schemas/user.ts --export userSchema`, **When** the command runs, **Then** a `UserForm.tsx` file is generated with explicit form markup
2. **Given** the generated component, **When** opened in an editor, **Then** it reads like hand-written code with no wrappers, indirection, or runtime dependency on the form generation library
3. **Given** the generated component, **When** compiled with the TypeScript compiler in strict mode, **Then** there are zero type errors
4. **Given** a re-run of the CLI after modifying the schema, **When** the command completes, **Then** the form component is regenerated but any user-owned config file is preserved

---

### User Story 4 - Custom Field Rendering (Priority: P2)

As a developer, I want to override how specific fields are rendered — both at runtime and in generated code — using Zod v4's registry system so that I can use specialized components without forking the library.

**Why this priority**: Real-world forms frequently need custom components beyond the defaults. This extends US-2 with deeper customization but is not required for initial usability.

**Independent Test**: Register various field overrides (combobox for enum, custom renderer for a specific field) and verify each takes effect in the rendered form.

**Acceptance Scenarios**:

1. **Given** an enum field with `{ fieldType: "combobox" }` in the form registry, **When** the form renders, **Then** a combobox is rendered instead of a select dropdown
2. **Given** a field with `{ order: 2 }` in the form registry, **When** the form renders, **Then** it appears second regardless of schema declaration order
3. **Given** a field with `{ hidden: true }` in the form registry, **When** the form renders, **Then** it is not rendered but is still included in form state
4. **Given** a field with a custom `render` function in the form registry, **When** the form renders at runtime, **Then** the custom renderer is used; in codegen mode, a TODO comment is emitted

---

### User Story 5 - Nested Objects and Arrays (Priority: P2)

As a developer with complex schemas, I want nested objects rendered as grouped sections and arrays rendered with add/remove controls so that I can build forms for real-world data structures.

**Why this priority**: Many production schemas have nesting and repeating fields. Without this, the library only handles flat schemas, limiting usefulness. It's P2 because flat schemas cover the MVP.

**Independent Test**: Create a schema with nested objects and arrays, render the form, verify grouped sections appear for objects, and add/remove controls work for arrays with validation.

**Acceptance Scenarios**:

1. **Given** a schema with `z.object({ address: z.object({ street: z.string(), city: z.string() }) })`, **When** the form renders, **Then** address fields appear in a nested section with "Address" as the heading
2. **Given** a schema with `z.array(z.object({ name: z.string() }))`, **When** the form renders, **Then** the form includes add/remove controls for array items
3. **Given** an array field with `.min(1)`, **When** one item remains, **Then** the remove button is disabled

---

### User Story 6 - Server Action Generation (Priority: P2)

As a Next.js developer, I want the CLI to generate a server action with server-side validation alongside the form component so that I have end-to-end type-safe form handling.

**Why this priority**: Server actions are the standard pattern for Next.js form handling. Generating both form and action together eliminates a significant source of boilerplate. P2 because it's framework-specific.

**Independent Test**: Run the CLI with `--server-action`, submit the generated form, and verify server-side validation runs and returns typed results.

**Acceptance Scenarios**:

1. **Given** the `--server-action` flag, **When** the CLI runs, **Then** a server action file is created that validates input with the schema and returns typed results
2. **Given** the generated form with `--server-action`, **When** a user submits the form, **Then** the form calls the server action and handles success/error responses

---

### User Story 7 - Schema Watch Mode (Priority: P3)

As a developer iterating on my data model, I want the CLI to watch for schema changes and automatically regenerate the form so that I see changes reflected immediately during development.

**Why this priority**: Watch mode is a convenience feature that improves developer experience but is not required for the library to function. P3 because it can be added incrementally.

**Independent Test**: Start watch mode, add a field to the schema file, and verify the form component is regenerated within 1 second with the new field present.

**Acceptance Scenarios**:

1. **Given** `--watch` mode is active, **When** the schema file changes, **Then** the form component is regenerated within 1 second
2. **Given** `--watch` mode with an existing config file, **When** regeneration occurs, **Then** the config file is NOT overwritten

---

### Edge Cases

- What happens when a schema contains `z.lazy()` (recursive types)? The walker MUST detect cycles via a Seen map and stop recursion at a configurable depth limit, rendering an expandable section or a placeholder.
- What happens when a schema contains `z.transform()` or `z.custom()`? The system MUST provide a sensible fallback (text input) and allow override via the form registry.
- What happens when a schema contains a discriminated union (`z.discriminatedUnion()`)? The system MUST render a select/radio for the discriminator field, then dynamically show only the fields for the selected variant (select-then-reveal pattern).
- What happens when a schema contains `z.intersection()`? The system MUST merge the shapes of both sides and render all fields.
- What happens when a field has conflicting metadata (form registry vs global registry)? The form registry MUST take precedence, with global registry as fallback.
- What happens when the CLI cannot resolve the schema export? The CLI MUST produce a clear error message identifying the file path and export name it attempted to load.
- What happens when the generated code references UI components that are not installed? The generated file MUST include import statements that fail fast at compile time, not silently at runtime.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST implement a recursive type tree walker that traverses Zod v4 schemas by reading `schema._zod.def` for structural data, `schema._zod.bag` for constraint data, and dispatching to type-specific processors by `def.type`
- **FR-002**: The system MUST implement a processor registry with handlers for at minimum: string, number, boolean, date, enum, literal, file, object, array, union (including discriminated unions), tuple, nullable, optional, default, pipe, readonly, and template_literal Zod types. Discriminated unions MUST render using a select-then-reveal pattern: a select/radio for the discriminator field with conditional rendering of variant-specific fields. Processors for transform, custom, lazy, intersection, record, and other types MUST be provided with sensible defaults or configurable fallbacks.
- **FR-003**: Each processor MUST output a FormField descriptor containing: key (field path), component name, props, label, description, placeholder, required flag, default value, read-only flag, hidden flag, order, options (for enums/unions), children (for nested objects), array item template, and constraint data (min, max, minLength, maxLength, pattern, format)
- **FR-004**: The system MUST read metadata from two sources in precedence order: (1) form-specific registry via `z.registry<FormMeta>()` for fieldType, order, hidden, gridColumn, render overrides; (2) global registry via `z.globalRegistry` / `.meta()` / `.describe()` for title, description, examples, deprecated
- **FR-005**: The runtime renderer MUST provide a `<ZodForm>` component that accepts a Zod schema, optional form registry, typed onSubmit handler, optional default values, optional custom component map, optional className, and renders a complete validated form using React Hook Form with zodResolver
- **FR-006**: The renderer MUST default to unstyled HTML primitives (native `<input>`, `<select>`, `<textarea>`, etc.) and use a pluggable component map (Input, Textarea, Checkbox, Switch, Select, DatePicker, FileInput, RadioGroup) allowing users to override individual components or provide entirely custom maps for different UI libraries. A pre-built shadcn/ui component map MUST be provided as an optional import.
- **FR-007**: The CLI MUST dynamically import the user's Zod schema file, call the core walker to produce FormField[], and emit a static `.tsx` file with explicit form markup that has zero runtime dependency on zodform — importing only from react-hook-form, zod, and the user's UI library
- **FR-008**: All rendered and generated form components MUST include: label elements with htmlFor linking, validation error display via FormMessage, description text via FormDescription when metadata is present, aria-invalid on inputs when errors exist, proper required attributes, and logical tab order (schema declaration order, overridable via order in form registry)
- **FR-009**: The system MUST support Zod v4 (v4.0.0+) exclusively, using the `_zod` internals API (`schema._zod.def`, `schema._zod.bag`, `schema._zod.parent`, `schema._zod.optin/optout`). Zod v3 support is NOT a goal.
- **FR-010**: The system MUST handle nested objects by recursing into `def.shape` and rendering grouped sections, and arrays by providing useFieldArray with add/remove controls using `def.element` as the item template, respecting `.min()` and `.max()` constraints
- **FR-011**: The CLI MUST support `--schema`, `--export`, `--out`, `--name`, `--ui`, `--server-action`, `--watch`, `--force`, and `--dry-run` options
- **FR-012**: The CLI MUST NOT overwrite user-owned config files on re-runs unless `--force` is specified. Generated form files are always regenerated; config files are generated once.
- **FR-013**: The walker MUST detect cycles via a Seen map and handle recursive schemas (z.lazy()) gracefully with a configurable depth limit
- **FR-014**: The runtime renderer MUST memoize the schema walk — re-walking MUST only occur when the schema reference changes
- **FR-015**: The CLI MUST optionally generate a Next.js server action file that validates input with safeParse() and returns typed results when `--server-action` is specified
- **FR-016**: The CLI MUST support `--watch` mode using file system watching, regenerating the form component within 1 second of schema file changes

### Key Entities

- **FormField**: The intermediate representation produced by the core walker. A recursive tree of field descriptors that fully describes the form UI without any schema library or UI framework dependency. Key attributes: key (field path), component (component name), props, label, description, placeholder, required, defaultValue, readOnly, hidden, order, options, children, arrayItem, constraints
- **FormProcessor**: A function that reads Zod schema internals for a specific type and populates a FormField descriptor. One processor per Zod `def.type`. Signature: `(schema, context, field, params) => void`
- **FormProcessorContext**: Traversal state carried through the walk, including the processor registry, metadata registries, Seen map for cycle detection, and configuration options
- **FormMeta**: The shape of form-specific metadata stored in the custom registry: fieldType override, display order, hidden flag, grid column hint, custom render function (runtime only)
- **ComponentMap**: A mapping from component names (Input, Select, Textarea, Checkbox, Switch, DatePicker, FileInput, RadioGroup) to UI component implementations, enabling UI library swapping

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can go from a Zod schema to a working, validated form in under 30 seconds using the runtime component
- **SC-002**: A developer can generate a static form component via the CLI in under 10 seconds
- **SC-003**: The runtime form and the generated static form produce identical behavior for the same schema — same fields, same validation, same submission output
- **SC-004**: All supported Zod types (18+ types listed in FR-002) render with appropriate form controls without manual configuration
- **SC-005**: Generated `.tsx` files compile without errors when checked by the TypeScript compiler in strict mode
- **SC-006**: Re-running the CLI does NOT overwrite user-owned config files
- **SC-007**: Types that are unrepresentable in JSON Schema (date, file) render correct form controls directly from Zod type information
- **SC-008**: Custom form registry annotations override default rendering behavior in 100% of annotated fields
- **SC-009**: Nested objects and arrays render with correct field paths and validation at any nesting depth
- **SC-010**: The core package (`zodform/core`) has zero runtime dependencies beyond the Zod peer dependency. The React package (`zodform/react`) declares `react`, `react-hook-form`, `@hookform/resolvers`, and `zod` as peer dependencies only — no direct runtime dependencies.

### Assumptions

- Zod v4 (v4.0.0+) is used — the `_zod` internals API does not exist in v3
- For runtime rendering: React 18+, React Hook Form 7+, and `@hookform/resolvers` are available in the consumer's project as peer dependencies (not bundled by zodform)
- For build-time codegen: shadcn/ui form components are installed in the consumer's project
- The Zod schema is exported as a named export from a TypeScript file
- `schema._zod.def`, `schema._zod.bag`, `schema._zod.parent`, `schema._zod.optin/optout` remain stable across Zod v4.x releases (documented as the library substrate API)
- The runtime renderer defaults to unstyled HTML primitives; shadcn/ui is available as a pre-built optional component map. The CLI defaults to shadcn/ui imports in generated code.
- Zod v3 support is explicitly out of scope for v1

### Out of Scope (v1)

- Zod v3 support (no `_zod` substrate API)
- Multi-step / wizard forms
- Drag-and-drop visual form builder
- Schema libraries other than Zod (Yup, Joi, ArkType, Valibot)
- Server-side rendering of forms (SSR-specific concerns)
- Form analytics or submission tracking
- Bi-directional sync (editing form updates schema)
