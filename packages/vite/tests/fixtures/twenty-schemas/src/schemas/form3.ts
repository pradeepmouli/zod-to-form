import { z } from 'zod';
export const schema = z.object({
  field3: z.string().min(1)
});
