import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { processEnum, processLiteral } from '../../src/processors/enum.js';
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

describe('processEnum', () => {
  it('maps z.enum to Select with options', () => {
    const schema = z.enum(['draft', 'published']);
    const field = createBaseField('status', 'enum');

    processEnum(schema, createContext(), field, {});

    expect(field.component).toBe('Select');
    expect(field.options).toEqual([
      { value: 'draft', label: 'Draft' },
      { value: 'published', label: 'Published' }
    ]);
  });

  it('supports native enums', () => {
    enum Priority {
      Low = 'low',
      High = 'high'
    }
    const schema = z.nativeEnum(Priority);
    const field = createBaseField('priority', 'enum');

    processEnum(schema, createContext(), field, {});

    expect(field.component).toBe('Select');
    expect(field.options).toContainEqual({ value: 'low', label: 'Low' });
    expect(field.options).toContainEqual({ value: 'high', label: 'High' });
  });
});

describe('processLiteral', () => {
  it('maps literal to a single read-only option', () => {
    const schema = z.literal('admin');
    const field = createBaseField('role', 'literal');

    processLiteral(schema, createContext(), field, {});

    expect(field.component).toBe('Select');
    expect(field.readOnly).toBe(true);
    expect(field.options).toEqual([{ value: 'admin', label: 'Admin' }]);
  });
});