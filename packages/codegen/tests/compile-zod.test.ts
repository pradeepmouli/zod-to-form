import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { walkSchema } from '@zod-to-form/core';
import { generateFormComponent } from '../src/generate.js';
const schema = z.object({ name: z.string().refine((value) => value.length > 1, 'too short') });
const config = {
  exportName: 'Schema',
  componentName: 'Form',
  mode: 'submit' as const,
  ui: 'html' as const
};
describe('generated Zod compilation', () => {
  it('hoists compile-only resolver targets outside the component', () => {
    const code = generateFormComponent(walkSchema(schema), {
      ...config,
      optimization: { compileZod: true }
    });
    expect(code).toContain('compile(Schema)');
    expect(code.indexOf('compile(Schema)')).toBeLessThan(code.indexOf('export function Form'));
    expect(code).toContain('zodResolver(_validationSchema)');
  });
  it('compiles actual optimized leaf targets once, preserving messages', () => {
    const result = walkSchema(schema, { optimization: { level: 1 } });
    const code = generateFormComponent(result.fields, {
      ...config,
      optimization: { level: 1, compileZod: true }
    });
    expect(code).toContain('compile(Schema.shape["name"])');
    expect(code).toContain('r.error.issues[0]?.message');
    expect(code).not.toContain('zodResolver');
  });
  it('emits no compiler import or calls when disabled', () => {
    expect(generateFormComponent(walkSchema(schema), config)).not.toMatch(/\bcompile\b/);
  });
});

it.each([false, true])(
  'executes emitted leaf validators with error parity (compile=%s)',
  (compileZod) => {
    const fields = walkSchema(schema, { optimization: { level: 1 } }).fields;
    const code = generateFormComponent(fields, {
      ...config,
      optimization: { level: 1, compileZod }
    });
    const declarations = code
      .split('\n')
      .filter((line) => /^const _(schema|validate)_/.test(line))
      .join('\n')
      .replaceAll(': unknown', '');
    const validate = new Function('Schema', 'compile', `${declarations}; return _validate_name;`)(
      schema,
      z.compile
    );
    expect(validate('valid')).toBe(true);
    expect(validate('x')).toBe('too short');
  }
);
