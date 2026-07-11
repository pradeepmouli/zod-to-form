---
"@zod-to-form/vite": patch
---

Fix the ambient `*?z2f` module type to match auto-save mode's actual runtime contract. `Z2FFormProps` only declared a required `onSubmit`, so any consumer using `mode: 'auto-save'` (which calls `onValueChange` on every RHF `watch()` tick instead — there is no submit button in auto-save mode) had no type-safe way to pass `onValueChange` without a TypeScript error, and worse, no compile-time signal that `onSubmit` was never actually going to be called. Both `onSubmit` and `onValueChange` are now optional on `Z2FFormProps`, matching the per-file interface the codegen already emits for real generated components (`packages/codegen/src/generate.ts`).
