import type { ExampleSchema } from '../../types/playground.ts';

export const EXAMPLES: ExampleSchema[] = [
  {
    id: 'registration-form',
    title: 'User Registration',
    description: 'Registration form with labels, placeholders, and validation',
    category: 'basic',
    tags: ['string', 'email', 'password', 'validation', 'meta'],
    source: `const formRegistry = z.registry();

const schema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(20)
    .meta({
      title: "Username",
      description: "Choose a unique username",
      examples: ["johndoe42"],
    }),
  email: z.string()
    .email("Please enter a valid email")
    .meta({
      title: "Email Address",
      examples: ["you@example.com"],
    }),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .meta({ title: "Password" })
    .register(formRegistry, { props: { type: "password" } }),
  confirmPassword: z.string()
    .meta({ title: "Confirm Password" })
    .register(formRegistry, { props: { type: "password" } }),
  acceptTerms: z.boolean()
    .meta({ title: "I accept the terms and conditions" }),
});

({ schema, formRegistry });
`
  },
  {
    id: 'settings-page',
    title: 'Settings Page',
    description: 'Toggles, enums, and optional fields with inline metadata',
    category: 'basic',
    tags: ['boolean', 'enum', 'optional', 'default', 'meta'],
    source: `const schema = z.object({
  displayName: z.string()
    .min(1, "Display name is required")
    .meta({
      title: "Display Name",
      examples: ["Jane Smith"],
    }),
  theme: z.enum(["light", "dark", "system"])
    .meta({
      title: "Theme",
      description: "Choose your preferred appearance",
    }),
  language: z.enum(["en", "es", "fr", "de", "ja"])
    .meta({ title: "Language" }),
  emailNotifications: z.boolean()
    .default(true)
    .meta({
      title: "Email Notifications",
      description: "Receive updates via email",
    }),
  marketingEmails: z.boolean()
    .default(false)
    .meta({
      title: "Marketing Emails",
      description: "Receive promotional content",
    }),
  bio: z.string()
    .max(500)
    .optional()
    .meta({
      title: "Bio",
      description: "Tell us about yourself",
      examples: ["I'm a developer who loves..."],
    }),
});

schema;
`
  },
  {
    id: 'contact-form',
    title: 'Contact Form',
    description: 'Textarea, select, and required fields with descriptions',
    category: 'basic',
    tags: ['string', 'textarea', 'select', 'required', 'meta'],
    source: `const schema = z.object({
  name: z.string()
    .min(2, "Name is required")
    .meta({
      title: "Your Name",
      examples: ["Jane Doe"],
    }),
  email: z.string()
    .email("Valid email required")
    .meta({
      title: "Email",
      examples: ["jane@example.com"],
    }),
  subject: z.enum(["general", "support", "billing", "feedback"])
    .meta({
      title: "Subject",
      description: "What is this regarding?",
    }),
  message: z.string()
    .min(10, "Message must be at least 10 characters")
    .max(2000)
    .meta({
      title: "Message",
      description: "Describe your inquiry in detail",
      examples: ["I'd like to ask about..."],
    }),
  priority: z.enum(["low", "medium", "high"])
    .default("medium")
    .meta({ title: "Priority" }),
});

schema;
`
  },
  {
    id: 'nested-address',
    title: 'Nested Address',
    description: 'Nested objects with address fields and inline metadata',
    category: 'advanced',
    tags: ['nested', 'object', 'optional', 'meta'],
    source: `const addressSchema = z.object({
  street: z.string()
    .min(1, "Street is required")
    .meta({ title: "Street Address", examples: ["123 Main St"] }),
  city: z.string()
    .min(1, "City is required")
    .meta({ title: "City", examples: ["San Francisco"] }),
  state: z.string()
    .min(1, "State is required")
    .meta({ title: "State / Province", examples: ["CA"] }),
  zip: z.string()
    .min(5, "ZIP code must be at least 5 characters")
    .meta({ title: "ZIP / Postal Code", examples: ["94102"] }),
  country: z.enum(["US", "CA", "UK", "AU", "DE"])
    .meta({ title: "Country" }),
});

const schema = z.object({
  firstName: z.string()
    .min(1)
    .meta({ title: "First Name", examples: ["Jane"] }),
  lastName: z.string()
    .min(1)
    .meta({ title: "Last Name", examples: ["Doe"] }),
  email: z.string()
    .email()
    .meta({ title: "Email", examples: ["jane@example.com"] }),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  sameAsBilling: z.boolean()
    .default(true)
    .meta({ title: "Billing address same as shipping" }),
});

schema;
`
  },
  {
    id: 'multi-field-wizard',
    title: 'Multi-Field Form',
    description: 'Complex form showcasing many field types with rich metadata',
    category: 'patterns',
    tags: ['metadata', 'sections', 'ordering', 'complex', 'meta'],
    source: `const schema = z.object({
  firstName: z.string()
    .min(1, "Required")
    .meta({ title: "First Name", examples: ["Jane"] }),
  lastName: z.string()
    .min(1, "Required")
    .meta({ title: "Last Name", examples: ["Doe"] }),
  dateOfBirth: z.string()
    .meta({ title: "Date of Birth", examples: ["1990-01-15"] }),
  gender: z.enum(["male", "female", "other", "prefer-not-to-say"])
    .meta({ title: "Gender" }),
  phone: z.string()
    .optional()
    .meta({ title: "Phone Number", examples: ["+1 (555) 123-4567"] }),
  email: z.string()
    .email()
    .meta({ title: "Email Address", examples: ["jane@company.com"] }),
  website: z.string()
    .url()
    .optional()
    .meta({ title: "Personal Website", examples: ["https://janedoe.dev"] }),
  experience: z.number()
    .min(0)
    .max(50)
    .meta({ title: "Years of Experience" }),
  role: z.enum(["developer", "designer", "manager", "other"])
    .meta({
      title: "Role",
      description: "Your primary role in the organization",
    }),
  newsletter: z.boolean()
    .default(false)
    .meta({
      title: "Subscribe to Newsletter",
      description: "Get weekly updates delivered to your inbox",
    }),
  notes: z.string()
    .max(1000)
    .optional()
    .meta({
      title: "Additional Notes",
      description: "Anything else you'd like us to know",
      examples: ["I'm interested in..."],
    }),
});

schema;
`
  },
  {
    id: 'login-form',
    title: 'Login Form',
    description: 'Simple login with email and password',
    category: 'basic',
    tags: ['string', 'email', 'password', 'simple', 'meta'],
    source: `const formRegistry = z.registry();

const schema = z.object({
  email: z.string()
    .email("Please enter a valid email")
    .meta({ title: "Email", examples: ["you@example.com"] }),
  password: z.string()
    .min(1, "Password is required")
    .meta({ title: "Password" })
    .register(formRegistry, { props: { type: "password" } }),
  rememberMe: z.boolean()
    .default(false)
    .meta({ title: "Remember me" }),
});

({ schema, formRegistry });
`
  },
  {
    id: 'metadata-labels',
    title: 'Metadata & Labels',
    description: 'Using .meta() for labels, descriptions, and placeholders',
    category: 'advanced',
    tags: ['metadata', 'meta', 'labels', 'descriptions', 'placeholders'],
    source: `const schema = z.object({
  fullName: z.string()
    .min(2)
    .meta({
      title: "Full Name",
      description: "Your display name visible to other users",
      examples: ["John Doe"],
    }),
  email: z.string()
    .email()
    .meta({
      title: "Email Address",
      description: "We'll never share your email",
      examples: ["john@example.com"],
    }),
  bio: z.string()
    .max(500)
    .optional()
    .meta({
      title: "Biography",
      description: "Tell us about yourself (max 500 chars)",
      examples: ["I'm a software engineer who loves building..."],
    }),
  role: z.enum(["admin", "editor", "viewer"])
    .meta({
      title: "User Role",
      description: "Determines permission level in the system",
    }),
  notifications: z.boolean()
    .default(true)
    .meta({
      title: "Email Notifications",
      description: "Receive updates when someone mentions you",
    }),
});

schema;
`
  },
  {
    id: 'form-registry',
    title: 'ZodFormRegistry',
    description: 'Using a ZodFormRegistry for component overrides, ordering, and hidden fields',
    category: 'patterns',
    tags: ['registry', 'ZodFormRegistry', 'component', 'order', 'hidden', 'advanced'],
    source: `const formRegistry = z.registry();

const schema = z.object({
  name: z.string()
    .min(2)
    .meta({ title: "Full Name", examples: ["Jane Doe"] })
    .register(formRegistry, { order: 1 }),
  bio: z.string()
    .max(500)
    .optional()
    .meta({
      title: "About Me",
      description: "Share a bit about yourself",
      examples: ["I enjoy building things with code..."],
    })
    .register(formRegistry, { component: "Textarea", order: 3 }),
  email: z.string()
    .email()
    .meta({ title: "Email Address", examples: ["jane@example.com"] })
    .register(formRegistry, { order: 2 }),
  role: z.enum(["admin", "editor", "viewer"])
    .meta({ title: "Role", description: "Permission level" })
    .register(formRegistry, { order: 4 }),
  internalId: z.string()
    .default("auto-generated")
    .meta({ title: "Internal ID" })
    .register(formRegistry, { hidden: true }),
  newsletter: z.boolean()
    .default(false)
    .meta({ title: "Subscribe to newsletter" })
    .register(formRegistry, { order: 5 }),
});

({ schema, formRegistry });
`
  },
  {
    id: 'config-schema-metadata',
    title: 'Config: Schema Metadata',
    description: 'All field config via schema .meta() and .register() — config pane starts empty',
    category: 'patterns',
    tags: ['config', 'metadata', 'registry', 'dogfooding'],
    source: `const formRegistry = z.registry();

const schema = z.object({
  name: z.string()
    .meta({ title: "Full Name", description: "Your legal name" })
    .register(formRegistry, { order: 1 }),
  bio: z.string()
    .meta({ title: "Biography" })
    .register(formRegistry, { component: "Textarea", order: 2 }),
  role: z.enum(["admin", "editor", "viewer"])
    .register(formRegistry, { component: "RadioGroup" }),
});

({ schema, formRegistry });
`
  },
  {
    id: 'config-external',
    title: 'Config: External (z2f.config)',
    description: 'Clean schema — all presentation config via the z2f.config pane',
    category: 'patterns',
    tags: ['config', 'external', 'defineConfig', 'dogfooding'],
    source: `const schema = z.object({
  name: z.string(),
  bio: z.string(),
  role: z.enum(["admin", "editor", "viewer"]),
});

schema;
`
  },
  {
    id: 'config-hybrid',
    title: 'Config: Hybrid',
    description: 'Schema metadata + config pane overrides — config takes precedence',
    category: 'patterns',
    tags: ['config', 'hybrid', 'metadata', 'override', 'dogfooding'],
    source: `const formRegistry = z.registry();

const schema = z.object({
  name: z.string()
    .meta({ title: "Full Name" })
    .register(formRegistry, { order: 1 }),
  bio: z.string()
    .meta({ title: "Biography" }),
  role: z.enum(["admin", "editor", "viewer"]),
});

({ schema, formRegistry });
`
  }
];
