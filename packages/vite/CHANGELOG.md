# @zod-to-form/vite

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
