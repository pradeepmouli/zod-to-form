# Feature Specification: Studio Layout Redesign

**Feature Branch**: `004-studio-layout-redesign`
**Created**: 2026-03-19
**Status**: Draft
**Input**: User description: "adjust layout of z2f studio - add z2f.config pane below schema pane, move code pane below preview/inspector panes and allow toggle of code pane between react (runtime) and cli (actual codegen). z2f.config pane should have form and .ts panes, form for z2f.config should use z2f itself"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Four-Quadrant Layout (Priority: P1)

A developer opens z2f Studio and sees a redesigned layout with four quadrants. The left column has two vertically stacked panes: the **Schema Editor** on top and the **z2f.config Editor** below. The right column has two vertically stacked panes: the **Preview/Inspect** pane on top (with its existing tab switcher) and the **Code Output** pane below. The developer writes a Zod schema in the top-left pane, configures component overrides in the bottom-left config pane, and immediately sees the rendered form update in the top-right preview.

**Why this priority**: The new four-quadrant layout is the foundational change that all other stories depend on. Without it, the config pane and relocated code output have nowhere to live.

**Independent Test**: Can be fully tested by opening the studio and verifying all four quadrants are visible, independently scrollable, and that existing schema editing + form preview functionality continues to work.

**Acceptance Scenarios**:

1. **Given** the studio is loaded on a wide screen (768px+), **When** the user views the layout, **Then** four visible quadrants are displayed: schema editor (top-left), config editor (bottom-left), preview/inspect (top-right), and code output (bottom-right).
2. **Given** the studio is loaded on a narrow screen (<768px), **When** the user views the layout, **Then** the quadrants are accessible via tabbed navigation adapted for the new sections.
3. **Given** the four-quadrant layout is visible, **When** the user types in the schema editor, **Then** the preview pane updates within 1 second (existing behaviour preserved).
4. **Given** any quadrant contains content exceeding its visible area, **When** the user scrolls within that quadrant, **Then** only that quadrant scrolls independently.

---

### User Story 2 - z2f.config Form View — Dogfooding (Priority: P1)

The config pane (bottom-left) has two sub-tabs: **Form** and **.ts**. The **Form** tab renders a live z2f.config editor using the `<ZodForm>` component — the library dogfoods its own configuration. The developer fills in component overrides, field metadata, and defaults via form controls rather than writing raw code. Changes in the Form view are reflected in the .ts view and vice versa.

**Why this priority**: This is the key dogfooding feature — using z2f to configure z2f. It demonstrates the library's capabilities and provides a superior UX for config editing compared to raw code.

**Independent Test**: Can be tested by switching to the Form tab in the config pane, editing a field override, and verifying the change appears in the .ts tab and affects the form preview.

**Acceptance Scenarios**:

1. **Given** the config pane is visible, **When** the user clicks the "Form" tab, **Then** a form-rendered configuration editor appears with fields for components, field overrides, and defaults.
2. **Given** the config Form is displayed, **When** the user changes a field override (e.g., sets component to "Textarea" for a field), **Then** the preview form re-renders with the updated component.
3. **Given** the config Form is displayed, **When** the user switches to the ".ts" tab, **Then** a TypeScript representation of the current config is shown, reflecting all Form changes.
4. **Given** the ".ts" tab is displayed, **When** the user edits the code and switches back to the Form tab, **Then** the form fields reflect the changes from the code.

---

### User Story 3 - z2f.config .ts View (Priority: P2)

The **.ts** tab in the config pane shows the current configuration as a TypeScript `defineConfig(...)` call. Developers who prefer code-first configuration can edit the code directly. The .ts view uses the same code editor as the schema editor with TypeScript syntax highlighting.

**Why this priority**: Supports power users who prefer code over forms, and provides a round-trip view of the config that can be copy-pasted into a project.

**Independent Test**: Can be tested by switching to the .ts tab, editing the config code, and verifying the form preview updates accordingly.

**Acceptance Scenarios**:

1. **Given** the config pane .ts tab is active, **When** the user views the content, **Then** a code editor displays the config as a `defineConfig(...)` call with syntax highlighting.
2. **Given** the .ts tab is active, **When** the user modifies the config code, **Then** the preview form updates to reflect the new configuration.
3. **Given** no config has been set, **When** the user views the .ts tab, **Then** a starter template with `defineConfig({})` is shown.

---

