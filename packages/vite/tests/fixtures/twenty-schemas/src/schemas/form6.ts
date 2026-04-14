import { z } from 'zod';
export const schema = z.object({
  field6: z.string().min(1)
});
