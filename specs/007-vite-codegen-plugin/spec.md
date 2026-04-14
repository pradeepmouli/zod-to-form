# Feature Specification: Vite Plugin for Codegen

**Feature Branch**: `007-vite-codegen-plugin`
**Created**: 2026-04-13
**Status**: Draft
**Input**: User description: "implement vite plugin for codegen"

## Clarifications

### Session 2026-04-13

- Q: How does a developer declare which schemas should become forms? → A: Query-string annotation — `import { Form } from './schemas/signup.ts?z2f'`. The plugin transforms only imports that carry the `?z2f` suffix; no explicit targets list, no convention-based scanning.
- Added (user follow-up): The plugin MUST also support an opt-in "rewrite mode" that scans source for `<ZodForm>` JSX usages and replaces statically-resolvable ones with generated-form invocations at build time. This gives developers a transparent upgrade path from runtime to codegen without editing source. The two modes (query-string and rewrite) coexist.
- Q: Should rewrite mode be enabled by default? → A: No — off by default. Developers enable it via an explicit plugin option. The plugin ships as a query-string-first tool; rewrite mode is a deliberate opt-in because it silently changes compiled output for code the developer didn't annotate.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Zero-config form generation during Vite dev/build (Priority: P1)

A developer using Vite writes a Zod schema in their app source, installs the Vite plugin, and adds it to their `vite.config`. From that point on, importing the corresponding form component Just Works — no separate codegen CLI step, no committed generated files, no manual rebuild when the schema changes. During `vite dev`, saving the schema file updates the form in the browser via hot module replacement within one second. During `vite build`, the generated form is emitted into the production bundle with no trace of the zod-to-form runtime.

**Why this priority**: This is the whole point of the plugin. It eliminates the biggest friction in the codegen workflow — remembering to run a separate build step — and makes the codegen path feel as frictionless as the runtime path. Without this, the CLI is the only codegen entry point and users must wire it into their scripts manually.

**Independent Test**: Can be fully tested by scaffolding a minimal Vite + React app with one Zod schema and one `<FormComponent />` import, adding the plugin to `vite.config`, running `vite dev`, confirming the form renders, editing the schema to add a field, and confirming the new field appears in the browser within one second without a full page reload.

**Acceptance Scenarios**:

1. **Given** a Vite project with the plugin installed and a Zod schema at `src/schemas/signup.ts`, **When** the developer writes `import { SignupForm } from './schemas/signup.ts?z2f'` in `src/App.tsx`, **Then** the form renders correctly on first load without any manual codegen step.
2. **Given** the dev server is running, **When** the developer adds a new field to a schema file and saves, **Then** every browser consumer of that schema's `?z2f` import updates within one second without a full page reload.
3. **Given** the project is built for production, **When** the bundle is inspected, **Then** the form's component code is inlined in the bundle and no `@zod-to-form/react` or `@zod-to-form/core` code appears in the output.
4. **Given** a schema file has a syntax error, **When** the developer saves it, **Then** the dev server reports a clear error naming the schema file and the problem, and the previously-rendered form remains visible until the error is fixed.
5. **Given** a schema file is deleted, renamed, or no longer contains the expected export, **When** a page that imports its form via `?z2f` is loaded, **Then** the developer sees a clear error identifying which import no longer resolves.
6. **Given** a schema file is imported WITHOUT the `?z2f` suffix, **When** the project builds, **Then** the plugin MUST NOT transform that import and MUST leave the original module untouched.

---

### User Story 2 - Transparent upgrade from runtime `<ZodForm>` to codegen (Priority: P2)

A developer has a working app that uses `<ZodForm schema={signupSchema} onSubmit={handleSubmit} />` at the call site — they built it with the runtime renderer for speed of iteration. When they ship to production they want the codegen benefits (smaller bundle, faster mount, no runtime walking) without having to rewrite any source code. They enable a plugin option, and at build time every `<ZodForm>` element that references a statically resolvable schema is replaced by a call to a generated form component. Call sites that cannot be statically resolved (dynamic schemas, conditional composition) are left as runtime `<ZodForm>` calls and continue to work.