### User Story 4 - Code Output with Runtime/CLI Toggle (Priority: P2)

The Code Output pane (bottom-right) has a toggle between two modes: **React (Runtime)** and **CLI (Codegen)**. The React mode shows the runtime usage snippet (existing behavior). The CLI mode shows the actual codegen output — a static form component with explicit field rendering and no runtime dependency on the z2f library.

**Why this priority**: Developers evaluating z2f need to see what the build-time codegen produces, not just the runtime API. This helps them decide between runtime and build-time approaches.

**Independent Test**: Can be tested by writing a schema, toggling between React and CLI modes, and verifying each produces distinct, correct output.

**Acceptance Scenarios**:

1. **Given** the code output pane is visible, **When** the user views the pane, **Then** a toggle allows switching between "React (Runtime)" and "CLI (Codegen)" modes.
2. **Given** the React mode is active, **When** the user views the code, **Then** a runtime usage snippet is shown (existing behavior, relocated).
3. **Given** the CLI mode is active, **When** the user views the code, **Then** a static form component with explicit fields, labels, and validation is shown — equivalent to what the build-time codegen would produce.
4. **Given** the user changes the schema, **When** either code mode is active, **Then** the code output updates to reflect the new schema.

---

### User Story 5 - Config Button Removal & Export Button (Priority: P1)

The existing "Config" button in the header (which opens an import/export modal) is removed — its import functionality is superseded by the new config pane (Story 2/3), and its export functionality is replaced by a new **Export** button in the header. The Export button downloads a `z2f.config.ts` file. If custom components have been loaded into the playground, the export also bundles the custom component source files, CSS, and shadcn config as a zip. If no custom components are loaded (i.e., using the default shadcn component set), the export includes shadcn config plus instructions on invoking `npx shadcn` to download the required components.

**Why this priority**: The config button becomes redundant with the dedicated config pane. The export button is essential for developers to take their Studio work into a real project.

**Independent Test**: Can be tested by configuring a form in Studio, clicking Export, and verifying the downloaded file(s) contain a valid `z2f.config.ts` and the appropriate component assets or instructions.

**Acceptance Scenarios**:

1. **Given** the header is visible, **When** the user looks for a "Config" button, **Then** it does not exist (removed).
2. **Given** the header is visible, **When** the user clicks the "Export" button, **Then** a `z2f.config.ts` file is downloaded containing the current config as a `defineConfig(...)` call.
3. **Given** custom components have been loaded into the playground, **When** the user clicks Export, **Then** a zip file is downloaded containing `z2f.config.ts`, the custom component source files, CSS, and shadcn config.
4. **Given** no custom components are loaded (default shadcn set), **When** the user clicks Export, **Then** the export includes `z2f.config.ts`, shadcn config, and a `README.md` with instructions for running `npx shadcn` to install the required components.
5. **Given** the config pane has unsaved changes, **When** the user clicks Export, **Then** the exported config reflects the current in-memory state (not a stale version).

---

### User Story 6 - Resizable Quadrant Boundaries (Priority: P3)

The horizontal dividers between top and bottom panes (both left and right columns) are draggable, allowing the user to allocate more space to the schema editor vs config pane, or to the preview vs code output. The vertical divider between left and right columns is also draggable.

**Why this priority**: While the fixed layout works, resizable panes significantly improve the editing experience by letting users prioritize the pane they're actively working in.

**Independent Test**: Can be tested by dragging a divider and verifying that pane sizes adjust smoothly and persist across page reloads.

**Acceptance Scenarios**:

1. **Given** the four-quadrant layout is visible, **When** the user drags the horizontal divider in the left column, **Then** the schema editor and config pane resize proportionally.
2. **Given** the user has resized a divider, **When** they reload the page, **Then** the custom proportions are restored.
3. **Given** a pane is resized very small, **When** its content exceeds the visible area, **Then** the pane scrolls independently.

---

### Edge Cases

