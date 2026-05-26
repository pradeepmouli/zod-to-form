---
"@zod-to-form/codegen": patch
---

buildConfigSource now serializes non-controlled component overrides (was dropping entries without `controlled: true`), so generated/regenerated forms use the configured named components for all fields, not just controlled ones.
