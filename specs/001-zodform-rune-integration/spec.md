# Feature Specification: Rune Integration Additions

**Feature Branch**: `[001-zodform-rune-integration]`
**Created**: 2026-02-27
**Status**: Draft
**Input**: User description: "Enhancement: zod-to-form additions for rune-langium integration"

## Clarifications

### Session 2026-02-27

- Q: When both custom processor logic and FormMeta set overlapping field output values, which one takes precedence? → A: Custom processor output takes precedence over FormMeta.
- Q: How should CLI handle unknown field paths in `--ref-types` mappings? → A: Treat unknown paths as an error and stop generation. (Superseded after scope changed from `--ref-types` to `--component-config`.)
- Q: What path syntax should `--ref-types` use for nested/array fields? → A: Dot-path syntax with `[]` array wildcard segments. (Superseded after scope changed from `--ref-types` to `--component-config`.)
- Q: Should `onValueChange` fire on mount with valid default values? → A: No, fire only on subsequent valid user-initiated changes.
- Q: If both `fields` and `fieldTypes` config entries match the same field, which one wins? → A: `fields` entry takes precedence.

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Extendable processor system (Priority: P1)

As a library consumer, I can import built-in field processors and register custom processors so I can adapt schema-to-form mapping without forking the package.

**Why this priority**: Custom field behavior is the primary adoption blocker; without a usable processor surface, downstream integrations cannot implement required UI behavior.

**Independent Test**: Can be fully tested by importing exported processors, overriding string processing via custom registration, and verifying walker output changes accordingly.

**Acceptance Scenarios**:

1. **[US1-AC1] Given** a consumer project using the core package, **When** it imports built-in processors from the public processors entrypoint, **Then** the import resolves and provides callable processor functions.
2. **[US1-AC2] Given** a schema containing string fields, **When** the consumer registers a custom processor for string schemas, **Then** generated field definitions reflect the custom component mapping instead of the default mapping.
3. **[US1-AC3] Given** schema metadata registered for a field, **When** the schema is walked with that registry, **Then** the output field includes metadata-driven component selection and props.

---

### User Story 2 - Auto-save lifecycle in runtime forms (Priority: P1)

As an application developer, I can receive validated value changes while a user types so I can implement debounced auto-save workflows without relying on submit-only forms.

**Why this priority**: Runtime adoption for on-change editors depends on value-change callbacks that preserve validation guarantees.

**Independent Test**: Can be fully tested by rendering a form with value-change callback enabled, typing valid and invalid values, and asserting callback behavior and submit behavior independently.

**Acceptance Scenarios**:

1. **[US2-AC1] Given** a form configured with value-change callback, **When** a user edits a field to a valid value, **Then** the callback receives the latest valid form values.
2. **[US2-AC2] Given** a form configured with value-change callback, **When** a user input leaves the form invalid, **Then** the value-change callback is not invoked for that invalid state.
3. **[US2-AC3] Given** a form configured with submit callback only, **When** a user interacts and submits, **Then** existing submit-only behavior remains unchanged.
4. **[US2-AC4] Given** a form initialized with valid default values, **When** the form first mounts without user interaction, **Then** the value-change callback is not invoked.

---

### User Story 3 - Unified component config for CLI and runtime (Priority: P2)

As a scaffolding and runtime user, I can provide one component configuration used by both CLI generation and runtime rendering so component mapping stays consistent across build-time and run-time.

**Why this priority**: CLI output quality directly impacts integration speed; this is high value but depends on the processor/runtime capabilities above.

**Independent Test**: Can be fully tested by using the same component-config in CLI generation and runtime rendering, then verifying generated imports, rendered components, fallback behavior, and error handling.

**Acceptance Scenarios**:

