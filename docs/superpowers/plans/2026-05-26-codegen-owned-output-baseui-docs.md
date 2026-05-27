# Codegen Owned-Output (Base UI) — Plan B: Docs & Claims Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make z2f's docs/marketing claims about codegen ownership accurate now that the code makes "zero runtime `@zod-to-form/*` dependency" literally true, fix the phantom-import sample, update old paths/date guidance to the new Base UI layout, and note the Base UI target.

**Architecture:** Pure prose/markdown + one TSX landing-page edit. No runtime code. Lands alongside or just after **Plan A** (the code that makes the claims true); the claim-tightening is safe to land independently but the path/sample fixes assume Plan A's layout.

**Tech Stack:** Markdown (Docusaurus), one React/TSX landing page, the shadcn registry docs strings.

**Spec:** `docs/superpowers/specs/2026-05-26-codegen-owned-output-baseui-design.md` (§9).

**Sequencing:** After Plan A (so referenced output/paths exist). **Branch:** `feat/codegen-owned-output`. **Do not modify** `.claude/settings.json` or `apps/playground/src/hooks/usePlaygroundState.ts`.

**Claim inventory** (from the audit; verify line numbers at edit time — they drift): `README.md` (≈ lines 10, 20, 49, 75, 81, 88, 90, 92), `apps/docs/src/pages/index.tsx` (≈ 149, 152, 198–200, 205–206, 253–256, 353, 554), `apps/docs/docs/intro.md` (≈ 25, 42), `apps/docs/docs/quickstart.md` (≈ 43, 63–64, 94, 101, 103), `apps/docs/docs/guides/vite-plugin.md` (≈ 164), `apps/docs/docs/guides/optimization.md` (≈ 112), `skills/zod-to-form-codegen/SKILL.md` (≈ 13, 15, 17), `apps/docs/registry/build/items.ts` (≈ 240, 243–244).

---

### Task 1: Fix the phantom-import quickstart sample

**Files:**
- Modify: `apps/docs/docs/quickstart.md` (the generated-output code sample, ≈ lines 59–91)

- [ ] **Step 1: Locate the bad sample**

Run: `rg -n "StripIndexSignature' from '@zod-to-form/core|from '@zod-to-form/core'" apps/docs/docs/quickstart.md`
Confirm the sample shows `import type { StripIndexSignature } from '@zod-to-form/core';` — which codegen never emits.

- [ ] **Step 2: Replace with real output**

Generate the actual output for the quickstart's schema (run the documented `zodform generate` against the doc's example, or copy from the regenerated `apps/docs/static/r/starter-codegen.json` form content). For the registry/Base-UI path, the form imports `StripIndexSignature` from `@/components/z2f` (owned) — use that as the citable example, OR (for the standalone-CLI path the quickstart describes) show the inlined `type StripIndexSignature<T> = …` block. Pick whichever matches the quickstart's narrative and make the surrounding prose consistent (it currently claims "No `@zod-to-form/*` imports appear in the output" at ≈ line 94 — keep that claim true against the chosen sample).

- [ ] **Step 3: Verify the doc builds**

Run: `pnpm --filter @zod-to-form/docs build 2>/dev/null || (cd apps/docs && npm run build)`
Expected: builds without MDX errors.

- [ ] **Step 4: Commit**

```bash
git add apps/docs/docs/quickstart.md
git commit -m "docs: fix quickstart generated-output sample (no phantom @zod-to-form/core import)"
```

---

### Task 2: Tighten unqualified "no dependency" claims to "no runtime dependency"

**Files:**
- Modify: `README.md`, `apps/docs/docs/intro.md`, `apps/docs/docs/quickstart.md`, `apps/docs/docs/guides/vite-plugin.md`, `apps/docs/docs/guides/optimization.md`, `skills/zod-to-form-codegen/SKILL.md`, `apps/docs/registry/build/items.ts`

- [ ] **Step 1: Find every unqualified claim**

Run: `rg -ni "no .*dependency|zero.?dependency|no custom runtime|stop using zod-to-form|fully own|standalone" README.md apps/docs skills`
Cross-check against the claim inventory above.

- [ ] **Step 2: Edit each to be precise**

