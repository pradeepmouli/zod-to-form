import type { ExampleSchema } from "../../types/playground.ts";

export const EXAMPLES: ExampleSchema[] = [
  {
    id: "registration-form",
    title: "User Registration",
    description: "Basic registration with string, email, password, and constraints",
    category: "basic",
    tags: ["string", "email", "password", "validation"],
    source: `const schema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(20),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  acceptTerms: z.boolean(),
});

schema;
`,
  },
  {
    id: "settings-page",
    title: "Settings Page",
    description: "Boolean toggles, enums, and optional fields",
    category: "basic",
    tags: ["boolean", "enum", "optional", "default"],
    source: `const schema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  theme: z.enum(["light", "dark", "system"]),
  language: z.enum(["en", "es", "fr", "de", "ja"]),
  emailNotifications: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
  bio: z.string().max(500).optional(),
});

schema;
`,
  },
  {
    id: "contact-form",
    title: "Contact Form",
    description: "Textarea, select, and required fields",
    category: "basic",
    tags: ["string", "textarea", "select", "required"],
    source: `const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  subject: z.enum(["general", "support", "billing", "feedback"]),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

schema;
`,
  },
  {
    id: "nested-address",
    title: "Nested Address",
    description: "Nested objects with address fields",
    category: "advanced",
    tags: ["nested", "object", "optional"],
    source: `const addressSchema = z.object({
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(5, "ZIP code must be at least 5 characters"),
  country: z.enum(["US", "CA", "UK", "AU", "DE"]),
});

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  sameAsBilling: z.boolean().default(true),
});

schema;
`,
  },
  {
    id: "multi-field-wizard",
    title: "Multi-Field Form",
    description: "Complex form with many field types and metadata",
    category: "patterns",
    tags: ["metadata", "sections", "ordering", "complex"],
    source: `const schema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  dateOfBirth: z.string(),
  gender: z.enum(["male", "female", "other", "prefer-not-to-say"]),
  phone: z.string().optional(),
  email: z.string().email(),
  website: z.string().url().optional(),
  experience: z.number().min(0).max(50),
  role: z.enum(["developer", "designer", "manager", "other"]),
  newsletter: z.boolean().default(false),
  notes: z.string().max(1000).optional(),
});

schema;
`,
  },
  {
    id: "login-form",
    title: "Login Form",
    description: "Simple login with email and password",
    category: "basic",
    tags: ["string", "email", "password", "simple"],
    source: `const schema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
});

schema;
`,
  },
  {
    id: "metadata-labels",
    title: "Metadata & Labels",
    description: "Registry annotations for labels, descriptions, placeholders, and component overrides",
    category: "advanced",
    tags: ["metadata", "registry", "labels", "descriptions", "placeholders"],
    source: `const registry = z.globalRegistry;

const schema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  bio: z.string().max(500).optional(),
  role: z.enum(["admin", "editor", "viewer"]),
  notifications: z.boolean().default(true),
});

z.globalRegistry.add(schema.shape.fullName, {
  label: "Full Name",
  description: "Your display name",
  placeholder: "John Doe",
});

z.globalRegistry.add(schema.shape.email, {
  label: "Email Address",
  placeholder: "john@example.com",
});

z.globalRegistry.add(schema.shape.bio, {
  label: "Biography",
  description: "Tell us about yourself",
  placeholder: "I am a...",
});

z.globalRegistry.add(schema.shape.role, {
  label: "User Role",
  description: "Select the permission level",
});

z.globalRegistry.add(schema.shape.notifications, {
  label: "Email Notifications",
  description: "Receive updates via email",
});

schema;
`,
  },
];
