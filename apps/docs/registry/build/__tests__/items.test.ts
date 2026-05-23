import { describe, it, expect } from 'vitest';
import { walkSchema } from '@zod-to-form/core';
import { schema } from '../../sample/schema.js';

describe('sample schema', () => {
  it('walks to four named fields', () => {
    const fields = walkSchema(schema, {});
    expect(fields.map((f) => f.key)).toEqual(['name', 'email', 'age', 'subscribe']);
  });
});
