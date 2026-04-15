import { z } from 'zod';
export const schema = z.object({
  field2: z.string().min(1)
});
