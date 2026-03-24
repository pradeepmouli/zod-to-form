import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { processFallback } from '../../src/processors/fallback.js';
import { processRecord } from '../../src/processors/record.js';
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

describe('processFallback', () => {
  it('maps transform to Input text', () => {
    const schema = z.string().transform((value) => value.toUpperCase());
    const field = createBaseField('transformed', 'pipe');

    processFallback(schema, createContext(), field, {});

    expect(field.component).toBe('Input');
    expect(field.props['type']).toBe('text');
  });

  it('maps custom to Input text', () => {
    const schema = z.custom<string>((value) => typeof value === 'string');
    const field = createBaseField('customField', 'custom');

    processFallback(schema, createContext(), field, {});

    expect(field.component).toBe('Input');
    expect(field.props['type']).toBe('text');
    expect(field.zodType).toBe('custom');
  });

  it('maps any and unknown to Input text', () => {
    const anyField = createBaseField('anyValue', 'any');
    processFallback(z.any(), createContext(), anyField, {});

    const unknownField = createBaseField('unknownValue', 'unknown');
    processFallback(z.unknown(), createContext(), unknownField, {});

    expect(anyField.component).toBe('Input');
    expect(anyField.props['type']).toBe('text');
    expect(unknownField.component).toBe('Input');
    expect(unknownField.props['type']).toBe('text');
  });

  it('maps record to key-value repeater template', () => {
    const schema = z.record(z.string(), z.number());
    const field = createBaseField('scores', 'record');

    processRecord(schema, createContext(), field, {});

    expect(field.component).toBe('Input');
    expect(field.arrayItem).toBeDefined();
  });
});
