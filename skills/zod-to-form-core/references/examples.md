# Examples

```ts
import { z } from 'zod';
import { walkSchema } from '@zod-to-form/core';

const schema = z.object({
  name: z.string().min(1).describe('Your full name'),
  age: z.number().int().min(0),
  newsletter: z.boolean().default(false)
});

const fields = walkSchema(schema);

console.log(fields.map((f) => ({ key: f.key, component: f.component })));
```