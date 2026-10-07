import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import * as core from '../src/index.js';

describe('validation compilation', () => {
  it('opts in independently of level and caches by original schema identity', () => {
    const prepare = core.prepareValidationSchema;
    expect(prepare).toBeTypeOf('function');
    const schema = z.object({ name: z.string().min(2) });
    expect(prepare(schema)).toBe(schema);
    const compiled = prepare(schema, { compileZod: true });
    expect(compiled).not.toBe(schema);
    expect(prepare(schema, { level: 2, compileZod: true })).toBe(compiled);
    expect(prepare(schema, { compileZod: false })).toBe(schema);
    for (const value of [{ name: 'valid' }, { name: 'x' }]) {
      expect(compiled.safeParse(value)).toEqual(schema.safeParse(value));
    }
  });
  it('preserves transformed data and unsupported async fallback', async () => {
    const prepare = core.prepareValidationSchema;
    expect(prepare).toBeTypeOf('function');
    const transformed = z.string().transform((value) => value.length);
    expect(prepare(transformed, { compileZod: true }).parse('abc')).toBe(3);
    const asyncSchema = z.string().refine(async (value) => value.length > 2);
    expect(await prepare(asyncSchema, { compileZod: true }).safeParseAsync('abc')).toEqual(
      await asyncSchema.safeParseAsync('abc')
    );
  });
});

it('walks original registry identities and compiles only final validation targets', () => {
  const leaf = z.string().refine((value) => value.startsWith('ok'), 'starts with ok');
  const schema = z
    .object({ name: leaf, items: z.array(leaf) })
    .refine((data) => data.name !== 'okbad');
  const registry = z.registry<core.FormMeta>();
  registry.add(leaf, { helpText: 'Original metadata' });
  const result = core.walkSchema(schema, {
    formRegistry: registry,
    optimization: { level: 1, compileZod: true }
  });
  expect(result.fields[0]?.helpText).toBe('Original metadata');
  expect(result.fields[0]?.zodSchema).toBe(
    core.prepareValidationSchema(leaf, { compileZod: true })
  );
  expect(result.schemaLite?.['~standard']).toBeDefined();
  expect(Array.isArray(core.walkSchema(schema, { optimization: { compileZod: true } }))).toBe(true);
});

it('preserves coercion and recursive refusal behavior', () => {
  const schema = z.object({ count: z.coerce.number() });
  expect(
    core.prepareValidationSchema(schema, { compileZod: true }).safeParse({ count: '3' })
  ).toEqual(schema.safeParse({ count: '3' }));
  const recursive: z.ZodType = z.lazy(() => z.object({ children: z.array(recursive).optional() }));
  expect(
    core.prepareValidationSchema(recursive, { compileZod: true }).safeParse({ children: [{}] })
  ).toEqual(recursive.safeParse({ children: [{}] }));
});
