import { z } from 'zod';
export const schema = z.object({
  field4: z.string().min(1)
});
