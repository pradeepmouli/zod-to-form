# Feature Specification: API Surface Cleanup

**Feature Branch**: `005-api-surface-cleanup`
**Created**: 2026-03-23
**Status**: Draft
**Input**: User description: "z2f API surface cleanup: merge propMap into props, remove gridColumn, add fieldTemplate, zero-dep codegen eject, add disabled/helpText/deprecated, remove sectionComponents, fieldset component dispatch"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Unified Props Configuration (Priority: P1)

A library consumer configures a form field with both literal prop values and field-binding expressions in a single `props` object. They no longer need to split configuration between `props` and `propMap` — all prop entries live in one place, and the system automatically detects which values are field expressions (e.g., `field.onChange`) and resolves them from the form controller at render time.

**Why this priority**: This is the most impactful API simplification. Every form configuration touches `props`, and the current split between `props` and `propMap` is the single largest source of confusion for new users. All other changes build on this unified surface.

**Independent Test**: Can be fully tested by configuring a controlled component (e.g., a Select) with mixed literal and field-expression values in a single `props` object and verifying the rendered component receives correct resolved values.

**Acceptance Scenarios**:

1. **Given** a field config with `props: { placeholder: 'Pick one', onValueChange: 'field.onChange' }`, **When** the form renders, **Then** the `placeholder` prop passes through as the literal string `'Pick one'` and `onValueChange` resolves to the form controller's `onChange` handler.
2. **Given** a component override with `{ controlled: true, props: { checked: 'field.value', onCheckedChange: 'field.onChange' } }`, **When** the form renders a checkbox, **Then** `checked` reflects the current form value and `onCheckedChange` triggers form state updates.
3. **Given** existing configurations using the old `propMap` key, **When** a user attempts to use `propMap`, **Then** the system raises a clear error or warning indicating `propMap` has been removed and values should be placed in `props`.

---

### User Story 2 - Zero-Dependency Generated Code (Priority: P1)

A developer uses the CLI to generate a form component and receives a fully self-contained output file. The generated code depends only on their own component library, the form library, the schema library, and the resolver — nothing from z2f itself. They can delete z2f from their project after generation and the form still compiles and works.

**Why this priority**: The "eject and own" promise is a core value proposition. A hidden runtime dependency on z2f undermines trust and complicates dependency management for consumers. This is tied with P1 because it directly affects adoption.

**Independent Test**: Can be tested by generating a form with the CLI, removing z2f packages from the project, and verifying the generated file compiles and renders correctly.

**Acceptance Scenarios**:

1. **Given** a project using the shadcn preset, **When** the CLI generates a form, **Then** the output file does not import from `@zod-to-form/core` or `@zod-to-form/react`.
2. **Given** a project using the html preset, **When** the CLI generates a form that requires value normalization, **Then** the normalization logic is inlined directly in the generated file (~30 lines).
3. **Given** either preset, **When** the CLI generates a form, **Then** any type utilities previously imported from z2f are inlined as local type definitions in the generated file.

---

### User Story 3 - Customizable Field Template (Priority: P2)

A developer wants to change how field composition works — the arrangement of label, input, description, and error message around each form field. They configure a custom field template component that controls this layout, either by overriding the preset default or by editing the template file emitted alongside their generated form.

**Why this priority**: Field composition is the most common customization need after component swapping. Currently it requires the `render` escape hatch, which abandons all form-generation benefits.

**Independent Test**: Can be tested by providing a custom field template that reorders label and description, rendering a form, and verifying the custom layout appears.

**Acceptance Scenarios**:

1. **Given** the shadcn preset with no field template override, **When** a form renders, **Then** the default shadcn field template (FormField/FormLabel/FormControl/FormDescription/FormMessage) is used.
2. **Given** a config with `components.fieldTemplate` pointing to a custom component, **When** a form renders, **Then** the custom template is used instead of the preset default.
3. **Given** the CLI generates a form, **When** a preset with a default field template is active, **Then** the CLI emits the template as a concrete file alongside the generated form for the user to edit.

---

### User Story 4 - Object Fields as Tabs/Accordion/Stepper (Priority: P2)

A developer building a multi-section form wants to render grouped object fields as tabs, accordion panels, or wizard steps. They assign a `component` name to each nested object field in the config, and the form resolves those components through the same module as leaf fields — no special API, just the existing `component` and `props` config keys.

**Why this priority**: Multi-section layout is a frequent real-world need (checkout flows, settings pages, onboarding wizards). Currently all object fields render as `<fieldset>` with no override path.

