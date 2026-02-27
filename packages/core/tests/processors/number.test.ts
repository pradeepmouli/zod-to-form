import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { processNumber } from '../../src/processors/number.js';
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

describe('processNumber', () => {
  it('maps number to Input number', () => {
    const schema = z.number();
    const field = createBaseField('age', 'number');

    processNumber(schema, createContext(), field, {});

    expect(field.component).toBe('Input');
    expect(field.props['type']).toBe('number');
  });

  it('extracts min and max constraints', () => {
    const schema = z.number().min(18).max(120);
    const field = createBaseField('age', 'number');

    processNumber(schema, createContext(), field, {});

    expect(field.constraints.min).toBe(18);
    expect(field.constraints.max).toBe(120);
  });

  it('sets step=1 for integer schemas', () => {
    const schema = z.number().int();
    const field = createBaseField('count', 'number');

    processNumber(schema, createContext(), field, {});

    expect(field.constraints.step).toBe(1);
    expect(field.props['step']).toBe(1);
  });
});
