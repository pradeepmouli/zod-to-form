import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { processString, processTemplateLiteral } from '../../src/processors/string.js';
import { createBaseField } from '../../src/utils.js';
import type { FormProcessorContext } from '../../src/types.js';
import * as processorExports from '../../src/processors/index.js';

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

  it('sets pattern constraint from .regex()', () => {
    const schema = z.string().regex(/^\d{3}-\d{2}-\d{4}$/, 'Invalid SSN');
    const field = createBaseField('ssn', 'string');

    processString(schema, createContext(), field, {});

    expect(field.constraints.pattern).toBe('^\\d{3}-\\d{2}-\\d{4}$');
    expect(field.props['pattern']).toBe('^\\d{3}-\\d{2}-\\d{4}$');
  });

  it('adds inputMask for a structurally translatable pattern (SSN)', () => {
    const schema = z.string().regex(/^\d{3}-\d{2}-\d{4}$/);
    const field = createBaseField('ssn', 'string');

    processString(schema, createContext(), field, {});

    expect(field.props['inputMask']).toBe('999-99-9999');
  });

  it('adds inputMask for a date pattern dd/mm/yyyy', () => {
    const schema = z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/);
    const field = createBaseField('dob', 'string');

    processString(schema, createContext(), field, {});

    expect(field.props['inputMask']).toBe('99/99/9999');
  });

  it('does not add inputMask for complex patterns like email regex', () => {
    const schema = z.string().regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
    const field = createBaseField('email2', 'string');

    processString(schema, createContext(), field, {});

    expect(field.props['inputMask']).toBeUndefined();
    // pattern constraint still set for validation
    expect(field.constraints.pattern).toBeDefined();
  });

  it('maps z.string().date() (ISO date) to DatePicker with type=date', () => {
    const schema = z.string().date();
    const field = createBaseField('birthday', 'string');

    processString(schema, createContext(), field, {});

    expect(field.component).toBe('DatePicker');
    expect(field.props['type']).toBe('date');
    expect(field.constraints.format).toBe('date');
  });

  it('maps z.string().time() (ISO time) to DatePicker with type=time', () => {
    const schema = z.string().time();
    const field = createBaseField('startTime', 'string');

    processString(schema, createContext(), field, {});

    expect(field.component).toBe('DatePicker');
    expect(field.props['type']).toBe('time');
    expect(field.constraints.format).toBe('time');
  });

  it('maps z.string().datetime() (ISO datetime) to DatePicker with type=datetime-local', () => {
    const schema = z.string().datetime();
    const field = createBaseField('createdAt', 'string');

    processString(schema, createContext(), field, {});

    expect(field.component).toBe('DatePicker');
    expect(field.props['type']).toBe('datetime-local');
    expect(field.constraints.format).toBe('datetime');
  });

  it('respects meta component override for date format', () => {
    const reg = z.registry<{ component?: string }>();
    const schema = z.string().date();
    reg.add(schema, { component: 'CustomDateInput' });

    const field = createBaseField('dob', 'string');
    const ctx = { ...createContext(), formRegistry: reg };

    processString(schema, ctx, field, {});

    expect(field.component).toBe('CustomDateInput');
    expect(field.props['type']).toBe('date');
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

describe('processors entrypoint contract', () => {
  it('exports callable built-in processors', () => {
    expect(typeof processorExports.processString).toBe('function');
    expect(typeof processorExports.processNumber).toBe('function');
    expect(typeof processorExports.processBoolean).toBe('function');
    expect(typeof processorExports.processEnum).toBe('function');
    expect(typeof processorExports.processObject).toBe('function');
    expect(typeof processorExports.processArray).toBe('function');
  });
});