1. **[US3-AC1] Given** CLI generation with default options, **When** output is produced, **Then** it matches current submit-driven output behavior.
2. **[US3-AC2] Given** CLI generation with auto-save mode enabled, **When** output is produced, **Then** generated form uses change-driven subscription behavior and does not include a submit button.
3. **[US3-AC3] Given** CLI generation with component configuration, **When** fields are matched by configured field type or field path, **Then** generated output uses named exports from `config.components` with configured component keys.
4. **[US3-AC4] Given** runtime `ZodForm` with the same component configuration, **When** a configured field renders, **Then** runtime resolves and renders the matching component from the configured module path.

---

### Edge Cases

- **[EC-001]** A consumer provides both value-change and submit callbacks; each callback triggers only for its respective event path.
- **[EC-002]** A user types rapidly and toggles valid/invalid states; only valid snapshots are emitted to value-change listeners.
- **[EC-003]** CLI receives malformed component configuration files (`.json` or `.ts`); generation fails with actionable validation feedback and no partial output.
- **[EC-004]** Runtime resolves `(await import(config.components))[entry.component]` to a non-function value; rendering fails with a clear error including module path and component key.
- **[EC-005]** A `render` override is configured with a non-function value; runtime fails immediately with an explicit configuration error.
- **[EC-006]** Cross-reference metadata exists without a reference target value; field still renders as cross-reference placeholder with safe defaults.
- **[EC-007]** Component configuration does not include a matching field type or field path; generation falls back to default type-based field rendering.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The core package MUST expose built-in processors through a documented public processors entrypoint.
- **FR-002**: The core package MUST provide a documented reference processor example for string fields that consumers can reuse and modify.
- **FR-003**: Schema walking MUST allow consumers to override built-in behavior by registering processor handlers keyed by schema type.
- **FR-004**: Schema walking MUST apply field metadata from the form registry to output fields, including component selection and field props.
- **FR-005**: Runtime form hooks and components MUST support an optional value-change callback that emits latest valid values during editing.
- **FR-006**: Value-change emission MUST be suppressed while current form state is invalid.
- **FR-007**: Runtime form configuration MUST support selecting form interaction mode for validation timing and change handling.
- **FR-008**: Existing submit-only usage MUST remain backward compatible when value-change callback is not provided.
- **FR-009**: CLI generation MUST support an explicit output mode that produces change-driven form lifecycle wiring.
- **FR-010**: CLI auto-save output mode MUST omit submit-button rendering from generated forms.
- **FR-011**: CLI generation MUST support a `--component-config` input whose structure is also consumable by runtime rendering.
- **FR-012**: Component configuration MUST include a `components` module path string used by CLI for emitted imports and by runtime for dynamic module loading.
- **FR-013**: Fields not identified as cross-reference MUST retain existing default string-input rendering behavior.
- **FR-014**: The core package MUST expose a cross-reference processor through the public processors entrypoint.
- **FR-015**: Documentation MUST include an end-to-end custom processor example covering definition, registration, and observed output behavior.
- **FR-016**: The feature set MUST NOT introduce or require Next.js-specific runtime dependencies; all runtime and generated outputs for this scope MUST remain framework-agnostic and usable without Next.js.
- **FR-017**: When both processor logic and form metadata provide overlapping values for the same output field attributes, processor output MUST take precedence.
- **FR-018**: The component configuration format MUST support both JSON files and TypeScript files resolved without additional user setup.
- **FR-019**: The CLI package MUST export `ZodToFormComponentConfig<T>` and `ComponentEntry<T>` so TypeScript component-config files can be statically validated with `satisfies` and `component: keyof T & string`.
- **FR-020**: Value-change callbacks MUST NOT be emitted during initial form mount; emissions begin only after subsequent valid user-initiated field changes.
- **FR-021**: TypeScript component configuration resolution MUST use the bundled runtime loader approach (via `jiti`) so users do not need separate transpilation setup.
- **FR-022**: When `--component-config` is not provided, CLI output MUST fall back to default type-based inputs and MUST NOT hard-code cross-reference component imports.
- **FR-023**: Different consumer projects MUST be able to map the same field type token (for example, `cross-ref`) to different component names/imports through their own component configuration.
- **FR-024**: When both `fields` and `fieldTypes` mappings match the same generated field, the `fields` mapping MUST take precedence.
- **FR-025**: Runtime `ZodForm` MUST accept `componentConfig` and resolve configured components via `(await import(config.components))[entry.component]` with module-load caching after first resolution.
- **FR-026**: If configured component resolution yields a non-function, runtime MUST throw a clear error naming field type, component key, and module path.
- **FR-027**: `ComponentEntry.render`, when provided, MUST be a function and MUST override default module-export component resolution.
- **FR-028**: When a field is identified as cross-reference, core output MUST emit a non-component field token (for example, `cross-ref`) and both CLI/runtime resolution MUST occur through component configuration, not hard-coded component names.

