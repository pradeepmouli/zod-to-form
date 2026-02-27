# Tasks: zodform — Schema-Driven Form Generation

**Input**: Design documents from `/specs/001-zodform/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: TDD is REQUIRED per Constitution Principle V — "failing tests before implementation for every processor, the walker, the renderer, and the CLI."

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Exact file paths included in all descriptions

## Path Conventions

Monorepo with three packages under `packages/`:
- `packages/core/src/` — `@zod-to-form/core`
- `packages/react/src/` — `@zod-to-form/react`
- `packages/cli/src/` — `@zod-to-form/cli`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the pnpm monorepo package structure, configs, and tooling for all three packages.

- [x] T001 Verify pnpm-workspace.yaml includes `packages/*` glob and add if missing
- [x] T002 [P] Create packages/core/ directory structure: src/processors/, tests/processors/, tests/integration/ per plan.md
- [x] T003 [P] Create packages/react/ directory structure: src/components/, src/shadcn/, tests/integration/ per plan.md
- [x] T004 [P] Create packages/cli/ directory structure: src/, tests/integration/ per plan.md
- [x] T005 [P] Create packages/core/package.json with name `@zod-to-form/core`, peerDependencies: zod ^4.0.0, exports map for tree-shaking
- [x] T006 [P] Create packages/react/package.json with name `@zod-to-form/react`, peerDependencies: react, react-hook-form, @hookform/resolvers, zod; exports map including `./shadcn` subpath
- [x] T007 [P] Create packages/cli/package.json with name `@zod-to-form/cli`, dependencies: commander, jiti, prettier, chokidar; bin entry `zodform`
- [x] T008 [P] Create packages/core/tsconfig.json extending root tsconfig, strict mode, targeting ESNext, composite: true
- [x] T009 [P] Create packages/react/tsconfig.json extending root tsconfig, strict mode, jsx: react-jsx, composite: true
- [x] T010 [P] Create packages/cli/tsconfig.json extending root tsconfig, strict mode, module: NodeNext, composite: true
- [x] T011 [P] Create packages/core/vitest.config.ts with coverage enabled
- [x] T012 [P] Create packages/react/vitest.config.ts with jsdom environment and @testing-library/react setup
- [x] T013 [P] Create packages/cli/vitest.config.ts with node environment

**Checkpoint**: All three packages are scaffolded with correct configs — `pnpm install` succeeds at repo root

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core TypeScript types shared across all packages — ALL user stories depend on these interfaces from contracts/.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T014 Create packages/core/src/types.ts implementing all interfaces from specs/001-zodform/contracts/core-api.ts: FormField, FormFieldOption, FormFieldConstraints, FormProcessor, FormProcessorContext, FormMeta, ProcessParams, WalkOptions
- [x] T015 [P] Create packages/core/src/utils.ts with: `inferLabel(key: string): string` (camelCase → Title Case), `joinPath(parent: string | undefined, key: string): string`, `createBaseField(key: string, zodType: string): FormField`
- [x] T016 Create packages/core/src/index.ts exporting: `walkSchema`, `createProcessors`, `builtinProcessors` (stubs that throw — filled in Phase 3)
- [x] T017 [P] Create packages/react/src/index.ts exporting: `ZodForm`, `useZodForm`, `defaultComponentMap`, stubs for `shadcnComponentMap`
- [x] T018 [P] Create packages/cli/src/index.ts with commander program stub (no subcommands yet)

**Checkpoint**: Foundation ready — `pnpm type-check` passes on stubs; user story phases can now begin

---

## Phase 3: User Story 1 — Runtime Form Rendering (Priority: P1) 🎯 MVP

**Goal**: A developer renders `<ZodForm schema={mySchema} onSubmit={handler} />` and gets a complete, validated form for flat schemas containing string, number, boolean, enum, date, and file fields.

**Independent Test**: Render a form from a test schema with string, number, boolean, enum, date, file fields. Verify all fields render with correct input types, labels, RHF validation wires through, and onSubmit receives typed output.

### Tests for User Story 1 (TDD — write FIRST, verify they FAIL before implementing)

- [x] T019 [P] [US1] Write failing tests for string processor in packages/core/tests/processors/string.test.ts: text input type, email format detection, url format, minLength/maxLength from bag, required vs optional, template_literal → Input text with zodType 'template_literal'
- [x] T020 [P] [US1] Write failing tests for number processor in packages/core/tests/processors/number.test.ts: number input type, min/max from bag, integer step detection
- [x] T021 [P] [US1] Write failing tests for boolean processor in packages/core/tests/processors/boolean.test.ts: checkbox component, required flag
- [x] T022 [P] [US1] Write failing tests for date processor in packages/core/tests/processors/date.test.ts: DatePicker component, required flag
- [x] T023 [P] [US1] Write failing tests for enum processor in packages/core/tests/processors/enum.test.ts: Select component, options array with value/label pairs, nativeEnum support, literal handling
- [x] T024 [P] [US1] Write failing tests for file processor in packages/core/tests/processors/file.test.ts: FileInput component, required flag
- [x] T025 [P] [US1] Write failing tests for wrappers processor in packages/core/tests/processors/wrappers.test.ts: optional sets required=false, nullable sets required=false, default sets defaultValue, readonly sets readOnly=true, pipe unwraps to inner type
- [x] T026 [P] [US1] Write failing tests for fallback processor in packages/core/tests/processors/fallback.test.ts: transform → Input text, custom → Input text, any/unknown → Input text, record → key-value repeater with Input for key and processed value type
- [x] T027 [US1] Write failing walker tests in packages/core/tests/walker.test.ts: walkSchema on object schema returns ordered FormField[], unknown def.type falls through to fallback, cycle detection via seen WeakSet prevents infinite recursion
- [x] T028 [US1] Write failing tests for useZodForm hook in packages/react/tests/useZodForm.test.ts: hook returns { form, fields }, walkSchema result is memoized (same schema ref → same fields array ref)
- [x] T029 [US1] Write failing tests for FieldRenderer in packages/react/tests/FieldRenderer.test.tsx: each field component type renders correct HTML element, label htmlFor matches input id, aria-invalid on error, required attribute present for required fields
- [x] T030 [US1] Write failing tests for ZodForm component in packages/react/tests/ZodForm.test.tsx: renders all fields from schema, validation errors display on submit, onSubmit called with typed data on valid submit
- [x] T031 [US1] Write failing runtime form integration test in packages/react/tests/integration/runtime-form.test.tsx: full schema with all basic field types renders, submits, validates end-to-end

### Implementation for User Story 1

- [x] T032 [P] [US1] Implement packages/core/src/processors/string.ts: processString reads def.type === 'string', reads bag.format for email/url/uuid to set props.type, reads bag.minLength/maxLength for constraints, sets component = 'Input'; processTemplateLiteral handles def.type === 'template_literal' → component = 'Input', zodType = 'template_literal'
- [x] T033 [P] [US1] Implement packages/core/src/processors/number.ts: processNumber reads def.type === 'number'|'bigint', reads bag.minimum/maximum, sets component = 'Input', props.type = 'number'
- [x] T034 [P] [US1] Implement packages/core/src/processors/boolean.ts: processBoolean sets component = 'Checkbox', required = true (booleans are always present)
- [x] T035 [P] [US1] Implement packages/core/src/processors/date.ts: processDate sets component = 'DatePicker'
- [x] T036 [P] [US1] Implement packages/core/src/processors/enum.ts: processEnum reads def.entries for z.enum(), reads def.values for z.nativeEnum(), maps to options array, sets component = 'Select'; processLiteral sets single fixed option, readOnly=true
- [x] T037 [P] [US1] Implement packages/core/src/processors/file.ts: processFile sets component = 'FileInput'
- [x] T038 [P] [US1] Implement packages/core/src/processors/wrappers.ts: each wrapper unwraps def.innerType and re-processes, setting required/defaultValue/readOnly flags as appropriate; processOptional sets required=false; processNullable sets required=false; processDefault reads def.defaultValue; processReadonly sets readOnly=true; processPipe processes def.in (input type)
- [x] T039 [P] [US1] Implement packages/core/src/processors/fallback.ts: processFallback for transform, custom, any, unknown → component = 'Input', zodType preserved for reference; processRecord reads def.keyType and def.valueType, produces component = 'Input' with zodType = 'record' and arrayItem-like template for key-value pairs
- [x] T040 [US1] Implement packages/core/src/registry.ts: export builtinProcessors Record<string, FormProcessor> mapping all def.type strings to processors from T032-T039; export createProcessors(custom) that merges with builtinProcessors
- [x] T041 [US1] Implement packages/core/src/walker.ts: walkSchema(schema, options) validates top-level is z.object(), creates FormProcessorContext with seen WeakSet, maxDepth=5, calls process() on each shape entry, returns sorted FormField[] (by order if set, then schema declaration order)
- [x] T042 [US1] Update packages/core/src/index.ts to export real implementations of walkSchema, createProcessors, builtinProcessors from T040 and T041
- [x] T043 [P] [US1] Implement packages/react/src/components/Input.tsx: renders native `<input>` forwarding all props, adds id from field.key, aria-invalid from error state
- [x] T044 [P] [US1] Implement packages/react/src/components/Textarea.tsx: renders native `<textarea>` forwarding props
- [x] T045 [P] [US1] Implement packages/react/src/components/Checkbox.tsx: renders native `<input type="checkbox">` forwarding props
- [x] T046 [P] [US1] Implement packages/react/src/components/Switch.tsx: renders native `<input type="checkbox" role="switch">` forwarding props
- [x] T047 [P] [US1] Implement packages/react/src/components/Select.tsx: renders native `<select>` with `<option>` per entry from options prop, forwarding props
- [x] T048 [P] [US1] Implement packages/react/src/components/DatePicker.tsx: renders native `<input type="date">` forwarding props
- [x] T049 [P] [US1] Implement packages/react/src/components/FileInput.tsx: renders native `<input type="file">` forwarding props
- [x] T050 [P] [US1] Implement packages/react/src/components/RadioGroup.tsx: renders `<fieldset>` with `<input type="radio">` per option
- [x] T051 [US1] Implement packages/react/src/components/index.ts: export defaultComponentMap with all components from T043-T050, plus FormField/FormLabel/FormDescription/FormMessage HTML primitive wrappers (div/label/p/p)
- [x] T052 [US1] Implement packages/react/src/useZodForm.ts: hook that calls walkSchema memoized via useMemo(schema reference), calls useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues }) from RHF, returns { form, fields }
- [x] T053 [US1] Implement packages/react/src/FieldRenderer.tsx: recursive component that maps FormField to JSX using ComponentMap, renders label with htmlFor, input with aria-invalid/required, description text, and error message; handles field.hidden by rendering null; applies field.order sorting to children
- [x] T054 [US1] Implement packages/react/src/ZodForm.tsx: wraps useZodForm, passes form to FormProvider from RHF, renders `<form onSubmit={form.handleSubmit(onSubmit)}>` with FieldRenderer for each field, renders children (submit button etc.), accepts schema/onSubmit/defaultValues/components/formRegistry/processors/className props
- [x] T055 [US1] Update packages/react/src/index.ts to export ZodForm, useZodForm, defaultComponentMap with real implementations

**Checkpoint**: `<ZodForm schema={flatSchema} onSubmit={fn}>` renders correctly, validates, and submits typed data. All US1 tests pass.

---

## Phase 4: User Story 2 — Form Metadata via Zod Registry (Priority: P1)

**Goal**: A developer annotates Zod fields with form-specific hints (fieldType, order, hidden, labels, placeholders) via the Zod v4 registry system, and `<ZodForm>` reflects those annotations in the rendered output.

**Independent Test**: Create a schema with custom form registry annotations (fieldType: textarea, switch; order; hidden) and global metadata (title, description, examples). Verify each annotation is reflected in the rendered form.

### Tests for User Story 2 (TDD — write FIRST, verify they FAIL before implementing)

- [x] T056 [P] [US2] Write failing metadata resolver tests in packages/core/tests/metadata.test.ts: form registry fieldType overrides global, .meta({ title }) sets label, .meta({ examples: ["x"] }) sets placeholder, .describe("...") sets description, form registry hidden sets hidden=true, form registry order sets order, form registry gridColumn sets gridColumn on FormField
- [x] T057 [US2] Write failing metadata integration tests in packages/react/tests/ZodForm.test.tsx (extend): textarea renders for fieldType=textarea, switch renders for fieldType=switch, custom label appears, placeholder from examples, hidden field absent from DOM but present in form state, order=1 field renders first, gridColumn='1 / -1' applies style={{ gridColumn: '1 / -1' }} on field wrapper

### Implementation for User Story 2

- [x] T058 [US2] Implement packages/core/src/metadata.ts: resolveMetadata(schema, formRegistry, globalRegistry) function that reads (1) formRegistry.get(schema) for fieldType/order/hidden/gridColumn/render, (2) schema._zod.bag or globalRegistry for title/description/examples/deprecated; returns merged FormMeta; form registry takes precedence
- [x] T059 [US2] Update packages/core/src/walker.ts to call resolveMetadata() in process() and apply results to FormField before returning: set field.label from title, field.description from description, field.placeholder from examples[0], field.hidden from hidden, field.order from order, field.gridColumn from gridColumn
- [x] T060 [US2] Update packages/core/src/processors/string.ts to apply fieldType override from metadata (e.g., fieldType='textarea' → component = 'Textarea')
- [x] T061 [US2] Update packages/core/src/processors/boolean.ts to apply fieldType override from metadata (e.g., fieldType='switch' → component = 'Switch')
- [x] T062 [US2] Update packages/react/src/FieldRenderer.tsx to apply fieldType overrides: check field.component and render the mapped component from ComponentMap; if field.gridColumn is set, apply `style={{ gridColumn: field.gridColumn }}` on the field wrapper element
- [x] T063 [US2] Update packages/react/src/ZodForm.tsx to accept formRegistry prop and pass it through useZodForm → walkSchema → metadata resolver

**Checkpoint**: Form registry annotations take effect in rendered output. All US2 tests pass. US1 tests still pass.

---

## Phase 5: User Story 3 — Build-Time Code Generation (Priority: P1)

**Goal**: Running `zodform generate --schema src/schemas/user.ts --export userSchema --out src/components/` generates a static `UserForm.tsx` with zero runtime zodform dependency, readable like hand-written code, compiling with `tsc --noEmit` in strict mode.

**Independent Test**: Run the CLI against a test flat schema, inspect the generated `.tsx`, compile it with tsc in strict mode, render it in a test harness, verify behavior matches runtime form.

### Tests for User Story 3 (TDD — write FIRST, verify they FAIL before implementing)

- [x] T064 [P] [US3] Write failing loader tests in packages/cli/tests/loader.test.ts: loadSchema resolves named export from a .ts file via jiti, throws clear error when file not found, throws clear error when export name not found, throws clear error when export is not a Zod schema
- [x] T065 [P] [US3] Write failing codegen tests in packages/cli/tests/codegen.test.ts: generateFormComponent from flat FormField[] produces valid TSX string with useForm/zodResolver imports, correct FormField JSX per field type, no @zod-to-form/* imports in output, all field names appear in output
- [x] T066 [US3] Write failing CLI e2e test in packages/cli/tests/integration/cli-e2e.test.ts: `generate` command with valid --schema/--export/--out writes a file to disk; --dry-run prints output without writing; re-run does not error; --force re-generates
- [x] T067 [US3] Write failing generated-compiles test in packages/cli/tests/integration/generated-compiles.test.ts: generated UserForm.tsx passes `tsc --noEmit` in strict mode with no errors

### Implementation for User Story 3

- [x] T068 [US3] Implement packages/cli/src/loader.ts: loadSchema(schemaPath, exportName) uses createJiti(import.meta.url) to dynamically import the schema file, reads the named export, validates it is a Zod schema (has _zod property), throws descriptive errors for each failure mode
- [x] T069 [P] [US3] Implement packages/cli/src/templates.ts: template functions that return code strings for: file header (imports from react-hook-form, zod, @hookform/resolvers/zod, UI components), useForm setup block, FormField JSX for each field type (Input/Textarea/Select/Checkbox/DatePicker/FileInput/RadioGroup), form wrapper JSX
- [x] T070 [US3] Implement packages/cli/src/codegen.ts: generateFormComponent(fields, config) assembles .tsx source from templates, walks FormField[] to emit JSX for each field using shadcn or unstyled UI imports per config.ui; zero @zod-to-form/* imports in output; if field.gridColumn is set, emit `style={{ gridColumn: '<value>' }}` on the generated field wrapper element
- [x] T071 [US3] Implement packages/cli/src/format.ts: formatCode(code, outputPath) calls prettier.resolveConfig(outputPath) then prettier.format(code, { filepath: outputPath, ...config }) to respect user's prettier config
- [x] T072 [US3] Implement packages/cli/src/index.ts: add `generate` subcommand to commander program with options --schema, --export, --out, --name, --ui (default: shadcn), --force, --dry-run; action calls loadSchema → walkSchema → generateFormComponent → formatCode → write file (or print if --dry-run); skips writing if output file exists and --force not set
- [x] T073 [US3] Create packages/react/src/shadcn/index.ts: export shadcnComponentMap that maps ComponentMap keys to shadcn/ui form component imports (Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage, Input, Textarea, Checkbox, Switch, Select, etc.)

**Checkpoint**: `zodform generate --schema ./test-schema.ts --export testSchema --out ./out/` writes a compilable UserForm.tsx. All US3 tests pass. US1 and US2 tests still pass.

---

## Phase 6: User Story 4 — Custom Field Rendering (Priority: P2)

**Goal**: A developer registers a custom render function or fieldType override (e.g., combobox) in the form registry, and the runtime renderer uses it. In codegen mode, a TODO comment is emitted for unsupported custom renderers.

**Independent Test**: Register various field overrides (combobox for enum, custom render function for a field). Verify each takes effect in the rendered form; verify codegen emits a TODO comment for custom render.

### Tests for User Story 4 (TDD — write FIRST, verify they FAIL before implementing)

- [X] T074 [P] [US4] Write failing tests for custom render function in packages/react/tests/FieldRenderer.test.tsx (extend): field with FormMeta.render function → custom render function is called with (field, props); field with fieldType='combobox' → combobox component used
- [X] T075 [P] [US4] Write failing tests in packages/cli/tests/codegen.test.ts (extend): field with render function in FormMeta → output contains `{/* TODO: custom renderer for fieldName */}` comment

### Implementation for User Story 4

- [X] T076 [US4] Update packages/react/src/FieldRenderer.tsx: if field has FormMeta.render function in resolved metadata, call render(field, rhfProps) instead of standard component; wrap result in field wrapper with label/error
- [X] T077 [US4] Add combobox to packages/react/src/components/index.ts defaultComponentMap: export a ComboboxFallback using native `<datalist>` + `<input list>` as unstyled primitive; update ComponentMap interface in types.ts to include Combobox
- [X] T078 [US4] Update packages/cli/src/codegen.ts: detect when FormField has a custom render function (render key present in FormMeta) and emit `{/* TODO: custom renderer for {fieldName} — replace with your component */}` in the generated JSX output

**Checkpoint**: Custom render function executes at runtime; combobox variant renders; codegen emits TODO. All US4 tests pass. All prior tests still pass.

---

## Phase 7: User Story 5 — Nested Objects and Arrays (Priority: P2)

**Goal**: Schemas with nested `z.object()` render as grouped sections; `z.array()` schemas render with add/remove controls via `useFieldArray`; discriminated unions render select-then-reveal.

**Independent Test**: Create a schema with nested objects and arrays. Render the form, verify grouped sections appear for objects and add/remove controls work for arrays with min constraint enforcement.

### Tests for User Story 5 (TDD — write FIRST, verify they FAIL before implementing)

- [X] T079 [P] [US5] Write failing object processor tests in packages/core/tests/processors/object.test.ts: processObject recurses into def.shape, returns FormField with children array, each child has correct key (e.g., "address.street"), label inferred from child key
- [X] T080 [P] [US5] Write failing array processor tests in packages/core/tests/processors/array.test.ts: processArray processes def.element as arrayItem template, reads bag for min/max constraints, returns FormField with arrayItem set; tuple returns children with positional keys
- [X] T081 [P] [US5] Write failing union processor tests in packages/core/tests/processors/union.test.ts: processUnion generates options from union variants (literal labels), processDiscriminatedUnion generates Select for discriminator key + children per variant
- [X] T082 [US5] Write failing nested form integration test in packages/react/tests/integration/runtime-form.test.tsx (extend): nested object form renders address.street and address.city fields; array form renders with add/remove buttons; remove disabled when at min(1); discriminatedUnion shows correct variant fields after select change

### Implementation for User Story 5

- [X] T083 [US5] Implement packages/core/src/processors/object.ts: processObject iterates def.shape entries, calls walker.process() recursively on each child schema with updated path, returns field with children = FormField[] sorted by order; handles z.intersection() by merging shapes from both sides
- [X] T084 [US5] Implement packages/core/src/processors/array.ts: processArray calls walker.process() on def.element with isArrayItem=true to produce arrayItem template; reads bag.minLength/maxLength for constraints; processTuple produces children with index-keyed paths ("items.0", "items.1", etc.)
- [X] T085 [US5] Implement packages/core/src/processors/union.ts: processUnion generates options from union variant literal labels, component='Select'; processDiscriminatedUnion generates a Select for the discriminator field (component='Select') plus a variants map (discriminator value → children FormField[]) stored in field.props._variants; both handle cycle detection via ctx.seen
- [X] T086 [US5] Update packages/core/src/registry.ts to include object, array, tuple, union, discriminatedUnion, intersection processors from T083-T085
- [X] T087 [US5] Update packages/core/src/processors/wrappers.ts to add processLazy: checks ctx.seen for cycle, returns fallback Input if cycle detected or maxDepth reached, otherwise processes def.getter() result
- [X] T088 [US5] Update packages/react/src/FieldRenderer.tsx to render field.children as a grouped `<fieldset>` with `<legend>` label (nested object sections)
- [X] T089 [US5] Update packages/react/src/FieldRenderer.tsx to render field.arrayItem using useFieldArray from RHF: renders each array item with FieldRenderer, add button (calls append), remove button (calls remove, disabled when at constraints.minLength)
- [X] T090 [US5] Update packages/react/src/FieldRenderer.tsx to render discriminatedUnion fields: renders discriminator Select using watch(), conditionally renders the correct variant children from props._variants based on current discriminator value, calls unregister on variant switch
- [X] T091 [US5] Update packages/cli/src/codegen.ts and packages/cli/src/templates.ts to emit correct JSX for nested objects (indented FormField groups) and array fields (useFieldArray loop with append/remove) in generated output

**Checkpoint**: Nested objects render as grouped sections; arrays have working add/remove; discriminated unions show correct variant. All US5 tests pass. All prior tests still pass.

---

## Phase 8: User Story 6 — Server Action Generation (Priority: P2)

**Goal**: Running the CLI with `--server-action` generates a Next.js server action file with `"use server"`, `safeParse()` validation, and typed `ProfileFormState` return type alongside the form component.

**Independent Test**: Run CLI with --server-action, submit the generated form, verify server-side validation runs and returns typed errors.

### Tests for User Story 6 (TDD — write FIRST, verify they FAIL before implementing)

- [X] T092 [P] [US6] Write failing server action generator tests in packages/cli/tests/server-action.test.ts: generateServerAction produces string with "use server" directive, safeParse call on formData, fieldErrors in return value, correct TypeScript types for state; no @zod-to-form/* imports

### Implementation for User Story 6

- [X] T093 [US6] Implement packages/cli/src/server-action.ts: generateServerAction(config) emits a TypeScript source string with "use server" directive, schema import, ProfileFormState type (errors: Partial<Record<fieldName, string[]>>, message: string | null), async action function that calls schema.safeParse(Object.fromEntries(formData)), returns fieldErrors on failure, success message on pass
- [X] T094 [US6] Update packages/cli/src/index.ts to support --server-action flag: when set, call generateServerAction(config) → formatCode → write alongside form component; filename: `{name.toLowerCase()}-action.ts`

**Checkpoint**: `--server-action` flag produces a compilable, typed server action file. All US6 tests pass. All prior tests still pass.

---

## Phase 9: User Story 7 — Schema Watch Mode (Priority: P3)

**Goal**: Running the CLI with `--watch` monitors the schema file for changes and regenerates the form component within 1 second of any change, without overwriting user-owned config files.

**Independent Test**: Start watch mode, add a field to the schema file, verify form component is regenerated within 1 second with the new field.

### Tests for User Story 7 (TDD — write FIRST, verify they FAIL before implementing)

- [X] T095 [P] [US7] Write failing watcher tests in packages/cli/tests/integration/cli-e2e.test.ts (extend): watch mode detects schema file change, triggers regeneration; config files not overwritten on re-generation; regeneration completes within 1 second of change event

### Implementation for User Story 7

- [X] T096 [US7] Implement packages/cli/src/watcher.ts: startWatch(schemaPath, regenerate) uses chokidar.watch(schemaPath, { persistent: true, ignoreInitial: true }), debounces change events by 200ms, calls regenerate() on each change event, logs change detected and regeneration complete messages; handles SIGINT for graceful shutdown (watcher.close())
- [X] T097 [US7] Update packages/cli/src/index.ts to support --watch flag: when set, after initial generation call startWatch(schemaPath, () => runGenerate(config)) using T096; log "Watching for changes..." on start

**Checkpoint**: Watch mode detects changes and regenerates within 1 second. All US7 tests pass. All prior tests still pass.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Integration tests, behavioral equivalence validation, type checking, and quickstart validation.

- [X] T098 [P] Implement packages/core/tests/integration/full-schema.test.ts: walkSchema on a 20+ field schema covering all supported Zod types completes in <10ms, produces correct FormField[] with correct components, labels, constraints, and nesting
- [X] T099 [P] Implement packages/react/tests/integration/equivalence.test.tsx: render runtime `<ZodForm>` and the CLI-generated static form side-by-side with identical schemas, verify they produce the same field count, same field labels, same validation behavior on submit (SC-003)
- [X] T100 [P] Update packages/core/src/index.ts to ensure tree-shakeable exports (named exports only, no barrel side effects)
- [X] T101 [P] Update packages/react/src/shadcn/index.ts shadcnComponentMap to wire actual shadcn/ui components (Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage, Input, Textarea, Checkbox, Switch, Select, Button) using correct shadcn import paths from `@/components/ui/*`
- [X] T102 Run `pnpm type-check` across all packages and fix any TypeScript strict mode violations
- [X] T103 Run `pnpm test` across all packages and verify all tests pass with no failures
- [X] T104 Run `pnpm run lint` with oxlint and fix any lint violations
- [X] T105 Validate all quickstart.md scenarios manually: runtime ZodForm renders, shadcn component map works, CLI generate runs, nested/array/discriminated union schemas render correctly
- [X] T106 [P] Add CLI end-to-end performance benchmark in packages/cli/tests/integration/cli-e2e.test.ts (extend): time `zodform generate` on a 50-field schema end-to-end (load → walk → codegen → format → write) and assert completes in <10 seconds (SC-002)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Phase 2 — no dependencies on other user stories
- **US2 (Phase 4)**: Depends on Phase 2 — no dependencies on other user stories; integrates with US1 walker
- **US3 (Phase 5)**: Depends on Phase 2 — depends on US1 walker (walkSchema must work); independent of US2
- **US4 (Phase 6)**: Depends on US1 (FieldRenderer) and US2 (metadata) and US3 (codegen) being complete
- **US5 (Phase 7)**: Depends on Phase 2 and US1 walker — independent of US2/US3/US4
- **US6 (Phase 8)**: Depends on US3 (CLI infrastructure) — independent of US4/US5
- **US7 (Phase 9)**: Depends on US3 (CLI infrastructure) — independent of US4/US5/US6
- **Polish (Phase 10)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Start after Phase 2 — no story dependencies
- **US2 (P1)**: Start after Phase 2 — no story dependencies (may be developed in parallel with US1)
- **US3 (P1)**: Start after US1 walker is complete (T041/T042) — no US2 dependency required for MVP codegen
- **US4 (P2)**: Start after US1 + US2 + US3 are complete
- **US5 (P2)**: Start after US1 is complete — no US2/US3 dependency required
- **US6 (P2)**: Start after US3 is complete — no US4/US5 dependency required
- **US7 (P3)**: Start after US3 is complete — no US4/US5/US6 dependency required

### Within Each User Story

- Tests MUST be written and FAIL before implementation begins (Constitution Principle V)
- Processor implementations (T032-T039) can run in parallel (different files)
- Component implementations (T043-T050) can run in parallel (different files)
- Walker depends on registry which depends on all processors
- FieldRenderer depends on components/index
- ZodForm depends on useZodForm and FieldRenderer

---

## Parallel Example: User Story 1

```bash
# Phase 1: Run all test writes in parallel (all [P]):
Task: "Write failing string processor tests in packages/core/tests/processors/string.test.ts"    # T019
Task: "Write failing number processor tests in packages/core/tests/processors/number.test.ts"    # T020
Task: "Write failing boolean processor tests in packages/core/tests/processors/boolean.test.ts"  # T021
Task: "Write failing date processor tests in packages/core/tests/processors/date.test.ts"        # T022
Task: "Write failing enum processor tests in packages/core/tests/processors/enum.test.ts"        # T023
Task: "Write failing file processor tests in packages/core/tests/processors/file.test.ts"        # T024
Task: "Write failing wrappers processor tests in packages/core/tests/processors/wrappers.test.ts"# T025

# Phase 2: Run all processor implementations in parallel (all [P]):
Task: "Implement packages/core/src/processors/string.ts"   # T032
Task: "Implement packages/core/src/processors/number.ts"   # T033
Task: "Implement packages/core/src/processors/boolean.ts"  # T034
Task: "Implement packages/core/src/processors/date.ts"     # T035
Task: "Implement packages/core/src/processors/enum.ts"     # T036
Task: "Implement packages/core/src/processors/file.ts"     # T037
Task: "Implement packages/core/src/processors/wrappers.ts" # T038

# Phase 3: Run all component implementations in parallel (all [P]):
Task: "Implement packages/react/src/components/Input.tsx"     # T043
Task: "Implement packages/react/src/components/Textarea.tsx"  # T044
Task: "Implement packages/react/src/components/Checkbox.tsx"  # T045
Task: "Implement packages/react/src/components/Switch.tsx"    # T046
Task: "Implement packages/react/src/components/Select.tsx"    # T047
Task: "Implement packages/react/src/components/DatePicker.tsx"# T048
Task: "Implement packages/react/src/components/FileInput.tsx" # T049
Task: "Implement packages/react/src/components/RadioGroup.tsx"# T050
```

---

## Implementation Strategy

### MVP First (P1 User Stories 1, 2, 3)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (runtime rendering, flat schemas)
4. **STOP and VALIDATE**: `<ZodForm schema={flatSchema} onSubmit={fn}>` works end-to-end
5. Complete Phase 4: User Story 2 (metadata + registry)
6. **VALIDATE**: Metadata annotations take effect in rendered form
7. Complete Phase 5: User Story 3 (CLI codegen)
8. **VALIDATE**: `zodform generate` produces compilable output matching runtime behavior
9. **MVP COMPLETE** — Deploy/publish v0.1.0

### Incremental Delivery (P2/P3 Additions)

1. Add US4 (Custom Field Rendering) — enhances US1+US2+US3
2. Add US5 (Nested Objects and Arrays) — extends schema support
3. Add US6 (Server Action Generation) — adds Next.js ergonomics
4. Add US7 (Schema Watch Mode) — improves DX
5. Each story adds value without breaking previous stories

### Parallel Team Strategy (3 developers after Phase 2)

Once Foundational phase (Phase 2) is complete:
- **Developer A**: US1 (walker + processors + runtime renderer)
- **Developer B**: US2 (metadata + registry annotations)
- **Developer C**: US5 (object/array/union processors — prepares for US1 merge)

After US1 + US3 complete:
- **Developer A**: US4 (custom rendering)
- **Developer B**: US6 (server actions)
- **Developer C**: US7 (watch mode)

---

## Task Summary

| Phase | Tasks | Parallelizable | User Story |
|-------|-------|---------------|------------|
| Phase 1: Setup | T001–T013 | 11/13 [P] | — |
| Phase 2: Foundational | T014–T018 | 3/5 [P] | — |
| Phase 3: US1 Runtime | T019–T055 | 24/37 [P] | US1 (P1) |
| Phase 4: US2 Metadata | T056–T063 | 2/8 [P] | US2 (P1) |
| Phase 5: US3 Codegen | T064–T073 | 4/10 [P] | US3 (P1) |
| Phase 6: US4 Custom | T074–T078 | 2/5 [P] | US4 (P2) |
| Phase 7: US5 Nesting | T079–T091 | 5/13 [P] | US5 (P2) |
| Phase 8: US6 Server Action | T092–T094 | 1/3 [P] | US6 (P2) |
| Phase 9: US7 Watch Mode | T095–T097 | 1/3 [P] | US7 (P3) |
| Phase 10: Polish | T098–T105 | 4/8 [P] | — |
| **Total** | **105 tasks** | **57 [P]** | 7 stories |

---

## Notes

- All `[P]` tasks operate on different files and have no incomplete-task dependencies
- `[Story]` label maps each task to a specific user story for traceability
- TDD is mandatory (Constitution Principle V): tests must FAIL before implementation begins
- Commit after each logical group of tasks (e.g., after all processors, after walker, after renderer)
- Stop at each **Checkpoint** to validate the story independently before proceeding
- Avoid: vague tasks, same-file conflicts between parallel tasks, cross-story dependencies that break independence
