---
"@zod-to-form/core": minor
"@zod-to-form/codegen": patch
"@zod-to-form/react": patch
---

Codegen-generated forms now coerce HTML input values correctly. Generated `register()` calls emit RHF coercion options (`valueAsNumber` for number/bigint, `valueAsDate` for date, `setValueAs` for file) to match the runtime `<ZodForm>` renderer — fixing "Expected number" validation errors when a `z.number()` field is rendered as a numeric input.

The field-to-register-option decision is extracted into a new framework-agnostic `getFieldRegisterHints(field)` helper in `@zod-to-form/core`, consumed by both the runtime renderer and codegen so they can't drift. The React renderer refactor is behavior-preserving.
