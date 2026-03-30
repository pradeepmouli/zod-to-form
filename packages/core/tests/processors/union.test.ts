import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { processUnion, processDiscriminatedUnion } from '../../src/processors/union.js';
import { createBaseField } from '../../src/utils.js';
import type { FormField, FormProcessorContext } from '../../src/types.js';

function createContext(
  processChild?: (schema: unknown, key: string) => FormField
): FormProcessorContext {
  return {
    processors: {},
    path: [],
    seen: new WeakSet(),
    maxDepth: 5,
    currentDepth: 0,
    processChild: processChild as FormProcessorContext['processChild']
  };
}

describe('processUnion (literal union → Select)', () => {
  it('maps a literal union to a Select with options', () => {
    const schema = z.union([z.literal('admin'), z.literal('user')]);
    const field = createBaseField('role', 'union');
    const ctx = createContext();

    processUnion(schema, ctx, field, {});

    expect(field.component).toBe('Select');
    expect(field.options).toHaveLength(2);
    expect(field.options![0]).toMatchObject({ value: 'admin', label: 'Admin' });
    expect(field.options![1]).toMatchObject({ value: 'user', label: 'User' });
  });

  it('produces an option per literal value', () => {
    const schema = z.union([z.literal('a'), z.literal('b'), z.literal('c')]);
    const field = createBaseField('choice', 'union');
    const ctx = createContext();

    processUnion(schema, ctx, field, {});

    expect(field.options).toHaveLength(3);
  });

  it('uses Input as fallback for non-literal unions', () => {
    const schema = z.union([z.string(), z.number()]);
    const field = createBaseField('val', 'union');
    const ctx = createContext();

    processUnion(schema, ctx, field, {});

    expect(field.component).toBe('Input');
  });
});

describe('processDiscriminatedUnion', () => {
  it('maps a discriminated union to a Select for the discriminator key', () => {
    const schema = z.discriminatedUnion('role', [
      z.object({ role: z.literal('admin'), level: z.number() }),
      z.object({ role: z.literal('user'), name: z.string() })
    ]);
    const field = createBaseField('profile', 'discriminated_union');
    const ctx = createContext((_s, key) => createBaseField(key, 'string'));

    processDiscriminatedUnion(schema, ctx, field, {});

    expect(field.component).toBe('Select');
    expect(field.options).toHaveLength(2);
    expect(field.options![0]).toMatchObject({ value: 'admin' });
    expect(field.options![1]).toMatchObject({ value: 'user' });
  });

  it('stores variant children in props._variants', () => {
    const schema = z.discriminatedUnion('role', [
      z.object({ role: z.literal('admin'), level: z.number() }),
      z.object({ role: z.literal('user'), name: z.string() })
    ]);
    const field = createBaseField('profile', 'discriminated_union');
    const ctx = createContext((_s, key) => createBaseField(key, 'string'));

    processDiscriminatedUnion(schema, ctx, field, {});

    const variants = field.props['_variants'] as Record<string, FormField[]>;
    expect(variants).toBeDefined();
    expect(Object.keys(variants)).toContain('admin');
    expect(Object.keys(variants)).toContain('user');
    expect(variants['admin']).toBeInstanceOf(Array);
  });

  it('stores discriminator key in props._discriminator', () => {
    const schema = z.discriminatedUnion('type', [
      z.object({ type: z.literal('a'), x: z.string() }),
      z.object({ type: z.literal('b'), y: z.number() })
    ]);
    const field = createBaseField('item', 'discriminated_union');
    const ctx = createContext((_s, key) => createBaseField(key, 'string'));

    processDiscriminatedUnion(schema, ctx, field, {});

    expect(field.props['_discriminator']).toBe('type');
  });
});
