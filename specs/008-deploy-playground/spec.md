# Feature Specification: Deploy Playground

**Feature Branch**: `008-deploy-playground`  
**Created**: 2026-04-20  
**Status**: Draft  
**Input**: User description: "deploy playground"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Access Playground via Public URL (Priority: P1)

A visitor clicks the "Playground" link on the documentation site (zod.toform.dev) and lands on the interactive playground where they can write Zod schemas and see generated forms live — without installing anything locally.

**Why this priority**: The playground is the primary "try before you install" experience. Without a publicly accessible URL, the playground is invisible to potential users.

**Independent Test**: Navigate to the playground URL in a browser and confirm the schema editor loads, accepts input, and renders a generated form preview.

**Acceptance Scenarios**:

1. **Given** a visitor on zod.toform.dev, **When** they click the Playground link, **Then** they are navigated to the deployed playground application
2. **Given** the playground URL, **When** a visitor loads it in any modern browser, **Then** the application renders within 3 seconds on a typical connection
3. **Given** the playground is loaded, **When** a visitor types a Zod schema, **Then** the form preview updates in real time

---

### User Story 2 - Automatic Deployment on Push (Priority: P2)

When a contributor merges changes to the playground app on the master branch, the deployed version updates automatically without manual intervention.

**Why this priority**: Manual deploys create friction and stale content. Continuous deployment ensures the live playground always matches the latest source.

**Independent Test**: Push a visible change to the playground on master and confirm the live site reflects the change within minutes.

**Acceptance Scenarios**:

1. **Given** a commit to `apps/playground/` merged to master, **When** the CI/CD pipeline runs, **Then** the playground is redeployed with the new changes
2. **Given** a failed build, **When** deployment is attempted, **Then** the previous working version remains live and the failure is surfaced to maintainers

---

### User Story 3 - Playground Accessible from Documentation Navigation (Priority: P3)

The documentation site's navigation bar links directly to the deployed playground, and the landing page's "Playground (coming soon)" button is updated to point to the live URL.

**Why this priority**: Discoverability depends on the docs site linking to the playground. Without updating navigation, visitors won't know it exists.

**Independent Test**: Visit zod.toform.dev, click the Playground nav link, and confirm it navigates to the live playground.

**Acceptance Scenarios**:

1. **Given** the docs site, **When** a visitor clicks "Playground" in the navigation bar, **Then** they are taken to the deployed playground
2. **Given** the docs landing page, **When** the playground is deployed, **Then** the "coming soon" badge is removed and the button becomes a live link

---

### Edge Cases

- What happens when the playground build fails during deployment? The previous working version must remain accessible.
- What happens when the playground is accessed on a mobile device? The application should render responsively (existing concern, not deployment-specific).
- What happens if the custom domain DNS is misconfigured? Visitors should see a meaningful error rather than a blank page.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The playground MUST be accessible via a public URL without authentication
- **FR-002**: The deployed playground MUST serve the production build of the playground application
- **FR-003**: Deployment MUST trigger automatically when changes to the playground are pushed to master
- **FR-004**: The deployment pipeline MUST fail gracefully — a broken build MUST NOT take down the currently live version
- **FR-005**: The documentation site MUST link to the deployed playground from the navigation bar and landing page
- **FR-006**: The playground URL MUST support HTTPS
- **FR-007**: The deployed playground MUST load and function without requiring any backend server (static site)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The playground is accessible at its public URL and loads within 3 seconds on a standard broadband connection
- **SC-002**: Changes pushed to master are reflected on the live playground within 5 minutes
- **SC-003**: The documentation site links to the playground from at least two locations (nav bar and landing page)
- **SC-004**: The playground serves content over HTTPS with a valid certificate
- **SC-005**: A build failure does not disrupt the currently live deployment

## Assumptions

- The playground is a fully static single-page application (no server-side rendering or API required)
- The deployment target is the same hosting platform as the docs site (already configured for zod.toform.dev)
- The playground will be hosted at zod.toform.dev/playground (subpath of the docs site, same deployment project)
- Session persistence (localStorage) works without additional infrastructure since it is client-only
