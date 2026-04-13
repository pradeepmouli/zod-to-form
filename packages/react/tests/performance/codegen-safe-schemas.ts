/**
 * Simplified schemas for the codegen-vs-runtime benchmark.
 *
 * The main bench schemas (schemas.ts) exercise rich types like tuples,
 * discriminated unions, intersections, and array-of-objects. These hit
 * pre-existing codegen edge cases (tracked separately) — tuple element
 * access, array element templates, and wrapper unwrapping in L2 — that
 * would crash the generated form at mount time.
 *
 * These "codegen-safe" schemas stick to: primitives, enums, plain nested
 * objects, and arrays-of-primitives. Same field counts (5 / ~18 / ~50).
 *
 * Keep in sync with gen-fixtures.ts output names.
 */
import { z } from 'zod';

// ─── Small (5 fields) ───────────────────────────────────────────────

export const smallSafeSchema = z.object({
  name: z.string().min(1).max(100),
  age: z.number().min(0).max(150),
  active: z.boolean(),
  role: z.enum(['admin', 'user', 'guest']),
  bio: z.string().optional()
});

// ─── Medium (~18 fields, all plain nested) ─────────────────────────

export const mediumSafeSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(2).max(50),
  age: z.number().min(0).max(150),
  score: z.number(),
  isActive: z.boolean(),
  birthDate: z.date(),
  nickname: z.string().optional(),
  bio: z.string().max(500),
  country: z.string().default('US'),
  role: z.enum(['admin', 'user', 'guest']),
  description: z.string().max(500),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    zip: z.string().min(5).max(10)
  }),
  status: z.enum(['active', 'inactive', 'pending']),
  username: z.string().min(3).max(30),
  displayName: z.string().min(1).max(50),
  createdAt: z.string()
});

// ─── Large (~50 fields, plain nested objects only) ────────────────

export const largeSafeSchema = z.object({
  // Personal (7)
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  phone: z.string().optional(),
  dateOfBirth: z.date(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
  nationality: z.string().default('US'),

  // Account (5)
  username: z.string().min(3).max(30),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
  twoFactorEnabled: z.boolean(),
  newsletter: z.boolean(),

  // Primary address (6, plain object)
  primaryAddress: z.object({
    street: z.string().min(1),
    street2: z.string(),
    city: z.string().min(1),
    state: z.string().min(2).max(2),
    zipCode: z.string().min(5).max(10),
    country: z.string()
  }),

  // Shipping address (6, plain object — no superRefine)
  shippingAddress: z.object({
    street: z.string(),
    street2: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string()
  }),

  // Employment (6)
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

  // Preferences (6)
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'system']),
    language: z.string().default('en'),
    timezone: z.string(),
    pageSize: z.number().min(10).max(100),
    notifications: z.boolean(),
    accessibility: z.boolean()
  }),

  // Skills (array of primitives, fine for codegen)
  skillsPrimary: z.string(),
  skillsSecondary: z.string(),
  skillsTertiary: z.string(),

  // Notes + terms + metadata (5)
  notes: z.string().max(2000).optional(),
  termsAccepted: z.boolean(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  referralSource: z.string().optional(),
  marketingConsent: z.boolean()
});
