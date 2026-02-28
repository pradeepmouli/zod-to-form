import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { walkSchema } from '../../src/walker.js';
import type { FormField } from '../../src/types.js';

/**
 * T098 — Full schema integration test.
 * Validates that walkSchema handles every supported Zod type on a 20+ field
 * schema, completes under 10 ms, and produces correct FormField metadata.
 */

const fullSchema = z.object({
  // Primitives
  firstName: z.string(),
  lastName: z.string().min(2).max(50),
  age: z.number().min(0).max(150),
  score: z.coerce.number(),
  isActive: z.boolean(),
  birthDate: z.date(),

  // Optional / nullable / default wrappers
  nickname: z.string().optional(),
  bio: z.string().nullable(),
  country: z.string().default('US'),

  // Enum / select
  role: z.enum(['admin', 'user', 'guest']),

  // Textarea hint via string().max
  description: z.string().max(500),

  // Nested object (Fieldset)
  address: z.object({
    street: z.string(),
    city: z.string(),
    zip: z.string().max(10)
  }),

  // Array field
  tags: z.array(z.string()).min(0).max(10),

  // Tuple field
  coordinates: z.tuple([z.number(), z.number()]),

  // Regular union (literal options → Select)
  status: z.union([z.literal('active'), z.literal('inactive'), z.literal('pending')]),

  // Discriminated union
  notification: z.discriminatedUnion('type', [
    z.object({ type: z.literal('email'), emailAddress: z.string() }),
    z.object({ type: z.literal('sms'), phoneNumber: z.string() })
  ]),

  // Intersection (merged fields)
  profile: z.intersection(
    z.object({ username: z.string() }),
    z.object({ displayName: z.string() })
  ),

  // Readonly wrapper
  createdAt: z.string().readonly()
});

describe('walkSchema — full schema integration (T098)', () => {
  let fields: FormField[];
  let elapsed: number;

  it('completes in under 10ms', () => {
    const start = performance.now();
    fields = walkSchema(fullSchema as never);
    elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(10);
  });

  it('produces a non-empty FormField array', () => {
    fields = fields ?? walkSchema(fullSchema as never);
    expect(fields.length).toBeGreaterThan(0);
  });

  it('maps z.string() to Input component', () => {
    fields = fields ?? walkSchema(fullSchema as never);
    const f = fields.find((x) => x.key === 'firstName');
    expect(f?.component).toBe('Input');
  });

  it('maps z.number() to Input[type=number] with min/max constraints', () => {
    fields = fields ?? walkSchema(fullSchema as never);
    const f = fields.find((x) => x.key === 'age');
    expect(f?.component).toBe('Input');
    expect(f?.props?.['type']).toBe('number');
    expect(f?.constraints?.min).toBe(0);
    expect(f?.constraints?.max).toBe(150);
  });

  it('maps z.boolean() to Checkbox or Switch', () => {
    fields = fields ?? walkSchema(fullSchema as never);
    const f = fields.find((x) => x.key === 'isActive');
    expect(['Checkbox', 'Switch']).toContain(f?.component);
  });

  it('maps z.date() to DatePicker', () => {
    fields = fields ?? walkSchema(fullSchema as never);
    const f = fields.find((x) => x.key === 'birthDate');
    expect(f?.component).toBe('DatePicker');
  });

  it('maps z.enum() to Select with options', () => {
    fields = fields ?? walkSchema(fullSchema as never);
    const f = fields.find((x) => x.key === 'role');
    expect(f?.component).toBe('Select');
    expect(f?.options?.map((o) => o.value)).toEqual(
      expect.arrayContaining(['admin', 'user', 'guest'])
    );
  });

  it('maps z.object() to Fieldset with children', () => {
    fields = fields ?? walkSchema(fullSchema as never);
    const f = fields.find((x) => x.key === 'address');
    expect(f?.component).toBe('Fieldset');
    expect(f?.children?.length).toBeGreaterThanOrEqual(3);
  });

  it('maps z.array() to ArrayField with arrayItem', () => {
    fields = fields ?? walkSchema(fullSchema as never);
    const f = fields.find((x) => x.key === 'tags');
    expect(f?.component).toBe('ArrayField');
    expect(f?.arrayItem).toBeDefined();
  });

  it('maps z.array() min/max to constraints', () => {
    fields = fields ?? walkSchema(fullSchema as never);
    const f = fields.find((x) => x.key === 'tags');
    expect(f?.constraints?.minLength).toBe(0);
    expect(f?.constraints?.maxLength).toBe(10);
  });

  it('maps z.tuple() to Fieldset with ordered children', () => {
    fields = fields ?? walkSchema(fullSchema as never);
    const f = fields.find((x) => x.key === 'coordinates');
    expect(f?.component).toBe('Fieldset');
    expect(f?.children?.length).toBe(2);
  });

  it('maps literal union to Select', () => {
    fields = fields ?? walkSchema(fullSchema as never);
    const f = fields.find((x) => x.key === 'status');
    expect(f?.component).toBe('Select');
    expect(f?.options?.length).toBe(3);
  });

  it('maps discriminated union to Select with _variants prop', () => {
    fields = fields ?? walkSchema(fullSchema as never);
    const f = fields.find((x) => x.key === 'notification');
    expect(f?.component).toBe('Select');
    expect(f?.props?.['_discriminator']).toBe('type');
    expect(f?.props?.['_variants']).toBeDefined();
  });

  it('maps z.intersection() to Fieldset', () => {
    fields = fields ?? walkSchema(fullSchema as never);
    const f = fields.find((x) => x.key === 'profile');
    expect(f?.component).toBe('Fieldset');
    expect(f?.children?.length).toBeGreaterThanOrEqual(2);
  });

  it('infers labels from camelCase keys', () => {
    fields = fields ?? walkSchema(fullSchema as never);
    const f = fields.find((x) => x.key === 'firstName');
    expect(f?.label).toBe('First Name');
  });

  it('applies min/max string length constraints', () => {
    fields = fields ?? walkSchema(fullSchema as never);
    const f = fields.find((x) => x.key === 'lastName');
    expect(f?.constraints?.minLength).toBe(2);
    expect(f?.constraints?.maxLength).toBe(50);
  });

  it('marks optional fields as not required', () => {
    fields = fields ?? walkSchema(fullSchema as never);
    const f = fields.find((x) => x.key === 'nickname');
    expect(f?.required).toBe(false);
  });

  it('covers at least 17 top-level fields (SC-001: all types)', () => {
    fields = fields ?? walkSchema(fullSchema as never);
    expect(fields.length).toBeGreaterThanOrEqual(17);
  });
});
