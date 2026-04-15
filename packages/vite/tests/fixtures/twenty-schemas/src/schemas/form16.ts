import { z } from 'zod';
export const schema = z.object({
  field16: z.string().min(1)
});
