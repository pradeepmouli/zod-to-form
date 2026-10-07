---
'@zod-to-form/core': minor
'@zod-to-form/react': minor
'@zod-to-form/codegen': minor
'@zod-to-form/cli': minor
'@zod-to-form/vite': minor
---

Unify CLI and Vite configuration under the canonical nested components/defaults/fields/schemas/variants contract. Removed flat plugin options and validationLevel require migration. Add independent defaults.optimization.compileZod with cached finalized validation targets, upgrade to Zod 4.6, preserve authored presets until resolution, and forward optimization through runtime forms and generated modules.
