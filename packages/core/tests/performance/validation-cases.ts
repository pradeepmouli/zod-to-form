import { z } from 'zod';
import { safeParse } from 'zod/v4/core';
import { prepareValidationSchema, walkSchema } from '../../src/index.js';
import type { FormField, NativeRules, OptimizationConfig } from '../../src/index.js';
import {
  smallSchema,
  mediumSchema,
  largeSchema,
  smallValidData,
  mediumValidData,
  largeValidData
} from './schemas.js';

export interface ValidationFixture {
  name: string;
  schema: z.ZodObject;
  validInput: Record<string, unknown>;
  invalidInput: Record<string, unknown>;
}
export const fixtures: ValidationFixture[] = [
  {
    name: 'small',
    schema: smallSchema,
    validInput: smallValidData,
    invalidInput: { ...smallValidData, name: '' }
  },
  {
    name: 'medium',
    schema: mediumSchema,
    validInput: mediumValidData,
    invalidInput: { ...mediumValidData, lastName: 'X' }
  },
  {
    name: 'large',
    schema: largeSchema,
    validInput: largeValidData,
    invalidInput: { ...largeValidData, confirmPassword: 'Different123!' }
  }
];
export interface ValidationOutcome {
  valid: boolean;
  message?: string;
  data?: unknown;
}
export interface ValidationCase {
  fields: FormField[];
  run(input: Record<string, unknown>): ValidationOutcome;
}

function nativeMessage(rules: NativeRules, value: unknown): string | undefined {
  if (rules.required && (value === undefined || value === null || value === ''))
    return rules.required;
  if (typeof value === 'number') {
    if (rules.min && value < rules.min.value) return rules.min.message;
    if (rules.max && value > rules.max.value) return rules.max.message;
  }
  if (typeof value === 'string') {
    if (rules.minLength && value.length < rules.minLength.value) return rules.minLength.message;
    if (rules.maxLength && value.length > rules.maxLength.value) return rules.maxLength.message;
    if (rules.pattern) {
      rules.pattern.value.lastIndex = 0;
      if (!rules.pattern.value.test(value)) return rules.pattern.message;
    }
  }
}
function leaves(fields: FormField[]): FormField[] {
  return fields.flatMap((field) => (field.children?.length ? leaves(field.children) : [field]));
}
function valueAt(input: unknown, key: string): unknown {
  return key
    .split('.')
    .reduce<unknown>(
      (value, part) =>
        value && typeof value === 'object' ? (value as Record<string, unknown>)[part] : undefined,
      input
    );
}
function outcome(result: ReturnType<typeof safeParse>): ValidationOutcome {
  return result.success
    ? { valid: true, data: result.data }
    : { valid: false, message: result.error.issues[0]?.message };
}

/** Uses finalized walker targets. Native rules assume normalized, widget-constrained input,
 * as the production L2 path does; this is not a general arbitrary-JSON validator. */
export function createValidationCase(
  fixture: ValidationFixture,
  options: OptimizationConfig
): ValidationCase {
  if (options.level === undefined) {
    const schema = prepareValidationSchema(fixture.schema, options);
    return { fields: [], run: (input) => outcome(safeParse(schema, input)) };
  }
  const walk = walkSchema(fixture.schema, { optimization: { ...options, level: options.level } });
  const fields = leaves(walk.fields);
  return {
    fields,
    run(input) {
      let message: string | undefined;
      for (const field of fields) {
        const value = valueAt(input, field.key);
        if (field.validation?.mode === 'native') {
          const next = nativeMessage(field.validation.rules ?? {}, value);
          message ??= next;
        } else if (field.validation?.mode === 'zodSchema' && field.zodSchema) {
          const result = safeParse(field.zodSchema, value === '' ? undefined : value);
          if (!result.success) message ??= result.error.issues[0]?.message;
        }
      }
      if (walk.schemaLite) {
        const result = safeParse(walk.schemaLite, input);
        if (!result.success) message ??= result.error.issues[0]?.message;
      }
      return message === undefined ? { valid: true, data: input } : { valid: false, message };
    }
  };
}
export function runCase(
  prepared: ValidationCase,
  input: Record<string, unknown>
): ValidationOutcome {
  return prepared.run(input);
}

/** Clone all schema nodes, including children, so setup never hits the preparation cache.
 * Refinement callbacks/check definitions remain the same behavior. Fixtures are acyclic. */
export function freshSchema<T extends z.ZodType>(schema: T): T {
  const cloneValue = (value: unknown): unknown => {
    if (value instanceof z.ZodType) return freshSchema(value);
    if (Array.isArray(value)) return value.map(cloneValue);
    if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
      return Object.fromEntries(
        Object.entries(value).map(([key, child]) => [key, cloneValue(child)])
      );
    }
    return value;
  };
  return z.clone(schema, cloneValue(schema._zod.def) as T['_zod']['def']);
}
