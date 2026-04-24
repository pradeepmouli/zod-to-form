# Feature Specification: Fix Component Download on Playground Site

**Feature Branch**: `009-fix-component-download`
**Created**: 2026-04-23
**Status**: Draft
**Input**: User description: "fix component download on playground site"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Shadcn Components Load on Deployed Playground (Priority: P1)

A visitor opens the public playground, selects the shadcn preset (or loads an example that uses it), and sees the form preview render with real shadcn-styled components (buttons, inputs, selects, checkboxes, switches, textareas) without any error state.

**Why this priority**: The playground's core value proposition is "try zod-to-form live with real components." If component downloads fail in production, the preview falls back to unstyled defaults or shows an error — undermining the whole demo.

**Independent Test**: Open the deployed playground, pick an example that uses shadcn (or toggle the preset), and confirm the preview renders styled shadcn controls within a few seconds on a first visit (cold cache) and instantly on a repeat visit (warm cache).

**Acceptance Scenarios**:

1. **Given** a first-time visitor on the deployed playground, **When** shadcn components are needed to render the preview, **Then** the required components are fetched successfully and the preview renders with shadcn styling.
2. **Given** a returning visitor with a warm cache, **When** shadcn components are needed, **Then** the preview renders immediately from cache without a network round-trip.
3. **Given** the playground is running locally in development, **When** shadcn components are needed, **Then** they still load successfully — a contributor does not need to deploy or configure a proxy to see the preview work.

---

### User Story 2 - Graceful Behavior When Download Fails (Priority: P2)

When the component source cannot be retrieved (network error, upstream outage, rate limit), the playground communicates the problem clearly and keeps the rest of the application usable instead of silently rendering broken previews or crashing.

**Why this priority**: Upstream registries can fail transiently. Users need to understand whether the problem is their schema or the environment. A clear, bounded failure mode prevents confusion and lost trust.

**Independent Test**: Simulate a failed component fetch (block the network path in devtools). The playground surfaces a visible, non-blocking notice, the rest of the UI (editor, config, codegen) continues to work, and a retry path is available.

**Acceptance Scenarios**:

1. **Given** the component registry is unreachable, **When** a visitor loads the playground, **Then** they see a clear notice that component rendering is degraded and the preview falls back to unstyled defaults rather than crashing.
2. **Given** a transient failure, **When** the visitor retries (reload or a retry action), **Then** the playground re-attempts the download and recovers if the registry is available again.

---

### User Story 3 - New Component Types Pulled On-Demand (Priority: P3)

When a visitor pastes a schema that requires a component not in the pre-fetched set, the playground pulls the additional component without requiring the user to manually refresh or reset cache.

**Why this priority**: The pre-fetched set covers common controls, but schemas can legitimately exercise a wider surface. Demand-loading keeps the first paint fast while still supporting open-ended schemas.

**Independent Test**: Paste a schema whose rendered form requires a shadcn component outside the initial pre-fetch set. The preview updates to show the newly needed control styled correctly, within the same session.

**Acceptance Scenarios**:

1. **Given** a visitor has the playground open with a warm cache of core components, **When** they load a schema requiring an additional shadcn component, **Then** that component is fetched and rendered without a full page reload.

---

### Edge Cases

- What happens in local development where the production proxy doesn't exist? The playground must still work for contributors without forcing them to deploy or run the proxy separately.
- What happens when the cache is stale (older than the retention window)? The playground refreshes it silently without breaking the current session.
- What happens when a schema references a component the registry doesn't provide? The playground renders the default component for that field type and does not block the rest of the form.
- What happens on very slow connections? The visitor sees a loading indication rather than an indefinitely blank preview.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The deployed playground MUST successfully download all components required to render the preview for every bundled example, on a cold-cache first visit, without browser security errors.
- **FR-002**: The playground MUST cache downloaded component sources per-visitor so that repeat visits within the cache retention window render immediately without re-downloading.
- **FR-003**: The playground MUST continue to work for local contributors running the playground outside production — contributors MUST NOT be required to deploy or run a separate proxy to see components load.
- **FR-004**: When a component download fails, the playground MUST surface a visible, non-blocking notice explaining that component rendering is degraded and MUST keep the editor, config, and code-output areas functional.
- **FR-005**: The playground MUST be able to download components not in the initial pre-fetch set on demand within the same session.
- **FR-006**: Component downloads MUST complete fast enough that the initial preview renders within 3 seconds on a standard broadband connection, cold cache.
- **FR-007**: The playground MUST NOT leak identifying data beyond what is necessary to fetch components.

### Key Entities

- **Component Source**: The textual definition of a single UI control (e.g., "button", "select") that the playground compiles and renders. Identified by name; content is plain text.
- **Component Cache Entry**: A versioned, timestamped collection of downloaded Component Sources stored per-visitor so repeat visits avoid re-downloading.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of bundled playground examples render with the expected styled components on the deployed site, on a cold-cache first visit, across current releases of major evergreen browsers.
- **SC-002**: Repeat visits within the cache retention window render the preview with no additional component-download network traffic.
- **SC-003**: When component download fails, at least 95% of the playground's non-preview functionality (schema editor, config tab, code output) remains usable.
- **SC-004**: Initial component download completes in under 3 seconds on a standard broadband connection, first visit.
- **SC-005**: Zero user-reported "blank preview with no explanation" incidents after the fix ships.

## Assumptions

- The deployment environment provides a mechanism for fetching arbitrary upstream registry content without browser cross-origin restrictions (e.g., a same-origin proxy path). This was set up in a prior feature but is not currently wired through end-to-end.
- The playground is a fully client-side application; there is no per-user server-side state.
- The set of "core" components pre-fetched at startup is small (under a dozen) and stable across typical sessions.
- Visitor-side cache retention is 24 hours (inherited from the existing implementation) unless changed by a later clarification.
- Local development must work out of the box — the fix cannot force contributors to set up the production proxy manually.

---

*Specification created using `/speckit.specify` workflow*
