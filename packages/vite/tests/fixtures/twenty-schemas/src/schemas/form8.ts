import { z } from 'zod';
export const schema = z.object({
  field8: z.string().min(1)
});
