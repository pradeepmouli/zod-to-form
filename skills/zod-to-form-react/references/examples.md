# Examples

```tsx
import { z } from 'zod';
import { ZodForm } from '@zod-to-form/react';

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  subscribe: z.boolean().default(false)
});

export function UserForm() {
  return (
    <ZodForm
      schema={userSchema}
      mode='onSubmit'
      onSubmit={(data) => {
        console.log('submitted', data);
      }}
    >
      <button type='submit'>Save</button>
    </ZodForm>
  );
}
```