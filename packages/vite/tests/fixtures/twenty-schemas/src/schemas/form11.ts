import { z } from 'zod';
export const schema = z.object({
  field11: z.string().min(1)
});
