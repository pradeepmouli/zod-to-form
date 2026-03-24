import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { processSet, processMap } from '../../src/processors/collections.js';
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

describe('processSet', () => {
  it('maps z.set() to ArrayField with value type as item template', () => {
    const schema = z.set(z.string());
    const field = createBaseField('tags', 'set');
    const ctx = createContext((_s, key) => createBaseField(key, 'string'));

    processSet(schema, ctx, field, {});

    expect(field.component).toBe('ArrayField');
    expect(field.arrayItem).toBeDefined();
    expect(field.arrayItem?.key).toBe('0');
    expect(field.arrayItem?.zodType).toBe('string');
  });

  it('handles set without processChild gracefully', () => {
    const schema = z.set(z.number());
    const field = createBaseField('numbers', 'set');
    const ctx = createContext();

    processSet(schema, ctx, field, {});

    expect(field.component).toBe('ArrayField');
    expect(field.arrayItem).toBeUndefined();
  });
});

describe('processMap', () => {
  it('maps z.map() to ArrayField with key-value pair fieldset items', () => {
    const schema = z.map(z.string(), z.number());
    const field = createBaseField('scores', 'map');
    const ctx = createContext((_s, key) => {
      const f = createBaseField(key, 'string');
      return f;
    });

    processMap(schema, ctx, field, {});

    expect(field.component).toBe('ArrayField');
    expect(field.arrayItem).toBeDefined();
    expect(field.arrayItem?.component).toBe('Fieldset');
    expect(field.arrayItem?.children).toHaveLength(2);
    expect(field.arrayItem?.children?.[0]?.label).toBe('Key');
    expect(field.arrayItem?.children?.[1]?.label).toBe('Value');
  });

  it('handles map without processChild gracefully', () => {
    const schema = z.map(z.string(), z.boolean());
    const field = createBaseField('flags', 'map');
    const ctx = createContext();

    processMap(schema, ctx, field, {});

    expect(field.component).toBe('ArrayField');
    expect(field.arrayItem).toBeDefined();
    expect(field.arrayItem?.component).toBe('Fieldset');
    expect(field.arrayItem?.children).toBeUndefined();
  });
});
