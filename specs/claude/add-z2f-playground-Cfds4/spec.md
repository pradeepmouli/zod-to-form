# Feature Specification: Z2F Studio — Interactive Playground

**Feature Branch**: `003-z2f-playground`
**Created**: 2026-03-19
**Status**: Draft
**Input**: User description: "add an interactive playground for zod-to-form (z2f studio)"

## Clarifications

### Session 2026-03-19

- Q: What happens when a developer fills in and submits the rendered preview form? → A: Submit displays the validated/parsed values and any validation errors in a results panel below the form.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Write Schema, See Form Instantly (Priority: P1)

A developer exploring zod-to-form opens Z2F Studio in their browser and is greeted with a split-pane interface: a code editor on the left and a live form preview on the right. The editor is pre-loaded with a starter Zod schema. As the developer edits the schema — adding fields, changing types, adjusting constraints — the rendered form updates in real time. When the schema contains errors, a clear error message appears in the preview pane instead of a broken UI.

**Why this priority**: This is the core value proposition. Without live editing and instant preview, there is no playground. Every other story depends on this one.

**Independent Test**: Can be fully tested by opening the playground, modifying the starter schema, and verifying the form preview updates to reflect changes. Delivers immediate value as a standalone exploration tool.

**Acceptance Scenarios**:

1. **Given** the playground is loaded for the first time, **When** the page renders, **Then** a starter schema appears in the editor and a corresponding form renders in the preview pane.
2. **Given** a valid schema in the editor, **When** the developer adds a new string field to the schema, **Then** a corresponding text input appears in the preview within 1 second.
3. **Given** a valid schema in the editor, **When** the developer introduces a syntax error, **Then** the preview pane displays a human-readable error message and retains the last valid form.
4. **Given** a valid schema in the editor, **When** the developer adds Zod constraints (e.g., `.min(3)`, `.email()`), **Then** the form preview reflects those constraints (validation messages appear on submit or interaction).
5. **Given** a rendered form in the preview, **When** the developer fills in values and clicks submit, **Then** a results panel below the form displays the validated/parsed output data and any validation errors.

---

### User Story 2 — Customize Form Appearance via Metadata (Priority: P2)

A developer wants to see how registry metadata (labels, descriptions, placeholders, component overrides, field ordering, sections) affects form rendering. They add `z.registry()` annotations or field-level configuration in the editor and observe how the form layout, labels, and component choices change in real time.

**Why this priority**: Metadata-driven customization is a key differentiator of zod-to-form. Letting developers experiment with metadata in the playground dramatically lowers the learning curve.

**Independent Test**: Can be tested by adding metadata annotations to the schema in the editor and verifying the preview reflects label, description, placeholder, component, and ordering changes.

**Acceptance Scenarios**:

1. **Given** a schema with no metadata, **When** the developer adds a form registry annotation with a custom label, **Then** the corresponding field in the preview updates its label text.
2. **Given** a schema with a string field, **When** the developer overrides the component to "Textarea" via metadata, **Then** the preview renders a textarea instead of a text input.
3. **Given** multiple fields with no ordering, **When** the developer assigns `order` values via metadata, **Then** the fields in the preview rearrange to match the specified order.

---

### User Story 3 — Inspect Generated Form Field IR (Priority: P2)

A developer building a custom renderer or debugging unexpected form output wants to see the intermediate `FormField[]` representation that zod-to-form produces. They toggle an "Inspect" panel that shows the structured IR output for the current schema, updated live as they edit.

**Why this priority**: The IR is the core abstraction shared between runtime and codegen. Exposing it helps advanced users understand and debug the library's behavior and is essential for developers building custom integrations.

**Independent Test**: Can be tested by writing a schema, opening the inspect panel, and verifying the displayed IR matches the expected field structure.

**Acceptance Scenarios**:

1. **Given** the playground with a valid schema, **When** the developer opens the inspect panel, **Then** a formatted view of the `FormField[]` IR appears.
2. **Given** the inspect panel is open, **When** the developer modifies the schema, **Then** the IR view updates to reflect the new schema structure.
3. **Given** a schema with nested objects or arrays, **When** the developer views the IR, **Then** nested children and array item templates are clearly displayed in a hierarchical format.

---

### User Story 4 — Share Playground State via URL (Priority: P3)

A developer has configured a schema in the playground and wants to share it with a colleague or include it in documentation. They click a "Share" button and receive a URL that, when opened, restores the exact editor content and configuration.

**Why this priority**: Sharing is a quality-of-life feature that amplifies the playground's value for collaboration and documentation but is not essential for individual exploration.

**Independent Test**: Can be tested by configuring a schema, generating a share URL, opening that URL in a new browser session, and verifying the editor content matches.

**Acceptance Scenarios**:

1. **Given** a schema in the editor, **When** the developer clicks "Share", **Then** a URL is generated and copied to the clipboard.
2. **Given** a valid share URL, **When** someone opens the URL, **Then** the playground loads with the exact schema content from the URL.
3. **Given** a share URL with a very large schema, **When** the URL exceeds reasonable length limits, **Then** the system notifies the user that the schema is too large to share via URL.

