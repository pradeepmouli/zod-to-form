# @zod-to-form/codegen

## 0.10.1

### Patch Changes

- [#145](https://github.com/pradeepmouli/zod-to-form/pull/145) [`216670a`](https://github.com/pradeepmouli/zod-to-form/commit/216670a0ae5bfc17ee34aa9e7272fbf1fba6efb6) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - - chore: migrate @to-skills/_ deps to @skillit/_ scope
  - chore: set changeset baseBranch to develop
  - chore: allow AI tooling artifacts to be tracked on develop
- Updated dependencies [[`216670a`](https://github.com/pradeepmouli/zod-to-form/commit/216670a0ae5bfc17ee34aa9e7272fbf1fba6efb6)]:
  - @zod-to-form/core@0.11.1

## 0.10.0

### Minor Changes

- [#139](https://github.com/pradeepmouli/zod-to-form/pull/139) [`3f33a55`](https://github.com/pradeepmouli/zod-to-form/commit/3f33a55b0308c15c1a4220569e07c33e5d41eb7b) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - Codegen output is now genuinely free of any `@zod-to-form/*` runtime dependency, and the shadcn registry targets shadcn's **Base UI** components.

  - **core:** `RHF_FIELD_EXPRESSIONS` is exported and recognizes the `!!field.value` boolean-coercion expression. String `date`/`time`/`datetime` schemas now route to native inputs (`<input type="date|time|datetime-local">`); `z.date()` continues to use a date picker.
  - **codegen:** new opt-in `typesModule` config — when set, generated forms `import type { StripIndexSignature } from '<module>'` from an owned module instead of inlining it. The shadcn field-template emits the form-library-agnostic `Field*` family (`Field`/`FieldLabel`/`FieldDescription`/`FieldError`) instead of the deprecated `Form*` family.
  - **react:** `<ZodForm>`'s `components` prop type (`ZodFormComponents`) is widened to accept plain function components (e.g. shadcn/Base UI components), not only memoized ones; the runtime resolves the `!!field.value` coercion expression for controlled bindings.
  - **registry:** the starters target Base UI; controlled fields use thin owned adapter components (`Checkbox`/`Switch`/`Select`/`RadioGroup`/`DatePicker`) that map RHF's field shape to Base UI; `FormFieldOption`/`StripIndexSignature` are inlined into an owned `types.ts`; the ejected layout is reorganized (`z2f.config.ts` at the project root, `@/components/z2f/` integration layer, neutral `@/lib/example-schema.ts` + `@/components/example-form.tsx` samples).

### Patch Changes

- Updated dependencies [[`3f33a55`](https://github.com/pradeepmouli/zod-to-form/commit/3f33a55b0308c15c1a4220569e07c33e5d41eb7b)]:
  - @zod-to-form/core@0.11.0

## 0.9.2

### Patch Changes

- [#138](https://github.com/pradeepmouli/zod-to-form/pull/138) [`e47e428`](https://github.com/pradeepmouli/zod-to-form/commit/e47e428bdb3328d7241b66f506524aed0defe6d5) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - Leaf-field rendering is now driven by a shared family of pure, `zodType`-keyed resolvers in `@zod-to-form/core`, so the runtime `<ZodForm>` renderer and codegen-generated components can no longer drift on a field's component props.

  New core exports: `resolveBaseProps(field)` (field flags: `id`/`required`/`readOnly`/`disabled` — shared across every field type), `resolveNativeAttrs(field)` (DOM-valid native input attributes: `type`/`minLength`/`maxLength`/`pattern`/`min`/`max`/`step`), `resolveControlMode(field)` (`'register'` vs `'controller'`), and `resolveOptionsProps(field)` (`options` passthrough). Both renderers now compose these instead of hand-assembling props.

  This fixes the open divergence where codegen-generated leaf components emitted only `id` (and only `type` among native attrs) while the runtime emitted `required`/`readOnly` and forwarded the native-validation attributes (`minLength`/`min`/etc.). Generated leaf components now emit the same base props and native validation attributes as the runtime. A new codegen parity test asserts generated output materializes the shared resolver composition — including hardcoded checks for `minLength`/`min` — guarding against future drift. The React renderer refactor is DOM-observably behavior-preserving.

- [#130](https://github.com/pradeepmouli/zod-to-form/pull/130) [`5382a5e`](https://github.com/pradeepmouli/zod-to-form/commit/5382a5eed4289c0b1262bf0d8980544737df4e5a) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - Codegen-generated forms now coerce HTML input values correctly. Generated `register()` calls emit RHF coercion options (`valueAsNumber` for number/bigint, `valueAsDate` for date, `setValueAs` for file) to match the runtime `<ZodForm>` renderer — fixing "Expected number" validation errors when a `z.number()` field is rendered as a numeric input.

  The field-to-register-option decision is extracted into a new framework-agnostic `getFieldRegisterHints(field)` helper in `@zod-to-form/core`, consumed by both the runtime renderer and codegen so they can't drift. The React renderer refactor is behavior-preserving.

- [#129](https://github.com/pradeepmouli/zod-to-form/pull/129) [`0afa3fa`](https://github.com/pradeepmouli/zod-to-form/commit/0afa3faca214b3937bed888a3499842624af9a4e) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - Mapped/named field components now receive schema-derived native attributes (e.g. `type="email"`) like raw inputs do, so generated forms keep native input semantics when using a component map.

- [#129](https://github.com/pradeepmouli/zod-to-form/pull/129) [`a8da28c`](https://github.com/pradeepmouli/zod-to-form/commit/a8da28c398350ffbd03dbdf6ddb11e57c1671be4) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - buildConfigSource now serializes non-controlled component overrides (was dropping entries without `controlled: true`), so generated/regenerated forms use the configured named components for all fields, not just controlled ones.

- Updated dependencies [[`e47e428`](https://github.com/pradeepmouli/zod-to-form/commit/e47e428bdb3328d7241b66f506524aed0defe6d5), [`5382a5e`](https://github.com/pradeepmouli/zod-to-form/commit/5382a5eed4289c0b1262bf0d8980544737df4e5a)]:
  - @zod-to-form/core@0.10.0

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

- [`422c66b`](https://github.com/pradeepmouli/zod-to-form/commit/422c66b6ca87f469eff3f3ecdf0dbd24fc2e8e1d) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - Add generated-form `fieldProps` support for per-field runtime component props and
  fix Vite generate/query mode so rewritten forms can resolve workspace schemas in
  monorepos, including multi-export schema modules.

## 0.7.2

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

## 0.6.6

### Patch Changes

- [#91](https://github.com/pradeepmouli/zod-to-form/pull/91) [`4291dce`](https://github.com/pradeepmouli/zod-to-form/commit/4291dceb167c2ea2252d2df28435aa7f589b2d4f) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - - ci(deps): bump pnpm/action-setup from v5 to v6

- Updated dependencies [[`4291dce`](https://github.com/pradeepmouli/zod-to-form/commit/4291dceb167c2ea2252d2df28435aa7f589b2d4f)]:
  - @zod-to-form/core@0.6.7

## 0.6.5

### Patch Changes

- [#89](https://github.com/pradeepmouli/zod-to-form/pull/89) [`12405af`](https://github.com/pradeepmouli/zod-to-form/commit/12405af4ba2861b84690cd6ecca7bcc73e75e134) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - - fix(007): address PR review [#5](https://github.com/pradeepmouli/zod-to-form/issues/5) — onWarn tests + hardening, scanner polish
  - Update index.tsx
  - fix(007): address PR review [#4](https://github.com/pradeepmouli/zod-to-form/issues/4) — shebang, directive seed, rename stragglers, landing polish
  - chore(vite): widen peer range to include vite 8
  - fix(007): address PR review [#3](https://github.com/pradeepmouli/zod-to-form/issues/3) — AST insertion scanner, rename stragglers, type polish
- Updated dependencies [[`12405af`](https://github.com/pradeepmouli/zod-to-form/commit/12405af4ba2861b84690cd6ecca7bcc73e75e134)]:
  - @zod-to-form/core@0.6.6

## 0.6.4

### Patch Changes

- Updated dependencies [[`4718965`](https://github.com/pradeepmouli/zod-to-form/commit/47189652aed00104b1486a4bb7c30ce89cfd3fd0)]:
  - @zod-to-form/core@0.6.5

## 0.6.3

### Patch Changes

- [`1784fb4`](https://github.com/pradeepmouli/zod-to-form/commit/1784fb4dc959dac762eac7901734a7ef3a9d3156) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - Test OIDC trusted publisher setup for automated npm publishing.

## 0.6.2

### Patch Changes

- Updated dependencies [[`261aa2e`](https://github.com/pradeepmouli/zod-to-form/commit/261aa2ee3d03485a291ae663abc04194833b3bbd)]:
  - @zod-to-form/core@0.6.4

## 0.6.2

### Patch Changes

- Updated dependencies [[`bf4b93c`](https://github.com/pradeepmouli/zod-to-form/commit/bf4b93c5734d43239919ebe6d23ebc0eb944a4a1)]:
  - @zod-to-form/core@0.6.3

## 0.6.2

### Patch Changes

- Updated dependencies [[`59cf01b`](https://github.com/pradeepmouli/zod-to-form/commit/59cf01b34df3b168f44c2401d5e8413539cdb797)]:
  - @zod-to-form/core@0.6.2