**Independent Test**: Can be tested by defining a schema with two nested objects, configuring them with `component: 'TabPanel'`, providing a TabPanel component in the component module, and verifying the rendered output uses the custom components.

**Acceptance Scenarios**:

1. **Given** an object field with `component: 'TabPanel'` in its config and a `TabPanel` component in the component module, **When** the form renders, **Then** the object's children render inside the `TabPanel` component instead of a `<fieldset>`.
2. **Given** an object field with no `component` override, **When** the form renders, **Then** the default `<fieldset><legend>` behavior is preserved (backward compatible).
3. **Given** multiple object fields with `component: 'TabPanel'` and different `order` values, **When** the form renders, **Then** the panels appear in the configured order.

---

### User Story 5 - Layout via Props (Priority: P3)

A developer removes the dedicated `gridColumn` configuration and instead uses `props` to pass layout hints (e.g., className for Tailwind grid classes, or inline styles). This keeps the config surface minimal and consistent — layout is just another prop, not a special case.

**Why this priority**: Small cleanup that follows naturally from the unified `props` model. Removes a one-off special case from both the config types and the renderer.

**Independent Test**: Can be tested by configuring a field with `props: { className: 'col-span-2' }` and verifying the rendered wrapper element receives the class.

**Acceptance Scenarios**:

1. **Given** a field with `props: { className: 'col-span-2' }`, **When** the form renders, **Then** the field wrapper element includes the `col-span-2` class.
2. **Given** a field with `props: { style: { gridColumn: 'span 2' } }`, **When** the form renders, **Then** the field wrapper element has the inline grid style applied.

---

### User Story 6 - Unified Component Resolution (Priority: P3)

A developer configures section-level components through the same `componentModule` used for all other components, rather than through a separate `sectionComponents` map. One resolution mechanism for all components.

**Why this priority**: Consistency improvement. Reduces cognitive load by having a single dispatch path for all components.

**Independent Test**: Can be tested by providing a section component in the component module and verifying the section renders using that component.

**Acceptance Scenarios**:

1. **Given** a component named `MySection` in the component module, **When** a form field is assigned `section: 'MySection'`, **Then** the section resolves the component from the same module used for input components.
2. **Given** the old `sectionComponents` config key is used, **When** the form initializes, **Then** a clear error or warning indicates the key has been removed.

---

### User Story 7 - Disabled, Help Text, and Deprecated Fields (Priority: P3)

A developer marks form fields as disabled (greyed out, non-interactive), adds help text below the input (distinct from the description below the label), and surfaces deprecation indicators for fields the schema marks as deprecated. These are small, high-polish additions that round out the field configuration surface.

**Why this priority**: Each is a small, well-scoped addition. They add polish and completeness but don't change the core architecture.

**Independent Test**: Each can be tested independently — render a form with `disabled: true` and verify the input is non-interactive; render with `helpText` and verify text appears below the input; render a field from a schema with a deprecated property and verify a visual indicator appears.

**Acceptance Scenarios**:

1. **Given** a field config with `disabled: true`, **When** the form renders, **Then** the input element is visually greyed out and non-interactive.
2. **Given** a field config with `helpText: 'Format: YYYY-MM-DD'`, **When** the form renders, **Then** the help text appears below the input, visually distinct from the description that appears below the label.
3. **Given** a schema field that has been marked as deprecated in the global registry, **When** the form renders, **Then** the field displays a visual deprecation indicator (e.g., strikethrough label, warning badge).

---

### Edge Cases