---

### User Story 5 — Browse and Load Example Schemas (Priority: P3)

A developer new to zod-to-form wants to learn by example. They browse a curated gallery of example schemas (e.g., registration form, settings page, multi-step wizard, file upload) and load any example into the editor with one click to study and modify it.

**Why this priority**: Examples accelerate onboarding and showcase the library's capabilities, but the playground is still useful without them since users can write their own schemas.

**Independent Test**: Can be tested by opening the example gallery, selecting an example, and verifying it loads into the editor with a corresponding form preview.

**Acceptance Scenarios**:

1. **Given** the playground is open, **When** the developer opens the example gallery, **Then** a list of categorized example schemas is displayed.
2. **Given** the example gallery is open, **When** the developer selects an example, **Then** the editor content is replaced with the example schema and the form preview updates accordingly.
3. **Given** the developer has unsaved changes in the editor, **When** they select an example, **Then** they are warned that their current work will be replaced and can cancel the action.

---

### Edge Cases

- What happens when the schema imports external modules that are unavailable in the browser sandbox?
  - The playground operates in a sandboxed environment; only `zod` (v4) and `@zod-to-form/core` APIs are available. Attempts to import other modules display a clear error message.
- What happens when the developer writes an infinite or deeply recursive schema?
  - The system enforces a maximum schema depth and a processing timeout. If exceeded, an error message is shown and the last valid form is retained.
- What happens when the browser tab is closed with unsaved changes?
  - Editor content is persisted to browser local storage so it can be restored on the next visit.
- How does the playground handle very large schemas (50+ fields)?
  - The preview pane is scrollable and the system degrades gracefully — the form renders but live update latency may increase, with a visible loading indicator if processing takes longer than 500ms.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a split-pane interface with a code editor on the left and a live form preview on the right.
- **FR-002**: System MUST pre-load a starter Zod v4 schema in the editor on first visit.
- **FR-003**: System MUST re-render the form preview when the schema in the editor changes, within 1 second of the developer pausing input.
- **FR-004**: System MUST display clear, human-readable error messages in the preview pane when the schema contains syntax or type errors.
- **FR-005**: System MUST retain the last successfully rendered form when the current schema has errors.
- **FR-006**: System MUST support all Zod v4 schema types that `@zod-to-form/core` processes (strings, numbers, booleans, dates, enums, objects, arrays, optionals, unions, etc.).
- **FR-007**: System MUST support `z.registry()` metadata annotations for customizing labels, descriptions, placeholders, components, ordering, and sections.
- **FR-008**: System MUST provide an inspectable view of the `FormField[]` intermediate representation.
- **FR-009**: System MUST allow sharing playground state via a URL that encodes the editor content.
- **FR-010**: System MUST provide a gallery of curated example schemas that can be loaded into the editor.
- **FR-011**: System MUST persist editor content to browser local storage to survive page reloads and tab closures.
- **FR-012**: System MUST enforce sandbox boundaries — only `zod` and `@zod-to-form/core` APIs are available in the editor; arbitrary imports are not supported.
- **FR-013**: System MUST enforce a maximum processing depth and timeout to prevent infinite loops or excessive recursion from freezing the interface.
- **FR-015**: System MUST display a results panel after form submission showing the validated/parsed output data and any validation errors from the Zod schema.
- **FR-014**: System MUST be keyboard-accessible and navigable, with proper focus management between editor and preview panes.

### Key Entities

- **Playground Session**: The current state of the editor content, selected configuration options, and active panel (preview/inspect). Persisted in browser local storage.
- **Example Schema**: A curated schema with a title, description, category, and source code. Bundled with the playground.
- **Share Token**: An encoded representation of the editor content embedded in a URL fragment for stateless sharing.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can see a rendered form from a Zod schema within 5 seconds of opening the playground for the first time.
- **SC-002**: Form preview updates within 1 second of the developer pausing schema edits.
- **SC-003**: 90% of first-time users can successfully modify the starter schema and see form changes without consulting external documentation.
- **SC-004**: At least 5 curated example schemas are available covering common form patterns (registration, settings, multi-field, nested, file upload).
- **SC-005**: Shared URLs restore the exact playground state, with 100% fidelity for schemas under 10,000 characters.
- **SC-006**: The playground is fully usable via keyboard navigation alone, meeting accessibility standards.

## Assumptions

- The playground will be a new package in the monorepo (e.g., `packages/playground` or `apps/playground`) — the specific technology choice for the web application is a planning-phase decision.
- The code editor will provide syntax highlighting and basic autocompletion for TypeScript/Zod — the specific editor component is a planning-phase decision.
- Schema evaluation happens in a sandboxed browser context (no server-side execution required).
- The playground is a standalone web application that can be deployed to a static hosting service.
- The playground targets modern evergreen browsers (Chrome, Firefox, Safari, Edge — latest 2 versions).
- The initial release focuses on the default (unstyled) component map; shadcn/ui theming support may be added later.
