import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { processString, processTemplateLiteral } from '../../src/processors/string.js';
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

describe('processString', () => {
  it('maps string to Input text', () => {
    const schema = z.string();
    const field = createBaseField('name', 'string');

    processString(schema, createContext(), field, {});

    expect(field.component).toBe('Input');
    expect(field.props['type']).toBe('text');
    expect(field.zodType).toBe('string');
  });

  it('detects email format', () => {
    const schema = z.string().email();
    const field = createBaseField('email', 'string');

    processString(schema, createContext(), field, {});

    expect(field.props['type']).toBe('email');
    expect(field.constraints.format).toBe('email');
  });

  it('detects url format', () => {
    const schema = z.string().url();
    const field = createBaseField('website', 'string');

    processString(schema, createContext(), field, {});

    expect(field.props['type']).toBe('url');
    expect(field.constraints.format).toBe('url');
  });

  it('extracts minLength and maxLength constraints', () => {
    const schema = z.string().min(3).max(50);
    const field = createBaseField('username', 'string');

    processString(schema, createContext(), field, {});

    expect(field.constraints.minLength).toBe(3);
    expect(field.constraints.maxLength).toBe(50);
  });

  it('preserves required false set by optional wrapper', () => {
    const schema = z.string();
    const field = createBaseField('nickname', 'string');
    field.required = false;

    processString(schema, createContext(), field, {});

    expect(field.required).toBe(false);
  });
});

describe('processTemplateLiteral', () => {
  it('maps template_literal to Input text with zodType template_literal', () => {
    const schema = z.templateLiteral(['id-', z.number()]);
    const field = createBaseField('slug', 'template_literal');

    processTemplateLiteral(schema, createContext(), field, {});

    expect(field.component).toBe('Input');
    expect(field.props['type']).toBe('text');
    expect(field.zodType).toBe('template_literal');
  });
});