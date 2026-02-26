import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { processDate } from '../../src/processors/date.js';
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

describe('processDate', () => {
  it('maps date to DatePicker', () => {
    const schema = z.date();
    const field = createBaseField('birthDate', 'date');

    processDate(schema, createContext(), field, {});

    expect(field.component).toBe('DatePicker');
  });

  it('keeps required=true for plain dates', () => {
    const schema = z.date();
    const field = createBaseField('eventDate', 'date');

    processDate(schema, createContext(), field, {});

    expect(field.required).toBe(true);
  });
});