- What happens when the schema has no fields (empty `z.object({})`)? The config Form should show an empty state indicating no fields to configure.
- What happens when the .ts config code has syntax errors? An inline error should be displayed in the .ts tab without crashing the preview.
- What happens when the CLI codegen toggle is active but the codegen logic is unavailable? The codegen runs entirely in-browser using the same schema-walking logic as the core package; no external binary is required.
- What happens on mobile/narrow screens? The four quadrants collapse into a tabbed interface similar to the existing mobile layout, with config and code output added as additional tabs.
- What happens when the config Form and .ts views conflict (e.g., invalid edits in .ts)? The Form view shows a parse error banner and retains the last valid state.
- What happens when the schema changes and existing config overrides no longer match (e.g., field renamed or removed)? Orphaned overrides are silently dropped; only overrides matching current schema fields are shown in the config Form.
- What happens when field config is specified both in the schema metadata AND in the z2f.config pane? The config pane (z2f.config.ts) overrides take precedence over schema metadata, following the existing metadata precedence: config fields → form registry → global registry → inferred defaults. The config Form should show the effective value (merged result) but allow overriding.

### Example Schemas for Studio

The Studio's example gallery should include examples demonstrating both approaches to field configuration:

**Example A — Schema Metadata (inline annotations)**:

```typescript
const formRegistry = z.registry<FormMeta>();

const schema = z.object({
  name: z.string()
    .meta({ title: "Full Name", description: "Your legal name" })
    .register(formRegistry, { order: 1 }),
  bio: z.string()
    .meta({ title: "Biography" })
    .register(formRegistry, { component: "Textarea", order: 2 }),
  role: z.enum(["admin", "editor", "viewer"])
    .register(formRegistry, { component: "RadioGroup" }),
});

({ schema, formRegistry });
```

In this example, all field config is in the schema. The z2f.config pane starts empty — the config Form shows the schema's existing metadata as read-only context, and the developer can add overrides on top (e.g., change `bio` gridColumn to `"span 2"`).

**Example B — External Config (z2f.config.ts)**:

```typescript
const schema = z.object({
  name: z.string(),
  bio: z.string(),
  role: z.enum(["admin", "editor", "viewer"]),
});

schema;
```

With the corresponding z2f.config pane set to:

```typescript
defineConfig({
  fields: {
    name: { label: "Full Name", order: 1 },
    bio: { component: "Textarea", label: "Biography", order: 2, gridColumn: "span 2" },
    role: { component: "RadioGroup" },
  },
});
```

In this example, the schema is clean — all presentation/layout config lives in z2f.config.ts. This is the pattern recommended for projects that want to keep schema definitions portable and UI-agnostic.

**Example C — Hybrid (schema metadata + config overrides)**:

```typescript
const formRegistry = z.registry<FormMeta>();

const schema = z.object({
  name: z.string()
    .meta({ title: "Full Name" })
    .register(formRegistry, { order: 1 }),
  bio: z.string()
    .meta({ title: "Biography" }),
  role: z.enum(["admin", "editor", "viewer"]),
});

({ schema, formRegistry });
```

With the z2f.config pane adding overrides:

```typescript
defineConfig({
  fields: {
    bio: { component: "Textarea", gridColumn: "span 2" },
    role: { component: "RadioGroup", order: 3 },
  },
});
```

The effective result merges both: `name` gets its label from schema metadata; `bio` gets its label from schema metadata but component and layout from config; `role` gets everything from config. The preview shows the merged result.

## Clarifications

### Session 2026-03-20