> **"Statically resolvable" means**: the `schema` prop is a bare identifier (not an inline expression, not a member access, not a conditional) whose binding resolves through normal scope analysis to a named import from a file inside the project's own source tree. The exact match-criteria table — import origin, binding kind, scope resolution rules — lives in `contracts/rewrite-mode.md` and is the authoritative definition.

**Why this priority**: This is the "free upgrade" story. It lets developers stay in runtime mode during iteration and flip a single plugin flag to reap codegen benefits without touching source — which is exactly the kind of "progressive optimization" DX that separates a plugin from the CLI. It is P2 rather than P1 because developers can always migrate manually via the explicit `?z2f` mechanism (P1); this is an ergonomic win, not a correctness win.

**Independent Test**: Can be fully tested by starting from a working Vite app that imports and renders `<ZodForm schema={signupSchema} />` with no query suffix, enabling the rewrite mode in plugin options, running `vite build`, and verifying that the production bundle contains neither `@zod-to-form/react` code nor a runtime walk for `signupSchema` — the build output must include the same inlined JSX a CLI-generated form would produce, while the source file on disk remains unchanged.

**Acceptance Scenarios**:

1. **Given** rewrite mode is enabled and `<ZodForm schema={signupSchema} onSubmit={handleSubmit} />` exists in `src/App.tsx` where `signupSchema` is a named import from a local module, **When** the project is built, **Then** the emitted bundle MUST contain the generated form code inlined (no `@zod-to-form/react` code for this call site) and the `signupSchema` identifier MUST NOT cause a runtime walk.
2. **Given** rewrite mode is enabled and the schema passed to `<ZodForm>` cannot be statically resolved (e.g., `<ZodForm schema={schemas[key]} />` with a dynamic key), **When** the project is built, **Then** the plugin MUST leave the `<ZodForm>` call site untouched, emit a DEBUG-level diagnostic explaining why it was skipped, and the runtime `<ZodForm>` path MUST continue to work.
3. **Given** rewrite mode is enabled during `vite dev`, **When** the developer edits a schema file referenced by a rewritten `<ZodForm>` call, **Then** HMR MUST apply the same way it does for query-string imports — within one second, preserving form state when structure is unchanged.
4. **Given** the source file contains both a rewritable `<ZodForm>` and an explicit `?z2f` import, **When** the project is built, **Then** both paths MUST produce correct output and MUST NOT conflict.
5. **Given** rewrite mode is DISABLED (the default), **When** the project is built, **Then** `<ZodForm>` call sites MUST be left alone and continue to execute the runtime renderer.

---

### User Story 3 - Config file watching and shared component overrides (Priority: P2)

A developer has a `z2f.config.ts` at their project root specifying which component library to use (html vs shadcn), custom field template paths, and per-schema overrides. They expect the plugin to pick up this config automatically, apply it to every generated form, and regenerate when the config file changes.

**Why this priority**: The codegen CLI already honors `z2f.config.ts`. Users moving from CLI to the plugin would reasonably expect the same config semantics. This ensures parity so the plugin is a drop-in replacement for running the CLI in watch mode, not a reduced-feature alternative.

**Independent Test**: Can be fully tested by adding a `z2f.config.ts` that sets `ui: 'shadcn'`, running the dev server, confirming the generated form uses shadcn components, then editing the config to change to `ui: 'html'` and confirming every affected form rerenders with the new preset.

**Acceptance Scenarios**:

1. **Given** a project with `z2f.config.ts` at the root, **When** the plugin runs, **Then** every generated form honors the ui preset, component module, and field overrides declared in that config.
2. **Given** the dev server is running, **When** the developer edits `z2f.config.ts`, **Then** all forms affected by the change rerender within two seconds.
3. **Given** per-schema config overrides exist, **When** a form is generated, **Then** per-schema settings take precedence over global settings in the same way the CLI handles them.

---

### User Story 4 - Resolver tree-shaking when optimization is enabled (Priority: P3)

A developer has enabled validation optimization (L1 or L2) in their `z2f.config.ts`. When they build for production, the plugin recognizes that `zodResolver` is never called on the optimized path and strips the `@hookform/resolvers/zod` import from the bundle, saving approximately two kilobytes of gzipped JavaScript.

