import { z } from 'zod';
export const schema = z.object({
  field10: z.string().min(1)
});
