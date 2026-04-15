import { z } from 'zod';

export const activeSchema = z.object({
  title: z.string().min(1),
  body: z.string()
});
