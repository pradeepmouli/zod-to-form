# @zod-to-form/vite

## 0.4.6

### Patch Changes

- [#155](https://github.com/pradeepmouli/zod-to-form/pull/155) [`8bfefa9`](https://github.com/pradeepmouli/zod-to-form/commit/8bfefa9aac2240ad35bf9b39f5cbba219dd684af) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - - docs: remove specs/ references from READMEs
  - chore: also drop .github/agents, prompts, skills, copilot from master
  - chore: also drop specs/, enhance planning docs from master
  - chore: drop AI tooling files from master
- Updated dependencies [[`8bfefa9`](https://github.com/pradeepmouli/zod-to-form/commit/8bfefa9aac2240ad35bf9b39f5cbba219dd684af)]:
  - @zod-to-form/codegen@0.10.2
  - @zod-to-form/core@0.11.2

## 0.4.5

### Patch Changes

- [#163](https://github.com/pradeepmouli/zod-to-form/pull/163) [`4d8b42b`](https://github.com/pradeepmouli/zod-to-form/commit/4d8b42bb1e9831b88c1387fdfdcdadeceb306bf0) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - Fix the ambient `*?z2f` module type to match auto-save mode's actual runtime contract. `Z2FFormProps` only declared a required `onSubmit`, so any consumer using `mode: 'auto-save'` (which calls `onValueChange` on every RHF `watch()` tick instead — there is no submit button in auto-save mode) had no type-safe way to pass `onValueChange` without a TypeScript error, and worse, no compile-time signal that `onSubmit` was never actually going to be called. Both `onSubmit` and `onValueChange` are now optional on `Z2FFormProps`, matching the per-file interface the codegen already emits for real generated components (`packages/codegen/src/generate.ts`).

## 0.4.4

### Patch Changes

- [#145](https://github.com/pradeepmouli/zod-to-form/pull/145) [`216670a`](https://github.com/pradeepmouli/zod-to-form/commit/216670a0ae5bfc17ee34aa9e7272fbf1fba6efb6) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - - chore: migrate @to-skills/_ deps to @skillit/_ scope
  - chore: set changeset baseBranch to develop
  - chore: allow AI tooling artifacts to be tracked on develop
- [#147](https://github.com/pradeepmouli/zod-to-form/pull/147) [`1c2e6a4`](https://github.com/pradeepmouli/zod-to-form/commit/1c2e6a4870df555e4aa98b221d1a0c36ed47f24d) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - docs(core): add agent-routing JSDoc to `ZodFormsConfig` + a `zod-to-form-config` agent skill and a type-checked `config.example.ts`. Documentation only — no runtime change.
- Updated dependencies [[`216670a`](https://github.com/pradeepmouli/zod-to-form/commit/216670a0ae5bfc17ee34aa9e7272fbf1fba6efb6), [`1c2e6a4`](https://github.com/pradeepmouli/zod-to-form/commit/1c2e6a4870df555e4aa98b221d1a0c36ed47f24d)]:
  - @zod-to-form/codegen@0.10.1
  - @zod-to-form/core@0.11.1

## 0.4.3

### Patch Changes

- Updated dependencies [[`3f33a55`](https://github.com/pradeepmouli/zod-to-form/commit/3f33a55b0308c15c1a4220569e07c33e5d41eb7b)]:
  - @zod-to-form/core@0.11.0
  - @zod-to-form/codegen@0.10.0

## 0.4.2

### Patch Changes

- Updated dependencies [[`e47e428`](https://github.com/pradeepmouli/zod-to-form/commit/e47e428bdb3328d7241b66f506524aed0defe6d5), [`5382a5e`](https://github.com/pradeepmouli/zod-to-form/commit/5382a5eed4289c0b1262bf0d8980544737df4e5a), [`0afa3fa`](https://github.com/pradeepmouli/zod-to-form/commit/0afa3faca214b3937bed888a3499842624af9a4e), [`a8da28c`](https://github.com/pradeepmouli/zod-to-form/commit/a8da28c398350ffbd03dbdf6ddb11e57c1671be4)]:
  - @zod-to-form/core@0.10.0
  - @zod-to-form/codegen@0.9.2

## 0.4.1

### Patch Changes

- [`92a313f`](https://github.com/pradeepmouli/zod-to-form/commit/92a313f42bbc2884bb740a8da1a79520a53747d3) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - Update production dependencies (zod, jiti, type-fest, react, react-hook-form)

- Updated dependencies [[`92a313f`](https://github.com/pradeepmouli/zod-to-form/commit/92a313f42bbc2884bb740a8da1a79520a53747d3)]:
  - @zod-to-form/codegen@0.9.1
  - @zod-to-form/core@0.9.1

## 0.4.0

### Minor Changes

- [#116](https://github.com/pradeepmouli/zod-to-form/pull/116) [`4ada01d`](https://github.com/pradeepmouli/zod-to-form/commit/4ada01d2b052a97d59926eba28a66f1ebaf28ccf) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - - feat(config): support schema-level subschema defaults

### Patch Changes

- Updated dependencies [[`4ada01d`](https://github.com/pradeepmouli/zod-to-form/commit/4ada01d2b052a97d59926eba28a66f1ebaf28ccf)]:
  - @zod-to-form/codegen@0.9.0
  - @zod-to-form/core@0.9.0

## 0.3.1

### Patch Changes

- Updated dependencies [[`f241cec`](https://github.com/pradeepmouli/zod-to-form/commit/f241cec28759c0fe72e06f06a362adba1d64c290)]:
  - @zod-to-form/core@0.8.1
  - @zod-to-form/codegen@0.8.1

## 0.3.0

### Minor Changes

- [`422c66b`](https://github.com/pradeepmouli/zod-to-form/commit/422c66b6ca87f469eff3f3ecdf0dbd24fc2e8e1d) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - Add generated-form `fieldProps` support for per-field runtime component props and
  fix Vite generate/query mode so rewritten forms can resolve workspace schemas in
  monorepos, including multi-export schema modules.

### Patch Changes

- Updated dependencies [[`422c66b`](https://github.com/pradeepmouli/zod-to-form/commit/422c66b6ca87f469eff3f3ecdf0dbd24fc2e8e1d)]:
  - @zod-to-form/codegen@0.8.0

## 0.2.3

### Patch Changes

- Updated dependencies [[`4e63504`](https://github.com/pradeepmouli/zod-to-form/commit/4e63504620c6677b76155ac576d2f9f7999e5fa5)]:
  - @zod-to-form/core@0.8.0
  - @zod-to-form/codegen@0.7.2

## 0.2.1

### Patch Changes

- [#102](https://github.com/pradeepmouli/zod-to-form/pull/102) [`cbe7397`](https://github.com/pradeepmouli/zod-to-form/commit/cbe739744e877c094741f02673890b20c9e1db5f) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - - fix(react,playground): onValueChange fires on every edit + config pane styling
  - docs(landing): center Performance trailing explanation + show 26× math
  - style(docs): even grid columns on landing page
- Updated dependencies [[`cbe7397`](https://github.com/pradeepmouli/zod-to-form/commit/cbe739744e877c094741f02673890b20c9e1db5f)]:
  - @zod-to-form/codegen@0.7.1
  - @zod-to-form/core@0.7.1

## 0.2.0

### Minor Changes

- [#100](https://github.com/pradeepmouli/zod-to-form/pull/100) [`6e2696a`](https://github.com/pradeepmouli/zod-to-form/commit/6e2696ac606f1319b02b9106934911269549059d) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - - fix: address Copilot PR review comments
  - fix(playground,shadcn-proxy): address review findings from PR [#100](https://github.com/pradeepmouli/zod-to-form/issues/100)
  - chore: add auto-generated changeset (minor)
  - feat(playground): fix shadcn component download in prod via standalone Worker

### Patch Changes

- Updated dependencies [[`6e2696a`](https://github.com/pradeepmouli/zod-to-form/commit/6e2696ac606f1319b02b9106934911269549059d)]:
  - @zod-to-form/codegen@0.7.0
  - @zod-to-form/core@0.7.0

## 0.1.2

### Patch Changes

- [#91](https://github.com/pradeepmouli/zod-to-form/pull/91) [`4291dce`](https://github.com/pradeepmouli/zod-to-form/commit/4291dceb167c2ea2252d2df28435aa7f589b2d4f) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - - ci(deps): bump pnpm/action-setup from v5 to v6

- Updated dependencies [[`4291dce`](https://github.com/pradeepmouli/zod-to-form/commit/4291dceb167c2ea2252d2df28435aa7f589b2d4f)]:
  - @zod-to-form/codegen@0.6.6
  - @zod-to-form/core@0.6.7

## 0.1.1

### Patch Changes

- [#89](https://github.com/pradeepmouli/zod-to-form/pull/89) [`12405af`](https://github.com/pradeepmouli/zod-to-form/commit/12405af4ba2861b84690cd6ecca7bcc73e75e134) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - - fix(007): address PR review [#5](https://github.com/pradeepmouli/zod-to-form/issues/5) — onWarn tests + hardening, scanner polish
  - Update index.tsx
  - fix(007): address PR review [#4](https://github.com/pradeepmouli/zod-to-form/issues/4) — shebang, directive seed, rename stragglers, landing polish
  - chore(vite): widen peer range to include vite 8
  - fix(007): address PR review [#3](https://github.com/pradeepmouli/zod-to-form/issues/3) — AST insertion scanner, rename stragglers, type polish
- Updated dependencies [[`12405af`](https://github.com/pradeepmouli/zod-to-form/commit/12405af4ba2861b84690cd6ecca7bcc73e75e134)]:
  - @zod-to-form/codegen@0.6.5
  - @zod-to-form/core@0.6.6

## 0.1.0

### Minor Changes

- [#87](https://github.com/pradeepmouli/zod-to-form/pull/87) [`4718965`](https://github.com/pradeepmouli/zod-to-form/commit/47189652aed00104b1486a4bb7c30ce89cfd3fd0) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - **New package: `@zod-to-form/vite`** — Vite plugin that turns Zod v4 schemas into React form components on the fly via a `?z2f` import suffix. No CLI step, no committed generated files. Coexists with the CLI for projects that mix both paths.

  Highlights:

  - **Query mode**: `import { SignupForm } from './signup.ts?z2f'` — the plugin's `resolveId`/`load` hooks intercept the import and emit a virtual module containing a fully-formed React form component. Variants via `?z2f=<variant>`.
  - **Auto-discovered config**: drops a `z2f.config.{ts,mts,js,mjs}` in your project root and the plugin picks it up. Edits to the config invalidate every cached form via HMR; a syntax error keeps the previous valid version serving so the dev server stays alive.
  - **Rewrite mode (opt-in)**: presence of `rewrite: {}` in the plugin options enables a build-time JSX transform that rewrites `<ZodForm schema={X}/>` runtime call sites into generated component imports, with a build-end summary listing any sites that were skipped (dynamic schemas, namespace imports, etc.).
  - **Resolver tree-shake**: when validation optimization is configured, the build-mode pass strips `zodResolver(...)` calls and the `@hookform/resolvers/zod` import from `useZodForm`, letting Rollup remove the resolver from the production bundle entirely.
  - **HMR**: per-schema-file surgical invalidation. Editing one schema in a 20-form project recompiles exactly one entry; the other 19 stay cached.
  - **Build mode**: lazily spins up a transient SSR server during `vite build` so schema evaluation goes through Vite's full transform pipeline (TypeScript, paths, plugins) for byte-identical parity with dev.

  `@zod-to-form/core` patch: new `./loader` subpath export (Node-only, `jiti` is an optional peer) housing the `loadSchema` / `loadConfig` / `resolveSchemaExportNames` primitives shared by the CLI and any future server-side consumer. Also exports `canonicalizeConfig` and re-homes the `CodegenConfig` type.

  `@zod-to-form/cli` patch: `loader.ts` is now a thin re-export over `@zod-to-form/core/loader`. Direct `jiti` dependency removed (now transitive through core's optional peer).

### Patch Changes

- Updated dependencies [[`4718965`](https://github.com/pradeepmouli/zod-to-form/commit/47189652aed00104b1486a4bb7c30ce89cfd3fd0)]:
  - @zod-to-form/core@0.6.5
  - @zod-to-form/codegen@0.6.4