- What happens when a `props` value looks like a field expression string (e.g., `'field.value'`) but is intended as a literal string? The system should treat only the exact known set of field expressions as bindings. Any string not in the known set (`field.value`, `field.onChange`, `field.onBlur`, `field.ref`, `field.name`) passes through as a literal.
- What happens when a custom field template component is missing from the component module? The system should fall back to the preset default template and emit a console warning.
- What happens when `disabled: true` and `readOnly: true` are both set? Both attributes apply to the rendered element — the browser handles the combined semantics (disabled takes precedence visually).
- What happens when an object field has a `component` override but the component is not found in the module? The system should fall back to the default `<fieldset>` rendering and emit a warning.
- What happens when a field has both `description` and `helpText`? Both render — description below the label, help text below the input.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST accept field-binding expressions (the exact strings `field.value`, `field.onChange`, `field.onBlur`, `field.ref`, `field.name`) as values within the `props` object and resolve them from the form controller at render time.
- **FR-002**: The system MUST treat all `props` values that are not recognized field expressions as literal pass-through values.
- **FR-003**: The system MUST remove the `propMap` key from `FieldConfigBase` and `ComponentOverride`. Configurations using `propMap` MUST produce a clear error message.
- **FR-004**: The system MUST remove the `gridColumn` key from `FieldConfigBase` and `FormField`. Layout hints MUST be expressible through `props`.
- **FR-005**: The system MUST remove the `sectionComponents` key from `RuntimeComponentConfig`. Section components MUST resolve through the same component module as all other components.
- **FR-006**: The system MUST support a `fieldTemplate` key on `ComponentsConfig` that specifies a component controlling field composition (label + input + description + error layout).
- **FR-007**: Each preset MUST provide a default field template. The shadcn preset MUST use shadcn form primitives. The html preset MUST use plain semantic HTML elements.
- **FR-008**: An explicit `components.fieldTemplate` value MUST override the preset's default field template.
- **FR-009**: Object-type fields MUST resolve their wrapper component from `FieldConfig.component` via the component module when specified.
- **FR-010**: Object-type fields without a `component` override MUST continue to render with the default fieldset/legend behavior.
- **FR-011**: CLI-generated code using the shadcn preset MUST NOT import from `@zod-to-form/core` or `@zod-to-form/react`.
- **FR-012**: CLI-generated code using the html preset MUST inline the value normalization utility directly in the generated file.
- **FR-013**: CLI-generated code MUST inline all type utilities (e.g., `StripIndexSignature`) as local type definitions.
- **FR-014**: The system MUST support a `disabled` key on `FieldConfigBase` that renders the field as non-interactive.
- **FR-015**: The system MUST support a `helpText` key on `FieldConfigBase` that renders text below the input, distinct from `description`.
- **FR-016**: The system MUST surface a `deprecated` flag on the `FormField` intermediate representation, populated from resolved metadata.
- **FR-017**: The field template MUST render a visual indicator when `deprecated` is true.
- **FR-018**: The CLI MUST emit the preset's default field template as a concrete file alongside the generated form when generating code.

### Key Entities

- **FieldConfigBase**: The per-field configuration object provided by library consumers. After this change: `component`, `order`, `hidden`, `disabled`, `section`, `helpText`, `props`. Removed: `gridColumn`, `propMap`.
- **ComponentOverride**: Preset-level overrides for specific component types. After this change: `controlled`, `props`. Removed: `propMap`.
- **ComponentsConfig**: Top-level component resolution configuration. After this change: `source`, `preset`, `fieldTemplate`, `overrides`.
- **FormField**: The intermediate representation produced by the schema walker and consumed by renderers and codegen. Gains `deprecated`, `disabled`, `helpText`. Loses `gridColumn`.
- **RuntimeComponentConfig**: Runtime component resolution configuration. Loses `sectionComponents`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The number of top-level configuration keys on `FieldConfigBase` decreases from the current count (removal of `gridColumn` and `propMap` outweighs additions of `disabled` and `helpText`).
- **SC-002**: 100% of existing form configurations can be expressed using the new unified `props` syntax with no loss of functionality.
- **SC-003**: CLI-generated form files compile and render correctly after removing all z2f packages from the consumer project.
- **SC-004**: A developer can customize the field template (label/input/description/error layout) without using the `render` escape hatch.
- **SC-005**: Object fields can be rendered as custom layout components (tabs, accordion, stepper) using only existing config keys (`component`, `props`, `order`) — no new API surface required.
- **SC-006**: All existing tests continue to pass after migration to the new API surface (backward compatibility for non-removed features).
- **SC-007**: The total number of distinct configuration concepts a new user must learn decreases (one `props` mechanism instead of `props` + `propMap` + `gridColumn`; one component resolution path instead of `componentModule` + `sectionComponents`).

## Assumptions

- The set of recognized field expressions is fixed and small: `field.value`, `field.onChange`, `field.onBlur`, `field.ref`, `field.name`. This avoids ambiguity — any string not exactly matching one of these is treated as a literal value.
- The `disabled` property starts as a simple boolean. Conditional logic (`disabled: { when: string; is: unknown }`) is deferred to a future feature to avoid scope creep.
- The `deprecated` flag is informational only — it renders a visual indicator but does not prevent form submission or disable the field.
- Section component names in the component module follow the same naming convention as input components — no special prefix or namespace.
- The shadcn preset's controlled components handle value types natively, making `normalizeFormValues` unnecessary for that preset.
