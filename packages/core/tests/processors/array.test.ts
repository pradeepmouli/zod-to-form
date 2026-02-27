import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { processArray, processTuple } from '../../src/processors/array.js';
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

describe('processArray', () => {
  it('produces an arrayItem template for the element type', () => {
    const schema = z.array(z.string());
    const field = createBaseField('tags', 'array');
    const ctx = createContext((_s, key) => createBaseField(key, 'string'));

    processArray(schema, ctx, field, { parentKey: 'tags' });

    expect(field.arrayItem).toBeDefined();
    expect(field.arrayItem!.zodType).toBe('string');
  });

  it('sets arrayItem key as parent path with index placeholder', () => {
    const schema = z.array(z.string());
    const field = createBaseField('tags', 'array');
    const ctx = createContext((_s, key) => createBaseField(key, 'string'));

    processArray(schema, ctx, field, { parentKey: 'tags' });

    expect(field.arrayItem!.key).toBe('tags.0');
  });

  it('reads minimum constraint from bag', () => {
    const schema = z.array(z.string()).min(1);
    const field = createBaseField('tags', 'array');
    const ctx = createContext((_s, key) => createBaseField(key, 'string'));

    processArray(schema, ctx, field, { parentKey: 'tags' });

    expect(field.constraints.minLength).toBe(1);
  });

  it('reads maximum constraint from bag', () => {
    const schema = z.array(z.string()).max(5);
    const field = createBaseField('items', 'array');
    const ctx = createContext((_s, key) => createBaseField(key, 'string'));

    processArray(schema, ctx, field, { parentKey: 'items' });

    expect(field.constraints.maxLength).toBe(5);
  });

  it('sets component to ArrayField', () => {
    const schema = z.array(z.string());
    const field = createBaseField('tags', 'array');
    const ctx = createContext((_s, key) => createBaseField(key, 'string'));

    processArray(schema, ctx, field, { parentKey: 'tags' });

    expect(field.component).toBe('ArrayField');
  });

  it('falls back gracefully when processChild is missing', () => {
    const schema = z.array(z.string());
    const field = createBaseField('tags', 'array');
    const ctx = createContext(undefined);

    expect(() => processArray(schema, ctx, field, { parentKey: 'tags' })).not.toThrow();
  });
});

describe('processTuple', () => {
  it('produces children for each tuple item', () => {
    const schema = z.tuple([z.string(), z.number()]);
    const field = createBaseField('pair', 'tuple');
    const ctx = createContext((_s, key) => createBaseField(key, 'string'));

    processTuple(schema, ctx, field, { parentKey: 'pair' });

    expect(field.children).toHaveLength(2);
    const children = field.children!;
    expect(children[0]!.key).toBe('pair.0');
    expect(children[1]!.key).toBe('pair.1');
  });

  it('sets component to Fieldset', () => {
    const schema = z.tuple([z.string()]);
    const field = createBaseField('row', 'tuple');
    const ctx = createContext((_s, key) => createBaseField(key, 'string'));

    processTuple(schema, ctx, field, { parentKey: 'row' });

    expect(field.component).toBe('Fieldset');
  });
});
