import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { processBoolean } from '../../src/processors/boolean.js';
import { createBaseField } from '../../src/utils.js';
import type { FormProcessorContext } from '../../src/types.js';

function createContext(): FormProcessorContext {
  return {
    processors: {},
    path: [],
    seen: new WeakSet(),
    maxDepth: 5,
    currentDepth: 0
  };
}

describe('processBoolean', () => {
  it('maps boolean to Checkbox', () => {
    const schema = z.boolean();
    const field = createBaseField('agreeToTerms', 'boolean');

    processBoolean(schema, createContext(), field, {});

    expect(field.component).toBe('Checkbox');
  });

  it('keeps required=true for plain booleans', () => {
    const schema = z.boolean();
    const field = createBaseField('active', 'boolean');

    processBoolean(schema, createContext(), field, {});

    expect(field.required).toBe(true);
  });
});
