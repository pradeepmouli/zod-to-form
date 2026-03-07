# Quickstart: shadcn Registry Integration

## For Users (After Publishing)

### Runtime Approach — Install `<ZodForm>` via shadcn
```bash
npx shadcn add https://raw.githubusercontent.com/pradeepmouli/zod-to-form/master/public/r/zod-form.json
```

This installs:
- `@zod-to-form/react` and `@zod-to-form/core` as dependencies
- shadcn `field`, `input`, `select`, `checkbox`, `textarea`, `switch` components
- A thin wrapper component that wires `ZodForm` with shadcn primitives

Usage:
```tsx
import { ZodForm } from '@/components/zod-form';
import { z } from 'zod';

const UserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export function UserForm() {
  return <ZodForm schema={UserSchema} onSubmit={(data) => console.log(data)} />;
}
```

### Codegen Approach — Install CLI bootstrapper
```bash
npx shadcn add https://raw.githubusercontent.com/pradeepmouli/zod-to-form/master/public/r/zod-form-cli.json
```

This installs:
- `@zod-to-form/cli` as a devDependency
- A pre-configured `z2f.config.ts` at project root

Then generate forms:
```bash
npx zod-to-form generate --config z2f.config.ts --schema src/schemas/user.ts --export UserSchema
```

## For Developers (Testing During Development)

### Verify `<Field>` migration
```bash
pnpm test                # All tests pass
pnpm run type-check      # Zero errors
pnpm run build           # Successful
```

### Verify registry JSON validity
```bash
# Check JSON syntax
node -e "JSON.parse(require('fs').readFileSync('public/r/zod-form.json', 'utf8'))"
node -e "JSON.parse(require('fs').readFileSync('public/r/zod-form-cli.json', 'utf8'))"
```

### Verify new `<Field>` keys
```bash
# Verify new component map keys are used (old keys removed)
pnpm --filter @zod-to-form/react test -- --grep "Field"
```
