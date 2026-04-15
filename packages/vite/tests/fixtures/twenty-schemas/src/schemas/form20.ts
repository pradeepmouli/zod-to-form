import { z } from 'zod';
export const schema = z.object({
  field20: z.string().min(1)
});
