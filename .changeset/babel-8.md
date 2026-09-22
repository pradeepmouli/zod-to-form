---
"@zod-to-form/vite": patch
---

Bump `@babel/parser`, `@babel/traverse`, and `@babel/types` from `^7.29.x` to `^8.0.6` (runtime dependencies — the vite plugin's JSX-scan/codegen path). Removed the now-redundant `@types/babel__traverse` devDependency since `@babel/traverse` 8 ships its own native types.

`@babel/traverse` 8 dropped the `TraverseOptions<S>` generic in favor of `TraverseOptions & Visitor<S>`; updated the local ESM/CJS interop shim (`babel-traverse.ts`) accordingly. No other API changes affected this package. Full workspace build + 1150 tests pass, including the playground app's live build-time exercise of the plugin's babel transform path.
