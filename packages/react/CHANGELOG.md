# @zod-to-form/react

## 0.9.1

### Patch Changes

- [`92a313f`](https://github.com/pradeepmouli/zod-to-form/commit/92a313f42bbc2884bb740a8da1a79520a53747d3) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - Update production dependencies (zod, jiti, type-fest, react, react-hook-form)

- Updated dependencies [[`92a313f`](https://github.com/pradeepmouli/zod-to-form/commit/92a313f42bbc2884bb740a8da1a79520a53747d3)]:
  - @zod-to-form/core@0.9.1

## 0.9.0

### Minor Changes

- [#116](https://github.com/pradeepmouli/zod-to-form/pull/116) [`4ada01d`](https://github.com/pradeepmouli/zod-to-form/commit/4ada01d2b052a97d59926eba28a66f1ebaf28ccf) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - - feat(config): support schema-level subschema defaults

### Patch Changes

- Updated dependencies [[`4ada01d`](https://github.com/pradeepmouli/zod-to-form/commit/4ada01d2b052a97d59926eba28a66f1ebaf28ccf)]:
  - @zod-to-form/core@0.9.0

## 0.8.1

### Patch Changes

- Updated dependencies [[`f241cec`](https://github.com/pradeepmouli/zod-to-form/commit/f241cec28759c0fe72e06f06a362adba1d64c290)]:
  - @zod-to-form/core@0.8.1

## 0.8.0

### Minor Changes

- [#104](https://github.com/pradeepmouli/zod-to-form/pull/104) [`4e63504`](https://github.com/pradeepmouli/zod-to-form/commit/4e63504620c6677b76155ac576d2f9f7999e5fa5) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - Add editor primitives for graph- and document-driven schema editors:

  - **Array reorder** — set `arrayConfig.reorder: true` on an array field to
    enable per-row reorder. The library wires `useFieldArray.move()` and
    mounts a registered `ArrayReorderHandle` per row. Default is a
    keyboard-operable ↑/↓ button group; override via `componentMap`.
    `arrayConfig.onReorder?: (from, to) => void` mirrors changes to your
    upstream state.
  - **External-data sync** — `useExternalSync(form, source, toValues, options?)`
    resets a form's values when the `source` reference changes (via
    `Object.is`) and preserves edits while the reference is stable. Pass
    `{ keepDirty: true }` to merge across switches.
  - **Discriminator host** — `<ZodFormSwitch source discriminator schemas
fallback />` picks the right schema from a discriminator field on the
    source and unmounts/remounts via React `key` so no state leaks
    between schemas.
  - **Ghost rows** — `arrayConfig.before?: GhostRow[]` and
    `arrayConfig.after?: GhostRow[]` render non-form rows alongside
    form-driven rows. Ghost rows do not participate in form state,
    validation, or submission.
  - **Custom row renderer documentation** — formal worked example of the
    existing `FormMeta.render` pattern; new docs under "Editor Primitives"
    in the docs sidebar.

  New types in `@zod-to-form/core`: `GhostRow`, `GhostRowContext`. Extended:
  `ArrayConfig` (added `reorder`, `onReorder`, `before`, `after`).
  New exports in `@zod-to-form/react`: `useExternalSync`,
  `UseExternalSyncOptions`, `ZodFormSwitch`, `ZodFormSwitchProps`,
  `ArrayReorderHandle` (in both `defaultComponentMap` and
  `shadcnComponentMap`).

  All new exports are tree-shakeable; an adopter who does not import them
  pays no bundle cost.

### Patch Changes

- Updated dependencies [[`4e63504`](https://github.com/pradeepmouli/zod-to-form/commit/4e63504620c6677b76155ac576d2f9f7999e5fa5)]:
  - @zod-to-form/core@0.8.0

## 0.7.1

### Patch Changes

- [#102](https://github.com/pradeepmouli/zod-to-form/pull/102) [`cbe7397`](https://github.com/pradeepmouli/zod-to-form/commit/cbe739744e877c094741f02673890b20c9e1db5f) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - - fix(react,playground): onValueChange fires on every edit + config pane styling
  - docs(landing): center Performance trailing explanation + show 26× math
  - style(docs): even grid columns on landing page
- Updated dependencies [[`cbe7397`](https://github.com/pradeepmouli/zod-to-form/commit/cbe739744e877c094741f02673890b20c9e1db5f)]:
  - @zod-to-form/core@0.7.1

## 0.7.0

### Minor Changes

- [#100](https://github.com/pradeepmouli/zod-to-form/pull/100) [`6e2696a`](https://github.com/pradeepmouli/zod-to-form/commit/6e2696ac606f1319b02b9106934911269549059d) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - - fix: address Copilot PR review comments
  - fix(playground,shadcn-proxy): address review findings from PR [#100](https://github.com/pradeepmouli/zod-to-form/issues/100)
  - chore: add auto-generated changeset (minor)
  - feat(playground): fix shadcn component download in prod via standalone Worker

### Patch Changes

- Updated dependencies [[`6e2696a`](https://github.com/pradeepmouli/zod-to-form/commit/6e2696ac606f1319b02b9106934911269549059d)]:
  - @zod-to-form/core@0.7.0

## 0.6.7

### Patch Changes

- [#91](https://github.com/pradeepmouli/zod-to-form/pull/91) [`4291dce`](https://github.com/pradeepmouli/zod-to-form/commit/4291dceb167c2ea2252d2df28435aa7f589b2d4f) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - - ci(deps): bump pnpm/action-setup from v5 to v6

- Updated dependencies [[`4291dce`](https://github.com/pradeepmouli/zod-to-form/commit/4291dceb167c2ea2252d2df28435aa7f589b2d4f)]:
  - @zod-to-form/core@0.6.7

## 0.6.6

### Patch Changes

- [#89](https://github.com/pradeepmouli/zod-to-form/pull/89) [`12405af`](https://github.com/pradeepmouli/zod-to-form/commit/12405af4ba2861b84690cd6ecca7bcc73e75e134) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - - fix(007): address PR review [#5](https://github.com/pradeepmouli/zod-to-form/issues/5) — onWarn tests + hardening, scanner polish
  - Update index.tsx
  - fix(007): address PR review [#4](https://github.com/pradeepmouli/zod-to-form/issues/4) — shebang, directive seed, rename stragglers, landing polish
  - chore(vite): widen peer range to include vite 8
  - fix(007): address PR review [#3](https://github.com/pradeepmouli/zod-to-form/issues/3) — AST insertion scanner, rename stragglers, type polish
- Updated dependencies [[`12405af`](https://github.com/pradeepmouli/zod-to-form/commit/12405af4ba2861b84690cd6ecca7bcc73e75e134)]:
  - @zod-to-form/core@0.6.6

## 0.6.5

### Patch Changes

- Updated dependencies [[`4718965`](https://github.com/pradeepmouli/zod-to-form/commit/47189652aed00104b1486a4bb7c30ce89cfd3fd0)]:
  - @zod-to-form/core@0.6.5

## 0.6.4

### Patch Changes

- [#51](https://github.com/pradeepmouli/zod-to-form/pull/51) [`261aa2e`](https://github.com/pradeepmouli/zod-to-form/commit/261aa2ee3d03485a291ae663abc04194833b3bbd) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - - Add speckit workflows for feature modification, phases-to-issues, and refactoring
  - Add speckit.verify post-implementation verification workflow
  - Add issuesync hooks for GitHub issue status synchronization
  - Improve speckit.review to orchestrate specialized review agents (code, comments, tests, errors, types, simplify)
  - Add UI/UX Pro Max BM25 search capability for design guidelines
  - Remove legacy skill shim files
- Updated dependencies [[`261aa2e`](https://github.com/pradeepmouli/zod-to-form/commit/261aa2ee3d03485a291ae663abc04194833b3bbd)]:
  - @zod-to-form/core@0.6.4

## 0.6.3

### Patch Changes

- [#64](https://github.com/pradeepmouli/zod-to-form/pull/64) [`bf4b93c`](https://github.com/pradeepmouli/zod-to-form/commit/bf4b93c5734d43239919ebe6d23ebc0eb944a4a1) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - - Add speckit workflows for feature modification, phases-to-issues, and refactoring
  - Add speckit.verify post-implementation verification workflow
  - Add issuesync hooks for GitHub issue status synchronization
  - Improve speckit.review to orchestrate specialized review agents (code, comments, tests, errors, types, simplify)
  - Add UI/UX Pro Max BM25 search capability for design guidelines
  - Remove legacy skill shim files
- Updated dependencies [[`bf4b93c`](https://github.com/pradeepmouli/zod-to-form/commit/bf4b93c5734d43239919ebe6d23ebc0eb944a4a1)]:
  - @zod-to-form/core@0.6.3

## 0.6.2

### Patch Changes

- [#51](https://github.com/pradeepmouli/zod-to-form/pull/51) [`59cf01b`](https://github.com/pradeepmouli/zod-to-form/commit/59cf01b34df3b168f44c2401d5e8413539cdb797) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - - Update the application's accent color to orange
  - Improve form fields to correctly display password inputs
  - Update examples to use meta for schema descriptions
  - Correctly report underlying data types within nested schema definitions
  - Introduce a new code generation tab and apply a new visual theme
- Updated dependencies [[`59cf01b`](https://github.com/pradeepmouli/zod-to-form/commit/59cf01b34df3b168f44c2401d5e8413539cdb797)]:
  - @zod-to-form/core@0.6.2

## 0.6.1

### Patch Changes

- [#49](https://github.com/pradeepmouli/zod-to-form/pull/49) [`c5e441a`](https://github.com/pradeepmouli/zod-to-form/commit/c5e441a5fa47d38d3c74f06d5dc40c6ca5f66833) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - - docs: update changelog and READMEs to reflect v0.6.0 state

- Updated dependencies [[`c5e441a`](https://github.com/pradeepmouli/zod-to-form/commit/c5e441a5fa47d38d3c74f06d5dc40c6ca5f66833)]:
  - @zod-to-form/core@0.6.1

## 0.6.0

### Minor Changes

- [#45](https://github.com/pradeepmouli/zod-to-form/pull/45) [`05c934e`](https://github.com/pradeepmouli/zod-to-form/commit/05c934ec6a57ca5beb012fbc2e29c02570f1e6e7) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - - chore: add speckit review extensions and tooling config
  - refactor: unify fieldType and component into single `component` property

### Patch Changes

- Updated dependencies [[`05c934e`](https://github.com/pradeepmouli/zod-to-form/commit/05c934ec6a57ca5beb012fbc2e29c02570f1e6e7)]:
  - @zod-to-form/core@0.6.0

## 0.5.0

### Minor Changes

- [#43](https://github.com/pradeepmouli/zod-to-form/pull/43) [`ea53400`](https://github.com/pradeepmouli/zod-to-form/commit/ea534009411de3ccb2d87233fe577280affcca29) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - - feat: enhance runInit to support explicit component and schema paths for typed imports
  - refactor!: remove all deprecated type aliases and functions
  - refactor: simplify CLI codegen and remove unused section handling
  - test: update CLI codegen tests to reflect current rendering behavior
  - ci: remove redundant pull_request trigger

### Patch Changes

- Updated dependencies [[`ea53400`](https://github.com/pradeepmouli/zod-to-form/commit/ea534009411de3ccb2d87233fe577280affcca29)]:
  - @zod-to-form/core@0.5.0

## 0.4.2

### Patch Changes

- [#41](https://github.com/pradeepmouli/zod-to-form/pull/41) [`0768cb3`](https://github.com/pradeepmouli/zod-to-form/commit/0768cb3efa189dcd18ac143a3e4a7328d6e4aa2a) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - - Refactor code structure for improved readability and maintainability
  - ci: broaden pull_request trigger, exclude sub\*\* branches
- Updated dependencies [[`0768cb3`](https://github.com/pradeepmouli/zod-to-form/commit/0768cb3efa189dcd18ac143a3e4a7328d6e4aa2a)]:
  - @zod-to-form/core@0.4.2

## 0.4.1

### Patch Changes

- [#34](https://github.com/pradeepmouli/zod-to-form/pull/34) [`de2005b`](https://github.com/pradeepmouli/zod-to-form/commit/de2005ba3d9c2714beb3251eada260b7e0a3fffb) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - - refactor: deduplicate normalizeFieldKey and section collection, remove unsafe casts

- Updated dependencies [[`de2005b`](https://github.com/pradeepmouli/zod-to-form/commit/de2005ba3d9c2714beb3251eada260b7e0a3fffb)]:
  - @zod-to-form/core@0.4.1

## 0.4.0

### Minor Changes

- [#32](https://github.com/pradeepmouli/zod-to-form/pull/32) [`b55cd57`](https://github.com/pradeepmouli/zod-to-form/commit/b55cd57da1ffd8082d9a32bccfb91e1e0781b6e2) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - - docs: update skills and README for v0.3.0 features
  - feat: add zod-to-form skill to skills/ for npx skills add
  - feat: add section field grouping and zod-to-form skill
  - feat(cli): auto-detect controlled components in init command

### Patch Changes

- Updated dependencies [[`b55cd57`](https://github.com/pradeepmouli/zod-to-form/commit/b55cd57da1ffd8082d9a32bccfb91e1e0781b6e2)]:
  - @zod-to-form/core@0.4.0

## 0.3.0

### Minor Changes

- [#30](https://github.com/pradeepmouli/zod-to-form/pull/30) [`f7e0d94`](https://github.com/pradeepmouli/zod-to-form/commit/f7e0d94a9fc2f0cc24777aa943b0315edd06d075) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - feat: controlled component support, FormProvider wrapping, and form scaffolding improvements

  **Core:**

  - Add `controlled` and `propMap` to `ComponentEntry` for marking components as controlled
  - Add `propMap` to `FieldConfig` for per-field prop mapping overrides
  - Add `formProvider` to `ConfigDefaults`
  - Export `StripIndexSignature` utility type (eliminates inline boilerplate in generated files)
  - Export `getEmptyDefault()` for schema-inferred type-safe empty values

  **CLI:**

  - Generate `<Controller>` pattern for `controlled: true` components with `propMap` support
  - Always emit `const form = useForm(...)` then destructure (enables FormProvider and reset)
  - Wrap form in `<FormProvider {...form}>` when `formProvider: true` or `mode: 'auto-save'`
  - Accept `defaultValues` and `values` props for external data population
  - Import `StripIndexSignature` from `@zod-to-form/core` instead of inlining
  - Use `getEmptyDefault()` for type-safe array append defaults

  **React:**

  - Add `useController` support for controlled components in `FieldRenderer`
  - Apply `propMap` (component-level + per-field override) to remap RHF field props
  - Pass `values` prop through to `useForm({ values })` in `useZodForm`
  - Use shared `getEmptyDefault()` for array append defaults

### Patch Changes

- Updated dependencies [[`f7e0d94`](https://github.com/pradeepmouli/zod-to-form/commit/f7e0d94a9fc2f0cc24777aa943b0315edd06d075)]:
  - @zod-to-form/core@0.3.0

## 0.2.7

### Patch Changes

- [`d878cce`](https://github.com/pradeepmouli/zod-to-form/commit/d878ccee9a4cc6012b73ff9da3852b8ab5dcfdaf) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - chore: verify release pipeline

- Updated dependencies [[`d878cce`](https://github.com/pradeepmouli/zod-to-form/commit/d878ccee9a4cc6012b73ff9da3852b8ab5dcfdaf)]:
  - @zod-to-form/core@0.2.7

## 0.2.6

### Patch Changes

- [#27](https://github.com/pradeepmouli/zod-to-form/pull/27) [`a882fb7`](https://github.com/pradeepmouli/zod-to-form/commit/a882fb75842844bd778f3f9cad657a3cb7d17790) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - - chore: test CI/CD automation pipeline

- Updated dependencies [[`a882fb7`](https://github.com/pradeepmouli/zod-to-form/commit/a882fb75842844bd778f3f9cad657a3cb7d17790)]:
  - @zod-to-form/core@0.2.6

## 0.2.5

### Patch Changes

- 4048317: ### Changes\n\n• \n
- Updated dependencies [4048317]
  - @zod-to-form/core@0.2.5

## 0.2.4

### Patch Changes

- 8dbc2f7: ### Changes\n\n• \n
- Updated dependencies [8dbc2f7]
  - @zod-to-form/core@0.2.4
