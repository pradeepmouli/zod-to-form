# Tasks: Deploy Playground

**Input**: Design documents from `/specs/008-deploy-playground/`
**Prerequisites**: plan.md (required), spec.md (required), research.md

**Tests**: Not requested — this is an infrastructure/deployment feature.

**Organization**: Tasks grouped by user story for independent delivery.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Prepare build configuration for combined docs + playground deployment

- [ ] T001 Add conditional `base: '/playground/'` to apps/playground/vite.config.ts (only when CF_PAGES env is set)
- [ ] T002 Create combined build script at scripts/build-site.sh that builds docs, builds playground, copies playground dist into docs output at apps/docs/build/playground/

---

## Phase 2: Foundational (SPA Routing)

**Purpose**: Ensure the playground works correctly as a subpath SPA on Cloudflare Pages

- [ ] T003 Add SPA redirect rule for /playground/* in apps/docs/static/_redirects (append `/playground/* /playground/index.html 200`)

**Checkpoint**: Build infrastructure ready — user story implementation can begin

---

## Phase 3: User Story 1 - Access Playground via Public URL (Priority: P1) 🎯 MVP

**Goal**: The playground is deployed and accessible at zod.toform.dev/playground

**Independent Test**: Run the combined build locally, serve with `npx serve apps/docs/build`, navigate to localhost:3000/playground and confirm the editor loads

- [ ] T004 [US1] Update Cloudflare Pages build command to use scripts/build-site.sh in CF dashboard
- [ ] T005 [US1] Push to master and verify zod.toform.dev/playground loads the playground application
- [ ] T006 [US1] Verify HTTPS and that all playground assets load correctly from /playground/ subpath

**Checkpoint**: Playground is live at zod.toform.dev/playground

---

## Phase 4: User Story 2 - Automatic Deployment on Push (Priority: P2)

**Goal**: Changes to the playground deploy automatically when pushed to master

**Independent Test**: Make a minor visible change to the playground, push to master, verify the change appears on the live site within 5 minutes

- [ ] T007 [US2] Verify CF Pages auto-deploys on push to master (this should work by default since the docs site already auto-deploys — confirm the combined build script runs)
- [ ] T008 [US2] Verify that a build failure in the playground does not take down the existing docs site (test by introducing a deliberate build error, confirm previous deployment remains live, then revert)

**Checkpoint**: CI/CD pipeline verified — changes deploy automatically

---

## Phase 5: User Story 3 - Playground Accessible from Documentation Navigation (Priority: P3)

**Goal**: Docs site links to the live playground from nav and landing page

**Independent Test**: Visit zod.toform.dev, click Playground in the nav bar, confirm navigation to /playground/

- [ ] T009 [P] [US3] Update navbar Playground link in apps/docs/docusaurus.config.ts to point to /playground/
- [ ] T010 [P] [US3] Remove "coming soon" badge from Playground button and make it a live link to /playground/ in apps/docs/src/pages/index.tsx
- [ ] T011 [US3] Push and verify both nav link and landing page button navigate to the live playground

**Checkpoint**: All user stories complete — playground is deployed, auto-updating, and discoverable

---

## Phase 6: Polish

- [ ] T012 Update apps/playground/README.md with the live URL (zod.toform.dev/playground)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — can run after T001-T002
- **US1 (Phase 3)**: Depends on Phase 2 — requires build script + redirects in place
- **US2 (Phase 4)**: Depends on US1 — playground must be deployed before verifying CI/CD
- **US3 (Phase 5)**: Can run in parallel with US2 (different files)
- **Polish (Phase 6)**: After all stories complete

### User Story Dependencies

- **US1 (P1)**: Blocked by Phase 2
- **US2 (P2)**: Blocked by US1 (need a live deployment to verify CI/CD)
- **US3 (P3)**: Blocked by Phase 2 only (nav updates are independent of deployment verification)

### Parallel Opportunities

- T001 and T002 are sequential (T002 depends on T001's base path config)
- T009 and T010 can run in parallel (different files)
- US3 can run in parallel with US2

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Build configuration (T001-T002)
2. Complete Phase 2: SPA routing (T003)
3. Complete Phase 3: Deploy and verify (T004-T006)
4. **STOP and VALIDATE**: Playground accessible at zod.toform.dev/playground

### Incremental Delivery

1. Setup + Foundational → Build pipeline ready
2. US1 → Playground live (MVP!)
3. US2 → CI/CD verified
4. US3 → Docs navigation updated → Feature complete
