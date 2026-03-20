export const STARTER_SCHEMA = `const schema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .meta({ title: "Name", examples: ["Jane Doe"] }),
  email: z.string()
    .email("Please enter a valid email")
    .meta({ title: "Email", examples: ["jane@example.com"] }),
  age: z.number()
    .min(18, "Must be at least 18")
    .optional()
    .meta({ title: "Age" }),
  subscribe: z.boolean()
    .default(false)
    .meta({ title: "Subscribe to updates" }),
});

schema;
`;
