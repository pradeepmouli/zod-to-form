---
'@zod-to-form/core': patch
---

Fix `z.lazy()` processing so self-referential schemas reached through wrapper chains
are marked in the `seen` set before recursion, preventing infinite recursion and
stack overflows in deeply nested or cyclic schema graphs.
