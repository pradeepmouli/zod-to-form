---
"@zod-to-form/react": minor
---

Add `errorDisplay?: 'always' | 'afterTouched'` to `UseZodFormOptions` / `ZodFormProps` / `ZodFormSwitchProps` (default `'always'`, fully backward-compatible). Under `'afterTouched'`, a field's validation error is suppressed from its field template until that field has been touched (blurred) or dirtied (changed) — validation itself is unaffected: `formState.errors`, `isValid`, and `onValueChange` metadata continue reporting the true state regardless of this option. Array-row fields resolve touched/dirty state at the row's own path, so touching one row does not reveal errors on sibling rows.

Enables consumers with live-apply forms (no submit boundary) to keep freshly created objects quiet until the user engages a field, instead of showing every validation error immediately on mount.
