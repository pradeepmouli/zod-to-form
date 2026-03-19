import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import type { $ZodType } from 'zod/v4/core';
import {
  processOptional,
  processNullable,
  processDefault,
  processReadonly,
  processPipe
} from '../../src/processors/wrappers.js';
import { createBaseField } from '../../src/utils.js';
import type {
  FormField,
  FormProcessor,
  FormProcessorContext,
  ProcessParams
} from '../../src/types.js';

function createContext(processor: FormProcessor): FormProcessorContext {
  return {
    processors: {
      string: processor,
      number: processor
    },
    path: [],
    seen: new WeakSet(),
    maxDepth: 5,
    currentDepth: 0
  };
}

describe('wrapper processors', () => {
  it('optional sets required=false and unwraps inner type', () => {
    const schema = z.string().optional();
    const field = createBaseField('nickname', 'optional');
    const innerProcessor = vi.fn(
      (
        _schema: $ZodType,
        _ctx: FormProcessorContext,
        target: FormField,
        _params: ProcessParams
      ) => {
        target.component = 'Input';
      }
    );

    processOptional(schema, createContext(innerProcessor), field, {});

    expect(field.required).toBe(false);
    expect(innerProcessor).toHaveBeenCalledTimes(1);
  });

  it('nullable sets required=false and unwraps inner type', () => {
    const schema = z.string().nullable();
    const field = createBaseField('middleName', 'nullable');
    const innerProcessor = vi.fn();

    processNullable(schema, createContext(innerProcessor), field, {});

    expect(field.required).toBe(false);
    expect(innerProcessor).toHaveBeenCalledTimes(1);
  });

  it('default sets defaultValue from schema and unwraps inner type', () => {
    const schema = z.string().default('guest');
    const field = createBaseField('username', 'default');
    const innerProcessor = vi.fn();

    processDefault(schema, createContext(innerProcessor), field, {});

    expect(field.defaultValue).toBe('guest');
    expect(innerProcessor).toHaveBeenCalledTimes(1);
  });

  it('readonly sets readOnly=true and unwraps inner type', () => {
    const schema = z.string().readonly();
    const field = createBaseField('id', 'readonly');
    const innerProcessor = vi.fn();

    processReadonly(schema, createContext(innerProcessor), field, {});

    expect(field.readOnly).toBe(true);
    expect(innerProcessor).toHaveBeenCalledTimes(1);
  });

  it('pipe unwraps input type and processes def.in', () => {
    const schema = z.string().pipe(z.string());
    const field = createBaseField('raw', 'pipe');
    const innerProcessor = vi.fn();

    processPipe(schema, createContext(innerProcessor), field, {});

    expect(innerProcessor).toHaveBeenCalledTimes(1);
    expect(field.zodType).toBe('pipe');
  });
});
