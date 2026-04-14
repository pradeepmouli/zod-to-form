import { z } from 'zod';
export const schema = z.object({
  field9: z.string().min(1)
});
