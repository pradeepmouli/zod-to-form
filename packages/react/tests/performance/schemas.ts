/**
 * Shared benchmark schemas. Duplicated from core/tests/performance/schemas.ts
 * to avoid cross-project relative imports that break tsconfig project references.
 *
 * Keep in sync with packages/core/tests/performance/schemas.ts
 */
import { z } from 'zod';

// ─── Small Schema (5 fields) ────────────────────────────────────────
export const smallSchema = z.object({
  name: z.string().min(1).max(100),
  age: z.number().min(0).max(150),
  active: z.boolean(),
  role: z.enum(['admin', 'user', 'guest']),
  bio: z.string().optional()
});

// ─── Medium Schema (~18 fields) ─────────────────────────────────────
export const mediumSchema = z.object({
  firstName: z.string(),
  lastName: z.string().min(2).max(50),
  age: z.number().min(0).max(150),
  score: z.coerce.number(),
  isActive: z.boolean(),
  birthDate: z.date(),
  nickname: z.string().optional(),
  bio: z.string().nullable(),
  country: z.string().default('US'),
  role: z.enum(['admin', 'user', 'guest']),
  description: z.string().max(500),
  address: z.object({
    street: z.string(),
    city: z.string(),
    zip: z.string().max(10)
  }),
  tags: z.array(z.string()).min(0).max(10),
  coordinates: z.tuple([z.number(), z.number()]),
  status: z.union([z.literal('active'), z.literal('inactive'), z.literal('pending')]),
  notification: z.discriminatedUnion('type', [
    z.object({ type: z.literal('email'), emailAddress: z.string() }),
    z.object({ type: z.literal('sms'), phoneNumber: z.string() })
  ]),
  profile: z.intersection(
    z.object({ username: z.string() }),
    z.object({ displayName: z.string() })
  ),
  createdAt: z.string().readonly()
});

// ─── Large Schema (~50 fields) ──────────────────────────────────────

const paymentMethodSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('credit_card'),
    cardNumber: z.string().min(16).max(16),
    expiry: z.string(),
    cvv: z.string().min(3).max(4)
  }),
  z.object({
    type: z.literal('bank_transfer'),
    routingNumber: z.string().min(9).max(9),
    accountNumber: z.string().min(8).max(17)
  }),
  z.object({
    type: z.literal('paypal'),
    email: z.string().email()
  })
]);

export const largeSchema = z
  .object({
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    email: z.string().email(),
    phone: z.string().optional(),
    dateOfBirth: z.date(),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
    nationality: z.string().default('US'),
    username: z.string().min(3).max(30),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
    twoFactorEnabled: z.boolean(),
    newsletter: z.boolean(),
    primaryAddress: z.object({
      street: z.string().min(1),
      street2: z.string().optional(),
      city: z.string().min(1),
      state: z.string().min(2).max(2),
      zipCode: z.string().min(5).max(10),
      country: z.string().default('US')
    }),
    shippingAddress: z
      .object({
        street: z.string(),
        street2: z.string().optional(),
        city: z.string(),
        state: z.string(),
        zipCode: z.string(),
        country: z.string()
      })
      .superRefine((data, ctx) => {
        if (data.country === 'US' && !/^\d{5}(-\d{4})?$/.test(data.zipCode)) {
          ctx.addIssue({
            code: 'custom',
            message: 'US zip code must be 5 or 9 digits',
            path: ['zipCode']
          });
        }
      }),
    employment: z.object({
      company: z.string(),
      title: z.string(),
      startDate: z.date(),
      salary: z.number().min(0),
      department: z.enum([
        'engineering',
        'marketing',
        'sales',
        'hr',
        'finance',
        'operations',
        'legal'
      ]),
      remote: z.boolean()
    }),
    paymentMethod: paymentMethodSchema,
    emergencyContacts: z
      .array(
        z.object({
          name: z.string().min(1),
          relationship: z.enum(['spouse', 'parent', 'sibling', 'friend', 'other']),
          phone: z.string(),
          email: z.string().email().optional()
        })
      )
      .min(1)
      .max(5),
    skills: z.array(z.string().min(1)).min(1).max(20),
    preferences: z.object({
      theme: z.enum(['light', 'dark', 'system']),
      language: z.string().default('en'),
      timezone: z.string(),
      pageSize: z.number().min(10).max(100),
      notifications: z.boolean(),
      accessibility: z.boolean()
    }),
    notes: z.string().max(2000).optional(),
    termsAccepted: z.boolean(),
    priority: z.union([
      z.literal('low'),
      z.literal('medium'),
      z.literal('high'),
      z.literal('critical')
    ]),
    tags: z.array(z.string()).max(10),
    referralSource: z.string().optional(),
    marketingConsent: z.boolean()
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'Passwords must match',
        path: ['confirmPassword']
      });
    }
    if (data.termsAccepted !== true) {
      ctx.addIssue({
        code: 'custom',
        message: 'You must accept the terms',
        path: ['termsAccepted']
      });
    }
  });

// ─── Valid data fixtures ────────────────────────────────────────────

export const smallValidData = {
  name: 'Alice',
  age: 30,
  active: true,
  role: 'admin' as const,
  bio: 'A short bio'
};

export const mediumValidData = {
  firstName: 'Alice',
  lastName: 'Smith',
  age: 30,
  score: 95,
  isActive: true,
  birthDate: new Date('1990-01-01'),
  nickname: 'Ali',
  bio: 'A developer',
  country: 'US',
  role: 'admin' as const,
  description: 'Senior engineer',
  address: { street: '123 Main St', city: 'Springfield', zip: '12345' },
  tags: ['typescript', 'react'],
  coordinates: [40.7128, -74.006] as [number, number],
  status: 'active' as const,
  notification: { type: 'email' as const, emailAddress: 'alice@example.com' },
  profile: { username: 'alice', displayName: 'Alice S.' },
  createdAt: '2024-01-01'
};

export const largeValidData = {
  firstName: 'Alice',
  lastName: 'Smith',
  email: 'alice@example.com',
  phone: '+1234567890',
  dateOfBirth: new Date('1990-01-01'),
  gender: 'female' as const,
  nationality: 'US',
  username: 'alicesmith',
  password: 'SecurePass123!',
  confirmPassword: 'SecurePass123!',
  twoFactorEnabled: true,
  newsletter: false,
  primaryAddress: {
    street: '123 Main St',
    street2: 'Apt 4B',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62704',
    country: 'US'
  },
  shippingAddress: {
    street: '456 Oak Ave',
    street2: '',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62704',
    country: 'US'
  },
  employment: {
    company: 'Acme Corp',
    title: 'Senior Engineer',
    startDate: new Date('2020-03-15'),
    salary: 120000,
    department: 'engineering' as const,
    remote: true
  },
  paymentMethod: {
    type: 'credit_card' as const,
    cardNumber: '4111111111111111',
    expiry: '12/28',
    cvv: '123'
  },
  emergencyContacts: [
    {
      name: 'Bob Smith',
      relationship: 'spouse' as const,
      phone: '+1234567891',
      email: 'bob@example.com'
    }
  ],
  skills: ['typescript', 'react', 'node'],
  preferences: {
    theme: 'dark' as const,
    language: 'en',
    timezone: 'America/Chicago',
    pageSize: 25,
    notifications: true,
    accessibility: false
  },
  notes: 'Some notes here',
  termsAccepted: true,
  priority: 'high' as const,
  tags: ['vip', 'beta-tester'],
  referralSource: 'google',
  marketingConsent: true
};