**Why this priority**: This is a nice bundle-size optimization but not required for the plugin to be useful. It's an obvious secondary win that the plugin is uniquely positioned to deliver because it runs at build time with full knowledge of the config.

**Independent Test**: Can be fully tested by building a project with and without `optimization` enabled and comparing the production bundle size; the optimized bundle must be at least 1.5 kilobytes smaller (gzipped) and must not contain any reference to `zodResolver` or `@hookform/resolvers`.

**Acceptance Scenarios**:

1. **Given** a project with `optimization: { level: 2 }` in config, **When** the production bundle is built, **Then** no string matching `zodResolver` or `@hookform/resolvers` appears in the emitted JavaScript.
2. **Given** optimization is not enabled, **When** the production bundle is built, **Then** the resolver import is preserved and the bundle behavior matches the current CLI output byte-for-byte.

---

### Edge Cases

- **Schema imported from a workspace package or `node_modules`**: Because the plugin only transforms imports that carry the `?z2f` suffix, schemas in dependencies are automatically excluded unless the developer explicitly writes `?z2f` on a dep import. The plugin MAY still warn or refuse on dep-path imports to prevent accidental codegen against a schema the developer does not own.
- **Multiple forms generated from the same schema**: Developers express variants via the query value — `?z2f=create`, `?z2f=edit` — and map each variant name to variant-specific settings in `z2f.config.ts`. The bare `?z2f` suffix is the default target.
- **Schema file with multiple exports**: The schema export whose name is configured (or whose name matches the default convention) is the one compiled. Ambiguity here is a user error and must produce a clear diagnostic.
- **Hot reload when a form is currently rendered with user-entered data**: HMR must not destroy the user's form state for unrelated changes. State loss is acceptable only when the schema structure actually changed.
- **SSR (server-side rendering) builds**: The plugin must produce code that runs correctly in Node-rendered (SSR) contexts as well as browser-rendered, with the same contract as the CLI output.
- **Generated type declarations**: IDE type-checking of the generated form imports must work without the developer manually writing `.d.ts` stubs.
- **Interaction with Vite's dep optimizer**: The plugin's generated/virtual output must not break Vite's prebundling or cause excessive full-page reloads during dev.
- **Config file with syntax errors**: If `z2f.config.ts` becomes invalid, the dev server must report it without crashing and must preserve the last-known-good config until the file is fixed.
- **Plugin used alongside the CLI**: If a developer has both the plugin and a committed `*.generated.tsx` from the CLI, the plugin must not clobber committed files unless explicitly told to.

## Requirements *(mandatory)*

### Functional Requirements

> **Numbering note**: Requirement IDs are stable and non-sequential. FR-001–007 (registration, discovery) and FR-008–019 (dev server, build, type safety, operational) predate the rewrite-mode addition; FR-020–025 (rewrite mode) were added after clarification (see the Clarifications section). IDs are preserved to keep traceability in task and test references.

#### Plugin registration and configuration

- **FR-001**: The system MUST expose a single plugin factory function that developers can import and add to their Vite `plugins` array with zero required arguments.
- **FR-002**: The system MUST honor `z2f.config.ts` at the project root using the same resolution and precedence rules as the existing codegen CLI.
- **FR-003**: The system MUST accept optional plugin-level configuration that overrides the root config on a per-vite-project basis.

#### Schema discovery and generation

- **FR-004**: The system MUST generate a form component for every import whose specifier carries the `?z2f` query suffix, without requiring any additional configuration or CLI command. The bare form of the suffix — `?z2f` with no value — maps to the default generation target for that schema.
- **FR-004a**: The system MUST NOT scan the project for schemas, enumerate a `targets` list, or transform any import that does not carry the `?z2f` suffix. Plain `import { schema } from './schemas/signup.ts'` remains an ordinary module import.
- **FR-004b**: When the `?z2f` query carries a value (for example `?z2f=edit`), the system MUST treat the value as a generation-target name that the developer can map to variant-specific settings in `z2f.config.ts`.
- **FR-005**: The developer MUST be able to import the generated form component from their application source using the query-suffix specifier, and this specifier MUST resolve identically in dev and build.
- **FR-006**: The system MUST produce functionally equivalent output to the existing codegen CLI given the same schema and config inputs, so that behavior is identical whether the developer uses the CLI or the plugin.
- **FR-007**: The system MUST NOT clobber or overwrite any pre-existing `*.generated.tsx` files committed to the project source unless the developer explicitly opts in to writing generated output to disk.

