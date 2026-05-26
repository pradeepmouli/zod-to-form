---
"@zod-to-form/core": minor
"@zod-to-form/codegen": patch
"@zod-to-form/react": patch
---

Leaf-field rendering is now driven by a shared family of pure, `zodType`-keyed resolvers in `@zod-to-form/core`, so the runtime `<ZodForm>` renderer and codegen-generated components can no longer drift on a field's component props.

New core exports: `resolveBaseProps(field)` (field flags: `id`/`required`/`readOnly`/`disabled` — shared across every field type), `resolveNativeAttrs(field)` (DOM-valid native input attributes: `type`/`minLength`/`maxLength`/`pattern`/`min`/`max`/`step`), `resolveControlMode(field)` (`'register'` vs `'controller'`), and `resolveOptionsProps(field)` (`options` passthrough). Both renderers now compose these instead of hand-assembling props.

This fixes the open divergence where codegen-generated leaf components emitted only `id` (and only `type` among native attrs) while the runtime emitted `required`/`readOnly` and forwarded the native-validation attributes (`minLength`/`min`/etc.). Generated leaf components now emit the same base props and native validation attributes as the runtime. A new codegen parity test asserts generated output materializes the shared resolver composition — including hardcoded checks for `minLength`/`min` — guarding against future drift. The React renderer refactor is DOM-observably behavior-preserving.
