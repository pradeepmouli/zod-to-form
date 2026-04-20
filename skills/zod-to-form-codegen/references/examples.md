# Examples

### Runtime — iterate on forms instantly

```bash
pnpm add @zod-to-form/core @zod-to-form/react zod react react-hook-form @hookform/resolvers
```

```tsx
import { z } from 'zod';
import { ZodForm } from '@zod-to-form/react';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(['admin', 'editor', 'viewer']),
});

<ZodForm schema={schema} onSubmit={(data) => save(data)} />
```

Labels inferred from field names. Select rendered for enums. Validation wired automatically. Full type inference on `onSubmit`.

### Codegen — own the output

```bash
pnpm add -D @zod-to-form/cli zod
npx z2f generate --schema src/schemas/signup.ts --export signupSchema --out src/components/
```

Produces `src/components/SignupForm.tsx` — a hand-readable `.tsx` file that imports only `react-hook-form`, `zod`, and your UI components. Inspect it, modify it, commit it. Use `--watch` to regenerate when the schema changes.

| | Runtime `<ZodForm>` | CLI `z2f generate` |
|---|---|---|
| **Use when** | Iterating, dynamic schemas, prototyping | Production forms, full control |
| **Output** | Rendered from schema at runtime | Static `.tsx` file you own |
| **z2f dependency** | `@zod-to-form/react` at runtime | None — generated code is standalone |
| **Validation** | `zodResolver` or AOT optimization | AOT optimization (L1→L2→L3) |

---