- Q: When the user modifies the schema and existing config overrides no longer match, what should happen to orphaned overrides? → A: Silently drop overrides that no longer match the schema.
- Q: Should the CLI code output run the exact codegen pipeline in-browser or a simplified approximation? → A: Exact — run the actual CLI codegen pipeline in-browser.
- Q: How should keyboard users navigate between quadrants? → A: Standard tab order through quadrants with ARIA landmark roles.
- Q: How should the export choose between component bundle vs shadcn instructions? → A: Auto-detect based on whether custom components are loaded.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The studio layout MUST display four quadrants on wide screens (768px+): schema editor (top-left), config editor (bottom-left), preview/inspect (top-right), code output (bottom-right).
- **FR-002**: The config pane MUST have two sub-tabs: "Form" and ".ts".
- **FR-003**: The config "Form" tab MUST render a live z2f.config editor using the project's own form rendering component (dogfooding).
- **FR-004**: The config ".ts" tab MUST display the current configuration as editable TypeScript using a `defineConfig(...)` call.
- **FR-005**: Changes in the config Form MUST synchronize bidirectionally with the .ts view.
- **FR-006**: The code output pane MUST provide a toggle between "React (Runtime)" and "CLI (Codegen)" modes.
- **FR-007**: The "React (Runtime)" code output MUST show a runtime usage snippet (existing behavior, relocated).
- **FR-008**: The "CLI (Codegen)" code output MUST show the exact output of the CLI codegen pipeline running in-browser — not an approximation. The output MUST match what `z2f generate` would produce for the same schema and config.
- **FR-009**: The CLI codegen MUST run entirely in the browser by reusing the actual CLI codegen pipeline (schema-walking + template-rendering) — no server-side execution.
- **FR-010**: The narrow-screen layout MUST adapt the four-quadrant layout into a tabbed interface that includes all four sections.
- **FR-011**: Each quadrant MUST scroll independently without affecting other quadrants.
- **FR-012**: The config Form MUST derive its fields from the current schema — when the schema changes, the config form updates to show configurable fields for the new schema's shape.
- **FR-013**: The config Form MUST support editing: component overrides, field labels, placeholders, ordering, visibility (hidden), and grid column settings.
- **FR-014**: When the schema changes, config overrides that no longer match a schema field MUST be silently dropped from the config state. Only overrides matching current schema fields are retained.
- **FR-015**: The existing "Config" button in the header MUST be removed. Its import functionality is superseded by the config pane; its export functionality is replaced by the new Export button.
- **FR-016**: An "Export" button MUST be added to the header that downloads a `z2f.config.ts` file containing the current config as a `defineConfig(...)` call.
- **FR-017**: When custom components have been loaded into the playground, the Export MUST produce a zip containing `z2f.config.ts`, custom component source files, CSS, and shadcn config.
- **FR-018**: When no custom components are loaded (default shadcn set), the Export MUST include `z2f.config.ts`, shadcn config, and a README with `npx shadcn` instructions for installing the required components.
- **FR-019**: The export format (bundle vs instructions) MUST be auto-detected based on whether custom components are loaded — no manual user selection required.
- **FR-020**: Each quadrant MUST have an ARIA landmark role (`region` with `aria-label`) for assistive technology identification.
- **FR-021**: Keyboard tab order MUST flow through all four quadrants in reading order: schema editor → config editor → preview/inspect → code output.
- **FR-022**: When field config exists in both the schema metadata (`.register()` / `.meta()`) and the z2f.config pane, the config pane overrides MUST take precedence, following the existing metadata precedence chain: config fields → form registry → global registry → inferred defaults. The config Form MUST display the effective merged value for each field.

### Key Entities

- **PlaygroundConfig**: The configuration object editable via the config pane — contains component overrides, field metadata, and defaults.
- **CodeOutputMode**: A discriminant ("react" | "cli") controlling which code generation output is displayed.
- **ConfigTab**: A discriminant ("form" | "ts") controlling the config pane's active sub-view.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All four quadrants are visible and functional on screens 768px and wider, with no overlapping or clipped content.
- **SC-002**: A user can edit a z2f.config entirely through the Form tab without writing any code, and the resulting config is applied to the preview form within 1 second.
- **SC-003**: Bidirectional sync between Form and .ts tabs preserves data integrity — round-tripping from Form to .ts to Form produces the same config.
- **SC-004**: The CLI codegen output produces valid, standalone form components that would work without the z2f runtime library.
- **SC-005**: The config Form dogfoods the project's own form rendering — it does not use manual form elements for config editing.
- **SC-006**: The narrow-screen layout provides access to all four sections without horizontal scrolling.
- **SC-007**: Existing schema editing, form preview, IR inspection, and sharing functionality continues to work identically to the current implementation.

## Assumptions

- The CLI codegen runs in-browser by reusing the core package's schema-walking and template-rendering logic. It does not invoke an external binary.
- The config Form's fields are derived dynamically from the user's schema shape — each top-level field in the user's schema gets a corresponding config entry in the Form.
- The default split ratio for quadrants is 50/50 both vertically and horizontally.
- The .ts view uses the same code editor setup as the existing schema editor for consistency.
- Resizable pane proportions are persisted alongside the existing persisted state.

## Scope Boundaries

**In scope**:
- Four-quadrant layout redesign
- Config pane with Form and .ts tabs
- Form-based config editing using the project's own form renderer (dogfooding)
- Code output relocation with React/CLI toggle
- Responsive adaptation for narrow screens
- Removal of existing "Config" button (superseded by config pane)
- Export button with auto-detected bundle (z2f.config.ts + components or shadcn instructions)

**Out of scope**:
- Server-side CLI execution
- Config import from file (users edit config directly in the config pane)
- Custom themes for the config form
- Multi-file schema support
