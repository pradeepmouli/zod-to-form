import { z } from 'zod';
export const schema = z.object({
  field13: z.string().min(1)
});
