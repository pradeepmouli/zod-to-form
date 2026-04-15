import { z } from 'zod';
export const schema = z.object({
  field5: z.string().min(1)
});