Where a claim is unqualified ("no dependency", "zero-dependency", "no zod-to-form imports remain"), ensure it reads as **runtime**: e.g. "no **runtime** dependency on any `@zod-to-form` package." Where a claim says "stop using zod-to-form entirely and the generated code keeps working," it may stand (now true at runtime) — add a one-line note where natural that `z2f.config.ts` is **build-time tooling** (only needed to re-generate). Do not overclaim "zero z2f anywhere": the build-time `z2f.config.ts` keeps a `@zod-to-form/core` devDep.

- [ ] **Step 3: Verify docs build + spot-read**

Run the docs build (Task 1 Step 3). Re-read each edited claim in context to confirm it's accurate against Plan A's behavior.

- [ ] **Step 4: Commit**

```bash
git add README.md apps/docs/docs apps/docs/registry/build/items.ts skills
git commit -m "docs: qualify codegen ownership claims as 'no runtime dependency'"
```

---

### Task 3: Update old paths + date guidance + Base UI target note

**Files:**
- Modify: any docs referencing `@/components/zod-form`, `@/lib/zod-form/...`, or the old DatePicker-for-string-dates behavior; the starter docs strings in `apps/docs/registry/build/items.ts` (`STARTER_DOCS`)

- [ ] **Step 1: Find stale path/date references**

Run: `rg -ni "components/zod-form|lib/zod-form|zod-form\.tsx|DatePicker" README.md apps/docs skills`

- [ ] **Step 2: Update to the new layout + routing**

Replace `@/components/zod-form` → `@/components/z2f`, `@/lib/zod-form/schema` → `@/lib/example-schema`, and `z2f.config.ts` references to the project root. Update any prose describing date fields to the route-by-type behavior (string date/time/datetime → native inputs; `z.date()` → Base UI date-picker). In the registry `STARTER_DOCS`, add a one-line note: the starters target shadcn's **Base UI** components — run `npx shadcn create` choosing Base UI (or have the `base` style installed) so the pulled `ui/*` match.

- [ ] **Step 3: Verify docs build**

Run the docs build. Expected: clean.

- [ ] **Step 4: Regenerate registry (docs strings ship in items)**

If `STARTER_DOCS` changed, run `pnpm registry:build && pnpm registry:check` and commit the regenerated `apps/docs/static/r/*` (coordinate with Plan A Task 10 — if both touch it, regenerate once after both land).

- [ ] **Step 5: Commit**

```bash
git add README.md apps/docs skills
git commit -m "docs: update paths + date guidance to Base UI z2f layout; note Base UI target"
```

---

### Task 4: Landing page (`index.tsx`) claim + comparison-row review

**Files:**
- Modify: `apps/docs/src/pages/index.tsx`

- [ ] **Step 1: Review the hero/feature/comparison strings**

Read the codegen tagline (≈ 149/152), hero (≈ 198–206), architecture desc (≈ 253–256), comparison table row "Zero-dependency eject" (≈ 353), ecosystem "No custom runtime" (≈ 554).

- [ ] **Step 2: Edit for accuracy**

"Zero runtime dependency on `@zod-to-form/*` in the emitted code" is now literally true — keep it. The comparison row "Zero-dependency eject" is accurate at runtime; leave as a differentiator. "No custom runtime. Just Zod, React Hook Form, and your component library." is true. Only adjust any phrasing that implies *zero z2f anywhere including build-time* (none found in the audit, but confirm). No fabricated claims.

- [ ] **Step 3: Verify the page builds + renders**

Run the docs build; if feasible, `open` the built page or run the dev server and eyeball the hero/comparison section.

- [ ] **Step 4: Commit**

```bash
git add apps/docs/src/pages/index.tsx
git commit -m "docs(landing): confirm codegen ownership claims accurate post-migration"
```

---

## Notes for the implementer

- Land **after Plan A** so the paths, generated output, and `typesModule` import the docs reference actually exist.
- If both plans modify `apps/docs/static/r/*` (registry regeneration), regenerate **once** after both sets of changes and commit the single result — don't fight `registry:check` twice.
- These are claims about the product; verify each edited sentence against Plan A's actual behavior rather than aspirationally.
