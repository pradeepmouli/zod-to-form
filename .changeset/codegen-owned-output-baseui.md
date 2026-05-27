---
"@zod-to-form/core": minor
"@zod-to-form/codegen": minor
"@zod-to-form/react": minor
---

Codegen output is now genuinely free of any `@zod-to-form/*` runtime dependency, and the shadcn registry targets shadcn's **Base UI** components.

- **core:** `RHF_FIELD_EXPRESSIONS` is exported and recognizes the `!!field.value` boolean-coercion expression. String `date`/`time`/`datetime` schemas now route to native inputs (`<input type="date|time|datetime-local">`); `z.date()` continues to use a date picker.
- **codegen:** new opt-in `typesModule` config — when set, generated forms `import type { StripIndexSignature } from '<module>'` from an owned module instead of inlining it. The shadcn field-template emits the form-library-agnostic `Field*` family (`Field`/`FieldLabel`/`FieldDescription`/`FieldError`) instead of the deprecated `Form*` family.
- **react:** `<ZodForm>`'s `components` prop type (`ZodFormComponents`) is widened to accept plain function components (e.g. shadcn/Base UI components), not only memoized ones; the runtime resolves the `!!field.value` coercion expression for controlled bindings.
- **registry:** the starters target Base UI; controlled fields use thin owned adapter components (`Checkbox`/`Switch`/`Select`/`RadioGroup`/`DatePicker`) that map RHF's field shape to Base UI; `FormFieldOption`/`StripIndexSignature` are inlined into an owned `types.ts`; the ejected layout is reorganized (`z2f.config.ts` at the project root, `@/components/z2f/` integration layer, neutral `@/lib/example-schema.ts` + `@/components/example-form.tsx` samples).
