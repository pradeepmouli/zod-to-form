# Quickstart: zodform

## Installation

```bash
# Core + React runtime
pnpm add @zodform/core @zodform/react

# Peer dependencies (must be installed by the consumer)
pnpm add zod react react-hook-form @hookform/resolvers

# CLI for code generation (optional)
pnpm add -D @zodform/cli
```

## Runtime Form Rendering

### 1. Define a Zod Schema

```typescript
import { z } from "zod";

const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  age: z.number().min(18, "Must be 18 or older").optional(),
  role: z.enum(["admin", "editor", "viewer"]),
  bio: z.string().optional(),
  newsletter: z.boolean().default(false),
});
```

### 2. Render with `<ZodForm>`

```tsx
import { ZodForm } from "@zodform/react";
import { userSchema } from "./schemas/user";

function App() {
  return (
    <ZodForm
      schema={userSchema}
      onSubmit={(data) => {
        // data is typed as z.infer<typeof userSchema>
        console.log(data);
      }}
    >
      <button type="submit">Create User</button>
    </ZodForm>
  );
}
```

This renders a complete form with:
- Text input for `name` and `email`
- Number input for `age` (optional)
- Select dropdown for `role`
- Textarea for `bio` (optional)
- Checkbox for `newsletter`
- Validation errors from the Zod schema

### 3. Customize with Metadata

```typescript
import { z } from "zod";

// Create a form-specific registry
const formRegistry = z.registry<{
  fieldType?: string;
  order?: number;
  hidden?: boolean;
}>();

const userSchema = z.object({
  name: z.string().min(2).meta({ title: "Full Name" }),
  email: z.string().email().meta({ examples: ["alice@example.com"] }),
  bio: z.string().optional(),
  role: z.enum(["admin", "editor", "viewer"]),
});

// Register form-specific hints
formRegistry.register(userSchema.shape.bio, { fieldType: "textarea" });
formRegistry.register(userSchema.shape.role, { order: 1 }); // Show first
```

```tsx
<ZodForm
  schema={userSchema}
  formRegistry={formRegistry}
  onSubmit={handleSubmit}
>
  <button type="submit">Save</button>
</ZodForm>
```

### 4. Use shadcn/ui Components

```tsx
import { ZodForm } from "@zodform/react";
import { shadcnComponentMap } from "@zodform/react/shadcn";

<ZodForm
  schema={userSchema}
  components={shadcnComponentMap}
  onSubmit={handleSubmit}
>
  <button type="submit">Save</button>
</ZodForm>
```

## Build-Time Code Generation

### 1. Generate a Form Component

```bash
npx zodform generate \
  --schema src/schemas/user.ts \
  --export userSchema \
  --out src/components/ \
  --name UserForm
```

This generates `src/components/UserForm.tsx` — a complete form component that:
- Reads like hand-written code
- Has zero runtime dependency on `@zodform/*`
- Imports only from `react-hook-form`, `zod`, and your UI library
- Compiles with `tsc --noEmit` in strict mode

### 2. Generate with Server Action

```bash
npx zodform generate \
  --schema src/schemas/user.ts \
  --export userSchema \
  --server-action
```

This also generates a Next.js server action file with `safeParse()` validation.

### 3. Watch Mode

```bash
npx zodform generate \
  --schema src/schemas/user.ts \
  --export userSchema \
  --watch
```

Regenerates the form component within 1 second of schema file changes.

## Advanced: Nested Objects and Arrays

```typescript
const orderSchema = z.object({
  customer: z.object({
    name: z.string(),
    email: z.string().email(),
  }),
  items: z.array(
    z.object({
      product: z.string(),
      quantity: z.number().min(1),
      price: z.number().min(0),
    })
  ).min(1, "At least one item required"),
});
```

```tsx
<ZodForm schema={orderSchema} onSubmit={handleSubmit}>
  <button type="submit">Place Order</button>
</ZodForm>
```

This renders:
- A "Customer" section with name and email fields
- An "Items" repeater with add/remove controls
- Validation: remove button disabled when only 1 item remains

## Advanced: Discriminated Unions

```typescript
const paymentSchema = z.object({
  method: z.discriminatedUnion("type", [
    z.object({ type: z.literal("credit_card"), cardNumber: z.string(), expiry: z.string() }),
    z.object({ type: z.literal("bank_transfer"), accountNumber: z.string(), routingNumber: z.string() }),
    z.object({ type: z.literal("paypal"), email: z.string().email() }),
  ]),
});
```

Renders a select for "type", then reveals only the fields for the selected variant.