### Key Entities *(include if feature involves data)*

- **Form Processor**: A transformation unit that receives schema context and mutates a form field definition for a specific schema type or metadata pattern.
- **Form Field Metadata**: Registry-attached field annotations that influence output behavior such as field type, ordering, and rendering properties.
- **Generated Form Output Mode**: A generation setting that determines whether scaffolded forms use submit-driven or change-driven lifecycle behavior.
- **Component Configuration**: A shared configuration document consumed by both CLI and runtime that declares a `components` module path plus `fieldTypes` and optional `fields` mappings for component selection and field props.
- **Field Type Token**: A canonical non-component identifier (for example, `cross-ref`) emitted by processors and resolved to concrete UI components by renderer maps or CLI component configuration.
- **Component Entry**: A mapping entry containing a component export key and optional async render override used when default module export lookup is insufficient.
- **Form Field Definition**: The normalized output object produced by schema walking and consumed by runtime rendering or CLI templates.

### Assumptions

- Consumers supply valid schemas and registry metadata consistent with documented conventions.
- Existing default form rendering and submit workflows are considered stable baseline behavior.
- Consumers own component selection and module source through component configuration rather than hard-coded CLI or runtime component bindings.
- Auto-save orchestration (such as debouncing and persistence strategy) is owned by consuming applications, not by this feature.

### Deferred Considerations

- Optional `zodTypes` support in component configuration is deferred from this feature scope.
- If introduced later, precedence SHOULD be `fields` > `zodTypes` > `fieldTypes` > default type-based rendering.
- Current in-scope precedence remains `fields` over `fieldTypes` where both match.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of documented processor extension examples execute successfully in verification tests and demonstrate override behavior.
- **SC-002**: In form interaction tests, valid field changes trigger value-change callbacks within one interaction cycle, while invalid states trigger zero callback emissions.
- **SC-003**: CLI generation in default mode produces no behavioral differences from baseline output in regression comparisons.
- **SC-004**: CLI generation in auto-save mode produces forms with no submit button and includes value-change wiring in 100% of generated samples.
- **SC-005**: For provided component configuration mappings, 100% of configured cross-reference fields generate configured components/imports and 0% of unmapped string fields are incorrectly converted.
- **SC-006**: Integration validation confirms the generated form output and runtime usage work in a standard React environment without requiring any Next.js-specific packages, adapters, or framework hooks.
- **SC-007**: CLI accepts both `.json` and `.ts` component configuration inputs in verification fixtures; `.ts` configs load via `jiti` with no extra project setup.
- **SC-008**: Runtime tests confirm zero value-change callback invocations at mount time and successful callback emissions after valid user edits.
- **SC-009**: In generation tests without `--component-config`, 100% of string fields render via default inputs and zero configured cross-reference component imports are emitted.
- **SC-010**: In precedence tests where both mapping scopes match, 100% of generated fields resolve component/import/props from `fields` mappings over `fieldTypes` mappings.
- **SC-011**: Runtime rendering tests confirm configured components are resolved from `config.components` once and reused from cache on subsequent field renders.
- **SC-012**: Negative tests confirm non-function resolved components and non-function `render` overrides both fail with explicit diagnostic errors.
