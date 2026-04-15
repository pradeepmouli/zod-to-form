import { z } from 'zod';
export const schema = z.object({
  field12: z.string().min(1)
});
