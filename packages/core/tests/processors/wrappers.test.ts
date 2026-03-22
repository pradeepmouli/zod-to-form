import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import type { $ZodType } from 'zod/v4/core';
import {
  processOptional,
  processNullable,
  processDefault,
  processReadonly,
  processPipe,
  processLazy
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
    expect(field.zodType).toBe('string');
  });

  it('optional unwraps zodType to inner type', () => {
    const schema = z.string().optional();
    const field = createBaseField('name', 'optional');
    const innerProcessor = vi.fn();

    processOptional(schema, createContext(innerProcessor), field, {});

    expect(field.zodType).toBe('string');
    expect(field.required).toBe(false);
  });

  it('nullable unwraps zodType to inner type', () => {
    const schema = z.number().nullable();
    const field = createBaseField('age', 'nullable');
    const innerProcessor = vi.fn();

    processNullable(schema, createContext(innerProcessor), field, {});

    expect(field.zodType).toBe('number');
    expect(field.required).toBe(false);
  });

  it('default unwraps zodType to inner type', () => {
    const schema = z.string().default('hello');
    const field = createBaseField('greeting', 'default');
    const innerProcessor = vi.fn();

    processDefault(schema, createContext(innerProcessor), field, {});

    expect(field.zodType).toBe('string');
    expect(field.defaultValue).toBe('hello');
  });

  it('default with function default invokes the function', () => {
    const schema = z.string().default(() => 'dynamic');
    const field = createBaseField('val', 'default');
    const innerProcessor = vi.fn();

    processDefault(schema, createContext(innerProcessor), field, {});

    expect(field.defaultValue).toBe('dynamic');
    expect(innerProcessor).toHaveBeenCalledTimes(1);
  });

  it('lazy resolves inner type normally', () => {
    const schema = z.lazy(() => z.string());
    const field = createBaseField('name', 'lazy');
    const innerProcessor = vi.fn(
      (_schema: $ZodType, _ctx: FormProcessorContext, target: FormField) => {
        target.component = 'Input';
      }
    );

    processLazy(schema, createContext(innerProcessor), field, {});

    expect(innerProcessor).toHaveBeenCalledTimes(1);
  });

  it('lazy bails out at max depth', () => {
    const schema = z.lazy(() => z.string());
    const field = createBaseField('deep', 'lazy');
    const innerProcessor = vi.fn();

    const ctx: FormProcessorContext = {
      processors: { string: innerProcessor },
      path: [],
      seen: new WeakSet(),
      maxDepth: 3,
      currentDepth: 3
    };

    processLazy(schema, ctx, field, {});

    expect(innerProcessor).not.toHaveBeenCalled();
    expect(field.component).toBe('Input');
    expect(field.props['type']).toBe('text');
  });

  it('lazy detects cyclic reference via seen set', () => {
    const innerSchema = z.string();
    const schema = z.lazy(() => innerSchema);
    const field = createBaseField('cyclic', 'lazy');
    const innerProcessor = vi.fn();

    const seen = new WeakSet<$ZodType>();
    seen.add(innerSchema);

    const ctx: FormProcessorContext = {
      processors: { string: innerProcessor },
      path: [],
      seen,
      maxDepth: 5,
      currentDepth: 0
    };

    processLazy(schema, ctx, field, {});

    expect(innerProcessor).not.toHaveBeenCalled();
    expect(field.component).toBe('Input');
  });

  it('chained wrappers unwrap to leaf type', () => {
    const schema = z.string().optional().default('foo');
    const field = createBaseField('val', 'default');
    const innerProcessor = vi.fn();

    const ctx: FormProcessorContext = {
      processors: {
        string: innerProcessor,
        number: innerProcessor,
        optional: processOptional
      },
      path: [],
      seen: new WeakSet(),
      maxDepth: 5,
      currentDepth: 0
    };

    processDefault(schema, ctx, field, {});

    expect(field.zodType).toBe('string');
    expect(field.defaultValue).toBe('foo');
    expect(field.required).toBe(false);
  });
});
