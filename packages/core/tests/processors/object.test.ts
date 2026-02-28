import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { processObject, processIntersection } from '../../src/processors/object.js';
import { processCrossRef } from '../../src/processors/cross-ref.js';
import { createBaseField } from '../../src/utils.js';
import type { FormField, FormProcessorContext } from '../../src/types.js';

function makeProcessChild(
  fields: Record<string, FormField> = {}
): (schema: unknown, key: string) => FormField {
  return (_schema: unknown, key: string) => {
    if (fields[key]) return fields[key];
    return createBaseField(key, 'string');
  };
}

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

describe('processObject', () => {
  it('produces children for each shape key', () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const field = createBaseField('person', 'object');
    const ctx = createContext(makeProcessChild());

    processObject(schema, ctx, field, {});

    expect(field.children).toBeDefined();
    expect(field.children).toHaveLength(2);
    expect(field.children!.map((c) => c.key)).toEqual(['name', 'age']);
  });

  it('uses dot-separated paths for nested keys', () => {
    const schema = z.object({ street: z.string(), city: z.string() });
    const field = createBaseField('address', 'object');
    const ctx = createContext((_s: unknown, key: string) => createBaseField(key, 'string'));

    processObject(schema, ctx, field, { parentKey: 'address' });

    expect(field.children!.map((c) => c.key)).toEqual(['address.street', 'address.city']);
  });

  it('sets component to Fieldset for object fields', () => {
    const schema = z.object({ name: z.string() });
    const field = createBaseField('profile', 'object');
    const ctx = createContext(makeProcessChild());

    processObject(schema, ctx, field, { parentKey: 'profile' });

    expect(field.component).toBe('Fieldset');
  });

  it('without processChild falls back to empty children', () => {
    const schema = z.object({ x: z.string() });
    const field = createBaseField('obj', 'object');
    const ctx = createContext(undefined);

    processObject(schema, ctx, field, { parentKey: 'obj' });

    expect(field.children).toBeDefined();
    expect(field.children!.length).toBe(0);
  });
});

describe('processIntersection', () => {
  it('merges shapes from both sides into children', () => {
    const schema = z.intersection(z.object({ name: z.string() }), z.object({ age: z.number() }));
    const field = createBaseField('merged', 'intersection');
    const ctx = createContext((_s: unknown, key: string) => createBaseField(key, 'string'));

    processIntersection(schema, ctx, field, { parentKey: 'merged' });

    expect(field.children).toBeDefined();
    expect(field.children!.map((c) => c.key)).toContain('merged.name');
    expect(field.children!.map((c) => c.key)).toContain('merged.age');
  });
});

describe('processCrossRef', () => {
  it('emits cross-ref component token and forwards refType from metadata', () => {
    const schema = z.string();
    const field = createBaseField('superType', 'string');

    const formRegistry = z.registry<{ fieldType?: string; props?: Record<string, unknown> }>();
    formRegistry.add(schema, {
      fieldType: 'cross-ref',
      props: { refType: 'Data' }
    });

    const ctx: FormProcessorContext = {
      processors: {},
      formRegistry,
      path: ['superType'],
      seen: new WeakSet(),
      maxDepth: 5,
      currentDepth: 0
    };

    processCrossRef(schema, ctx, field, {});

    expect(field.component).toBe('cross-ref');
    expect(field.props['refType']).toBe('Data');
  });
});