#### Transparent `<ZodForm>` rewrite mode

- **FR-020**: The system MUST support an opt-in "rewrite mode" in which the plugin scans source modules for JSX elements that reference the `ZodForm` component from `@zod-to-form/react` and replaces statically resolvable call sites with generated-form invocations at build time.
- **FR-021**: In rewrite mode, the system MUST only replace call sites where the `schema` prop is a statically resolvable identifier that refers to a Zod schema declared in the project's own source (not in `node_modules`).
- **FR-022**: In rewrite mode, the system MUST leave any `<ZodForm>` call site untouched when the schema cannot be statically resolved (dynamic keys, conditional composition, runtime-constructed schemas), emit a DEBUG-level diagnostic, and allow the runtime path to continue working.
- **FR-023**: In rewrite mode, the system MUST preserve every prop, event handler, child, AND JSX spread attribute (`{...rest}`) passed to `<ZodForm>` — the rewritten call site MUST accept the same surface API so the developer's source remains unchanged. Spread attributes are preserved verbatim; any prop-shape mismatch between the spread source and the generated component surfaces as a normal TypeScript type error at the call site, which is the user's responsibility.
- **FR-024**: Rewrite mode MUST be DISABLED by default. Developers enable it via plugin options.
- **FR-025**: Rewrite mode MUST coexist with the query-string mode (FR-004). A single project MAY use both mechanisms without conflict.

#### Dev server integration

- **FR-008**: During `vite dev`, when a schema file changes, the system MUST regenerate the affected form and deliver the new version to the running browser via Vite's hot module replacement within one second of the save.
- **FR-009**: During `vite dev`, when `z2f.config.ts` changes, the system MUST regenerate every form affected by the change within two seconds of the save.
- **FR-010**: When a schema file contains a syntax or semantic error, the system MUST report the error with the schema file path and a human-readable description in the Vite terminal output AND in the browser overlay, without crashing the dev server.
- **FR-011**: The system MUST preserve the user's in-progress form values when HMR applies changes that do not alter the schema's field structure.

#### Build-time behavior

- **FR-012**: During `vite build`, the system MUST emit each generated form directly into the production bundle with the same zero-runtime-dependency guarantee the existing CLI provides (no `@zod-to-form/*` package code in the output).
- **FR-013**: During `vite build`, when `z2f.config.ts` declares validation optimization (level 1 or 2), the system MUST strip the `@hookform/resolvers/zod` import from the emitted bundle.
- **FR-014**: The system MUST NOT require the developer to disable Vite's dep optimizer or add workarounds to their vite config for typical usage.

#### Type safety and editor integration

- **FR-015**: The system MUST make the imports of generated forms resolvable and fully typed in TypeScript editors (such that `import { SignupForm } from '...'` shows the correct props, including the `onSubmit` payload type) without requiring the developer to manually author `.d.ts` stubs.
- **FR-016**: The system MUST surface codegen errors in a way that IDE-based TypeScript language services can display them inline in the schema file or the config file.

#### Operational guarantees

- **FR-017**: The system MUST work in both browser-rendered and server-side-rendered Vite builds with identical output semantics.
- **FR-018**: The system MUST fail fast and loudly (not silently fall back) when the plugin cannot process a schema that was explicitly declared as a form source.
- **FR-019**: The system MUST work alongside the existing CLI — a project MUST be able to use the plugin for some forms and the CLI for others without conflict.

### Key Entities

