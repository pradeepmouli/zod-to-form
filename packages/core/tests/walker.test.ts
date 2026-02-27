import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { walkSchema } from '../src/walker.js';

describe('walkSchema', () => {
  it('returns ordered FormField[] for object schema', () => {
    const schema = z.object({
      firstName: z.string(),
      age: z.number(),
      isActive: z.boolean()
    });

    const fields = walkSchema(schema);

    expect(fields).toHaveLength(3);
    expect(fields.map((field) => field.key)).toEqual(['firstName', 'age', 'isActive']);
  });

  it('falls through to fallback for unknown def.type', () => {
    const schema = z.object({
      computed: z.custom<string>((value) => typeof value === 'string')
    });

    const fields = walkSchema(schema);

    expect(fields).toHaveLength(1);
    expect(fields[0]?.component).toBe('Input');
  });

  it('prevents infinite recursion for cyclical schemas via seen WeakSet', () => {
    type Node = { value: string; next?: Node };
    const nodeSchema: z.ZodType<Node> = z.lazy(() =>
      z.object({
        value: z.string(),
        next: nodeSchema.optional()
      })
    );

    const schema = z.object({ root: nodeSchema });

    expect(() => walkSchema(schema, { maxDepth: 5 })).not.toThrow();
  });
});
