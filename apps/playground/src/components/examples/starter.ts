export const STARTER_SCHEMA = `const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  age: z.number().min(18, "Must be at least 18").optional(),
  subscribe: z.boolean().default(false),
});

schema;
`;