- **Vite plugin instance**: The runtime object registered in `vite.config.ts`, responsible for wiring into Vite's dev server, build pipeline, and HMR machinery. Stateless across projects but stateful during a single build or dev session.
- **Project config (`z2f.config.ts`)**: Declarative settings that describe which UI preset, component module, field templates, validation level, and variant mappings the plugin should apply. Shared with the CLI.
- **Source schema**: A developer-authored Zod schema file that becomes the input to a generated form, either because (a) some import references it with the `?z2f` query suffix, or (b) a `<ZodForm>` JSX element references it as a statically-resolvable identifier and rewrite mode is enabled. Owned by the developer, read-only from the plugin's perspective.
- **Generated form component**: The output of compiling a source schema through the codegen pipeline. Exists either as a virtual module served to Vite or (optionally) as a file on disk. Consumed by developer application code via query-suffix import, or substituted in place of a `<ZodForm>` JSX call by rewrite mode.
- **Generation target**: A (schema, variant name, config) triple that produces exactly one generated form. The default target has an empty variant name; named variants are expressed via `?z2f=name`.
- **Rewrite site**: A single `<ZodForm>` JSX element in developer source that rewrite mode has matched and will replace with a generated-form invocation at build time. Tracked per source file so HMR knows which source to invalidate when the referenced schema changes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer scaffolding a new Vite + React + Zod project can add the plugin, define a schema, import the generated form, and see it rendered in the browser in under five minutes, with no manual codegen step.
- **SC-002**: Editing a schema field during `vite dev` updates the running browser form in under one second, measured from keyboard save to visible DOM change, on a large schema (50 fields).
- **SC-003**: A production build using the plugin produces a bundle that is byte-equivalent to (or smaller than) the bundle produced by running the CLI once and committing the output, for the same schema and config.
- **SC-004**: When `optimization` is enabled, the production bundle is at least 1.5 kilobytes smaller (gzipped) than the same bundle without the optimization, attributable to the removal of the resolver dependency.
- **SC-005**: Zero developers need to hand-author `.d.ts` files, edit `tsconfig.json`, or add `/// <reference>` directives to get IDE autocomplete on generated form imports.
- **SC-006**: The plugin produces the same form fields, validation rules, component mapping, and generated code structure as the CLI for 100% of schemas in the existing codegen test suite. Failing even one is a blocker.
- **SC-007**: On a project with 20 generated forms, a single schema file change triggers regeneration only for the forms that depend on that schema — not all 20 — as measured by counting HMR update events.
- **SC-008**: The plugin handles an invalid schema or config without crashing the dev server; the server remains responsive and serves the previously-valid state until the error is fixed.
- **SC-009**: With rewrite mode enabled, a developer can flip a single plugin option on an existing runtime-only project (one where every form uses `<ZodForm>` with no query-string imports) and see the production bundle shrink by the codegen-vs-runtime delta from the benchmarks (at least 40% mount-cost reduction on a medium 18-field form) — with zero source-code changes.
- **SC-010**: Rewrite mode correctly identifies and leaves alone 100% of `<ZodForm>` call sites where the `schema` prop is not statically resolvable, producing a diagnostic instead of silently breaking the runtime path.
- **SC-011**: Plugin cold-start overhead, HMR latency, and production bundle size deltas are continuously tracked in the repository's benchmark suite (`benchmarks/RESULTS.md`) alongside the existing runtime vs. codegen numbers. A regression in any tracked metric is visible in the report on the next run — no manual measurement required.

## Assumptions

- The developer is using Vite 5 or later. Plugin API compatibility can be revisited for older versions if there is demand.
- The developer uses the same `z2f.config.ts` file that the existing CLI already consumes. No new config format is introduced.
- The plugin sits on top of the existing codegen package — all actual code generation happens via the existing entry point. The plugin is the glue between Vite's lifecycle and the codegen pipeline, not a reimplementation.
- The plugin is a new workspace package (for example `@zod-to-form/vite`), published alongside the existing `core`, `codegen`, `react`, and `cli` packages.
- Generated forms are served as virtual modules by default (no disk writes), with an opt-in mechanism for writing to disk when the developer wants to commit the output or inspect it.
- Hot reload on schema change uses standard Vite HMR rather than a custom mechanism.
- The plugin does not attempt to handle non-Zod schema sources. If a developer brings a schema library other than Zod, the plugin is a no-op for that source.
- Existing IDE type-checking patterns (Vite's client types, virtual-module typing conventions) are sufficient; no custom language service is needed.
- The plugin does not replace the CLI. Both will continue to exist, and the CLI will remain the recommended path for committed build artifacts (CI pipelines, code review visibility).
