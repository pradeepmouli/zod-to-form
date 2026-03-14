# @zod-to-form/react

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
